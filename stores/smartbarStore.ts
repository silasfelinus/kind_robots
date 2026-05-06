// /stores/smartbarStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { SmartIcon } from '~/prisma/generated/prisma/client'

export type SmartIconForm = Partial<SmartIcon>

type SmartbarInitializeOptions = {
  force?: boolean
  hydrate?: boolean
  refresh?: boolean
}

const defaultSmartIconIds = [1, 2, 3, 4, 5, 6, 7, 8]
const smartIconsStorageKey = 'smartIcons'
const smartIconFormStorageKey = 'smartIconForm'

function normalizeIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))]
}

function idsToSmartBar(ids: number[]): string {
  return normalizeIds(ids).join(',')
}

function parseSmartBar(raw?: string | null): number[] {
  if (!raw) return []

  return normalizeIds(
    raw
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value)),
  )
}

function sameIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((id, index) => id === b[index])
}

export const useSmartbarStore = defineStore('smartbarStore', () => {
  const icons = ref<SmartIcon[]>([])
  const selectedIcon = ref<SmartIcon | null>(null)
  const iconForm = ref<SmartIconForm>({})

  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchIconsPromise = ref<Promise<SmartIcon[]> | null>(null)
  const saveSmartBarPromise = ref<Promise<void> | null>(null)

  const defaultIconIds = ref<number[]>(defaultSmartIconIds)

  const isEditing = ref(false)
  const swarmMessage = ref('')

  const editableIcons = ref<SmartIcon[]>([])
  const originalIcons = ref<SmartIcon[]>([])
  const dragIndex = ref(-1)

  const userStore = useUserStore()

  const customIconsEnabled = computed(
    () => userStore.user?.customIcons ?? false,
  )

  const smartBarIds = computed(() => parseSmartBar(userStore.user?.smartBar))

  const activeIconIds = computed(() =>
    customIconsEnabled.value && smartBarIds.value.length
      ? smartBarIds.value
      : defaultIconIds.value,
  )

  const activeIcons = computed(() =>
    activeIconIds.value
      .map((id) => icons.value.find((icon) => icon.id === id))
      .filter((icon): icon is SmartIcon => Boolean(icon)),
  )

  const hasChanges = computed(
    () =>
      !sameIds(
        editableIcons.value.map((icon) => icon.id),
        originalIcons.value.map((icon) => icon.id),
      ),
  )

  const iconOptions = computed(() =>
    icons.value.filter((icon) => {
      if (icon.isPublic) return true
      if (!userStore.user) return false
      return icon.userId === userStore.user.id
    }),
  )

  function setLastError(error: unknown, fallback: string) {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function syncToLocalStorage() {
    if (import.meta.server) return

    try {
      localStorage.setItem(smartIconsStorageKey, JSON.stringify(icons.value))
      localStorage.setItem(
        smartIconFormStorageKey,
        JSON.stringify(iconForm.value),
      )
    } catch (error) {
      handleError(error, 'sync smartbar localStorage')
    }
  }

  function hydrateFromLocalStorage() {
    if (import.meta.server) return

    try {
      const savedIcons = localStorage.getItem(smartIconsStorageKey)
      const savedForm = localStorage.getItem(smartIconFormStorageKey)

      if (savedIcons) {
        const parsedIcons = JSON.parse(savedIcons)

        if (Array.isArray(parsedIcons)) {
          icons.value = parsedIcons
        }
      }

      if (savedForm) {
        const parsedForm = JSON.parse(savedForm)

        if (parsedForm && typeof parsedForm === 'object') {
          iconForm.value = parsedForm
        }
      }
    } catch (error) {
      handleError(error, 'hydrate smartbar localStorage')
    }
  }

  function upsertIconLocally(icon: SmartIcon) {
    const index = icons.value.findIndex((existing) => existing.id === icon.id)

    if (index >= 0) {
      icons.value.splice(index, 1, icon)
    } else {
      icons.value.push(icon)
    }

    syncToLocalStorage()
  }

  function removeIconLocally(id: number) {
    icons.value = icons.value.filter((icon) => icon.id !== id)

    if (selectedIcon.value?.id === id) {
      selectedIcon.value = null
      iconForm.value = {}
    }

    editableIcons.value = editableIcons.value.filter((icon) => icon.id !== id)
    originalIcons.value = originalIcons.value.filter((icon) => icon.id !== id)

    syncToLocalStorage()
  }

  async function initialize(
    options: SmartbarInitializeOptions = {},
  ): Promise<void> {
    if (isInitialized.value && !options.force && !options.refresh) return

    if (initializePromise.value && !options.force && !options.refresh) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        loading.value = true
        lastError.value = null

        if (options.hydrate !== false) {
          hydrateFromLocalStorage()
        }

        await fetchIcons(options.force === true || options.refresh === true)

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing smartbar store')
        setLastError(error, 'Failed to initialize smartbar store')
      } finally {
        loading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchIcons(force = false): Promise<SmartIcon[]> {
    if (fetchIconsPromise.value && !force) {
      return fetchIconsPromise.value
    }

    if (!force && icons.value.length) {
      return icons.value
    }

    fetchIconsPromise.value = (async () => {
      try {
        loading.value = true
        lastError.value = null

        const res = await performFetch<SmartIcon[]>('/api/icons')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch icons')
        }

        icons.value = res.data
        syncToLocalStorage()

        return icons.value
      } catch (error) {
        handleError(error, 'fetching icons')
        setLastError(error, 'Failed to fetch icons')
        return icons.value
      } finally {
        loading.value = false
        fetchIconsPromise.value = null
      }
    })()

    return fetchIconsPromise.value
  }

  async function fetchIconById(id: number): Promise<SmartIcon | null> {
    const existing = icons.value.find((icon) => icon.id === id)

    if (existing) {
      return existing
    }

    try {
      const res = await performFetch<SmartIcon>(`/api/icons/${id}`)

      if (res.success && res.data) {
        upsertIconLocally(res.data)
        return res.data
      }

      return null
    } catch (error) {
      handleError(error, 'fetch icon by ID')
      setLastError(error, 'Failed to fetch icon')
      return null
    }
  }

  function patchIconLocally(id: number, updates: Partial<SmartIcon>) {
    const icon = icons.value.find((existing) => existing.id === id)
    if (!icon) return

    Object.assign(icon, updates)

    if (selectedIcon.value?.id === id) {
      selectedIcon.value = { ...selectedIcon.value, ...updates }
      iconForm.value = { ...iconForm.value, ...updates }
    }

    editableIcons.value = editableIcons.value.map((existing) =>
      existing.id === id ? { ...existing, ...updates } : existing,
    )

    originalIcons.value = originalIcons.value.map((existing) =>
      existing.id === id ? { ...existing, ...updates } : existing,
    )

    syncToLocalStorage()
  }

  async function updateIcon(id: number, updates: Partial<SmartIcon>) {
    const previousIcon = icons.value.find((icon) => icon.id === id)

    patchIconLocally(id, updates)
    isSaving.value = true

    try {
      const res = await performFetch<SmartIcon>(`/api/icons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update icon')
      }

      upsertIconLocally(res.data)
      lastError.value = null

      return { success: true, data: res.data }
    } catch (error) {
      if (previousIcon) {
        upsertIconLocally(previousIcon)
      }

      handleError(error, 'updating icon')
      setLastError(error, 'Failed to update icon')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update icon',
      }
    } finally {
      isSaving.value = false
    }
  }

  async function createIcon(payload: Partial<SmartIcon>) {
    isSaving.value = true

    try {
      const res = await performFetch<SmartIcon>('/api/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create icon')
      }

      upsertIconLocally(res.data)
      selectedIcon.value = res.data
      iconForm.value = { ...res.data }
      lastError.value = null

      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'creating icon')
      setLastError(error, 'Failed to create icon')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create icon',
      }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteIcon(id: number) {
    const previousIcons = [...icons.value]

    removeIconLocally(id)
    isSaving.value = true

    try {
      const res = await performFetch(`/api/icons/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Delete failed')
      }

      lastError.value = null
      return true
    } catch (error) {
      icons.value = previousIcons
      syncToLocalStorage()

      handleError(error, 'deleting icon')
      setLastError(error, 'Failed to delete icon')

      return false
    } finally {
      isSaving.value = false
    }
  }

  async function saveIcon() {
    if (!iconForm.value) {
      return { success: false, message: 'No icon form.' }
    }

    return iconForm.value.id
      ? updateIcon(iconForm.value.id, iconForm.value)
      : createIcon(iconForm.value)
  }

  function setIconOrder(ids: number[]) {
    return updateSmartBar(ids)
  }

  async function updateSmartBar(ids: number[]) {
    if (!userStore.user || userStore.user.id === 10) return

    const normalizedIds = normalizeIds(ids)
    const smartBar = idsToSmartBar(normalizedIds)

    if (
      userStore.user.smartBar === smartBar &&
      userStore.user.customIcons === true
    ) {
      return
    }

    if (saveSmartBarPromise.value) {
      await saveSmartBarPromise.value
    }

    saveSmartBarPromise.value = (async () => {
      try {
        await userStore.updateUser({ smartBar, customIcons: true })
        lastError.value = null
      } catch (error) {
        handleError(error, 'saving smartBar')
        setLastError(error, 'Failed to save smartbar')
      } finally {
        saveSmartBarPromise.value = null
      }
    })()

    return saveSmartBarPromise.value
  }

  async function toggleCustomIcons(enabled: boolean) {
    if (!userStore.user || userStore.user.id === 10) return

    if (userStore.user.customIcons === enabled) {
      return
    }

    try {
      await userStore.updateUser({ customIcons: enabled })
      lastError.value = null
    } catch (error) {
      handleError(error, 'toggle customIcons')
      setLastError(error, 'Failed to toggle custom icons')
    }
  }

  function startEdit() {
    isEditing.value = true
    editableIcons.value = [...activeIcons.value]
    originalIcons.value = [...activeIcons.value]
  }

  async function confirmEdit() {
    await setIconOrder(editableIcons.value.map((icon) => icon.id))
    originalIcons.value = [...editableIcons.value]
    isEditing.value = false
  }

  function revertEdit() {
    editableIcons.value = [...originalIcons.value]
    isEditing.value = false
    dragIndex.value = -1
  }

  function startDrag(index: number) {
    dragIndex.value = index
  }

  function dropIcon(index: number) {
    if (dragIndex.value < 0 || dragIndex.value === index) return

    const dragged = editableIcons.value.splice(dragIndex.value, 1)[0]

    if (!dragged) {
      dragIndex.value = -1
      return
    }

    editableIcons.value.splice(index, 0, dragged)
    dragIndex.value = -1
  }

  function toggleEditing() {
    if (isEditing.value) {
      revertEdit()
      return
    }

    startEdit()
  }

  async function addIconToSmartBar(id: number) {
    const ids = normalizeIds([...smartBarIds.value, id])
    await updateSmartBar(ids)
  }

  async function removeIconFromSmartBar(id: number) {
    const ids = smartBarIds.value.filter((existing) => existing !== id)
    await updateSmartBar(ids)
  }

  function selectIcon(iconId: number) {
    const icon = icons.value.find((existing) => existing.id === iconId)

    if (icon) {
      selectedIcon.value = icon
      iconForm.value = { ...icon }
      syncToLocalStorage()
    }
  }

  function deselectIcon() {
    selectedIcon.value = null
    iconForm.value = {}
    syncToLocalStorage()
  }

  function createNewIcon() {
    iconForm.value = {
      title: '',
      type: '',
      designer: '',
      icon: '',
      label: '',
      link: '',
      component: '',
      isPublic: true,
    }

    selectedIcon.value = null
    syncToLocalStorage()
  }

  function removeFromEditableIcons(id: number) {
    editableIcons.value = editableIcons.value.filter((icon) => icon.id !== id)
  }

  return {
    icons,
    selectedIcon,
    iconForm,
    isSaving,
    isInitialized,
    loading,
    lastError,
    defaultIconIds,
    isEditing,
    swarmMessage,
    editableIcons,
    originalIcons,
    dragIndex,
    customIconsEnabled,
    smartBarIds,
    activeIconIds,
    activeIcons,
    iconOptions,
    hasChanges,
    initialize,
    fetchIcons,
    fetchIconById,
    syncToLocalStorage,
    hydrateFromLocalStorage,
    startEdit,
    confirmEdit,
    revertEdit,
    startDrag,
    dropIcon,
    toggleEditing,
    patchIconLocally,
    updateIcon,
    createIcon,
    deleteIcon,
    saveIcon,
    setIconOrder,
    updateSmartBar,
    toggleCustomIcons,
    addIconToSmartBar,
    removeIconFromSmartBar,
    selectIcon,
    deselectIcon,
    createNewIcon,
    removeFromEditableIcons,
  }
})

export type { SmartIcon }

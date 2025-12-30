// /stores/smartbarStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { swarmMessages } from '@/stores/seeds/swarmMessages'
import type { SmartIcon } from '@prisma/client'

export type SmartIconForm = Partial<SmartIcon>

export const useSmartbarStore = defineStore('smartbarStore', () => {
  const icons = ref<SmartIcon[]>([])
  const selectedIcon = ref<SmartIcon | null>(null)
  const iconForm = ref<SmartIconForm>({} as SmartIconForm)

  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const defaultIconIds = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8])

  const isEditing = ref(false)
  const showSwarm = ref(false)
  const swarmMessage = ref('')

  const editableIcons = ref<SmartIcon[]>([])
  const originalIcons = ref<SmartIcon[]>([])
  const dragIndex = ref(-1)

  const userStore = useUserStore()

  const customIconsEnabled = computed(
    (): boolean => userStore.user?.customIcons ?? false,
  )

  const smartBarIds = computed((): number[] => {
    const raw = userStore.user?.smartBar
    return (
      raw
        ?.split(',')
        .map((v: string) => Number(v))
        .filter((n: number) => Number.isFinite(n)) ?? []
    )
  })

  const activeIcons = computed((): SmartIcon[] => {
    const ids: number[] = customIconsEnabled.value
      ? smartBarIds.value
      : defaultIconIds.value
    return ids
      .map((id: number) => icons.value.find((i: SmartIcon) => i.id === id))
      .filter((i): i is SmartIcon => Boolean(i))
  })

  const hasChanges = computed((): boolean => {
    return (
      JSON.stringify(editableIcons.value.map((i: SmartIcon) => i.id)) !==
      JSON.stringify(originalIcons.value.map((i: SmartIcon) => i.id))
    )
  })

  async function initialize() {
    if (isInitialized.value) return
    try {
      const savedIcons = localStorage.getItem('smartIcons')
      const savedForm = localStorage.getItem('smartIconForm')
      if (savedIcons) icons.value = JSON.parse(savedIcons) as SmartIcon[]
      if (savedForm) iconForm.value = JSON.parse(savedForm) as SmartIconForm

      const fetched = await fetchIcons()
      const fetchedIds = new Set<number>(fetched.map((i: SmartIcon) => i.id))
      icons.value = [
        ...icons.value.filter((i: SmartIcon) => !fetchedIds.has(i.id)),
        ...fetched,
      ]

      syncToLocalStorage()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing smartIcon store')
    }
  }

  function syncToLocalStorage() {
    try {
      localStorage.setItem('smartIcons', JSON.stringify(icons.value))
      localStorage.setItem('smartIconForm', JSON.stringify(iconForm.value))
    } catch (e) {
      console.warn('localStorage sync failed:', e)
    }
  }

  function startEdit() {
    isEditing.value = true
    editableIcons.value = [...activeIcons.value]
    originalIcons.value = [...activeIcons.value]
  }

  function confirmEdit() {
    setIconOrder(editableIcons.value.map((i: SmartIcon) => i.id))
    isEditing.value = false
  }

  function revertEdit() {
    editableIcons.value = [...originalIcons.value]
    isEditing.value = false
  }

  function startDrag(index: number) {
    dragIndex.value = index
  }

  function dropIcon(index: number) {
    if (dragIndex.value < 0 || dragIndex.value === index) return
    const dragged = editableIcons.value.splice(dragIndex.value, 1)[0]
    if (!dragged) return
    editableIcons.value.splice(index, 0, dragged)
    dragIndex.value = -1
  }

  function toggleEditing() {
    isEditing.value = !isEditing.value
  }

  function toggleSwarm() {
    showSwarm.value = !showSwarm.value
    if (showSwarm.value) {
      const randomIndex = Math.floor(Math.random() * swarmMessages.length)
      swarmMessage.value = swarmMessages[randomIndex] ?? ''
    }
  }

  async function fetchIcons(): Promise<SmartIcon[]> {
    loading.value = true
    try {
      const res = await performFetch<SmartIcon[]>('/api/icons')
      if (res.success && res.data) {
        icons.value = res.data
        syncToLocalStorage()
        return res.data
      }
      throw new Error(res.message || 'Failed to fetch icons.')
    } catch (e) {
      handleError(e, 'fetching icons')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchIconById(id: number): Promise<SmartIcon | null> {
    try {
      const res = await performFetch<SmartIcon>(`/api/icons/${id}`)
      return res.success ? (res.data ?? null) : null
    } catch (e) {
      handleError(e, 'fetch icon by ID')
      return null
    }
  }

  function patchIconLocally(id: number, updates: Partial<SmartIcon>) {
    const icon = icons.value.find((i: SmartIcon) => i.id === id)
    if (!icon) return
    Object.assign(icon, updates)
    syncToLocalStorage()
  }

  async function updateIcon(id: number, updates: Partial<SmartIcon>) {
    patchIconLocally(id, updates)
    try {
      const res = await performFetch(`/api/icons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.success) throw new Error(res.message || 'Failed to update.')
      return { success: true, data: res.data }
    } catch (e) {
      handleError(e, 'updating icon')
      return { success: false, message: (e as Error).message }
    }
  }

  async function createIcon(payload: Partial<SmartIcon>) {
    try {
      const res = await performFetch('/api/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.success) throw new Error(res.message || 'Failed to create.')
      icons.value.push(res.data as SmartIcon)
      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (e) {
      handleError(e, 'creating icon')
      return { success: false, message: (e as Error).message }
    }
  }

  async function deleteIcon(id: number) {
    icons.value = icons.value.filter((i: SmartIcon) => i.id !== id)
    syncToLocalStorage()
    try {
      const res = await performFetch(`/api/icons/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.message || 'Delete failed.')
      return true
    } catch (e) {
      handleError(e, 'deleting icon')
      return false
    }
  }

  async function saveIcon() {
    const form = iconForm.value
    if (!form) return { success: false, message: 'No icon form.' }

    const id = form.id
    return typeof id === 'number'
      ? await updateIcon(id, form)
      : await createIcon(form)
  }

  async function updateSmartBar(ids: number[]) {
    const user = userStore.user
    if (!user) return
    const smartBar = ids.join(',')
    user.smartBar = smartBar
    user.customIcons = true
    try {
      await userStore.updateUser({ smartBar, customIcons: true })
    } catch (e) {
      handleError(e, 'saving smartBar')
    }
  }

  async function toggleCustomIcons(enabled: boolean) {
    const user = userStore.user
    if (!user) return
    user.customIcons = enabled
    try {
      await userStore.updateUser({ customIcons: enabled })
    } catch (e) {
      handleError(e, 'toggle customIcons')
    }
  }

  function setIconOrder(ids: number[]) {
    updateSmartBar(ids)
  }

  function addIconToSmartBar(id: number) {
    const ids = [...smartBarIds.value, id]
    updateSmartBar(ids)
  }

  function removeIconFromSmartBar(id: number) {
    const ids = smartBarIds.value.filter((existing: number) => existing !== id)
    updateSmartBar(ids)
  }

  function selectIcon(iconId: number) {
    const icon = icons.value.find((i: SmartIcon) => i.id === iconId)
    if (icon) {
      selectedIcon.value = icon
      iconForm.value = { ...icon }
      syncToLocalStorage()
    }
  }

  function deselectIcon() {
    selectedIcon.value = null
    iconForm.value = {} as SmartIconForm
    syncToLocalStorage()
  }

  function createNewIcon() {
    iconForm.value = {
      title: '',
      type: '',
      icon: '',
      label: '',
      link: '',
      component: '',
      isPublic: true,
    } as SmartIconForm
    selectedIcon.value = null
    syncToLocalStorage()
  }

  function removeFromEditableIcons(id: number) {
    editableIcons.value = editableIcons.value.filter(
      (icon: SmartIcon) => icon.id !== id,
    )
  }

  return {
    icons,
    selectedIcon,
    iconForm,
    isSaving,
    isInitialized,
    loading,
    defaultIconIds,
    isEditing,
    showSwarm,
    swarmMessage,
    editableIcons,
    originalIcons,
    dragIndex,
    customIconsEnabled,
    smartBarIds,
    activeIcons,
    hasChanges,
    initialize,
    syncToLocalStorage,
    startEdit,
    confirmEdit,
    revertEdit,
    startDrag,
    dropIcon,
    toggleEditing,
    toggleSwarm,
    fetchIcons,
    fetchIconById,
    patchIconLocally,
    updateIcon,
    createIcon,
    deleteIcon,
    saveIcon,
    updateSmartBar,
    toggleCustomIcons,
    setIconOrder,
    addIconToSmartBar,
    removeIconFromSmartBar,
    selectIcon,
    deselectIcon,
    createNewIcon,
    removeFromEditableIcons,
  }
})

export type { SmartIcon }

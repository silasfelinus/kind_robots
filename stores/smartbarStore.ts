// /stores/smartbarStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { swarmMessages } from '@/stores/seeds/swarmMessages'
import type { SmartIcon } from '@prisma/client'

export interface SmartIconForm extends Partial<SmartIcon> {}

export const useSmartbarStore = defineStore('smartbarStore', () => {
  const icons = ref<SmartIcon[]>([])
  const selectedIcon = ref<SmartIcon | null>(null)
  const iconForm = ref<SmartIconForm>({})
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
    () => userStore.user?.customIcons ?? false,
  )

  const smartBarIds = computed(() => {
    const raw = userStore.user?.smartBar
    return (
      raw
        ?.split(',')
        .map(Number)
        .filter((n) => !isNaN(n)) ?? []
    )
  })

  const activeIcons = computed(() => {
    const ids = customIconsEnabled.value
      ? smartBarIds.value
      : defaultIconIds.value
    return ids
      .map((id) => icons.value.find((i) => i.id === id))
      .filter(Boolean) as SmartIcon[]
  })

  const hasChanges = computed(() => {
    return (
      JSON.stringify(editableIcons.value.map((i) => i.id)) !==
      JSON.stringify(originalIcons.value.map((i) => i.id))
    )
  })

  async function initialize() {
    if (isInitialized.value) return
    try {
      const savedIcons = localStorage.getItem('smartIcons')
      const savedForm = localStorage.getItem('smartIconForm')
      if (savedIcons) icons.value = JSON.parse(savedIcons)
      if (savedForm) iconForm.value = JSON.parse(savedForm)

      const fetched = await fetchIcons()
      const fetchedIds = new Set(fetched.map((i) => i.id))
      icons.value = [
        ...icons.value.filter((i) => !fetchedIds.has(i.id)),
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
    setIconOrder(editableIcons.value.map((i) => i.id))
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
      swarmMessage.value = swarmMessages[randomIndex]
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
    const icon = icons.value.find((i) => i.id === id)
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
        headers: { 'Content-type': 'application/json' },
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
    icons.value = icons.value.filter((i) => i.id !== id)
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
    if (!iconForm.value) return { success: false, message: 'No icon form.' }
    return iconForm.value.id
      ? await updateIcon(iconForm.value.id, iconForm.value)
      : await createIcon(iconForm.value)
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
    const ids = smartBarIds.value.filter((existing) => existing !== id)
    updateSmartBar(ids)
  }

  function selectIcon(iconId: number) {
    const icon = icons.value.find((i) => i.id === iconId)
    if (icon) {
      selectedIcon.value = icon
      iconForm.value = { ...icon }
    }
  }

  function deselectIcon() {
    selectedIcon.value = null
    iconForm.value = {}
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

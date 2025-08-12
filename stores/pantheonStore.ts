import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

export type Pantheon = {
  id: number
  createdAt?: string
  updatedAt?: string
  name: string
  slug?: string | null
  description?: string | null
  isPublic: boolean
  isMature?: boolean
  userId?: number
  coverArtImageId?: number | null
  chatId?: number | null
  names?: string[]
  imageIds?: number[]
  galleryIds?: number[]
  editorIds?: number[]
  tags?: string[] | null
}

export type PantheonForm = Partial<Pantheon>

export const usePantheonStore = defineStore('pantheonStore', () => {
  const items = ref<Pantheon[]>([])
  const selected = ref<Pantheon | null>(null)
  const form = ref<PantheonForm>({
    isPublic: true,
    names: [],
    imageIds: [],
    galleryIds: [],
    editorIds: [],
  })
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const userStore = useUserStore()
  const ownedItems = computed(() =>
    items.value.filter((i) => i.userId === userStore.user?.id),
  )

  function syncLocal() {
    try {
      localStorage.setItem('pantheons', JSON.stringify(items.value))
      localStorage.setItem('pantheonForm', JSON.stringify(form.value))
    } catch (e) {
      console.error('[pantheonStore] localStorage error:', e)
    }
  }

  async function initialize() {
    if (isInitialized.value) return
    try {
      const localItems = localStorage.getItem('pantheons')
      const localForm = localStorage.getItem('pantheonForm')
      if (localItems) items.value = JSON.parse(localItems)
      if (localForm) form.value = JSON.parse(localForm)

      const fetched = await fetchAll()
      const fetchedIds = new Set(fetched.map((i) => i.id))
      items.value = [
        ...items.value.filter((i) => !fetchedIds.has(i.id)),
        ...fetched,
      ]

      syncLocal()
      isInitialized.value = true
    } catch (e) {
      handleError(e, 'initializing pantheon store')
    }
  }

  async function fetchAll(): Promise<Pantheon[]> {
    loading.value = true
    try {
      const res = await performFetch<Pantheon[]>('/api/pantheon')
      if (res.success && res.data) {
        items.value = res.data
        syncLocal()
        return res.data
      }
      throw new Error(res.message || 'Failed to fetch pantheon')
    } catch (e) {
      handleError(e, 'fetching pantheon list')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number): Promise<Pantheon | null> {
    try {
      const res = await performFetch<Pantheon>(`/api/pantheon/${id}`)
      if (res.success && res.data) return res.data
      throw new Error(res.message)
    } catch (e) {
      handleError(e, 'fetching pantheon by id')
      return null
    }
  }

  async function create(payload: PantheonForm) {
    isSaving.value = true
    try {
      const res = await performFetch<Pantheon>('/api/pantheon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to create pantheon')
      items.value.push(res.data) // res.data is Pantheon here
      form.value = { ...res.data } // OK to assign to PantheonForm
      syncLocal()
      return { success: true, data: res.data }
    } catch (e) {
      handleError(e, 'creating pantheon')
      return { success: false, message: (e as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: number, updates: PantheonForm) {
    isSaving.value = true
    try {
      const res = await performFetch<Pantheon>(`/api/pantheon/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to update pantheon')
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = res.data
      form.value = { ...res.data }
      syncLocal()
      return { success: true, data: res.data }
    } catch (e) {
      handleError(e, 'updating pantheon')
      return { success: false, message: (e as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function remove(id: number) {
    try {
      const res = await performFetch(`/api/pantheon/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        items.value = items.value.filter((i) => i.id !== id)
        if (selected.value?.id === id) deselect()
        syncLocal()
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      handleError(e, 'deleting pantheon')
    }
  }

  function select(id: number) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      selected.value = item
      form.value = { ...item }
    }
  }
  function deselect() {
    selected.value = null
    form.value = {
      isPublic: true,
      names: [],
      imageIds: [],
      galleryIds: [],
      editorIds: [],
    }
  }

  async function save() {
    if (!form.value) return { success: false, message: 'No form' }
    if (form.value.id) return update(form.value.id, form.value)
    return create(form.value)
  }

  return {
    items,
    selected,
    form,
    isSaving,
    isInitialized,
    loading,
    ownedItems,
    initialize,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    select,
    deselect,
    save,
    syncLocal,
  }
})

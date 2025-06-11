// /stores/blueprintStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Blueprint, SupportedModel } from '@prisma/client'

export interface BlueprintForm extends Partial<Blueprint> {
  coverArtId?: number | null
  tags?: number[]
  steps?: any
  designer?: string
}

export const useBlueprintStore = defineStore('blueprintStore', () => {
  const items = ref<Blueprint[]>([])
  const selectedItem = ref<Blueprint | null>(null)
  const form = ref<BlueprintForm>({} as BlueprintForm)
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const ownedItems = computed(() => {
    const user = useUserStore().user
    return items.value.filter((b) => b.userId === user?.id)
  })

  async function initialize() {
    if (isInitialized.value) return
    try {
      const localItems = localStorage.getItem('blueprints')
      const localForm = localStorage.getItem('blueprintForm')
      if (localItems) items.value = JSON.parse(localItems)
      if (localForm) form.value = JSON.parse(localForm)

      const fetched = await fetchAll()
      const fetchedIds = new Set(fetched.map((b) => b.id))
      items.value = [
        ...items.value.filter((b) => !fetchedIds.has(b.id)),
        ...fetched,
      ]

      syncToLocalStorage()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing blueprint store')
    }
  }

  function syncToLocalStorage() {
    try {
      localStorage.setItem('blueprints', JSON.stringify(items.value))
      localStorage.setItem('blueprintForm', JSON.stringify(form.value))
    } catch (error) {
      console.error('[blueprintStore] localStorage sync error:', error)
    }
  }

  async function fetchAll(): Promise<Blueprint[]> {
    loading.value = true
    try {
      const res = await performFetch<Blueprint[]>('/api/blueprints')
      if (res.success && res.data) {
        items.value = res.data
        syncToLocalStorage()
        return items.value
      } else {
        throw new Error(res.message || 'Failed to fetch blueprints')
      }
    } catch (error) {
      handleError(error, 'fetching blueprints')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number): Promise<Blueprint | null> {
    try {
      const res = await performFetch<Blueprint>(`/api/blueprints/${id}`)
      if (res.success && res.data) return res.data
      throw new Error(res.message)
    } catch (error) {
      handleError(error, 'fetching blueprint by ID')
      return null
    }
  }

  async function create(payload: Partial<BlueprintForm>) {
    isSaving.value = true
    try {
      const res = await performFetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success) throw new Error(res.message)
      items.value.push(res.data as Blueprint)
      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'creating blueprint')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: number, updates: Partial<BlueprintForm>) {
    isSaving.value = true
    try {
      const res = await performFetch(`/api/blueprints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.success) throw new Error(res.message)
      const index = items.value.findIndex((b) => b.id === id)
      if (index !== -1) items.value[index] = res.data as Blueprint
      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'updating blueprint')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function remove(id: number) {
    try {
      const res = await performFetch(`/api/blueprints/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        items.value = items.value.filter((b) => b.id !== id)
        if (selectedItem.value?.id === id) deselect()
        syncToLocalStorage()
      } else {
        throw new Error(res.message)
      }
    } catch (error) {
      handleError(error, 'deleting blueprint')
    }
  }

  function select(id: number) {
    const item = items.value.find((b) => b.id === id)
    if (item) {
      selectedItem.value = item
      form.value = {
        ...item,
        coverArtId: item.coverArtId ?? undefined,
        tags: [],
        steps: item.steps ?? [],
      }
    }
  }

  function deselect() {
    selectedItem.value = null
    form.value = {} as BlueprintForm
  }

  function createNew() {
    form.value = {
      title: '',
      description: '',
      steps: [],
      tags: [],
      coverArtId: null,
      isPublic: true,
      isMature: false,
    }
    selectedItem.value = null
    syncToLocalStorage()
  }

  async function save() {
    if (!form.value) return { success: false, message: 'No form loaded.' }

    isSaving.value = true
    try {
      if (form.value.id) {
        return await update(form.value.id, form.value)
      } else {
        return await create(form.value)
      }
    } catch (error) {
      handleError(error, 'saving blueprint')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    selectedItem,
    form,
    isSaving,
    isInitialized,
    loading,
    ownedItems,
    initialize,
    syncToLocalStorage,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    select,
    deselect,
    createNew,
    save,
  }
})

export type { Blueprint, SupportedModel }

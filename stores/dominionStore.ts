// /stores/dominionStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Dominion } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'

const isClient = typeof window !== 'undefined'

function parseJson<T>(key: string, fallback: T): T {
  if (!isClient) return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const useDominionStore = defineStore('dominionStore', () => {
  const items = ref<Dominion[]>([])
  const selected = ref<Dominion | null>(null)
  const form = ref<Partial<Dominion>>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<void> | null>(null)
  const hasLoaded = ref(false)

  function initialize(): Promise<void> | void {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      loading.value = true

      try {
        items.value = parseJson<Dominion[]>('dominions', [])
        form.value = parseJson<Partial<Dominion>>('dominionForm', {})

        await fetchDominions()
        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing dominion store')
        isInitialized.value = false
      } finally {
        loading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function syncToLocalStorage() {
    if (!isClient) return

    localStorage.setItem('dominions', JSON.stringify(items.value))
    localStorage.setItem('dominionForm', JSON.stringify(form.value))
  }

  async function fetchDominions(force = false): Promise<void> {
    if (!force && hasLoaded.value) return
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        const response = await performFetch<Dominion[]>('/api/dominions')

        if (response.success && response.data) {
          items.value = response.data
          hasLoaded.value = true
          syncToLocalStorage()
          return
        }

        throw new Error(response.message || 'Failed to fetch dominions')
      } catch (error) {
        handleError(error, 'fetching dominions')
        hasLoaded.value = false
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  function select(id: number) {
    const found = items.value.find((item: Dominion) => item.id === id)
    if (!found) return

    selected.value = found
    form.value = { ...found }
    syncToLocalStorage()
  }

  function deselect() {
    selected.value = null
    form.value = {}
    syncToLocalStorage()
  }

  async function save() {
    isSaving.value = true

    try {
      const data = { ...form.value }

      const result = data.id
        ? await update(data.id as number, data)
        : await create(data)

      if (!result.success) {
        return result
      }

      syncToLocalStorage()
      return { success: true }
    } catch (error) {
      handleError(error, 'saving dominion')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function create(dominion: Partial<Dominion>) {
    try {
      const response = await performFetch<Dominion>('/api/dominions', {
        method: 'POST',
        body: JSON.stringify(dominion),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        items.value.push(response.data)
        selected.value = response.data
        form.value = { ...response.data }
        syncToLocalStorage()
        return { success: true, data: response.data }
      }

      throw new Error(response.message || 'Failed to create dominion')
    } catch (error) {
      handleError(error, 'creating dominion')
      return { success: false, message: (error as Error).message }
    }
  }

  async function update(id: number, updates: Partial<Dominion>) {
    try {
      const response = await performFetch<Dominion>(`/api/dominions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        const index = items.value.findIndex((item: Dominion) => item.id === id)
        if (index !== -1) items.value[index] = response.data

        selected.value = response.data
        form.value = { ...response.data }
        syncToLocalStorage()
        return { success: true, data: response.data }
      }

      throw new Error(response.message || 'Failed to update dominion')
    } catch (error) {
      handleError(error, 'updating dominion')
      return { success: false, message: (error as Error).message }
    }
  }

  async function remove(id: number) {
    try {
      const response = await performFetch(`/api/dominions/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        items.value = items.value.filter((item: Dominion) => item.id !== id)

        if (selected.value?.id === id) {
          selected.value = null
          form.value = {}
        }

        syncToLocalStorage()
        return { success: true }
      }

      throw new Error(response.message || 'Failed to delete dominion')
    } catch (error) {
      handleError(error, 'deleting dominion')
      return { success: false, message: (error as Error).message }
    }
  }

  function updateField<K extends keyof Dominion>(field: K, value: Dominion[K]) {
    if (selected.value) {
      selected.value[field] = value
      form.value[field] = value
    } else {
      form.value[field] = value as Partial<Dominion>[K]
    }
  }

  return {
    items,
    selected,
    form,
    isSaving,
    isInitialized,
    loading,
    initializePromise,
    fetchPromise,
    hasLoaded,
    initialize,
    fetchDominions,
    syncToLocalStorage,
    select,
    deselect,
    save,
    create,
    update,
    remove,
    updateField,
  }
})

export type { Dominion }

// /stores/dominionStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Dominion } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'

function parseJson<T>(key: string, fallback: T): T {
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

  async function initialize() {
    if (isInitialized.value) return
    loading.value = true
    try {
      items.value = parseJson<Dominion[]>('dominions', [])
      form.value = parseJson<Partial<Dominion>>('dominionForm', {})

      await fetchDominions()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing dominion store')
    } finally {
      loading.value = false
    }
  }

  function syncToLocalStorage() {
    localStorage.setItem('dominions', JSON.stringify(items.value))
    localStorage.setItem('dominionForm', JSON.stringify(form.value))
  }

  async function fetchDominions() {
    loading.value = true
    try {
      const response = await performFetch<Dominion[]>('/api/dominions')
      if (response.success && response.data) {
        items.value = response.data
        syncToLocalStorage()
      } else {
        throw new Error(response.message || 'Failed to fetch dominions')
      }
    } catch (error) {
      handleError(error, 'fetching dominions')
    } finally {
      loading.value = false
    }
  }

  async function select(id: number) {
    const found = items.value.find((x: Dominion) => x.id === id)
    if (!found) return
    selected.value = found
    form.value = { ...found }
  }

  function deselect() {
    selected.value = null
    form.value = {}
  }

  async function save() {
    isSaving.value = true
    try {
      const data = { ...form.value }
      if (data.id) await update(data.id as number, data)
      else await create(data)
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
      }
    } catch (error) {
      handleError(error, 'creating dominion')
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
        const index = items.value.findIndex((x: Dominion) => x.id === id)
        if (index !== -1) items.value[index] = response.data
        selected.value = response.data
      }
    } catch (error) {
      handleError(error, 'updating dominion')
    }
  }

  async function remove(id: number) {
    try {
      const response = await performFetch(`/api/dominions/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        items.value = items.value.filter((x: Dominion) => x.id !== id)
        if (selected.value?.id === id) selected.value = null
        syncToLocalStorage()
      }
    } catch (error) {
      handleError(error, 'deleting dominion')
    }
  }

  function updateField<K extends keyof Dominion>(field: K, value: Dominion[K]) {
    if (selected.value) {
      // mutate selected to keep UI reactive in detail view
      ;(selected.value[field] as Dominion[K]) = value
    } else {
      form.value[field] = value as any
    }
  }

  return {
    items,
    selected,
    form,
    isSaving,
    isInitialized,
    loading,
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

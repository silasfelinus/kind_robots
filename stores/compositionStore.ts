// @ts-nocheck
/* eslint-disable */
// test-ignore

// /stores/compositionStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Composition } from '~/prisma/generated/prisma/client'

export type CompositionMode = 'narrative' | 'art' | 'both'

export interface CompositionForm extends Partial<Composition> {
  mode?: CompositionMode
}

export const useCompositionStore = defineStore('compositionStore', () => {
  const items = ref<Composition[]>([])
  const selected = ref<Composition | null>(null)
  const form = ref<CompositionForm>({})
  const isSaving = ref(false)
  const isSynthesizing = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const userStore = useUserStore()

  const ownedItems = computed(() =>
    items.value.filter((i) => i.userId === userStore.user?.id),
  )

  const selectedModel = computed(() => selected.value)

  function syncToLocalStorage() {
    try {
      localStorage.setItem('compositions', JSON.stringify(items.value))
      localStorage.setItem('compositionForm', JSON.stringify(form.value))
    } catch (err) {
      console.error('[compositionStore] localStorage sync error:', err)
    }
  }

  async function initialize(
    options: { force?: boolean; fetchRemote?: boolean } = {},
  ) {
    if (isInitialized.value && !options.force) return

    error.value = null

    try {
      const localItems = localStorage.getItem('compositions')
      const localForm = localStorage.getItem('compositionForm')

      if (localItems) items.value = JSON.parse(localItems)
      if (localForm) form.value = JSON.parse(localForm)

      if (options.fetchRemote !== false) {
        const fetched = await fetchAllModels()
        const fetchedIds = new Set(fetched.map((i) => i.id))
        items.value = [
          ...items.value.filter((i) => !fetchedIds.has(i.id)),
          ...fetched,
        ]
        syncToLocalStorage()
      }

      isInitialized.value = true
    } catch (err) {
      handleError(err, 'initializing compositionStore')
      error.value = err instanceof Error ? err.message : 'Failed to initialize.'
    }
  }

  async function fetchAllModels(): Promise<Composition[]> {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch<Composition[]>('/api/compositions')
      if (res.success && res.data) {
        items.value = res.data
        syncToLocalStorage()
        return res.data
      }
      throw new Error(res.message || 'Failed to fetch compositions')
    } catch (err) {
      handleError(err, 'fetching compositions')
      error.value = err instanceof Error ? err.message : 'Fetch failed.'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchModelById(id: number): Promise<Composition | null> {
    try {
      const res = await performFetch<Composition>(`/api/compositions/${id}`)
      if (res.success && res.data) return res.data
      throw new Error(res.message)
    } catch (err) {
      handleError(err, 'fetching composition by ID')
      return null
    }
  }

  async function addModel(payload: Partial<Composition>) {
    isSaving.value = true
    error.value = null
    try {
      const res = await performFetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.success) throw new Error(res.message)
      items.value.push(res.data)
      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'creating composition')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updateModel(id: number, updates: Partial<Composition>) {
    isSaving.value = true
    error.value = null
    try {
      const res = await performFetch(`/api/compositions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.success) throw new Error(res.message)

      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) items.value[index] = res.data
      if (selected.value?.id === id) selected.value = res.data

      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'updating composition')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteModel(id: number) {
    error.value = null
    try {
      const res = await performFetch(`/api/compositions/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        items.value = items.value.filter((i) => i.id !== id)
        if (selected.value?.id === id) deselectModel()
        syncToLocalStorage()
        return { success: true }
      }
      throw new Error(res.message)
    } catch (err) {
      handleError(err, 'deleting composition')
      return { success: false, message: (err as Error).message }
    }
  }

  // ── Synthesize: save outputs back to the record ──────────────────────────
  async function saveSynthesisOutputs(
    id: number,
    outputs: { narrativeText?: string; artPrompt?: string },
  ) {
    isSynthesizing.value = true
    error.value = null
    try {
      const res = await performFetch(`/api/compositions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outputs),
      })
      if (!res.success) throw new Error(res.message)

      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) items.value[index] = res.data
      if (selected.value?.id === id) selected.value = res.data

      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'saving synthesis outputs')
      error.value =
        err instanceof Error ? err.message : 'Failed to save outputs.'
      return { success: false, message: (err as Error).message }
    } finally {
      isSynthesizing.value = false
    }
  }

  function selectModel(id: number) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      selected.value = item
      form.value = { ...item }
    }
  }

  function deselectModel() {
    selected.value = null
    form.value = {}
  }

  function startAddingModel() {
    form.value = {
      title: '',
      mode: 'both',
      isPublic: true,
      isMature: false,
      userId: userStore.userId || 10,
    }
    selected.value = null
  }

  async function startEditingModel(id: number): Promise<Composition | null> {
    const item =
      items.value.find((i) => i.id === id) ?? (await fetchModelById(id))
    if (!item) return null
    selected.value = item
    form.value = { ...item }
    return item
  }

  function toModelForm(item: Composition): CompositionForm {
    return { ...item }
  }

  async function saveModel() {
    if (!form.value) return { success: false, message: 'No form loaded.' }
    isSaving.value = true
    try {
      if ('id' in form.value && form.value.id) {
        return await updateModel(form.value.id, form.value)
      }
      return await addModel(form.value)
    } catch (err) {
      handleError(err, 'saving composition')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    selected,
    selectedModel,
    form,
    isSaving,
    isSynthesizing,
    isInitialized,
    loading,
    error,
    ownedItems,
    initialize,
    fetchAllModels,
    fetchModelById,
    addModel,
    updateModel,
    deleteModel,
    saveSynthesisOutputs,
    selectModel,
    deselectModel,
    startAddingModel,
    startEditingModel,
    toModelForm,
    saveModel,
    syncToLocalStorage,
  }
})

export type { Composition }

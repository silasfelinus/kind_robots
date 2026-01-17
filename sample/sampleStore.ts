// @ts-nocheck
/* eslint-disable */
// test-ignore

// /stores/sampleModelStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { SampleModel } from '~/prisma/generated/prisma/client'

export interface SampleModelForm extends Partial<SampleModel> {}

export const useSampleModelStore = defineStore('sampleModelStore', () => {
  const items = ref<SampleModel[]>([])
  const selected = ref<SampleModel | null>(null)
  const form = ref<SampleModelForm>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const userStore = useUserStore()

  const ownedItems = computed(() =>
    items.value.filter((i) => i.userId === userStore.user?.id),
  )

  function syncToLocalStorage() {
    try {
      localStorage.setItem('sampleModels', JSON.stringify(items.value))
      localStorage.setItem('sampleModelForm', JSON.stringify(form.value))
    } catch (error) {
      console.error('[sampleModelStore] localStorage sync error:', error)
    }
  }

  async function initialize() {
    if (isInitialized.value) return

    try {
      const localItems = localStorage.getItem('sampleModels')
      const localForm = localStorage.getItem('sampleModelForm')

      if (localItems) items.value = JSON.parse(localItems)
      if (localForm) form.value = JSON.parse(localForm)

      const fetched = await fetchAllModels()
      const fetchedIds = new Set(fetched.map((i) => i.id))

      items.value = [
        ...items.value.filter((i) => !fetchedIds.has(i.id)),
        ...fetched,
      ]

      syncToLocalStorage()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing sampleModel store')
    }
  }

  async function fetchAllModels(): Promise<SampleModel[]> {
    loading.value = true
    try {
      const res = await performFetch<SampleModel[]>('/api/sampleModels')
      if (res.success && res.data) {
        items.value = res.data
        syncToLocalStorage()
        return res.data
      } else {
        throw new Error(res.message || 'Failed to fetch sampleModels')
      }
    } catch (error) {
      handleError(error, 'fetching sampleModels')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchModelById(id: number): Promise<SampleModel | null> {
    try {
      const res = await performFetch<SampleModel>(`/api/sampleModels/${id}`)
      if (res.success && res.data) return res.data
      throw new Error(res.message)
    } catch (error) {
      handleError(error, 'fetching sampleModel by ID')
      return null
    }
  }

  async function addModel(payload: Partial<SampleModel>) {
    isSaving.value = true
    try {
      const res = await performFetch('/api/sampleModels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success) throw new Error(res.message)
      items.value.push(res.data)
      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'creating sampleModel')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updateModel(id: number, updates: Partial<SampleModel>) {
    isSaving.value = true
    try {
      const res = await performFetch(`/api/sampleModels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.success) throw new Error(res.message)

      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) items.value[index] = res.data

      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'updating sampleModel')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteModel(id: number) {
    try {
      const res = await performFetch(`/api/sampleModels/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        items.value = items.value.filter((i) => i.id !== id)
        if (selected.value?.id === id) deselectModel()
        syncToLocalStorage()
      } else {
        throw new Error(res.message)
      }
    } catch (error) {
      handleError(error, 'deleting sampleModel')
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

  function createNewModel() {
    form.value = {
      title: '',
      type: '',
      // add other default fields as needed
    }
    selected.value = null
    syncToLocalStorage()
  }

  async function saveModel() {
    if (!form.value) return { success: false, message: 'No form loaded.' }

    isSaving.value = true
    try {
      if ('id' in form.value && form.value.id) {
        return await updateModel(form.value.id, form.value)
      } else {
        return await addModel(form.value)
      }
    } catch (error) {
      handleError(error, 'saving sampleModel')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
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
    fetchAllModels,
    fetchModelById,
    addModel,
    updateModel,
    deleteModel,
    selectModel,
    deselectModel,
    createNewModel,
    saveModel,
    syncToLocalStorage,
  }
})

export type { SampleModel }

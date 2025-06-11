// /stores/resonanceStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import type { Resonance } from '@prisma/client'

export interface ResonanceForm extends Partial<Resonance> {
  artIds?: number[]
  currentArtId?: number
}

const isClient = typeof window !== 'undefined'

export const useResonanceStore = defineStore('resonanceStore', () => {
  const resonances = ref<Resonance[]>([])
  const selectedResonance = ref<Resonance | null>(null)
  const resonanceForm = ref<ResonanceForm>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const running = ref(false)

  const totalResonances = computed(() => resonances.value.length)
  const hasUnsavedChanges = computed(
    () =>
      JSON.stringify(selectedResonance.value) !==
      JSON.stringify(resonanceForm.value),
  )

  async function initialize() {
    if (isInitialized.value) return
    try {
      if (isClient) {
        const savedResonances = localStorage.getItem('resonances')
        const savedForm = localStorage.getItem('resonanceForm')
        if (savedResonances) resonances.value = JSON.parse(savedResonances)
        if (savedForm) resonanceForm.value = JSON.parse(savedForm)
      }
      const fetched = await fetchResonances()
      if (fetched.length) {
        const fetchedIds = new Set(fetched.map((r) => r.id))
        resonances.value = [
          ...resonances.value.filter((r) => !fetchedIds.has(r.id)),
          ...fetched,
        ]
        syncToLocalStorage()
      }
      isInitialized.value = true
    } catch (err) {
      handleError(err, 'initializing resonance store')
    }
  }

  function syncToLocalStorage() {
    try {
      if (isClient) {
        localStorage.setItem('resonances', JSON.stringify(resonances.value))
        localStorage.setItem(
          'resonanceForm',
          JSON.stringify(resonanceForm.value),
        )
      }
    } catch (err) {
      console.error('Error syncing to localStorage:', err)
    }
  }

  async function fetchResonances(): Promise<Resonance[]> {
    loading.value = true
    try {
      const res = await performFetch<Resonance[]>('/api/resonance')
      if (res.success && res.data) {
        resonances.value = res.data
        syncToLocalStorage()
        return res.data
      } else throw new Error(res.message || 'Failed to fetch resonances')
    } catch (err) {
      handleError(err, 'fetching resonances')
      return []
    } finally {
      loading.value = false
    }
  }

  function selectResonance(id: number) {
    const r = resonances.value.find((r) => r.id === id)
    if (!r) return console.warn(`Resonance with ID ${id} not found.`)
    selectedResonance.value = r
    resonanceForm.value = { ...r }
  }

  function deselectResonance() {
    selectedResonance.value = null
    resonanceForm.value = {}
  }

  async function createResonance(payload: Partial<Resonance>) {
    isSaving.value = true
    try {
      const res = await performFetch('/api/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.success)
        throw new Error(res.message || 'Failed to create resonance.')
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'creating resonance')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updateResonance(id: number, updates: Partial<Resonance>) {
    isSaving.value = true
    try {
      const res = await performFetch(`/api/resonance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.success)
        throw new Error(res.message || 'Failed to update resonance.')
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'updating resonance')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  function createNewResonance() {
    resonanceForm.value = {
      title: '',
      description: '',
      genres: '',
      creativityRate: 50,
      imageMask: 50,
      iteration: 1000,
      useMicrophone: false,
      instructions: '',
      isPublic: true,
      isMature: false,
      seedText: '',
      artIds: [],
    }
    selectedResonance.value = null
    running.value = false
    syncToLocalStorage()
  }

  function nextArtAsset() {
    const form = resonanceForm.value
    if (!form.artIds || form.artIds.length === 0) {
      console.warn('[resonanceStore] No Art assets linked to this Resonance.')
      return
    }
    const current = form.currentArtId || form.artIds[0]
    const index = form.artIds.indexOf(current)
    const nextIndex = (index + 1) % form.artIds.length
    form.currentArtId = form.artIds[nextIndex]
    syncToLocalStorage()
  }

  function forceUpdateNow() {
    running.value = false
    nextArtAsset()
    running.value = true
  }

  async function saveResonance(payload: Omit<ResonanceForm, 'id'>) {
    if (!resonanceForm.value) {
      console.warn('[resonanceStore] No resonanceForm loaded.')
      return { success: false, message: 'No resonance form loaded.' }
    }
    isSaving.value = true
    try {
      if (resonanceForm.value.id) {
        return await updateResonance(
          resonanceForm.value.id,
          resonanceForm.value,
        )
      } else {
        return await createResonance(resonanceForm.value)
      }
    } catch (err) {
      handleError(err, 'saving resonance')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteResonance(id: number) {
    try {
      const res = await performFetch(`/api/resonance/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        resonances.value = resonances.value.filter((r) => r.id !== id)
        if (selectedResonance.value?.id === id) selectedResonance.value = null
        syncToLocalStorage()
      } else throw new Error(res.message || 'Failed to delete resonance.')
    } catch (err) {
      handleError(err, 'deleting resonance')
    }
  }

  async function fetchResonanceById(id: number): Promise<Resonance | null> {
    try {
      const res = await performFetch<Resonance>(`/api/resonance/${id}`)
      if (res.success && res.data) return res.data
      else throw new Error(res.message || 'Failed to fetch resonance.')
    } catch (err) {
      handleError(err, 'fetching resonance by ID')
      return null
    }
  }

  return {
    resonances,
    selectedResonance,
    resonanceForm,
    isSaving,
    isInitialized,
    loading,
    running,
    totalResonances,
    hasUnsavedChanges,
    initialize,
    syncToLocalStorage,
    fetchResonances,
    selectResonance,
    deselectResonance,
    createResonance,
    updateResonance,
    createNewResonance,
    nextArtAsset,
    forceUpdateNow,
    saveResonance,
    deleteResonance,
    fetchResonanceById,
  }
})

export type { Resonance }

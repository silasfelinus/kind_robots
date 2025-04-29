// /stores/resonanceStore.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import type { Resonance } from '@prisma/client'

export const useResonanceStore = defineStore('resonanceStore', {
  state: () => ({
    resonances: [] as Resonance[],
    selectedResonance: null as Resonance | null,
    resonanceForm: {} as Partial<Resonance>,
    isSaving: false,
    isInitialized: false,
    loading: false,
  }),

  getters: {
    totalResonances: (state) => state.resonances.length,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.selectedResonance) !==
      JSON.stringify(state.resonanceForm),
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return

      try {
        const savedResonances = localStorage.getItem('resonances')
        const savedForm = localStorage.getItem('resonanceForm')

        if (savedResonances) {
          this.resonances = JSON.parse(savedResonances)
        }
        if (savedForm) {
          this.resonanceForm = JSON.parse(savedForm)
        }

        const fetchedResonances = await this.fetchResonances()

        if (fetchedResonances.length) {
          const fetchedIds = new Set(fetchedResonances.map((r) => r.id))
          this.resonances = [
            ...this.resonances.filter((r) => !fetchedIds.has(r.id)),
            ...fetchedResonances,
          ]
          this.syncToLocalStorage()
        }

        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing resonance store')
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('resonances', JSON.stringify(this.resonances))
        localStorage.setItem(
          'resonanceForm',
          JSON.stringify(this.resonanceForm),
        )
      } catch (error) {
        console.error('Error syncing to localStorage:', error)
      }
    },

    async fetchResonances(): Promise<Resonance[]> {
      this.loading = true
      try {
        const response = await performFetch<Resonance[]>('/api/resonance')

        if (response.success && response.data) {
          this.resonances = response.data
          this.syncToLocalStorage()
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch resonances')
        }
      } catch (error) {
        handleError(error, 'fetching resonances')
        return []
      } finally {
        this.loading = false
      }
    },

    async selectResonance(resonanceId: number) {
      const resonance = this.resonances.find((r) => r.id === resonanceId)
      if (!resonance) {
        console.warn(`Resonance with ID ${resonanceId} not found.`)
        return
      }
      this.selectedResonance = resonance
      this.resonanceForm = { ...resonance }
    },

    deselectResonance() {
      this.selectedResonance = null
      this.resonanceForm = {}
    },

    async createResonance(payload: Partial<Resonance>) {
      this.isSaving = true

      try {
        const response = await performFetch('/api/resonance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to create resonance.')
        }

        console.log('[resonanceStore] Created new resonance:', response.data)

        return { success: true, data: response.data }
      } catch (error) {
        handleError(error, 'creating resonance')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async updateResonance(id: number, updates: Partial<Resonance>) {
      this.isSaving = true

      try {
        const response = await performFetch(`/api/resonance/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to update resonance.')
        }

        console.log('[resonanceStore] Updated resonance ID:', id)

        return { success: true, data: response.data }
      } catch (error) {
        handleError(error, 'updating resonance')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async saveResonance(payload: {
      title: string
      description?: string
      genres?: string
      creativityRate: number
      imageMask: number
      iteration: number
      useMicrophone: boolean
      isPublic: boolean
      isMature: boolean
      artIds: number[]
    }) {
      if (!this.resonanceForm) {
        console.warn('[resonanceStore] No resonanceForm loaded.')
        return { success: false, message: 'No resonance form loaded.' }
      }

      this.isSaving = true

      try {
        if (this.resonanceForm.id) {
          console.log(
            '[resonanceStore] Detected ID - updating existing resonance.',
          )
          return await this.updateResonance(
            this.resonanceForm.id,
            this.resonanceForm,
          )
        } else {
          console.log('[resonanceStore] No ID - creating new resonance.')
          return await this.createResonance(this.resonanceForm)
        }
      } catch (error) {
        handleError(error, 'saving resonance')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async deleteResonance(id: number) {
      try {
        const response = await performFetch(`/api/resonance/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.resonances = this.resonances.filter((r) => r.id !== id)
          if (this.selectedResonance?.id === id) {
            this.selectedResonance = null
          }
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to delete resonance.')
        }
      } catch (error) {
        handleError(error, 'deleting resonance')
      }
    },

    async fetchResonanceById(id: number): Promise<Resonance | null> {
      try {
        const response = await performFetch<Resonance>(`/api/resonance/${id}`)

        if (response.success && response.data) {
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch resonance.')
        }
      } catch (error) {
        handleError(error, 'fetching resonance by ID')
        return null
      }
    },
  },
})

export type { Resonance }

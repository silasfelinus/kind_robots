import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import type { Pitch, PitchType } from '@prisma/client' // Import both Pitch and PitchType from Prisma

const isClient = typeof window !== 'undefined'

interface FetchResponse {
  pitch?: Pitch
  pitches?: Pitch[]
  message?: string
  success: boolean
}

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (error as ErrorWithMessage).message !== undefined
}

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    isInitialized: false,
    selectedPitchId: null as number | null,
  }),

  getters: {
    brainstormPitches: (state) => {
      return state.pitches.filter((pitch: Pitch) => pitch.PitchType === 'BRAINSTORM');
    },

    pitchesByTitle: (state) => {
      return state.pitches.filter((pitch: Pitch) => pitch.PitchType === 'BRAINSTORM').reduce((grouped: Record<string, Pitch[]>, pitch: Pitch) => {
        const title = pitch.title || 'Untitled';
        if (!grouped[title]) {
          grouped[title] = [];
        }
        grouped[title].push(pitch);
        return grouped;
      }, {});
    },
    publicPitches: (state) => {
      const userStore = useUserStore()
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },
    selectedPitch: (state) => {
      return (
        state.pitches.find((pitch) => pitch.id === state.selectedPitchId) ||
        null
      )
    },
  },

  actions: {
    async fetchBrainstormPitches() {
      try {
        const data = await this.performFetch('/api/pitches/brainstorm');
        this.addPitches(data.pitches || []);
      } catch (error) {
        console.error('Failed to fetch brainstorm pitches:', error);
      }
    },

    // Load more pitches by title
    async fetchMorePitchesByTitle(title: string) {
      try {
        const data = await this.performFetch(`/api/pitches/title/${encodeURIComponent(title)}`);
        this.addPitches(data.pitches || []);
      } catch (error) {
        console.error(`Failed to fetch more pitches for title: ${title}`, error);
      }
    },
    setSelectedPitch(pitchId: number | null) {
      this.selectedPitchId = pitchId
    },

    async performFetch(url: string, options: RequestInit = {}): Promise<FetchResponse> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        const data = await response.json()
    
        if (!response.ok) {
          errorStore.setError(ErrorType.NETWORK_ERROR, data.message || 'Failed to perform fetch operation')
          return { success: false, message: data.message }
        }
    
        return { ...data, success: true }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error) ? error.message : 'Unknown network error'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        console.error('Network error:', errorMessage)
        return { success: false, message: errorMessage }
      }
    },
    

    async initializePitches() {
      if (!this.isInitialized) {
        await this.fetchPitches()
        this.isInitialized = true
      }
    },


    async fetchPitches() {
      try {
        const data = await this.performFetch('/api/pitches/batch')
        this.pitches = data.pitches || []
        if (isClient) {
          localStorage.setItem('pitches', JSON.stringify(this.pitches))
        }
      } catch (error) {
        console.error('Failed to fetch pitches:', error)
      }
    },

    async fetchPitchById(pitchId: number) {
      // Check if pitch already exists in state
      const existingPitch = this.pitches.find((pitch) => pitch.id === pitchId)
      if (existingPitch) return existingPitch

      try {
        const data = await this.performFetch(`/api/pitches/${pitchId}`)
        if (data.pitch) {
          this.pitches.push(data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return data.pitch
        }
      } catch (error) {
        console.error('Failed to fetch pitch by ID:', error)
      }
    },

    async createPitch(newPitch: Partial<Pitch>) {
      try {
        const data = await this.performFetch('/api/pitches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPitch),
        })
        if (data.pitch) {
          this.pitches.push(data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch created successfully' }
        } else {
          throw new Error('Pitch creation failed: No pitch returned')
        }
      } catch (error) {
        if (isErrorWithMessage(error)) {
          console.error('Error creating pitch:', error.message)
          return { success: false, message: error.message }
        } else {
          console.error('Error creating pitch: Unknown error')
          return {
            success: false,
            message: 'Unknown error during pitch creation',
          }
        }
      }
    },

    async updatePitch(pitchId: number, updates: Partial<Pitch>) {
      try {
        const data = await this.performFetch(`/api/pitches/${pitchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)
        if (index !== -1 && data.pitch) {
          this.pitches[index] = { ...this.pitches[index], ...data.pitch }
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch updated successfully' }
        } else {
          throw new Error('Pitch update failed: No pitch returned')
        }
      } catch (error) {
        if (isErrorWithMessage(error)) {
          console.error('Error updating pitch:', error.message)
          return { success: false, message: error.message }
        } else {
          console.error('Error updating pitch: Unknown error')
          return {
            success: false,
            message: 'Unknown error during pitch update',
          }
        }
      }
    },

    async deletePitch(pitchId: number) {
      try {
        await this.performFetch(`/api/pitches/${pitchId}`, { method: 'DELETE' })
        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)
        if (index !== -1) {
          this.pitches.splice(index, 1)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch deleted successfully' }
        } else {
          throw new Error('Pitch delete failed: Pitch not found')
        }
      } catch (error) {
        if (isErrorWithMessage(error)) {
          console.error('Error deleting pitch:', error.message)
          return { success: false, message: error.message }
        } else {
          console.error('Error deleting pitch: Unknown error')
          return {
            success: false,
            message: 'Unknown error during pitch deletion',
          }
        }
      }
    },
    // New addPitches method
    addPitches(newPitches: Pitch[]) {
      newPitches.forEach((newPitch) => {
        const existingPitch = this.pitches.find(
          (pitch) => pitch.id === newPitch.id,
        )
        if (!existingPitch) {
          this.pitches.push(newPitch)
        }
      })
      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
      }
    },
  },
})

export type { Pitch, PitchType }

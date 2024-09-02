//stores/pitchStore
import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import type { Pitch } from '@prisma/client'

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
  }),

  getters: {
    publicPitches: (state) => {
      const userStore = useUserStore()
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },
  },

  actions: {
    async performFetch(
      url: string,
      options: RequestInit = {},
    ): Promise<FetchResponse> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          const errorData: FetchResponse = await response.json()
          throw new Error(
            errorData.message || 'Failed to perform fetch operation',
          )
        }
        return (await response.json()) as FetchResponse
      } catch (error) {
        if (isErrorWithMessage(error)) {
          errorStore.setError(ErrorType.NETWORK_ERROR, error.message)
          console.error('Network error:', error.message)
        } else {
          errorStore.setError(ErrorType.NETWORK_ERROR, 'Unknown network error')
          console.error('Network error: Unknown error')
        }
        throw error
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
  },
})

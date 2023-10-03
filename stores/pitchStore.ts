import { defineStore } from 'pinia'
import { Pitch } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'
import { useUserStore } from '@/stores/userStore'

const isClient = typeof window !== 'undefined'

export const usePitchStore = defineStore({
  id: 'pitch',

  state: () => ({
    pitches: [] as Pitch[],
    isInitialized: false,
    selectedPitch: null as Pitch | null
  }),

  getters: {
    publicPitches(): Pitch[] {
      const userStore = useUserStore()
      return this.pitches.filter(
        (pitch) => pitch.isPublic || pitch.userId === userStore.userId || pitch.userId === 0
      )
    },
    // New getter to get the username based on userId
    getUsername(): (userId: number) => Promise<string | null> {
      return async (userId: number) => {
        if (userId === 0) {
          return 'Anonymous' // or any default name you'd like to give
        }
        try {
          const userStore = useUserStore()

          const user = await userStore.fetchUsernameById(userId)
          return user || 'Unknown'
        } catch (error: any) {
          const handledError = errorHandler(error)
          console.error('Error fetching username:', handledError.message)
          return null
        }
      }
    }
  },

  actions: {
    selectPitch(pitchId: number) {
      const foundPitch = this.pitches.find((pitch) => pitch.id === pitchId)
      if (foundPitch) {
        this.selectedPitch = foundPitch
      } else {
        console.warn(`Pitch with id ${pitchId} not found.`)
      }
    },

    initializePitches() {
      if (!this.isInitialized) {
        this.fetchPitches()
        this.isInitialized = true
      }
    },

    async fetchPitches() {
      try {
        const response = await fetch('/api/pitches')
        if (response.ok) {
          const data = await response.json()
          this.pitches = data.pitches
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
        } else {
          const errorText = await response.text()
          const handledError = errorHandler(new Error(errorText))
          console.error('Failed to fetch pitches:', handledError.message)
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error fetching pitches:', handledError.message)
      }
    },

    async createPitch(newPitch: Partial<Pitch>) {
      try {
        const response = await fetch('/api/pitches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPitch)
        })

        if (response.ok) {
          const createdPitch = await response.json()
          this.pitches.push(createdPitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error creating pitch:', handledError.message)
      }
    },

    async updatePitch(id: number, updates: Partial<Pitch>) {
      try {
        const response = await fetch(`/api/pitches/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        })

        if (response.ok) {
          const updatedPitch = await response.json()
          const index = this.pitches.findIndex((pitch) => pitch.id === id)
          if (index !== -1) {
            this.pitches[index] = { ...this.pitches[index], ...updatedPitch }
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error updating pitch:', handledError.message)
      }
    },

    async deletePitch(id: number) {
      try {
        const response = await fetch(`/api/pitches/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const index = this.pitches.findIndex((pitch) => pitch.id === id)
          if (index !== -1) {
            this.pitches.splice(index, 1)
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error deleting pitch:', handledError.message)
      }
    }
  }
})

export type { Pitch }

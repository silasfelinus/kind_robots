import { defineStore } from 'pinia'
import type { Pitch } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'
import { useUserStore } from '@/stores/userStore'
import { useArtStore, type Art } from '@/stores/artStore'

const isClient = typeof window !== 'undefined'

export const usePitchStore = defineStore({
  id: 'pitch',

  state: () => ({
    pitches: [] as Pitch[],
    isInitialized: false,
    selectedPitch: null as Pitch | null,
  }),

  getters: {
    publicPitches(): Pitch[] {
      const userStore = useUserStore()
      return this.pitches.filter(pitch => pitch.isPublic || pitch.userId === userStore.userId || pitch.userId === 0)
    },
    // New getter to get the username based on userId
    getUsername(): (userId: number) => Promise<string | null> {
      return async (userId: number) => {
        if (userId === 0) {
          return 'Kind Guest' // or any default name you'd like to give
        }
        try {
          const userStore = useUserStore()

          const user = await userStore.fetchUsernameById(userId)
          return user || 'Unknown'
        }
        catch (error: any) {
          const handledError = errorHandler(error)
          console.error('Error fetching username:', handledError.message)
          return null
        }
      }
    },
  },

  actions: {
    selectPitch(pitchId: number) {
      const foundPitch = this.pitches.find(pitch => pitch.id === pitchId)
      if (foundPitch) {
        this.selectedPitch = foundPitch
      }
      else {
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
        const response = await fetch('/api/pitches/batch')
        if (response.ok) {
          const data = await response.json()
          this.pitches = data.pitches
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
        }
        else {
          const errorText = await response.text()
          const handledError = errorHandler(new Error(errorText))
          console.error('Failed to fetch pitches:', handledError.message)
        }
      }
      catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error fetching pitches:', handledError.message)
      }
    },
    async createPitch(newPitch: Partial<Pitch>) {
      try {
        console.log('Sending pitch data:', newPitch) // Debug log

        const response = await fetch('/api/pitches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPitch), // Send the pitch data
        })

        const data = await response.json() // Parse the JSON response

        if (response.ok) {
          console.log('Received:', data) // Debug log
          if (data.success && data.pitch) {
            this.pitches.push(data.pitch)
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
            return { success: true, message: 'Pitch created successfully' } // Return a success message
          }
          else {
            throw new Error(data.message || 'Failed to create pitch')
          }
        }
        else {
          throw new Error(data.message || 'Failed to create pitch')
        }
      }
      catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error creating pitch:', handledError.message)
        return { success: false, message: handledError.message } // Return an error message
      }
    },

    getArtForPitch(pitchId: number): Art[] {
      const artStore = useArtStore()
      return artStore.getArtByPitchId(pitchId)
    },

    async updatePitch(id: number, updates: Partial<Pitch>) {
      try {
        const response = await fetch(`/api/pitches/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          const updatedPitch = await response.json()
          const index = this.pitches.findIndex(pitch => pitch.id === id)
          if (index !== -1) {
            this.pitches[index] = { ...this.pitches[index], ...updatedPitch }
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
          }
        }
      }
      catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error updating pitch:', handledError.message)
      }
    },

    async deletePitch(id: number) {
      try {
        const response = await fetch(`/api/pitches/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const index = this.pitches.findIndex(pitch => pitch.id === id)
          if (index !== -1) {
            this.pitches.splice(index, 1)
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
          }
        }
      }
      catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error deleting pitch:', handledError.message)
      }
    },
  },
})

export { type Pitch }

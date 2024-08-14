import { defineStore } from 'pinia'
import type { Pitch } from '@prisma/client'
import { useUserStore } from './../stores/userStore'
import { useArtStore, type Art } from './../stores/artStore'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType

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

    getUsername(): (userId: number) => Promise<string | null> {
      return async (userId: number) => {
        if (userId === 0) {
          return 'Kind Guest'
        }
        try {
          const userStore = useUserStore()
          const user = await userStore.fetchUsernameById(userId)
          return user || 'Unknown'
        } catch  {
          const errorStore = useErrorStore()
          errorStore.setError(ErrorType.NETWORK_ERROR, 'Error fetching username')
          console.error('Error fetching username:', errorStore.getErrors().slice(-1)[0]?.message)
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
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch('/api/pitches/batch')
        if (response.ok) {
          const data = await response.json()
          this.pitches = data.pitches
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch pitches: ${errorText}`)
          console.error('Failed to fetch pitches:', errorStore.getErrors().slice(-1)[0]?.message)
        }
      } catch{
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error fetching pitches')
        console.error('Error fetching pitches:', errorStore.getErrors().slice(-1)[0]?.message)
      }
    },

    async createPitch(newPitch: Partial<Pitch>) {
      const errorStore = useErrorStore() // Use errorStore

      try {
        console.log('Sending pitch data:', newPitch)

        const response = await fetch('/api/pitches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPitch),
        })

        const data = await response.json()

        if (response.ok) {
          console.log('Received:', data)
          if (data.success && data.pitch) {
            this.pitches.push(data.pitch)
            if (isClient) {
              localStorage.setItem('pitches', JSON.stringify(this.pitches))
            }
            return { success: true, message: 'Pitch created successfully' }
          } else {
            throw new Error(data.message || 'Failed to create pitch')
          }
        } else {
          throw new Error(data.message || 'Failed to create pitch')
        }
      } catch  {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error creating pitch')
        console.error('Error creating pitch:', errorStore.getErrors().slice(-1)[0]?.message)
        return { success: false, message: errorStore.getErrors().slice(-1)[0]?.message }
      }
    },

    getArtForPitch(pitchId: number): Art[] {
      const artStore = useArtStore()
      return artStore.getArtByPitchId(pitchId)
    },

    async updatePitch(id: number, updates: Partial<Pitch>) {
      const errorStore = useErrorStore() // Use errorStore

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
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to update pitch: ${errorText}`)
          console.error('Error updating pitch:', errorStore.getErrors().slice(-1)[0]?.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error updating pitch')
        console.error('Error updating pitch:', errorStore.getErrors().slice(-1)[0]?.message)
      }
    },

    async deletePitch(id: number) {
      const errorStore = useErrorStore() // Use errorStore

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
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to delete pitch: ${errorText}`)
          console.error('Error deleting pitch:', errorStore.getErrors().slice(-1)[0]?.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error deleting pitch')
        console.error('Error deleting pitch:', errorStore.getErrors().slice(-1)[0]?.message)
      }
    },
  },
})

export { type Pitch }

import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import type { Pitch } from '@prisma/client' // Import both Pitch and PitchType from Prisma

const isClient = typeof window !== 'undefined'

interface FetchResponse {
  pitch?: Pitch
  pitches?: Pitch[]
  message?: string
  success: boolean
}

export enum PitchType {
  BRAINSTORM = 'BRAINSTORM',
  ARTPITCH = 'ARTPITCH',
  BOT = 'BOT',
  ARTGALLERY = 'ARTGALLERY',
  INSPIRATION = 'INSPIRATION',
}

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (error as ErrorWithMessage).message !== undefined
}

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],        // All pitches
    selectedPitches: [] as Pitch[], // Top 5 selected pitches
    isInitialized: false,
    selectedPitchId: null as number | null,
  }),

  getters: {
    brainstormPitches: (state) => {
      return state.pitches.filter((pitch: Pitch) => pitch.PitchType === 'BRAINSTORM')
    },

    pitchesByTitle: (state) => {
      return state.pitches
        .filter((pitch: Pitch) => pitch.PitchType === PitchType.BRAINSTORM)
        .reduce((grouped: Record<string, Pitch[]>, pitch: Pitch) => {
          const title = pitch.title || 'Untitled'
          if (!grouped[title]) {
            grouped[title] = []
          }
          grouped[title].push(pitch)
          return grouped
        }, {})
    },

    publicPitches: (state) => {
      const userStore = useUserStore()
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic || pitch.userId === userStore.userId || pitch.userId === 0,
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
    async initializePitches() {
      // Make sure fetchPitches is called correctly
      if (!this.isInitialized) {
        await this.fetchPitches()  // Calls the action to fetch pitches
        this.isInitialized = true
      }
    },
    // Fetch brainstorm pitches
    async fetchBrainstormPitches() {
      try {
        const response = await fetch('/api/botcafe/brainstorm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            n: 5,
            messages: [{ role: 'user', content: '1 more original brainstorm.' }],
            max_tokens: 500,
          }),
        })

        const data = await response.json()

        // Parse the brainstorm pitches from the response
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const newIdeas: Pitch[] = this.parseIdeasFromAPI(
            data.choices[0].message.content,
          )
          this.addPitches(newIdeas)
        }
      } catch (error) {
        console.error('Failed to fetch brainstorm pitches:', error)
      }
    },

    // Helper function to parse API ideas into Pitch format
    parseIdeasFromAPI(rawContent: string): Pitch[] {
      const lines = rawContent.split('\n')
      const ideasList = lines.filter((line: string) => /^\d+\./.test(line))
      return ideasList.map((item: string, index: number) => {
        const cleanItem = item.replace(/^\d+\.\s/, '')
        const [title, pitch] = cleanItem.split(' - ')
        return {
          id: this.pitches.length + index + 1, // Creating a new unique id
          createdAt: new Date(),
          updatedAt: new Date(),
          title: title || `Idea ${index + 1}`,
          pitch: pitch || cleanItem,
          designer: null,
          flavorText: null,
          highlightImage: null,
          PitchType: PitchType.BRAINSTORM,
          isMature: false,
          isPublic: true,
          userId: 1,
          playerId: null,
          channelId: null,
        } as Pitch
      })
    },

    // Add new pitches and select the newest five brainstorm pitches
    addPitches(newPitches: Pitch[]) {
      newPitches.forEach((newPitch) => {
        const existingPitch = this.pitches.find(
          (pitch) => pitch.id === newPitch.id,
        )
        if (!existingPitch) {
          this.pitches.push(newPitch)
        }
      })

      // Automatically select the newest five brainstorm pitches
      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) // Sort by most recent

      // Update the selected pitches to be the newest five
      this.selectedPitches = brainstormPitches.slice(0, 5)

      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem('selectedPitches', JSON.stringify(this.selectedPitches))
      }
    },

    // Fetch existing pitches from API or storage
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
    // Fetch a pitch by ID
    async fetchPitchById(pitchId: number) {
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

    // Create a new pitch
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

    // Update a pitch
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

    // Delete a pitch
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

    // Fetch more pitches by title
    async fetchMorePitchesByTitle(title: string) {
      try {
        const data = await this.performFetch(
          `/api/pitches/title/${encodeURIComponent(title)}`,
        )
        this.addPitches(data.pitches || [])
      } catch (error) {
        console.error(`Failed to fetch more pitches for title: ${title}`, error)
      }
    },

    // Utility function to perform fetch with error handling
    async performFetch(
      url: string,
      options: RequestInit = {},
    ): Promise<FetchResponse> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        const data = await response.json()

        if (!response.ok) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            data.message || 'Failed to perform fetch operation',
          )
          return { success: false, message: data.message }
        }

        return { ...data, success: true }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown network error'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        console.error('Network error:', errorMessage)
        return { success: false, message: errorMessage }
      }
    },
  },
})

export type { Pitch }

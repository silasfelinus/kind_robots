import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import type { Pitch, Art } from '@prisma/client'

const isClient = typeof window !== 'undefined'

interface FetchResponse {
  pitch?: Pitch
  pitches?: Pitch[]
  message?: string
  success: boolean
  artEntries?: Art[]
}

// Create an object for runtime use
export enum PitchTypeEnum {
  ARTPITCH = 'Art Pitch',
  BRAINSTORM = 'Brainstorm',
  BOT = 'Bot',
  ARTGALLERY = 'Art Gallery',
  INSPIRATION = 'Inspiration',
}

// Assuming Prisma PitchType is something like 'ARTPITCH', 'BRAINSTORM', etc.
export const pitchTypeMap: Record<string, PitchTypeEnum> = {
  ARTPITCH: PitchTypeEnum.ARTPITCH,
  BRAINSTORM: PitchTypeEnum.BRAINSTORM,
  BOT: PitchTypeEnum.BOT,
  ARTGALLERY: PitchTypeEnum.ARTGALLERY,
  INSPIRATION: PitchTypeEnum.INSPIRATION,
}

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (error as ErrorWithMessage).message !== undefined
}

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[], // All pitches
    selectedPitches: [] as Pitch[], // Top 5 selected pitches
    selectedPitchType: null as PitchTypeEnum | null, // PitchType can be null
    isInitialized: false,
    galleryArt: [] as Art[],
  }),

  getters: {
    pitchTypes: () => {
      return Object.values(PitchTypeEnum)
    },
    // Get selected pitch, which is the first in the selectedPitches array
    selectedPitch: (state) => {
      return state.selectedPitches.length ? state.selectedPitches[0] : null
    },

    // Get the ID of the selected pitch (first in the selectedPitches array)
    selectedPitchId: (state) => {
      return state.selectedPitches.length ? state.selectedPitches[0].id : null
    },
    getPitchesByType: (state) => (pitchType: PitchTypeEnum) => {
      return state.pitches.filter(
        (pitch: Pitch) => pitchTypeMap[pitch.PitchType] === pitchType,
      )
    },

    getPitchesBySelectedType: (state) => {
      if (!state.selectedPitchType) return []
      return state.pitches.filter(
        (pitch: Pitch) =>
          pitchTypeMap[pitch.PitchType] === state.selectedPitchType,
      )
    },

    brainstormPitches: (state) => {
      return state.pitches.filter(
        (pitch: Pitch) => pitch.PitchType === 'BRAINSTORM',
      )
    },

    pitchesByTitle: (state) => {
      return state.pitches
        .filter((pitch: Pitch) => pitch.PitchType === 'BRAINSTORM')
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
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },
  },

  actions: {
    async initializePitches() {
      if (!isClient) {
        return
      }
      if (!this.isInitialized) {
        await this.fetchPitches() // Fetches pitches
        this.isInitialized = true
      }
    },

    setSelectedPitch(pitchId: number) {
      const pitch = this.pitches.find((p) => p.id === pitchId)
      if (pitch) {
        this.selectedPitches = [pitch] // Set the selected pitch
      }
    },

    setSelectedPitchType(pitchType: PitchTypeEnum | null) {
      this.selectedPitchType = pitchType
    },
    async fetchRandomPitches(count: number) {
      try {
        const response = await fetch(`/api/pitches/random?count=${count}`)
        const data = await response.json()
        this.selectedPitches = data.pitches || []
      } catch (error) {
        console.error('Failed to fetch random pitches:', error)
      }
    },

    async fetchBrainstormPitches() {
      try {
        const response = await fetch('/api/botcafe/brainstorm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            n: 5,
            messages: [
              { role: 'user', content: '1 more original brainstorm.' },
            ],
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
          PitchType: 'BRAINSTORM',
          isMature: false,
          isPublic: true,
          userId: 1,
          playerId: null,
          channelId: null,
          description: null,
          imagePrompt: null,
          artImageId: null,
        } as Pitch
      })
    },

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
        .filter((pitch) => pitch.PitchType === 'BRAINSTORM')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) // Sort by most recent

      this.selectedPitches = brainstormPitches.slice(0, 5)

      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem(
          'selectedPitches',
          JSON.stringify(this.selectedPitches),
        )
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
      try {
        const data = await this.performFetch(`/api/pitches/${pitchId}`)
        if (data.pitch) {
          this.pitches.push(data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return data.pitch
        }
        throw new Error('Pitch not found')
      } catch (error) {
        if (isErrorWithMessage(error)) {
          console.error('Error fetching pitch:', error.message)
        } else {
          console.error('Unknown error fetching pitch')
        }
      }
    },

    async createPitch(newPitch: Partial<Pitch>) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/pitches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPitch),
        })

        const data = await response.json()

        if (response.ok && data.pitch) {
          this.pitches.push(data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch created successfully' }
        } else {
          throw new Error(data.message || 'Pitch creation failed')
        }
      } catch (error) {
        if (isErrorWithMessage(error)) {
          errorStore.setError(ErrorType.NETWORK_ERROR, error.message)
          return { success: false, message: error.message }
        } else {
          errorStore.setError(ErrorType.NETWORK_ERROR, 'Unknown error')
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
          method: 'PATCH',
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
    async fetchArtForPitch(pitchId: number) {
      try {
        const response = await fetch(`/api/pitches/art/${pitchId}`)
        const data = await response.json()
        this.galleryArt = data.artEntries || []
      } catch (error) {
        console.error('Failed to fetch art for pitch:', error)
      }
    },

    async performFetch(
      url: string,
      options: RequestInit = {},
      retries = 3,
      timeout = 8000,
    ): Promise<FetchResponse> {
      const errorStore = useErrorStore()

      if (!isClient) {
        return { success: false, message: 'Cannot fetch on the server.' }
      }

      const fetchWithTimeout = (
        url: string,
        options: RequestInit,
        timeout: number,
      ): Promise<Response> => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Request timed out'))
          }, timeout)

          fetch(url, options)
            .then((response) => {
              clearTimeout(timer)
              resolve(response)
            })
            .catch((error) => {
              clearTimeout(timer)
              reject(error)
            })
        })
      }

      // Retry logic for transient errors
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetchWithTimeout(url, options, timeout)
          const data = await response.json()

          // Handle non-OK responses
          if (!response.ok) {
            const errorMessage = `Error: ${response.status} - ${response.statusText}`
            logAndSetError(errorMessage, data.message || errorMessage)
            return { success: false, message: data.message || errorMessage }
          }

          // Success case
          return { ...data, success: true }
        } catch (error) {
          const isLastAttempt = attempt === retries
          const errorMessage = isErrorWithMessage(error)
            ? error.message
            : 'Unknown network error'

          console.error(`Attempt ${attempt} failed: ${errorMessage}`)

          if (isLastAttempt) {
            logAndSetError('Network Error', errorMessage)
            return { success: false, message: errorMessage }
          }
        }
      }

      // Fallback in case retries are exhausted
      return { success: false, message: 'All fetch attempts failed' }

      function logAndSetError(logMessage: string, userMessage: string) {
        console.error(logMessage)
        errorStore.setError(ErrorType.NETWORK_ERROR, userMessage)
      }
    },
  },
})

export type { Pitch }

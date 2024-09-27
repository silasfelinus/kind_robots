import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import type { Pitch, Art } from '@prisma/client'
import { PitchType } from '@prisma/client'

const isClient = typeof window !== 'undefined'

interface FetchResponse {
  pitch?: Pitch
  pitches?: Pitch[]
  art?: Art[] // Update this type according to your Art model
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
    pitches: [] as Pitch[], // All pitches
    selectedPitches: [] as Pitch[], // Top 5 selected pitches
    isInitialized: false,
    selectedPitchId: null as number | null,
    selectedPitchType: null as PitchType | null,
    currentPitch: null as Pitch | null, // Ensure currentPitch can be null
    galleryArt: [] as Art[], // Add a galleryArt state to hold fetched art
  }),

  getters: {
    getPitchesByType: (state) => (pitchType: PitchType) => {
      console.log(`Getting pitches by type: ${pitchType}`)
      return state.pitches.filter(
        (pitch: Pitch) => pitch.PitchType === pitchType,
      )
    },

    getPitchesBySelectedType: (state) => {
      if (!state.selectedPitchType) return []
      console.log(`Getting pitches by selected type: ${state.selectedPitchType}`)
      return state.pitches.filter(
        (pitch: Pitch) => pitch.PitchType === state.selectedPitchType,
      )
    },

    brainstormPitches: (state) => {
      console.log('Fetching brainstorm pitches')
      return state.pitches.filter(
        (pitch: Pitch) => pitch.PitchType === PitchType.BRAINSTORM,
      )
    },

    pitchesByTitle: (state) => {
      console.log('Grouping pitches by title')
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
      console.log('Getting public pitches')
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },

    selectedPitch: (state) => {
      console.log(`Getting selected pitch with id: ${state.selectedPitchId}`)
      return (
        state.pitches.find((pitch) => pitch.id === state.selectedPitchId) ||
        null
      )
    },
  },

  actions: {
    async initializePitches() {
      console.log('Initializing pitches')
      if (!this.isInitialized) {
        await this.fetchPitches()
        this.isInitialized = true
        console.log('Pitches initialized')
      }
    },

    setSelectedPitch(pitchId: number) {
      console.log(`Setting selected pitch with id: ${pitchId}`)
      this.selectedPitchId = pitchId
    },

    async updatePitch(pitchId: number, updatedData: Partial<Pitch>) {
      console.log(`Updating pitch with id: ${pitchId}`)
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/pitches/${pitchId}`, {
          method: 'PUT', // Use PUT for updating an existing resource
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        })

        const data = await response.json()

        if (response.ok && data.pitch) {
          console.log('Pitch updated successfully:', data.pitch)
          const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)
          if (index !== -1) {
            this.pitches[index] = data.pitch
          }
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch updated successfully' }
        } else {
          console.error('Pitch update failed:', data.message)
          throw new Error(data.message || 'Pitch update failed')
        }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown error'
        console.error('Error updating pitch:', errorMessage)
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        return { success: false, message: errorMessage }
      }
    },

    async deletePitch(pitchId: number) {
      console.log(`Deleting pitch with id: ${pitchId}`)
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/pitches/${pitchId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          console.log(`Pitch with id: ${pitchId} deleted successfully`)
          this.pitches = this.pitches.filter((pitch) => pitch.id !== pitchId)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch deleted successfully' }
        } else {
          const data = await response.json()
          console.error('Pitch deletion failed:', data.message)
          throw new Error(data.message || 'Pitch deletion failed')
        }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown error'
        console.error('Error deleting pitch:', errorMessage)
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        return { success: false, message: errorMessage }
      }
    },

    setSelectedPitchType(pitchType: PitchType | null) {
      console.log(`Setting selected pitch type: ${pitchType}`)
      this.selectedPitchType = pitchType
    },

    async fetchRandomPitches(count: number) {
      console.log(`Fetching ${count} random pitches`)
      try {
        const response = await fetch(`/api/pitches/random?count=${count}`)
        const data = await response.json()
        console.log('Fetched random pitches:', data.pitches)
        this.selectedPitches = data.pitches || []
      } catch (error) {
        console.error('Error fetching random pitches:', error)
      }
    },

    async fetchBrainstormPitches() {
      console.log('Fetching brainstorm pitches from API')
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
        console.log('Brainstorm API response:', data)

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
      console.log('Parsing ideas from API content')
      const lines = rawContent.split('\n')
      const ideasList = lines.filter((line: string) => /^\d+\./.test(line))
      return ideasList.map((item: string, index: number) => {
        const cleanItem = item.replace(/^\d+\.\s/, '')
        const [title, pitch] = cleanItem.split(' - ')
        return {
          id: this.pitches.length + index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          title: title || `Idea ${index + 1}`,
          pitch: pitch || cleanItem,
          PitchType: PitchType.BRAINSTORM,
          isMature: false,
          isPublic: true,
          userId: 1,
          designer: null,
          flavorText: null,
          highlightImage: null,
          playerId: null,
          channelId: null,
        } as Pitch
      })
    },

    addPitches(newPitches: Pitch[]) {
      console.log('Adding new pitches:', newPitches)
      newPitches.forEach((newPitch) => {
        if (!this.pitches.find((pitch) => pitch.id === newPitch.id)) {
          this.pitches.push(newPitch)
        }
      })

      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

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
      console.log('Fetching all pitches from API')
      try {
        const data = await this.performFetch('/api/pitches/batch')
        this.pitches = data.pitches || []
        console.log('Fetched pitches:', this.pitches)
        if (isClient) {
          localStorage.setItem('pitches', JSON.stringify(this.pitches))
        }
      } catch (error) {
        console.error('Failed to fetch pitches:', error)
      }
    },

    async fetchPitchById(pitchId: number) {
      console.log(`Fetching pitch by id: ${pitchId}`)
      try {
        const data = await this.performFetch(`/api/pitches/${pitchId}`)
        if (data.pitch) {
          this.pitches.push(data.pitch)
          console.log('Fetched pitch:', data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return data.pitch
        }
        throw new Error('Pitch not found')
      } catch (error) {
        console.error(
          'Error fetching pitch:',
          isErrorWithMessage(error) ? error.message : 'Unknown error',
        )
      }
    },

    async fetchArtForPitch(pitchId: number) {
      console.log(`Fetching art for pitch with id: ${pitchId}`)
      try {
        const data = await this.performFetch(`/api/pitches/${pitchId}/art`)
        this.galleryArt = data.art || []
        console.log('Fetched art for pitch:', this.galleryArt)
      } catch (error) {
        console.error(
          'Error fetching art for pitch:',
          isErrorWithMessage(error) ? error.message : 'Unknown error',
        )
      }
    },

    async createPitch(newPitch: Partial<Pitch>) {
      console.log('Creating new pitch:', newPitch)
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/pitches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPitch),
        })

        const data = await response.json()

        if (response.ok && data.pitch) {
          console.log('Created new pitch:', data.pitch)
          this.pitches.push(data.pitch)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch created successfully' }
        } else {
          console.error('Pitch creation failed:', data.message)
          throw new Error(data.message || 'Pitch creation failed')
        }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown error'
        console.error('Error creating pitch:', errorMessage)
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        return { success: false, message: errorMessage }
      }
    },

    async performFetch(
      url: string,
      options: RequestInit = {},
    ): Promise<FetchResponse> {
      console.log(`Performing fetch on url: ${url}`)
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        const data = await response.json()

        if (!response.ok) {
          console.error(`Fetch failed for url: ${url}`, data.message)
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            data.message || 'Fetch operation failed',
          )
          return { success: false, message: data.message }
        }

        return { ...data, success: true }
      } catch (error) {
        const errorMessage = isErrorWithMessage(error)
          ? error.message
          : 'Unknown network error'
        console.error(`Error during fetch for url: ${url}`, errorMessage)
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        return { success: false, message: errorMessage }
      }
    },
  },
})

export { type Pitch, PitchType }

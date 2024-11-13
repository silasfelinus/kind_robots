import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { usePromptStore } from './promptStore'
import { performFetch, handleError } from './utils'
import type { Pitch, Art } from '@prisma/client' // Import as type

export enum PitchType {
  ARTPITCH = 'ARTPITCH',
  BRAINSTORM = 'BRAINSTORM',
  BOT = 'BOT',
  ARTGALLERY = 'ARTGALLERY',
  INSPIRATION = 'INSPIRATION',
  RANDOMLIST = 'RANDOMLIST',
  TEXTPITCH = 'TEXTPITCH',
  TITLE = 'TITLE',
}
const isClient = typeof window !== 'undefined'

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    selectedPitches: [] as Pitch[],
    selectedPitchType: null as PitchType | null,
    isInitialized: false,
    galleryArt: [] as Art[],
    selectedTitle: null as Pitch | null,
    newestPitches: [] as Pitch[], // New array to hold the latest pitches received
  }),

  getters: {
    pitchTypes: () => Object.values(PitchType), // Enum values as an array
    selectedPitch: (state) => state.selectedPitches[0] || null,
    selectedPitchId: (state) => state.selectedPitches[0]?.id || null,
    getPitchesByType: (state) => (pitchType: PitchType) =>
      state.pitches.filter((pitch) => pitch.PitchType === pitchType),
    getPitchesBySelectedType: (state) =>
      state.selectedPitchType
        ? state.pitches.filter(
            (pitch) => pitch.PitchType === state.selectedPitchType,
          )
        : [],
    brainstormPitches: (state) =>
      state.pitches.filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM),
    titles: (state) =>
      state.pitches.filter((pitch) => pitch.PitchType === PitchType.TITLE),

    pitchesByTitle: (state) =>
      state.pitches.reduce((grouped: Record<string, Pitch[]>, pitch) => {
        const title = pitch.title || 'Untitled'
        grouped[title] = grouped[title] || []
        grouped[title].push(pitch)
        return grouped
      }, {}),
    publicPitches: (state) => {
      const userStore = useUserStore()
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },
    selectedTitlePitches: (state) =>
      state.selectedTitle
        ? state.pitches.filter(
            (pitch) => pitch.title === state.selectedTitle?.title,
          )
        : [],

    // 4. Newest Pitches: Style returned newest pitches differently
    newestPitchesDisplay: (state) =>
      state.newestPitches.map((pitch) => ({
        ...pitch,
        isNewest: true,
      })),
  },

  actions: {
    async addTitle(newTitleData: { title: string; PitchType: PitchType }) {
      try {
        const response = await performFetch<Pitch>('/api/pitches', {
          method: 'POST',
          body: JSON.stringify(newTitleData),
        })

        if (response.success && response.data) {
          this.pitches.push(response.data)
          return { success: true, message: 'Title created successfully' }
        } else {
          return {
            success: false,
            message: response.message || 'Failed to create title',
          }
        }
      } catch (error) {
        handleError(error, 'creating title')
        return { success: false, message: 'Failed to create title' }
      }
    },
    async initializePitches() {
      if (isClient && !this.isInitialized) {
        await this.fetchPitches()
        this.isInitialized = true
      }
    },

    setSelectedPitch(pitchId: number) {
      const pitch = this.pitches.find((p) => p.id === pitchId)
      if (pitch) this.selectedPitches = [pitch]
    },

    setSelectedPitchType(pitchType: PitchType | null) {
      this.selectedPitchType = pitchType
    },

    async fetchRandomPitches(count: number) {
      return handleError(async () => {
        const response = await performFetch<Pitch[]>(
          '/api/pitches/random?count=' + count,
        )
        if (response.success && response.data) {
          this.selectedPitches = response.data
        } else {
          throw new Error(response.message || 'Failed to fetch random pitches')
        }
      }, 'fetching random pitches')
    },
    setTitle(titleId: number | null) {
      if (titleId === null) {
        this.selectedTitle = null
      } else {
        const title = this.pitches.find(
          (pitch) =>
            pitch.id === titleId && pitch.PitchType === PitchType.TITLE,
        )
        if (title) {
          this.selectedTitle = title
        } else {
          console.warn(
            `Title with ID ${titleId} not found or is not of type TITLE`,
          )
        }
      }
    },

    async fetchBrainstormPitches() {
      const promptStore = usePromptStore()
      const exampleContent =
        promptStore.currentPrompt ||
        'slogans for our anti-malaria fundraiser at http://againstmalaria.com/amibot'

      const examples = this.selectedPitches.length
        ? this.selectedPitches.map((pitch) => ({
            input: `Topic: ${pitch.title || 'Creative Idea'}`,
            output: `Idea: ${pitch.description || 'A sample pitch description for the topic.'}`,
          }))
        : [
            {
              input: 'Topic: Anti-malaria fundraiser',
              output: 'Idea: A creative slogan for malaria awareness',
            },
          ]

      return handleError(async () => {
        const response = await performFetch<Pitch[]>(
          '/api/botcafe/brainstorm',
          {
            method: 'POST',
            body: JSON.stringify({
              n: 5,
              content: `Please send an idea for a creative brainstorm for this topic: ${exampleContent}`,
              max_tokens: 500,
              examples: examples,
            }),
          },
        )

        if (response.success && response.data) {
          this.newestPitches = response.data // Store new pitches in newestPitches
          this.addPitches(response.data) // Add new pitches to the main pitches array
        } else {
          throw new Error(
            response.message || 'Failed to fetch brainstorm pitches',
          )
        }
      }, 'fetching brainstorm pitches')
    },

    addPitches(newPitches: Pitch[]) {
      const pitchesToAdd = newPitches.filter(
        (newPitch) => !this.pitches.find((pitch) => pitch.id === newPitch.id),
      )

      this.pitches.push(...pitchesToAdd)

      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

      // Do not auto-select new pitches; update selectedPitches only with the latest brainstorm pitches
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
      return handleError(async () => {
        const response = await performFetch<Pitch[]>('/api/pitches')
        if (response.success && response.data) {
          this.pitches = response.data
          if (isClient)
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
        } else {
          throw new Error(response.message || 'Failed to fetch pitches')
        }
      }, 'fetching pitches')
    },

    async fetchPitchById(pitchId: number) {
      return handleError(async () => {
        const response = await performFetch<Pitch>(`/api/pitches/${pitchId}`)
        if (response.success && response.data) {
          // Avoid duplicates by checking if the pitch already exists
          const existingPitch = this.pitches.find(
            (pitch) => pitch.id === pitchId,
          )
          if (!existingPitch) {
            this.pitches.push(response.data)
          }
          return response.data
        }
        throw new Error(response.message || 'Pitch not found')
      }, `fetching pitch by ID: ${pitchId}`)
    },

    async createPitch(
      newPitch: Partial<Pitch>,
    ): Promise<{ success: boolean; message: string }> {
      try {
        const response = await performFetch<Pitch>('/api/pitches', {
          method: 'POST',
          body: JSON.stringify(newPitch),
        })
        if (response.success && response.data) {
          // Add the new pitch to the list and save locally
          this.pitches.push(response.data)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch created successfully' }
        } else {
          throw new Error(response.message || 'Pitch creation failed')
        }
      } catch (err) {
        handleError(err, 'creating pitch')
        return { success: false, message: 'Pitch creation failed' }
      }
    },

    async updatePitch(pitchId: number, updates: Partial<Pitch>) {
      return handleError(async () => {
        const response = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)

        if (response.success && response.data && index !== -1) {
          this.pitches[index] = {
            ...this.pitches[index],
            ...response.data,
          }

          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }

          return { success: true, message: 'Pitch updated successfully' }
        }

        throw new Error(response.message || 'Pitch update failed')
      }, `updating pitch ID: ${pitchId}`)
    },

    async deletePitch(pitchId: number) {
      return handleError(async () => {
        const response = await performFetch(`/api/pitches/${pitchId}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.pitches = this.pitches.filter((pitch) => pitch.id !== pitchId)
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
          return { success: true, message: 'Pitch deleted successfully' }
        }
        throw new Error(response.message || 'Pitch delete failed')
      }, `deleting pitch ID: ${pitchId}`)
    },

    async fetchArtForPitch(pitchId: number) {
      return handleError(async () => {
        const response = await performFetch<Art[]>(
          `/api/pitches/art/${pitchId}`,
        )
        if (response.success && response.data) {
          this.galleryArt = response.data
        } else {
          throw new Error(response.message || 'Failed to fetch art for pitch')
        }
      }, 'fetching art for pitch')
    },

    // New utility function for clearing local storage when data changes
    clearLocalStorage() {
      if (isClient) {
        localStorage.removeItem('pitches')
        localStorage.removeItem('selectedPitches')
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem(
          'selectedPitches',
          JSON.stringify(this.selectedPitches),
        )
      }
    },
  },
})

export { type Pitch }

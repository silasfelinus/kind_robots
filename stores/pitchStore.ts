import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { usePromptStore } from './promptStore'
import { performFetch, handleError } from './utils'
import type { Pitch, Art } from '@prisma/client'

const isClient = typeof window !== 'undefined'

export enum PitchTypeEnum {
  ARTPITCH = 'Art Pitch',
  BRAINSTORM = 'Brainstorm',
  BOT = 'Bot',
  ARTGALLERY = 'Art Gallery',
  INSPIRATION = 'Inspiration',
  TITLE = 'Title',
}

export const pitchTypeMap: Record<string, PitchTypeEnum> = {
  ARTPITCH: PitchTypeEnum.ARTPITCH,
  BRAINSTORM: PitchTypeEnum.BRAINSTORM,
  BOT: PitchTypeEnum.BOT,
  ARTGALLERY: PitchTypeEnum.ARTGALLERY,
  INSPIRATION: PitchTypeEnum.INSPIRATION,
  TITLE: PitchTypeEnum.TITLE,
}

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    selectedPitches: [] as Pitch[],
    selectedPitchType: null as PitchTypeEnum | null,
    isInitialized: false,
    galleryArt: [] as Art[],
    selectedTitle: null as Pitch,
    brainstormResponse: {} as { success: boolean; data: Pitch[] | null; message: string | null }, // Updated to an object for development access
 
  }),

  getters: {
    pitchTypes: () => Object.values(PitchTypeEnum),
    selectedPitch: (state) => state.selectedPitches[0] || null,
    selectedPitchId: (state) => state.selectedPitches[0]?.id || null,
    getPitchesByType: (state) => (pitchType: PitchTypeEnum) =>
      state.pitches.filter(
        (pitch) => pitchTypeMap[pitch.PitchType] === pitchType,
      ),
    getPitchesBySelectedType: (state) =>
      state.selectedPitchType
        ? state.pitches.filter(
            (pitch) =>
              pitchTypeMap[pitch.PitchType] === state.selectedPitchType,
          )
        : [],
    brainstormPitches: (state) =>
      state.pitches.filter((pitch) => pitch.PitchType === 'BRAINSTORM'),
  titles: (state) =>
    state.pitches.filter((pitch) => pitch.PitchType === PitchTypeEnum.TITLE),

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

  // 3. Selected Title Pitches: Fetch all pitches associated with the selected title
  selectedTitlePitches: (state) =>
    state.selectedTitle
      ? state.pitches.filter((pitch) => pitch.title === state.selectedTitle.title)
      : [],

  // 4. Highlighted Return Pitches: Style returned pitches differently
  highlightedReturnPitches: (state) =>
    state.selectedPitches.map((pitch) => ({
      ...pitch,
      isHighlighted: true,
    })),
  },

  actions: {
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

    setSelectedPitchType(pitchType: PitchTypeEnum | null) {
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
          this.brainstormResponse = { success: true, data: response.data, message: null }
          this.addPitches(response.data, true)  // Pass true to mark as highlighted
        } else {
          this.brainstormResponse = { success: false, data: null, message: response.message || 'Failed to fetch brainstorm pitches' }
          throw new Error(this.brainstormResponse.message)
        }
      }, 'fetching brainstorm pitches')
    },

    addPitches(newPitches: Pitch[], highlight = false) {
      const pitchesToAdd = newPitches
        .filter((newPitch) => !this.pitches.find((pitch) => pitch.id === newPitch.id))
        .map((pitch) => ({
          ...pitch,
          isHighlighted: highlight,  // Add a highlighted flag if specified
        }))

      this.pitches.push(...pitchesToAdd)

      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === 'BRAINSTORM')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

      this.selectedPitches = brainstormPitches.slice(0, 5)

      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem('selectedPitches', JSON.stringify(this.selectedPitches))
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
          this.pitches.push(response.data)
          if (isClient)
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
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
        return { success: false, message: 'Pitch creation failed' } // Provide failure response
      }
    },

    async updatePitch(pitchId: number, updates: Partial<Pitch>) {
      return handleError(async () => {
        const response = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)

        if (
          response.success &&
          typeof response.data === 'object' &&
          index !== -1 &&
          typeof this.pitches[index] === 'object'
        ) {
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
          if (isClient)
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
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
  },
})

export type { Pitch }

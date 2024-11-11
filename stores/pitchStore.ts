import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Pitch, Art } from '@prisma/client'

const isClient = typeof window !== 'undefined'

export enum PitchTypeEnum {
  ARTPITCH = 'Art Pitch',
  BRAINSTORM = 'Brainstorm',
  BOT = 'Bot',
  ARTGALLERY = 'Art Gallery',
  INSPIRATION = 'Inspiration',
}

export const pitchTypeMap: Record<string, PitchTypeEnum> = {
  ARTPITCH: PitchTypeEnum.ARTPITCH,
  BRAINSTORM: PitchTypeEnum.BRAINSTORM,
  BOT: PitchTypeEnum.BOT,
  ARTGALLERY: PitchTypeEnum.ARTGALLERY,
  INSPIRATION: PitchTypeEnum.INSPIRATION,
}

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    selectedPitches: [] as Pitch[],
    selectedPitchType: null as PitchTypeEnum | null,
    isInitialized: false,
    galleryArt: [] as Art[],
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
  return handleError(async () => {
    const response = await performFetch<String[]>('/api/botcafe/brainstorm', {
      method: 'POST',
      body: JSON.stringify({
        n: 5,
        content: '1 more original brainstorm.',
        max_tokens: 500,
      }),
    })

    if (response.success && response.data) {
      const newIdeas = response.data
      this.addPitches(newIdeas)
    } else {
      throw new Error(
        response.message || 'Failed to fetch brainstorm pitches',
      )
    }
  }, 'fetching brainstorm pitches')
},


    addPitches(newPitches: Pitch[]) {
      this.pitches.push(
        ...newPitches.filter(
          (newPitch) => !this.pitches.find((pitch) => pitch.id === newPitch.id),
        ),
      )

      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === 'BRAINSTORM')
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
      return handleError(async () => {
        const response = await performFetch<Pitch[]>(
          '/api/pitches',
        )
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
        const response = await performFetch<Pitch>(
          `/api/pitches/${pitchId}`,
        )
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
        const response = await performFetch<Pitch>(
          `/api/pitches/${pitchId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          },
        )
        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)
        if (response.success && response.data?.pitch && index !== -1) {
          this.pitches[index] = {
            ...this.pitches[index],
            ...response.data.pitch,
          }
          if (isClient)
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
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

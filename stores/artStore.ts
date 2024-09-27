import { defineStore } from 'pinia'
import type { Art, Reaction, ArtImage } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

const isClient = import.meta.client

export interface GenerateArtData {
  title?: string
  promptString: string
  userId?: number
  pitchId?: number
  galleryId?: number
  channelId?: number
  checkpoint?: string
  sampler?: string
  steps?: number
  designer?: string
  cfg?: number
  cfgHalf?: boolean
  isMature?: boolean
  isPublic?: boolean
}

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    artAssets: [] as Art[],
    Reactions: [] as Reaction[],
    tags: [] as Tag[],
    selectedArt: null as Art | null,
    artImages: [] as ArtImage[],
  }),
  actions: {
    init() {
      if (this.artAssets.length === 0) {
        this.fetchAllArt()
      }
    },
    selectArt(artId: number) {
      const foundArt = this.artAssets.find((art: Art) => art.id === artId)
      this.selectedArt = foundArt || null
      if (!foundArt) {
        console.warn(`Art with id ${artId} not found.`)
      }
    },
    async fetchArtByUserId(userId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/art/user/${userId}`)
        if (!response.ok) {
          const errorResponse = await response.json()
          throw new Error(errorResponse.message)
        }
        const data = await response.json()
        this.artAssets = data.art
      } catch (error: unknown) {
        if (error instanceof Error) {
          errorStore.setError(ErrorType.NETWORK_ERROR, error.message)
        } else {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            'An unexpected error occurred',
          )
        }
      }
    },
    async fetchAllArt() {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art')
          if (response.ok) {
            const data = await response.json()
            this.artAssets = data.artEntries
            if (isClient) {
              localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
            }
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art.',
      )
    },
    getArtById(id: number): Art | undefined {
      return this.artAssets.find((art: Art) => art.id === id)
    },
    getReactionsById(id: number): Reaction[] {
      return this.Reactions.filter(
        (reaction: Reaction) => reaction.artId === id,
      )
    },
    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag: Tag) => tag.id === id)
    },
    getArtImagesById(artId: number): ArtImage[] {
      return this.artImages.filter((image: ArtImage) => image.artId === artId)
    },
    async deleteArt(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`, {
            method: 'DELETE',
          })
          if (response.ok) {
            this.artAssets = this.artAssets.filter((art: Art) => art.id !== id)
            if (isClient) {
              localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
            }
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete art.',
      )
    },
    getArtByPitchId(pitchId: number): Art[] {
      return this.artAssets.filter((art: Art) => art.pitchId === pitchId)
    },
    async createReaction(reactionData: Reaction): Promise<Reaction | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/reactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reactionData),
          })
          if (response.ok) {
            const { newReaction } = await response.json()
            return newReaction
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to create reaction.',
      )
    },
    async editReaction(
      id: number,
      reactionData: Reaction,
    ): Promise<Reaction | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/reactions/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reactionData),
          })
          if (response.ok) {
            return await response.json()
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update reaction.',
      )
    },
    async deleteReaction(id: number): Promise<boolean> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/reactions/${id}`, {
            method: 'DELETE',
          })
          if (response.ok) {
            return true
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete reaction.',
      )
    },
    async fetchArtById(id: number): Promise<Art | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`)
          if (response.ok) {
            return await response.json()
          } else {
            return null
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art by ID.',
      )
    },
    async generateArt(
      data: GenerateArtData,
    ): Promise<{ success: boolean; message?: string; newArt?: Art }> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          if (response.ok) {
            const result = await response.json()
            return { success: true, newArt: result.newArt }
          } else {
            const errorResponse = await response.json()
            return { success: false, message: errorResponse.message }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to generate art.',
      )
    },
  },
})

export type { Art, ArtImage, Reaction }
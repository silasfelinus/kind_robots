import { defineStore } from 'pinia'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

interface ExtendedArt extends Art {
  title?: string // Optional, as not all art may have a title
  url?: string // Add the url property here if it exists
  description?: string // Add the description property here if it exists
  gallery?: {
    highlightImage?: string | null
    name?: string | null
    description?: string | null
  }
}

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
    reactions: [] as Reaction[],
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
    async uploadImage(formData: FormData) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art/upload', {
            method: 'POST',
            body: formData,
          })
          if (response.ok) {
            const newArt = await response.json()
            this.artAssets.push(newArt) // Optionally add to local state
            return newArt
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to upload image.',
      )
    },

    selectArt(artId: number) {
      const foundArt = this.artAssets.find((art) => art.id === artId)
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
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          (error as Error).message || 'An unexpected error occurred',
        )
      }
    },

    async fetchAllArt() {
      const errorStore = useErrorStore()
      if (this.artAssets.length > 0) return // Prevent refetching

      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art')
          if (response.ok) {
            const data = await response.json()

            // Assuming API provides galleryId
            this.artAssets = await Promise.all(
              data.artEntries.map(async (art: ExtendedArt) => {
                const galleryResponse = await fetch(
                  `/api/galleries/${art.galleryId}`,
                )
                const gallery = galleryResponse.ok
                  ? await galleryResponse.json()
                  : null
                return { ...art, gallery }
              }),
            )
            if (typeof window !== 'undefined' && window.localStorage)
              localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
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
      return this.artAssets.find((art) => art.id === id)
    },

    getReactionsById(id: number): Reaction[] {
      return this.reactions.filter((reaction) => reaction.artId === id)
    },

    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag) => tag.id === id)
    },

    getArtImagesById(artId: number): ArtImage[] {
      return this.artImages.filter((image) => image.artId === artId)
    },

    async deleteArt(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`, { method: 'DELETE' })
          if (response.ok) {
            this.artAssets = this.artAssets.filter((art) => art.id !== id)
            if (typeof window !== 'undefined' && window.localStorage)
              localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
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
      return this.artAssets.filter((art) => art.pitchId === pitchId)
    },

    async createReaction(reactionData: Reaction): Promise<Reaction | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/reactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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

export type { Art, ArtImage }

import { defineStore } from 'pinia'
import type { Art, ArtReaction } from '@prisma/client'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const isClient = import.meta.client  // Update to use Nuxt's process.client

export interface GenerateArtData {
  title?: string
  prompt: string
  description?: string
  flavorText?: string
  userId?: number
  pitchId?: number
  channelId?: number
  promptId?: number
  galleryId?: number
  designerName?: string
  channelName?: string
  userName?: string
  pitchName?: string
  galleryName?: string
  isMature?: boolean
  isPublic?: boolean
  isOrphan?: boolean
}

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    artAssets: [] as Art[],
    artReactions: [] as ArtReaction[],
    tags: [] as Tag[],
    selectedArt: null as Art | null,
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
    async fetchAllArt() {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
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
      }, ErrorType.NETWORK_ERROR, 'Failed to fetch art.')
    },
    getArtById(id: number): Art | undefined {
      return this.artAssets.find((art: Art) => art.id === id)
    },
    getArtReactionsById(id: number): ArtReaction[] {
      return this.artReactions.filter((reaction: ArtReaction) => reaction.artId === id)
    },
    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag: Tag) => tag.id === id)
    },
    async deleteArt(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
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
      }, ErrorType.NETWORK_ERROR, 'Failed to delete art.')
    },
    getArtByPitchId(pitchId: number): Art[] {
      return this.artAssets.filter((art: Art) => art.pitchId === pitchId)
    },
    async createArtReaction(reactionData: ArtReaction): Promise<ArtReaction | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (response.ok) {
          const { newReaction } = await response.json()
          console.log('New reaction created:', newReaction)
          return newReaction
        } else {
          const errorResponse = await response.json()
          throw new Error(errorResponse.message)
        }
      }, ErrorType.NETWORK_ERROR, 'Failed to create reaction.')
    },
    async editArtReaction(id: number, reactionData: ArtReaction): Promise<ArtReaction | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        const response = await fetch(`/api/reactions/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (response.ok) {
          const updatedReaction = await response.json()
          console.log('Reaction updated successfully:', updatedReaction)
          return updatedReaction
        } else {
          const errorResponse = await response.json()
          throw new Error(errorResponse.message)
        }
      }, ErrorType.NETWORK_ERROR, 'Failed to update reaction.')
    },
    async deleteArtReaction(id: number): Promise<boolean> {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        const response = await fetch(`/api/reactions/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          console.log(`Reaction with ID ${id} deleted successfully.`)
          return true
        } else {
          const errorResponse = await response.json()
          throw new Error(errorResponse.message)
        }
      }, ErrorType.NETWORK_ERROR, 'Failed to delete reaction.')
    },
    async fetchArtById(id: number): Promise<Art | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        const response = await fetch(`/api/art/${id}`)
        if (response.ok) {
          return await response.json()
        } else {
          console.error(`Failed to fetch art with ID ${id}`)
          return null
        }
      }, ErrorType.NETWORK_ERROR, 'Failed to fetch art by ID.')
    },
    async generateArt(data: GenerateArtData): Promise<{ success: boolean; message?: string; newArt?: Art }> {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
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
      }, ErrorType.NETWORK_ERROR, 'Failed to generate art.')
    },
  },
})

export type { Art, ArtReaction, Tag }

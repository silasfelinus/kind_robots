// /stores/artStore.ts
import { defineStore } from 'pinia'
import { Art, ArtReaction, Tag } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'

const isClient = typeof window !== 'undefined'

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    artAssets: [] as Art[],
    artReactions: [] as ArtReaction[],
    tags: [] as Tag[],
    selectedArt: null as Art | null
  }),
  actions: {
    init() {
      if (this.artAssets.length === 0) {
        this.fetchAllArt()
      }
    },
    selectArt(artId: number) {
      const foundArt = this.artAssets.find((art) => art.id === artId)
      if (foundArt) {
        this.selectedArt = foundArt
      } else {
        console.warn(`Art with id ${artId} not found.`)
      }
    },
    async fetchAllArt() {
      try {
        const response = await fetch('https://kindrobots.org/api/art')
        if (response.ok) {
          const data = await response.json()
          this.artAssets = data.artEntries
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in fetchAllArt:', handledError.message)
      }
    },
    getArtById(id: number): Art | undefined {
      return this.artAssets.find((art) => art.id === id)
    },

    getArtReactionsById(id: number): ArtReaction[] | undefined {
      return this.artReactions.filter((artReaction) => artReaction.id === id)
    },

    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag) => tag.id === id)
    },

    async deleteArt(id: number) {
      try {
        const response = await fetch(`https://kindrobots.org/api/art/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const index = this.artAssets.findIndex((art) => art.id === id)
          if (index !== -1) {
            this.artAssets.splice(index, 1)
          }
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in deleteArt:', handledError.message)
      }
    },

    async createArtReaction(reactionData: ArtReaction) {
      try {
        const response = await fetch('https://kindrobots.org/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reactionData)
        })

        if (response.ok) {
          const { newReaction } = await response.json()
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in createArtReaction:', handledError.message)
      }
    },
    async generateArt(prompt: string, galleryName: string = 'cafefred', pitch: string) {
      try {
        const response = await fetch('https://kindrobots.org/api/art/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            galleryName,
            pitch
          })
        })

        if (response.ok) {
          const newArt = await response.json()
          this.artAssets.push(newArt.id, newArt)
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(Array.from(this.artAssets.entries())))
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in generateArt:', handledError.message)
      }
    },

    async editArtReaction(id: number, reactionData: ArtReaction) {
      try {
        const response = await fetch(`https://kindrobots.org/api/reactions/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reactionData)
        })
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in editArtReaction:', handledError.message)
      }
    },

    async deleteArtReaction(id: number) {
      try {
        const response = await fetch(`https://kindrobots.org/api/reactions/${id}`, {
          method: 'DELETE'
        })
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in deleteArtReaction:', handledError.message)
      }
    },
    async fetchArtById(id: number): Promise<Art | null> {
      try {
        const response = await fetch(`https://kindrobots.org/api/art/${id}`)
        if (response.ok) {
          const art = await response.json()
          return art
        }
        return null
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in fetchArtById:', handledError.message)
        return null
      }
    }
  }
})

export type { Art, ArtReaction }

// /stores/artStore.ts
import { defineStore } from 'pinia'
import { Art, ArtReaction, Tag } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error' // Import your centralized error handler
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'

interface ExtendedArt extends Art {
  ArtReaction?: ArtReaction[]
  Tag?: Tag[]
}

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    artAssets: [] as ExtendedArt[]
  }),
  actions: {
    init() {
      // Fetch initial data only if the arrays are empty
      if (this.artAssets.length === 0) {
        this.fetchAllArt()
      }
    },
    async fetchAllArt() {
      try {
        const response = await fetch('https://kindrobots.org/api/art')
        if (response.ok) {
          const data = await response.json()
          this.artAssets = data.artEntries // Make sure to assign artEntries
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in fetchAllArt:', handledError.message)
      }
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
            if (isClient) {
              localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
            }
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
    async generateArt(prompt: string, galleryName: string = 'cafefred') {
      try {
        const response = await fetch('https://kindrobots.org/api/art/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            galleryName
          })
        })

        if (response.ok) {
          const newArt = await response.json()
          this.artAssets.push(newArt)
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
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
    },
    async getArtByPromptId(promptId: number) {
      try {
        const response = await fetch(`https://kindrobots.org/api/art/prompts/${promptId}`)
        if (response.ok) {
          const { success, prompt, artIds } = await response.json()
          if (success && artIds.length > 0) {
            // Fetch individual art entries by their IDs and update the store
            const artEntries = await Promise.all(artIds.map((id: number) => this.fetchArtById(id)))
            this.artAssets = artEntries
          } else {
            // Handle the case where artIds is empty
            console.warn(`No art entries found for the prompt: ${prompt}`)
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in getArtByPromptId:', handledError.message)
      }
    },
    async getArtReactionsByArtId(artId: number) {
      try {
        const response = await fetch(`https://kindrobots.org/api/art/${artId}`)
        if (response.ok) {
          const reactions = await response.json()
          const artIndex = this.artAssets.findIndex((art) => art.id === artId)
          if (artIndex !== -1) {
            this.artAssets[artIndex].ArtReaction = reactions // Update only the ArtReaction for the specific art entry
          }
        }
      } catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error in getArtReactionsByArtId:', handledError.message)
      }
    }
  }
})

export type { Art, ArtReaction, ExtendedArt }

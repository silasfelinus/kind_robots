// /stores/artStore.ts
import { defineStore } from 'pinia'
import type { Art, ArtReaction, Tag } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'

const isClient = typeof window !== 'undefined'

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
      const foundArt = this.artAssets.find(art => art.id === artId)
      if (foundArt) {
        this.selectedArt = foundArt
      }
      else {
        console.warn(`Art with id ${artId} not found.`)
      }
    },
    async fetchAllArt() {
      try {
        const response = await fetch('/api/art')
        if (response.ok) {
          const data = await response.json()
          this.artAssets = data.artEntries
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in fetchAllArt:', handledError.message)
      }
    },
    getArtById(id: number): Art | undefined {
      return this.artAssets.find(art => art.id === id)
    },

    getArtReactionsById(id: number): ArtReaction[] | undefined {
      return this.artReactions.filter(artReaction => artReaction.id === id)
    },

    getTagsById(id: number): Tag | undefined {
      return this.tags.find(tag => tag.id === id)
    },

    async deleteArt(id: number) {
      try {
        const response = await fetch(`/api/art/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const index = this.artAssets.findIndex(art => art.id === id)
          if (index !== -1) {
            this.artAssets.splice(index, 1)
          }
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in deleteArt:', handledError.message)
      }
    },
    getArtByPitchId(pitchId: number): Art[] {
      return this.artAssets.filter(art => art.pitchId === pitchId)
    },

async createArtReaction(reactionData: ArtReaction) {
  try {
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reactionData),
    });

    if (response.ok) {
      const { newReaction } = await response.json();
      console.log('New reaction created:', newReaction);
      return newReaction; // Optionally return the new reaction for further use
    } else {
      // Handle non-OK response statuses
      const errorResponse = await response.json();
      console.error('Failed to create reaction:', errorResponse.message);
      throw new Error(errorResponse.message);
    }
  } catch (error: any) {
    const handledError = errorHandler(error);
    console.error('Error in createArtReaction:', handledError.message);
    throw handledError; // Optionally re-throw the error for further handling
  }
},

    async generateArt(data: GenerateArtData): Promise<Art | null> {
      try {
        const response = await fetch('/api/art/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          const newArt: Art = await response.json()
          this.artAssets[newArt.id] = newArt // Using object property assignment
          if (isClient) {
            localStorage.setItem('artAssets', JSON.stringify(this.artAssets))
          }
          return newArt
        }
        else {
          const handledError = errorHandler({
            message: 'Response not OK',
            statusCode: response.status,
          })
          console.error('Error in generateArt:', handledError.message)
          return null
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in generateArt:', handledError.message)
        return null
      }
    },

    async editArtReaction(id: number, reactionData: ArtReaction) {
      try {
        const response = await fetch(`/api/reactions/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        });
    
        if (response.ok) {
          const updatedReaction = await response.json();
          console.log('Reaction updated successfully:', updatedReaction);
          return updatedReaction; // Optionally return the updated reaction for further use
        } else {
          // Handle non-OK response statuses
          const errorResponse = await response.json();
          console.error('Failed to update reaction:', errorResponse.message);
          throw new Error(errorResponse.message);
        }
      } catch (error: any) {
        const handledError = errorHandler(error);
        console.error('Error in editArtReaction:', handledError.message);
        throw handledError; // Optionally re-throw the error for further handling
      }
    },
    

    async deleteArtReaction(id: number) {
      try {
        const response = await fetch(`/api/reactions/${id}`, {
          method: 'DELETE',
        });
    
        if (response.ok) {
          console.log(`Reaction with ID ${id} deleted successfully.`);
          return true; // Optionally return a boolean to indicate success
        } else {
          // Handle non-OK response statuses
          const errorResponse = await response.json();
          console.error(`Failed to delete reaction with ID ${id}:`, errorResponse.message);
          throw new Error(errorResponse.message);
        }
      } catch (error: any) {
        const handledError = errorHandler(error);
        console.error('Error in deleteArtReaction:', handledError.message);
        throw handledError; // Optionally re-throw the error for further handling
      }
    },
    
    async fetchArtById(id: number): Promise<Art | null> {
      try {
        const response = await fetch(`/api/art/${id}`)
        if (response.ok) {
          const art = await response.json()
          return art
        }
        return null
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in fetchArtById:', handledError.message)
        return null
      }
    },
  },
})

export type { Art, ArtReaction }

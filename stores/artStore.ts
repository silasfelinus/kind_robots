import { defineStore } from 'pinia'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'
import { usePromptStore } from './promptStore'
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'

export interface ArtCollection {
  id: number
  createdAt: Date
  updatedAt: Date | null
  userId: number
  label: string | null
  art: Art[] // Add this line to include the `art` array
}

export interface GenerateArtData {
  title?: string
  promptString: string
  userId?: number
  pitchId?: number
  galleryId?: number
  checkpoint?: string
  sampler?: string
  steps?: number
  designer?: string
  cfg?: number
  cfgHalf?: boolean
  isMature?: boolean
  isPublic?: boolean
  pitch?: string
  artImageId?: number
}

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    art: [] as Art[],
    reactions: [] as Reaction[],
    tags: [] as Tag[],
    artImages: [] as ArtImage[],
    loading: false,
    error: '',
    currentArt: null as Art | null,
    pitch: '',
    collectedArt: [] as Art[],
    isInitialized: false,
    generatedArt: [] as Art[],
    currentPage: 1,
    totalArtCount: 0,
    pageSize: 100,
    collections: [] as ArtCollection[],
    uncollectedArt: [] as Art[],
    currentCollection: null as ArtCollection | null,
  }),

  actions: {
    async initialize() {
      if (this.isInitialized) return
      this.loading = true

      try {
        await this.loadLocalData()
        await this.loadRemoteData()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing art store')
      } finally {
        this.loading = false
      }
    },
    async getOrCreateGeneratedArtCollection(
      userId: number,
    ): Promise<ArtCollection> {
      try {
        let collection = this.collections.find(
          (c) => c.userId === userId && c.label === 'Generated Art',
        )
        if (!collection) {
          const response = await performFetch<ArtCollection>(
            '/api/art/collection',
            {
              method: 'POST',
              body: JSON.stringify({ label: 'Generated Art', userId }),
              headers: { 'Content-Type': 'application/json' },
            },
          )
          if (response.success && response.data) {
            collection = response.data
            this.collections.push(collection)
          } else {
            throw new Error(response.message)
          }
        }
        return collection
      } catch (error) {
        handleError(error, 'getting or creating Generated Art collection')
        throw error
      }
    },
    selectArt(artId: number): void {
      const selectedArt = this.art.find((art) => art.id === artId)
      if (selectedArt) {
        this.currentArt = selectedArt
      } else {
        handleError(
          new Error(`Art with ID ${artId} not found`),
          'selecting art',
        )
      }
    },

    async fetchUncollectedArt() {
      const userStore = useUserStore()
      const userId = userStore.userId

      // Extract art IDs from the user's collections
      const collectedArtIds = this.collections
        .filter((collection: ArtCollection) => collection.userId === userId)
        .flatMap((collection: ArtCollection) =>
          collection.art.map((art: Art) => art.id),
        )

      // Filter and return uncollected art
      return this.art.filter(
        (art) => art.userId === userId && !collectedArtIds.includes(art.id),
      )
    },
    // Action: Get a user's art
    async getUserArt(userId: number): Promise<Art[]> {
      try {
        return this.art.filter((art) => art.userId === userId)
      } catch (error) {
        handleError(error, 'Getting user art')
        return []
      }
    },

    // Action: Get a user's art collections
    async getUserCollections(userId: number): Promise<ArtCollection[]> {
      try {
        return this.collections.filter(
          (collection) => collection.userId === userId,
        )
      } catch (error) {
        handleError(error, 'Getting user collections')
        return []
      }
    },

    // Loading data from localStorage in a separate function to isolate any errors here
    async loadLocalData() {
      try {
        if (isClient) {
          const storedArt = localStorage.getItem('art')
          const storedCollections = localStorage.getItem('collections')

          if (storedArt && storedArt !== 'undefined') {
            this.art = JSON.parse(storedArt)
          }
          if (storedCollections && storedCollections !== 'undefined') {
            this.collections = JSON.parse(storedCollections)
          }
        }
      } catch (error) {
        handleError(error, 'loading local data')
      }
    },
    // Fetching remote data in a separate function with explicit error handling
    async loadRemoteData() {
      try {
        await this.fetchCollections()
        await this.fetchAllArt()
      } catch (error) {
        handleError(error, 'loading remote data')
      }
    },
    async fetchCollections() {
      try {
        const response = await performFetch<ArtCollection[]>(
          '/api/art/collection',
        )
        if (response.success && response.data) {
          this.collections = response.data as ArtCollection[] // Explicit type assertion
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'Fetching collections')
      }
    },

    async createCollection(label: string) {
      try {
        const response = await performFetch<ArtCollection>(
          '/api/art/collection',
          {
            method: 'POST',
            body: JSON.stringify({ label }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          this.collections.push(response.data) // Add the new collection to local state
          this.currentCollection = response.data // Set the current collection
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'Creating collection')
      }
    },

    // Delete a collection
    async deleteCollection(collectionId: number) {
      try {
        const response = await performFetch(
          `/api/art/collection/${collectionId}`,
          {
            method: 'DELETE',
          },
        )
        if (response.success) {
          this.collectedArt = this.collectedArt.filter(
            (col) => col.id !== collectionId,
          )
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'Deleting collection')
      }
    },

    async addArtToCollection({
      artId,
      collectionId,
      label = '',
    }: {
      artId: number
      collectionId?: number
      label?: string
    }) {
      try {
        let targetCollection: ArtCollection | undefined

        // Fetch user info
        const userStore = useUserStore()
        const userId = userStore.userId

        // Determine the collection
        if (collectionId) {
          targetCollection = this.collections.find(
            (collection) => collection.id === collectionId,
          )
          if (!targetCollection) {
            throw new Error(`Collection with ID ${collectionId} not found.`)
          }
        } else {
          // Find collection by label and userId
          targetCollection = this.collections.find(
            (collection) =>
              collection.userId === userId && collection.label === label,
          )

          // Create a new collection if none exists
          if (!targetCollection) {
            const createResponse = await performFetch<ArtCollection>(
              '/api/art/collection',
              {
                method: 'POST',
                body: JSON.stringify({ label, userId }),
                headers: { 'Content-Type': 'application/json' },
              },
            )

            if (createResponse.success && createResponse.data) {
              targetCollection = createResponse.data
              this.collections.push(targetCollection) // Update local store
            } else {
              throw new Error(
                createResponse.message || 'Failed to create a new collection.',
              )
            }
          }
        }

        if (!targetCollection) {
          throw new Error('Failed to find or create the target collection.')
        }

        // Add art to the collection
        const addResponse = await performFetch('/api/art/collection', {
          method: 'POST',
          body: JSON.stringify({
            artId,
            collectionId: targetCollection.id,
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!addResponse.success) {
          throw new Error(
            addResponse.message || 'Failed to add art to the collection.',
          )
        }

        // Confirm art is added to the collection locally
        const isArtInCollection = targetCollection.art?.some(
          (art) => art.id === artId,
        )
        if (!isArtInCollection) {
          targetCollection.art = targetCollection.art || []
          targetCollection.art.push({ id: artId } as Art) // Add locally
        }

        console.log(
          `Art with ID ${artId} successfully added to collection "${targetCollection.label}".`,
        )
      } catch (error) {
        handleError(error, 'Adding art to collection')
      }
    },

    // Remove art from a collection
    async removeArtFromCollection(artId: number, collectionId: number) {
      try {
        const response = await performFetch(
          `/api/art/collection/${collectionId}/${artId}`,
          {
            method: 'DELETE',
          },
        )
        if (response.success) {
          await this.fetchCollections() // Refresh collections
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'Removing art from collection')
      }
    },

    async fetchCollectedArt(userId: number): Promise<void> {
      try {
        const response = await performFetch<Art[]>(
          `/api/art/user/${userId}/collected`,
        )
        if (response.success) {
          this.collectedArt = response.data || []
          if (isClient)
            localStorage.setItem(
              'collectedArt',
              JSON.stringify(this.collectedArt),
            )
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching collected art')
      }
    },
    getArtImageById(artId: number): ArtImage | undefined {
      return this.artImages.find((image: ArtImage) => image.artId === artId)
    },
    // Updating the art image and the art relationship
    async updateArtImageWithArtId(
      artImageId: number,
      artId: number,
    ): Promise<void> {
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art/image/${artImageId}', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ artId }), // Update the artId in the ArtImage
          })

          if (response.ok) {
            // Update the art entity with the new artImageId
            const art = this.art.find((art: Art) => art.id === artId)
            if (art) {
              art.artImageId = artImageId
            }
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update ArtImage with artId.',
      )
    },

    // Get a single ArtImage for a given artId from the local state
    getArtImageByArtId(artId: number): ArtImage | undefined {
      return this.artImages.find((image: ArtImage) => image.artId === artId)
    },

    async fetchArtImageByArtId(artId: number): Promise<ArtImage | null> {
      const artImage = this.getArtImageByArtId(artId)
      if (artImage) return artImage

      try {
        const response = await performFetch<ArtImage>(
          `/api/art/image/imagebyart/${artId}`,
        )
        if (response.success && response.data) {
          this.artImages.push(response.data)
          await this.updateArtImageId(artId, response.data.id)
          return response.data
        }
        throw new Error(response.message)
      } catch (error) {
        handleError(error, 'fetching art image by art ID')
        return null
      }
    },

    async updateArtImageId(artId: number, artImageId: number): Promise<void> {
      try {
        const response = await performFetch(`/api/art/${artId}/image`, {
          method: 'PATCH',
          body: JSON.stringify({ artImageId }),
        })
        if (response.success) {
          const art = this.art.find((art) => art.id === artId)
          if (art) art.artImageId = artImageId
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'updating artImageId')
      }
    },

    async fetchAllArt(): Promise<void> {
      try {
        const response = await performFetch<Art[]>('/api/art')
        if (response.success) {
          this.art = response.data || []
          if (isClient) localStorage.setItem('art', JSON.stringify(this.art))
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching all art')
      }
    },

    async createArt(artData: {
      promptString: string
      path: string
      seed: number | null
      steps: number | null
      galleryId: number | null
      promptId: number | null
      pitchId: number | null
      userId: number | null
      designer: string | null
      artImageId: number | null
    }): Promise<Art> {
      try {
        const response = await performFetch<Art>('/api/art/', {
          method: 'POST',
          body: JSON.stringify(artData),
        })

        if (response.success && response.data) {
          this.art.push(response.data)
          return response.data
        }
        throw new Error(response.message)
      } catch (error) {
        handleError(error, 'creating art')
        throw error
      }
    },

    async generateArt(artData?: GenerateArtData): Promise<ApiResponse<Art>> {
      const promptStore = usePromptStore()
      const userStore = useUserStore()
      this.loading = true

      const data: GenerateArtData = {
        promptString: artData?.promptString || promptStore.promptField,
        pitch: artData?.pitch || this.extractPitch(promptStore.promptField),
        userId: artData?.userId || userStore.user?.id || 10,
        galleryId: artData?.galleryId,
        checkpoint: artData?.checkpoint || 'stable-diffusion-v1-4',
        sampler: artData?.sampler || 'k_lms',
        steps: artData?.steps || 50,
        designer: artData?.designer || 'AI Art Designer',
        cfg: artData?.cfg || 7,
        cfgHalf: artData?.cfgHalf || false,
        isMature: artData?.isMature || false,
        isPublic: artData?.isPublic || true,
      }

      if (!this.validatePromptString(data.promptString)) {
        return { success: false, message: 'Invalid prompt' }
      }

      try {
        // Call `performFetch` directly, returning its result
        const response = await performFetch<Art>(
          '/api/art/generate',
          { method: 'POST', body: JSON.stringify(data) },
          3,
          20000,
        )

        if (response.success && response.data) {
          const userId = data.userId || 10
          const collection =
            await this.getOrCreateGeneratedArtCollection(userId)

          // Add to local state
          this.art.push(response.data)
          collection.art.push(response.data) // Add to "Generated Art" collection

          if (isClient) {
            localStorage.setItem('art', JSON.stringify(this.art))
            localStorage.setItem(
              'collections',
              JSON.stringify(this.collections),
            )
          }
        }

        return response // Directly return the response from performFetch
      } catch (error) {
        handleError(error, 'generating art')
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      } finally {
        this.loading = false
      }
    },

    async fetchArtByUserId(userId: number): Promise<void> {
      try {
        const response = await performFetch<Art[]>(`/api/art/user/${userId}`)
        if (response.success) this.art = response.data || []
        else throw new Error(response.message)
      } catch (error) {
        handleError(error, 'fetching art by user ID')
      }
    },

    async deleteArt(id: number) {
      try {
        const response = await performFetch(`/api/art/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.art = this.art.filter((art: Art) => art.id !== id)
          if (isClient) localStorage.setItem('art', JSON.stringify(this.art))
        } else throw new Error(response.message)
      } catch (error) {
        handleError(error, 'deleting art')
      }
    },

    async fetchArtById(id: number): Promise<Art | null> {
      try {
        const response = await performFetch<Art>(`/api/art/${id}`)
        if (response.success) return response.data || null
        else throw new Error(response.message)
      } catch (error) {
        handleError(error, 'fetching art by ID')
        return null
      }
    },

    extractPitch(promptString: string): string {
      return promptString.split(',')[0].trim() || 'Untitled Pitch'
    },
    validatePromptString(prompt: string): boolean {
      const validPattern = /^[a-zA-Z0-9 ,]+$/
      return validPattern.test(prompt)
    },

    async fetchArtImageById(id: number): Promise<ArtImage | null> {
      try {
        const response = await performFetch<ArtImage>(`/api/art/image/${id}`)
        if (response.success && response.data) {
          this.artImages.push(response.data)
          return response.data
        }
        throw new Error(response.message)
      } catch (error) {
        handleError(error, 'fetching art image by ID')
        return null
      }
    },

    async uploadImage(formData: FormData): Promise<void> {
      try {
        console.log('Starting upload with formData:', [...formData.entries()])

        const response = await performFetch<ArtImage>('/api/art/upload', {
          method: 'POST',
          body: formData,
        })

        console.log('Server response:', response)

        if (response.success && response.data) {
          this.artImages.push(response.data)
          console.log('Art image added to store:', response.data)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in uploadImage:', error)
        handleError(error, 'uploading image')
      }
    },
  },
})

export type { Art, ArtImage }

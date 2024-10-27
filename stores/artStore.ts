import { defineStore } from 'pinia'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'

const isClient = typeof window !== 'undefined'

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
  pitch?: string
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
    collectedArt: [] as Art[], // Store user's collected art
    isInitialized: false,
    generatedArt: [] as Art[],
    currentPage: 1, // For pagination
    totalArtCount: 0, // Total art count from the API
    pageSize: 100, // Items per page
  }),
  actions: {
    // Initialize the artStore and load data from localStorage if available
    async initialize() {
      const errorStore = useErrorStore()

      if (this.isInitialized) return

      this.loading = true
      try {
        if (isClient) {
          // Load art, collectedArt, and generatedArt from localStorage
          const storedArt = localStorage.getItem('art')
          const storedCollectedArt = localStorage.getItem('collectedArt')
          const storedGeneratedArt = localStorage.getItem('generatedArt')

          if (storedArt) this.art = JSON.parse(storedArt)
          if (storedCollectedArt)
            this.collectedArt = JSON.parse(storedCollectedArt)
          if (storedGeneratedArt)
            this.generatedArt = JSON.parse(storedGeneratedArt)
        }

        const userStore = useUserStore()
        const userId = userStore.user?.id || 10

        await this.fetchCollectedArt(userId)
        if (this.art.length === 0) await this.fetchAllArt()

        this.isInitialized = true
      } catch (error) {
        errorStore.setError(
          ErrorType.STORE_ERROR,
          error instanceof Error ? error.message : 'Initialization failed.',
        )
      } finally {
        this.loading = false
      }
    },

    // Fetch a user's collected art
    async fetchCollectedArt(userId: number): Promise<void> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/user/${userId}/collected`)
          if (response.ok) {
            const data = await response.json()
            this.collectedArt = data.collectedArt as Art[] // Store collected art

            // Store collected art in localStorage
            if (isClient) {
              localStorage.setItem(
                'collectedArt',
                JSON.stringify(this.collectedArt),
              )
            }
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch collected art.',
      )
    },

    // Fetch all art entries with pagination
    async fetchAllArt(page: number = 1, limit: number = 100): Promise<void> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art?page=${page}&limit=${limit}`)
          if (response.ok) {
            const data = await response.json()
            this.art = data.artEntries as Art[]
            this.totalArtCount = data.totalArtCount

            // Store art in localStorage
            if (isClient) {
              localStorage.setItem('art', JSON.stringify(this.art))
            }

            // Update pagination state
            this.currentPage = page
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art.',
      )
    },

    // Pagination helpers
    hasNextPage(): boolean {
      return this.currentPage * this.pageSize < this.totalArtCount
    },

    hasPreviousPage(): boolean {
      return this.currentPage > 1
    },

    async nextPage() {
      if (this.hasNextPage()) {
        await this.fetchAllArt(this.currentPage + 1)
      }
    },

    async previousPage() {
      if (this.hasPreviousPage()) {
        await this.fetchAllArt(this.currentPage - 1)
      }
    },

    // Simplified createArt action
    async createArt(artData: {
      promptString: string
      path: string
      seed: number | null
      steps: number | null
      channelId: number | null
      galleryId: number | null
      promptId: number | null
      pitchId: number | null
      userId: number | null
      designer: string | null
    }): Promise<Art> {
      const response = await fetch('/api/art/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artData),
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        throw new Error(errorResponse.message)
      }

      const createdArt = await response.json()
      this.art.push(createdArt)

      return createdArt
    },

    async generateArt(artData?: GenerateArtData): Promise<{
      success: boolean
      message?: string
      newArt?: Art
      newArtImage?: ArtImage
    }> {
      const promptStore = usePromptStore()
      const userStore = useUserStore()
      const errorStore = useErrorStore()

      this.loading = true

      const data = {
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

      return errorStore
        .handleError(
          async () => {
            const response = await fetch('/api/art/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })

            if (response.ok) {
              const result = await response.json()

              if (result.art) {
                this.art.push(result.art)
                this.generatedArt.push(result.art)

                if (isClient) {
                  localStorage.setItem('art', JSON.stringify(this.art))
                  localStorage.setItem(
                    'generatedArt',
                    JSON.stringify(this.generatedArt),
                  )
                }

                if (result.artImage) {
                  this.artImages.push(result.artImage)
                }
              }

              return {
                success: true,
                newArt: result.art,
                newArtImage: result.artImage,
              }
            } else {
              const errorResponse = await response.json()
              return { success: false, message: errorResponse.message }
            }
          },
          ErrorType.NETWORK_ERROR,
          'Failed to generate art.',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Select a specific art piece by ID
    selectArt(artId: number) {
      const foundArt = this.art.find((art: Art) => art.id === artId)
      this.currentArt = foundArt || null
      if (!foundArt) {
        console.warn(`Art with id ${artId} not found.`)
      }
    },

    // Fetch art by user ID
    async fetchArtByUserId(userId: number): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/art/user/${userId}`)
        if (!response.ok) {
          const errorResponse = await response.json()
          throw new Error(errorResponse.message)
        }
        const data = await response.json()
        this.art = data.art as Art[]
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        )
      }
    },

    getArtById(id: number): Art | undefined {
      return this.art.find((art: Art) => art.id === id)
    },

    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag: Tag) => tag.id === id)
    },

    getArtImagesById(artId: number): ArtImage[] {
      return this.artImages.filter((image: ArtImage) => image.artId === artId)
    },

    getReactionsById(id: number): Reaction[] {
      return this.reactions.filter(
        (reaction: Reaction) => reaction.artId === id,
      )
    },

    async deleteArt(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`, {
            method: 'DELETE',
          })
          if (response.ok) {
            this.art = this.art.filter((art: Art) => art.id !== id)
            if (isClient) {
              localStorage.setItem('art', JSON.stringify(this.art))
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

    extractPitch(promptString: string): string {
      return promptString.split(',')[0].trim() || 'Untitled Pitch'
    },

    validatePromptString(prompt: string): boolean {
      const validPattern = /^[a-zA-Z0-9 ,]+$/ // Adjust the pattern as necessary
      return validPattern.test(prompt)
    },

    // Fetch a single art image by its art ID
    async fetchArtImageById(artId: number): Promise<ArtImage | null> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art-image/${artId}`)
          if (response.ok) {
            const artImage = (await response.json()) as ArtImage
            this.artImages.push(artImage) // Store it in the artImages array
            return artImage
          } else {
            return null
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art image by ID.',
      )
    },

    async updateArtImageWithArtId(
      artImageId: number,
      artId: number,
    ): Promise<void> {
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art-image/${artImageId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ artId }), // Update the artId in the ArtImage
          })

          if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update ArtImage with artId.',
      )
    },

    async uploadImage(formData: FormData): Promise<void> {
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          const file = formData.get('image') as File | null
          let fileType = 'png'

          if (file) {
            const fileName = file.name
            const extension = fileName.split('.').pop()?.toLowerCase() || 'png'
            const validExtensions = ['png', 'jpeg', 'jpg', 'webp']

            if (!validExtensions.includes(extension)) {
              throw new Error(
                `Unsupported file type: ${extension}. Supported types are ${validExtensions.join(', ')}`,
              )
            }

            fileType = extension
          }

          if (!formData.get('fileType')) {
            formData.append('fileType', fileType)
          }

          const response = await fetch('/api/art/upload', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            this.artImages.push(data.artImage)
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to upload image.',
      )
    },
  },
})

export type { Art, ArtImage }

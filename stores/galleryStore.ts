// ~/stores/galleryStore.ts
import { defineStore } from 'pinia'
import { Gallery as GalleryRecord } from '@prisma/client'
import axios from 'axios'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { galleryData } from './seeds/seedGalleries'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Gallery = GalleryRecord

interface GalleryStoreState {
  galleries: Gallery[]
  currentGallery: Gallery | null
  totalGalleries: number
  errors: string[]
  currentImage: string | null
  galleryImages: string[]
  page: number
  pageSize: number
}

export const useGalleryStore = defineStore({
  id: 'galleries',
  state: (): GalleryStoreState => ({
    galleries: [],
    currentGallery: null,
    totalGalleries: 0,
    errors: [],
    currentImage: null,
    galleryImages: [],
    page: 1,
    pageSize: 100
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading gallery store...')
      try {
        // Load galleries if necessary
        await this.countGalleries()
        if (this.totalGalleries === 0) {
          // If no galleries exist, seed them
          await this.seedGalleries()
        }

        // Load other store data
        await this.getGalleries(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.galleries.length} galleries`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing gallery store: ' + error)
      }
    },
    async getGalleryImages(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching images for gallery with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/galleries/${id}/images`)
        this.galleryImages = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched images for gallery with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get gallery images: ' + error)
      }
    },
    async getRandomGalleryImage(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching a random image for gallery with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/galleries/${id}/randomimage`)
        this.currentImage = data
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Fetched a random image for gallery with id ${id}`
        )
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get random gallery image: ' + error)
      }
    },
    async getGalleries(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching galleries...')
      try {
        const { data } = await axios.get(`/api/galleries?page=${page}&pageSize=${pageSize}`)
        this.galleries = [...this.galleries, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.galleries.length} galleries`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get galleries: ' + error)
      }
    },
    async getGalleryById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching gallery with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/galleries/${id}`)
        this.currentGallery = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched gallery with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get gallery by id: ' + error)
      }
    },
    async addGalleries(galleriesData: Partial<Gallery>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new galleries...')
      try {
        const { data } = await axios.post(`/api/galleries`, galleriesData)
        this.galleries = [...this.galleries, ...data.galleries]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.galleries.length} galleries`)
        // Update the total galleries count after adding new galleries
        await this.countGalleries()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add galleries: ' + error)
      }
    },
    async updateGallery(id: number, data: Partial<Gallery>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating gallery with id ${id}...`)
      try {
        const { data: updatedGallery } = await axios.put(`/api/galleries/${id}`, data)
        this.currentGallery = updatedGallery
        statusStore.setStatus(StatusType.SUCCESS, `Updated gallery with id ${id}`)
        // Fetch the updated list of galleries after updating a gallery
        await this.getGalleries()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update gallery: ' + error)
      }
    },
    async deleteGallery(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting gallery with id ${id}...`)
      try {
        await axios.delete(`/api/galleries/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted gallery with id ${id}`)
        // Fetch the updated list of galleries and total galleries count after deleting a gallery
        await this.getGalleries()
        await this.countGalleries()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete gallery: ' + error)
      }
    },
    async randomGallery(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random gallery...')
      try {
        const { data } = await axios.get(`/api/galleries/random`)
        this.currentGallery = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random gallery')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get random gallery: ' + error)
      }
    },
    async countGalleries(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting galleries...')
      try {
        const { data } = await axios.get(`/api/galleries/count`)
        this.totalGalleries = data
        statusStore.setStatus(StatusType.SUCCESS, 'Counted galleries')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count galleries: ' + error)
      }
    },
    async seedGalleries(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding galleries...')
      try {
        // Check if galleries already exist
        await this.addGalleries(galleryData)
        statusStore.setStatus(StatusType.SUCCESS, 'Seeded galleries')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to seed galleries: ' + error)
      }
    }
  }
})

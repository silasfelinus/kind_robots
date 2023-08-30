// ~/stores/galleryStore.ts
import { defineStore } from 'pinia'
import { Gallery as GalleryRecord } from '@prisma/client'
import axios from 'axios'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Gallery = GalleryRecord

interface GalleryStoreState {
  galleries: Gallery[]
  currentGallery: Gallery | null
  totalGalleries: number
  loading: boolean
  _initialized: boolean
  page: number
  pageSize: number
}

export const useGalleryStore = defineStore({
  id: 'galleries',
  state: (): GalleryStoreState => ({
    galleries: [],
    currentGallery: null,
    totalGalleries: 0,
    loading: false,
    _initialized: false,
    page: 1,
    pageSize: 100
  }),

  actions: {
    async loadStore(): Promise<void> {
      if (!this._initialized) {
        this.loading = true
        statusStore.setStatus(StatusType.INFO, 'Loading gallery store...')

        try {
          await this.getGalleries(this.page, this.pageSize)
          this._initialized = true
          statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.galleries.length} galleries`)
        } catch (error) {
          errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing gallery store: ' + error)
        } finally {
          this.loading = false
        }
      }
    },

    async getGalleries(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching galleries...')
      try {
        const { data } = await axios.get(`/api/gallery/index.get?page=${page}&pageSize=${pageSize}`)
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
        const { data } = await axios.get(`/api/gallery/id/${id}.get`)
        this.currentGallery = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched gallery with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get gallery by id: ' + error)
      }
    },

    async updateGallery(id: number, data: Partial<Gallery>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating gallery with id ${id}...`)
      try {
        const { data: updatedGallery } = await axios.patch(`/api/gallery/id/${id}.patch`, data)
        this.currentGallery = updatedGallery
        statusStore.setStatus(StatusType.SUCCESS, `Updated gallery with id ${id}`)
        await this.getGalleries()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update gallery: ' + error)
      }
    },

    async deleteGallery(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting gallery with id ${id}...`)
      try {
        await axios.delete(`/api/gallery/id/${id}.delete`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted gallery with id ${id}`)
        await this.getGalleries()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete gallery: ' + error)
      }
    },

    async getRandomGallery(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random gallery...')
      try {
        const { data } = await axios.get(`/api/gallery/random/index.get`)
        this.currentGallery = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random gallery')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to get random gallery: ' + error)
      }
    },

    // Helper function to get list of gallery names
    getGalleryNames(): string[] {
      return this.galleries.map((g) => g.name)
    },

    async countGalleries(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting galleries...')
      try {
        const { data } = await axios.get(`/api/gallery/count.get`)
        this.totalGalleries = data
        statusStore.setStatus(StatusType.SUCCESS, 'Counted galleries')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count galleries: ' + error)
      }
    }
  }
})

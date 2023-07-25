// ~/store/galleries.ts
import { defineStore } from 'pinia'
import { Gallery as GalleryRecord } from '@prisma/client'
import axios from 'axios'

export type Gallery = GalleryRecord

interface GalleriesState {
  galleries: Gallery[]
  currentGallery: Gallery | null
  totalGalleries: number
  errors: string[]
}

export const useGalleryStore = defineStore({
  id: 'galleries',
  state: (): GalleriesState => ({
    galleries: [],
    currentGallery: null,
    totalGalleries: 0,
    errors: []
  }),
  actions: {
    async getGalleries(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/galleries?page=${page}&pageSize=${pageSize}`)
      this.galleries = data
    },
    async getGalleryById(id: number) {
      const { data } = await axios.get(`/api/galleries/${id}`)
      this.currentGallery = data
    },
    async addGalleries(galleriesData: Partial<Gallery>[]) {
      const { data } = await axios.post(`/api/galleries`, galleriesData)
      this.galleries = data.galleries
      this.errors = data.errors

      // Update the total galleries count after adding new galleries
      await this.countGalleries()
    },
    async updateGallery(id: number, data: Partial<Gallery>) {
      const { data: updatedGallery } = await axios.put(`/api/galleries/${id}`, data)
      this.currentGallery = updatedGallery

      // Fetch the updated list of galleries after updating a gallery
      await this.getGalleries()
    },
    async deleteGallery(id: number) {
      await axios.delete(`/api/galleries/${id}`)

      // Fetch the updated list of galleries and total galleries count after deleting a gallery
      await this.getGalleries()
      await this.countGalleries()
    },
    async randomGallery() {
      const { data } = await axios.get(`/api/galleries/random`)
      this.currentGallery = data
    },
    async countGalleries() {
      const { data } = await axios.get(`/api/galleries/count`)
      this.totalGalleries = data
    },
    async loadStore() {
      try {
        await this.getGalleries()
        return `Loaded ${this.galleries.length} galleries`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})

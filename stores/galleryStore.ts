// ~/stores/galleryStore.ts
import { defineStore } from 'pinia'
import { Gallery as GalleryRecord } from '@prisma/client'
import {
  fetchGalleries,
  fetchGalleryById,
  addGalleries,
  updateGallery,
  deleteGallery,
  randomGallery
} from './../server/api/galleries'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Gallery = GalleryRecord

interface GalleryState {
  galleries: Gallery[]
  selectedGalleries: Gallery[]
  activeGallery: Gallery | null
}
export const useGalleryStore = defineStore({
  id: 'galleries',
  state: (): GalleryState => ({
    galleries: [],
    selectedGalleries: [],
    activeGallery: null
  }),
  getters: {
    getSelectedGalleries(): Gallery[] {
      return this.selectedGalleries
    },
    getActiveGallery(): Gallery | null {
      return this.activeGallery || this.selectedGalleries.slice(-1)[0] || null
    }
  },
  actions: {
    async fetchGalleries(): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.galleries = await fetchGalleries()
          statusStore.setStatus(StatusType.SUCCESS, 'Galleries fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch galleries.'
      )
    },
    async fetchGalleryById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const gallery = await fetchGalleryById(id)
          if (gallery) {
            const galleryIndex = this.galleries.findIndex(
              (existingGallery) => existingGallery.id === id
            )
            if (galleryIndex !== -1) {
              this.galleries.splice(galleryIndex, 1, gallery)
            } else {
              this.galleries.push(gallery)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch gallery by id.'
      )
    },
    async addGalleries(galleriesData: Partial<Gallery>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { galleries: newGalleries } = await addGalleries(galleriesData)
          this.galleries.push(...newGalleries)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newGalleries.length} gallery(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add galleries.'
      )
    },
    async updateGallery(id: number, data: Partial<Gallery>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedGallery = await updateGallery(id, data)
          if (updatedGallery) {
            const galleryIndex = this.galleries.findIndex((gallery) => gallery.id === id)
            if (galleryIndex !== -1) {
              this.galleries.splice(galleryIndex, 1, updatedGallery)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update gallery.'
      )
    },
    async deleteGallery(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          await deleteGallery(id)
          const galleryIndex = this.galleries.findIndex((gallery) => gallery.id === id)
          if (galleryIndex !== -1) {
            this.galleries.splice(galleryIndex, 1)
            statusStore.setStatus(StatusType.SUCCESS, 'Gallery deleted successfully.')
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete gallery.'
      )
    },
    selectGallery(galleryId: number): void {
      const gallery = this.galleries.find((gallery) => gallery.id === galleryId)
      if (gallery) {
        this.selectedGalleries.push(gallery)
        this.activeGallery = gallery
      } else {
        throw new Error('Cannot select gallery that does not exist')
      }
    },
    setActiveGallery(galleryId: number): void {
      const gallery = this.galleries.find((gallery) => gallery.id === galleryId)
      if (gallery) {
        this.activeGallery = gallery
      } else {
        throw new Error('Cannot set active gallery that does not exist')
      }
    },
    deselectGallery(galleryId: number): void {
      const galleryIndex = this.selectedGalleries.findIndex((gallery) => gallery.id === galleryId)
      if (galleryIndex !== -1) {
        this.selectedGalleries.splice(galleryIndex, 1)
        this.activeGallery = this.selectedGalleries.slice(-1)[0] || null
      } else {
        throw new Error('Cannot deselect gallery that is not selected')
      }
    },
    async randomGallery(): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.activeGallery = await randomGallery()
          statusStore.setStatus(StatusType.SUCCESS, 'Random gallery selected successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to select random gallery.'
      )
    }
  }
})

import { defineStore } from 'pinia'
import { performFetch, handleError } from './utils'
import type { Gallery } from '@prisma/client'

interface GalleryState {
  galleries: Gallery[]
  currentGallery: Gallery | null
  currentImage: string
}

export const useGalleryStore = defineStore({
  id: 'gallery',

  state: (): GalleryState => ({
    galleries: [],
    currentGallery: null,
    currentImage: '',
  }),

  getters: {
    currentGalleryContent(state: GalleryState): string | null {
      return state.currentGallery?.content || null
    },

    allGalleryNames(state: GalleryState): string[] {
      return state.galleries.map((gallery) => gallery.name)
    },

    randomImage(state: GalleryState): string | null {
      return state.currentImage ? state.currentImage : null
    },

    randomGallery(state: GalleryState): Gallery | null {
      const otherGalleries = state.galleries.filter(
        (g) => g.name !== state.currentGallery?.name,
      )
      return otherGalleries.length
        ? otherGalleries[Math.floor(Math.random() * otherGalleries.length)]
        : state.currentGallery
    },

    imagePathsByGalleryName(
      state: GalleryState,
    ): (galleryName: string) => string[] {
      return (galleryName: string) => {
        const gallery = state.galleries.find((g) => g.name === galleryName)
        return gallery?.imagePaths ? gallery.imagePaths.split(',') : []
      }
    },
  },

  actions: {
    async initializeStore() {
      if (typeof window !== 'undefined') {
        const storedGalleries = localStorage.getItem('galleries')
        const storedCurrentGallery = localStorage.getItem('currentGallery')
        const storedCurrentImage = localStorage.getItem('currentImage')

        if (storedGalleries) {
          try {
            this.galleries = JSON.parse(storedGalleries) || []
          } catch (error) {
            console.error('Failed to parse stored galleries:', error)
            this.galleries = []
          }
        }

        if (storedCurrentGallery) {
          this.currentGallery = JSON.parse(storedCurrentGallery)
        }

        if (storedCurrentImage) {
          this.currentImage = storedCurrentImage
        }

        if (!this.galleries.length) {
          await this.fetchGalleries()
        }
      }
    },

    async addGallery(gallery: { name: string; userId: number }) {
      try {
        const response = await performFetch<Gallery>('/api/galleries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gallery),
        })

        if (response.success && response.data) {
          this.galleries.push(response.data)
          localStorage.setItem('galleries', JSON.stringify(this.galleries))
        } else {
          throw new Error(response.message || 'Failed to add gallery')
        }
      } catch (error) {
        handleError(error, 'adding gallery')
      }
    },

    async deleteGallery(id: number, userId: number) {
      const gallery = this.galleries.find((gallery) => gallery.id === id)

      if (!gallery) {
        console.error('Gallery not found.')
        return
      }

      if (gallery.userId !== userId) {
        console.error('User is not authorized to delete this gallery.')
        return
      }

      try {
        const response = await performFetch(`/api/galleries/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.galleries = this.galleries.filter((gallery) => gallery.id !== id)
          localStorage.setItem('galleries', JSON.stringify(this.galleries))
        } else {
          throw new Error(response.message || 'Failed to delete gallery')
        }
      } catch (error) {
        handleError(error, 'deleting gallery')
      }
    },

    async fetchGalleries() {
      try {
        const response = await performFetch<Gallery[]>(
          '/api/galleries',
        )

        if (response.success && response.data) {
          this.galleries = response.data
          localStorage.setItem('galleries', JSON.stringify(this.galleries))

          if (!this.currentGallery && this.galleries.length > 0) {
            this.setGalleryByName(this.galleries[0].name)
          }
        } else {
          throw new Error(response.message || 'Failed to fetch galleries')
        }
      } catch (error) {
        handleError(error, 'fetching galleries')
      }
    },

    setGalleryByName(name: string) {
      const selectedGallery = this.galleries.find(
        (gallery: Gallery) => gallery.name === name,
      )
      if (selectedGallery) {
        this.currentGallery = selectedGallery
        this.currentImage = selectedGallery.imagePaths?.split(',')[0] || ''
        localStorage.setItem(
          'currentGallery',
          JSON.stringify(this.currentGallery),
        )
        localStorage.setItem('currentImage', this.currentImage)
      } else {
        console.warn(`Gallery with name ${name} not found`)
      }
    },

    setRandomGallery() {
      const randomGallery = this.randomGallery
      if (randomGallery) {
        this.setGalleryByName(randomGallery.name)
      }
    },

    async changeToRandomImage() {
      try {
        if (!this.currentGallery || !this.currentGallery.imagePaths) {
          throw new Error(
            'No gallery selected or no images available in the selected gallery.',
          )
        }

        const imagePaths = this.currentGallery.imagePaths.split(',')
        if (imagePaths.length === 0) {
          throw new Error('No images available in the selected gallery.')
        }

        const randomImage =
          imagePaths[Math.floor(Math.random() * imagePaths.length)]
        this.currentImage = `/images/${this.currentGallery.name}/${randomImage}`
        localStorage.setItem('currentImage', this.currentImage)
      } catch (error) {
        handleError(error, 'changing to random image')
      }
    },
  },
})

export type { Gallery }

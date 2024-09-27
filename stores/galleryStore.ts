import { defineStore } from 'pinia'
import type { Gallery } from '@prisma/client'

interface GalleryState {
  galleries: Gallery[] // List of galleries
  currentGallery: Gallery | null // Currently selected gallery
  currentImage: string // Current image in the gallery
}

export const useGalleryStore = defineStore({
  id: 'gallery',

  state: (): GalleryState => ({
    galleries: [], // Start with an empty list
    currentGallery: null, // No gallery selected by default
    currentImage: '', // No current image
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
    // Initialize store by loading from localStorage or API
    async initializeStore() {
      if (typeof window !== 'undefined') {
        // Ensure localStorage is only accessed in the client
        const storedGalleries = localStorage.getItem('galleries')
        const storedCurrentGallery = localStorage.getItem('currentGallery')
        const storedCurrentImage = localStorage.getItem('currentImage')

        if (storedGalleries) {
          try {
            this.galleries = JSON.parse(storedGalleries)
            if (!Array.isArray(this.galleries)) {
              this.galleries = [] // Ensure it's an array
            }
          } catch (error) {
            this.galleries = [] // In case of JSON parsing failure
            console.error('Failed to parse stored galleries:', error)
          }
        }

        if (storedCurrentGallery) {
          this.currentGallery = JSON.parse(storedCurrentGallery)
        }

        if (storedCurrentImage) {
          this.currentImage = storedCurrentImage
        }

        // If no galleries in localStorage, fetch from API
        if (!this.galleries.length) {
          await this.fetchGalleries()
        }
      }
    },

    async addGallery(gallery: { name: string; userId: number }) {
      try {
        const response = await fetch('/api/galleries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gallery),
        })

        const newGallery = await response.json()
        this.galleries.push(newGallery)

        if (typeof window !== 'undefined') {
          localStorage.setItem('galleries', JSON.stringify(this.galleries))
        }
      } catch (error) {
        console.error('Failed to add gallery:', error)
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
        await fetch(`/api/galleries/${id}`, {
          method: 'DELETE',
        })

        this.galleries = this.galleries.filter((gallery) => gallery.id !== id)

        if (typeof window !== 'undefined') {
          localStorage.setItem('galleries', JSON.stringify(this.galleries))
        }
      } catch (error) {
        console.error('Failed to delete gallery:', error)
      }
    },

    async fetchGalleries() {
      try {
        const response = await fetch('/api/galleries')
        if (response.ok) {
          const data = await response.json()

          // Ensure data contains the galleries array before assigning
          if (data.success && Array.isArray(data.galleries)) {
            this.galleries = data.galleries
            if (typeof window !== 'undefined') {
              localStorage.setItem('galleries', JSON.stringify(this.galleries))
            }

            // Set a default gallery if none is selected
            if (!this.currentGallery && this.galleries.length > 0) {
              this.setGalleryByName(this.galleries[0].name)
            }
          } else {
            console.error(
              'Invalid galleries data format. Expected an array under the galleries property.',
            )
          }
        } else {
          console.error('Failed to fetch galleries')
        }
      } catch (error) {
        console.error('Error fetching galleries:', error)
      }
    },

    setGalleryByName(name: string) {
      const selectedGallery = this.galleries.find(
        (gallery: Gallery) => gallery.name === name,
      )
      if (selectedGallery) {
        this.currentGallery = selectedGallery
        this.currentImage = selectedGallery.imagePaths?.split(',')[0] || ''
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'currentGallery',
            JSON.stringify(this.currentGallery),
          )
          localStorage.setItem('currentImage', this.currentImage)
        }
      } else {
        console.warn(`Gallery with name ${name} not found`)
      }
    },

    // Set a random gallery and update state and localStorage
    setRandomGallery() {
      const randomGallery = this.randomGallery
      if (randomGallery) {
        this.setGalleryByName(randomGallery.name)
      }
    },

    // Change to a random image by fetching from the API
    async changeToRandomImage() {
      try {
        const response = await fetch('/api/galleries/random/image')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.image) {
            this.currentImage = data.image
            if (typeof window !== 'undefined') {
              localStorage.setItem('currentImage', this.currentImage)
            }
          } else {
            console.error('No image found in the response.')
          }
        } else {
          console.error('Failed to fetch a random image.')
        }
      } catch (error) {
        console.error('Error fetching random image:', error)
      }
    },
  },
})

export type { Gallery }

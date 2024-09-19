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
      if (otherGalleries.length === 0 && state.currentGallery) {
        return state.currentGallery
      }
      return (
        otherGalleries[Math.floor(Math.random() * otherGalleries.length)] ||
        null
      )
    },

    imagePathsByGalleryName(
      state: GalleryState,
    ): (galleryName: string) => string[] {
      return (galleryName: string) => {
        const gallery = state.galleries.find((g) => g.name === galleryName)
        return gallery && gallery.imagePaths
          ? gallery.imagePaths.split(',')
          : []
      }
    },
  },

  actions: {
    // Initialize store by loading from localStorage or API
    async initializeStore() {
      const storedGalleries = localStorage.getItem('galleries')
      const storedCurrentGallery = localStorage.getItem('currentGallery')
      const storedCurrentImage = localStorage.getItem('currentImage')

      if (storedGalleries) {
        this.galleries = JSON.parse(storedGalleries)
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
    },

    // Fetch galleries from API and save to state and localStorage
    async fetchGalleries() {
      try {
        const response = await fetch('/api/galleries')
        if (response.ok) {
          const data = await response.json()
          this.galleries = data || []
          localStorage.setItem('galleries', JSON.stringify(this.galleries))

          // Set a default gallery if none is selected
          if (!this.currentGallery && this.galleries.length > 0) {
            this.setGalleryByName(this.galleries[0].name)
          }
        } else {
          console.error('Failed to fetch galleries')
        }
      } catch (error) {
        console.error('Error fetching galleries:', error)
      }
    },

    // Set the current gallery by name and update localStorage
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
            localStorage.setItem('currentImage', this.currentImage)
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

// /stores/galleryStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from './utils'
import type { Gallery } from '~/prisma/generated/prisma/client'

const isClient = typeof window !== 'undefined'

export const useGalleryStore = defineStore('galleryStore', () => {
  const galleries = ref<Gallery[]>([])
  const currentGallery = ref<Gallery | null>(null)
  const currentImage = ref<string>('')

  const currentGalleryContent = computed(
    () => currentGallery.value?.content || null,
  )
  const allGalleryNames = computed(() =>
    galleries.value.map((g: { name: any }) => g.name),
  )
  const randomImage = computed(() => currentImage.value || null)
  const randomGallery = computed(() => {
    const others = galleries.value.filter(
      (g: { name: any }) => g.name !== currentGallery.value?.name,
    )
    return others.length
      ? others[Math.floor(Math.random() * others.length)]
      : currentGallery.value
  })

  const imagePathsByGalleryName = computed(() => (name: string): string[] => {
    const gallery = galleries.value.find(
      (g: { name: string }) => g.name === name,
    )
    return gallery?.imagePaths?.split(',') || []
  })

  function buildImagePath(galleryName: string, imagePath: string): string {
    if (!imagePath) return ''
    const trimmed = imagePath.trim()
    if (
      trimmed.startsWith('/images/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed
    }
    return `/images/${galleryName}/${trimmed}`
  }

  async function initialize() {
    if (!isClient) return
    try {
      const storedGalleries = localStorage.getItem('galleries')
      const storedCurrentGallery = localStorage.getItem('currentGallery')
      const storedCurrentImage = localStorage.getItem('currentImage')

      if (storedGalleries) galleries.value = JSON.parse(storedGalleries)
      if (storedCurrentGallery)
        currentGallery.value = JSON.parse(storedCurrentGallery)
      if (storedCurrentImage) currentImage.value = storedCurrentImage
    } catch (err) {
      console.error('Error restoring from localStorage:', err)
    }
    await fetchGalleries()
  }

  async function addGallery(gallery: { name: string; userId: number }) {
    try {
      const res = await performFetch<Gallery>('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gallery),
      })
      if (res.success && res.data) {
        galleries.value.push(res.data)
        if (isClient)
          localStorage.setItem('galleries', JSON.stringify(galleries.value))
      } else throw new Error(res.message || 'Failed to add gallery')
    } catch (err) {
      handleError(err, 'adding gallery')
    }
  }

  async function deleteGallery(id: number, userId: number) {
    const gallery = galleries.value.find((g: { id: number }) => g.id === id)
    if (!gallery || gallery.userId !== userId) {
      console.error('Unauthorized or missing gallery.')
      return
    }
    try {
      const res = await performFetch(`/api/galleries/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        galleries.value = galleries.value.filter(
          (g: { id: number }) => g.id !== id,
        )
        if (isClient)
          localStorage.setItem('galleries', JSON.stringify(galleries.value))
      } else throw new Error(res.message || 'Failed to delete gallery')
    } catch (err) {
      handleError(err, 'deleting gallery')
    }
  }

  async function fetchGalleries() {
    try {
      const res = await performFetch<Gallery[]>('/api/galleries')
      if (res.success && res.data) {
        galleries.value = res.data
        if (isClient)
          localStorage.setItem('galleries', JSON.stringify(galleries.value))
        if (!currentGallery.value && galleries.value.length > 0) {
          setGalleryByName(galleries.value[0].name)
        }
      } else throw new Error(res.message || 'Failed to fetch galleries')
    } catch (err) {
      handleError(err, 'fetching galleries')
    }
  }

  function setGalleryByName(name: string) {
    const gallery = galleries.value.find(
      (g: { name: string }) => g.name === name,
    )
    if (gallery) {
      currentGallery.value = gallery
      const firstImage = gallery.imagePaths?.split(',')[0] || ''
      currentImage.value = buildImagePath(gallery.name, firstImage)
      if (isClient) {
        localStorage.setItem(
          'currentGallery',
          JSON.stringify(currentGallery.value),
        )
        localStorage.setItem('currentImage', currentImage.value)
      }
    } else {
      console.warn(`Gallery with name ${name} not found`)
    }
  }

  function setRandomGallery() {
    const random = randomGallery.value
    if (random) setGalleryByName(random.name)
  }

  async function setCurrentGallery(id: number) {
    const gallery = galleries.value.find((g: { id: number }) => g.id === id)
    if (!gallery) return console.warn(`Gallery with ID ${id} not found.`)
    currentGallery.value = gallery
    const firstImage = gallery.imagePaths?.split(',')[0] || ''
    currentImage.value = buildImagePath(gallery.name, firstImage)
    if (isClient) {
      localStorage.setItem(
        'currentGallery',
        JSON.stringify(currentGallery.value),
      )
      localStorage.setItem('currentImage', currentImage.value)
    }
  }

  async function getRandomImageFromGalleryId(
    id: number,
  ): Promise<string | null> {
    try {
      const res = await performFetch<{ imagePath: string }>(
        `/api/galleries/random/id/${id}`,
      )
      if (res.success && res.data) {
        const gallery =
          galleries.value.find((g: { id: number }) => g.id === id) || null
        const baseName = gallery?.name || ''
        const fullPath = baseName
          ? buildImagePath(baseName, res.data.imagePath)
          : res.data.imagePath
        currentImage.value = fullPath
        if (isClient) localStorage.setItem('currentImage', currentImage.value)
        console.log('[galleryStore] random image by id', {
          id,
          galleryName: baseName,
          imagePath: res.data.imagePath,
          fullPath,
        })
        return fullPath
      }
      return null
    } catch (err) {
      console.error('Error fetching random image:', err)
      return null
    }
  }

  async function getRandomImageFromGalleryName(
    name: string,
  ): Promise<string | null> {
    try {
      const res = await performFetch<string>(
        `/api/galleries/random/name/${name}`,
      )
      if (res.success && res.data) {
        const fullPath = buildImagePath(name, res.data)
        currentImage.value = fullPath
        if (isClient) localStorage.setItem('currentImage', currentImage.value)
        console.log('[galleryStore] random image by name', {
          name,
          imageName: res.data,
          fullPath,
        })
        return fullPath
      }
      return null
    } catch (err) {
      console.error('Error fetching random image:', err)
      return null
    }
  }

  async function changeToRandomImage(): Promise<string | null> {
    const gallery = currentGallery.value
    if (!gallery?.imagePaths) return null
    const paths = gallery.imagePaths.split(',').map((p: string) => p.trim())
    if (!paths.length) return null
    const selected = paths[Math.floor(Math.random() * paths.length)]
    const fullPath = buildImagePath(gallery.name, selected)
    currentImage.value = fullPath
    if (isClient) localStorage.setItem('currentImage', currentImage.value)
    console.log('[galleryStore] changeToRandomImage', {
      galleryName: gallery.name,
      selected,
      fullPath,
    })
    return currentImage.value
  }

  return {
    galleries,
    currentGallery,
    currentImage,
    currentGalleryContent,
    allGalleryNames,
    randomImage,
    randomGallery,
    imagePathsByGalleryName,
    initialize,
    addGallery,
    deleteGallery,
    fetchGalleries,
    setCurrentGallery,
    setGalleryByName,
    setRandomGallery,
    getRandomImageFromGalleryId,
    getRandomImageFromGalleryName,
    changeToRandomImage,
  }
})

export type { Gallery }

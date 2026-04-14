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

  const initialized = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const fetchGalleriesPromise = ref<Promise<void> | null>(null)

  const currentGalleryContent = computed(
    () => currentGallery.value?.content || null,
  )

  const allGalleryNames = computed(() => galleries.value.map((g) => g.name))

  const randomImage = computed(() => currentImage.value || null)

  const randomGallery = computed(() => {
    const others = galleries.value.filter(
      (g) => g.name !== currentGallery.value?.name,
    )
    return others.length
      ? others[Math.floor(Math.random() * others.length)]
      : currentGallery.value
  })

  const imagePathsByGalleryName = computed(() => (name: string): string[] => {
    const gallery = galleries.value.find((g) => g.name === name)
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

  async function fetchGalleries(force = false): Promise<void> {
    if (!force && galleries.value.length) return
    if (fetchGalleriesPromise.value) return fetchGalleriesPromise.value

    fetchGalleriesPromise.value = (async () => {
      try {
        const res = await performFetch<Gallery[]>('/api/galleries')
        if (res.success && res.data) {
          galleries.value = res.data

          if (isClient) {
            localStorage.setItem('galleries', JSON.stringify(galleries.value))
          }

          if (!currentGallery.value && galleries.value.length > 0) {
            setGalleryByName(galleries.value[0]?.name || '')
          }
        } else {
          throw new Error(res.message || 'Failed to fetch galleries')
        }
      } catch (err) {
        handleError(err, 'fetching galleries')
      } finally {
        fetchGalleriesPromise.value = null
      }
    })()

    return fetchGalleriesPromise.value
  }

  async function initialize(): Promise<void> {
    if (!isClient) return
    if (initialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        const storedGalleries = localStorage.getItem('galleries')
        const storedCurrentGallery = localStorage.getItem('currentGallery')
        const storedCurrentImage = localStorage.getItem('currentImage')

        if (storedGalleries) galleries.value = JSON.parse(storedGalleries)
        if (storedCurrentGallery)
          currentGallery.value = JSON.parse(storedCurrentGallery)
        if (storedCurrentImage) currentImage.value = storedCurrentImage

        if (!galleries.value.length) {
          await fetchGalleries()
        }

        initialized.value = true
      } catch (err) {
        console.error('Error initializing galleryStore:', err)
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function addGallery(gallery: { name: string; userId: number }) {
    try {
      const res = await performFetch<Gallery>('/api/galleries', {
        method: 'POST',
        body: JSON.stringify(gallery),
      })

      if (res.success && res.data) {
        galleries.value.push(res.data)

        if (isClient) {
          localStorage.setItem('galleries', JSON.stringify(galleries.value))
        }
      } else throw new Error(res.message || 'Failed to add gallery')
    } catch (err) {
      handleError(err, 'adding gallery')
    }
  }

  async function deleteGallery(id: number, userId: number) {
    const gallery = galleries.value.find((g) => g.id === id)
    if (!gallery || gallery.userId !== userId) return

    try {
      const res = await performFetch(`/api/galleries/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        galleries.value = galleries.value.filter((g) => g.id !== id)

        if (isClient) {
          localStorage.setItem('galleries', JSON.stringify(galleries.value))
        }
      } else throw new Error(res.message || 'Failed to delete gallery')
    } catch (err) {
      handleError(err, 'deleting gallery')
    }
  }

  function setGalleryByName(name: string) {
    const gallery = galleries.value.find((g) => g.name === name)
    if (!gallery) return

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

  function setRandomGallery() {
    const random = randomGallery.value
    if (random) setGalleryByName(random.name)
  }

  async function setCurrentGallery(id: number) {
    const gallery = galleries.value.find((g) => g.id === id)
    if (!gallery) return

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
        const gallery = galleries.value.find((g) => g.id === id) || null
        const baseName = gallery?.name || ''
        const fullPath = baseName
          ? buildImagePath(baseName, res.data.imagePath)
          : res.data.imagePath

        currentImage.value = fullPath

        if (isClient) localStorage.setItem('currentImage', currentImage.value)

        return fullPath
      }

      return null
    } catch {
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

        return fullPath
      }

      return null
    } catch {
      return null
    }
  }

  async function changeToRandomImage(): Promise<string | null> {
    const gallery = currentGallery.value
    if (!gallery?.imagePaths) return null

    const paths = gallery.imagePaths.split(',').map((p) => p.trim())
    if (!paths.length) return null

    const selected = paths[Math.floor(Math.random() * paths.length)]
    const fullPath = buildImagePath(gallery.name || '', selected || '')

    currentImage.value = fullPath

    if (isClient) localStorage.setItem('currentImage', currentImage.value)

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
    fetchGalleries,
    addGallery,
    deleteGallery,
    setCurrentGallery,
    setGalleryByName,
    setRandomGallery,
    getRandomImageFromGalleryId,
    getRandomImageFromGalleryName,
    changeToRandomImage,
  }
})

export type { Gallery }

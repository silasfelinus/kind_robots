// /stores/galleryStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from './utils'
import type { Gallery } from '~/prisma/generated/prisma/client'

const isClient = typeof window !== 'undefined'

type GalleryInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

const galleriesStorageKey = 'galleries'
const currentGalleryStorageKey = 'currentGallery'
const currentImageStorageKey = 'currentImage'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null): T | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

export const useGalleryStore = defineStore('galleryStore', () => {
  const galleries = ref<Gallery[]>([])
  const currentGallery = ref<Gallery | null>(null)
  const currentImage = ref<string>('')

  const initialized = ref(false)
  const initializing = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchGalleriesPromise = ref<Promise<Gallery[]> | null>(null)
  const randomImagePromiseByGalleryId = ref<
    Record<number, Promise<string | null>>
  >({})
  const randomImagePromiseByGalleryName = ref<
    Record<string, Promise<string | null>>
  >({})

  const currentGalleryContent = computed(
    () => currentGallery.value?.content || null,
  )

  const allGalleryNames = computed(() => galleries.value.map((g) => g.name))

  const randomImage = computed(() => currentImage.value || null)

  const randomGallery = computed(() => {
    const others = galleries.value.filter(
      (gallery) => gallery.name !== currentGallery.value?.name,
    )

    return others.length
      ? others[Math.floor(Math.random() * others.length)]
      : currentGallery.value
  })

  const imagePathsByGalleryName = computed(() => (name: string): string[] => {
    const gallery = galleries.value.find((entry) => entry.name === name)

    return (
      gallery?.imagePaths
        ?.split(',')
        .map((path) => path.trim())
        .filter(Boolean) || []
    )
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

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

  function persistGalleries(): void {
    safeSetLocalStorage(galleriesStorageKey, JSON.stringify(galleries.value))
  }

  function persistCurrentGallery(): void {
    if (currentGallery.value) {
      safeSetLocalStorage(
        currentGalleryStorageKey,
        JSON.stringify(currentGallery.value),
      )
    }

    safeSetLocalStorage(currentImageStorageKey, currentImage.value)
  }

  function hydrateFromLocalStorage(): void {
    galleries.value = safeParseArray<Gallery>(
      safeGetLocalStorage(galleriesStorageKey),
    )

    currentGallery.value = safeParseObject<Gallery>(
      safeGetLocalStorage(currentGalleryStorageKey),
    )

    currentImage.value = safeGetLocalStorage(currentImageStorageKey) || ''

    if (
      currentGallery.value &&
      !galleries.value.some(
        (gallery) => gallery.id === currentGallery.value?.id,
      )
    ) {
      galleries.value.push(currentGallery.value)
    }
  }

  function upsertGallery(gallery: Gallery): void {
    const index = galleries.value.findIndex((entry) => entry.id === gallery.id)

    if (index >= 0) {
      galleries.value.splice(index, 1, gallery)
    } else {
      galleries.value.push(gallery)
    }

    persistGalleries()
  }

  function removeGalleryLocally(id: number): void {
    galleries.value = galleries.value.filter((gallery) => gallery.id !== id)

    if (currentGallery.value?.id === id) {
      currentGallery.value = galleries.value[0] || null
      currentImage.value = ''
    }

    persistGalleries()
    persistCurrentGallery()
  }

  function applyCurrentGallery(gallery: Gallery): void {
    currentGallery.value = gallery

    const firstImage = gallery.imagePaths?.split(',')[0]?.trim() || ''
    currentImage.value = buildImagePath(gallery.name, firstImage)

    persistCurrentGallery()
  }

  async function initialize(
    options: GalleryInitializeOptions = {},
  ): Promise<void> {
    if (initialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        initializing.value = true
        clearError()

        hydrateFromLocalStorage()

        if (options.fetchRemote) {
          await fetchGalleries(Boolean(options.force))
        }

        if (!currentGallery.value && galleries.value.length > 0) {
          const firstGallery = galleries.value[0]

          if (firstGallery) {
            applyCurrentGallery(firstGallery)
          }
        }

        initialized.value = true
      } catch (error) {
        initialized.value = false
        handleError(error, 'initializing galleryStore')
        setLastError(error, 'Failed to initialize gallery store')
      } finally {
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchGalleries(force = false): Promise<Gallery[]> {
    if (!force && galleries.value.length) return galleries.value
    if (fetchGalleriesPromise.value && !force) {
      return fetchGalleriesPromise.value
    }

    fetchGalleriesPromise.value = (async () => {
      try {
        loading.value = true
        clearError()

        const res = await performFetch<Gallery[]>('/api/galleries')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch galleries')
        }

        galleries.value = res.data
        persistGalleries()

        if (!currentGallery.value && galleries.value.length > 0) {
          const firstGallery = galleries.value[0]

          if (firstGallery) {
            applyCurrentGallery(firstGallery)
          }
        }
        return galleries.value
      } catch (error) {
        handleError(error, 'fetching galleries')
        setLastError(error, 'Failed to fetch galleries')
        return galleries.value
      } finally {
        loading.value = false
        fetchGalleriesPromise.value = null
      }
    })()

    return fetchGalleriesPromise.value
  }

  async function addGallery(gallery: { name: string; userId: number }) {
    try {
      loading.value = true
      clearError()

      const res = await performFetch<Gallery>('/api/galleries', {
        method: 'POST',
        body: JSON.stringify(gallery),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to add gallery')
      }

      upsertGallery(res.data)

      return {
        success: true,
        data: res.data,
      }
    } catch (error) {
      handleError(error, 'adding gallery')
      setLastError(error, 'Failed to add gallery')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add gallery',
      }
    } finally {
      loading.value = false
    }
  }

  async function deleteGallery(id: number, userId: number) {
    const gallery = galleries.value.find((entry) => entry.id === id)

    if (!gallery || gallery.userId !== userId) {
      return {
        success: false,
        message: 'Gallery not found or permission denied.',
      }
    }

    try {
      loading.value = true
      clearError()

      const res = await performFetch(`/api/galleries/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete gallery')
      }

      removeGalleryLocally(id)

      return {
        success: true,
      }
    } catch (error) {
      handleError(error, 'deleting gallery')
      setLastError(error, 'Failed to delete gallery')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete gallery',
      }
    } finally {
      loading.value = false
    }
  }

  function setGalleryByName(name: string) {
    const gallery = galleries.value.find((entry) => entry.name === name)
    if (!gallery) return

    applyCurrentGallery(gallery)
  }

  function setRandomGallery() {
    const random = randomGallery.value
    if (random) setGalleryByName(random.name)
  }

  async function setCurrentGallery(id: number) {
    const gallery = galleries.value.find((entry) => entry.id === id)
    if (!gallery) return

    applyCurrentGallery(gallery)
  }

  async function getRandomImageFromGalleryId(
    id: number,
  ): Promise<string | null> {
    if (randomImagePromiseByGalleryId.value[id]) {
      return randomImagePromiseByGalleryId.value[id]
    }

    randomImagePromiseByGalleryId.value[id] = (async () => {
      try {
        clearError()

        const res = await performFetch<{ imagePath: string }>(
          `/api/galleries/random/id/${id}`,
        )

        if (res.success && res.data) {
          const gallery =
            galleries.value.find((entry) => entry.id === id) || null
          const baseName = gallery?.name || ''
          const fullPath = baseName
            ? buildImagePath(baseName, res.data.imagePath)
            : res.data.imagePath

          currentImage.value = fullPath
          safeSetLocalStorage(currentImageStorageKey, currentImage.value)

          return fullPath
        }

        return null
      } catch (error) {
        handleError(error, 'getting random image by gallery ID')
        setLastError(error, 'Failed to get random gallery image')
        return null
      } finally {
        delete randomImagePromiseByGalleryId.value[id]
      }
    })()

    return randomImagePromiseByGalleryId.value[id]
  }

  async function getRandomImageFromGalleryName(
    name: string,
  ): Promise<string | null> {
    if (randomImagePromiseByGalleryName.value[name]) {
      return randomImagePromiseByGalleryName.value[name]
    }

    randomImagePromiseByGalleryName.value[name] = (async () => {
      try {
        clearError()

        const res = await performFetch<string>(
          `/api/galleries/random/name/${name}`,
        )

        if (res.success && res.data) {
          const fullPath = buildImagePath(name, res.data)
          currentImage.value = fullPath
          safeSetLocalStorage(currentImageStorageKey, currentImage.value)

          return fullPath
        }

        return null
      } catch (error) {
        handleError(error, 'getting random image by gallery name')
        setLastError(error, 'Failed to get random gallery image')
        return null
      } finally {
        delete randomImagePromiseByGalleryName.value[name]
      }
    })()

    return randomImagePromiseByGalleryName.value[name]
  }

  async function changeToRandomImage(): Promise<string | null> {
    const gallery = currentGallery.value
    if (!gallery?.imagePaths) return null

    const paths = gallery.imagePaths
      .split(',')
      .map((path) => path.trim())
      .filter(Boolean)

    if (!paths.length) return null

    const selected = paths[Math.floor(Math.random() * paths.length)]
    const fullPath = buildImagePath(gallery.name || '', selected || '')

    currentImage.value = fullPath
    safeSetLocalStorage(currentImageStorageKey, currentImage.value)

    return currentImage.value
  }

  function resetInitialization() {
    initialized.value = false
    initializing.value = false
    initializePromise.value = null
    fetchGalleriesPromise.value = null
    randomImagePromiseByGalleryId.value = {}
    randomImagePromiseByGalleryName.value = {}
    lastError.value = null
  }

  return {
    galleries,
    currentGallery,
    currentImage,
    initialized,
    initializing,
    loading,
    lastError,
    currentGalleryContent,
    allGalleryNames,
    randomImage,
    randomGallery,
    imagePathsByGalleryName,
    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
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

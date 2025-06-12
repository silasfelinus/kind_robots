// /stores/helpers/artHelper.ts

import type { Art, ArtImage } from '@prisma/client'
import { performFetch, handleError } from '@/stores/utils'

// Lazy store accessor to prevent circular imports
const getArtStore = () => useArtStore()

export interface GenerateArtData {
  title?: string
  promptString: string
  userId?: number
  pitchId?: number
  galleryId?: number
  checkpoint?: string
  sampler?: string
  steps?: number
  designer?: string
  cfg?: number
  cfgHalf?: boolean
  isMature?: boolean
  isPublic?: boolean
  pitch?: string
  artImageId?: number
  collection?: string
}

export function parseStoredArt(value: string): Art[] {
  try {
    return JSON.parse(value) as Art[]
  } catch {
    return []
  }
}

export function getCachedImageById(
  images: ArtImage[],
  id: number,
): ArtImage | undefined {
  return images.find((image) => image.id === id)
}

export function getArtImageByArtId(
  images: ArtImage[],
  artId: number,
): ArtImage | undefined {
  return images.find((image) => image.artId === artId)
}

export function updateArtImageInPlace(
  images: ArtImage[],
  updatedImage: ArtImage,
): ArtImage[] {
  const index = images.findIndex((img) => img.id === updatedImage.id)
  if (index !== -1) {
    images.splice(index, 1, updatedImage)
  } else {
    images.push(updatedImage)
  }
  return images
}

export function removeImageById(images: ArtImage[], id: number): ArtImage[] {
  return images.filter((img) => img.id !== id)
}

export function mergeArtImages(
  existing: ArtImage[],
  incoming: ArtImage[],
): ArtImage[] {
  const existingIds = new Set(existing.map((img) => img.id))
  return [...existing, ...incoming.filter((img) => !existingIds.has(img.id))]
}

export function sortArtByDate(artList: Art[]): Art[] {
  return [...artList].sort((a, b) => {
    const aTime = a.createdAt
      ? new Date(a.createdAt).getTime()
      : a.updatedAt
        ? new Date(a.updatedAt!).getTime()
        : 0
    const bTime = b.createdAt
      ? new Date(b.createdAt).getTime()
      : b.updatedAt
        ? new Date(b.updatedAt!).getTime()
        : 0
    return bTime - aTime
  })
}

export async function getArtImagesByIds(
  imageIds: number[],
): Promise<ArtImage[]> {
  const store = getArtStore()

  const validIds = imageIds.filter(
    (id): id is number => typeof id === 'number' && !isNaN(id),
  )

  const uncached = validIds.filter(
    (id) => !store.artImages.some((img) => img.id === id),
  )

  if (!uncached.length) {
    return store.artImages.filter((img) => validIds.includes(img.id))
  }

  console.warn('Fetching uncached artImage IDs:', uncached)

  try {
    const response = await performFetch<ArtImage[]>('/api/art/image', {
      method: 'POST',
      body: JSON.stringify({ ids: uncached }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data) {
      store.artImages.push(...response.data)
      return store.artImages.filter((img) => validIds.includes(img.id))
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, 'fetching art images by IDs')
    return []
  }
}

export function getCachedArtImageById(id: number): ArtImage | undefined {
  const store = getArtStore()
  return store.artImages.find((image) => image.id === id)
}

export async function updateArtImageWithArtId(
  artImageId: number,
  artId: number,
): Promise<void> {
  const store = getArtStore()
  try {
    const response = await performFetch<ArtImage>(
      `/api/art/image/${artImageId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId }),
      },
    )

    if (response.success && response.data) {
      const updated = response.data
      const index = store.artImages.findIndex((img) => img.id === artImageId)
      if (index !== -1) store.artImages.splice(index, 1, updated)
      else store.artImages.push(updated)

      const art = store.art.find((a) => a.id === artId)
      if (art) art.artImageId = artImageId
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, 'updating artImageId')
  }
}

export async function updateArtImageId(
  artId: number,
  artImageId: number,
): Promise<void> {
  const store = getArtStore()
  try {
    const response = await performFetch(`/api/art/${artId}/image`, {
      method: 'PATCH',
      body: JSON.stringify({ artImageId }),
    })
    if (response.success) {
      const art = store.art.find((a) => a.id === artId)
      if (art) art.artImageId = artImageId
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, 'updating artImageId')
  }
}

export async function getOrFetchArtImageById(
  id: number,
): Promise<ArtImage | null> {
  const store = getArtStore()

  // First try to find it in the cache
  const cached = store.artImages.find((img) => img.id === id)
  if (cached) return cached

  // Otherwise fetch it
  try {
    const response = await performFetch<ArtImage>(`/api/art/image/${id}`)
    if (response.success && response.data) {
      store.artImages.push(response.data)
      return response.data
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, `fetching ArtImage with ID ${id}`)
    return null
  }
}

// /stores/helpers/artHelper.ts

import type { Art, ArtImage } from '@prisma/client'

import { performFetch, handleError } from '@/stores/utils'

/**
 * Parse stored Art[] from localStorage string.
 */
export function parseStoredArt(value: string): Art[] {
  try {
    return JSON.parse(value) as Art[]
  } catch {
    return []
  }
}

/**
 * Get ArtImage from cache by image ID.
 */
export function getCachedImageById(
  images: ArtImage[],
  id: number,
): ArtImage | undefined {
  return images.find((image) => image.id === id)
}

/**
 * Get ArtImage from cache by related art ID.
 */
export function getArtImageByArtId(
  images: ArtImage[],
  artId: number,
): ArtImage | undefined {
  return images.find((image) => image.artId === artId)
}

/**
 * Replace or insert a single ArtImage in the image array.
 */
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

/**
 * Remove an ArtImage from array by ID.
 */
export function removeImageById(images: ArtImage[], id: number): ArtImage[] {
  return images.filter((img) => img.id !== id)
}

/**
 * Merge incoming ArtImage[] into existing ArtImage[] with deduplication by ID.
 */
export function mergeArtImages(
  existing: ArtImage[],
  incoming: ArtImage[],
): ArtImage[] {
  const existingIds = new Set(existing.map((img) => img.id))
  return [...existing, ...incoming.filter((img) => !existingIds.has(img.id))]
}

/**
 * Sort art list by descending creation date. Falls back to updatedAt or skips if both are null.
 */
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

/**
 * Fetch and cache ArtImages by ID, only requesting uncached ones.
 */
export async function getArtImagesByIds(
  imageIds: number[],
  currentImages: ArtImage[],
  updateImages: (newImages: ArtImage[]) => void,
): Promise<ArtImage[]> {
  const uncached = imageIds.filter(
    (id) => !currentImages.some((img) => img.id === id),
  )

  if (!uncached.length) {
    return currentImages.filter((img) => imageIds.includes(img.id))
  }

  try {
    const response = await performFetch<ArtImage[]>('/api/art/image', {
      method: 'POST',
      body: JSON.stringify({ ids: uncached }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data) {
      updateImages([...currentImages, ...response.data])
      return [...currentImages, ...response.data].filter((img) =>
        imageIds.includes(img.id),
      )
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, 'fetching art images by IDs')
    return []
  }
}

/**
 * Fetch multiple ArtImages by ID from the server and merge with local cache.
 */
export async function fetchArtImagesByIds(
  ids: number[],
  existingImages: ArtImage[],
): Promise<ArtImage[]> {
  const uncached = ids.filter(
    (id) => !existingImages.some((img) => img.id === id),
  )
  if (uncached.length === 0) {
    return existingImages.filter((img) => ids.includes(img.id))
  }

  try {
    const response = await performFetch<ArtImage[]>('/api/art/image', {
      method: 'POST',
      body: JSON.stringify({ ids: uncached }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data) {
      return [...existingImages, ...response.data]
    } else {
      throw new Error(response.message || 'Failed to fetch art images.')
    }
  } catch (error) {
    handleError(error, 'fetching art images by IDs')
    return existingImages
  }
}

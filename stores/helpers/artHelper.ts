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

  export function getCachedArtImageById(id: number): ArtImage | undefined {
    return state.artImages.find((image) => image.id === id)
  }

  export async function updateArtImageWithArtId(
    artImageId: number,
    artId: number,
  ): Promise<void> {
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
        const index = state.artImages.findIndex((img) => img.id === artImageId)
        if (index !== -1) state.artImages.splice(index, 1, updated)
        else state.artImages.push(updated)

        const art = state.art.find((a) => a.id === artId)
        if (art) art.artImageId = artImageId
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'updating artImageId')
    }
  }

  export async function getArtImagesByIds(imageIds: number[]): Promise<ArtImage[]> {
    const uncached = imageIds.filter(
      (id) => !state.artImages.some((img) => img.id === id),
    )
    if (!uncached.length)
      return state.artImages.filter((img) => imageIds.includes(img.id))

    try {
      const response = await performFetch<ArtImage[]>('/api/art/image', {
        method: 'POST',
        body: JSON.stringify({ ids: uncached }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.success && response.data) {
        state.artImages.push(...response.data)
        return state.artImages.filter((img) => imageIds.includes(img.id))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'fetching art images by IDs')
      return []
    }
  }

  export async function updateArtImageId(
    artId: number,
    artImageId: number,
  ): Promise<void> {
    try {
      const response = await performFetch(`/api/art/${artId}/image`, {
        method: 'PATCH',
        body: JSON.stringify({ artImageId }),
      })
      if (response.success) {
        const art = state.art.find((a) => a.id === artId)
        if (art) art.artImageId = artImageId
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'updating artImageId')
    }
  }
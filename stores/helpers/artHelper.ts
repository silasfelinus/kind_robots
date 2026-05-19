// /stores/helpers/artHelper.ts
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'

const getArtStore = () => useArtStore()

export function parseStoredArtImages(value: string): ArtImage[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as ArtImage[]) : []
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

export function updateArtImageInPlace(
  images: ArtImage[],
  updatedImage: ArtImage,
): ArtImage[] {
  const index = images.findIndex((image) => image.id === updatedImage.id)

  if (index !== -1) {
    images.splice(index, 1, updatedImage)
  } else {
    images.push(updatedImage)
  }

  return images
}

export function removeImageById(images: ArtImage[], id: number): ArtImage[] {
  return images.filter((image) => image.id !== id)
}

export function mergeArtImages(
  existing: ArtImage[],
  incoming: ArtImage[],
): ArtImage[] {
  const map = new Map<number, ArtImage>()

  for (const image of existing) {
    map.set(image.id, image)
  }

  for (const image of incoming) {
    map.set(image.id, image)
  }

  return Array.from(map.values()).sort(compareArtImagesByDate)
}

export function sortArtImagesByDate(images: ArtImage[]): ArtImage[] {
  return [...images].sort(compareArtImagesByDate)
}

export function compareArtImagesByDate(a: ArtImage, b: ArtImage): number {
  const aTime = a.createdAt
    ? new Date(a.createdAt).getTime()
    : a.updatedAt
      ? new Date(a.updatedAt).getTime()
      : 0

  const bTime = b.createdAt
    ? new Date(b.createdAt).getTime()
    : b.updatedAt
      ? new Date(b.updatedAt).getTime()
      : 0

  return bTime - aTime
}

export async function getArtImagesByIds(
  imageIds: number[],
): Promise<ArtImage[]> {
  const store = getArtStore()

  const validIds = imageIds.filter((id): id is number => {
    return typeof id === 'number' && Number.isFinite(id) && id > 0
  })

  const cached = store.artImages.filter((image: ArtImage) => {
    return validIds.includes(image.id)
  })

  const cachedIds = new Set(cached.map((image) => image.id))
  const uncached = validIds.filter((id) => !cachedIds.has(id))

  if (!uncached.length) {
    return cached
  }

  try {
    const response = await performFetch<ArtImage[]>('/api/art/image', {
      method: 'POST',
      body: JSON.stringify({ ids: uncached }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch art images.')
    }

    store.addOrUpdateArtImages(response.data)

    return store.artImages.filter((image: ArtImage) => {
      return validIds.includes(image.id)
    })
  } catch (error) {
    handleError(error, 'fetching art images by IDs')
    return cached
  }
}

export function getCachedArtImageById(id: number): ArtImage | undefined {
  const store = getArtStore()
  return store.artImages.find((image: ArtImage) => image.id === id)
}

export async function getOrFetchArtImageById(
  id: number,
): Promise<ArtImage | null> {
  const store = getArtStore()

  const cached = store.artImages.find((image: ArtImage) => image.id === id)
  if (cached) return cached

  try {
    const response = await performFetch<ArtImage>(`/api/art/image/${id}`)

    if (!response.success || !response.data) {
      throw new Error(response.message || `Failed to fetch art image #${id}.`)
    }

    store.addOrUpdateArtImages([response.data])
    return response.data
  } catch (error) {
    handleError(error, `fetching art image with ID ${id}`)
    return null
  }
}

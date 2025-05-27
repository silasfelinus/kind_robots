// /stores/helpers/artHelper.ts

import type { Art, ArtImage } from '@prisma/client'
import type { ArtCollection } from '@/stores/artStore'

/**
 * Extract pitch string from a comma-delimited prompt.
 */
export function extractPitch(promptString: string): string {
  return promptString.split(',')[0].trim() || 'Untitled Pitch'
}

/**
 * Ensure prompt contains only valid characters.
 */
export function validatePromptString(prompt: string): boolean {
  const validPattern = /^[a-zA-Z0-9 ,_<>:]+$/
  return validPattern.test(prompt)
}

/**
 * Add Art to a collection in local state only if not already present.
 */
export function addArtToCollectionLocal(
  collection: ArtCollection,
  art: Art,
): void {
  if (!collection.art) collection.art = []
  const exists = collection.art.some((a) => a.id === art.id)
  if (!exists) collection.art.push(art)
}

/**
 * Check if a given artId is already in the collection.
 */
export function isArtInCollection(
  collection: ArtCollection,
  artId: number,
): boolean {
  return collection.art?.some((a) => a.id === artId) || false
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
 * Compute uncollected art for a given user.
 */
export function getUncollectedArt(
  userId: number,
  allArt: Art[],
  collections: ArtCollection[],
): Art[] {
  const collectedIds = collections
    .filter((c) => c.userId === userId)
    .flatMap((c) => c.art.map((a) => a.id))

  return allArt.filter(
    (a) => a.userId === userId && !collectedIds.includes(a.id),
  )
}

/**
 * Replace __placeholder__ strings in a prompt using pitchStore random entries.
 */
export function processPromptPlaceholders(
  prompt: string,
  pitchStore: { randomEntry: (label: string) => string },
): string {
  return prompt.replace(/__(.*?)__/g, (_, label) =>
    pitchStore.randomEntry(label),
  )
}

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
 * Parse stored ArtCollection[] from localStorage string.
 */
export function parseStoredCollections(value: string): ArtCollection[] {
  try {
    return JSON.parse(value) as ArtCollection[]
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

export function findCollectionByUserAndLabel(
  collections: ArtCollection[],
  userId: number,
  label: string,
): ArtCollection | undefined {
  return collections.find(
    (collection) => collection.userId === userId && collection.label === label,
  )
}

export function getCollectedArtIds(
  userId: number,
  collections: ArtCollection[],
): number[] {
  return collections
    .filter((c) => c.userId === userId)
    .flatMap((c) => c.art.map((a) => a.id))
}

export function collectionIncludesArtId(
  collection: ArtCollection,
  artId: number,
): boolean {
  return !!collection.art?.some((a) => a.id === artId)
}

export function removeArtFromLocalCollection(
  collection: ArtCollection,
  artId: number,
): void {
  if (!collection.art) return
  collection.art = collection.art.filter((a) => a.id !== artId)
}

export function findCollectionById(
  collections: ArtCollection[],
  collectionId: number,
): ArtCollection | undefined {
  return collections.find((c) => c.id === collectionId)
}

export function createEmptyCollection(
  id: number,
  userId: number,
  label: string | null = null,
): ArtCollection {
  return {
    id,
    userId,
    label,
    createdAt: new Date(),
    updatedAt: null,
    art: [],
  }
}

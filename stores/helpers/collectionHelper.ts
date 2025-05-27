// /stores/helpers/collectionHelper.ts

import type { Art } from '@prisma/client'
import type { ArtCollection } from '@/stores/artStore'
import { performFetch, handleError } from '@/stores/utils'

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
 * Find a collection by user and label.
 */
export function findCollectionByUserAndLabel(
  collections: ArtCollection[],
  userId: number,
  label: string,
): ArtCollection | undefined {
  return collections.find(
    (collection) => collection.userId === userId && collection.label === label,
  )
}

/**
 * Create a new art collection on the server for the given user.
 */
export async function createCollectionForUser(
  label: string,
  userId: number,
): Promise<ArtCollection | null> {
  try {
    const response = await performFetch<ArtCollection>('/api/art/collection', {
      method: 'POST',
      body: JSON.stringify({ label, userId }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data) {
      return response.data
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    handleError(error, 'creating collection')
    return null
  }
}

/**
 * Delete a collection by ID on the server.
 */
export async function deleteCollectionById(
  collectionId: number,
): Promise<boolean> {
  try {
    const response = await performFetch(`/api/art/collection/${collectionId}`, {
      method: 'DELETE',
    })

    if (!response.success) throw new Error(response.message)
    return true
  } catch (error) {
    handleError(error, 'deleting collection')
    return false
  }
}

/**
 * Remove an art item from a specific collection on the server.
 */
export async function removeArtFromCollectionServer(
  collectionId: number,
  artId: number,
): Promise<boolean> {
  try {
    const response = await performFetch(
      `/api/art/collection/${collectionId}/${artId}`,
      { method: 'DELETE' },
    )

    if (!response.success) throw new Error(response.message)
    return true
  } catch (error) {
    handleError(error, 'removing art from collection')
    return false
  }
}

/**
 * Get all collected art IDs for a user.
 */
export function getCollectedArtIds(
  userId: number,
  collections: ArtCollection[],
): number[] {
  return collections
    .filter((c) => c.userId === userId)
    .flatMap((c) => c.art.map((a) => a.id))
}

/**
 * Check if a collection includes a specific art ID.
 */
export function collectionIncludesArtId(
  collection: ArtCollection,
  artId: number,
): boolean {
  return !!collection.art?.some((a) => a.id === artId)
}

/**
 * Remove an art item from local collection state.
 */
export function removeArtFromLocalCollection(
  collection: ArtCollection,
  artId: number,
): void {
  if (!collection.art) return
  collection.art = collection.art.filter((a) => a.id !== artId)
}

/**
 * Find a collection by ID.
 */
export function findCollectionById(
  collections: ArtCollection[],
  collectionId: number,
): ArtCollection | undefined {
  return collections.find((c) => c.id === collectionId)
}

/**
 * Create a placeholder collection locally.
 */
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

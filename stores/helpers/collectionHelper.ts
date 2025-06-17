// /stores/helpers/collectionHelper.ts
import type { ArtCollection as PrismaArtCollection, Art } from '@prisma/client'

export interface ArtCollection extends PrismaArtCollection {
  art: Art[]
  username: string | null
  description: string | null
}

export function addArtToCollectionLocal(
  collection: ArtCollection,
  art: Art,
): void {
  if (!collection.art) collection.art = []
  const exists = collection.art.some((a) => a.id === art.id)
  if (!exists) collection.art.push(art)
}

export function isArtInCollection(
  collection: ArtCollection,
  artId: number,
): boolean {
  return collection.art?.some((a) => a.id === artId) || false
}

export function findCollectionByUserAndLabel(
  collections: ArtCollection[],
  userId: number,
  label: string,
): ArtCollection | undefined {
  return collections.find((c) => c.userId === userId && c.label === label)
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
    isPublic: false,
    isMature: false,
    username: null,
    description: null,
    art: [],
  }
}

export function parseStoredCollections(value: string): ArtCollection[] {
  try {
    return JSON.parse(value) as ArtCollection[]
  } catch {
    return []
  }
}

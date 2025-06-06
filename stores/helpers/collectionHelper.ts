// /stores/helpers/collectionHelper.ts
import type { ArtCollection as PrismaArtCollection, Art } from '@prisma/client'
import { useUserStore } from './../userStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { performFetch } from '@/stores/utils'

const userStore = useUserStore()
const artStore = useArtStore()
const collectionStore = useCollectionStore()

const state = collectionStore
const isClient = typeof window !== 'undefined'

// Extend Prisma's type to include `art: Art[]`
export interface ArtCollection extends PrismaArtCollection {
  art: Art[]
}

export function addArtToCollectionLocal(
  collection: ArtCollection,
  art: Art,
): void {
  if (!collection.art) collection.art = []
  const exists = collection.art.some((a) => a.id === art.id)
  if (!exists) collection.art.push(art)
}

export async function fetchUncollectedArt() {
  return getUncollectedArt(userStore.userId, artStore.art, state.collections)
}

export async function getOrCreateGeneratedArtCollection(
  userId: number,
): Promise<ArtCollection> {
  let collection = findCollectionByUserAndLabel(
    state.collections,
    userId,
    'Generated Art',
  )
  if (!collection) {
    const response = await performFetch<ArtCollection>('/api/art/collection', {
      method: 'POST',
      body: JSON.stringify({ label: 'Generated Art', userId }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.success || !response.data) throw new Error(response.message)
    collection = response.data
    state.collections.push(collection)
  }
  return collection
}

export async function createCollection(label: string): Promise<void> {
  const userStore = useUserStore()
  const userId = userStore.userId
  const response = await performFetch<ArtCollection>('/api/art/collection', {
    method: 'POST',
    body: JSON.stringify({ label, userId }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.success || !response.data) throw new Error(response.message)
  state.collections.push(response.data)
  state.currentCollection = response.data
}

export async function removeArtFromCollection(
  artId: number,
  collectionId: number,
) {
  const success = await collectionStore.removeArtFromCollectionServer(
    collectionId,
    artId,
  )
  if (success) {
    const collection = findCollectionById(state.collections, collectionId)
    if (collection) {
      removeArtFromLocalCollection(collection, artId)
    }
  }
}

export function getUserCollections(userId: number): ArtCollection[] {
  return state.collections.filter((c: ArtCollection) => c.userId === userId)
}

export async function addArtToCollection({
  artId,
  collectionId,
  label = '',
}: {
  artId: number
  collectionId?: number
  label?: string
}) {
  const userId = userStore.userId
  let collection =
    collectionId != null
      ? findCollectionById(state.collections, collectionId)
      : findCollectionByUserAndLabel(state.collections, userId, label)

  if (!collection) {
    const res = await performFetch<ArtCollection>('/api/art/collection', {
      method: 'POST',
      body: JSON.stringify({ label, userId }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.success || !res.data) throw new Error(res.message)
    collection = res.data
    state.collections.push(collection)
  }

  await performFetch(`/api/art/collection/${collection.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ artIds: [artId] }),
    headers: { 'Content-Type': 'application/json' },
  })

  const art = artStore.art.find((a: Art) => a.id === artId)
  if (art) addArtToCollectionLocal(collection, art)
}

// Delete a collection
export async function deleteCollectionById(
  collectionId: number,
): Promise<boolean> {
  try {
    const response = await performFetch(`/api/art/collection/${collectionId}`, {
      method: 'DELETE',
    })
    if (!response.success) throw new Error(response.message)
    state.collections = state.collections.filter(
      (c: ArtCollection) => c.id !== collectionId,
    )
    return true
  } catch (error) {
    handleError(error, 'deleting collection')
    return false
  }
}

export function isArtInCollection(
  collection: ArtCollection,
  artId: number,
): boolean {
  return collection.art?.some((a) => a.id === artId) || false
}

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

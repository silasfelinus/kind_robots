// /stores/helpers/collectionHelper.ts
import type { ArtCollection as PrismaArtCollection, Art } from '@prisma/client'
import { performFetch } from '@/stores/utils'

export interface ArtCollection extends PrismaArtCollection {
  art: Art[]
}

// Lazy store access to avoid circular imports
const getUserStore = () => useUserStore()
const getArtStore = () => useArtStore()
const getCollectionStore = () => useCollectionStore()

export function addArtToCollectionLocal(
  collection: ArtCollection,
  art: Art,
): void {
  if (!collection.art) collection.art = []
  const exists = collection.art.some((a) => a.id === art.id)
  if (!exists) collection.art.push(art)
}

export async function fetchUncollectedArt() {
  const userStore = getUserStore()
  const artStore = getArtStore()
  const collectionStore = getCollectionStore()
  return getUncollectedArt(
    userStore.userId,
    artStore.art,
    collectionStore.collections,
  )
}

export async function getOrCreateGeneratedArtCollection(
  userId: number,
): Promise<ArtCollection> {
  const store = getCollectionStore()
  let collection = findCollectionByUserAndLabel(
    store.collections,
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
    store.collections.push(collection)
  }
  return collection
}

export async function createCollection(label: string): Promise<void> {
  const userStore = getUserStore()
  const store = getCollectionStore()
  const response = await performFetch<ArtCollection>('/api/art/collection', {
    method: 'POST',
    body: JSON.stringify({ label, userId: userStore.userId }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.success || !response.data) throw new Error(response.message)
  store.collections.push(response.data)
  store.currentCollection = response.data
}

export async function removeArtFromCollection(
  artId: number,
  collectionId: number,
) {
  const store = getCollectionStore()
  const success = await store.removeArtFromCollectionServer(collectionId, artId)
  if (success) {
    const collection = findCollectionById(store.collections, collectionId)
    if (collection) {
      removeArtFromLocalCollection(collection, artId)
    }
  }
}

export function getUserCollections(userId: number): ArtCollection[] {
  return getCollectionStore().collections.filter((c) => c.userId === userId)
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
  const userStore = getUserStore()
  const artStore = getArtStore()
  const collectionStore = getCollectionStore()

  let collection =
    collectionId != null
      ? findCollectionById(collectionStore.collections, collectionId)
      : findCollectionByUserAndLabel(
          collectionStore.collections,
          userStore.userId,
          label,
        )

  if (!collection) {
    const res = await performFetch<ArtCollection>('/api/art/collection', {
      method: 'POST',
      body: JSON.stringify({ label, userId: userStore.userId }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.success || !res.data) throw new Error(res.message)
    collection = res.data
    collectionStore.collections.push(collection)
  }

  await performFetch(`/api/art/collection/${collection.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ artIds: [artId] }),
    headers: { 'Content-Type': 'application/json' },
  })

  const art = artStore.art.find((a) => a.id === artId)
  if (art) addArtToCollectionLocal(collection, art)
}

export async function deleteCollectionById(
  collectionId: number,
): Promise<boolean> {
  const store = getCollectionStore()
  try {
    const response = await performFetch(`/api/art/collection/${collectionId}`, {
      method: 'DELETE',
    })
    if (!response.success) throw new Error(response.message)
    store.collections = store.collections.filter((c) => c.id !== collectionId)
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

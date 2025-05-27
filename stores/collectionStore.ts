// /stores/collectionStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type { Art } from '@prisma/client'
import { performFetch, handleError } from './utils'

// Local override to reflect nested art[] relation
export interface ArtCollection {
  id: number
  userId: number
  createdAt: Date
  updatedAt: Date | null
  label: string | null
  art: Art[]
}

export const useCollectionStore = defineStore('collectionStore', () => {
  const state = reactive({
    collections: [] as ArtCollection[],
    currentCollection: null as ArtCollection | null,
  })

  // Fetch all collections
  async function fetchCollections() {
    try {
      const response = await performFetch<ArtCollection[]>(
        '/api/art/collection',
      )
      if (!response.success || !response.data) throw new Error(response.message)
      state.collections = response.data
    } catch (error) {
      handleError(error, 'fetching collections')
    }
  }

  // Create a new collection
  async function createCollection(
    label: string,
    userId: number,
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<ArtCollection>(
        '/api/art/collection',
        {
          method: 'POST',
          body: JSON.stringify({ label, userId }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success || !response.data) throw new Error(response.message)
      state.collections.push(response.data)
      state.currentCollection = response.data
      return response.data
    } catch (error) {
      handleError(error, 'creating collection')
      return null
    }
  }

  // Delete a collection
  async function deleteCollectionById(collectionId: number): Promise<boolean> {
    try {
      const response = await performFetch(
        `/api/art/collection/${collectionId}`,
        {
          method: 'DELETE',
        },
      )
      if (!response.success) throw new Error(response.message)
      state.collections = state.collections.filter((c) => c.id !== collectionId)
      return true
    } catch (error) {
      handleError(error, 'deleting collection')
      return false
    }
  }

  // Remove art from a collection on the server and locally
  async function removeArtFromCollectionServer(
    collectionId: number,
    artId: number,
  ): Promise<boolean> {
    try {
      const response = await performFetch(
        `/api/art/collection/${collectionId}/${artId}`,
        {
          method: 'DELETE',
        },
      )
      if (!response.success) throw new Error(response.message)

      const collection = findCollectionById(collectionId)
      if (collection) {
        collection.art = collection.art.filter((a) => a.id !== artId)
      }
      return true
    } catch (error) {
      handleError(error, 'removing art from collection')
      return false
    }
  }

  async function addArtToCollection({
    art,
    userId,
    label = '',
    collectionId,
  }: {
    art: Art
    userId: number
    label?: string
    collectionId?: number
  }) {
    let collection: ArtCollection | null =
      collectionId != null
        ? (findCollectionById(collectionId) ?? null)
        : (findCollectionByUserAndLabel(userId, label) ?? null)

    if (!collection) {
      collection = await createCollection(label, userId)
      if (!collection) return
    }

    await performFetch(`/api/art/collection/${collection.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ artIds: [art.id] }),
      headers: { 'Content-Type': 'application/json' },
    })

    // Ensure .art exists before using it
    if (!collection.art) collection.art = []

    const exists = collection.art.some((a) => a.id === art.id)
    if (!exists) collection.art.push(art)
  }

  function getUserCollections(userId: number): ArtCollection[] {
    return state.collections.filter((c) => c.userId === userId)
  }

  function findCollectionById(collectionId: number): ArtCollection | undefined {
    return state.collections.find((c) => c.id === collectionId)
  }

  function findCollectionByUserAndLabel(
    userId: number,
    label: string,
  ): ArtCollection | undefined {
    return state.collections.find(
      (c) => c.userId === userId && c.label === label,
    )
  }

  async function getOrCreateGeneratedArtCollection(
    userId: number,
  ): Promise<ArtCollection> {
    let collection = findCollectionByUserAndLabel(userId, 'Generated Art')
    if (!collection) {
      const newCollection = await createCollection('Generated Art', userId)
      if (!newCollection)
        throw new Error('Could not create Generated Art collection')
      collection = newCollection
    }
    return collection
  }

  return {
    ...toRefs(state),
    fetchCollections,
    createCollection,
    deleteCollectionById,
    removeArtFromCollectionServer,
    addArtToCollection,
    getUserCollections,
    findCollectionById,
    findCollectionByUserAndLabel,
    getOrCreateGeneratedArtCollection,
  }
})

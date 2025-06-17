// /stores/collectionStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, toRefs, computed, watch } from 'vue'
import type { Art } from '@prisma/client'
import { performFetch, handleError } from './utils'
import {
  addArtToCollectionLocal,
  fetchUncollectedArt,
  removeArtFromCollection,
  getUserCollections,
  addArtToCollection,
  getOrCreateGeneratedArtCollection,
  findCollectionByUserAndLabel,
  createCollection,
  findCollectionById,
  deleteCollectionById,
  isArtInCollection,
  getUncollectedArt,
  getCollectedArtIds,
  collectionIncludesArtId,
  removeArtFromLocalCollection,
  createEmptyCollection,
  parseStoredCollections,
} from '@/stores/helpers/collectionHelper'

export interface ArtCollection {
  id: number
  userId: number
  createdAt: Date
  updatedAt: Date | null
  label: string | null
  art: Art[]
  isPublic: boolean
  isMature: boolean
  username?: string
  description?: string
}

export const useCollectionStore = defineStore('collectionStore', () => {
  const state = reactive({
    collections: [] as ArtCollection[],
    currentCollection: null as ArtCollection | null,
    autoSave: true,
  })

  // --- Multi-selection state + persistence ---
  const SELECTED_COLLECTION_KEY = 'selectedCollectionIds'
  const selectedCollectionIds = ref<number[]>([])

  function findCollectionById(collectionId: number): ArtCollection | undefined {
    return state.collections.find((c) => c.id === collectionId)
  }

  const selectedCollections = computed(() =>
    selectedCollectionIds.value
      .map((id) => findCollectionById(id))
      .filter((c): c is ArtCollection => !!c)
  )

  if (process.client) {
    const stored = localStorage.getItem(SELECTED_COLLECTION_KEY)
    if (stored) {
      try {
        selectedCollectionIds.value = JSON.parse(stored)
      } catch (e) {
        console.warn('Invalid collection selection in localStorage:', e)
      }
    }
  }

  watch(selectedCollectionIds, (ids) => {
    if (process.client) {
      localStorage.setItem(SELECTED_COLLECTION_KEY, JSON.stringify(ids))
    }
  }, { deep: true })

  // --- API + logic methods ---
  async function fetchCollections() {
    try {
      const response = await performFetch<ArtCollection[]>('/api/art/collection')
      if (!response.success || !response.data) throw new Error(response.message)
      state.collections = response.data
    } catch (error) {
      handleError(error, 'fetching collections')
    }
  }

  async function createCollection(
    label: string,
    userId: number,
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<ArtCollection>('/api/art/collection', {
        method: 'POST',
        body: JSON.stringify({ label, userId }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) throw new Error(response.message)
      state.collections.push(response.data)
      state.currentCollection = response.data
      return response.data
    } catch (error) {
      handleError(error, 'creating collection')
      return null
    }
  }

  async function removeArtFromCollectionServer(
    collectionId: number,
    artId: number,
  ): Promise<boolean> {
    try {
      const response = await performFetch(
        `/api/art/collection/${collectionId}/${artId}`,
        { method: 'DELETE' }
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

  function getUserCollections(userId: number): ArtCollection[] {
    return state.collections.filter((c) => c.userId === userId)
  }

  async function updateCollectionLabel(
    id: number,
    newLabel: string,
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<ArtCollection>(
        `/api/art/collection/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ label: newLabel }),
          headers: { 'Content-Type': 'application/json' },
        },
      )
      if (!response.success || !response.data) throw new Error(response.message)
      const index = state.collections.findIndex((c) => c.id === id)
      if (index !== -1) state.collections[index] = response.data
      return response.data
    } catch (error) {
      handleError(error, 'updating collection label')
      return null
    }
  }

  async function updateCollectionFlags(
    id: number,
    flags: { isPublic?: boolean; isMature?: boolean },
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<ArtCollection>(
        `/api/art/collection/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(flags),
          headers: { 'Content-Type': 'application/json' },
        },
      )
      if (!response.success || !response.data) throw new Error(response.message)
      const index = state.collections.findIndex((c) => c.id === id)
      if (index !== -1) state.collections[index] = response.data
      return response.data
    } catch (error) {
      handleError(error, 'updating collection flags')
      return null
    }
  }

  async function getOrCreateGeneratedArtCollection(userId: number): Promise<ArtCollection> {
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

    selectedCollectionIds,
    selectedCollections,

    fetchCollections,
    createCollection,
    removeArtFromCollectionServer,
    updateCollectionLabel,
    updateCollectionFlags,
    findCollectionById,
    findCollectionByUserAndLabel,
    getUserCollections,
    getOrCreateGeneratedArtCollection,

    // From helper
    addArtToCollection,
    addArtToCollectionLocal,
    removeArtFromCollection,
    removeArtFromLocalCollection,
    deleteCollectionById,
    isArtInCollection,
    getCollectedArtIds,
    getUncollectedArt,
    fetchUncollectedArt,
    collectionIncludesArtId,
    createEmptyCollection,
    parseStoredCollections,
  }
})

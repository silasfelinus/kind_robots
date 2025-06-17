// /stores/collectionStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, toRefs, computed, watch } from 'vue'
import type { Art } from '@prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { performFetch, handleError } from './utils'
import {
  isArtInCollection,
  findCollectionByUserAndLabel,
  getCollectedArtIds,
  collectionIncludesArtId,
  removeArtFromLocalCollection,
  findCollectionById,
  createEmptyCollection,
  parseStoredCollections,
} from '@/stores/helpers/collectionHelper'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

export const useCollectionStore = defineStore('collectionStore', () => {
  const state = reactive({
    collections: [] as ArtCollection[],
    currentCollection: null as ArtCollection | null,
    autoSave: true,
  })

  const userStore = useUserStore()
  const artStore = useArtStore()

  const SELECTED_COLLECTION_KEY = 'selectedCollectionIds'
  const selectedCollectionIds = ref<number[]>([])

  function findCollectionById(collectionId: number): ArtCollection | undefined {
    return state.collections.find((c) => c.id === collectionId)
  }

  const selectedCollections = computed(() =>
    selectedCollectionIds.value
      .map((id) => findCollectionById(id))
      .filter((c): c is ArtCollection => !!c),
  )

  if (import.meta.client) {
    const stored = localStorage.getItem(SELECTED_COLLECTION_KEY)
    if (stored) {
      try {
        selectedCollectionIds.value = JSON.parse(stored)
      } catch (e) {
        console.warn('Invalid collection selection in localStorage:', e)
      }
    }
  }

  watch(
    selectedCollectionIds,
    (ids) => {
      if (import.meta.client) {
        localStorage.setItem(SELECTED_COLLECTION_KEY, JSON.stringify(ids))
      }
    },
    { deep: true },
  )

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

  function getUncollectedArt(): Art[] {
    const collectedIds = state.collections
      .filter((c) => c.userId === userStore.userId)
      .flatMap((c) => c.art.map((a) => a.id))
    return artStore.art.filter(
      (a) => a.userId === userStore.userId && !collectedIds.includes(a.id),
    )
  }

  async function createCollection(
    label: string,
    userId: number,
    isPublic?: boolean,
    isMature?: boolean,
  ): Promise<ArtCollection> {
    const body: Record<string, unknown> = { label, userId }
    if (typeof isPublic === 'boolean') body.isPublic = isPublic
    if (typeof isMature === 'boolean') body.isMature = isMature

    const response = await performFetch<ArtCollection>('/api/art/collection', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.success || !response.data) throw new Error(response.message)
    state.collections.push(response.data)
    state.currentCollection = response.data
    return response.data
  }

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

  async function addArtToCollection({
    artId,
    collectionId,
    label = '',
  }: {
    artId: number
    collectionId?: number
    label?: string
  }) {
    let collection =
      collectionId != null
        ? findCollectionById(collectionId)
        : findCollectionByUserAndLabel(
            state.collections,
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
      state.collections.push(collection)
    }

    const response = await performFetch<ArtCollection>(
      `/api/art/collection/${collection.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ artIds: [artId] }),
        headers: { 'Content-Type': 'application/json' },
      },
    )

    if (response.success && response.data) {
      const index = state.collections.findIndex((c) => c.id === collection!.id)
      if (index !== -1) state.collections[index] = response.data
    }
  }

  async function removeArtFromCollection(artId: number, collectionId: number) {
    const success = await removeArtFromCollectionServer(collectionId, artId)
    if (success) {
      const collection = findCollectionById(collectionId)
      if (collection) removeArtFromLocalCollection(collection, artId)
    }
  }

  async function removeArtFromCollectionServer(
    collectionId: number,
    artId: number,
  ): Promise<boolean> {
    try {
      const response = await performFetch(
        `/api/art/collection/${collectionId}/${artId}`,
        { method: 'DELETE' },
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

  async function getOrCreateGeneratedArtCollection(
    userId: number,
  ): Promise<ArtCollection> {
    const username = userStore.username?.trim()
    const label = username ? `${username}'s Art` : 'Generated Art'

    let collection = findCollectionByUserAndLabel(
      state.collections,
      userId,
      label,
    )

    if (!collection && label !== 'Generated Art') {
      collection = findCollectionByUserAndLabel(
        state.collections,
        userId,
        'Generated Art',
      )
    }

    if (!collection) {
      const newCollection = await createCollection(label, userId, false, false)
      if (!newCollection) {
        throw new Error('Could not create user art collection')
      }
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
    deleteCollectionById,
    addArtToCollection,
    removeArtFromCollection,
    removeArtFromCollectionServer,
    updateCollectionLabel,
    updateCollectionFlags,
    findCollectionById,
    findCollectionByUserAndLabel,
    getUserCollections,
    getOrCreateGeneratedArtCollection,

    // From helper
    isArtInCollection,
    getCollectedArtIds,
    getUncollectedArt,
    collectionIncludesArtId,
    removeArtFromLocalCollection,
    createEmptyCollection,
    parseStoredCollections,
  }
})

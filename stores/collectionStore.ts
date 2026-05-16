// /stores/collectionStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, toRefs, computed, watch } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { performFetch, handleError } from './utils'
import {
  isArtInCollection,
  findCollectionByUserAndLabel,
  getCollectedArtIds,
  collectionIncludesArtId,
  removeArtFromLocalCollection,
  createEmptyCollection,
  parseStoredCollections,
} from '@/stores/helpers/collectionHelper'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

const isClient = typeof window !== 'undefined'

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

  const hasFetched = ref(false)
  const fetchPromise = ref<Promise<void> | null>(null)
  const createLocks = ref<Partial<Record<string, Promise<ArtCollection>>>>({})
  const mutationLocks = ref<Partial<Record<string, Promise<void>>>>({})

  function findCollectionByIdLocal(
    collectionId: number,
  ): ArtCollection | undefined {
    return state.collections.find(
      (collection) => collection.id === collectionId,
    )
  }

  const selectedCollections = computed(() =>
    selectedCollectionIds.value
      .map((id) => findCollectionByIdLocal(id))
      .filter((collection): collection is ArtCollection => !!collection),
  )

  function loadSelectedCollectionIds() {
    if (!isClient) return

    const stored = localStorage.getItem(SELECTED_COLLECTION_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        selectedCollectionIds.value = parsed.filter((id) =>
          Number.isFinite(id),
        ) as number[]
      }
    } catch (error) {
      console.warn('Invalid collection selection in localStorage:', error)
    }
  }

  function persistSelectedCollectionIds() {
    if (!isClient) return
    localStorage.setItem(
      SELECTED_COLLECTION_KEY,
      JSON.stringify(selectedCollectionIds.value),
    )
  }

  loadSelectedCollectionIds()

  watch(
    selectedCollectionIds,
    () => {
      persistSelectedCollectionIds()
    },
    { deep: true },
  )

  async function fetchCollections(force = false): Promise<void> {
    if (!force && hasFetched.value) return
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      try {
        const response = await performFetch<ArtCollection[]>(
          '/api/art/collection',
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch collections')
        }

        
        
// In collectionStore.fetchCollections, after receiving data:
state.collections = response.data.map(collection => ({
  ...collection,
  art: (collection.art ?? []).map(a => {
    const { ArtCollections, artCollections, ArtImage, Tags, Reactions, ...rest } = a as any
    return rest
  }),
}))
hasFetched.value = true


        if (
          state.currentCollection &&
          !state.collections.some(
            (collection) => collection.id === state.currentCollection?.id,
          )
        ) {
          state.currentCollection = null
        }
      } catch (error) {
        handleError(error, 'fetching collections')
        hasFetched.value = false
      } finally {
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  function getUncollectedArt(): Art[] {
    const collectedIds = state.collections
      .filter((collection) => collection.userId === userStore.userId)
      .flatMap((collection) => collection.art.map((art) => art.id))

    return artStore.art.filter(
      (art) =>
        art.userId === userStore.userId && !collectedIds.includes(art.id),
    )
  }

  async function updateCollectionDetails(
    id: number,
    updates: {
      label?: string
      description?: string
      isPublic?: boolean
      isMature?: boolean
    },
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<ArtCollection>(
        `/api/art/collection/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update collection')
      }

      const index = state.collections.findIndex((collection) => {
        return collection.id === id
      })

      if (index !== -1) {
        state.collections[index] = response.data
      }

      if (state.currentCollection?.id === id) {
        state.currentCollection = response.data
      }

      return response.data
    } catch (error) {
      handleError(error, 'updating collection details')
      return null
    }
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

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create collection')
    }

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

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete collection')
      }

      state.collections = state.collections.filter(
        (collection) => collection.id !== collectionId,
      )

      if (state.currentCollection?.id === collectionId) {
        state.currentCollection = null
      }

      selectedCollectionIds.value = selectedCollectionIds.value.filter(
        (id) => id !== collectionId,
      )

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
  }): Promise<void> {
    const lockKey = `${collectionId ?? label}:${artId}`

    if (mutationLocks.value[lockKey]) {
      return mutationLocks.value[lockKey]
    }

    mutationLocks.value[lockKey] = (async () => {
      try {
        let collection =
          collectionId != null
            ? findCollectionByIdLocal(collectionId)
            : findCollectionByUserAndLabel(
                state.collections,
                userStore.userId,
                label,
              )

        if (!collection) {
          const response = await performFetch<ArtCollection>(
            '/api/art/collection',
            {
              method: 'POST',
              body: JSON.stringify({ label, userId: userStore.userId }),
              headers: { 'Content-Type': 'application/json' },
            },
          )

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to create collection')
          }

          collection = response.data
          state.collections.push(collection)
        }

        if (collectionIncludesArtId(collection, artId)) {
          return
        }

        const response = await performFetch<ArtCollection>(
          `/api/art/collection/${collection.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ addArtIds: [artId] }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          const index = state.collections.findIndex(
            (existingCollection) => existingCollection.id === collection!.id,
          )

          if (index !== -1) {
            state.collections[index] = response.data
          }
        } else {
          throw new Error(response.message || 'Failed to add art to collection')
        }
      } catch (error) {
        handleError(error, 'adding art to collection')
      } finally {
        delete mutationLocks.value[lockKey]
      }
    })()

    return mutationLocks.value[lockKey]
  }

  async function removeArtFromCollection(
    artId: number,
    collectionId: number,
  ): Promise<void> {
    const success = await removeArtFromCollectionServer(collectionId, artId)

    if (success) {
      const collection = findCollectionByIdLocal(collectionId)
      if (collection) {
        removeArtFromLocalCollection(collection, artId)
      }
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

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to remove art from collection',
        )
      }

      const collection = findCollectionByIdLocal(collectionId)
      if (collection) {
        collection.art = collection.art.filter((art) => art.id !== artId)
      }

      return true
    } catch (error) {
      handleError(error, 'removing art from collection')
      return false
    }
  }

  function getUserCollections(userId: number): ArtCollection[] {
    return state.collections.filter(
      (collection) => collection.userId === userId,
    )
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

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update collection label')
      }

      const index = state.collections.findIndex(
        (collection) => collection.id === id,
      )

      if (index !== -1) {
        state.collections[index] = response.data
      }

      if (state.currentCollection?.id === id) {
        state.currentCollection = response.data
      }

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

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update collection flags')
      }

      const index = state.collections.findIndex(
        (collection) => collection.id === id,
      )

      if (index !== -1) {
        state.collections[index] = response.data
      }

      if (state.currentCollection?.id === id) {
        state.currentCollection = response.data
      }

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
    const fallbackLabel = 'Generated Art'
    const lockKey = `${userId}:${label}`

    if (createLocks.value[lockKey]) {
      return createLocks.value[lockKey]
    }

    createLocks.value[lockKey] = (async () => {
      let collection = findCollectionByUserAndLabel(
        state.collections,
        userId,
        label,
      )

      if (!collection && label !== fallbackLabel) {
        collection = findCollectionByUserAndLabel(
          state.collections,
          userId,
          fallbackLabel,
        )
      }

      if (!collection) {
        const newCollection = await createCollection(
          label,
          userId,
          false,
          false,
        )
        if (!newCollection) {
          throw new Error('Could not create user art collection')
        }
        collection = newCollection
      }

      return collection
    })()

    try {
      return await createLocks.value[lockKey]
    } finally {
      delete createLocks.value[lockKey]
    }
  }

  function setCurrentCollection(collectionId: number | null): void {
    if (collectionId === null) {
      state.currentCollection = null
      return
    }

    state.currentCollection = findCollectionByIdLocal(collectionId) ?? null
  }

  function setSelectedCollectionIds(ids: number[]): void {
    selectedCollectionIds.value = ids.filter((id) => Number.isFinite(id))
  }

  function toggleSelectedCollectionId(collectionId: number): void {
    if (selectedCollectionIds.value.includes(collectionId)) {
      selectedCollectionIds.value = selectedCollectionIds.value.filter(
        (id) => id !== collectionId,
      )
      return
    }

    selectedCollectionIds.value = [...selectedCollectionIds.value, collectionId]
  }

  function clearSelectedCollections(): void {
    selectedCollectionIds.value = []
  }

  return {
    ...toRefs(state),

    selectedCollectionIds,
    selectedCollections,
    hasFetched,
    fetchPromise,

    fetchCollections,
    createCollection,
    deleteCollectionById,
    addArtToCollection,
    removeArtFromCollection,
    removeArtFromCollectionServer,
    updateCollectionLabel,
    updateCollectionFlags,
    getUserCollections,
    getOrCreateGeneratedArtCollection,

    setCurrentCollection,
    setSelectedCollectionIds,
    toggleSelectedCollectionId,
    clearSelectedCollections,

    findCollectionById: findCollectionByIdLocal,
    findCollectionByUserAndLabel,

    isArtInCollection,
    getCollectedArtIds,
    getUncollectedArt,
    collectionIncludesArtId,
    removeArtFromLocalCollection,
    createEmptyCollection,
    parseStoredCollections,
    updateCollectionDetails,
  }
})

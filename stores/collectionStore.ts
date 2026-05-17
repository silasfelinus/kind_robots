// /stores/collectionStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs, watch } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
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

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

type ArtWithRelations = Art & {
  ArtImage?: ArtImage | null
  artImage?: ArtImage | null
  ArtCollections?: unknown
  artCollections?: unknown
  Tags?: unknown
  Reactions?: unknown
  Gallery?: unknown
  Server?: unknown
}

type CollectionWithRelations = ArtCollection & {
  Art?: ArtWithRelations[]
  art?: ArtWithRelations[]
  ArtImages?: ArtImage[]
  artImages?: ArtImage[]
  images?: ArtImage[]
}

type NormalizedCollection = ArtCollection & {
  Art?: Art[]
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
  images?: ArtImage[]
}

type CollectionState = {
  collections: ArtCollection[]
  currentCollection: ArtCollection | null
  autoSave: boolean
}

type AddArtToCollectionInput = {
  artId: number
  collectionId?: number
  label?: string
}

type AddArtImageToCollectionInput = {
  artImageId: number
  collectionId?: number
  label?: string
}

type CollectionPatchInput = {
  label?: string
  description?: string
  isPublic?: boolean
  isMature?: boolean
  addArtIds?: number[]
  removeArtIds?: number[]
}

function isValidId(value: unknown): value is number {
  return Number.isInteger(Number(value)) && Number(value) > 0
}

function isArtImagePayload(value: unknown): value is ArtImage {
  return Boolean(
    value && typeof value === 'object' && isValidId((value as ArtImage).id),
  )
}

function sanitizeCollectionArt(entry: ArtWithRelations): Art {
  const {
    ArtImage,
    artImage,
    ArtCollections,
    artCollections,
    Tags,
    Reactions,
    Gallery,
    Server,
    ...rest
  } = entry

  return rest as Art
}

function normalizeCollection(
  collection: CollectionWithRelations,
): ArtCollection {
  const rawArtSource = collection.art ?? collection.Art ?? []
  const rawArt = Array.isArray(rawArtSource)
    ? rawArtSource.map((entry) => entry as ArtWithRelations)
    : []

  const art = rawArt.map((entry) => sanitizeCollectionArt(entry))

  const directImages = [
    ...(collection.artImages ?? []),
    ...(collection.ArtImages ?? []),
    ...(collection.images ?? []),
  ].filter(isArtImagePayload)

  const imagesFromArt = rawArt.flatMap((entry) => {
    const media = entry as Record<string, unknown>

    return [media.ArtImage, media.artImage].filter(isArtImagePayload)
  })

  const imageMap = new Map<number, ArtImage>()

  for (const image of [...directImages, ...imagesFromArt]) {
    imageMap.set(image.id, image)
  }

  const artImages = Array.from(imageMap.values())

  return {
    ...collection,
    art,
    artImages,
    ArtImages: artImages,
  } as NormalizedCollection
}

function normalizeCollections(collections: CollectionWithRelations[]) {
  return collections.map((collection) => normalizeCollection(collection))
}

function getCollectionArtImages(collection: ArtCollection): ArtImage[] {
  const media = collection as NormalizedCollection

  return [
    ...(media.artImages ?? []),
    ...(media.ArtImages ?? []),
    ...(media.images ?? []),
  ].filter(isArtImagePayload)
}

function collectionIncludesArtImageId(
  collection: ArtCollection,
  artImageId: number,
): boolean {
  return getCollectionArtImages(collection).some((image) => {
    return image.id === artImageId
  })
}

function replaceCollectionLocal(
  collections: ArtCollection[],
  incoming: ArtCollection,
): ArtCollection[] {
  const normalized = normalizeCollection(incoming as CollectionWithRelations)
  const index = collections.findIndex((collection) => {
    return collection.id === normalized.id
  })

  if (index === -1) {
    return [...collections, normalized]
  }

  const next = [...collections]
  next[index] = normalized
  return next
}

function removeArtImageFromLocalCollection(
  collection: ArtCollection,
  artImageId: number,
): void {
  const mutable = collection as NormalizedCollection

  mutable.artImages = (mutable.artImages ?? []).filter((image) => {
    return image.id !== artImageId
  })

  mutable.ArtImages = (mutable.ArtImages ?? []).filter((image) => {
    return image.id !== artImageId
  })

  mutable.images = (mutable.images ?? []).filter((image) => {
    return image.id !== artImageId
  })
}

export const useCollectionStore = defineStore('collectionStore', () => {
  const state = reactive<CollectionState>({
    collections: [],
    currentCollection: null,
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

  const selectedCollections = computed(() => {
    return selectedCollectionIds.value
      .map((id) => findCollectionByIdLocal(id))
      .filter((collection): collection is ArtCollection => Boolean(collection))
  })

  const selectedCollectionArtImages = computed(() => {
    const imageMap = new Map<number, ArtImage>()

    for (const collection of selectedCollections.value) {
      for (const image of getCollectionArtImages(collection)) {
        imageMap.set(image.id, image)
      }
    }

    return Array.from(imageMap.values())
  })

  const allCollectionArtImages = computed(() => {
    const imageMap = new Map<number, ArtImage>()

    for (const collection of state.collections) {
      for (const image of getCollectionArtImages(collection)) {
        imageMap.set(image.id, image)
      }
    }

    return Array.from(imageMap.values())
  })

  const allCollectionArtImageIds = computed(() => {
    return allCollectionArtImages.value.map((image) => image.id)
  })

  function findCollectionByIdLocal(
    collectionId: number,
  ): ArtCollection | undefined {
    return state.collections.find((collection) => {
      return collection.id === collectionId
    })
  }

  function getCurrentUserId(): number {
    return Number(userStore.userId ?? userStore.user?.id ?? 10)
  }

  function loadSelectedCollectionIds(): void {
    if (!isClient) return

    const stored = localStorage.getItem(SELECTED_COLLECTION_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)

      if (Array.isArray(parsed)) {
        selectedCollectionIds.value = parsed
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      }
    } catch (error) {
      console.warn('Invalid collection selection in localStorage:', error)
    }
  }

  function persistSelectedCollectionIds(): void {
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
        const response = await performFetch<CollectionWithRelations[]>(
          '/api/art/collection',
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch collections')
        }

        state.collections = normalizeCollections(response.data)

        const images = state.collections.flatMap((collection) => {
          return getCollectionArtImages(collection)
        })

        if (
          images.length &&
          typeof artStore.addOrUpdateArtImages === 'function'
        ) {
          artStore.addOrUpdateArtImages(images)
        }

        hasFetched.value = true

        if (
          state.currentCollection &&
          !state.collections.some((collection) => {
            return collection.id === state.currentCollection?.id
          })
        ) {
          state.currentCollection = null
        }

        if (state.currentCollection) {
          state.currentCollection =
            findCollectionByIdLocal(state.currentCollection.id) ?? null
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

    return artStore.art.filter((art) => {
      return art.userId === userStore.userId && !collectedIds.includes(art.id)
    })
  }

  function getUncollectedArtImages(): ArtImage[] {
    const collectedIds = new Set(allCollectionArtImageIds.value)

    return artStore.artImages.filter((image) => {
      return image.userId === userStore.userId && !collectedIds.has(image.id)
    })
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
      const response = await performFetch<CollectionWithRelations>(
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

      const normalized = normalizeCollection(response.data)

      state.collections = replaceCollectionLocal(state.collections, normalized)

      if (state.currentCollection?.id === id) {
        state.currentCollection = normalized
      }

      return normalized
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

    const response = await performFetch<CollectionWithRelations>(
      '/api/art/collection',
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create collection')
    }

    const normalized = normalizeCollection(response.data)

    state.collections = replaceCollectionLocal(state.collections, normalized)
    state.currentCollection = normalized

    return normalized
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

      state.collections = state.collections.filter((collection) => {
        return collection.id !== collectionId
      })

      if (state.currentCollection?.id === collectionId) {
        state.currentCollection = null
      }

      selectedCollectionIds.value = selectedCollectionIds.value.filter((id) => {
        return id !== collectionId
      })

      return true
    } catch (error) {
      handleError(error, 'deleting collection')
      return false
    }
  }

  async function patchCollection(
    collectionId: number,
    patch: CollectionPatchInput,
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<CollectionWithRelations>(
        `/api/art/collection/${collectionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update collection')
      }

      const normalized = normalizeCollection(response.data)

      state.collections = replaceCollectionLocal(state.collections, normalized)

      if (state.currentCollection?.id === collectionId) {
        state.currentCollection = normalized
      }

      return normalized
    } catch (error) {
      handleError(error, 'patching collection')
      return null
    }
  }

  async function getOrCreateCollectionByLabel(
    label: string,
    userId = getCurrentUserId(),
    isPublic = false,
    isMature = false,
  ): Promise<ArtCollection> {
    const existing = findCollectionByUserAndLabel(
      state.collections,
      userId,
      label,
    )

    if (existing) return existing

    return await createCollection(label, userId, isPublic, isMature)
  }

  async function resolveCollectionForMutation({
    collectionId,
    label = '',
  }: {
    collectionId?: number
    label?: string
  }): Promise<ArtCollection> {
    if (collectionId != null) {
      const existing = findCollectionByIdLocal(collectionId)
      if (existing) return existing

      await fetchCollections(true)

      const fetched = findCollectionByIdLocal(collectionId)
      if (fetched) return fetched

      throw new Error(`Collection #${collectionId} was not found.`)
    }

    const safeLabel = label.trim() || 'Generated Art'

    return await getOrCreateCollectionByLabel(safeLabel)
  }

  async function addArtToCollection(
    input: AddArtToCollectionInput,
  ): Promise<void>
  async function addArtToCollection(
    collectionId: number,
    artId: number,
  ): Promise<void>
  async function addArtToCollection(
    inputOrCollectionId: AddArtToCollectionInput | number,
    maybeArtId?: number,
  ): Promise<void> {
    const input =
      typeof inputOrCollectionId === 'number'
        ? {
            collectionId: inputOrCollectionId,
            artId: Number(maybeArtId),
          }
        : inputOrCollectionId

    if (!isValidId(input.artId)) return

    const lockKey = `art:${input.collectionId ?? input.label ?? 'new'}:${
      input.artId
    }`

    if (mutationLocks.value[lockKey]) {
      return mutationLocks.value[lockKey]
    }

    mutationLocks.value[lockKey] = (async () => {
      try {
        const collection = await resolveCollectionForMutation({
          collectionId: input.collectionId,
          label: input.label,
        })

        if (collectionIncludesArtId(collection, input.artId)) {
          return
        }

        await patchCollection(collection.id, {
          addArtIds: [input.artId],
        })
      } catch (error) {
        handleError(error, 'adding art to collection')
      } finally {
        delete mutationLocks.value[lockKey]
      }
    })()

    return mutationLocks.value[lockKey]
  }

  async function addArtImageToCollection(
    input: AddArtImageToCollectionInput,
  ): Promise<void>
  async function addArtImageToCollection(
    collectionId: number,
    artImageId: number,
  ): Promise<void>
  async function addArtImageToCollection(
    inputOrCollectionId: AddArtImageToCollectionInput | number,
    maybeArtImageId?: number,
  ): Promise<void> {
    const input =
      typeof inputOrCollectionId === 'number'
        ? {
            collectionId: inputOrCollectionId,
            artImageId: Number(maybeArtImageId),
          }
        : inputOrCollectionId

    if (!isValidId(input.artImageId)) return

    const lockKey = `artImage:${input.collectionId ?? input.label ?? 'new'}:${
      input.artImageId
    }`

    if (mutationLocks.value[lockKey]) {
      return mutationLocks.value[lockKey]
    }

    mutationLocks.value[lockKey] = (async () => {
      try {
        const collection = await resolveCollectionForMutation({
          collectionId: input.collectionId,
          label: input.label,
        })

        if (collectionIncludesArtImageId(collection, input.artImageId)) {
          return
        }

        const response = await performFetch<ArtImage>(
          `/api/art/image/connections/${input.artImageId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              artCollectionIds: [collection.id],
            }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (!response.success || !response.data) {
          throw new Error(
            response.message || 'Failed to add art image to collection',
          )
        }

        artStore.addOrUpdateArtImages([response.data])

        await fetchCollections(true)
      } catch (error) {
        handleError(error, 'adding art image to collection')
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
        collection.art = collection.art.filter((art) => {
          return art.id !== artId
        })
      }

      return true
    } catch (error) {
      handleError(error, 'removing art from collection')
      return false
    }
  }

  async function removeArtImageFromCollection(
    artImageId: number,
    collectionId: number,
  ): Promise<void> {
    const success = await removeArtImageFromCollectionServer(
      collectionId,
      artImageId,
    )

    if (success) {
      const collection = findCollectionByIdLocal(collectionId)

      if (collection) {
        removeArtImageFromLocalCollection(collection, artImageId)
      }
    }
  }

  async function removeArtImageFromCollectionServer(
    collectionId: number,
    artImageId: number,
  ): Promise<boolean> {
    try {
      const response = await performFetch<ArtImage>(
        `/api/art/image/connections/${artImageId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            disconnectArtCollectionIds: [collectionId],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Failed to remove art image from collection',
        )
      }

      artStore.addOrUpdateArtImages([response.data])

      return true
    } catch (error) {
      handleError(error, 'removing art image from collection')
      return false
    }
  }

  function getUserCollections(userId: number): ArtCollection[] {
    return state.collections.filter((collection) => {
      return collection.userId === userId
    })
  }

  function getCollectionImages(collectionId: number): ArtImage[] {
    const collection = findCollectionByIdLocal(collectionId)
    if (!collection) return []
    return getCollectionArtImages(collection)
  }

  function getCollectionImageIds(collectionId: number): number[] {
    return getCollectionImages(collectionId).map((image) => image.id)
  }

  async function updateCollectionLabel(
    id: number,
    newLabel: string,
  ): Promise<ArtCollection | null> {
    try {
      const response = await performFetch<CollectionWithRelations>(
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

      const normalized = normalizeCollection(response.data)

      state.collections = replaceCollectionLocal(state.collections, normalized)

      if (state.currentCollection?.id === id) {
        state.currentCollection = normalized
      }

      return normalized
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
      const response = await performFetch<CollectionWithRelations>(
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

      const normalized = normalizeCollection(response.data)

      state.collections = replaceCollectionLocal(state.collections, normalized)

      if (state.currentCollection?.id === id) {
        state.currentCollection = normalized
      }

      return normalized
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
        collection = await createCollection(label, userId, false, false)
      }

      return collection
    })()

    try {
      return await createLocks.value[lockKey]
    } finally {
      delete createLocks.value[lockKey]
    }
  }

  async function getOrCreateGeneratedArtImageCollection(
    userId: number,
  ): Promise<ArtCollection> {
    return await getOrCreateGeneratedArtCollection(userId)
  }

  function setCurrentCollection(collectionId: number | null): void {
    if (collectionId === null) {
      state.currentCollection = null
      return
    }

    state.currentCollection = findCollectionByIdLocal(collectionId) ?? null
  }

  function setCurrentCollectionRecord(collection: ArtCollection | null): void {
    state.currentCollection = collection
      ? normalizeCollection(collection as CollectionWithRelations)
      : null
  }

  function setSelectedCollectionIds(ids: number[]): void {
    selectedCollectionIds.value = ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  }

  function toggleSelectedCollectionId(collectionId: number): void {
    if (selectedCollectionIds.value.includes(collectionId)) {
      selectedCollectionIds.value = selectedCollectionIds.value.filter((id) => {
        return id !== collectionId
      })
      return
    }

    selectedCollectionIds.value = [...selectedCollectionIds.value, collectionId]
  }

  function clearSelectedCollections(): void {
    selectedCollectionIds.value = []
  }

  function resetCollectionFetchState(): void {
    hasFetched.value = false
    fetchPromise.value = null
  }

  return {
    ...toRefs(state),

    selectedCollectionIds,
    selectedCollections,
    selectedCollectionArtImages,
    allCollectionArtImages,
    allCollectionArtImageIds,
    hasFetched,
    fetchPromise,

    fetchCollections,
    createCollection,
    deleteCollectionById,
    patchCollection,

    addArtToCollection,
    removeArtFromCollection,
    removeArtFromCollectionServer,

    addArtImageToCollection,
    removeArtImageFromCollection,
    removeArtImageFromCollectionServer,

    updateCollectionDetails,
    updateCollectionLabel,
    updateCollectionFlags,

    getUserCollections,
    getCollectionImages,
    getCollectionImageIds,
    getCollectionArtImages,
    getUncollectedArt,
    getUncollectedArtImages,
    getOrCreateCollectionByLabel,
    getOrCreateGeneratedArtCollection,
    getOrCreateGeneratedArtImageCollection,

    setCurrentCollection,
    setCurrentCollectionRecord,
    setSelectedCollectionIds,
    toggleSelectedCollectionId,
    clearSelectedCollections,
    resetCollectionFetchState,

    findCollectionById: findCollectionByIdLocal,
    findCollectionByUserAndLabel,

    isArtInCollection,
    getCollectedArtIds,
    collectionIncludesArtId,
    collectionIncludesArtImageId,
    removeArtFromLocalCollection,
    removeArtImageFromLocalCollection,
    createEmptyCollection,
    parseStoredCollections,
    normalizeCollection,
  }
})

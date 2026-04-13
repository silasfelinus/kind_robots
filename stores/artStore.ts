// /stores/artStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs, ref, computed } from 'vue'
import type {
  Art,
  Reaction,
  ArtImage,
  Tag,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { usePromptStore } from './promptStore'
import { useUserStore } from './userStore'
import {
  type GenerateArtData,
  getArtImagesByIds,
  removeImageById,
  parseStoredArt,
  updateArtImageWithArtId,
  getCachedArtImageById,
  getOrFetchArtImageById,
  updateArtImageId,
} from '@/stores/helpers/artHelper'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from './collectionStore'
import { useCheckpointStore } from './checkpointStore'
import { artListPresets } from '@/stores/seeds/artList'
import { useRandomStore } from './randomStore'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

interface ArtStoreState {
  art: Art[]
  artImages: ArtImage[]
  tags: Tag[]
  reactions: Reaction[]
  loading: boolean
  error: string
  isInitialized: boolean
  currentArt: Art | null
  currentArtImage: ArtImage | null
  processedArtPrompt: string
  pitch: string
  currentPage: number
  totalArtCount: number
  pageSize: number
  collections: ArtCollection[]
  collectedArt: Art[]
  uncollectedArt: Art[]
  currentCollection: ArtCollection | null
  generatedArt: Art[]
  artForm: GenerateArtData
  artListSelections: Record<string, string[]>
}

const isClient = typeof window !== 'undefined'

export const useArtStore = defineStore('artStore', () => {
  const state = reactive<ArtStoreState>({
    art: [],
    artImages: [],
    tags: [],
    reactions: [],
    loading: false,
    error: '',
    isInitialized: false,
    currentArt: null,
    currentArtImage: null,
    processedArtPrompt: '',
    pitch: '',
    currentPage: 1,
    totalArtCount: 0,
    pageSize: 100,
    collections: [],
    collectedArt: [],
    uncollectedArt: [],
    currentCollection: null,
    generatedArt: [],
    artListSelections: {},
    artForm: {
      promptString: '',
      negativePrompt: '',
      pitch: '',
      userId: null,
      galleryId: null,
      checkpoint: '',
      sampler: '',
      steps: 25,
      designer: '',
      cfg: 7,
      cfgHalf: false,
      isMature: false,
      isPublic: true,
      seed: null,
      promptId: null,
      pitchId: null,
      serverId: null,
      serverName: null,
    },
  })

  const userStore = useUserStore()
  const promptStore = usePromptStore()
  const collectionStore = useCollectionStore()
  const randomStore = useRandomStore()

  const hoverArt = ref<Art | null>(null)
  const initializePromise = ref<Promise<void> | null>(null)
  const fetchAllArtPromise = ref<Promise<Art[]> | null>(null)
  const artImageRequestMap = ref<Record<number, Promise<ArtImage | undefined>>>(
    {},
  )

  function setHoverArt(art: Art | null): void {
    hoverArt.value = art
  }

  function persistArt(): void {
    if (!isClient) return
    localStorage.setItem('art', JSON.stringify(state.art))
  }

  function persistArtImages(): void {
    if (!isClient) return
    localStorage.setItem('artImages', JSON.stringify(state.artImages))
  }

  function mergeUniqueArt(existing: Art[], incoming: Art[]): Art[] {
    const map = new Map<number, Art>()

    for (const entry of existing) {
      map.set(entry.id, entry)
    }

    for (const entry of incoming) {
      map.set(entry.id, entry)
    }

    return Array.from(map.values()).sort((a, b) => b.id - a.id)
  }

  function mergeUniqueArtImages(
    existing: ArtImage[],
    incoming: ArtImage[],
  ): ArtImage[] {
    const map = new Map<number, ArtImage>()

    for (const image of existing) {
      map.set(image.id, image)
    }

    for (const image of incoming) {
      map.set(image.id, image)
    }

    return Array.from(map.values()).sort((a, b) => b.id - a.id)
  }

  function setArtList(art: Art[]): void {
    state.art = mergeUniqueArt([], art)
    persistArt()
  }

  function addOrUpdateArt(art: Art): void {
    state.art = mergeUniqueArt(state.art, [art])
    persistArt()
  }

  function addOrUpdateArtImages(images: ArtImage[]): void {
    if (!images.length) return
    state.artImages = mergeUniqueArtImages(state.artImages, images)
    persistArtImages()
  }

  const getPromptString = computed<string>(() => {
    const baseSelections = Object.entries(state.artListSelections)
      .filter(
        ([key]: [string, string[]]) =>
          !key.startsWith('__') && !randomStore.supportedKeys.includes(key),
      )
      .flatMap(([, values]: [string, string[]]) => values)

    const prettySelections = state.artListSelections.__pretty__ || []
    const randomSelections = Object.values(
      randomStore.randomSelections as Record<string, string>,
    )
    const typedPrompt = promptStore.promptField?.trim() || ''

    return [
      ...baseSelections,
      ...prettySelections,
      ...randomSelections,
      typedPrompt,
    ]
      .filter((value: string) => Boolean(value))
      .join(', ')
  })

  const getNegativePromptString = computed<string>(() => {
    return (state.artListSelections.__negative__ || []).join(', ')
  })

  function updateArtListSelection(id: string, selections: string[]): void {
    state.artListSelections[id] = selections
  }

  function getArtListAddonPrompt(): string {
    return Object.entries(state.artListSelections)
      .flatMap(([key, values]: [string, string[]]) =>
        key === '__pretty__'
          ? values
          : values.map((value: string) => value.trim()),
      )
      .filter((value: string) => Boolean(value))
      .join(', ')
  }

  async function initialize(): Promise<void> {
    if (state.isInitialized) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      state.loading = true

      try {
        if (isClient) {
          state.art = parseStoredArt(localStorage.getItem('art') || '')

          const storedImages = localStorage.getItem('artImages')
          if (storedImages) {
            try {
              state.artImages = JSON.parse(storedImages) as ArtImage[]
            } catch {
              state.artImages = []
            }
          }
        }

        await fetchAllArt()
        state.isInitialized = true
      } catch (error: unknown) {
        handleError(error, 'initializing art store')
        state.isInitialized = false
        throw error
      } finally {
        state.loading = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function loadArtImagesInChunks(
    ids: number[],
    chunkSize = 20,
  ): Promise<void> {
    const uniqueIds = [...new Set(ids)].filter(
      (id: number) =>
        !state.artImages.some((image: ArtImage) => image.id === id),
    )

    const chunks = Array.from(
      { length: Math.ceil(uniqueIds.length / chunkSize) },
      (_: unknown, index: number) =>
        uniqueIds.slice(index * chunkSize, (index + 1) * chunkSize),
    )

    for (const chunk of chunks) {
      try {
        const images = await getArtImagesByIds(chunk)
        if (images?.length) {
          addOrUpdateArtImages(images)
        }
      } catch (error: unknown) {
        handleError(error, 'loading art images in chunks')
      }
    }
  }

  async function fetchAllArt(force = false): Promise<Art[]> {
    if (!force && state.art.length) {
      return state.art
    }

    if (fetchAllArtPromise.value) {
      return fetchAllArtPromise.value
    }

    fetchAllArtPromise.value = (async () => {
      const response = await performFetch<Art[]>('/api/art')

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch art.')
      }

      setArtList(response.data)
      return state.art
    })()

    try {
      return await fetchAllArtPromise.value
    } catch (error: unknown) {
      handleError(error, 'fetching all art')
      throw error
    } finally {
      fetchAllArtPromise.value = null
    }
  }

  async function selectArt(artId: number): Promise<void> {
    const found = state.art.find((art: Art) => art.id === artId)

    if (!found) {
      handleError(new Error(`Art with ID ${artId} not found`), 'selecting art')
      return
    }

    state.currentArt = found

    if (!found.artImageId) {
      state.currentArtImage = null
      return
    }

    const image = await getArtImageById(found.artImageId)
    state.currentArtImage = image || null
  }

  async function getArtImageById(id: number): Promise<ArtImage | undefined> {
    const cached = state.artImages.find((image: ArtImage) => image.id === id)
    if (cached) return cached

    const existingRequest = artImageRequestMap.value[id]
    if (existingRequest) return existingRequest

    artImageRequestMap.value[id] = (async () => {
      try {
        const response = await performFetch<ArtImage>(`/api/art/image/${id}`)

        if (response.success && response.data) {
          addOrUpdateArtImages([response.data])
          return response.data
        }
      } catch (error: unknown) {
        handleError(error, 'fetching single art image')
      } finally {
        delete artImageRequestMap.value[id]
      }

      return undefined
    })()

    return artImageRequestMap.value[id]
  }

  async function createArt(artData: {
    promptString: string
    path: string
    seed: number | null
    steps: number | null
    galleryId: number | null
    promptId: number | null
    pitchId: number | null
    userId: number | null
    designer: string | null
    artImageId: number | null
    serverId?: number | null
    serverName?: string | null
  }): Promise<Art> {
    try {
      const response = await performFetch<Art>('/api/art/', {
        method: 'POST',
        body: JSON.stringify(artData),
      })

      if (response.success && response.data) {
        addOrUpdateArt(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to create art.')
    } catch (error: unknown) {
      handleError(error, 'creating art')
      throw error
    }
  }

  async function deleteArt(id: number): Promise<void> {
    try {
      const response = await performFetch(`/api/art/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete art.')
      }

      state.art = state.art.filter((art: Art) => art.id !== id)

      if (state.currentArt?.id === id) {
        state.currentArt = null
        state.currentArtImage = null
      }

      persistArt()
    } catch (error: unknown) {
      handleError(error, 'deleting art')
    }
  }

  async function uploadImage(
    formData: FormData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await performFetch<ArtImage>('/api/art/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.success && response.data) {
        addOrUpdateArtImages([response.data])
        return {
          success: true,
          message: 'Image uploaded successfully',
        }
      }

      return {
        success: false,
        message: response.message || 'Upload failed',
      }
    } catch (error: unknown) {
      handleError(error, 'uploading image')
      return {
        success: false,
        message: 'Upload failed',
      }
    }
  }

  function getArtImageByArtId(
    artId: number,
    images?: ArtImage[],
  ): ArtImage | undefined {
    const pool = images ?? state.artImages
    return pool.find((image: ArtImage) => image.artId === artId)
  }

  async function deleteArtImage(artImageId: number): Promise<void> {
    try {
      const response = await performFetch(`/api/art/image/${artImageId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete the art image.')
      }

      state.artImages = removeImageById(state.artImages, artImageId)

      if (state.currentArtImage?.id === artImageId) {
        state.currentArtImage = null
      }

      persistArtImages()
    } catch (error: unknown) {
      handleError(error, 'deleting art image')
      throw error
    }
  }

  async function ensureCollectionsReady(): Promise<void> {
    if (collectionStore.collections?.length) return
    await collectionStore.fetchCollections?.()
  }

  async function generateArt(
    artData?: GenerateArtData,
  ): Promise<ApiResponse<Art>> {
    state.loading = true

    const checkpointStore = useCheckpointStore()
    const userId = artData?.userId || userStore.userId || 10

    const basePrompt =
      getPromptString.value ||
      promptStore.promptField ||
      getArtListAddonPrompt()

    const promptString = promptStore
      .processPromptPlaceholders(basePrompt.trim())
      .replace(/\./g, ',')

    const data: GenerateArtData = {
      promptString,
      negativePrompt:
        artData?.negativePrompt ??
        state.artForm.negativePrompt ??
        getNegativePromptString.value,
      pitch: artData?.pitch || promptStore.extractPitch(basePrompt),
      userId,
      galleryId: artData?.galleryId ?? state.artForm.galleryId ?? null,
      checkpoint:
        artData?.checkpoint ||
        state.artForm.checkpoint ||
        checkpointStore.selectedCheckpoint?.name ||
        'stable-diffusion-v1-4',
      sampler:
        artData?.sampler ||
        state.artForm.sampler ||
        checkpointStore.selectedSampler?.name ||
        'k_lms',
      steps: artData?.steps ?? state.artForm.steps,
      designer:
        artData?.designer ||
        state.artForm.designer ||
        userStore.username ||
        'Kind Designer',
      cfg: artData?.cfg ?? state.artForm.cfg,
      cfgHalf: artData?.cfgHalf ?? state.artForm.cfgHalf,
      isMature: artData?.isMature ?? state.artForm.isMature,
      isPublic: artData?.isPublic ?? state.artForm.isPublic,
      seed: artData?.seed ?? state.artForm.seed ?? null,
      promptId: artData?.promptId ?? state.artForm.promptId ?? null,
      pitchId: artData?.pitchId ?? state.artForm.pitchId ?? null,
      serverId: artData?.serverId ?? state.artForm.serverId ?? null,
      serverName: artData?.serverName ?? state.artForm.serverName ?? null,
    }

    if (!promptStore.validatePromptString(data.promptString)) {
      state.loading = false
      return {
        success: false,
        message: 'Invalid prompt',
      }
    }

    try {
      const response = await performFetch<Art>(
        '/api/art/generate',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        3,
        120_000,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate art.')
      }

      const art = response.data

      await ensureCollectionsReady()

      const generatedCollection =
        await collectionStore.getOrCreateGeneratedArtCollection(userId)

      const activeCollection = collectionStore.currentCollection

      const alreadyInGenerated = generatedCollection.art.some(
        (existingArt: Art) => existingArt.id === art.id,
      )

      if (!alreadyInGenerated) {
        await performFetch(`/api/art/collection/${generatedCollection.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ artIds: [art.id] }),
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (activeCollection && activeCollection.id !== generatedCollection.id) {
        await performFetch(`/api/art/collection/${activeCollection.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ artIds: [art.id] }),
          headers: { 'Content-Type': 'application/json' },
        })
      }

      addOrUpdateArt(art)
      state.currentArt = art

      if (isClient) {
        localStorage.setItem(
          'collections',
          JSON.stringify(collectionStore.collections),
        )
      }

      return {
        success: true,
        data: art,
        message: 'Art created and added to collections',
      }
    } catch (error: unknown) {
      handleError(error, 'generating art')
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      state.loading = false
    }
  }

  return {
    ...toRefs(state),
    initialize,
    fetchAllArt,
    selectArt,
    generateArt,
    getArtImagesByIds,
    deleteArt,
    deleteArtImage,
    uploadImage,
    updateArtImageId,
    updateArtImageWithArtId,
    getCachedArtImageById,
    getArtImageById,
    getOrFetchArtImageById,
    createArt,
    getArtImageByArtId,
    updateArtListSelection,
    artListPresets,
    getPromptString,
    getNegativePromptString,
    loadArtImagesInChunks,
    hoverArt,
    setHoverArt,
  }
})

export type { Art, ArtImage, ArtCollection }

import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'
import { usePromptStore } from './promptStore'
import { usePitchStore } from './pitchStore'
import { useUserStore } from './userStore'
import * as artHelper from '@/stores/helpers/artHelper'
import * as collectionHelper from '@/stores/helpers/collectionHelper'
import * as promptHelper from '@/stores/helpers/promptHelper'
import * as pitchHelper from '@/stores/helpers/promptHelper'
import { useCollectionStore } from './collectionStore'
import { useCheckpointStore } from './checkpointStore'

const isClient = typeof window !== 'undefined'

export interface GenerateArtData {
  title?: string
  promptString: string
  userId?: number
  pitchId?: number
  galleryId?: number
  checkpoint?: string
  sampler?: string
  steps?: number
  designer?: string
  cfg?: number
  cfgHalf?: boolean
  isMature?: boolean
  isPublic?: boolean
  pitch?: string
  artImageId?: number
  collection?: string
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
}

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
  })

  const userStore = useUserStore()
  const pitchStore = usePitchStore()
  const promptStore = usePromptStore()
  const collectionStore = useCollectionStore()

  async function initialize() {
    if (state.isInitialized) return
    state.loading = true
    const collectionStore = useCollectionStore()

    await Promise.all([collectionStore.fetchCollections(), fetchAllArt()])

    try {
      if (isClient) {
        state.art = artHelper.parseStoredArt(localStorage.getItem('art') || '')
      }
      await Promise.all([collectionStore.fetchCollections(), fetchAllArt()])
      state.isInitialized = true
    } catch (error) {
      handleError(error, 'initializing art store')
    } finally {
      state.loading = false
    }
  }

  async function getOrCreateGeneratedArtCollection(
    userId: number,
  ): Promise<ArtCollection> {
    let collection = collectionHelper.findCollectionByUserAndLabel(
      state.collections,
      userId,
      'Generated Art',
    )
    if (!collection) {
      const response = await performFetch<ArtCollection>(
        '/api/art/collection',
        {
          method: 'POST',
          body: JSON.stringify({ label: 'Generated Art', userId }),
          headers: { 'Content-Type': 'application/json' },
        },
      )
      if (!response.success || !response.data) throw new Error(response.message)
      collection = response.data
      state.collections.push(collection)
    }
    return collection
  }

  function selectArt(artId: number): void {
    const found = state.art.find((a) => a.id === artId)
    if (!found)
      return handleError(
        new Error(`Art with ID ${artId} not found`),
        'selecting art',
      )
    state.currentArt = found
  }

  async function fetchAllArt() {
    const response = await performFetch<Art[]>('/api/art')
    if (!response.success || !response.data) throw new Error(response.message)
    state.art = response.data
    if (isClient) localStorage.setItem('art', JSON.stringify(state.art))
  }

  async function getArtImageById(id: number): Promise<ArtImage | undefined> {
    const cached = state.artImages.find((img) => img.id === id)
    if (cached) return cached

    try {
      const response = await performFetch<ArtImage>(`/api/art/image/${id}`)
      if (response.success && response.data) {
        state.artImages.push(response.data)
        return response.data
      }
    } catch (error) {
      handleError(error, 'fetching single art image')
    }
  }

  async function fetchUncollectedArt() {
    return collectionHelper.getUncollectedArt(
      userStore.userId,
      state.art,
      state.collections,
    )
  }
  function getCachedArtImageById(id: number): ArtImage | undefined {
    return state.artImages.find((image) => image.id === id)
  }

  async function updateArtImageWithArtId(
    artImageId: number,
    artId: number,
  ): Promise<void> {
    try {
      const response = await performFetch<ArtImage>(
        `/api/art/image/${artImageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artId }),
        },
      )

      if (response.success && response.data) {
        const updated = response.data
        const index = state.artImages.findIndex((img) => img.id === artImageId)
        if (index !== -1) state.artImages.splice(index, 1, updated)
        else state.artImages.push(updated)

        const art = state.art.find((a) => a.id === artId)
        if (art) art.artImageId = artImageId
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'updating artImageId')
    }
  }

  async function getArtImagesByIds(imageIds: number[]): Promise<ArtImage[]> {
    const uncached = imageIds.filter(
      (id) => !state.artImages.some((img) => img.id === id),
    )
    if (!uncached.length)
      return state.artImages.filter((img) => imageIds.includes(img.id))

    try {
      const response = await performFetch<ArtImage[]>('/api/art/image', {
        method: 'POST',
        body: JSON.stringify({ ids: uncached }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.success && response.data) {
        state.artImages.push(...response.data)
        return state.artImages.filter((img) => imageIds.includes(img.id))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'fetching art images by IDs')
      return []
    }
  }

  async function updateArtImageId(
    artId: number,
    artImageId: number,
  ): Promise<void> {
    try {
      const response = await performFetch(`/api/art/${artId}/image`, {
        method: 'PATCH',
        body: JSON.stringify({ artImageId }),
      })
      if (response.success) {
        const art = state.art.find((a) => a.id === artId)
        if (art) art.artImageId = artImageId
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'updating artImageId')
    }
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
  }): Promise<Art> {
    try {
      const response = await performFetch<Art>('/api/art/', {
        method: 'POST',
        body: JSON.stringify(artData),
      })
      if (response.success && response.data) {
        state.art.push(response.data)
        return response.data
      }
      throw new Error(response.message)
    } catch (error) {
      handleError(error, 'creating art')
      throw error
    }
  }

  async function deleteArt(id: number) {
    try {
      const response = await performFetch(`/api/art/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        state.art = state.art.filter((a) => a.id !== id)
        if (isClient) localStorage.setItem('art', JSON.stringify(state.art))
      } else throw new Error(response.message)
    } catch (error) {
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
        state.artImages.push(response.data)
        return { success: true, message: 'Image uploaded successfully' }
      } else {
        return { success: false, message: response.message || 'Upload failed' }
      }
    } catch (error) {
      handleError(error, 'uploading image')
      return { success: false, message: 'Upload failed' }
    }
  }

  async function deleteArtImage(artImageId: number): Promise<void> {
    try {
      const response = await performFetch(`/api/art/image/${artImageId}`, {
        method: 'DELETE',
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete the art image.')
      }
      state.artImages = artHelper.removeImageById(state.artImages, artImageId)
    } catch (error) {
      handleError(error, 'deleting art image')
      throw error
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
    const userId = userStore.userId
    let collection =
      collectionId != null
        ? collectionHelper.findCollectionById(state.collections, collectionId)
        : collectionHelper.findCollectionByUserAndLabel(
            state.collections,
            userId,
            label,
          )

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

    const art = state.art.find((a) => a.id === artId)
    if (art) collectionHelper.addArtToCollectionLocal(collection, art)
  }

  function getArtImageByArtId(artId: number): ArtImage | undefined {
    return state.artImages.find((image: ArtImage) => image.artId === artId)
  }

  async function generateArt(
    artData?: GenerateArtData,
  ): Promise<ApiResponse<Art>> {
    state.loading = true

    const checkpointStore = useCheckpointStore()
    const prompt = artData?.promptString || promptStore.promptField

    const data: GenerateArtData = {
      promptString: prompt,
      pitch: artData?.pitch || pitchHelper.extractPitch(prompt),
      userId: artData?.userId || userStore.userId || 10,
      galleryId: artData?.galleryId,
      checkpoint:
        artData?.checkpoint ||
        checkpointStore.selectedCheckpoint?.name ||
        'stable-diffusion-v1-4',
      sampler:
        artData?.sampler || checkpointStore.selectedSampler?.name || 'k_lms',
      steps: artData?.steps || 20,
      designer: artData?.designer || userStore.username || 'Kind Designer',
      cfg: artData?.cfg || 2,
      cfgHalf: artData?.cfgHalf || false,
      isMature: artData?.isMature || false,
      isPublic: artData?.isPublic || true,
    }

    data.promptString = promptHelper.processPromptPlaceholders(
      data.promptString,
      pitchStore,
    )
    state.processedArtPrompt = data.promptString

    if (!promptHelper.validatePromptString(data.promptString)) {
      state.loading = false
      return { success: false, message: 'Invalid prompt' }
    }

    try {
      const response = await performFetch<Art>(
        '/api/art/generate',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        3,
        90000,
      )

      if (!response.success || !response.data) throw new Error(response.message)

      const collection = await getOrCreateGeneratedArtCollection(
        data.userId || 10,
      )

      await performFetch(`/api/art/collection/${collection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ artIds: [response.data.id] }),
        headers: { 'Content-Type': 'application/json' },
      })

      collectionHelper.addArtToCollectionLocal(collection, response.data)

      state.art.push(response.data)

      if (isClient) {
        localStorage.setItem('art', JSON.stringify(state.art))
        localStorage.setItem('collections', JSON.stringify(state.collections))
      }

      return {
        success: true,
        data: response.data,
        message: 'Art generated successfully',
      }
    } catch (error) {
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
    fetchUncollectedArt,
    selectArt,
    generateArt,
    getOrCreateGeneratedArtCollection,
    getArtImagesByIds,
    deleteArt,
    deleteArtImage,
    addArtToCollection,
    uploadImage,
    updateArtImageId,
    updateArtImageWithArtId,
    getCachedArtImageById,
    getArtImageByArtId,
    createArt,
    deleteCollection,
    getArtImageById,
  }
})

export type { Art, ArtImage }

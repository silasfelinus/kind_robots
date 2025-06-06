// /stores/artStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'
import { usePromptStore } from './promptStore'
import { usePitchStore } from './pitchStore'
import { useUserStore } from './userStore'
import {
  type GenerateArtData,
  getArtImagesByIds,
  removeImageById,
  parseStoredArt,
  updateArtImageWithArtId,
  getArtImageByArtId,
  getCachedArtImageById,
  getOrFetchArtImageById,
  updateArtImageId,
} from '@/stores/helpers/artHelper'
import { useCollectionStore } from './collectionStore'
import { useCheckpointStore } from './checkpointStore'

const isClient = typeof window !== 'undefined'

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
  artForm: GenerateArtData
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
    artForm: {
      promptString: '',
      cfg: 7,
      cfgHalf: false,
      steps: 25,
      isMature: false,
      isPublic: true,
      checkpoint: '',
      sampler: '',
      designer: '',
    },
  })

  const userStore = useUserStore()
  const promptStore = usePromptStore()
  const pitchStore = usePitchStore()
  const collectionStore = useCollectionStore()

  async function initialize() {
    if (state.isInitialized) return
    state.loading = true

    try {
      if (isClient) {
        state.art = parseStoredArt(localStorage.getItem('art') || '')
      }
      await Promise.all([collectionStore.fetchCollections(), fetchAllArt()])
      state.isInitialized = true
    } catch (error) {
      handleError(error, 'initializing art store')
    } finally {
      state.loading = false
    }
  }

  async function fetchAllArt() {
    const response = await performFetch<Art[]>('/api/art')
    if (!response.success || !response.data) throw new Error(response.message)
    state.art = response.data
    if (isClient) localStorage.setItem('art', JSON.stringify(state.art))
  }

  function selectArt(artId: number): void {
    const found = state.art.find((a) => a.id === artId)
    if (!found) {
      handleError(new Error(`Art with ID ${artId} not found`), 'selecting art')
      return
    }
    state.currentArt = found
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

  async function uploadImage(formData: FormData): Promise<{ success: boolean; message: string }> {
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
      state.artImages = removeImageById(state.artImages, artImageId)
    } catch (error) {
      handleError(error, 'deleting art image')
      throw error
    }
  }

  async function generateArt(
    artData?: GenerateArtData,
  ): Promise<ApiResponse<Art>> {
    state.loading = true

    const checkpointStore = useCheckpointStore()
    const prompt = artData?.promptString || promptStore.promptField

    const data: GenerateArtData = {
      promptString: prompt,
      pitch: artData?.pitch || promptStore.extractPitch(prompt),
      userId: artData?.userId || userStore.userId || 10,
      galleryId: artData?.galleryId,
      checkpoint:
        artData?.checkpoint ||
        checkpointStore.selectedCheckpoint?.name ||
        'stable-diffusion-v1-4',
      sampler:
        artData?.sampler || checkpointStore.selectedSampler?.name || 'k_lms',
      steps: artData?.steps ?? state.artForm.steps,
      designer: artData?.designer || userStore.username || 'Kind Designer',
      cfg: artData?.cfg ?? state.artForm.cfg,
      cfgHalf: artData?.cfgHalf ?? state.artForm.cfgHalf,
      isMature: artData?.isMature ?? state.artForm.isMature,
      isPublic: artData?.isPublic ?? state.artForm.isPublic,
    }

    data.promptString = promptStore.processPromptPlaceholders(
      data.promptString,
      pitchStore,
    )

    state.processedArtPrompt = data.promptString

    if (!promptStore.validatePromptString(data.promptString)) {
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

      const collection =
        await collectionStore.getOrCreateGeneratedArtCollection(data.userId || 10)

      await performFetch(`/api/art/collection/${collection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ artIds: [response.data.id] }),
        headers: { 'Content-Type': 'application/json' },
      })

      collectionStore.addArtToCollectionLocal(collection, response.data)

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
  }
})


export type { Art, ArtImage }

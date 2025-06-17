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
import { type ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from './collectionStore'
import { useCheckpointStore } from './checkpointStore'
import { artListPresets } from '@/stores/seeds/artList'
import { useRandomStore } from './randomStore'

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
    artListSelections: {} as Record<string, string[]>,
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
  const randomStore = useRandomStore()

  const getPromptString = computed(() => {
    const baseSelections = Object.entries(state.artListSelections)
      .filter(
        ([key]) =>
          !key.startsWith('__') && !randomStore.supportedKeys.includes(key),
      )
      .flatMap(([_, vals]) => vals)

    const pretty = state.artListSelections['__pretty__'] || []
    const randoms = Object.values(randomStore.randomSelections)

    const typedPrompt = promptStore.promptField?.trim()

    return [...baseSelections, ...pretty, ...randoms, typedPrompt]
      .filter(Boolean)
      .join(', ')
  })

  const getNegativePromptString = computed(() => {
    return (state.artListSelections['__negative__'] || []).join(', ')
  })

  const artListSelections = ref<Record<string, string[]>>({})

  function updateArtListSelection(id: string, selections: string[]) {
    artListSelections.value[id] = selections
  }

  function getArtListAddonPrompt(): string {
    return Object.entries(artListSelections.value)
      .flatMap(([key, values]) =>
        key === '__pretty__' ? values : values.map((v) => v.trim()),
      )
      .filter(Boolean)
      .join(', ')
  }

  async function initialize() {
    if (state.isInitialized) return
    state.loading = true

    try {
      if (isClient) {
        state.art = parseStoredArt(localStorage.getItem('art') || '')
        const storedImages = localStorage.getItem('artImages')
        if (storedImages) {
          state.artImages = JSON.parse(storedImages)
        }
      }
      await Promise.all([collectionStore.fetchCollections(), fetchAllArt()])
      state.isInitialized = true
    } catch (error) {
      handleError(error, 'initializing art store')
    } finally {
      state.loading = false
    }
  }

  async function loadArtImagesInChunks(ids: number[], chunkSize = 20) {
    const toFetch = ids.filter(
      (id) => !state.artImages.some((img) => img.id === id),
    )

    const uniqueIds = [...new Set(toFetch)]
    const chunks = Array.from(
      { length: Math.ceil(uniqueIds.length / chunkSize) },
      (_, i) => uniqueIds.slice(i * chunkSize, (i + 1) * chunkSize),
    )

    for (const chunk of chunks) {
      try {
        const images = await getArtImagesByIds(chunk)
        if (images?.length) {
          state.artImages.push(...images)
          if (isClient) {
            const existing = JSON.parse(
              localStorage.getItem('artImages') || '[]',
            )
            const updated = [...existing, ...images]
            localStorage.setItem('artImages', JSON.stringify(updated))
          }
        }
      } catch (e) {
        handleError(e, 'loading art images in chunks')
      }
    }
  }

  async function fetchAllArt() {
    const response = await performFetch<Art[]>('/api/art')
    if (!response.success || !response.data) throw new Error(response.message)
    state.art = response.data
    if (isClient) localStorage.setItem('art', JSON.stringify(state.art))
  }

  async function selectArt(artId: number): Promise<void> {
    const found = state.art.find((a) => a.id === artId)
    if (!found) {
      handleError(new Error(`Art with ID ${artId} not found`), 'selecting art')
      return
    }
    state.currentArt = found

    if (found.artImageId) {
      const cached = state.artImages.find((img) => img.id === found.artImageId)
      if (cached) {
        state.currentArtImage = cached
      } else {
        try {
          const response = await performFetch<ArtImage>(
            `/api/art/image/${found.artImageId}`,
          )
          if (response.success && response.data) {
            state.artImages.push(response.data)
            state.currentArtImage = response.data
            if (isClient) {
              const existing = JSON.parse(
                localStorage.getItem('artImages') || '[]',
              )
              const updated = [...existing, response.data]
              localStorage.setItem('artImages', JSON.stringify(updated))
            }
          }
        } catch (err) {
          handleError(err, 'fetching art image for selected art')
        }
      }
    } else {
      state.currentArtImage = null
    }
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
    const collectionStore = useCollectionStore()
    const userId = artData?.userId || userStore.userId || 10

    const basePrompt =
      getPromptString.value ||
      promptStore.promptField ||
      getArtListAddonPrompt()

    const data: GenerateArtData = {
      promptString: promptStore
        .processPromptPlaceholders(basePrompt.trim(), pitchStore)
        .replace(/\./g, ','),
      negativePrompt: artData?.negativePrompt ?? state.artForm.negativePrompt,
      pitch: artData?.pitch || promptStore.extractPitch(basePrompt),
      userId,
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
        120_000,
      )

      if (!response.success || !response.data) throw new Error(response.message)

      const art = response.data

      const generatedCollection =
        await collectionStore.getOrCreateGeneratedArtCollection(userId)

      const activeCollection = collectionStore.currentCollection

      // Add to generated collection if not already included
      const alreadyInGenerated = generatedCollection.art.some(
        (a) => a.id === art.id,
      )
      if (!alreadyInGenerated) {
        await performFetch(`/api/art/collection/${generatedCollection.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ artIds: [art.id] }),
          headers: { 'Content-Type': 'application/json' },
        })
        collectionStore.addArtToCollectionLocal(generatedCollection, art)
      }

      // Optionally add to current collection (if different)
      if (activeCollection && activeCollection.id !== generatedCollection.id) {
        await performFetch(`/api/art/collection/${activeCollection.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ artIds: [art.id] }),
          headers: { 'Content-Type': 'application/json' },
        })
        collectionStore.addArtToCollectionLocal(activeCollection, art)
      }

      state.art.push(art)
      state.currentArt = art

      if (isClient) {
        localStorage.setItem('art', JSON.stringify(state.art))
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
    getArtImageByArtId,
    updateArtListSelection,
    artListPresets,
    getPromptString,
    loadArtImagesInChunks,
  }
})

export type { Art, ArtImage, ArtCollection }

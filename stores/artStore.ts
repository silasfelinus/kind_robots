// /stores/artStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import type {
  Art,
  ArtImage,
  Reaction,
  Server,
  Tag,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { useServerStore } from '@/stores/serverStore'
import { artListPresets } from '@/stores/seeds/artList'
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

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

type ArtInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  hydrateImages?: boolean
  initializeServerStore?: boolean
  initializeCollections?: boolean
}

type ArtGenerationMode = 'browser' | 'backend'

type CreateArtInput = {
  promptString: string
  path: string | null
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
  serverUrl?: string | null
  checkpoint?: string | null
  sampler?: string | null
  cfg?: number | null
  cfgHalf?: boolean | null
  isPublic?: boolean | null
  isMature?: boolean | null
  negativePrompt?: string | null
  imagePath?: string | null
  genres?: string | null
}

type ArtStoreState = {
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
const artStorageKey = 'art'
const artImagesStorageKey = 'artImages'
const maxStoredImages = 150
const maxStoredArt = 300

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseArtImages(raw: string | null): ArtImage[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ArtImage[]) : []
  } catch {
    return []
  }
}

function limitByNewestId<T extends { id: number }>(
  items: T[],
  limit: number,
): T[] {
  return [...items].sort((a, b) => b.id - a.id).slice(0, limit)
}

function sortNewestArt(a: Art, b: Art): number {
  return b.id - a.id
}

function sortNewestArtImages(a: ArtImage, b: ArtImage): number {
  return b.id - a.id
}

function isValidId(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
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

  const promptStore = usePromptStore()
  const userStore = useUserStore()
  const collectionStore = useCollectionStore()
  const randomStore = useRandomStore()
  const serverStore = useServerStore()

  const hoverArt = ref<Art | null>(null)
  const initializing = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const fetchAllArtPromise = ref<Promise<Art[]> | null>(null)
  const fetchArtPagePromise = ref<Record<string, Promise<Art[]>>>({})
  const artImageRequestMap = ref<Record<number, Promise<ArtImage | undefined>>>(
    {},
  )

  const hasCachedArt = computed(() => state.art.length > 0)
  const hasCachedImages = computed(() => state.artImages.length > 0)

  const currentImagePath = computed(() => {
    if (state.currentArtImage) {
      return `data:image/${state.currentArtImage.fileType};base64,${state.currentArtImage.imageData}`
    }

    return state.currentArt?.imagePath || state.currentArt?.path || ''
  })

  const generatedArtCount = computed(() => state.generatedArt.length)

  const artById = computed(() => {
    return new Map(state.art.map((art) => [art.id, art]))
  })

  const imageById = computed(() => {
    return new Map(state.artImages.map((image) => [image.id, image]))
  })

  const getPromptString = computed<string>(() => {
    const baseSelections = Object.entries(state.artListSelections)
      .filter(
        ([key]) =>
          !key.startsWith('__') && !randomStore.supportedKeys.includes(key),
      )
      .flatMap(([, values]) => values)

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
      .filter(Boolean)
      .join(', ')
  })

  const getNegativePromptString = computed<string>(() => {
    return (state.artListSelections.__negative__ || []).join(', ')
  })

  function setError(error: unknown, fallback: string): void {
    state.error = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    state.error = ''
  }

  function setHoverArt(art: Art | null): void {
    hoverArt.value = art
  }

  function persistArt(): void {
    const trimmed = limitByNewestId(state.art, maxStoredArt)
    safeSetLocalStorage(artStorageKey, JSON.stringify(trimmed))
  }

  function persistArtImages(): void {
    const trimmed = limitByNewestId(state.artImages, maxStoredImages)
    safeSetLocalStorage(artImagesStorageKey, JSON.stringify(trimmed))
  }

  function hydrateFromLocalStorage(options: { hydrateImages?: boolean } = {}) {
    state.art = parseStoredArt(safeGetLocalStorage(artStorageKey) || '').sort(
      sortNewestArt,
    )

    if (options.hydrateImages === false) return

    state.artImages = safeParseArtImages(
      safeGetLocalStorage(artImagesStorageKey),
    ).sort(sortNewestArtImages)
  }

  function mergeUniqueArt(existing: Art[], incoming: Art[]): Art[] {
    const map = new Map<number, Art>()

    for (const entry of existing) {
      map.set(entry.id, entry)
    }

    for (const entry of incoming) {
      map.set(entry.id, entry)
    }

    return Array.from(map.values()).sort(sortNewestArt)
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

    return Array.from(map.values()).sort(sortNewestArtImages)
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

  function setArtForm(updates: Partial<GenerateArtData>): void {
    state.artForm = {
      ...state.artForm,
      ...updates,
    }
  }

  function resetArtForm(overrides: Partial<GenerateArtData> = {}): void {
    state.artForm = {
      promptString: '',
      negativePrompt: '',
      pitch: '',
      userId: userStore.userId || userStore.user?.id || 10,
      galleryId: null,
      checkpoint: '',
      sampler: '',
      steps: 25,
      designer: userStore.username || userStore.user?.username || '',
      cfg: 7,
      cfgHalf: false,
      isMature: false,
      isPublic: true,
      seed: null,
      promptId: null,
      pitchId: null,
      serverId: serverStore.activeArtServer?.id ?? null,
      serverName:
        serverStore.activeArtServer?.label ||
        serverStore.activeArtServer?.title ||
        null,
      ...overrides,
    }
  }

  function updateArtListSelection(id: string, selections: string[]): void {
    state.artListSelections[id] = selections
  }

  function clearArtListSelections(): void {
    state.artListSelections = {}
  }

  function getArtListAddonPrompt(): string {
    return Object.entries(state.artListSelections)
      .flatMap(([key, values]) =>
        key === '__pretty__'
          ? values
          : values.map((value: string) => value.trim()),
      )
      .filter(Boolean)
      .join(', ')
  }

  async function selectArtRecord(
    artRecord: Art,
    artImageRecord: ArtImage | null = null,
  ): Promise<ApiResponse<Art>> {
    state.loading = true

    try {
      clearError()

      state.currentArt = artRecord
      state.currentArtImage = artImageRecord

      addOrUpdateArt(artRecord)

      if (!state.currentArtImage && artRecord.artImageId) {
        const image = await getArtImageById(artRecord.artImageId)

        if (image) {
          state.currentArtImage = image
        }
      }

      if (!state.currentArtImage && artRecord.id) {
        const image = getArtImageByArtId(artRecord.id)

        if (image) {
          state.currentArtImage = image
        }
      }

      return {
        success: true,
        message: `Selected Art #${artRecord.id}.`,
        data: artRecord,
      }
    } catch (error) {
      handleError(error, 'selecting art record')
      setError(error, 'Failed to select art.')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to select art.',
      }
    } finally {
      state.loading = false
    }
  }

  async function initialize(options: ArtInitializeOptions = {}): Promise<void> {
    const shouldFetchRemote = Boolean(options.fetchRemote)
    const shouldInitializeServers = options.initializeServerStore !== false
    const shouldInitializeCollections = Boolean(options.initializeCollections)

    if (state.isInitialized && !options.force && !shouldFetchRemote) return

    if (initializePromise.value && !options.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      state.loading = true
      initializing.value = true

      try {
        clearError()
        hydrateFromLocalStorage({ hydrateImages: options.hydrateImages })

        if (shouldInitializeServers) {
          await serverStore.initialize({
            fetchRemote: shouldFetchRemote,
            force: Boolean(options.force),
          })
        }

        if (shouldInitializeCollections) {
          await ensureCollectionsReady()
        }

        if (shouldFetchRemote) {
          await fetchArtPage(
            state.currentPage,
            state.pageSize,
            Boolean(options.force),
          )
        }

        if (!state.artForm.userId) {
          resetArtForm(state.artForm)
        }

        state.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing art store')
        setError(error, 'Failed to initialize art store')
        state.isInitialized = false
      } finally {
        state.loading = false
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchAllArt(force = false): Promise<Art[]> {
    if (!force && state.art.length) return state.art

    if (fetchAllArtPromise.value && !force) {
      return fetchAllArtPromise.value
    }

    fetchAllArtPromise.value = (async () => {
      state.loading = true

      try {
        clearError()

        const response = await performFetch<Art[]>('/api/art')

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch art.')
        }

        setArtList(response.data)
        return state.art
      } catch (error) {
        handleError(error, 'fetching all art')
        setError(error, 'Failed to fetch art.')
        return state.art
      } finally {
        state.loading = false
        fetchAllArtPromise.value = null
      }
    })()

    return fetchAllArtPromise.value
  }

  function normalizeFetchedArtPage(response: ApiResponse<unknown>): {
    art: Art[]
    total?: number
  } {
    const payload = response.data

    if (Array.isArray(payload)) {
      return {
        art: payload as Art[],
        total: payload.length,
      }
    }

    if (!payload || typeof payload !== 'object') {
      return {
        art: [],
      }
    }

    const data = payload as Record<string, unknown>

    const candidates = [
      data.art,
      data.arts,
      data.items,
      data.results,
      data.records,
      data.images,
    ]

    const art = candidates.find((candidate) => Array.isArray(candidate))

    return {
      art: Array.isArray(art) ? (art as Art[]) : [],
      total: typeof data.total === 'number' ? data.total : undefined,
    }
  }

  async function fetchArtPage(
    page = state.currentPage,
    pageSize = state.pageSize,
    force = false,
  ): Promise<Art[]> {
    const key = `${page}:${pageSize}`

    if (fetchArtPagePromise.value[key] && !force) {
      return fetchArtPagePromise.value[key]
    }

    fetchArtPagePromise.value[key] = (async () => {
      state.loading = true

      try {
        clearError()

        const response = await performFetch<unknown>(
          `/api/art?page=${page}&pageSize=${pageSize}`,
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch art page.')
        }

        const normalized = normalizeFetchedArtPage(response)

        if (!normalized.art.length) {
          const message =
            response.message &&
            response.message !== 'Request completed successfully'
              ? response.message
              : 'Failed to fetch art page. The API response did not include art data.'

          throw new Error(message)
        }

        state.currentPage = page
        state.pageSize = pageSize
        state.totalArtCount = normalized.total ?? state.totalArtCount
        state.art = mergeUniqueArt(state.art, normalized.art)
        persistArt()

        return normalized.art
      } catch (error) {
        handleError(error, 'fetching art page')

        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to fetch art page.'

        setError(message, 'Failed to fetch art page.')
        return []
      } finally {
        state.loading = false
        delete fetchArtPagePromise.value[key]
      }
    })()

    return fetchArtPagePromise.value[key]
  }

  async function loadArtImagesInChunks(
    ids: number[],
    chunkSize = 20,
  ): Promise<void> {
    const uniqueIds = [...new Set(ids)].filter((id) => {
      return isValidId(id) && !state.artImages.some((image) => image.id === id)
    })

    if (!uniqueIds.length) return

    const chunks = Array.from(
      { length: Math.ceil(uniqueIds.length / chunkSize) },
      (_, index) => uniqueIds.slice(index * chunkSize, (index + 1) * chunkSize),
    )

    for (const chunk of chunks) {
      try {
        const images = await getArtImagesByIds(chunk)

        if (images?.length) {
          addOrUpdateArtImages(images)
        }
      } catch (error) {
        handleError(error, 'loading art images in chunks')
      }
    }
  }

  async function selectArt(id: number): Promise<ApiResponse<Art>> {
    state.loading = true

    try {
      clearError()

      const artId = Number(id)

      if (!Number.isInteger(artId) || artId <= 0) {
        throw new Error('Invalid Art ID.')
      }

      const localArt = state.art.find((entry: Art) => entry.id === artId)

      if (localArt) {
        return await selectArtRecord(localArt)
      }

      const result = await performFetch<Art>(`/api/art/${artId}`, {
        method: 'GET',
      })

      if (!result.success || !result.data) {
        throw new Error(result.message || `Art #${artId} was not found.`)
      }

      return await selectArtRecord(result.data)
    } catch (error) {
      handleError(error, 'selecting art')
      setError(error, 'There was trouble finding art with that ID.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'There was trouble finding art with that ID.',
      }
    } finally {
      state.loading = false
    }
  }

  function deselectArt(): void {
    state.currentArt = null
    state.currentArtImage = null
    setHoverArt(null)
  }

  async function getArtImageById(id: number): Promise<ArtImage | undefined> {
    const cached = imageById.value.get(id)
    if (cached) return cached

    const existingRequest = artImageRequestMap.value[id]
    if (existingRequest) return existingRequest

    artImageRequestMap.value[id] = (async () => {
      try {
        clearError()

        const response = await performFetch<ArtImage>(`/api/art/image/${id}`)

        if (response.success && response.data) {
          addOrUpdateArtImages([response.data])
          return response.data
        }

        throw new Error(response.message || `Failed to fetch art image ${id}.`)
      } catch (error) {
        handleError(error, 'fetching single art image')
        setError(error, `Failed to fetch art image ${id}.`)
        return undefined
      } finally {
        delete artImageRequestMap.value[id]
      }
    })()

    return artImageRequestMap.value[id]
  }

  function getArtImageByArtId(
    artId: number,
    images: ArtImage[] = state.artImages,
  ): ArtImage | undefined {
    return images.find((image) => image.artId === artId)
  }

  function calculateCfg(cfg: number, cfgHalf: boolean): number {
    return cfgHalf ? cfg + 0.5 : cfg
  }

  function getArtGenerationEndpointPath(server: Server): string {
    const endpointPath = server.endpointPath || '/sdapi/v1/txt2img'

    if (server.serverType !== 'A1111') return endpointPath

    if (endpointPath.endsWith('/sdapi/v1/txt2img')) {
      return endpointPath
    }

    if (endpointPath.endsWith('/sdapi/v1')) {
      return `${endpointPath}/txt2img`
    }

    if (endpointPath.endsWith('/sdapi')) {
      return `${endpointPath}/v1/txt2img`
    }

    return '/sdapi/v1/txt2img'
  }

  function getClientServerHeaders(server: Server): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }

    if (server.requiresApiKey && server.apiKey && server.apiKeyName) {
      const apiKeyName = server.apiKeyName.trim()

      if (apiKeyName.toLowerCase() === 'authorization') {
        headers.Authorization = server.apiKey.startsWith('Bearer ')
          ? server.apiKey
          : `Bearer ${server.apiKey}`
      } else {
        headers[apiKeyName] = server.apiKey
      }
    }

    return headers
  }

  function getSelectedArtServer(data: GenerateArtData): Server {
    const selectedServer =
      typeof data.serverId === 'number'
        ? serverStore.getServerById(data.serverId)
        : serverStore.activeArtServer

    if (!selectedServer) {
      throw new Error('No active art server selected.')
    }

    return selectedServer
  }

  function getArtGenerationMode(server: Server): ArtGenerationMode {
    if (!server.isActive) {
      throw new Error(`Server "${server.title}" is not active.`)
    }

    if (server.serverType !== 'A1111') {
      throw new Error(
        `Server "${server.title}" is ${server.serverType}. This generator currently supports A1111 only.`,
      )
    }

    if (!server.supportsTxt2Img) {
      throw new Error(`Server "${server.title}" does not support txt2img.`)
    }

    const shouldUseBrowser =
      server.allowBrowserRequests &&
      (server.requiresClientSideCheck ||
        server.isPrivateNetwork ||
        server.accessMode === 'LOCAL')

    return shouldUseBrowser ? 'browser' : 'backend'
  }

  async function generateImageFromBrowserServer(
    server: Server,
    form: GenerateArtData,
  ): Promise<string> {
    if (server.serverType !== 'A1111') {
      throw new Error(
        `Server "${server.title}" is ${server.serverType}. Browser art generation currently supports A1111 servers only.`,
      )
    }

    if (!server.allowBrowserRequests) {
      throw new Error(
        `Server "${server.title}" does not allow browser requests.`,
      )
    }

    const response = await serverStore.requestServer(
      server,
      getArtGenerationEndpointPath(server),
      {
        method: 'POST',
        headers: getClientServerHeaders(server),
        body: JSON.stringify({
          prompt: form.promptString,
          negative_prompt: form.negativePrompt || ' ',
          steps: form.steps ?? 20,
          cfg_scale: calculateCfg(form.cfg ?? 3, form.cfgHalf ?? false),
          seed: form.seed ?? -1,
          width: 512,
          height: 512,
          sampler_index: form.sampler || 'Euler a',
          override_settings: {
            sd_model_checkpoint:
              form.checkpoint || 'Flux/flux1-dev-fp8.safetensors',
          },
          user: form.designer || 'kindguest',
        }),
      },
    )

    if (!response.ok) {
      const message = await response.text()

      throw new Error(
        `Browser image generation failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ''}`,
      )
    }

    const data = await response.json()

    if (!Array.isArray(data.images) || !data.images[0]) {
      throw new Error('Browser image generation returned no image.')
    }

    return data.images[0]
  }

  async function saveBrowserGeneratedArt(
    data: GenerateArtData & { imageBase64: string },
  ): Promise<Art> {
    const response = await performFetch<Art>(
      '/api/art/save-generated',
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      3,
      120_000,
    )

    if (!response.success || !response.data) {
      throw new Error(
        response.message || 'Failed to save browser-generated art.',
      )
    }

    return response.data
  }

  async function generateBackendArt(data: GenerateArtData): Promise<Art> {
    const response = await performFetch<Art>(
      '/api/art/generate',
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      3,
      120_000,
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to generate art.')
    }

    return response.data
  }

  async function ensureCollectionsReady(): Promise<void> {
    if (collectionStore.collections?.length) return
    await collectionStore.fetchCollections?.()
  }

  async function addArtToCollection(collectionId: number, artId: number) {
    return await performFetch(`/api/art/collection/${collectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ artIds: [artId] }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async function addGeneratedArtToCollections(
    art: Art,
    userId: number,
  ): Promise<void> {
    await ensureCollectionsReady()

    const generatedCollection =
      await collectionStore.getOrCreateGeneratedArtCollection(userId)

    const activeCollection = collectionStore.currentCollection

    const alreadyInGenerated = generatedCollection.art.some(
      (existingArt: Art) => existingArt.id === art.id,
    )

    if (!alreadyInGenerated) {
      await addArtToCollection(generatedCollection.id, art.id)
    }

    if (activeCollection && activeCollection.id !== generatedCollection.id) {
      await addArtToCollection(activeCollection.id, art.id)
    }

    if (isClient) {
      safeSetLocalStorage(
        'collections',
        JSON.stringify(collectionStore.collections),
      )
    }
  }

  function buildGenerateArtData(artData?: GenerateArtData): GenerateArtData {
    const checkpointStore = useCheckpointStore()
    const userId = artData?.userId || userStore.userId || 10

    const basePrompt =
      artData?.promptString ||
      getPromptString.value ||
      promptStore.promptField ||
      getArtListAddonPrompt()

    const promptString = promptStore
      .processPromptPlaceholders(basePrompt.trim())
      .replace(/\./g, ',')

    return {
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
  }

  async function generateArt(
    artData?: GenerateArtData,
  ): Promise<ApiResponse<Art>> {
    state.loading = true

    try {
      clearError()

      const data = buildGenerateArtData(artData)

      if (!promptStore.validatePromptString(data.promptString)) {
        return {
          success: false,
          message: 'Invalid prompt',
        }
      }

      await serverStore.initialize({
        fetchRemote: true,
      })

      const server = getSelectedArtServer(data)
      const generationMode = getArtGenerationMode(server)

      const dataWithServer: GenerateArtData = {
        ...data,
        serverId: server.id,
        serverName: server.label || server.title,
      }

      let art: Art

      if (generationMode === 'browser') {
        const imageBase64 = await generateImageFromBrowserServer(
          server,
          dataWithServer,
        )

        art = await saveBrowserGeneratedArt({
          ...dataWithServer,
          imageBase64,
        })
      } else {
        art = await generateBackendArt(dataWithServer)
      }

      await addGeneratedArtToCollections(art, dataWithServer.userId || 10)

      addOrUpdateArt(art)
      state.generatedArt = mergeUniqueArt(state.generatedArt, [art])
      state.currentArt = art

      if (art.artImageId) {
        const image = await getArtImageById(art.artImageId)
        state.currentArtImage = image || null
      }

      return {
        success: true,
        data: art,
        message: 'Art created and added to collections',
      }
    } catch (error) {
      handleError(error, 'generating art')
      setError(error, 'Failed to generate art.')

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      state.loading = false
    }
  }

  async function createArt(artData: CreateArtInput): Promise<Art> {
    try {
      clearError()

      const response = await performFetch<Art>('/api/art/', {
        method: 'POST',
        body: JSON.stringify(artData),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        addOrUpdateArt(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to create art.')
    } catch (error) {
      handleError(error, 'creating art')
      setError(error, 'Failed to create art.')
      throw error
    }
  }

  async function deleteArt(id: number): Promise<boolean> {
    try {
      clearError()

      const response = await performFetch(`/api/art/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete art.')
      }

      state.art = state.art.filter((art) => art.id !== id)
      state.generatedArt = state.generatedArt.filter((art) => art.id !== id)

      if (state.currentArt?.id === id) {
        deselectArt()
      }

      persistArt()
      return true
    } catch (error) {
      handleError(error, 'deleting art')
      setError(error, 'Failed to delete art.')
      return false
    }
  }

  async function uploadImage(
    formData: FormData,
  ): Promise<{ success: boolean; message: string; data?: ArtImage }> {
    try {
      clearError()

      const response = await performFetch<ArtImage>('/api/art/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.success && response.data) {
        addOrUpdateArtImages([response.data])

        return {
          success: true,
          message: 'Image uploaded successfully',
          data: response.data,
        }
      }

      return {
        success: false,
        message: response.message || 'Upload failed',
      }
    } catch (error) {
      handleError(error, 'uploading image')
      setError(error, 'Upload failed.')

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async function deleteArtImage(artImageId: number): Promise<boolean> {
    try {
      clearError()

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
      return true
    } catch (error) {
      handleError(error, 'deleting art image')
      setError(error, 'Failed to delete art image.')
      return false
    }
  }

  function resetInitialization(): void {
    state.isInitialized = false
    initializing.value = false
    initializePromise.value = null
    fetchAllArtPromise.value = null
    fetchArtPagePromise.value = {}
    artImageRequestMap.value = {}
    state.error = ''
  }

  return {
    ...toRefs(state),

    hoverArt,
    initializing,
    initializePromise,
    fetchAllArtPromise,
    fetchArtPagePromise,
    artImageRequestMap,

    hasCachedArt,
    hasCachedImages,
    currentImagePath,
    generatedArtCount,
    artById,
    imageById,
    getPromptString,
    getNegativePromptString,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,

    fetchAllArt,
    fetchArtPage,
    loadArtImagesInChunks,

    selectArt,
    deselectArt,
    setHoverArt,

    setArtForm,
    resetArtForm,
    updateArtListSelection,
    clearArtListSelections,
    getArtListAddonPrompt,

    generateArt,
    generateImageFromBrowserServer,
    createArt,
    deleteArt,

    uploadImage,
    deleteArtImage,
    addOrUpdateArt,
    addOrUpdateArtImages,
    setArtList,

    getArtImagesByIds,
    getArtImageById,
    getArtImageByArtId,
    getCachedArtImageById,
    getOrFetchArtImageById,
    updateArtImageId,
    updateArtImageWithArtId,

    artListPresets,
    selectArtRecord,
  }
})

export type { Art, ArtImage, ArtCollection }

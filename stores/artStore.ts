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
import { useAnimationStore } from '@/stores/animationStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { useServerStore } from '@/stores/serverStore'
import { artListPresets } from '@/stores/seeds/artList'
import { useNavStore } from '@/stores/navStore'
import {
  getArtImagesByIds,
  removeImageById,
  parseStoredArt,
  updateArtImageWithArtId,
  getCachedArtImageById,
  getOrFetchArtImageById,
  updateArtImageId,
} from '@/stores/helpers/artHelper'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import {
  modelNamesMatch,
  parseA1111GenerationInfo,
} from '~/stores/helpers/serverHelper'

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

interface ArtGenerationRoute {
  transport: ArtGenerationTransport
  engine: ArtGenerationEngine
}
export type ArtGenerationEngine = 'a1111' | 'comfy' | 'flux' | 'kontext'
export type ArtGenerationTransport = 'browser' | 'backend'

export interface GenerateArtData {
  promptString: string
  negativePrompt?: string
  pitch?: string
  title?: string
  collection?: string

  userId?: number | null
  galleryId?: number | null
  promptId?: number | null
  pitchId?: number | null

  checkpoint?: string
  sampler?: string
  steps?: number
  cfg?: number
  cfgHalf?: boolean

  designer?: string
  seed?: number | null

  isMature?: boolean
  isPublic?: boolean

  serverId?: number | null
  serverName?: string | null

  engine?: ArtGenerationEngine
  transport?: ArtGenerationTransport
  workflow?: Record<string, unknown> | null

  width?: number | null
  height?: number | null
  guidance?: number | null
  denoise?: number | null
  strength?: number | null

  sourceImageId?: number | null
  sourceImageBase64?: string | null
  maskImageBase64?: string | null
}
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

export type ArtImageConnectionInput = {
  artId?: number | null
  botId?: number | null
  componentId?: number | null
  milestoneId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  chatId?: number | null
  characterId?: number | null
  galleryId?: number | null
  userId?: number | null
  serverId?: number | null
  checkpointResourceId?: number | null

  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  tagIds?: number[]
  butterflyIds?: number[]
  artCollectionIds?: number[]

  disconnectDreamIds?: number[]
  disconnectScenarioIds?: number[]
  disconnectReactionIds?: number[]
  disconnectTagIds?: number[]
  disconnectButterflyIds?: number[]
  disconnectArtCollectionIds?: number[]

  tagOwnerId?: number | null

  clearDirectLinks?: boolean
  clearDreams?: boolean
  clearScenarios?: boolean
  clearReactions?: boolean
  clearTags?: boolean
  clearButterflies?: boolean
  clearArtCollections?: boolean
  clearTagOwner?: boolean
}

type ArtImageFetchOptions = {
  force?: boolean
  includeImageData?: boolean
  includeThumbnailData?: boolean
  includeTags?: boolean
}

type ArtImagePatchInput = Partial<
  Pick<
    ArtImage,
    | 'galleryId'
    | 'userId'
    | 'imageData'
    | 'thumbnailData'
    | 'fileName'
    | 'fileType'
    | 'imagePath'
    | 'rarity'
    | 'path'
    | 'promptString'
    | 'negativePrompt'
    | 'checkpoint'
    | 'checkpointResourceId'
    | 'sampler'
    | 'seed'
    | 'steps'
    | 'cfg'
    | 'cfgHalf'
    | 'designer'
    | 'genres'
    | 'isPublic'
    | 'isMature'
    | 'serverId'
    | 'serverName'
    | 'serverUrl'
    | 'artId'
    | 'botId'
    | 'componentId'
    | 'milestoneId'
    | 'pitchId'
    | 'promptId'
    | 'resourceId'
    | 'rewardId'
    | 'chatId'
    | 'characterId'
    | 'butterflyId'
  >
>

type ArtPatchInput = Partial<
  Pick<
    Art,
    | 'path'
    | 'checkpoint'
    | 'checkpointResourceId'
    | 'sampler'
    | 'seed'
    | 'steps'
    | 'designer'
    | 'isPublic'
    | 'isMature'
    | 'promptId'
    | 'userId'
    | 'pitchId'
    | 'galleryId'
    | 'promptString'
    | 'cfg'
    | 'cfgHalf'
    | 'serverId'
    | 'serverName'
    | 'serverUrl'
    | 'artImageId'
    | 'imagePath'
    | 'genres'
    | 'negativePrompt'
  >
>

type ArtImageSyncFields = Partial<
  Pick<
    ArtImage,
    | 'galleryId'
    | 'userId'
    | 'path'
    | 'promptString'
    | 'negativePrompt'
    | 'checkpoint'
    | 'checkpointResourceId'
    | 'sampler'
    | 'seed'
    | 'steps'
    | 'cfg'
    | 'cfgHalf'
    | 'designer'
    | 'genres'
    | 'isPublic'
    | 'isMature'
    | 'serverId'
    | 'serverName'
    | 'serverUrl'
    | 'artId'
  >
>

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
  previousArtTab: string | null
}

const isClient = typeof window !== 'undefined'
const artStorageKey = 'art'
const artImagesStorageKey = 'artImages'
const maxStoredImages = 150
const maxStoredArt = 300
const fetchAllArtImagesPromise = ref<Promise<ArtImage[]> | null>(null)

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
    previousArtTab: null,
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
      engine: undefined,
    },
  })

  const promptStore = usePromptStore()
  const userStore = useUserStore()
  const collectionStore = useCollectionStore()
  const randomStore = useRandomStore()
  const serverStore = useServerStore()
  const animationStore = useAnimationStore()
  const navStore = useNavStore()

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
    const image = state.currentArtImage as
      | (ArtImage & { imageData?: string | null })
      | null

    if (image?.imageData) {
      return `data:image/${image.fileType || 'png'};base64,${image.imageData}`
    }

    return (
      image?.imagePath ||
      state.currentArt?.imagePath ||
      state.currentArt?.path ||
      ''
    )
  })

  const generatedArtCount = computed(() => state.generatedArt.length)

  const artById = computed(() => {
    return new Map(state.art.map((art) => [art.id, art]))
  })

  const imageById = computed(() => {
    return new Map(state.artImages.map((image) => [image.id, image]))
  })

  async function updateArtImageConnections(
    id: number,
    connections: ArtImageConnectionInput,
  ): Promise<ApiResponse<ArtImage>> {
    try {
      clearError()

      const response = await performFetch<ArtImage>(
        `/api/art/image/connections/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(connections),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update art image links.')
      }

      addOrUpdateArtImages([response.data])

      if (state.currentArtImage?.id === id) {
        state.currentArtImage = response.data
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art image links updated.',
      }
    } catch (error) {
      handleError(error, 'updating art image links')
      setError(error, 'Failed to update art image links.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update art image links.',
      }
    }
  }

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

  const artImageByArtId = computed(() => {
    const map = new Map<number, ArtImage>()

    for (const image of state.artImages) {
      if (image.artId) {
        map.set(image.artId, image)
      }
    }

    return map
  })

  const artByImageId = computed(() => {
    const map = new Map<number, Art>()

    for (const art of state.art) {
      if (art.artImageId) {
        map.set(art.artImageId, art)
      }
    }

    return map
  })

  const publicArt = computed(() => {
    return state.art.filter((art) => art.isPublic)
  })

  const matureArt = computed(() => {
    return state.art.filter((art) => art.isMature)
  })

  const safeArt = computed(() => {
    return state.art.filter((art) => !art.isMature)
  })

  const artWithImages = computed(() => {
    return state.art.filter((art) => {
      if (art.artImageId) return true
      return artImageByArtId.value.has(art.id)
    })
  })

  const artWithoutImages = computed(() => {
    return state.art.filter((art) => {
      if (art.artImageId) return false
      return !artImageByArtId.value.has(art.id)
    })
  })

  const publicArtImages = computed(() => {
    return state.artImages.filter((image) => image.isPublic)
  })

  const matureArtImages = computed(() => {
    return state.artImages.filter((image) => image.isMature)
  })

  const safeArtImages = computed(() => {
    return state.artImages.filter((image) => !image.isMature)
  })

  const linkedArtImages = computed(() => {
    return state.artImages.filter((image) => image.artId)
  })

  const unlinkedArtImages = computed(() => {
    return state.artImages.filter((image) => {
      return (
        !image.artId &&
        !image.botId &&
        !image.componentId &&
        !image.milestoneId &&
        !image.pitchId &&
        !image.promptId &&
        !image.resourceId &&
        !image.rewardId &&
        !image.chatId &&
        !image.characterId &&
        !image.butterflyId
      )
    })
  })

  const artImagePairs = computed(() => {
    return state.art
      .map((art) => {
        const viaForward = art.artImageId
          ? imageById.value.get(art.artImageId)
          : undefined
        const viaBack = artImageByArtId.value.get(art.id)
        const artImage = viaForward || viaBack || null

        return {
          art,
          artImage,
          hasForwardLink: Boolean(viaForward),
          hasBackLink: Boolean(viaBack),
          isBidirectional: Boolean(viaForward && viaBack),
        }
      })
      .filter((pair) => pair.artImage)
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

  type ArtImageCreateInput = Partial<ArtImage> & Record<string, unknown>

  async function createArtImage(
    input: ArtImageCreateInput,
  ): Promise<ApiResponse<ArtImage>> {
    try {
      clearError()

      const response = await performFetch<ArtImage>('/api/art/image', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create art image.')
      }

      addOrUpdateArtImages([stripHeavyImageFields(response.data)])

      if (state.currentArtImage?.id === response.data.id) {
        state.currentArtImage = stripHeavyImageFields(response.data)
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art image created.',
      }
    } catch (error) {
      handleError(error, 'creating art image')
      setError(error, 'Failed to create art image.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create art image.',
      }
    }
  }

  function persistArtImages(): void {
    const trimmed = limitByNewestId(state.artImages, maxStoredImages).map(
      stripHeavyImageFields,
    )

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
      engine: undefined,
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

      const currentTab = navStore.getDashboardTab('art')
      if (currentTab !== 'selected') {
        state.previousArtTab = currentTab
      }
      navStore.setDashboardTab('art', 'selected')

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
    const shouldInitializeServers = options.initializeServerStore === true
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
          await Promise.all([
            fetchAllArt(Boolean(options.force)),
            fetchAllArtImages({
              force: Boolean(options.force),
              includeImageData: false,
              includeThumbnailData: false,
              includeTags: false,
            }),
          ])
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
    state.currentPage = page
    state.pageSize = pageSize

    const art = await fetchAllArt(force)
    state.totalArtCount = art.length

    return art
  }

  function buildArtImageQuery(options: ArtImageFetchOptions = {}): string {
    const params = new URLSearchParams()

    if (options.includeImageData) {
      params.set('includeImageData', 'true')
    }

    if (options.includeThumbnailData) {
      params.set('includeThumbnailData', 'true')
    }

    if (options.includeTags) {
      params.set('includeTags', 'true')
    }

    const query = params.toString()

    return query ? `?${query}` : ''
  }

  function cachedImageSatisfiesOptions(
    image: ArtImage | undefined,
    options: ArtImageFetchOptions = {},
  ): image is ArtImage {
    if (!image) return false

    const withOptionalData = image as ArtImage & {
      imageData?: string | null
      thumbnailData?: string | null
      Tags?: unknown[]
      TagOwner?: unknown
    }

    if (options.includeImageData && !withOptionalData.imageData) return false

    if (
      options.includeThumbnailData &&
      typeof withOptionalData.thumbnailData === 'undefined'
    ) {
      return false
    }

    if (options.includeTags && typeof withOptionalData.Tags === 'undefined') {
      return false
    }

    return true
  }

  async function fetchAllArtImages(
    options: ArtImageFetchOptions = {},
  ): Promise<ArtImage[]> {
    const listOptions: ArtImageFetchOptions = {
      force: options.force,
      includeImageData: false,
      includeThumbnailData: false,
      includeTags: false,
    }

    if (!listOptions.force && state.artImages.length) {
      return state.artImages
    }

    if (fetchAllArtImagesPromise.value && !listOptions.force) {
      return fetchAllArtImagesPromise.value
    }

    fetchAllArtImagesPromise.value = (async () => {
      state.loading = true

      try {
        clearError()

        const query = buildArtImageQuery(listOptions)
        const response = await performFetch<ArtImage[]>(
          `/api/art/image${query}`,
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch art images.')
        }

        addOrUpdateArtImages(response.data.map(stripHeavyImageFields))

        return state.artImages
      } catch (error) {
        handleError(error, 'fetching all art images')
        setError(error, 'Failed to fetch art images.')
        return state.artImages
      } finally {
        state.loading = false
        fetchAllArtImagesPromise.value = null
      }
    })()

    return fetchAllArtImagesPromise.value
  }

  function stripHeavyImageFields(image: ArtImage): ArtImage {
    return {
      ...image,
      imageData: null,
      thumbnailData: null,
    }
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
    if (state.previousArtTab) {
      navStore.setDashboardTab('art', state.previousArtTab)
      state.previousArtTab = null
    }
  }

  async function getArtImageById(
    id: number,
    options: ArtImageFetchOptions = {},
  ): Promise<ArtImage | undefined> {
    const imageId = Number(id)

    if (!isValidId(imageId)) {
      setError('Invalid ArtImage ID.', 'Invalid ArtImage ID.')
      return undefined
    }

    const cached = imageById.value.get(imageId)

    if (!options.force && cachedImageSatisfiesOptions(cached, options)) {
      return cached
    }

    const existingRequest = artImageRequestMap.value[imageId]

    if (existingRequest && !options.force) {
      return existingRequest
    }

    artImageRequestMap.value[imageId] = (async () => {
      try {
        clearError()

        const query = buildArtImageQuery(options)
        const response = await performFetch<ArtImage>(
          `/api/art/image/${imageId}${query}`,
        )

        if (response.success && response.data) {
          addOrUpdateArtImages([response.data])
          return response.data
        }

        throw new Error(
          response.message || `Failed to fetch art image ${imageId}.`,
        )
      } catch (error) {
        handleError(error, 'fetching single art image')
        setError(error, `Failed to fetch art image ${imageId}.`)
        return undefined
      } finally {
        delete artImageRequestMap.value[imageId]
      }
    })()

    return artImageRequestMap.value[imageId]
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

  function getArtGenerationEngine(
    server: Server,
    data?: GenerateArtData,
  ): ArtGenerationEngine {
    if (data?.engine) {
      return data.engine
    }

    if (server.generationEngine === 'FLUX') return 'flux'
    if (server.generationEngine === 'KONTEXT') return 'kontext'
    if (server.generationEngine === 'COMFY') return 'comfy'
    if (server.generationEngine === 'A1111') return 'a1111'

    if (server.serverType === 'COMFY' || server.supportsComfyWorkflow) {
      return 'comfy'
    }

    if (server.serverType === 'A1111') {
      return 'a1111'
    }

    throw new Error(
      `Server "${server.title}" is ${server.serverType}. This generator supports A1111, Comfy, Flux, and Kontext only.`,
    )
  }

  function getArtGenerationTransport(
    server: Server,
    data?: GenerateArtData,
  ): ArtGenerationTransport {
    if (data?.transport) {
      return data.transport
    }

    const defaultTransport = String(
      (server as Server & { defaultTransport?: string | null })
        .defaultTransport || '',
    ).toLowerCase()

    if (defaultTransport === 'backend') {
      return 'backend'
    }

    if (defaultTransport === 'browser') {
      return 'browser'
    }

    if (server.accessMode === 'LOCAL') {
      return 'browser'
    }

    if (server.requiresClientSideCheck || server.isPrivateNetwork) {
      return server.allowBrowserRequests ? 'browser' : 'backend'
    }

    return 'backend'
  }

  function getArtGenerationRoute(
    server: Server,
    data?: GenerateArtData,
  ): ArtGenerationRoute {
    if (!server.isActive) {
      throw new Error(`Server "${server.title}" is not active.`)
    }

    const engine = getArtGenerationEngine(server, data)
    const transport = getArtGenerationTransport(server, data)

    if (engine === 'a1111' && !server.supportsTxt2Img) {
      throw new Error(`Server "${server.title}" does not support txt2img.`)
    }

    if (transport === 'browser' && !server.allowBrowserRequests) {
      throw new Error(
        `Server "${server.title}" does not allow browser requests. Switch this server to backend/proxy transport.`,
      )
    }

    return {
      engine,
      transport,
    }
  }

  async function updateArt(
    id: number,
    updates: ArtPatchInput,
  ): Promise<ApiResponse<Art>> {
    try {
      clearError()

      const response = await performFetch<Art>(`/api/art/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update art.')
      }

      addOrUpdateArt(response.data)

      if (state.currentArt?.id === id) {
        state.currentArt = response.data
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art updated.',
      }
    } catch (error) {
      handleError(error, 'updating art')
      setError(error, 'Failed to update art.')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update art.',
      }
    }
  }

  async function updateArtImage(
    id: number,
    updates: ArtImagePatchInput,
  ): Promise<ApiResponse<ArtImage>> {
    try {
      clearError()

      const response = await performFetch<ArtImage>(`/api/art/image/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update art image.')
      }

      addOrUpdateArtImages([response.data])

      if (state.currentArtImage?.id === id) {
        state.currentArtImage = response.data
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art image updated.',
      }
    } catch (error) {
      handleError(error, 'updating art image')
      setError(error, 'Failed to update art image.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update art image.',
      }
    }
  }

  function buildArtImageSyncFields(art: Art): ArtImageSyncFields {
    return {
      galleryId: art.galleryId ?? null,
      userId: art.userId ?? null,
      path: art.path ?? null,
      promptString: art.promptString ?? null,
      negativePrompt: art.negativePrompt ?? null,
      checkpoint: art.checkpoint ?? null,
      checkpointResourceId: art.checkpointResourceId ?? null,
      sampler: art.sampler ?? null,
      seed: art.seed ?? null,
      steps: art.steps ?? null,
      cfg: art.cfg ?? null,
      cfgHalf: art.cfgHalf ?? null,
      designer: art.designer ?? null,
      genres: art.genres ?? null,
      isPublic: art.isPublic ?? null,
      isMature: art.isMature ?? null,
      serverId: art.serverId ?? null,
      serverName: art.serverName ?? null,
      serverUrl: art.serverUrl ?? null,
      artId: art.id,
    }
  }

  async function syncArtToArtImage(
    artId: number,
    artImageId?: number | null,
  ): Promise<ApiResponse<ArtImage>> {
    try {
      clearError()

      const art = artById.value.get(artId) || (await selectArt(artId)).data

      if (!art) {
        throw new Error(`Art #${artId} was not found.`)
      }

      const targetImageId =
        artImageId || art.artImageId || getArtImageByArtId(art.id)?.id || null

      if (!targetImageId) {
        throw new Error(`Art #${artId} does not have a linked ArtImage.`)
      }

      const response = await updateArtImage(
        targetImageId,
        buildArtImageSyncFields(art),
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to sync Art to ArtImage.')
      }

      if (art.artImageId !== targetImageId) {
        await updateArt(art.id, {
          artImageId: targetImageId,
        })
      }

      return {
        success: true,
        data: response.data,
        message: `Art #${artId} synced to ArtImage #${targetImageId}.`,
      }
    } catch (error) {
      handleError(error, 'syncing art to art image')
      setError(error, 'Failed to sync art to art image.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sync art to art image.',
      }
    }
  }

  async function repairArtImageLink(
    artId: number,
    artImageId: number,
  ): Promise<ApiResponse<{ art: Art; artImage: ArtImage }>> {
    try {
      clearError()

      const artResponse = await updateArt(artId, {
        artImageId,
      })

      if (!artResponse.success || !artResponse.data) {
        throw new Error(artResponse.message || 'Failed to update Art link.')
      }

      const imageResponse = await updateArtImage(artImageId, {
        artId,
      })

      if (!imageResponse.success || !imageResponse.data) {
        throw new Error(
          imageResponse.message || 'Failed to update ArtImage link.',
        )
      }

      return {
        success: true,
        data: {
          art: artResponse.data,
          artImage: imageResponse.data,
        },
        message: `Art #${artId} linked with ArtImage #${artImageId}.`,
      }
    } catch (error) {
      handleError(error, 'repairing art image link')
      setError(error, 'Failed to repair art image link.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to repair art image link.',
      }
    }
  }

  async function fetchArtImageForDisplay(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includeImageData: true,
    })
  }

  async function selectArtImageRecord(
    artImageRecord: ArtImage,
  ): Promise<ApiResponse<ArtImage>> {
    state.loading = true

    try {
      clearError()

      state.currentArtImage = artImageRecord
      addOrUpdateArtImages([artImageRecord])

      if (artImageRecord.artId) {
        const linkedArt = artById.value.get(artImageRecord.artId)

        if (linkedArt) {
          state.currentArt = linkedArt
        } else {
          const response = await selectArt(artImageRecord.artId)

          if (response.success && response.data) {
            state.currentArt = response.data
          }
        }
      }

      return {
        success: true,
        message: `Selected ArtImage #${artImageRecord.id}.`,
        data: artImageRecord,
      }
    } catch (error) {
      handleError(error, 'selecting art image record')
      setError(error, 'Failed to select art image.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to select art image.',
      }
    } finally {
      state.loading = false
    }
  }

  function deselectArtImage(): void {
    state.currentArtImage = null
  }

  async function fetchArtImageThumbnail(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includeThumbnailData: true,
    })
  }

  async function fetchArtImageWithTags(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includeTags: true,
    })
  }

  async function updateArtTags(
    id: number,
    tags: string[],
  ): Promise<ApiResponse<Art>> {
    try {
      clearError()

      const response = await performFetch<Art>(`/api/art/${id}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ tags }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update art tags.')
      }

      addOrUpdateArt(response.data)

      if (state.currentArt?.id === id) {
        state.currentArt = response.data
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Tags updated.',
      }
    } catch (error) {
      handleError(error, 'updating art tags')
      setError(error, 'Failed to update art tags.')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update art tags.',
      }
    }
  }
  async function addArtToCollection(
    collectionId: number,
    artId: number,
  ): Promise<ApiResponse<unknown>> {
    try {
      clearError()

      const response = await performFetch(
        `/api/art/collection/${collectionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            addArtIds: [artId],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success) {
        throw new Error(response.message || 'Failed to add art to collection.')
      }

      await collectionStore.fetchCollections?.(true)

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art added to collection.',
      }
    } catch (error) {
      handleError(error, 'adding art to collection')
      setError(error, 'Failed to add art to collection.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to add art to collection.',
      }
    }
  }

  async function removeArtFromCollection(
    collectionId: number,
    artId: number,
  ): Promise<ApiResponse<unknown>> {
    try {
      clearError()

      const response = await performFetch(
        `/api/art/collection/${collectionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            removeArtIds: [artId],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to remove art from collection.',
        )
      }

      await collectionStore.fetchCollections?.(true)

      return {
        success: true,
        data: response.data,
        message: response.message || 'Art removed from collection.',
      }
    } catch (error) {
      handleError(error, 'removing art from collection')
      setError(error, 'Failed to remove art from collection.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to remove art from collection.',
      }
    }
  }
  async function generateBrowserArt(
    server: Server,
    data: GenerateArtData,
    engine: ArtGenerationEngine,
  ): Promise<Art> {
    if (engine === 'a1111') {
      const imageBase64 = await generateImageFromBrowserServer(server, data)

      return await saveBrowserGeneratedArt({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'comfy') {
      const imageBase64 = await generateComfyImageFromBrowserServer(
        server,
        data,
      )

      return await saveBrowserGeneratedArt({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'flux') {
      const imageBase64 = await generateFluxImageFromBrowserServer(server, data)

      return await saveBrowserGeneratedArt({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'kontext') {
      const imageBase64 = await generateKontextImageFromBrowserServer(
        server,
        data,
      )

      return await saveBrowserGeneratedArt({
        ...data,
        imageBase64,
      })
    }

    throw new Error(`Unsupported browser generation engine: ${engine}`)
  }

  async function generateComfyImageFromBrowserServer(
    server: Server,
    data: GenerateArtData,
  ): Promise<string> {
    throw new Error(
      `Browser Comfy generation is not wired yet for "${server.title}".`,
    )
  }

  async function generateFluxImageFromBrowserServer(
    server: Server,
    data: GenerateArtData,
  ): Promise<string> {
    throw new Error(
      `Browser Flux generation is not wired yet for "${server.title}".`,
    )
  }

  async function generateKontextImageFromBrowserServer(
    server: Server,
    data: GenerateArtData,
  ): Promise<string> {
    throw new Error(
      `Browser Kontext generation is not wired yet for "${server.title}".`,
    )
  }

  function getBackendArtGenerationEndpoint(
    engine: ArtGenerationEngine,
  ): string {
    const endpoints: Record<ArtGenerationEngine, string> = {
      a1111: '/api/art/generate',
      comfy: '/api/art/comfy/generate',
      flux: '/api/art/comfy/flux/generate',
      kontext: '/api/art/comfy/kontext/generate',
    }

    return endpoints[engine]
  }

  async function generateImageFromBrowserServer(
    server: Server,
    form: GenerateArtData,
  ): Promise<string> {
    const checkpointStore = useCheckpointStore()

    const serverEngine = server.generationEngine || ''
    const serverType = server.serverType || ''
    const isA1111Server = serverType === 'A1111' || serverEngine === 'A1111'
    const isComfyServer =
      serverType === 'COMFY' ||
      serverEngine === 'COMFY' ||
      Boolean(server.supportsComfyWorkflow)

    if (!isA1111Server) {
      throw new Error(
        `Server "${server.title}" is ${serverType}/${serverEngine}. Browser A1111 generation only supports A1111 or Forge-compatible servers.`,
      )
    }

    if (isComfyServer) {
      throw new Error(
        `Server "${server.title}" supports Comfy workflows. Use the Comfy browser route instead.`,
      )
    }

    if (serverEngine === 'FLUX') {
      throw new Error(
        `Server "${server.title}" is a Flux server. Use the Flux browser route instead.`,
      )
    }

    if (serverEngine === 'KONTEXT') {
      throw new Error(
        `Server "${server.title}" is a Kontext server. Use the Kontext browser route instead.`,
      )
    }

    if (!server.allowBrowserRequests) {
      throw new Error(
        `Server "${server.title}" does not allow browser requests.`,
      )
    }

    const endpointPath = getArtGenerationEndpointPath(server)

    if (!endpointPath.includes('/sdapi/v1/txt2img')) {
      throw new Error(
        `Server "${server.title}" endpoint does not look like an A1111 txt2img endpoint: ${endpointPath}`,
      )
    }

    const cleanPrompt =
      typeof form.promptString === 'string' ? form.promptString.trim() : ''

    if (!cleanPrompt) {
      throw new Error('Cannot generate art without a prompt.')
    }

    const cleanCheckpoint =
      typeof form.checkpoint === 'string' ? form.checkpoint.trim() : ''

    const selectedCheckpointName =
      checkpointStore.selectedCheckpoint?.name ||
      checkpointStore.selectedCheckpoint?.customLabel ||
      ''

    const requestedCheckpoint = cleanCheckpoint || selectedCheckpointName

    if (!requestedCheckpoint) {
      throw new Error(
        'Cannot generate art without a selected checkpoint. Pick a model first.',
      )
    }

    const sampler =
      form.sampler ||
      checkpointStore.selectedSampler?.name ||
      server.defaultSampler ||
      'Euler a'

    const requestBody: Record<string, unknown> = {
      prompt: cleanPrompt,
      negative_prompt: form.negativePrompt || ' ',
      steps: form.steps ?? server.defaultSteps ?? 20,
      cfg_scale: calculateCfg(
        form.cfg ?? server.defaultCfg ?? 3,
        form.cfgHalf ?? false,
      ),
      seed: form.seed ?? -1,
      width: form.width ?? server.defaultWidth ?? 512,
      height: form.height ?? server.defaultHeight ?? 512,
      sampler_index: sampler,
      user: form.designer || 'kindguest',
      override_settings: {
        sd_model_checkpoint: requestedCheckpoint,
      },
      override_settings_restore_afterwards: true,
    }

    const response = await serverStore.requestServer(server, endpointPath, {
      method: 'POST',
      headers: getClientServerHeaders(server),
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const message = await parseServerErrorResponse(response)

      throw new Error(
        `Browser image generation failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ''}`,
      )
    }

    const generationData = await response.json()

    if (!Array.isArray(generationData.images) || !generationData.images[0]) {
      throw new Error('Browser image generation returned no image.')
    }

    const generationInfo = parseA1111GenerationInfo(generationData.info)

    const generationReport = checkpointStore.recordA1111GenerationStatus({
      server,
      selectedCheckpoint: selectedCheckpointName,
      requestedCheckpoint,
      info: generationData.info,
    })

    const actualGenerationModel =
      generationInfo.sd_model_name ||
      generationReport.actualGenerationModel ||
      ''

    if (
      requestedCheckpoint &&
      actualGenerationModel &&
      !modelNamesMatch(requestedCheckpoint, actualGenerationModel)
    ) {
      throw new Error(
        `Safety check failed. Requested "${requestedCheckpoint}", but A1111 reported "${actualGenerationModel}".`,
      )
    }

    if (!actualGenerationModel) {
      throw new Error(
        `Safety check failed. A1111 generated an image but did not report which model was used.`,
      )
    }

    return generationData.images[0]
  }

  async function parseServerErrorResponse(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        return stringifyServerError(errorData)
      }

      return await response.text()
    } catch {
      return response.statusText
    }
  }

  function stringifyServerError(errorData: unknown): string {
    if (!errorData) return ''

    if (typeof errorData === 'string') return errorData

    if (typeof errorData === 'object') {
      const data = errorData as Record<string, unknown>

      const error = data.error
      const message = data.message
      const detail = data.detail
      const statusMessage = data.statusMessage
      const statusText = data.statusText

      if (typeof error === 'string') return error
      if (typeof message === 'string') return message
      if (typeof detail === 'string') return detail
      if (typeof statusMessage === 'string') return statusMessage
      if (typeof statusText === 'string') return statusText

      if (Array.isArray(detail)) {
        return detail
          .map((entry) => stringifyServerError(entry))
          .filter(Boolean)
          .join('; ')
      }

      return JSON.stringify(data)
    }

    return String(errorData)
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

  async function generateBackendArt(
    data: GenerateArtData,
    engine: ArtGenerationEngine,
  ): Promise<Art> {
    const endpoint = getBackendArtGenerationEndpoint(engine)

    const response = await performFetch<Art>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      3,
      180_000,
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

  function buildGenerateArtData(artData?: GenerateArtData): GenerateArtData {
    const checkpointStore = useCheckpointStore()
    const userId =
      artData?.userId || userStore.userId || userStore.user?.id || 10

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
        '',
      sampler:
        artData?.sampler ||
        state.artForm.sampler ||
        checkpointStore.selectedSampler?.name ||
        '',
      steps: artData?.steps ?? state.artForm.steps ?? 25,
      designer:
        artData?.designer ||
        state.artForm.designer ||
        userStore.username ||
        userStore.user?.username ||
        'Kind Designer',
      cfg: artData?.cfg ?? state.artForm.cfg ?? 7,
      cfgHalf: artData?.cfgHalf ?? state.artForm.cfgHalf ?? false,
      isMature: artData?.isMature ?? state.artForm.isMature ?? false,
      isPublic: artData?.isPublic ?? state.artForm.isPublic ?? true,
      seed: artData?.seed ?? state.artForm.seed ?? null,
      promptId: artData?.promptId ?? state.artForm.promptId ?? null,
      pitchId: artData?.pitchId ?? state.artForm.pitchId ?? null,
      serverId:
        artData?.serverId ??
        state.artForm.serverId ??
        serverStore.activeArtServer?.id ??
        null,
      serverName:
        artData?.serverName ??
        state.artForm.serverName ??
        serverStore.activeArtServer?.label ??
        serverStore.activeArtServer?.title ??
        null,
      engine: artData?.engine ?? state.artForm.engine ?? undefined,
      transport: artData?.transport ?? state.artForm.transport ?? undefined,
      workflow: artData?.workflow ?? state.artForm.workflow ?? null,
      width: artData?.width ?? state.artForm.width ?? null,
      height: artData?.height ?? state.artForm.height ?? null,
      guidance: artData?.guidance ?? state.artForm.guidance ?? null,
      denoise: artData?.denoise ?? state.artForm.denoise ?? null,
      strength: artData?.strength ?? state.artForm.strength ?? null,
      sourceImageId:
        artData?.sourceImageId ?? state.artForm.sourceImageId ?? null,
      sourceImageBase64:
        artData?.sourceImageBase64 ?? state.artForm.sourceImageBase64 ?? null,
      maskImageBase64:
        artData?.maskImageBase64 ?? state.artForm.maskImageBase64 ?? null,
    }
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

  async function generateArt(
    artData?: GenerateArtData,
  ): Promise<ApiResponse<Art>> {
    state.loading = true
    animationStore.startGeneration({
      zones: {
        header: false,
        left: false,
        center: true,
        right: false,
        footer: false,
      },
    })

    try {
      clearError()

      const data = buildGenerateArtData(artData)

      if (!promptStore.validatePromptString(data.promptString)) {
        return {
          success: false,
          message: 'Invalid prompt',
        }
      }

      const server = getSelectedArtServer(data)
      const route = getArtGenerationRoute(server, data)

      const dataWithServer: GenerateArtData = {
        ...data,
        serverId: server.id,
        serverName: server.label || server.title,
        engine: route.engine,
        transport: route.transport,
      }

      let art: Art

      if (route.transport === 'browser') {
        art = await generateBrowserArt(server, dataWithServer, route.engine)
      } else {
        art = await generateBackendArt(dataWithServer, route.engine)
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
      animationStore.stop()
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
    fetchAllArtImagesPromise.value = null
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
    fetchAllArtImagesPromise,

    artImageByArtId,
    artByImageId,
    publicArt,
    matureArt,
    safeArt,
    artWithImages,
    artWithoutImages,
    publicArtImages,
    matureArtImages,
    safeArtImages,
    linkedArtImages,
    unlinkedArtImages,
    artImagePairs,
    artListPresets,

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

    selectArtRecord,
    selectArtImageRecord,
    deselectArtImage,

    updateArt,
    updateArtTags,
    addArtToCollection,
    removeArtFromCollection,
    fetchAllArtImages,
    updateArtImage,
    syncArtToArtImage,
    repairArtImageLink,
    fetchArtImageForDisplay,
    fetchArtImageThumbnail,
    fetchArtImageWithTags,
    buildArtImageSyncFields,
    updateArtImageConnections,
    createArtImage,
  }
})

export type { Art, ArtImage, ArtCollection }

// /stores/artStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import type {
  ArtImage,
  Reaction,
  Server,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useManaStore } from '@/stores/manaStore'
import { useRandomStore } from '@/stores/randomStore'
import { useServerStore } from '@/stores/serverStore'
import { useNavStore } from '@/stores/navStore'
import { artListPresets } from '@/stores/seeds/artList'
import {
  getArtImagesByIds,
  getCachedArtImageById,
  getOrFetchArtImageById,
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

type ArtStoreInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  hydrateImages?: boolean
  initializeServerStore?: boolean
  initializeCollections?: boolean
}

type ArtImageFetchOptions = {
  force?: boolean
  includeImageData?: boolean
  includeThumbnailData?: boolean
  includePitches?: boolean
}

interface ArtImageGenerationRoute {
  transport: ArtImageGenerationTransport
  engine: ArtImageGenerationEngine
}

function validateImagePrompt(prompt: string): {
  success: boolean
  message?: string
} {
  const cleanPrompt = prompt.trim()

  if (!cleanPrompt) {
    return {
      success: false,
      message: 'Image prompt is empty.',
    }
  }

  if (cleanPrompt.length < 3) {
    return {
      success: false,
      message: 'Image prompt is too short.',
    }
  }

  if (cleanPrompt.length > 4000) {
    return {
      success: false,
      message: `Image prompt is too long. Received ${cleanPrompt.length} characters. Maximum is 4000.`,
    }
  }

  return { success: true }
}

export type ArtImageGenerationEngine =
  | 'a1111'
  | 'comfy'
  | 'flux'
  | 'kontext'
  | 'openai'

export type ArtImageGenerationTransport = 'browser' | 'backend'

export interface GenerateArtData {
  promptString: string
  prompt?: string
  artPrompt?: string
  negativePrompt?: string
  pitch?: string
  title?: string
  collection?: string
  collectionLabel?: string
  artCollectionId?: number | null

  userId?: number | null
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

  engine?: ArtImageGenerationEngine
  transport?: ArtImageGenerationTransport
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

type ArtImageConnectionInput = {
  userId?: number | null
  serverId?: number | null
  checkpointResourceId?: number | null

  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  pitchIds?: number[]
  butterflyIds?: number[]
  artCollectionIds?: number[]

  disconnectDreamIds?: number[]
  disconnectScenarioIds?: number[]
  disconnectReactionIds?: number[]
  disconnectPitchIds?: number[]
  disconnectButterflyIds?: number[]
  disconnectArtCollectionIds?: number[]

  clearDirectLinks?: boolean
  clearDreams?: boolean
  clearScenarios?: boolean
  clearReactions?: boolean
  clearPitches?: boolean
  clearButterflies?: boolean
  clearArtCollections?: boolean
}

type ArtImagePatchInput = Partial<ArtImage> & {
  rarity?: number | null
  connectedModelType?: string | null
  connectedModelId?: number | null
}

type ArtImageCreateInput = Partial<ArtImage> &
  Record<string, unknown> & {
    rarity?: number | null
    connectedModelType?: string | null
    connectedModelId?: number | null
  }

type ArtStoreState = {
  artImages: ArtImage[]
  reactions: Reaction[]
  loading: boolean
  error: string
  isInitialized: boolean
  currentArtImage: ArtImage | null
  processedArtPrompt: string
  pitch: string
  currentPage: number
  totalArtImageCount: number
  pageSize: number
  collections: ArtCollection[]
  currentCollection: ArtCollection | null
  generatedArtImages: ArtImage[]
  artForm: GenerateArtData
  artListSelections: Record<string, string[]>
  previousArtTab: string | null
  isGenerating: boolean
  generationMessage: string
  generationMessageTone: 'success' | 'error'
  lastGeneratedArtImage: ArtImage | null
  selectedGenerationCollectionId: number | null
}

const isClient = typeof window !== 'undefined'
const artImagesStorageKey = 'artImages'
const maxStoredImages = 150
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

function sanitizeArtImage(image: ArtImage): ArtImage {
  const cleaned = { ...image } as Record<string, unknown>
  delete cleaned.Tags
  delete cleaned.Reactions
  delete cleaned.Gallery
  delete cleaned.Server
  delete cleaned.User
  delete cleaned.ArtCollections
  delete cleaned.Dreams
  delete cleaned.Scenarios
  delete cleaned.Butterflies
  return cleaned as ArtImage
}

function stripHeavyImageFields(image: ArtImage): ArtImage {
  return {
    ...image,
    imageData: null,
    thumbnailData: null,
  }
}

function limitByNewestId<T extends { id: number }>(
  items: T[],
  limit: number,
): T[] {
  return [...items].sort((a, b) => b.id - a.id).slice(0, limit)
}

function sortNewestArtImages(a: ArtImage, b: ArtImage): number {
  return b.id - a.id
}

function isValidId(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
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

export const useArtStore = defineStore('artStore', () => {
  const state = reactive<ArtStoreState>({
    artImages: [],
    reactions: [],
    loading: false,
    error: '',
    isInitialized: false,
    currentArtImage: null,
    processedArtPrompt: '',
    pitch: '',
    currentPage: 1,
    totalArtImageCount: 0,
    pageSize: 100,
    collections: [],
    currentCollection: null,
    generatedArtImages: [],
    artListSelections: {},
    previousArtTab: null,
    isGenerating: false,
    generationMessage: '',
    generationMessageTone: 'success',
    lastGeneratedArtImage: null,
    selectedGenerationCollectionId: null,
    artForm: {
      promptString: '',
      negativePrompt: '',
      pitch: '',
      userId: null,
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
  const randomStore = useRandomStore()
  const serverStore = useServerStore()
  const animationStore = useAnimationStore()
  const navStore = useNavStore()

  const hoverArtImage = ref<ArtImage | null>(null)
  const initializing = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const artImageRequestMap = ref<Record<number, Promise<ArtImage | undefined>>>(
    {},
  )

  function getCollectionStore() {
    return useCollectionStore()
  }

  const hasCachedImages = computed(() => state.artImages.length > 0)

  const currentImagePath = computed(() => {
    const image = state.currentArtImage as
      | (ArtImage & { imageData?: string | null; path?: string | null })
      | null

    if (image?.imageData) {
      return `data:image/${image.fileType || 'png'};base64,${image.imageData}`
    }

    return image?.imagePath || image?.path || ''
  })

  const generatedArtImageCount = computed(() => state.generatedArtImages.length)

  const imageById = computed(() => {
    return new Map(state.artImages.map((image) => [image.id, image]))
  })

  function isOfficialFallbackServer(server: Server): boolean {
    return Boolean(
      server.isOfficial ||
      server.category === 'official' ||
      server.userId === 9 ||
      server.isMetered,
    )
  }

  function isUserSupportedKontextServer(server: Server): boolean {
    if (!server.isActive) return false
    if (isOfficialFallbackServer(server)) return false

    const isComfy =
      server.serverType === 'COMFY' ||
      server.generationEngine === 'COMFY' ||
      Boolean(server.supportsComfyWorkflow)

    const supportsFluxWorkflow =
      Boolean(server.supportsFlux) ||
      Boolean(server.supportsKontext) ||
      Boolean(server.supportsWorkflowUpload)

    return isComfy && supportsFluxWorkflow
  }

  function isHostedKontextFallbackServer(server: Server): boolean {
    if (!server.isActive) return false

    const isComfy =
      server.serverType === 'COMFY' ||
      server.generationEngine === 'COMFY' ||
      Boolean(server.supportsComfyWorkflow)

    return isComfy && isOfficialFallbackServer(server)
  }

  function isKontextCapableServer(server: Server): boolean {
    if (!server.isActive) return false

    return (
      server.generationEngine === 'KONTEXT' ||
      server.generationEngine === 'COMFY' ||
      server.serverType === 'COMFY' ||
      Boolean(server.supportsComfyWorkflow) ||
      Boolean(server.supportsFlux)
    )
  }

  function findKontextServer(
    preferredServerId?: number | null,
    options: { allowHostedFallback?: boolean } = {},
  ): Server | null {
    const servers = Array.isArray(serverStore.servers)
      ? (serverStore.servers as Server[])
      : []

    if (preferredServerId) {
      const explicitServer =
        serverStore.getServerById(preferredServerId) ?? null

      if (explicitServer && isUserSupportedKontextServer(explicitServer)) {
        return explicitServer
      }

      if (
        explicitServer &&
        options.allowHostedFallback &&
        isHostedKontextFallbackServer(explicitServer)
      ) {
        return explicitServer
      }
    }

    const activeServer = serverStore.activeArtServer

    if (activeServer && isUserSupportedKontextServer(activeServer)) {
      return activeServer
    }

    const ownedServer =
      servers.find((server) => {
        return (
          server.userId === userStore.userId &&
          server.generationEngine === 'KONTEXT' &&
          isUserSupportedKontextServer(server)
        )
      }) ||
      servers.find((server) => {
        return (
          server.userId === userStore.userId &&
          server.generationEngine === 'COMFY' &&
          isUserSupportedKontextServer(server)
        )
      }) ||
      servers.find((server) => {
        return (
          server.userId === userStore.userId &&
          isUserSupportedKontextServer(server)
        )
      })

    if (ownedServer) return ownedServer

    const personalServer =
      servers.find((server) => {
        return (
          server.generationEngine === 'KONTEXT' &&
          isUserSupportedKontextServer(server)
        )
      }) ||
      servers.find((server) => {
        return (
          server.generationEngine === 'COMFY' &&
          isUserSupportedKontextServer(server)
        )
      }) ||
      servers.find(isUserSupportedKontextServer)

    if (personalServer) return personalServer

    if (!options.allowHostedFallback) return null

    return (
      servers.find((server) => {
        return (
          server.generationEngine === 'KONTEXT' &&
          isHostedKontextFallbackServer(server)
        )
      }) ||
      servers.find((server) => {
        return (
          server.generationEngine === 'COMFY' &&
          isHostedKontextFallbackServer(server)
        )
      }) ||
      servers.find(isHostedKontextFallbackServer) ||
      null
    )
  }

  const publicArtImages = computed(() => {
    return state.artImages.filter((image) => image.isPublic)
  })

  const matureArtImages = computed(() => {
    return state.artImages.filter((image) => image.isMature)
  })

  const safeArtImages = computed(() => {
    return state.artImages.filter((image) => !image.isMature)
  })

  const unlinkedArtImages = computed(() => {
    return state.artImages.filter((image) => {
      const record = image as ArtImage & Record<string, unknown>
      return (
        !record.botId &&
        !record.componentId &&
        !record.milestoneId &&
        !record.pitchId &&
        !record.promptId &&
        !record.resourceId &&
        !record.rewardId &&
        !record.chatId &&
        !record.characterId &&
        !record.butterflyId
      )
    })
  })

  const showMature = computed(() => {
    return userStore.user?.showMature ?? userStore.showMature ?? false
  })

  const generationServers = computed<Server[]>(() => {
    const servers = Array.isArray(serverStore.servers)
      ? (serverStore.servers as Server[])
      : []

    return servers.filter((server) => {
      if (!server.isActive) return false

      if (server.generationEngine === 'OPENAI_IMAGE') return true
      if (server.generationEngine === 'FLUX') return true
      if (server.generationEngine === 'KONTEXT') return true
      if (server.generationEngine === 'COMFY') return true
      if (server.generationEngine === 'A1111') return true

      if (server.serverType === 'COMFY') return true
      if (server.serverType === 'A1111') return true

      return Boolean(
        server.supportsTxt2Img ||
        server.supportsComfyWorkflow ||
        server.supportsFlux,
      )
    })
  })
  const activeGenerationServer = computed<Server | null>(() => {
    if (state.artForm.serverId) {
      return serverStore.getServerById(state.artForm.serverId) ?? null
    }

    return serverStore.activeArtServer ?? null
  })

  const selectedCheckpointName = computed(() => {
    const checkpointStore = useCheckpointStore()
    return (
      state.artForm.checkpoint ||
      checkpointStore.selectedCheckpoint?.name ||
      checkpointStore.selectedCheckpoint?.customLabel ||
      ''
    )
  })

  const selectedSamplerName = computed(() => {
    const checkpointStore = useCheckpointStore()
    return (
      state.artForm.sampler ||
      checkpointStore.selectedSampler?.name ||
      serverStore.activeArtServer?.defaultSampler ||
      'Euler a'
    )
  })

  const generationCollections = computed<ArtCollection[]>(() => {
    const collectionStore = getCollectionStore()
    const collections = Array.isArray(collectionStore.collections)
      ? collectionStore.collections
      : []

    return collections.filter((collection: ArtCollection) => {
      if (collection.isMature && !showMature.value) return false
      if (collection.userId === userStore.userId) return true
      return Boolean(collection.isPublic)
    })
  })

  const finalPromptString = computed(() => {
    return (
      promptStore.promptField?.trim() ||
      getPromptString.value?.trim() ||
      state.artForm.promptString?.trim() ||
      ''
    )
  })

  const canGenerateArt = computed(() => {
    return Boolean(
      !state.loading &&
      !state.isGenerating &&
      state.artForm.serverId &&
      selectedCheckpointName.value &&
      finalPromptString.value,
    )
  })

  function setGenerationMessage(
    tone: 'success' | 'error',
    message: string,
  ): void {
    state.generationMessageTone = tone
    state.generationMessage = message
  }

  function clearGenerationMessage(): void {
    state.generationMessage = ''
  }

  function getServerLabel(server: Server): string {
    return server.label || server.title || `Server #${server.id}`
  }

  function selectGenerationServer(serverId: number | null): void {
    const server = serverId ? serverStore.getServerById(serverId) : null

    setArtForm({
      serverId,
      serverName: server ? getServerLabel(server) : null,
    })
  }

  function selectGenerationCheckpoint(name: string): void {
    const checkpoint = name.trim()
    const checkpointStore = useCheckpointStore()
    if (!checkpoint) return

    checkpointStore.selectCheckpointByName(checkpoint)
    setArtForm({ checkpoint })
  }

  function selectGenerationSampler(name: string): void {
    const checkpointStore = useCheckpointStore()
    const sampler = name.trim()
    if (!sampler) return

    checkpointStore.selectSamplerByName(sampler)
    setArtForm({ sampler })
  }

  function selectGenerationCollection(collectionId: number | null): void {
    const collectionStore = getCollectionStore()

    state.selectedGenerationCollectionId = collectionId
    setArtForm({ artCollectionId: collectionId })

    if (!collectionId) {
      collectionStore.currentCollection = null
      collectionStore.clearSelectedCollections?.()
      return
    }

    collectionStore.setCurrentCollection(collectionId)
    collectionStore.setSelectedCollectionIds([collectionId])
  }

  async function prepareArtGenerator(): Promise<ApiResponse<true>> {
    state.loading = true
    clearGenerationMessage()

    try {
      await Promise.all([
        initialize({
          fetchRemote: false,
          hydrateImages: false,
          initializeServerStore: false,
          initializeCollections: false,
        }),
        serverStore.hasLoaded
          ? Promise.resolve()
          : serverStore.initialize({ fetchRemote: true }),
        ensureCollectionsReady(),
      ])

      if (!state.artForm.serverId && serverStore.activeArtServer?.id) {
        selectGenerationServer(serverStore.activeArtServer.id)
      }

      if (!state.artForm.sampler) {
        selectGenerationSampler('Euler a')
      }

      if (!state.artForm.userId) {
        setArtForm({
          userId: userStore.userId || userStore.user?.id || 10,
          designer:
            userStore.username || userStore.user?.username || 'Kind Designer',
        })
      }

      return {
        success: true,
        data: true,
        message: 'Art generator ready.',
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load image generator.'

      handleError(error, 'preparing art generator')
      setError(error, message)
      setGenerationMessage('error', message)

      return {
        success: false,
        message,
      }
    } finally {
      state.loading = false
    }
  }

  async function generateCurrentArt(
    overrides: Partial<GenerateArtData> = {},
  ): Promise<ApiResponse<ArtImage>> {
    clearGenerationMessage()

    const result = await generateArt({
      ...state.artForm,
      ...overrides,
      promptString:
        overrides.promptString?.trim() ||
        overrides.artPrompt?.trim() ||
        overrides.prompt?.trim() ||
        finalPromptString.value ||
        state.artForm.promptString ||
        '',
      artCollectionId:
        overrides.artCollectionId ??
        state.selectedGenerationCollectionId ??
        state.artForm.artCollectionId ??
        null,
      checkpoint:
        overrides.checkpoint ||
        selectedCheckpointName.value ||
        state.artForm.checkpoint ||
        '',
      sampler:
        overrides.sampler ||
        selectedSamplerName.value ||
        state.artForm.sampler ||
        'Euler a',
    })

    if (!result.success) {
      setGenerationMessage('error', result.message || 'Generation failed.')
      return result
    }

    if (result.data) {
      state.lastGeneratedArtImage = result.data
    }

    setGenerationMessage('success', result.message || 'Image generated.')

    return result
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

  const getNegativePromptString = computed<string>(() => {
    return (state.artListSelections.__negative__ || []).join(', ')
  })

  function setError(error: unknown, fallback: string): void {
    state.error = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    state.error = ''
  }

  function setHoverArtImage(image: ArtImage | null): void {
    hoverArtImage.value = image
  }

  function persistArtImages(): void {
    const trimmed = limitByNewestId(state.artImages, maxStoredImages).map(
      stripHeavyImageFields,
    )

    safeSetLocalStorage(artImagesStorageKey, JSON.stringify(trimmed))
  }

  function hydrateFromLocalStorage(options: { hydrateImages?: boolean } = {}) {
    if (options.hydrateImages === false) return

    state.artImages = safeParseArtImages(
      safeGetLocalStorage(artImagesStorageKey),
    ).sort(sortNewestArtImages)
  }

  function addOrUpdateArtImages(images: ArtImage[]): void {
    if (!images.length) return

    state.artImages = mergeUniqueArtImages(
      state.artImages,
      images.map(sanitizeArtImage),
    )
    persistArtImages()
  }

  function setArtImageList(images: ArtImage[]): void {
    state.artImages = mergeUniqueArtImages([], images.map(sanitizeArtImage))
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

  async function initialize(
    options: ArtStoreInitializeOptions = {},
  ): Promise<void> {
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
          await fetchAllArtImages({
            force: Boolean(options.force),
            includeImageData: false,
            includeThumbnailData: false,
            includePitches: false,
          })
        }

        if (!state.artForm.userId) {
          resetArtForm(state.artForm)
        }

        state.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing art image store')
        setError(error, 'Failed to initialize art image store.')
        state.isInitialized = false
      } finally {
        state.loading = false
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function buildArtImageQuery(options: ArtImageFetchOptions = {}): string {
    const params = new URLSearchParams()

    if (options.includeImageData) {
      params.set('includeImageData', 'true')
    }

    if (options.includeThumbnailData) {
      params.set('includeThumbnailData', 'true')
    }

    if (options.includePitches) {
      params.set('includePitches', 'true')
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
      Pitches?: unknown[]
    }

    if (options.includeImageData && !withOptionalData.imageData) return false

    if (
      options.includeThumbnailData &&
      typeof withOptionalData.thumbnailData === 'undefined'
    ) {
      return false
    }

    if (
      options.includePitches &&
      typeof withOptionalData.Pitches === 'undefined'
    ) {
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
      includePitches: false,
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
        state.totalArtImageCount = state.artImages.length

        return state.artImages
      } catch (error) {
        handleError(error, 'fetching art images')
        setError(error, 'Failed to fetch art images.')
        return state.artImages
      } finally {
        state.loading = false
        fetchAllArtImagesPromise.value = null
      }
    })()

    return fetchAllArtImagesPromise.value
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

  async function getArtImageById(
    id: number,
    options: ArtImageFetchOptions = {},
  ): Promise<ArtImage | undefined> {
    const imageId = Number(id)

    if (!isValidId(imageId)) {
      setError('Invalid art image ID.', 'Invalid art image ID.')
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

      const cleanImage = stripHeavyImageFields(response.data)

      addOrUpdateArtImages([cleanImage])
      state.currentArtImage = cleanImage

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

  async function deleteArtImage(id: number): Promise<boolean> {
    try {
      clearError()

      const response = await performFetch(`/api/art/image/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete art image.')
      }

      state.artImages = state.artImages.filter((image) => image.id !== id)
      state.generatedArtImages = state.generatedArtImages.filter(
        (image) => image.id !== id,
      )

      if (state.currentArtImage?.id === id) {
        deselectArtImage()
      }

      persistArtImages()
      return true
    } catch (error) {
      handleError(error, 'deleting art image')
      setError(error, 'Failed to delete art image.')
      return false
    }
  }

  async function uploadImage(
    formData: FormData,
  ): Promise<{ success: boolean; message: string; data?: ArtImage }> {
    try {
      clearError()

      const response = await performFetch<ArtImage>('/api/art/image/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to upload image.')
      }

      addOrUpdateArtImages([stripHeavyImageFields(response.data)])
      state.currentArtImage = response.data

      return {
        success: true,
        message: response.message || 'Image uploaded.',
        data: response.data,
      }
    } catch (error) {
      handleError(error, 'uploading image')
      const message =
        error instanceof Error ? error.message : 'Failed to upload image.'
      setError(error, message)

      return {
        success: false,
        message,
      }
    }
  }

  async function selectArtImageRecord(
    artImageRecord: ArtImage,
  ): Promise<ApiResponse<ArtImage>> {
    state.loading = true

    try {
      clearError()

      state.currentArtImage = artImageRecord
      addOrUpdateArtImages([artImageRecord])

      return {
        success: true,
        message: `Selected art image #${artImageRecord.id}.`,
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

  async function selectArtImage(id: number): Promise<ApiResponse<ArtImage>> {
    state.loading = true

    try {
      clearError()

      const imageId = Number(id)

      if (!isValidId(imageId)) {
        throw new Error('Invalid art image ID.')
      }

      const localImage = state.artImages.find((image) => image.id === imageId)

      if (localImage) {
        return await selectArtImageRecord(localImage)
      }

      const image = await getArtImageById(imageId, {
        includeImageData: true,
      })

      if (!image) {
        throw new Error(`Art image #${imageId} was not found.`)
      }

      return await selectArtImageRecord(image)
    } catch (error) {
      handleError(error, 'selecting art image')
      setError(error, 'There was trouble finding that art image.')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'There was trouble finding that art image.',
      }
    } finally {
      state.loading = false
    }
  }

  function deselectArtImage(): void {
    state.currentArtImage = null
    setHoverArtImage(null)

    if (state.previousArtTab) {
      navStore.setDashboardTab('art', state.previousArtTab)
      state.previousArtTab = null
    }
  }

  async function fetchArtImageForDisplay(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includeImageData: true,
    })
  }

  async function fetchArtImageThumbnail(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includeThumbnailData: true,
    })
  }

  async function fetchArtImageWithPitches(
    id: number,
  ): Promise<ArtImage | undefined> {
    return await getArtImageById(id, {
      includePitches: true,
    })
  }

  async function updateArtImagePitches(
    id: number,
    pitchIds: number[],
  ): Promise<ApiResponse<ArtImage>> {
    return await updateArtImageConnections(id, {
      pitchIds,
    })
  }

  async function addArtImageToCollection(
    collectionId: number,
    artImageId: number,
  ): Promise<ApiResponse<ArtImage>> {
    return await updateArtImageConnections(artImageId, {
      artCollectionIds: [collectionId],
    })
  }

  async function removeArtImageFromCollection(
    collectionId: number,
    artImageId: number,
  ): Promise<ApiResponse<ArtImage>> {
    return await updateArtImageConnections(artImageId, {
      disconnectArtCollectionIds: [collectionId],
    })
  }

  function calculateCfg(cfg: number, cfgHalf: boolean): number {
    return cfgHalf ? cfg + 0.5 : cfg
  }

  function getArtImageGenerationEndpointPath(server: Server): string {
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

  function getSelectedArtServer(data: GenerateArtData): Server | null {
    if (data.engine === 'kontext') {
      return findKontextServer(data.serverId, {
        allowHostedFallback: userStore.isGuest || data.serverId === null,
      })
    }

    const selectedServer = data.serverId
      ? serverStore.getServerById(data.serverId)
      : serverStore.activeArtServer

    if (!selectedServer) {
      throw new Error('No active image generation server selected.')
    }

    return selectedServer
  }

  function getArtImageGenerationEngine(
    server: Server,
    data?: GenerateArtData,
  ): ArtImageGenerationEngine {
    if (data?.engine) {
      return data.engine
    }

    if (server.generationEngine === 'OPENAI_IMAGE') return 'openai'
    if (server.generationEngine === 'FLUX') return 'flux'
    if (server.generationEngine === 'KONTEXT') return 'kontext'
    if (server.generationEngine === 'COMFY') return 'comfy'
    if (server.generationEngine === 'A1111') return 'a1111'

    if (server.serverType === 'COMFY' || server.supportsComfyWorkflow) {
      if (server.supportsFlux) return 'flux'
      return 'comfy'
    }

    if (server.serverType === 'A1111') {
      return 'a1111'
    }

    throw new Error(
      `Server "${server.title}" is ${server.serverType}/${server.generationEngine}. This generator supports Stable Diffusion, Comfy SDXL, Comfy Flux, Kontext, and OpenAI Images only.`,
    )
  }
  function getArtImageGenerationTransport(
    server: Server,
    data?: GenerateArtData,
  ): ArtImageGenerationTransport {
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

  function getArtImageGenerationRoute(
    server: Server,
    data?: GenerateArtData,
  ): ArtImageGenerationRoute {
    if (!server.isActive) {
      throw new Error(`Server "${server.title}" is not active.`)
    }

    const engine = getArtImageGenerationEngine(server, data)
    const transport = getArtImageGenerationTransport(server, data)

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

    const endpointPath = getArtImageGenerationEndpointPath(server)

    if (!endpointPath.includes('/sdapi/v1/txt2img')) {
      throw new Error(
        `Server "${server.title}" endpoint does not look like an A1111 txt2img endpoint: ${endpointPath}`,
      )
    }

    const cleanPrompt =
      typeof form.promptString === 'string' ? form.promptString.trim() : ''

    if (!cleanPrompt) {
      throw new Error('Cannot generate an image without a prompt.')
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
        'Cannot generate an image without a selected checkpoint. Pick a model first.',
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

  async function saveBrowserGeneratedArtImage(
    data: GenerateArtData & { imageBase64: string },
  ): Promise<ArtImage> {
    const response = await performFetch<ArtImage>(
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
        response.message || 'Failed to save browser-generated image.',
      )
    }

    return response.data
  }

  async function generateBrowserArtImage(
    server: Server,
    data: GenerateArtData,
    engine: ArtImageGenerationEngine,
  ): Promise<ArtImage> {
    if (engine === 'a1111') {
      const imageBase64 = await generateImageFromBrowserServer(server, data)

      return await saveBrowserGeneratedArtImage({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'comfy') {
      const imageBase64 = await generateComfyImageFromBrowserServer(
        server,
        data,
      )

      return await saveBrowserGeneratedArtImage({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'flux') {
      const imageBase64 = await generateFluxImageFromBrowserServer(server, data)

      return await saveBrowserGeneratedArtImage({
        ...data,
        imageBase64,
      })
    }

    if (engine === 'kontext') {
      const imageBase64 = await generateKontextImageFromBrowserServer(
        server,
        data,
      )

      return await saveBrowserGeneratedArtImage({
        ...data,
        imageBase64,
      })
    }

    throw new Error(`Unsupported browser generation engine: ${engine}`)
  }

  function getBackendArtImageGenerationEndpoint(
    engine: ArtImageGenerationEngine,
  ): string {
    const endpoints: Record<ArtImageGenerationEngine, string> = {
      a1111: '/api/art/generate',
      comfy: '/api/comfy/sdxl/generate',
      flux: '/api/comfy/flux/generate',
      kontext: '/api/comfy/kontext/generate',
      openai: '/api/chats/openai/images/generate',
    }

    return endpoints[engine]
  }

  // /stores/artStore.ts
  function buildBackendGenerationPayload(
    data: GenerateArtData,
    engine: ArtImageGenerationEngine,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...data }

    if (engine === 'kontext') {
      const imageData = data.sourceImageBase64
        ? data.sourceImageBase64.startsWith('data:image/')
          ? data.sourceImageBase64
          : `data:image/png;base64,${data.sourceImageBase64}`
        : null

      return {
        serverId: data.serverId ?? null,
        serverName: data.serverName ?? null,
        prompt: data.promptString,
        imageData,
        width: data.width ?? null,
        height: data.height ?? null,
        steps: data.steps ?? null,
        guidance: data.guidance ?? null,
        seed: data.seed ?? null,
        sampler: data.sampler ?? null,
        denoise: data.denoise ?? null,
      }
    }

    if (engine === 'flux') {
      return {
        ...payload,
        prompt: data.promptString,
        variant: data.workflow ? undefined : 'dev',
      }
    }

    if (engine === 'openai') {
      return {
        ...payload,
        prompt: data.promptString,
        model: 'gpt-image-2',
      }
    }

    return payload
  }

  // /stores/artStore.ts
  type KontextGenerationResult = {
    imageData?: string
    filename?: string
    subfolder?: string
    type?: string
    uploadedImage?: unknown
    serverId?: number | null
    serverName?: string | null
    baseUrl?: string | null
    promptId?: string | null
    queuePosition?: number | null
    mana?: {
      balance?: number
      charged?: number
    }
  }

  async function generateBackendArtImage(
    data: GenerateArtData,
    engine: ArtImageGenerationEngine,
  ): Promise<ArtImage> {
    const endpoint = getBackendArtImageGenerationEndpoint(engine)
    const payload = buildBackendGenerationPayload(data, engine)

    if (engine === 'kontext') {
      const response = await performFetch<KontextGenerationResult>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
        3,
        180_000,
      )

      if (!response.success || !response.data?.imageData) {
        throw new Error(response.message || 'Failed to generate Kontext image.')
      }

      const imageBase64 = response.data.imageData.includes(',')
        ? (response.data.imageData.split(',')[1] ?? '')
        : response.data.imageData

      return await saveBrowserGeneratedArtImage({
        ...data,
        serverId: response.data.serverId ?? data.serverId ?? null,
        serverName: response.data.serverName ?? data.serverName ?? null,
        imageBase64,
      })
    }

    const response = await performFetch<ArtImage>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
      3,
      180_000,
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to generate image.')
    }

    return response.data
  }

  async function ensureCollectionsReady(): Promise<void> {
    const collectionStore = getCollectionStore()

    if (collectionStore.collections?.length) return
    await collectionStore.fetchCollections?.()
  }

  function buildGenerateArtData(artData?: GenerateArtData): GenerateArtData {
    const checkpointStore = useCheckpointStore()
    const userId =
      artData?.userId || userStore.userId || userStore.user?.id || 10

    const basePrompt =
      artData?.promptString ||
      artData?.artPrompt ||
      artData?.prompt ||
      getPromptString.value ||
      promptStore.promptField ||
      getArtListAddonPrompt()

    const promptString = promptStore
      .processPromptPlaceholders(basePrompt.trim())
      .replace(/\s+/g, ' ')

    const engine = artData?.engine ?? state.artForm.engine ?? undefined
    const explicitServerIdProvided =
      artData !== undefined &&
      Object.prototype.hasOwnProperty.call(artData, 'serverId')
    const explicitServerNameProvided =
      artData !== undefined &&
      Object.prototype.hasOwnProperty.call(artData, 'serverName')

    const kontextServer =
      engine === 'kontext'
        ? findKontextServer(
            explicitServerIdProvided ? (artData?.serverId ?? null) : null,
            { allowHostedFallback: false },
          )
        : null

    return {
      promptString,
      negativePrompt:
        artData?.negativePrompt ??
        state.artForm.negativePrompt ??
        getNegativePromptString.value,
      pitch: artData?.pitch || promptStore.extractPitch(basePrompt),
      userId,
      artCollectionId:
        artData?.artCollectionId ?? state.artForm.artCollectionId ?? null,
      collectionLabel:
        artData?.collectionLabel ??
        artData?.collection ??
        state.artForm.collectionLabel,
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
        engine === 'kontext'
          ? explicitServerIdProvided
            ? (artData?.serverId ?? kontextServer?.id ?? null)
            : (kontextServer?.id ?? null)
          : (artData?.serverId ??
            state.artForm.serverId ??
            serverStore.activeArtServer?.id ??
            null),
      serverName:
        engine === 'kontext'
          ? explicitServerNameProvided
            ? (artData?.serverName ??
              kontextServer?.label ??
              kontextServer?.title ??
              null)
            : (kontextServer?.label ?? kontextServer?.title ?? null)
          : (artData?.serverName ??
            state.artForm.serverName ??
            serverStore.activeArtServer?.label ??
            serverStore.activeArtServer?.title ??
            null),
      engine,
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

  async function addGeneratedArtImageToCollections(
    image: ArtImage,
    userId: number,
    selectedCollectionId?: number | null,
  ): Promise<void> {
    await ensureCollectionsReady()

    const collectionStore = getCollectionStore()
    const generatedCollection =
      await collectionStore.getOrCreateGeneratedArtCollection(userId)

    if (generatedCollection?.id) {
      await addArtImageToCollection(generatedCollection.id, image.id)
    }

    const activeCollectionId =
      selectedCollectionId ?? collectionStore.currentCollection?.id ?? null

    if (activeCollectionId && activeCollectionId !== generatedCollection?.id) {
      await addArtImageToCollection(activeCollectionId, image.id)
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
  ): Promise<ApiResponse<ArtImage>> {
    // Cheap pre-check so we don't create an account for an empty submit.
    const previewPrompt =
      artData?.promptString?.trim() ||
      artData?.artPrompt?.trim() ||
      artData?.prompt?.trim() ||
      finalPromptString.value ||
      ''
    if (!previewPrompt) {
      return { success: false, message: 'Image prompt is empty.' }
    }

    if (userStore.isGuest) {
      const promo = await userStore.ensureRealUser()
      if (!promo.success) {
        return {
          success: false,
          message:
            promo.message ||
            'We could not set up your account for generating. Please try again.',
        }
      }
      // Land the signup bonus + real balance before we charge.
      void useManaStore().fetch()
    }

    state.loading = true
    state.isGenerating = true
    clearGenerationMessage()

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

      const promptValidation = validateImagePrompt(data.promptString)

      if (!promptValidation.success) {
        return {
          success: false,
          message: promptValidation.message || 'Invalid image prompt.',
        }
      }
      const server = getSelectedArtServer(data)

      if (data.engine === 'kontext' && !server) {
        const dataWithHostedKontext: GenerateArtData = {
          ...data,
          serverId: null,
          serverName: null,
          engine: 'kontext',
          transport: 'backend',
        }

        const image = await generateBackendArtImage(
          dataWithHostedKontext,
          'kontext',
        )

        addOrUpdateArtImages([image])

        state.generatedArtImages = mergeUniqueArtImages(
          state.generatedArtImages,
          [image],
        )

        state.currentArtImage = image
        state.lastGeneratedArtImage = image

        await addGeneratedArtImageToCollections(
          image,
          dataWithHostedKontext.userId || 10,
          dataWithHostedKontext.artCollectionId,
        )

        setGenerationMessage(
          'success',
          'Image created and added to collections.',
        )

        return {
          success: true,
          data: image,
          message: 'Image created and added to collections.',
        }
      }

      if (!server) {
        throw new Error('No active image generation server selected.')
      }

      const route = getArtImageGenerationRoute(server, data)

      const dataWithServer: GenerateArtData = {
        ...data,
        serverId: server.id,
        serverName: server.label || server.title,
        engine: route.engine,
        transport: data.engine === 'kontext' ? 'backend' : route.transport,
      }

      const image =
        dataWithServer.transport === 'browser'
          ? await generateBrowserArtImage(server, dataWithServer, route.engine)
          : await generateBackendArtImage(dataWithServer, route.engine)
      addOrUpdateArtImages([image])

      state.generatedArtImages = mergeUniqueArtImages(
        state.generatedArtImages,
        [image],
      )

      state.currentArtImage = image
      state.lastGeneratedArtImage = image

      await addGeneratedArtImageToCollections(
        image,
        dataWithServer.userId || 10,
        dataWithServer.artCollectionId,
      )

      setGenerationMessage('success', 'Image created and added to collections.')

      return {
        success: true,
        data: image,
        message: 'Image created and added to collections.',
      }
    } catch (error) {
      handleError(error, 'generating image')
      setError(error, 'Failed to generate image.')

      const message = error instanceof Error ? error.message : 'Unknown error'

      setGenerationMessage('error', message)

      return {
        success: false,
        message,
      }
    } finally {
      state.loading = false
      state.isGenerating = false
      animationStore.stop()
    }
  }

  function resetInitialization(): void {
    state.isInitialized = false
    initializePromise.value = null
  }

  return {
    ...toRefs(state),

    hoverArtImage,
    initializing,
    initializePromise,
    artImageRequestMap,
    fetchAllArtImagesPromise,

    hasCachedImages,
    currentImagePath,
    generatedArtImageCount,
    imageById,
    getPromptString,
    getNegativePromptString,
    publicArtImages,
    matureArtImages,
    safeArtImages,
    unlinkedArtImages,
    artListPresets,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,

    fetchAllArtImages,
    loadArtImagesInChunks,

    selectArtImage,
    selectArtImageRecord,
    deselectArtImage,
    setHoverArtImage,

    setArtForm,
    resetArtForm,
    updateArtListSelection,
    clearArtListSelections,
    getArtListAddonPrompt,

    generateArt,
    generateImageFromBrowserServer,

    uploadImage,
    deleteArtImage,
    addOrUpdateArtImages,
    setArtImageList,

    getArtImagesByIds,
    getArtImageById,
    getCachedArtImageById,
    getOrFetchArtImageById,

    addArtImageToCollection,
    removeArtImageFromCollection,
    fetchArtImageForDisplay,
    fetchArtImageThumbnail,
    updateArtImageConnections,
    updateArtImage,
    createArtImage,
    updateArtImagePitches,
    fetchArtImageWithPitches,

    showMature,
    generationServers,
    generationCollections,
    activeGenerationServer,
    selectedCheckpointName,
    selectedSamplerName,
    finalPromptString,
    canGenerateArt,

    setGenerationMessage,
    clearGenerationMessage,
    selectGenerationServer,
    selectGenerationCheckpoint,
    selectGenerationSampler,
    selectGenerationCollection,
    prepareArtGenerator,
    generateCurrentArt,
  }
})

export type { ArtImage, ArtCollection }

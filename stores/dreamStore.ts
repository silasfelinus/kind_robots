// /stores/dreamStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { usePromptStore } from '@/stores/promptStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import {
  DREAM_TYPES,
  buildBrainstormPrompt,
  buildDreamPayload,
  buildTitleStormPrompt,
  extractExamples,
  filterDreamsByType,
  filterPublicDreams,
  filterVisibleDreams,
  groupDreamsByTitle,
  joinExamples,
  legacyPitchToDreamPayload,
  normalizeBrainstormResponse,
  normalizeDreamType,
  parseDreamType,
  randomEntry as helperRandomEntry,
  sortDreamsByNewest,
  type DreamType,
} from '@/stores/helpers/dreamHelper'
import type {
  ArtCollection,
  ArtImage,
  Bot,
  Character,
  Chat,
  Dream,
  ExpressionMedia,
  Prompt,
  Reaction,
  Reward,
  Scenario,
  User,
} from '~/prisma/generated/prisma/client'

export interface DreamForm extends Partial<Dream> {
  scenarioId?: number | null
  createCollection?: boolean
  tagIds?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  addArtToCollection?: boolean
  updateNote?: string | null
  promptIds?: number[]
}

export interface DreamChatForm extends Partial<Chat> {
  dreamId?: number | null
  updateDream?: boolean
  artId?: number | null
  addArtToCollection?: boolean
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  updateNote?: string | null
}

export interface DreamNarratorEmotionImage extends ExpressionMedia {
  ArtImage?: Partial<ArtImage> | null
}

export interface DreamNarratorBot extends Partial<Bot> {
  id: number
  name: string
  EmotionImages?: DreamNarratorEmotionImage[]
}

export interface DreamWithRelations extends Dream {
  User?: Pick<User, 'id' | 'username' | 'avatarImage'> | null
  ArtImage?: Partial<ArtImage> | null
  ArtImages?: Partial<ArtImage>[]
  ArtCollection?: (ArtCollection & { ArtImages?: ArtImage[] }) | null
  ArtCollections?: (ArtCollection & { ArtImages?: ArtImage[] })[]
  Scenario?: Scenario | null
  Scenarios?: Scenario[]
  Characters?: Character[]
  Rewards?: Reward[]
  Chats?: DreamChatWithRelations[]
  Bots?: DreamNarratorBot[]
  Reactions?: Reaction[]
  _count?: {
    Chats?: number
    Reactions?: number
    Characters?: number
    Rewards?: number
    ArtImages?: number
    ArtCollections?: number
    Scenarios?: number
  }
}

export interface DreamChatWithRelations extends Chat {
  User?: Pick<User, 'id' | 'username' | 'avatarImage'> | null
  Character?: Partial<Character> | null
  Prompt?: Partial<Prompt> | null
  ArtImage?: Partial<ArtImage> | null
  Reactions?: Reaction[]
}

export interface FetchDreamOptions {
  userOnly?: boolean
  showInactive?: boolean
  includeMature?: boolean
  artCollectionId?: number
  galleryId?: number
  scenarioId?: number
  dreamType?: DreamType | string
  projectStatus?: 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' | 'BRAINSTORM'
  tagId?: number
  characterId?: number
  rewardId?: number
  search?: string
  limit?: number
}

export interface FetchDreamChatOptions {
  dreamId?: number | null
  limit?: number
  beforeId?: number
  afterId?: number
  characterId?: number
  botId?: number
  type?: string
  includeMature?: boolean
}

export type DreamResult<T> = {
  success: boolean
  data?: T
  message?: string
  mana?: unknown
}

type DreamInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  createBlankForm?: boolean
}

type LegacyPitchRecord = Record<string, unknown> & {
  id?: number
  title?: string | null
  pitch?: string | null
  PitchType?: string | null
}

const isClient = typeof window !== 'undefined'

const storageKeys = {
  dreams: 'dreams',
  dreamForm: 'dreamForm',
  selectedDreams: 'selectedDreams',
  selectedDreamType: 'selectedDreamType',
  selectedDream: 'selectedDream',
  selectedTitle: 'selectedDreamTitle',
  dreamChats: 'dreamChats',
  galleryArt: 'dreamGalleryArt',
  newestDreams: 'newestDreams',
  numberOfRequests: 'dreamNumberOfRequests',
  temperature: 'dreamTemperature',
  exampleString: 'dreamExampleString',
  apiResponse: 'dreamApiResponse',
  maxTokens: 'dreamMaxTokens',
}

const legacyPitchStorageKeys = {
  pitches: 'pitches',
  pitchForm: 'pitchForm',
  selectedPitches: 'selectedPitches',
  selectedPitchType: 'selectedPitchType',
  selectedPitch: 'selectedPitch',
  selectedTitle: 'selectedTitle',
  galleryArt: 'galleryArt',
  newestPitches: 'newestPitches',
  numberOfRequests: 'numberOfRequests',
  temperature: 'temperature',
  exampleString: 'exampleString',
  apiResponse: 'apiResponse',
  maxTokens: 'maxTokens',
}

export const dreamSeeds = [
  'A luminous greenhouse where brass robots tend glowing plants under drifting paper lanterns.',
  'A floating market of lanterns, moonlit foxes, and tiny philosophers arguing beside warm tea.',
  'A cozy glasshouse suspended in twilight, full of secret doors, soft rain, and impossible flowers.',
  'A botanical dreamhouse where every vine remembers a story and every doorway leads somewhere suspiciously charming.',
  'A safe glowing sanctuary that feels like a hub, a starter town, and a tiny miracle with paperwork.',
]

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

function safeRemoveLocalStorage(key: string): void {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function safeParseNumber(raw: string | null, fallback: number): number {
  if (!raw) return fallback

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeId(value: unknown): number | undefined {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

function normalizeIds(values: unknown): number[] {
  if (!Array.isArray(values)) return []

  return Array.from(
    new Set(values.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
  )
}

function buildQuery(options: Record<string, unknown>) {
  const query = new URLSearchParams()

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })

  return query.toString()
}

function randomSeedDream(): string {
  const randomIndex = Math.floor(Math.random() * dreamSeeds.length)
  return (
    dreamSeeds[randomIndex] ??
    'A shared Dream begins in a room full of impossible light.'
  )
}

function fallbackDreamTitle(seed?: string | null) {
  const source = seed?.trim()
  if (!source) return `Dream-${Date.now()}`
  return source.length > 80 ? `${source.slice(0, 77)}...` : source
}

function normalizeDream<T extends DreamWithRelations | Dream>(dream: T): T {
  return normalizeDreamType(dream) as T
}

function normalizeDreamForm(input: Partial<DreamForm>): DreamForm {
  return {
    ...input,
    dreamType: parseDreamType(input.dreamType as unknown as string),
  } as DreamForm
}

function defaultDreamForm(
  userId?: number | null,
  username?: string,
): DreamForm {
  return {
    title: '',
    slug: null,
    dreamType: 'PITCH',
    pitch: '',
    description: '',
    flavorText: '',
    examples: '',
    artPrompt: '',
    imagePath: null,
    highlightImage: null,
    icon: 'kind-icon:dream',
    designer: username || 'Kind Designer',
    creationSource: 'HUMAN',
    userId: userId || 10,
    isPublic: true,
    isMature: false,
    isActive: true,
    artImageId: null,
    artCollectionId: null,
    scenarioId: null,
    characterIds: [],
    rewardIds: [],
    tagIds: [],
    promptIds: [],
    createCollection: true,
    addArtToCollection: true,
  } as DreamForm
}

function legacyPitchRecordToDreamInput(
  record: LegacyPitchRecord,
): Partial<Dream> {
  return {
    ...record,
    title: typeof record.title === 'string' ? record.title : undefined,
    pitch: typeof record.pitch === 'string' ? record.pitch : undefined,
  } as Partial<Dream>
}

function toLegacyDream(record: LegacyPitchRecord): DreamWithRelations | null {
  const id = normalizeId(record.id)
  const payload = legacyPitchToDreamPayload(
    legacyPitchRecordToDreamInput(record),
  )
  const title = payload.title || payload.pitch

  if (!id || !title) return null

  return {
    ...record,
    ...payload,
    id,
    title,
    createdAt: (record.createdAt as Date) ?? new Date(),
    updatedAt: (record.updatedAt as Date) ?? new Date(),
  } as DreamWithRelations
}

export const useDreamStore = defineStore('dreamStore', () => {
  const userStore = useUserStore()
  const errorStore = useErrorStore()

  const dreams = ref<DreamWithRelations[]>([])
  const dreamForm = ref<DreamForm>({})
  const selectedDreams = ref<DreamWithRelations[]>([])
  const selectedDreamType = ref<DreamType | null>(null)
  const selectedDream = ref<DreamWithRelations | null>(null)
  const selectedTitle = ref<DreamWithRelations | null>(null)
  const newestDreams = ref<DreamWithRelations[]>([])
  const galleryArt = ref<Record<number, ArtImage[]>>({})
  const dreamChats = ref<DreamChatWithRelations[]>([])
  const chatForm = ref<DreamChatForm>({})

  const loading = ref(false)
  const chatsLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isGeneratingFields = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<DreamWithRelations[]> | null>(null)
  const fetchArtForDreamPromises = ref<Record<number, Promise<ArtImage[]>>>({})
  const createDreamPromise = ref<Promise<
    DreamResult<DreamWithRelations>
  > | null>(null)
  const updateDreamPromise = ref<
    Record<number, Promise<DreamResult<DreamWithRelations>>>
  >({})

  const numberOfRequests = ref(10)
  const temperature = ref(0.9)
  const exampleString = ref(' ')
  const apiResponse = ref('')
  const maxTokens = ref(500)

  const dreamTypes = DREAM_TYPES

  const currentUserId = computed(
    () => userStore.user?.id ?? userStore.userId ?? 10,
  )
  const selectedDreamId = computed(() => selectedDream.value?.id ?? null)
  const selectedDreamChats = computed(() => dreamChats.value)

  const activeDreams = computed(() =>
    dreams.value.filter((dream) => dream.isActive),
  )
  const ownedDreams = computed(() =>
    dreams.value.filter((dream) => dream.userId === currentUserId.value),
  )

  const publicDreams = computed(() =>
    filterPublicDreams(dreams.value, currentUserId.value, userStore.isAdmin),
  )

  const visibleDreams = computed(() =>
    filterVisibleDreams(
      dreams.value,
      currentUserId.value,
      userStore.showMature,
      userStore.isAdmin,
    ),
  )

  const artDreams = computed(() => filterDreamsByType('ART', dreams.value))
  const pitchDreams = computed(() => filterDreamsByType('PITCH', dreams.value))
  const brainstormDreams = computed(() =>
    filterDreamsByType('BRAINSTORM', dreams.value),
  )
  const projectDreams = computed(() =>
    filterDreamsByType('PROJECT', dreams.value),
  )
  const publicProjectDreams = computed(() =>
    filterPublicDreams(
      projectDreams.value,
      currentUserId.value,
      userStore.isAdmin,
    ),
  )

  const dreamsByTitle = computed(() => groupDreamsByTitle(dreams.value))

  const selectedTitleDreams = computed(() => {
    const title = selectedTitle.value?.title
    if (!title) return []
    return dreams.value.filter((dream) => dream.title === title)
  })

  const selectedDreamCast = computed(
    () => selectedDream.value?.Characters ?? [],
  )
  const selectedDreamItems = computed(() => selectedDream.value?.Rewards ?? [])

  const selectedDreamCollectionArt = computed(() => {
    const attachedArt = selectedDream.value?.ArtImages ?? []
    const primaryCollectionArt =
      selectedDream.value?.ArtCollection?.ArtImages ?? []
    const extraCollectionArt =
      selectedDream.value?.ArtCollections?.flatMap(
        (collection) => collection.ArtImages ?? [],
      ) ?? []

    return [...attachedArt, ...primaryCollectionArt, ...extraCollectionArt]
  })

  const selectedDreamCurrentImage = computed(() => {
    return (
      selectedDream.value?.ArtImage?.imagePath ??
      selectedDream.value?.ArtImage?.path ??
      selectedDream.value?.ArtImage?.fileName ??
      selectedDream.value?.highlightImage ??
      selectedDream.value?.imagePath ??
      ''
    )
  })

  const selectedDreamSummary = computed(() => {
    const dream = selectedDream.value
    if (!dream) return 'Choose a Dream seed to begin.'

    const castCount = dream._count?.Characters ?? dream.Characters?.length ?? 0
    const itemCount = dream._count?.Rewards ?? dream.Rewards?.length ?? 0
    const chatCount = dream._count?.Chats ?? dream.Chats?.length ?? 0
    const seed = dream.pitch || dream.description || 'No seed text yet.'

    return `${dream.title} is a ${parseDreamType(dream.dreamType).toLowerCase()} dream with ${castCount} cast member${castCount === 1 ? '' : 's'}, ${itemCount} item${itemCount === 1 ? '' : 's'}, and ${chatCount} note${chatCount === 1 ? '' : 's'}. ${seed}`
  })

  const newestDreamsDisplay = computed(() =>
    newestDreams.value.map((dream) => ({ ...dream, isNewest: true })),
  )
  const latestDreamChat = computed(() => dreamChats.value.at(-1) ?? null)
  const hasSelectedDream = computed(() => Boolean(selectedDream.value?.id))

  const hasUnsavedChanges = computed(() => {
    return (
      JSON.stringify(selectedDream.value ?? {}) !==
      JSON.stringify(dreamForm.value ?? {})
    )
  })

  function setError(message = '') {
    error.value = message
    lastError.value = message || null
  }

  function setLastError(caught: unknown, fallback: string): void {
    const message = caught instanceof Error ? caught.message : fallback
    error.value = message
    lastError.value = message
  }

  function clearError(): void {
    error.value = ''
    lastError.value = null
  }

  function reportError(
    caught: unknown,
    context: string,
    fallback = 'An error occurred.',
    type: ErrorType = ErrorType.STORE_ERROR,
  ) {
    const message = errorStore.report(caught, type, context, fallback)
    error.value = message
    lastError.value = message
    return message
  }

  function randomDream() {
    return randomSeedDream()
  }

  function randomDreamSeed() {
    return randomSeedDream()
  }

  function saveStateToLocalStorage() {
    safeSetLocalStorage(storageKeys.dreams, JSON.stringify(dreams.value))
    safeSetLocalStorage(storageKeys.dreamForm, JSON.stringify(dreamForm.value))
    safeSetLocalStorage(
      storageKeys.selectedDreams,
      JSON.stringify(selectedDreams.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedDreamType,
      JSON.stringify(selectedDreamType.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedDream,
      JSON.stringify(selectedDream.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedTitle,
      JSON.stringify(selectedTitle.value),
    )
    safeSetLocalStorage(
      storageKeys.dreamChats,
      JSON.stringify(dreamChats.value),
    )
    safeSetLocalStorage(
      storageKeys.galleryArt,
      JSON.stringify(galleryArt.value),
    )
    safeSetLocalStorage(
      storageKeys.newestDreams,
      JSON.stringify(newestDreams.value),
    )
    safeSetLocalStorage(
      storageKeys.numberOfRequests,
      String(numberOfRequests.value),
    )
    safeSetLocalStorage(storageKeys.temperature, String(temperature.value))
    safeSetLocalStorage(storageKeys.exampleString, exampleString.value)
    safeSetLocalStorage(storageKeys.apiResponse, apiResponse.value)
    safeSetLocalStorage(storageKeys.maxTokens, String(maxTokens.value))
  }

  function syncToLocalStorage() {
    saveStateToLocalStorage()
  }

  function hydrateFromLegacyPitchStorage() {
    const legacyPitches = safeParseArray<LegacyPitchRecord>(
      safeGetLocalStorage(legacyPitchStorageKeys.pitches),
    )
      .map(toLegacyDream)
      .filter(Boolean) as DreamWithRelations[]

    if (!dreams.value.length && legacyPitches.length) {
      dreams.value = legacyPitches.map(normalizeDream).sort(sortDreamsByNewest)
    }

    if (Object.keys(dreamForm.value).length === 0) {
      const legacyForm = safeParseObject<LegacyPitchRecord | null>(
        safeGetLocalStorage(legacyPitchStorageKeys.pitchForm),
        null,
      )

      if (legacyForm) {
        dreamForm.value = normalizeDreamForm(
          legacyPitchToDreamPayload(
            legacyPitchRecordToDreamInput(legacyForm),
          ) as DreamForm,
        )
      }
    }

    const legacySelected = safeParseObject<LegacyPitchRecord | null>(
      safeGetLocalStorage(legacyPitchStorageKeys.selectedPitch),
      null,
    )

    if (!selectedDream.value && legacySelected) {
      selectedDream.value = toLegacyDream(legacySelected)
    }

    const legacyTitle = safeParseObject<LegacyPitchRecord | null>(
      safeGetLocalStorage(legacyPitchStorageKeys.selectedTitle),
      null,
    )

    if (!selectedTitle.value && legacyTitle) {
      selectedTitle.value = toLegacyDream(legacyTitle)
    }

    const legacyType = safeGetLocalStorage(
      legacyPitchStorageKeys.selectedPitchType,
    )
    if (!selectedDreamType.value && legacyType && legacyType !== 'null') {
      selectedDreamType.value = parseDreamType(JSON.parse(legacyType) as string)
    }

    if (!Object.keys(galleryArt.value).length) {
      galleryArt.value = safeParseObject<Record<number, ArtImage[]>>(
        safeGetLocalStorage(legacyPitchStorageKeys.galleryArt),
        {},
      )
    }

    if (!newestDreams.value.length) {
      newestDreams.value = safeParseArray<LegacyPitchRecord>(
        safeGetLocalStorage(legacyPitchStorageKeys.newestPitches),
      )
        .map(toLegacyDream)
        .filter(Boolean) as DreamWithRelations[]
    }

    numberOfRequests.value = safeParseNumber(
      safeGetLocalStorage(legacyPitchStorageKeys.numberOfRequests),
      numberOfRequests.value,
    )
    temperature.value = safeParseNumber(
      safeGetLocalStorage(legacyPitchStorageKeys.temperature),
      temperature.value,
    )
    exampleString.value =
      safeGetLocalStorage(legacyPitchStorageKeys.exampleString) ??
      exampleString.value
    apiResponse.value =
      safeGetLocalStorage(legacyPitchStorageKeys.apiResponse) ??
      apiResponse.value
    maxTokens.value = safeParseNumber(
      safeGetLocalStorage(legacyPitchStorageKeys.maxTokens),
      maxTokens.value,
    )
  }

  function hydrateFromLocalStorage() {
    dreams.value = safeParseArray<DreamWithRelations>(
      safeGetLocalStorage(storageKeys.dreams),
    )
      .map(normalizeDream)
      .sort(sortDreamsByNewest)

    dreamForm.value = normalizeDreamForm(
      safeParseObject<DreamForm>(
        safeGetLocalStorage(storageKeys.dreamForm),
        {},
      ),
    )

    selectedDreams.value = safeParseArray<DreamWithRelations>(
      safeGetLocalStorage(storageKeys.selectedDreams),
    ).map(normalizeDream)

    const storedType = safeGetLocalStorage(storageKeys.selectedDreamType)
    selectedDreamType.value =
      storedType && storedType !== 'null'
        ? parseDreamType(JSON.parse(storedType) as string)
        : null

    selectedDream.value = safeParseObject<DreamWithRelations | null>(
      safeGetLocalStorage(storageKeys.selectedDream),
      null,
    )

    if (selectedDream.value)
      selectedDream.value = normalizeDream(selectedDream.value)

    selectedTitle.value = safeParseObject<DreamWithRelations | null>(
      safeGetLocalStorage(storageKeys.selectedTitle),
      null,
    )

    if (selectedTitle.value)
      selectedTitle.value = normalizeDream(selectedTitle.value)

    dreamChats.value = safeParseArray<DreamChatWithRelations>(
      safeGetLocalStorage(storageKeys.dreamChats),
    )
    galleryArt.value = safeParseObject<Record<number, ArtImage[]>>(
      safeGetLocalStorage(storageKeys.galleryArt),
      {},
    )
    newestDreams.value = safeParseArray<DreamWithRelations>(
      safeGetLocalStorage(storageKeys.newestDreams),
    ).map(normalizeDream)
    numberOfRequests.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.numberOfRequests),
      10,
    )
    temperature.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.temperature),
      0.9,
    )
    exampleString.value =
      safeGetLocalStorage(storageKeys.exampleString) ?? exampleString.value
    apiResponse.value =
      safeGetLocalStorage(storageKeys.apiResponse) ?? apiResponse.value
    maxTokens.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.maxTokens),
      500,
    )

    hydrateFromLegacyPitchStorage()
  }

  function loadFromLocalStorage() {
    try {
      hydrateFromLocalStorage()
    } catch (storageError) {
      reportError(
        storageError,
        'loading dream store from localStorage',
        'Failed to load Dream data from local storage.',
        ErrorType.PARSE_ERROR,
      )
    }
  }

  function toDreamForm(dream: DreamWithRelations): DreamForm {
    return normalizeDreamForm({
      id: dream.id,
      title: dream.title,
      slug: dream.slug ?? null,
      dreamType: parseDreamType(dream.dreamType as unknown as string),
      pitch: dream.pitch ?? null,
      description: dream.description ?? null,
      flavorText: dream.flavorText ?? null,
      examples: dream.examples ?? null,
      artPrompt: dream.artPrompt ?? null,
      imagePath: dream.imagePath ?? null,
      highlightImage: dream.highlightImage ?? null,
      icon: dream.icon ?? 'kind-icon:dream',
      designer: dream.designer ?? userStore.username ?? 'Kind Designer',
      creationSource: dream.creationSource ?? 'HUMAN',
      userId: dream.userId,
      artImageId: dream.artImageId ?? null,
      artCollectionId: dream.artCollectionId ?? null,
      isPublic: dream.isPublic,
      isMature: dream.isMature,
      isActive: dream.isActive,
      createCollection: false,
      characterIds: dream.Characters?.map((character) => character.id) ?? [],
      rewardIds: dream.Rewards?.map((reward) => reward.id) ?? [],
      scenarioId: dream.Scenarios?.[0]?.id ?? dream.Scenario?.id ?? null,
    })
  }

  function createDefaultDreamForm(overrides: DreamForm = {}): DreamForm {
    return normalizeDreamForm({
      ...defaultDreamForm(currentUserId.value, userStore.username),
      ...overrides,
      userId: overrides.userId ?? currentUserId.value,
      dreamType: parseDreamType(overrides.dreamType as unknown as string),
      title: overrides.title ?? '',
      pitch: overrides.pitch ?? randomSeedDream(),
      characterIds: normalizeIds(overrides.characterIds),
      rewardIds: normalizeIds(overrides.rewardIds),
      tagIds: normalizeIds(overrides.tagIds),
      promptIds: normalizeIds(overrides.promptIds),
    })
  }

  function upsertDream(dream: DreamWithRelations) {
    const normalized = normalizeDream(dream)
    const index = dreams.value.findIndex((entry) => entry.id === normalized.id)

    if (index >= 0) dreams.value.splice(index, 1, normalized)
    else dreams.value.push(normalized)

    dreams.value.sort(sortDreamsByNewest)

    if (selectedDream.value?.id === normalized.id) {
      selectedDream.value = normalized
      dreamForm.value = toDreamForm(normalized)
      dreamChats.value = normalized.Chats ?? dreamChats.value
    }

    if (selectedTitle.value?.id === normalized.id)
      selectedTitle.value = normalized

    selectedDreams.value = selectedDreams.value.map((entry) =>
      entry.id === normalized.id ? normalized : entry,
    )
    newestDreams.value = newestDreams.value.map((entry) =>
      entry.id === normalized.id ? normalized : entry,
    )
    saveStateToLocalStorage()

    return normalized
  }

  function removeDreamFromState(id: number) {
    dreams.value = dreams.value.filter((dream) => dream.id !== id)
    selectedDreams.value = selectedDreams.value.filter(
      (dream) => dream.id !== id,
    )
    newestDreams.value = newestDreams.value.filter((dream) => dream.id !== id)
    delete galleryArt.value[id]

    if (selectedDream.value?.id === id) {
      selectedDream.value = null
      dreamForm.value = {}
      dreamChats.value = []
      chatForm.value = {}
    }

    if (selectedTitle.value?.id === id) selectedTitle.value = null
    saveStateToLocalStorage()
  }

  async function initialize(
    options: DreamInitializeOptions | boolean = {},
  ): Promise<void> {
    const normalizedOptions =
      typeof options === 'boolean' ? { force: options } : options
    const force = Boolean(normalizedOptions.force)
    const fetchRemote = normalizedOptions.fetchRemote ?? true

    if (!isClient && !fetchRemote) return
    if (isInitialized.value && !force) return
    if (initializePromise.value && !force) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        loading.value = true
        clearError()
        loadFromLocalStorage()

        if (fetchRemote) await fetchDreams({ showInactive: false })

        if (
          normalizedOptions.createBlankForm !== false &&
          Object.keys(dreamForm.value).length === 0
        ) {
          createBlankDreamForm()
        }

        if (selectedDream.value?.id) {
          const refreshed = await fetchDreamById(selectedDream.value.id, true)
          if (refreshed) selectedDream.value = refreshed
        }

        isInitialized.value = true
        saveStateToLocalStorage()
      } catch (initializeError) {
        isInitialized.value = false
        reportError(
          initializeError,
          'initializing dream store',
          'Failed to initialize dream store.',
          ErrorType.STORE_ERROR,
        )
      } finally {
        isInitializing.value = false
        loading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchDreams(
    options: FetchDreamOptions = {},
  ): Promise<DreamWithRelations[]> {
    if (
      !Object.keys(options).length &&
      hasLoaded.value &&
      dreams.value.length &&
      fetchPromise.value
    ) {
      return fetchPromise.value
    }

    const request = (async () => {
      loading.value = true
      clearError()

      try {
        const query = buildQuery({
          mine: options.userOnly ? 'true' : undefined,
          includeInactive: options.showInactive ? 'true' : undefined,
          includeMature: options.includeMature ? 'true' : undefined,
          artCollectionId: options.artCollectionId,
          galleryId: options.galleryId,
          scenarioId: options.scenarioId,
          dreamType: options.dreamType
            ? parseDreamType(options.dreamType)
            : undefined,
          projectStatus: options.projectStatus,
          tagId: options.tagId,
          characterId: options.characterId,
          rewardId: options.rewardId,
          search: options.search,
          take: options.limit,
        })

        const url = query ? `/api/dreams?${query}` : '/api/dreams'
        const res = await performFetch<DreamWithRelations[]>(url)

        if (!res.success || !res.data)
          throw new Error(res.message || 'Failed to fetch dreams.')

        dreams.value = res.data.map(normalizeDream).sort(sortDreamsByNewest)
        hasLoaded.value = true
        saveStateToLocalStorage()

        return dreams.value
      } catch (fetchError) {
        hasLoaded.value = false
        reportError(
          fetchError,
          'fetching dreams',
          'Failed to fetch dreams.',
          ErrorType.NETWORK_ERROR,
        )
        return dreams.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    if (!Object.keys(options).length) fetchPromise.value = request
    return request
  }

  async function fetchOwnedDreams() {
    return await fetchDreams({ userOnly: true })
  }

  async function fetchDreamById(
    id: number,
    selectAfterFetch = false,
  ): Promise<DreamWithRelations | null> {
    const dreamId = normalizeId(id)

    if (!dreamId) {
      setError('Invalid dream ID.')
      return null
    }

    loading.value = true
    clearError()

    try {
      const query = userStore.showMature ? '?includeMature=true' : ''
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}${query}`,
      )

      if (!res.success || !res.data)
        throw new Error(res.message || `Failed to fetch dream ${dreamId}.`)

      const normalized = upsertDream(res.data)

      if (selectAfterFetch) {
        selectedDream.value = normalized
        selectedDreams.value = [normalized]
        dreamForm.value = toDreamForm(normalized)
        dreamChats.value = normalized.Chats ?? []
      }

      saveStateToLocalStorage()
      return normalized
    } catch (fetchError) {
      reportError(
        fetchError,
        'fetching dream by ID',
        `Failed to fetch dream ${dreamId}.`,
        ErrorType.NETWORK_ERROR,
      )
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchArtForDream(dreamId: number): Promise<ArtImage[]> {
    const id = normalizeId(dreamId)
    if (!id) return []
    if (galleryArt.value[id]) return galleryArt.value[id]
    if (fetchArtForDreamPromises.value[id])
      return fetchArtForDreamPromises.value[id]

    fetchArtForDreamPromises.value[id] = (async () => {
      try {
        clearError()
        const res = await performFetch<ArtImage[]>(`/api/dreams/art/${id}`)

        if (!res.success)
          throw new Error(res.message || 'Failed to fetch art for dream.')

        galleryArt.value[id] = res.data || []
        saveStateToLocalStorage()
        return galleryArt.value[id]
      } catch (artError) {
        reportError(
          artError,
          'fetching art for dream',
          'Failed to fetch art for dream.',
          ErrorType.NETWORK_ERROR,
        )
        return []
      } finally {
        delete fetchArtForDreamPromises.value[id]
      }
    })()

    return fetchArtForDreamPromises.value[id]
  }

  function buildMutationBody(
    payload: DreamForm,
    existingDream: DreamWithRelations | null = null,
  ): DreamForm {
    const source = normalizeDreamForm({
      ...(existingDream ? toDreamForm(existingDream) : {}),
      ...payload,
    })

    const built = buildDreamPayload({
      ...source,
      userId: source.userId ?? currentUserId.value,
      designer: source.designer || userStore.username || 'Kind Designer',
    }) as DreamForm

    return normalizeDreamForm({
      ...source,
      ...built,
      title: built.title || source.title || fallbackDreamTitle(built.pitch),
      pitch: built.pitch || source.pitch || source.description || built.title,
      artImageId: source.artImageId ?? null,
      artCollectionId: source.artCollectionId ?? null,
      tagIds: normalizeIds(source.tagIds),
      characterIds: normalizeIds(source.characterIds),
      rewardIds: normalizeIds(source.rewardIds),
      createCollection: source.createCollection ?? !existingDream,
      addArtToCollection: source.addArtToCollection ?? !existingDream,
    })
  }

  async function createDream(
    payload: DreamForm,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (createDreamPromise.value) return createDreamPromise.value

    createDreamPromise.value = (async () => {
      isSaving.value = true
      clearError()

      try {
        const body = buildMutationBody(payload)
        const res = await performFetch<DreamWithRelations>('/api/dreams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.success || !res.data)
          throw new Error(res.message || 'Failed to create dream.')

        const created = upsertDream(res.data)
        selectedDream.value = created
        selectedDreams.value = [created]
        dreamForm.value = toDreamForm(created)
        dreamChats.value = created.Chats ?? []
        newestDreams.value = [created]
        saveStateToLocalStorage()

        return {
          success: true,
          data: created,
          message: `Dream #${created.id} created.`,
        }
      } catch (createError) {
        const message = reportError(
          createError,
          'creating dream',
          'Failed to create dream.',
          ErrorType.STORE_ERROR,
        )
        return { success: false, message }
      } finally {
        isSaving.value = false
        createDreamPromise.value = null
      }
    })()

    return createDreamPromise.value
  }

  async function updateDream(
    id: number,
    updates: DreamForm,
  ): Promise<DreamResult<DreamWithRelations>> {
    const dreamId = normalizeId(id)

    if (!dreamId) {
      const message = 'Invalid dream ID.'
      setError(message)
      return { success: false, message }
    }

    if (updateDreamPromise.value[dreamId])
      return updateDreamPromise.value[dreamId]

    updateDreamPromise.value[dreamId] = (async () => {
      isSaving.value = true
      clearError()

      try {
        const existingDream =
          selectedDream.value?.id === dreamId
            ? selectedDream.value
            : (dreams.value.find((dream) => dream.id === dreamId) ?? null)
        const body = buildMutationBody(updates, existingDream)
        const res = await performFetch<DreamWithRelations>(
          `/api/dreams/${dreamId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        )

        if (!res.success || !res.data)
          throw new Error(res.message || `Failed to update dream ${dreamId}.`)

        const updated = upsertDream(res.data)
        selectedDream.value = updated
        selectedDreams.value = [updated]
        dreamForm.value = toDreamForm(updated)
        saveStateToLocalStorage()

        return {
          success: true,
          data: updated,
          message: `Dream #${dreamId} updated.`,
        }
      } catch (updateError) {
        const message = reportError(
          updateError,
          'updating dream',
          `Failed to update dream ${dreamId}.`,
          ErrorType.STORE_ERROR,
        )
        return { success: false, message }
      } finally {
        isSaving.value = false
        delete updateDreamPromise.value[dreamId]
      }
    })()

    return updateDreamPromise.value[dreamId]
  }

  async function saveDream(): Promise<DreamResult<DreamWithRelations>> {
    if (!dreamForm.value) {
      const message = 'No dream form loaded.'
      setError(message)
      return { success: false, message }
    }

    if (typeof dreamForm.value.id === 'number')
      return await updateDream(dreamForm.value.id, dreamForm.value)
    return await createDream(dreamForm.value)
  }

  async function updateSelectedDream(
    updates: DreamForm,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, updates)
  }

  async function deleteDream(
    id: number,
    hardDelete = false,
  ): Promise<DreamResult<DreamWithRelations | undefined>> {
    const dreamId = normalizeId(id)

    if (!dreamId) {
      const message = 'Invalid dream ID.'
      setError(message)
      return { success: false, message }
    }

    isDeleting.value = true
    clearError()

    try {
      const query = hardDelete ? '?hard=true' : ''
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}${query}`,
        {
          method: 'DELETE',
        },
      )

      if (!res.success)
        throw new Error(res.message || `Failed to delete dream ${dreamId}.`)

      if (hardDelete) removeDreamFromState(dreamId)
      else if (res.data) upsertDream(res.data)

      return {
        success: true,
        data: res.data,
        message: hardDelete
          ? `Dream #${dreamId} deleted.`
          : `Dream #${dreamId} archived.`,
      }
    } catch (deleteError) {
      const message = reportError(
        deleteError,
        'deleting dream',
        `Failed to delete dream ${dreamId}.`,
        ErrorType.STORE_ERROR,
      )
      return { success: false, message }
    } finally {
      isDeleting.value = false
    }
  }

  async function deleteDreamById(dreamId: number) {
    return await deleteDream(dreamId)
  }

  async function fetchDreamChats(
    options: FetchDreamChatOptions | number = {},
  ): Promise<DreamChatWithRelations[]> {
    const normalizedOptions =
      typeof options === 'number' ? { dreamId: options } : options
    const dreamId = normalizeId(
      normalizedOptions.dreamId ?? selectedDreamId.value,
    )

    if (!dreamId) {
      setError('No dream selected.')
      return []
    }

    chatsLoading.value = true
    clearError()

    try {
      const query = buildQuery({
        dreamId,
        limit: normalizedOptions.limit ?? 100,
        beforeId: normalizedOptions.beforeId,
        afterId: normalizedOptions.afterId,
        characterId: normalizedOptions.characterId,
        botId: normalizedOptions.botId,
        type: normalizedOptions.type,
        includeMature:
          normalizedOptions.includeMature || userStore.showMature
            ? 'true'
            : undefined,
      })

      const res = await performFetch<DreamChatWithRelations[]>(
        `/api/chats?${query}`,
      )

      if (!res.success || !res.data)
        throw new Error(
          res.message || `Failed to fetch chats for dream ${dreamId}.`,
        )

      dreamChats.value = res.data
      saveStateToLocalStorage()
      return res.data
    } catch (fetchError) {
      reportError(
        fetchError,
        'fetching dream chats',
        `Failed to fetch chats for dream ${dreamId}.`,
        ErrorType.NETWORK_ERROR,
      )
      return []
    } finally {
      chatsLoading.value = false
    }
  }

  async function addDreamChat(
    dreamId: number,
    payload: DreamChatForm,
  ): Promise<DreamResult<DreamChatWithRelations>> {
    const normalizedDreamId = normalizeId(dreamId)

    if (!normalizedDreamId) {
      const message = 'Invalid dream ID.'
      setError(message)
      return { success: false, message }
    }

    isSaving.value = true
    clearError()

    try {
      const body: DreamChatForm = {
        ...payload,
        dreamId: normalizedDreamId,
        userId: payload.userId ?? currentUserId.value,
        type: payload.type ?? 'Dream',
        sender: payload.sender || userStore.username || 'Dreamer',
        channel: payload.channel || `dream-${normalizedDreamId}`,
        content: payload.content?.trim(),
      }

      if (!body.content) throw new Error('Dream chat content is required.')

      const res = await performFetch<DreamChatWithRelations>('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to create dream chat.')

      dreamChats.value.push(res.data)

      if (payload.updateDream) {
        const dreamUpdates: DreamForm = {
          description: payload.description ?? undefined,
          pitch: payload.pitch ?? undefined,
          flavorText: payload.flavorText ?? undefined,
          examples: payload.examples ?? undefined,
          artPrompt: payload.artPrompt ?? undefined,
          imagePath: payload.imagePath ?? undefined,
          highlightImage: payload.highlightImage ?? undefined,
          artImageId: payload.artImageId ?? undefined,
          updateNote:
            payload.updateNote ??
            (body.content ? `Dream chat update: ${body.content}` : undefined),
        }

        const hasDreamUpdates = Object.values(dreamUpdates).some(
          (value) => value !== undefined,
        )

        if (hasDreamUpdates) await updateDream(normalizedDreamId, dreamUpdates)
        else await fetchDreamById(normalizedDreamId, true)
      } else {
        saveStateToLocalStorage()
      }

      return {
        success: true,
        data: res.data,
        message: `Dream chat #${res.data.id} created.`,
      }
    } catch (chatError) {
      const message = reportError(
        chatError,
        'creating dream chat',
        'Failed to create dream chat.',
        ErrorType.INTERACTION_ERROR,
      )
      return { success: false, message }
    } finally {
      isSaving.value = false
    }
  }

  async function addUserDreamMessage(
    content: string,
    dreamId = selectedDreamId.value,
  ): Promise<DreamResult<DreamChatWithRelations>> {
    const id = normalizeId(dreamId)

    if (!id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await addDreamChat(id, {
      type: 'Dream',
      sender: userStore.username || 'Dreamer',
      content,
      isPublic: selectedDream.value?.isPublic ?? true,
      isMature: selectedDream.value?.isMature ?? false,
    })
  }

  async function addModelDreamMessage(
    content: string,
    options: DreamChatForm = {},
  ): Promise<DreamResult<DreamChatWithRelations>> {
    const id = normalizeId(options.dreamId ?? selectedDreamId.value)

    if (!id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await addDreamChat(id, {
      type: 'BotResponse',
      sender: options.sender || 'Dream',
      content,
      botResponse: options.botResponse ?? content,
      promptId: options.promptId ?? null,
      artImageId: options.artImageId ?? null,
      serverId: options.serverId ?? null,
      serverName: options.serverName ?? null,
      updateDream: options.updateDream ?? false,
      addArtToCollection: options.addArtToCollection ?? false,
      isPublic: selectedDream.value?.isPublic ?? true,
      isMature: selectedDream.value?.isMature ?? false,
    })
  }

  function setDreamForm(updates: Partial<DreamForm>) {
    dreamForm.value = normalizeDreamForm({ ...dreamForm.value, ...updates })
    saveStateToLocalStorage()
  }

  function setChatForm(updates: DreamChatForm) {
    chatForm.value = { ...chatForm.value, ...updates }
    saveStateToLocalStorage()
  }

  function clearChatForm() {
    chatForm.value = {}
    saveStateToLocalStorage()
  }

  async function submitChatForm(): Promise<
    DreamResult<DreamChatWithRelations>
  > {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    const result = await addDreamChat(selectedDream.value.id, chatForm.value)
    if (result.success) clearChatForm()
    return result
  }

  function createBlankDreamForm() {
    dreamForm.value = defaultDreamForm(currentUserId.value, userStore.username)
    saveStateToLocalStorage()
  }

  function startAddingDream(overrides: DreamForm = {}) {
    selectedDream.value = null
    selectedDreams.value = []
    dreamChats.value = []
    chatForm.value = {}
    dreamForm.value = createDefaultDreamForm(overrides)
    saveStateToLocalStorage()
  }

  async function startEditingDream(
    id?: number,
  ): Promise<DreamWithRelations | null> {
    const dreamId = normalizeId(id ?? selectedDream.value?.id)

    if (!dreamId) {
      startAddingDream()
      return null
    }

    const cached = dreams.value.find((entry) => entry.id === dreamId)
    const dream = cached ?? (await fetchDreamById(dreamId))

    if (!dream) {
      reportError(
        new Error(`Dream ${dreamId} was not found.`),
        'starting dream edit',
        `Dream ${dreamId} could not be loaded for editing.`,
        ErrorType.INTERACTION_ERROR,
      )
      return null
    }

    selectedDream.value = dream
    selectedDreams.value = [dream]
    dreamForm.value = toDreamForm(dream)
    dreamChats.value = dream.Chats ?? []
    saveStateToLocalStorage()

    return dream
  }

  async function startCloningDream(
    id: number,
    overrides: DreamForm = {},
  ): Promise<DreamForm | null> {
    const source =
      dreams.value.find((dream) => dream.id === id) ??
      (await fetchDreamById(id))

    if (!source) return null

    selectedDream.value = null
    selectedDreams.value = []
    dreamChats.value = []
    chatForm.value = {}
    dreamForm.value = normalizeDreamForm({
      ...toDreamForm(source),
      ...overrides,
      id: undefined,
      slug: null,
      title: source.title ? `${source.title} Remix` : 'Dream Remix',
      creationSource: 'HYBRID',
      userId: currentUserId.value,
      designer: userStore.username || source.designer || 'Kind Designer',
      isPublic: overrides.isPublic ?? false,
      createCollection: overrides.createCollection ?? true,
    })
    saveStateToLocalStorage()

    return dreamForm.value
  }

  function deselectDream() {
    selectedDream.value = null
    selectedDreams.value = []
    dreamForm.value = {}
    dreamChats.value = []
    chatForm.value = {}
    saveStateToLocalStorage()
  }

  function selectDream(id: number) {
    const dreamId = normalizeId(id)
    if (!dreamId) return null

    const found = dreams.value.find((dream) => dream.id === dreamId)
    if (!found) return null

    selectedDream.value = found
    selectedDreams.value = [found]
    dreamForm.value = toDreamForm(found)
    dreamChats.value = found.Chats ?? []
    saveStateToLocalStorage()

    return found
  }

  async function selectDreamById(id: number) {
    const local = selectDream(id)
    const fetched = await fetchDreamById(id, true)
    return fetched ?? local
  }

  function setSelectedDream(dreamId: number) {
    selectDream(dreamId)
  }

  function setSelectedTitle(dreamId: number) {
    selectedTitle.value =
      dreams.value.find((dream) => dream.id === dreamId) || null
    saveStateToLocalStorage()
  }

  function setSelectedDreamType(dreamType: DreamType | string | null) {
    selectedDreamType.value = dreamType ? parseDreamType(dreamType) : null
    saveStateToLocalStorage()
  }

  function getDreamsBySelectedType(): DreamWithRelations[] {
    if (!selectedDreamType.value) return dreams.value
    return dreams.value.filter(
      (dream) =>
        parseDreamType(dream.dreamType as string) === selectedDreamType.value,
    )
  }

  function setRandomDreamSeed() {
    const pitch = randomSeedDream()
    setDreamForm({ pitch })
    return pitch
  }

  function setRandomDreamVibe() {
    const flavorText = randomSeedDream()
    setDreamForm({ flavorText })
    return flavorText
  }

  async function setCurrentArt(art: {
    id: number
    artImageId?: number | null
  }): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      artImageId: art.artImageId ?? art.id ?? null,
      addArtToCollection: true,
      updateNote: 'Updated the active Dream image.',
    })
  }

  async function setDreamPitch(
    pitch: string,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      pitch,
      updateNote: 'Updated the Dream seed.',
    })
  }

  async function setCurrentPrompt(
    currentPrompt: string,
  ): Promise<DreamResult<DreamWithRelations>> {
    return await setDreamPitch(currentPrompt)
  }

  async function setCurrentVibe(
    currentVibe: string,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      flavorText: currentVibe,
      updateNote: 'Updated the Dream flavor text.',
    })
  }

  async function setDreamDescription(
    description: string,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      description,
      updateNote: 'Updated the Dream description.',
    })
  }

  async function setDreamArtPrompt(
    artPrompt: string,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      artPrompt,
      updateNote: 'Updated the Dream art prompt.',
    })
  }

  async function setDreamType(
    dreamType: DreamType | string,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      dreamType: parseDreamType(dreamType),
      updateNote: 'Updated the Dream type.',
    })
  }

  async function setDreamScenario(
    scenarioId: number | null,
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      scenarioId,
      updateNote: scenarioId
        ? 'Attached a Scenario to this Dream.'
        : 'Removed the Scenario from this Dream.',
    })
  }

  async function setDreamCast(
    characterIds: number[],
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      characterIds: normalizeIds(characterIds),
      updateNote: 'Updated the Dream cast.',
    })
  }

  async function setDreamItems(
    rewardIds: number[],
  ): Promise<DreamResult<DreamWithRelations>> {
    if (!selectedDream.value?.id) {
      const message = 'No dream selected.'
      setError(message)
      return { success: false, message }
    }

    return await updateDream(selectedDream.value.id, {
      rewardIds: normalizeIds(rewardIds),
      updateNote: 'Updated the Dream rewards.',
    })
  }

  async function addTitle({
    title,
    dreamType,
    pitch,
  }: {
    title: string
    dreamType?: DreamType | string
    pitch?: string
  }) {
    return await createDream({
      title,
      dreamType: parseDreamType(dreamType ?? 'TITLE'),
      pitch: pitch || title,
      userId: currentUserId.value,
      designer: userStore.username || 'Kind Designer',
      creationSource: 'HUMAN',
    } as DreamForm)
  }

  async function updateDreamExamples(dreamId: number, examplesArray: string[]) {
    const updatedExamples = joinExamples(examplesArray)
    const result = await updateDream(dreamId, { examples: updatedExamples })
    if (result.success) saveStateToLocalStorage()
    return result
  }

  async function fetchBrainstormDreams() {
    if (!selectedTitle.value && !selectedDream.value) {
      return { success: false, message: 'No selected dream or title' }
    }

    if (loading.value) {
      return { success: false, message: 'Brainstorm already loading' }
    }

    loading.value = true

    try {
      clearError()
      const activeDream = selectedTitle.value || selectedDream.value
      if (!activeDream) throw new Error('No selected dream')

      const examples = extractExamples(exampleString.value).map((example) => ({
        title: activeDream.title || 'Example',
        pitch: example,
      }))

      const content = buildBrainstormPrompt(
        activeDream.title || activeDream.pitch || '',
        activeDream.description || activeDream.pitch || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const res = await performFetch<unknown>('/api/botcafe/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeDream.title || activeDream.pitch || '',
          description: activeDream.description || activeDream.pitch || '',
          instructions: activeDream.description || activeDream.pitch || '',
          examples,
          n: numberOfRequests.value,
          content,
          max_tokens: maxTokens.value,
          maxTokens: maxTokens.value,
          maxOutputTokens: maxTokens.value,
          temperature: temperature.value,
        }),
      })

      if (!res.success)
        return {
          success: false,
          message: res.message || 'Brainstorm request failed',
        }

      apiResponse.value = normalizeBrainstormResponse(res.data)
      saveStateToLocalStorage()

      return {
        success: true,
        data: apiResponse.value,
        message: 'Brainstorm generated',
        mana: (res as { mana?: unknown }).mana,
      }
    } catch (brainstormError) {
      const message = reportError(
        brainstormError,
        'brainstorming dreams',
        'Error generating brainstorm.',
        ErrorType.INTERACTION_ERROR,
      )
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  async function fetchTitleStormDreams() {
    if (!selectedTitle.value && !selectedDream.value) return
    if (loading.value) return

    loading.value = true

    try {
      clearError()
      const activeDream = selectedTitle.value || selectedDream.value
      if (!activeDream) return

      const content = buildTitleStormPrompt(
        activeDream.title || activeDream.pitch || '',
        activeDream.description || activeDream.pitch || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const res = await performFetch<string>('/api/botcafe/titleStorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n: 1,
          content,
          max_tokens: maxTokens.value,
          temperature: temperature.value,
        }),
      })

      if (!res.success)
        throw new Error(res.message || 'Title storm request failed')

      apiResponse.value = res.data || 'No response'

      const created = await createDream({
        title: activeDream.title || 'Title Storm',
        description: activeDream.description,
        examples: res.data,
        dreamType: 'BRAINSTORM',
        pitch: res.data || 'Untitled brainstorm',
        userId: currentUserId.value,
        designer: userStore.username || 'Kind Designer',
        creationSource: 'AI',
      } as DreamForm)

      if (created.success && created.data) {
        newestDreams.value = [created.data]
        saveStateToLocalStorage()
      }

      return created
    } catch (titleStormError) {
      const message = reportError(
        titleStormError,
        'fetching title storm',
        'Error fetching title storm.',
        ErrorType.INTERACTION_ERROR,
      )
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  async function generateFields(fieldsToUpgrade: string[]) {
    isGeneratingFields.value = true

    try {
      clearError()
      const res = await performFetch<Partial<Dream>>('/api/dreams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream: dreamForm.value,
          fieldsToUpgrade,
        }),
      })

      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to generate dream fields')

      setDreamForm(res.data as Partial<DreamForm>)

      return { success: true, message: 'Dream fields generated' }
    } catch (generateError) {
      const message = reportError(
        generateError,
        'generating dream fields',
        'Failed to generate dream fields.',
        ErrorType.INTERACTION_ERROR,
      )
      return { success: false, message }
    } finally {
      isGeneratingFields.value = false
    }
  }

  async function promotePromptToDream(promptId: number) {
    const promptStore = usePromptStore()
    const prompt = await promptStore.fetchPromptById(promptId)

    if (!prompt) return { success: false, message: 'Prompt not found' }

    return await createDream({
      title: fallbackDreamTitle(prompt.prompt),
      pitch: prompt.prompt,
      description: prompt.prompt.slice(0, 764),
      dreamType: 'PITCH',
      creationSource: 'HYBRID',
      userId: prompt.userId || currentUserId.value || 10,
      designer: userStore.username || 'Kind Designer',
      artPrompt: prompt.artPrompt || prompt.prompt,
      artImageId: prompt.artImageId ?? null,
      isPublic: prompt.isPublic ?? true,
      isMature: prompt.isMature ?? false,
      isActive: prompt.isActive ?? true,
    } as DreamForm)
  }

  async function createDreamFromPrompt(promptId: number) {
    return await promotePromptToDream(promptId)
  }

  function randomEntry(dreamName: string): string {
    return helperRandomEntry(dreamName, dreams.value)
  }

  function getSelectedExamples(): string[] {
    return extractExamples(selectedDream.value?.examples ?? '')
  }

  function clearLocalStorage() {
    Object.values(storageKeys).forEach((key) => safeRemoveLocalStorage(key))
  }

  function clearLegacyPitchLocalStorage() {
    Object.values(legacyPitchStorageKeys).forEach((key) =>
      safeRemoveLocalStorage(key),
    )
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    hasLoaded.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchArtForDreamPromises.value = {}
    createDreamPromise.value = null
    updateDreamPromise.value = {}
    clearError()
  }

  return {
    dreamSeeds,
    dreams,
    dreamForm,
    selectedDreams,
    selectedDreamType,
    selectedDream,
    selectedTitle,
    newestDreams,
    galleryArt,
    dreamChats,
    chatForm,

    loading,
    chatsLoading,
    isSaving,
    isDeleting,
    isGeneratingFields,
    isInitialized,
    isInitializing,
    hasLoaded,
    error,
    lastError,
    initializePromise,
    fetchPromise,
    fetchArtForDreamPromises,
    createDreamPromise,
    updateDreamPromise,

    numberOfRequests,
    temperature,
    exampleString,
    apiResponse,
    maxTokens,
    dreamTypes,

    currentUserId,
    selectedDreamId,
    selectedDreamChats,
    activeDreams,
    publicDreams,
    ownedDreams,
    visibleDreams,
    artDreams,
    pitchDreams,
    brainstormDreams,
    projectDreams,
    publicProjectDreams,
    dreamsByTitle,
    selectedTitleDreams,
    selectedDreamCast,
    selectedDreamItems,
    selectedDreamCollectionArt,
    selectedDreamCurrentImage,
    selectedDreamSummary,
    newestDreamsDisplay,
    latestDreamChat,
    hasSelectedDream,
    hasUnsavedChanges,

    setError,
    setLastError,
    clearError,
    reportError,
    randomDream,
    randomDreamSeed,
    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    loadFromLocalStorage,
    hydrateFromLegacyPitchStorage,
    syncToLocalStorage,
    saveStateToLocalStorage,

    fetchDreams,
    fetchOwnedDreams,
    fetchDreamById,
    fetchArtForDream,
    createDream,
    updateDream,
    updateSelectedDream,
    saveDream,
    deleteDream,
    deleteDreamById,
    upsertDream,

    fetchDreamChats,
    addDreamChat,
    addUserDreamMessage,
    addModelDreamMessage,
    setChatForm,
    clearChatForm,
    submitChatForm,

    setDreamForm,
    createBlankDreamForm,
    createDefaultDreamForm,
    startAddingDream,
    startEditingDream,
    startCloningDream,
    deselectDream,
    selectDream,
    selectDreamById,
    setSelectedDream,
    setSelectedTitle,
    setSelectedDreamType,
    getDreamsBySelectedType,
    toDreamForm,

    setRandomDreamSeed,
    setRandomDreamVibe,
    setCurrentArt,
    setDreamPitch,
    setCurrentPrompt,
    setCurrentVibe,
    setDreamDescription,
    setDreamArtPrompt,
    setDreamType,
    setDreamScenario,
    setDreamCast,
    setDreamItems,

    addTitle,
    updateDreamExamples,
    fetchBrainstormDreams,
    fetchTitleStormDreams,
    generateFields,
    promotePromptToDream,
    createDreamFromPrompt,
    randomEntry,
    getSelectedExamples,
    clearLocalStorage,
    clearLegacyPitchLocalStorage,
  }
})

export { DREAM_TYPES }
export type { Dream, DreamType }

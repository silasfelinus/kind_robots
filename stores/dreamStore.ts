// /stores/dreamStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type {
  Art,
  ArtCollection,
  ArtImage,
  Character,
  Chat,
  Dream,
  Gallery,
  Pitch,
  Reaction,
  Reward,
  Scenario,
  Tag,
  User,
} from '~/prisma/generated/prisma/client'

export interface DreamForm extends Partial<Dream> {
  createCollection?: boolean
  tagIds?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  addArtToCollection?: boolean
  updateNote?: string | null
}

export interface DreamChatForm extends Partial<Chat> {
  dreamId?: number | null
  updateDream?: boolean
  currentVibe?: string
  currentPrompt?: string | null
  artId?: number | null
  addArtToCollection?: boolean
}

export interface DreamWithRelations extends Dream {
  User?: Pick<User, 'id' | 'username' | 'avatarImage'> | null
  Pitch?: Pitch | null
  Art?: Art | null
  ArtImage?: Partial<ArtImage> | null
  ArtCollection?: (ArtCollection & { art?: Art[] }) | null
  Gallery?: Gallery | null
  Scenario?: Scenario | null
  Characters?: Character[]
  Rewards?: Reward[]
  Tags?: Tag[]
  Chats?: DreamChatWithRelations[]
  Reactions?: Reaction[]
  _count?: {
    Chats?: number
    Reactions?: number
    Characters?: number
    Rewards?: number
  }
}

export interface DreamChatWithRelations extends Chat {
  User?: Pick<User, 'id' | 'username' | 'avatarImage'> | null
  Character?: Partial<Character> | null
  Prompt?: unknown | null
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
  pitchId?: number
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

const isClient = typeof window !== 'undefined'
const dreamsStorageKey = 'dreams'
const dreamFormStorageKey = 'dreamForm'
const selectedDreamStorageKey = 'selectedDream'
const dreamChatsStorageKey = 'dreamChats'

const dreamSeeds = [
  'A luminous greenhouse where brass robots tend glowing plants under drifting paper lanterns.',
  'A floating market of lanterns, moonlit foxes, and tiny philosophers arguing beside warm tea.',
  'A cozy glasshouse suspended in twilight, full of secret doors, soft rain, and impossible flowers.',
  'A botanical dreamhouse where every vine remembers a story and every doorway leads somewhere suspiciously charming.',
  'A safe glowing sanctuary that feels like a hub, a starter town, and a tiny miracle with paperwork.',
]

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
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
    'A shared Dream location begins in a room full of impossible light.'
  )
}

function fallbackDreamTitle() {
  return `Dream-${Date.now()}`
}

export const useDreamStore = defineStore('dreamStore', () => {
  const userStore = useUserStore()

  const dreams = ref<DreamWithRelations[]>([])
  const selectedDream = ref<DreamWithRelations | null>(null)
  const dreamForm = ref<DreamForm>({})
  const dreamChats = ref<DreamChatWithRelations[]>([])
  const chatForm = ref<DreamChatForm>({})

  const loading = ref(false)
  const chatsLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isInitialized = ref(false)
  const error = ref('')

  const currentUserId = computed(
    () => userStore.user?.id ?? userStore.userId ?? 9,
  )

  const activeDreams = computed(() =>
    dreams.value.filter((dream) => dream.isActive),
  )

  const publicDreams = computed(() =>
    dreams.value.filter((dream) => dream.isPublic),
  )

  const ownedDreams = computed(() =>
    dreams.value.filter((dream) => dream.userId === currentUserId.value),
  )

  const selectedDreamId = computed(() => selectedDream.value?.id ?? null)
  const selectedDreamChats = computed(() => dreamChats.value)
  const selectedDreamCast = computed(
    () => selectedDream.value?.Characters ?? [],
  )
  const selectedDreamItems = computed(() => selectedDream.value?.Rewards ?? [])
  const selectedDreamTags = computed(() => selectedDream.value?.Tags ?? [])
  const selectedDreamCollectionArt = computed(
    () => selectedDream.value?.ArtCollection?.art ?? [],
  )

  const selectedDreamCurrentImage = computed(() => {
    return (
      selectedDream.value?.Art?.imagePath ??
      selectedDream.value?.ArtImage?.fileName ??
      selectedDream.value?.Gallery?.highlightImage ??
      ''
    )
  })

  const selectedDreamSummary = computed(() => {
    const dream = selectedDream.value

    if (!dream) return 'Choose a Dream location to begin.'

    const castCount = dream._count?.Characters ?? dream.Characters?.length ?? 0
    const itemCount = dream._count?.Rewards ?? dream.Rewards?.length ?? 0
    const chatCount = dream._count?.Chats ?? dream.Chats?.length ?? 0

    return `${dream.title} has ${castCount} cast member${castCount === 1 ? '' : 's'}, ${itemCount} item${itemCount === 1 ? '' : 's'}, and ${chatCount} room note${chatCount === 1 ? '' : 's'}.`
  })

  const latestDreamChat = computed(() => dreamChats.value.at(-1) ?? null)
  const hasSelectedDream = computed(() => Boolean(selectedDream.value?.id))

  function setError(message = '') {
    error.value = message
  }

  function randomDream() {
    return randomSeedDream()
  }

  function randomDreamSeed() {
    return randomSeedDream()
  }

  function syncToLocalStorage() {
    if (!isClient) return

    try {
      localStorage.setItem(dreamsStorageKey, JSON.stringify(dreams.value))
      localStorage.setItem(dreamFormStorageKey, JSON.stringify(dreamForm.value))
      localStorage.setItem(
        selectedDreamStorageKey,
        JSON.stringify(selectedDream.value),
      )
      localStorage.setItem(
        dreamChatsStorageKey,
        JSON.stringify(dreamChats.value),
      )
    } catch (storageError) {
      console.error('[dreamStore] localStorage sync error:', storageError)
    }
  }

  function loadFromLocalStorage() {
    if (!isClient) return

    dreams.value = safeJsonParse<DreamWithRelations[]>(
      localStorage.getItem(dreamsStorageKey),
      [],
    )
    dreamForm.value = safeJsonParse<DreamForm>(
      localStorage.getItem(dreamFormStorageKey),
      {},
    )
    selectedDream.value = safeJsonParse<DreamWithRelations | null>(
      localStorage.getItem(selectedDreamStorageKey),
      null,
    )
    dreamChats.value = safeJsonParse<DreamChatWithRelations[]>(
      localStorage.getItem(dreamChatsStorageKey),
      [],
    )
  }

  function toDreamForm(dream: DreamWithRelations): DreamForm {
    return {
      id: dream.id,
      title: dream.title,
      slug: dream.slug ?? null,
      description: dream.description ?? null,
      currentVibe: dream.currentVibe,
      currentPrompt: dream.currentPrompt ?? dream.currentVibe,
      userId: dream.userId,
      pitchId: dream.pitchId ?? null,
      artId: dream.artId ?? null,
      artImageId: dream.artImageId ?? null,
      textServerId: dream.textServerId ?? null,
      artServerId: dream.artServerId ?? null,
      artCollectionId: dream.artCollectionId ?? null,
      galleryId: dream.galleryId ?? null,
      scenarioId: dream.scenarioId ?? null,
      isPublic: dream.isPublic,
      isMature: dream.isMature,
      isActive: dream.isActive,
      createCollection: false,
      tagIds: dream.Tags?.map((tag) => tag.id) ?? [],
      characterIds: dream.Characters?.map((character) => character.id) ?? [],
      rewardIds: dream.Rewards?.map((reward) => reward.id) ?? [],
    }
  }

  function createDefaultDreamForm(overrides: DreamForm = {}): DreamForm {
    const currentVibe = overrides.currentVibe ?? randomSeedDream()

    return {
      title: overrides.title ?? '',
      slug: overrides.slug ?? null,
      description: overrides.description ?? null,
      currentVibe,
      currentPrompt: overrides.currentPrompt ?? currentVibe,
      userId: currentUserId.value,
      pitchId: overrides.pitchId ?? null,
      artId: overrides.artId ?? null,
      artImageId: overrides.artImageId ?? null,
      textServerId:
        overrides.textServerId ?? userStore.user?.preferredTextServerId ?? null,
      artServerId:
        overrides.artServerId ?? userStore.user?.preferredArtServerId ?? null,
      artCollectionId: overrides.artCollectionId ?? null,
      galleryId: overrides.galleryId ?? null,
      scenarioId: overrides.scenarioId ?? null,
      isPublic: overrides.isPublic ?? true,
      isMature: overrides.isMature ?? false,
      isActive: overrides.isActive ?? true,
      createCollection: overrides.createCollection ?? true,
      tagIds: normalizeIds(overrides.tagIds),
      characterIds: normalizeIds(overrides.characterIds),
      rewardIds: normalizeIds(overrides.rewardIds),
      addArtToCollection: overrides.addArtToCollection ?? true,
    }
  }

  function upsertDream(dream: DreamWithRelations) {
    const index = dreams.value.findIndex((item) => item.id === dream.id)

    if (index === -1) {
      dreams.value.unshift(dream)
    } else {
      dreams.value[index] = dream
    }

    if (selectedDream.value?.id === dream.id) {
      selectedDream.value = dream
      dreamForm.value = toDreamForm(dream)
      dreamChats.value = dream.Chats ?? dreamChats.value
    }

    syncToLocalStorage()
  }

  function removeDreamFromState(id: number) {
    dreams.value = dreams.value.filter((dream) => dream.id !== id)

    if (selectedDream.value?.id === id) {
      selectedDream.value = null
      dreamForm.value = {}
      dreamChats.value = []
      chatForm.value = {}
    }

    syncToLocalStorage()
  }

  async function initialize(force = false) {
    if (isInitialized.value && !force) return

    loading.value = true
    setError('')

    try {
      loadFromLocalStorage()

      const fetched = await fetchDreams()
      const fetchedIds = new Set(fetched.map((dream) => dream.id))

      dreams.value = [
        ...dreams.value.filter((dream) => !fetchedIds.has(dream.id)),
        ...fetched,
      ]

      if (selectedDream.value?.id) {
        const refreshed = await fetchDreamById(selectedDream.value.id, true)
        if (refreshed) selectedDream.value = refreshed
      }

      isInitialized.value = true
      syncToLocalStorage()
    } catch (initializeError) {
      handleError(initializeError, 'initializing dream store')
      setError((initializeError as Error).message)
    } finally {
      loading.value = false
    }
  }

  async function fetchDreams(
    options: FetchDreamOptions = {},
  ): Promise<DreamWithRelations[]> {
    loading.value = true
    setError('')

    try {
      const query = buildQuery({
        userOnly: options.userOnly ? 'true' : undefined,
        showInactive: options.showInactive ? 'true' : undefined,
        includeMature: options.includeMature ? 'true' : undefined,
        artCollectionId: options.artCollectionId,
        galleryId: options.galleryId,
        scenarioId: options.scenarioId,
        pitchId: options.pitchId,
        tagId: options.tagId,
        characterId: options.characterId,
        rewardId: options.rewardId,
        search: options.search,
        limit: options.limit,
      })

      const url = query ? `/api/dreams?${query}` : '/api/dreams'
      const res = await performFetch<DreamWithRelations[]>(url)

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch dreams.')
      }

      dreams.value = res.data
      syncToLocalStorage()

      return res.data
    } catch (fetchError) {
      handleError(fetchError, 'fetching dreams')
      setError((fetchError as Error).message)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchOwnedDreams() {
    return await fetchDreams({ userOnly: true })
  }

  async function fetchDreamById(
    id: number,
    selectAfterFetch = false,
  ): Promise<DreamWithRelations | null> {
    const dreamId = normalizeId(id)
    if (!dreamId) return null

    loading.value = true
    setError('')

    try {
      const query = userStore.showMature ? '?includeMature=true' : ''
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}${query}`,
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || `Failed to fetch dream ${dreamId}.`)
      }

      upsertDream(res.data)

      if (selectAfterFetch) {
        selectedDream.value = res.data
        dreamForm.value = toDreamForm(res.data)
        dreamChats.value = res.data.Chats ?? []
      }

      syncToLocalStorage()
      return res.data
    } catch (fetchError) {
      handleError(fetchError, 'fetching dream by ID')
      setError((fetchError as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createDream(payload: DreamForm) {
    isSaving.value = true
    setError('')

    try {
      const currentVibe = payload.currentVibe?.trim() || randomSeedDream()
      const body: DreamForm = {
        title: payload.title?.trim() || fallbackDreamTitle(),
        slug: payload.slug ?? null,
        description: payload.description ?? null,
        currentVibe,
        currentPrompt: payload.currentPrompt ?? currentVibe,
        userId: currentUserId.value,
        pitchId: payload.pitchId ?? null,
        artId: payload.artId ?? null,
        artImageId: payload.artImageId ?? null,
        textServerId: payload.textServerId ?? null,
        artServerId: payload.artServerId ?? null,
        artCollectionId: payload.artCollectionId ?? null,
        galleryId: payload.galleryId ?? null,
        scenarioId: payload.scenarioId ?? null,
        isPublic: payload.isPublic ?? true,
        isMature: payload.isMature ?? false,
        isActive: payload.isActive ?? true,
        createCollection: payload.createCollection ?? true,
        tagIds: normalizeIds(payload.tagIds),
        characterIds: normalizeIds(payload.characterIds),
        rewardIds: normalizeIds(payload.rewardIds),
      }

      const res = await performFetch<DreamWithRelations>('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create dream.')
      }

      upsertDream(res.data)
      selectedDream.value = res.data
      dreamForm.value = toDreamForm(res.data)
      dreamChats.value = res.data.Chats ?? []
      syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (createError) {
      handleError(createError, 'creating dream')
      setError((createError as Error).message)
      return { success: false, message: (createError as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updateDream(id: number, updates: DreamForm) {
    const dreamId = normalizeId(id)

    if (!dreamId) return { success: false, message: 'Invalid dream ID.' }

    isSaving.value = true
    setError('')

    try {
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updates,
            tagIds: updates.tagIds ? normalizeIds(updates.tagIds) : undefined,
            characterIds: updates.characterIds
              ? normalizeIds(updates.characterIds)
              : undefined,
            rewardIds: updates.rewardIds
              ? normalizeIds(updates.rewardIds)
              : undefined,
          }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || `Failed to update dream ${dreamId}.`)
      }

      upsertDream(res.data)
      dreamForm.value = toDreamForm(res.data)
      syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (updateError) {
      handleError(updateError, 'updating dream')
      setError((updateError as Error).message)
      return { success: false, message: (updateError as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteDream(id: number, hardDelete = false) {
    const dreamId = normalizeId(id)

    if (!dreamId) return { success: false, message: 'Invalid dream ID.' }

    isDeleting.value = true
    setError('')

    try {
      const query = hardDelete ? '?hard=true' : ''
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}${query}`,
        { method: 'DELETE' },
      )

      if (!res.success) {
        throw new Error(res.message || `Failed to delete dream ${dreamId}.`)
      }

      if (hardDelete) removeDreamFromState(dreamId)
      else if (res.data) upsertDream(res.data)

      return { success: true, data: res.data }
    } catch (deleteError) {
      handleError(deleteError, 'deleting dream')
      setError((deleteError as Error).message)
      return { success: false, message: (deleteError as Error).message }
    } finally {
      isDeleting.value = false
    }
  }

  async function fetchDreamChats(options: FetchDreamChatOptions | number = {}) {
    const normalizedOptions =
      typeof options === 'number' ? { dreamId: options } : options
    const dreamId = normalizeId(
      normalizedOptions.dreamId ?? selectedDreamId.value,
    )

    if (!dreamId) return []

    chatsLoading.value = true
    setError('')

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
        `/api/dreams/chats?${query}`,
      )

      if (!res.success || !res.data) {
        throw new Error(
          res.message || `Failed to fetch chats for dream ${dreamId}.`,
        )
      }

      dreamChats.value = res.data
      syncToLocalStorage()
      return res.data
    } catch (fetchError) {
      handleError(fetchError, 'fetching dream chats')
      setError((fetchError as Error).message)
      return []
    } finally {
      chatsLoading.value = false
    }
  }

  async function addDreamChat(dreamId: number, payload: DreamChatForm) {
    const normalizedDreamId = normalizeId(dreamId)

    if (!normalizedDreamId)
      return { success: false, message: 'Invalid dream ID.' }

    isSaving.value = true
    setError('')

    try {
      const body: DreamChatForm = {
        ...payload,
        dreamId: normalizedDreamId,
        userId: currentUserId.value,
        type: payload.type ?? 'Dream',
        content: payload.content?.trim(),
      }

      if (!body.content) throw new Error('Dream chat content is required.')

      const res = await performFetch<DreamChatWithRelations>(
        '/api/dreams/chats',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create dream chat.')
      }

      dreamChats.value.push(res.data)

      if (payload.updateDream) await fetchDreamById(normalizedDreamId, true)
      else syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (chatError) {
      handleError(chatError, 'creating dream chat')
      setError((chatError as Error).message)
      return { success: false, message: (chatError as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function addUserDreamMessage(
    content: string,
    dreamId = selectedDreamId.value,
  ) {
    const id = normalizeId(dreamId)
    if (!id) return { success: false, message: 'No dream selected.' }

    return await addDreamChat(id, {
      type: 'Dream',
      content,
      isPublic: selectedDream.value?.isPublic ?? true,
      isMature: selectedDream.value?.isMature ?? false,
    })
  }

  async function addModelDreamMessage(
    content: string,
    options: DreamChatForm = {},
  ) {
    const id = normalizeId(options.dreamId ?? selectedDreamId.value)
    if (!id) return { success: false, message: 'No dream selected.' }

    return await addDreamChat(id, {
      type: 'BotResponse',
      sender: 'Dream',
      content,
      botResponse: options.botResponse ?? content,
      currentVibe: options.currentVibe,
      currentPrompt: options.currentPrompt,
      promptId: options.promptId ?? null,
      artImageId: options.artImageId ?? null,
      artId: options.artId ?? null,
      serverId: options.serverId ?? null,
      serverName: options.serverName ?? null,
      updateDream: options.updateDream ?? false,
      addArtToCollection: options.addArtToCollection ?? false,
      isPublic: selectedDream.value?.isPublic ?? true,
      isMature: selectedDream.value?.isMature ?? false,
    })
  }

  async function updateSelectedDream(updates: DreamForm) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, updates)
  }

  async function saveDream() {
    if (!dreamForm.value)
      return { success: false, message: 'No dream form loaded.' }
    if (dreamForm.value.id)
      return await updateDream(dreamForm.value.id, dreamForm.value)
    return await createDream(dreamForm.value)
  }

  function selectDream(id: number) {
    const dreamId = normalizeId(id)
    if (!dreamId) return null

    const found = dreams.value.find((dream) => dream.id === dreamId)
    if (!found) return null

    selectedDream.value = found
    dreamForm.value = toDreamForm(found)
    dreamChats.value = found.Chats ?? []
    syncToLocalStorage()

    return found
  }

  async function selectDreamById(id: number) {
    const local = selectDream(id)
    const fetched = await fetchDreamById(id, true)
    return fetched ?? local
  }

  function deselectDream() {
    selectedDream.value = null
    dreamForm.value = {}
    dreamChats.value = []
    chatForm.value = {}
    syncToLocalStorage()
  }

  function setDreamForm(updates: DreamForm) {
    dreamForm.value = { ...dreamForm.value, ...updates }
    syncToLocalStorage()
  }

  function setChatForm(updates: DreamChatForm) {
    chatForm.value = { ...chatForm.value, ...updates }
    syncToLocalStorage()
  }

  function clearChatForm() {
    chatForm.value = {}
    syncToLocalStorage()
  }

  async function submitChatForm() {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }

    const result = await addDreamChat(selectedDream.value.id, chatForm.value)
    if (result.success) clearChatForm()
    return result
  }

  function startAddingDream(overrides: DreamForm = {}) {
    selectedDream.value = null
    dreamForm.value = createDefaultDreamForm(overrides)
    dreamChats.value = []
    chatForm.value = {}
    syncToLocalStorage()
  }

  async function startEditingDream(id?: number) {
    const dreamId = normalizeId(id ?? selectedDream.value?.id)

    if (!dreamId) {
      startAddingDream()
      return null
    }

    const dream =
      dreams.value.find((entry) => entry.id === dreamId) ??
      (await fetchDreamById(dreamId, false))

    if (!dream) {
      setError(`Dream ${dreamId} was not found.`)
      return null
    }

    selectedDream.value = dream
    dreamForm.value = toDreamForm(dream)
    dreamChats.value = dream.Chats ?? []
    syncToLocalStorage()

    return dream
  }

  function startCloningDream(id: number, overrides: DreamForm = {}) {
    const source = dreams.value.find((dream) => dream.id === id)

    if (!source) {
      setError(`Dream ${id} was not found.`)
      return null
    }

    selectedDream.value = null
    dreamForm.value = {
      ...toDreamForm(source),
      ...overrides,
      id: undefined,
      slug: null,
      title: `Copy of ${source.title || 'Untitled Dream'}`,
      userId: currentUserId.value,
      isPublic: overrides.isPublic ?? false,
      createCollection: overrides.createCollection ?? true,
    }
    dreamChats.value = []
    chatForm.value = {}
    syncToLocalStorage()

    return source
  }

  function setRandomDreamVibe() {
    const currentVibe = randomSeedDream()
    setDreamForm({
      currentVibe,
      currentPrompt: dreamForm.value.currentPrompt || currentVibe,
    })
    return currentVibe
  }

  async function setCurrentArt(art: {
    id: number
    artImageId?: number | null
  }) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }

    return await updateDream(selectedDream.value.id, {
      artId: art.id,
      artImageId: art.artImageId ?? null,
      addArtToCollection: true,
      updateNote: 'Updated the active Dream image.',
    })
  }

  async function setCurrentPrompt(currentPrompt: string) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, {
      currentPrompt,
      updateNote: 'Updated the Dream location prompt.',
    })
  }

  async function setCurrentVibe(currentVibe: string) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, {
      currentVibe,
      updateNote: 'Updated the Dream location vibe.',
    })
  }

  async function setDreamScenario(scenarioId: number | null) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, {
      scenarioId,
      updateNote: scenarioId
        ? 'Attached a Scenario to this Dream location.'
        : 'Removed the Scenario from this Dream location.',
    })
  }

  async function setDreamCast(characterIds: number[]) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, {
      characterIds: normalizeIds(characterIds),
      updateNote: 'Updated the Dream cast.',
    })
  }

  async function setDreamItems(rewardIds: number[]) {
    if (!selectedDream.value?.id)
      return { success: false, message: 'No dream selected.' }
    return await updateDream(selectedDream.value.id, {
      rewardIds: normalizeIds(rewardIds),
      updateNote: 'Updated the Dream items.',
    })
  }

  return {
    dreamSeeds,
    dreams,
    selectedDream,
    dreamForm,
    dreamChats,
    chatForm,
    loading,
    chatsLoading,
    isSaving,
    isDeleting,
    isInitialized,
    error,
    currentUserId,
    activeDreams,
    publicDreams,
    ownedDreams,
    selectedDreamId,
    selectedDreamChats,
    selectedDreamCast,
    selectedDreamItems,
    selectedDreamTags,
    selectedDreamCurrentImage,
    selectedDreamCollectionArt,
    selectedDreamSummary,
    latestDreamChat,
    hasSelectedDream,
    randomDream,
    randomDreamSeed,
    initialize,
    fetchDreams,
    fetchOwnedDreams,
    fetchDreamById,
    createDream,
    updateDream,
    updateSelectedDream,
    deleteDream,
    fetchDreamChats,
    addDreamChat,
    addUserDreamMessage,
    addModelDreamMessage,
    saveDream,
    selectDream,
    selectDreamById,
    deselectDream,
    setDreamForm,
    setChatForm,
    clearChatForm,
    submitChatForm,
    startAddingDream,
    startEditingDream,
    startCloningDream,
    setRandomDreamVibe,
    setCurrentArt,
    setCurrentPrompt,
    setCurrentVibe,
    setDreamScenario,
    setDreamCast,
    setDreamItems,
    syncToLocalStorage,
    loadFromLocalStorage,
    toDreamForm,
    createDefaultDreamForm,
  }
})

export type { Dream }

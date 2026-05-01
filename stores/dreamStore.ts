// /stores/dreamStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type {
  Art,
  ArtCollection,
  ArtImage,
  Chat,
  Dream,
  Gallery,
  Pitch,
  Reaction,
  Scenario,
  Tag,
  User,
} from '~/prisma/generated/prisma/client'

export interface DreamForm extends Partial<Dream> {
  createCollection?: boolean
  tagIds?: number[]
  addArtToCollection?: boolean
}

export interface DreamChatForm extends Partial<Chat> {
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
  Tags?: Tag[]
  Chats?: DreamChatWithRelations[]
  Reactions?: Reaction[]
  _count?: {
    Chats?: number
    Reactions?: number
  }
}

export interface DreamChatWithRelations extends Chat {
  User?: Pick<User, 'id' | 'username' | 'avatarImage'> | null
  Prompt?: unknown | null
  ArtImage?: Partial<ArtImage> | null
  Reactions?: Reaction[]
}

const isClient = typeof window !== 'undefined'
const dreamsStorageKey = 'dreams'
const dreamFormStorageKey = 'dreamForm'
const selectedDreamStorageKey = 'selectedDream'
const dreamChatsStorageKey = 'dreamChats'

const dreamSeeds = [
  'Walking on a rainbow bridge across the sky',
  'Floating in a bubble through a city in the clouds',
  'Dancing with shadows in a moonlit forest',
  'Sailing on an ocean of stars',
  'Discovering a secret door in your home that leads to another world',
  'Riding a bicycle on a path made of stardust',
  'Having a picnic with talking animals in a meadow of giant flowers',
  'Exploring an underwater city inhabited by mermaids',
  'Flying with a flock of brightly colored birds over a landscape of floating islands',
  'Walking through a forest where the leaves are made of crystal',
  'Finding a magical book that brings any story you write in it to life',
  'Climbing a mountain that grows taller with each step you take',
  'Discovering a garden where every flower sings a different song',
  'Wandering through a maze made of mirrors in the middle of the desert',
  'Attending a grand ball where everyone is wearing masks of the moon and stars',
  'Finding an old map that leads to a hidden kingdom in the clouds',
  'Stumbling upon a city where all the buildings are made of glass',
  'Visiting a market where people trade in dreams and memories',
  'Exploring a castle made of clouds in the sky',
  'Walking on a path that appears in front of you with each step you take',
  'Finding a tree that grows different kinds of fruit each day',
  'Discovering a lake where each drop of water tells a different story',
  'Stumbling upon a carnival that appears only once every hundred years',
  'Finding a field where each blade of grass whispers a secret',
  'Exploring a forest where the trees are made of books',
  'Discovering a river that flows with music instead of water',
  'Climbing an infinite ladder that reaches past the clouds into the stars',
  'Participating in a race with tortoises riding on hares',
  'Landing on a planet where the inhabitants speak in colors rather than sounds',
  'Finding a pocket watch that can turn back time, but only for one minute a day',
  'Exploring an underground cavern where stalactites and stalagmites are musical notes',
  'Wandering through a city where the buildings sway and dance to unseen rhythms',
  'Visiting a zoo where the animals are actually people, and the people are the exhibits',
  'Trapped in a sandcastle with rooms that shift with the tides',
  'Being a part of a choir where each voice contributes a different flavor instead of a note',
  'Finding a hidden valley where the trees are shaped like giant chess pieces',
  'Discovering a mountain peak that touches the northern lights',
  "Traveling in a hot air balloon that's guided by your thoughts",
  'Stumbling upon a beach where each grain of sand holds a different memory',
  'Playing a piano that paints a picture with each note',
  'Exploring an amusement park where the rides are real adventures',
  "Attending a banquet where every dish tells a story from its ingredients' perspectives",
  'Venturing into a forest where the wildlife is made entirely of origami',
  'Landing on an asteroid where gravity is a mere suggestion',
  'Juggling planets in the vast cosmos, each spin generating a new weather pattern',
  'Sliding down a rainbow into a pot of golden ideas instead of gold',
  'Riding a roller coaster with tracks made of laughter and joy',
  'Discovering a playground where the see-saws balance ideas and the swings oscillate between seasons',
  'Visiting a library where books whisper their stories to you',
  'Sailing on a sea of honey, guided by bees to an island of wildflowers',
  'Strolling through a city where street signs sing directions and traffic lights dance in sync',
  'Drawing a door on a wall and stepping through it to find an enchanted garden',
  'Running in a field where the dandelions are tiny suns and the grass blades are emerald dancers',
  'Discovering a world where rainbows are bridges and thunderstorms are orchestras',
  'Blowing soap bubbles that encase entire dreamlike realities within them',
  'Sitting in a theater where the screen projects your thoughts and the popcorn tastes like emotions',
  'Stargazing on a beach where the stars are grains of sand and the sky is the ocean',
  'Drinking from a stream that quenches not just thirst, but the deepest curiosities',
  'Riding a train whose tracks are laid out by your own imagination',
  'Living in a house where each door opens to a different time period',
  'Being a musician in an orchestra where each instrument plays a different scent',
  'Planting a seed that grows into a tree with your favorite childhood memories as fruits',
  'Eating a slice of cloud-pie that tastes like the sky on a crisp morning',
  'Playing hide-and-seek with the shadows in a town where the sun never sets',
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

function fallbackDreamTitle() {
  return `Dream-${Date.now()}`
}

function fallbackDreamVibe() {
  return randomSeedDream()
}

function randomSeedDream(): string {
  const randomIndex = Math.floor(Math.random() * dreamSeeds.length)
  return (
    dreamSeeds[randomIndex] ??
    'A shared dream begins in a room full of impossible light.'
  )
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

  const selectedDreamCurrentImage = computed(() => {
    return (
      selectedDream.value?.Art?.imagePath ??
      selectedDream.value?.ArtImage?.fileName ??
      ''
    )
  })

  const selectedDreamCollectionArt = computed(() => {
    return selectedDream.value?.ArtCollection?.art ?? []
  })

  const latestDreamChat = computed(() => {
    return dreamChats.value.at(-1) ?? null
  })

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

  function setRandomDreamVibe() {
    const currentVibe = randomSeedDream()

    dreamForm.value = {
      ...dreamForm.value,
      currentVibe,
      currentPrompt: dreamForm.value.currentPrompt || currentVibe,
    }

    syncToLocalStorage()

    return currentVibe
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

  function upsertDream(dream: DreamWithRelations) {
    const index = dreams.value.findIndex((item) => item.id === dream.id)

    if (index === -1) {
      dreams.value.unshift(dream)
    } else {
      dreams.value[index] = dream
    }

    if (selectedDream.value?.id === dream.id) {
      selectedDream.value = dream
    }

    syncToLocalStorage()
  }

  function removeDreamFromState(id: number) {
    dreams.value = dreams.value.filter((dream) => dream.id !== id)

    if (selectedDream.value?.id === id) {
      selectedDream.value = null
      dreamForm.value = {}
      dreamChats.value = []
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

  async function fetchDreams(options?: {
    userOnly?: boolean
    showInactive?: boolean
    includeMature?: boolean
    artCollectionId?: number
    galleryId?: number
    scenarioId?: number
  }): Promise<DreamWithRelations[]> {
    loading.value = true
    setError('')

    try {
      const query = new URLSearchParams()

      if (options?.userOnly) query.set('userOnly', 'true')
      if (options?.showInactive) query.set('showInactive', 'true')
      if (options?.includeMature) query.set('includeMature', 'true')
      if (options?.artCollectionId) {
        query.set('artCollectionId', String(options.artCollectionId))
      }
      if (options?.galleryId) query.set('galleryId', String(options.galleryId))
      if (options?.scenarioId) {
        query.set('scenarioId', String(options.scenarioId))
      }

      const url = query.toString()
        ? `/api/dreams?${query.toString()}`
        : '/api/dreams'

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
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}`,
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || `Failed to fetch dream ${dreamId}.`)
      }

      upsertDream(res.data)

      if (selectAfterFetch) {
        selectedDream.value = res.data
        dreamForm.value = { ...res.data }
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
      const body: DreamForm = {
        title: payload.title?.trim() || fallbackDreamTitle(),
        currentVibe: payload.currentVibe?.trim() || fallbackDreamVibe(),
        currentPrompt:
          payload.currentPrompt ?? payload.currentVibe ?? fallbackDreamVibe(),
        description: payload.description ?? null,
        slug: payload.slug ?? null,
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
        createCollection: payload.createCollection ?? false,
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
      dreamForm.value = { ...res.data }
      dreamChats.value = res.data.Chats ?? []

      syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (createError) {
      handleError(createError, 'creating dream')
      setError((createError as Error).message)
      return {
        success: false,
        message: (createError as Error).message,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function updateDream(id: number, updates: DreamForm) {
    const dreamId = normalizeId(id)
    if (!dreamId) {
      return { success: false, message: 'Invalid dream ID.' }
    }

    isSaving.value = true
    setError('')

    try {
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || `Failed to update dream ${dreamId}.`)
      }

      upsertDream(res.data)
      dreamForm.value = { ...res.data }

      syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (updateError) {
      handleError(updateError, 'updating dream')
      setError((updateError as Error).message)
      return {
        success: false,
        message: (updateError as Error).message,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteDream(id: number) {
    const dreamId = normalizeId(id)
    if (!dreamId) {
      return { success: false, message: 'Invalid dream ID.' }
    }

    isDeleting.value = true
    setError('')

    try {
      const res = await performFetch<DreamWithRelations>(
        `/api/dreams/${dreamId}`,
        {
          method: 'DELETE',
        },
      )

      if (!res.success) {
        throw new Error(res.message || `Failed to delete dream ${dreamId}.`)
      }

      removeDreamFromState(dreamId)

      return { success: true, data: res.data }
    } catch (deleteError) {
      handleError(deleteError, 'deleting dream')
      setError((deleteError as Error).message)
      return {
        success: false,
        message: (deleteError as Error).message,
      }
    } finally {
      isDeleting.value = false
    }
  }

  async function fetchDreamChats(id = selectedDreamId.value, limit = 100) {
    const dreamId = normalizeId(id)
    if (!dreamId) return []

    chatsLoading.value = true
    setError('')

    try {
      const res = await performFetch<DreamChatWithRelations[]>(
        `/api/dreams/${dreamId}/chats?limit=${limit}`,
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

  async function addDreamChat(
    dreamId: number,
    payload: DreamChatForm,
  ): Promise<{
    success: boolean
    data?: DreamChatWithRelations
    message?: string
  }> {
    const normalizedDreamId = normalizeId(dreamId)
    if (!normalizedDreamId) {
      return { success: false, message: 'Invalid dream ID.' }
    }

    isSaving.value = true
    setError('')

    try {
      const body: DreamChatForm = {
        ...payload,
        userId: currentUserId.value,
        type: payload.type ?? 'Dream',
        content: payload.content?.trim(),
      }

      if (!body.content) {
        throw new Error('Dream chat content is required.')
      }

      const res = await performFetch<DreamChatWithRelations>(
        `/api/dreams/${normalizedDreamId}/chats`,
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

      if (payload.updateDream) {
        await fetchDreamById(normalizedDreamId, true)
      } else {
        syncToLocalStorage()
      }

      return { success: true, data: res.data }
    } catch (chatError) {
      handleError(chatError, 'creating dream chat')
      setError((chatError as Error).message)
      return {
        success: false,
        message: (chatError as Error).message,
      }
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
    options?: {
      botResponse?: string
      currentVibe?: string
      currentPrompt?: string | null
      promptId?: number | null
      artImageId?: number | null
      artId?: number | null
      serverId?: number | null
      serverName?: string | null
      updateDream?: boolean
      addArtToCollection?: boolean
      dreamId?: number | null
    },
  ) {
    const id = normalizeId(options?.dreamId ?? selectedDreamId.value)
    if (!id) return { success: false, message: 'No dream selected.' }

    return await addDreamChat(id, {
      type: 'BotResponse',
      sender: 'Dream',
      content,
      botResponse: options?.botResponse ?? content,
      currentVibe: options?.currentVibe,
      currentPrompt: options?.currentPrompt,
      promptId: options?.promptId ?? null,
      artImageId: options?.artImageId ?? null,
      artId: options?.artId ?? null,
      serverId: options?.serverId ?? null,
      serverName: options?.serverName ?? null,
      updateDream: options?.updateDream ?? false,
      addArtToCollection: options?.addArtToCollection ?? false,
      isPublic: selectedDream.value?.isPublic ?? true,
      isMature: selectedDream.value?.isMature ?? false,
    })
  }

  async function updateSelectedDream(updates: DreamForm) {
    if (!selectedDream.value?.id) {
      return { success: false, message: 'No dream selected.' }
    }

    return await updateDream(selectedDream.value.id, updates)
  }

  async function saveDream() {
    if (!dreamForm.value) {
      return { success: false, message: 'No dream form loaded.' }
    }

    if (dreamForm.value.id) {
      return await updateDream(dreamForm.value.id, dreamForm.value)
    }

    return await createDream(dreamForm.value)
  }

  function selectDream(id: number) {
    const dreamId = normalizeId(id)
    if (!dreamId) return null

    const found = dreams.value.find((dream) => dream.id === dreamId)
    if (!found) return null

    selectedDream.value = found
    dreamForm.value = { ...found }
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

  function createNewDream(overrides: DreamForm = {}) {
    const currentVibe = overrides.currentVibe ?? fallbackDreamVibe()

    dreamForm.value = {
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
      tagIds: overrides.tagIds ?? [],
    }

    selectedDream.value = null
    dreamChats.value = []
    chatForm.value = {}
    syncToLocalStorage()
  }

  function setDreamForm(updates: DreamForm) {
    dreamForm.value = {
      ...dreamForm.value,
      ...updates,
    }

    syncToLocalStorage()
  }

  function setChatForm(updates: DreamChatForm) {
    chatForm.value = {
      ...chatForm.value,
      ...updates,
    }

    syncToLocalStorage()
  }

  function clearChatForm() {
    chatForm.value = {}
    syncToLocalStorage()
  }

  async function submitChatForm() {
    if (!selectedDream.value?.id) {
      return { success: false, message: 'No dream selected.' }
    }

    const result = await addDreamChat(selectedDream.value.id, chatForm.value)

    if (result.success) clearChatForm()

    return result
  }

  async function setCurrentArt(art: {
    id: number
    artImageId?: number | null
    imagePath?: string | null
  }) {
    if (!selectedDream.value?.id) {
      return { success: false, message: 'No dream selected.' }
    }

    return await updateDream(selectedDream.value.id, {
      artId: art.id,
      artImageId: art.artImageId ?? null,
      addArtToCollection: true,
    })
  }

  async function setCurrentPrompt(prompt: string) {
    if (!selectedDream.value?.id) {
      return { success: false, message: 'No dream selected.' }
    }

    return await updateDream(selectedDream.value.id, {
      currentPrompt: prompt,
    })
  }

  async function setCurrentVibe(currentVibe: string) {
    if (!selectedDream.value?.id) {
      return { success: false, message: 'No dream selected.' }
    }

    return await updateDream(selectedDream.value.id, {
      currentVibe,
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
    selectedDreamCurrentImage,
    selectedDreamCollectionArt,
    latestDreamChat,
    hasSelectedDream,
    randomDream,
    randomDreamSeed,
    setRandomDreamVibe,
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
    createNewDream,
    setDreamForm,
    setChatForm,
    clearChatForm,
    submitChatForm,
    setCurrentArt,
    setCurrentPrompt,
    setCurrentVibe,
    syncToLocalStorage,
    loadFromLocalStorage,
  }
})

export type { Dream, Chat }

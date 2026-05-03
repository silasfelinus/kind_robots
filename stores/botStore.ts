// /stores/botStore.ts
import { defineStore } from 'pinia'
import { computed, ref, watch, type Ref } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import {
  updateBot,
  addBot,
  addBots,
  deleteBot,
  getBotById,
  botImage,
  seedBotsHelper,
} from './helpers/botHelper'
import { performFetch, handleError } from './utils'
import { useServerStore } from './serverStore'
import { useUserStore } from './userStore'

export interface BotForm extends Partial<Bot> {
  serverId?: number | null
  serverName?: string | null
}

type BotInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  initializeServerStore?: boolean
  createBlankForm?: boolean
}

type BotSaveResult = {
  success: boolean
  message: string
  data?: Bot | null
}

const isClient = typeof window !== 'undefined'
const botsStorageKey = 'bots'
const botFormStorageKey = 'botForm'
const currentBotStorageKey = 'currentBot'
const currentImagePathStorageKey = 'currentImagePath'
const botPlaceholder = '/images/bot.webp'

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

function safeParseObject<T>(raw: string | null): T | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

function safeParseBotArray(raw: string | null): Bot[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Bot[]) : []
  } catch {
    return []
  }
}

function sortBots(a: Bot, b: Bot): number {
  return (a.name || '').localeCompare(b.name || '')
}

function normalizeBotId(input: number | string | Bot | null | undefined) {
  if (typeof input === 'number') return Number.isInteger(input) ? input : 0

  if (typeof input === 'string') {
    const id = Number(input)
    return Number.isInteger(id) ? id : 0
  }

  if (input && typeof input === 'object' && 'id' in input) {
    const id = Number(input.id)
    return Number.isInteger(id) ? id : 0
  }

  return 0
}

export const useBotStore = defineStore('botStore', () => {
  const bots: Ref<Bot[]> = ref([])
  const currentBot: Ref<Bot | null> = ref(null)
  const botForm: Ref<BotForm> = ref({})
  const currentImagePath = ref('')
  const loading = ref(false)
  const isLoaded = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const isSaving = ref(false)
  const lastError = ref<string | null>(null)

  const pendingLaunchMessage = ref('')

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchBotsPromise = ref<Promise<Bot[]> | null>(null)
  const loadBotByIdPromises = ref<Record<number, Promise<Bot | null>>>({})
  const botImagePromises = ref<Record<number, Promise<string>>>({})

  const serverStore = useServerStore()

  const totalBots = computed<number>(() => bots.value.length)

  const selectedBotId = computed<number | null>(() => currentBot.value?.id ?? null)

  const selectedBot = computed(() => currentBot.value)

  const error = computed(() => lastError.value)

  const hasUnsavedChanges = computed<boolean>(() => {
    return JSON.stringify(currentBot.value ?? {}) !== JSON.stringify(botForm.value)
  })

  const ownedBots = computed<Bot[]>(() => {
    const userStore = useUserStore()

    return bots.value.filter((bot: Bot) => bot.userId === userStore.userId)
  })

  const publicBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => Boolean(bot.isPublic))
  })

  const readyBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => !bot.underConstruction)
  })

  const visibleBots = computed<Bot[]>(() => {
    const userStore = useUserStore()

    return bots.value.filter((bot) => {
      return Boolean(bot.isPublic) || bot.userId === userStore.userId || userStore.isAdmin
    })
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function persist(): void {
    safeSetLocalStorage(botsStorageKey, JSON.stringify(bots.value))
    safeSetLocalStorage(botFormStorageKey, JSON.stringify(botForm.value))
    safeSetLocalStorage(currentImagePathStorageKey, currentImagePath.value)

    if (currentBot.value) {
      safeSetLocalStorage(currentBotStorageKey, JSON.stringify(currentBot.value))
    } else {
      safeRemoveLocalStorage(currentBotStorageKey)
    }
  }

  function hydrateFromLocalStorage(): void {
    bots.value = safeParseBotArray(safeGetLocalStorage(botsStorageKey)).sort(
      sortBots,
    )

    botForm.value =
      safeParseObject<BotForm>(safeGetLocalStorage(botFormStorageKey)) ?? {}

    currentBot.value = safeParseObject<Bot>(
      safeGetLocalStorage(currentBotStorageKey),
    )

    currentImagePath.value =
      safeGetLocalStorage(currentImagePathStorageKey) || ''

    if (
      currentBot.value &&
      !bots.value.some((bot: Bot) => bot.id === currentBot.value?.id)
    ) {
      bots.value.push(currentBot.value)
      bots.value.sort(sortBots)
    }
  }

  function normalizeBotForm(input: Partial<BotForm> = {}): BotForm {
    const activeTextServer = serverStore.activeTextServer

    return {
      ...input,
      serverId: input.serverId ?? activeTextServer?.id ?? null,
      serverName: input.serverName ?? activeTextServer?.title ?? null,
    }
  }

  function createDefaultBotForm(overrides: Partial<BotForm> = {}): BotForm {
    const userStore = useUserStore()
    const activeTextServer = serverStore.activeTextServer

    return normalizeBotForm({
      name: '',
      subtitle: '',
      description: '',
      botIntro: '',
      userIntro: '',
      prompt: '',
      personality: '',
      tagline: '',
      avatarImage: '',
      theme: '',
      modules: '',
      sampleResponse: '',
      trainingPath: '',
      BotType: 'assistant',
      isPublic: false,
      underConstruction: false,
      canDelete: true,
      designer: userStore.user?.username || '',
      userId: userStore.userId || userStore.user?.id || null,
      serverId: activeTextServer?.id ?? null,
      serverName: activeTextServer?.title ?? null,
      ...overrides,
    })
  }

  function toBotForm(bot: Bot): BotForm {
    return normalizeBotForm({
      ...bot,
      serverId: bot.serverId ?? null,
      serverName: bot.serverName ?? null,
    })
  }

  function setBotForm(updates: Partial<BotForm>): void {
    botForm.value = normalizeBotForm({
      ...botForm.value,
      ...updates,
    })

    if (typeof updates.avatarImage === 'string') {
      currentImagePath.value = updates.avatarImage
    }

    persist()
  }

  function upsertBot(bot: Bot): void {
    const index = bots.value.findIndex((entry: Bot) => entry.id === bot.id)

    if (index >= 0) {
      bots.value.splice(index, 1, bot)
    } else {
      bots.value.push(bot)
    }

    bots.value.sort(sortBots)
    persist()
  }

async function generateFields(fieldsToUpgrade: string[]) {
  loading.value = true

  try {
    clearError()

    const response = await performFetch<Partial<Bot>>('/api/bot/generate', {
      method: 'POST',
      body: JSON.stringify({
        bot: botForm.value,
        fieldsToUpgrade,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data) {
      setBotForm(response.data)

      return {
        success: true,
        message: `Updated ${fieldsToUpgrade.length} bot field${
          fieldsToUpgrade.length === 1 ? '' : 's'
        }.`,
        data: response.data,
      }
    }

    throw new Error(response.message || 'Failed to generate bot fields')
  } catch (error: unknown) {
    handleError(error, 'generating bot fields')
    setLastError(error, 'Failed to generate bot fields')

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to generate bot fields',
      data: null,
    }
  } finally {
    loading.value = false
  }
}

  function removeBotLocally(id: number): void {
    bots.value = bots.value.filter((bot: Bot) => bot.id !== id)

    if (currentBot.value?.id === id) {
      currentBot.value = null
      botForm.value = {}
      currentImagePath.value = ''
      pendingLaunchMessage.value = ''
    }

    persist()
  }

  function setPendingLaunchMessage(message: string): void {
    pendingLaunchMessage.value = message
  }

  function clearPendingLaunchMessage(): void {
    pendingLaunchMessage.value = ''
  }

  function startAddingBot(overrides: Partial<BotForm> = {}): void {
    currentBot.value = null
    botForm.value = createDefaultBotForm(overrides)
    currentImagePath.value = botForm.value.avatarImage || ''
    pendingLaunchMessage.value = ''
    persist()
  }

  async function startEditingBot(input?: number | string | Bot): Promise<Bot | null> {
    const botId = normalizeBotId(input ?? currentBot.value)

    if (!botId) {
      startAddingBot()
      return null
    }

    const bot =
      bots.value.find((entry) => entry.id === botId) ??
      (await loadBotById(botId))

    if (!bot) {
      setLastError(new Error(`Bot ${botId} was not found.`), 'Bot was not found')
      return null
    }

    currentBot.value = bot
    botForm.value = toBotForm(bot)
    currentImagePath.value = bot.avatarImage || ''
    pendingLaunchMessage.value = ''
    persist()

    return bot
  }

  async function startCloningBot(
    input: number | string | Bot,
    overrides: Partial<BotForm> = {},
  ): Promise<Bot | null> {
    const botId = normalizeBotId(input)

    if (!botId) return null

    const source =
      bots.value.find((entry) => entry.id === botId) ??
      (await loadBotById(botId))

    if (!source) {
      setLastError(new Error(`Bot ${botId} was not found.`), 'Bot was not found')
      return null
    }

    const userStore = useUserStore()

    currentBot.value = null
    botForm.value = normalizeBotForm({
      ...toBotForm(source),
      ...overrides,
      id: undefined,
      name: `Copy of ${source.name || 'Unnamed Bot'}`,
      userId: overrides.userId ?? userStore.userId ?? null,
      isPublic: overrides.isPublic ?? false,
      canDelete: true,
      underConstruction: source.underConstruction ?? false,
    })
    currentImagePath.value = botForm.value.avatarImage || source.avatarImage || ''
    pendingLaunchMessage.value = ''
    persist()

    return source
  }

  function createNewBot(): void {
    startAddingBot()
  }

  async function initialize(options: BotInitializeOptions = {}): Promise<void> {
    const wantsRemoteFetch = options.fetchRemote === true
    const needsRemoteFetch =
      wantsRemoteFetch && (!isLoaded.value || Boolean(options.force))

    if (initializePromise.value && !options.force) {
      await initializePromise.value

      if (needsRemoteFetch) {
        await fetchBots(false)
      }

      return
    }

    if (isInitialized.value && !options.force && !needsRemoteFetch) {
      return
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        hydrateFromLocalStorage()

        if (options.initializeServerStore !== false) {
          await serverStore.initialize({
            fetchRemote: true,
          })
        }

        if (wantsRemoteFetch) {
          await fetchBots(Boolean(options.force))
        }

        if (
          options.createBlankForm !== false &&
          !currentBot.value &&
          Object.keys(botForm.value).length === 0
        ) {
          startAddingBot()
        }

        isInitialized.value = true
      } catch (error: unknown) {
        handleError(error, 'initializing bot store')
        setLastError(error, 'Failed to initialize bot store')
        isInitialized.value = false
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchBots(force = false): Promise<Bot[]> {
    if (!force && isLoaded.value && bots.value.length > 0) {
      return bots.value
    }

    if (fetchBotsPromise.value && !force) {
      return fetchBotsPromise.value
    }

    fetchBotsPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const response = await performFetch<Bot[]>('/api/bots')

        if (response.success && Array.isArray(response.data)) {
          bots.value = response.data.slice().sort(sortBots)
          isLoaded.value = true
          persist()

          return bots.value
        }

        throw new Error(response.message || 'Failed to fetch bots')
      } catch (error: unknown) {
        handleError(error, 'fetching bots')
        setLastError(error, 'Failed to fetch bots')

        return bots.value
      } finally {
        loading.value = false
        fetchBotsPromise.value = null
      }
    })()

    return fetchBotsPromise.value
  }

  async function selectBot(input: number | string | Bot): Promise<Bot | null> {
    const botId = normalizeBotId(input)

    if (!botId) return null

    if (currentBot.value?.id === botId) return currentBot.value

    const found =
      bots.value.find((bot: Bot) => bot.id === botId) ??
      (await loadBotById(botId))

    if (!found) {
      handleError(`Bot ID ${botId} not found`, 'selecting bot')
      setLastError(new Error(`Bot ID ${botId} not found`), 'Bot not found')
      return null
    }

    currentBot.value = found
    botForm.value = toBotForm(found)
    currentImagePath.value = found.avatarImage || ''
    persist()

    return found
  }

  function revertBotForm(): void {
    if (!currentBot.value) return

    botForm.value = toBotForm(currentBot.value)
    currentImagePath.value = currentBot.value.avatarImage || ''
    persist()
  }

  function deselectBot(): void {
    currentBot.value = null
    botForm.value = {}
    currentImagePath.value = ''
    pendingLaunchMessage.value = ''
    persist()
  }

  async function updateCurrentBot(): Promise<Bot | null> {
    if (!currentBot.value) {
      handleError('No current bot', 'updateCurrentBot')
      setLastError(new Error('No current bot'), 'No current bot')
      return null
    }

    loading.value = true

    try {
      clearError()

      const updated = await updateBot(
        currentBot.value.id,
        normalizeBotForm(botForm.value),
        currentImagePath.value,
      )

      if (updated) {
        upsertBot(updated)
        currentBot.value = updated
        botForm.value = toBotForm(updated)
        currentImagePath.value = updated.avatarImage || ''
        persist()
      }

      return updated
    } catch (error: unknown) {
      handleError(error, 'updateCurrentBot')
      setLastError(error, 'Failed to update bot')
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveUserIntro(newUserIntro: string): Promise<void> {
    if (!currentBot.value) return

    botForm.value.userIntro = newUserIntro
    await updateCurrentBot()
  }

  async function saveBot(): Promise<BotSaveResult> {
    isSaving.value = true

    try {
      clearError()

      const saved =
        typeof botForm.value.id === 'number'
          ? await updateCurrentBot()
          : await addSingleBot(botForm.value)

      if (!saved) {
        throw new Error(lastError.value || 'Failed to save bot')
      }

      currentBot.value = saved
      botForm.value = toBotForm(saved)
      currentImagePath.value = saved.avatarImage || ''
      persist()

      return {
        success: true,
        message: botForm.value.id ? 'Bot updated.' : 'Bot created.',
        data: saved,
      }
    } catch (error: unknown) {
      handleError(error, 'saveBot')
      setLastError(error, 'Failed to save bot')

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save bot',
        data: null,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteBotById(id: number) {
    loading.value = true

    try {
      clearError()

      const success = await deleteBot(id)

      if (success) {
        removeBotLocally(id)

        if (!currentBot.value && Object.keys(botForm.value).length === 0) {
          startAddingBot()
        }

        return {
          success: true,
          message: 'Bot deleted.',
        }
      }

      throw new Error('Failed to delete bot')
    } catch (error: unknown) {
      handleError(error, 'deleteBotById')
      setLastError(error, 'Failed to delete bot')

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete bot',
      }
    } finally {
      loading.value = false
    }
  }

  async function addBotsToStore(newBots: Partial<BotForm>[]): Promise<Bot[]> {
    loading.value = true

    try {
      clearError()

      const normalizedBots = newBots.map((bot: Partial<BotForm>) =>
        normalizeBotForm(bot),
      )

      const added = await addBots(normalizedBots)

      for (const bot of added) {
        upsertBot(bot)
      }

      return added
    } catch (error: unknown) {
      handleError(error, 'addBotsToStore')
      setLastError(error, 'Failed to add bots')
      return []
    } finally {
      loading.value = false
    }
  }

  async function addSingleBot(botData: Partial<BotForm>): Promise<Bot | null> {
    loading.value = true

    try {
      clearError()

      const payload: Partial<BotForm> = normalizeBotForm({
        ...botData,
        avatarImage: currentImagePath.value || botData.avatarImage || '',
      })

      const newBot = await addBot(payload)

      if (newBot) {
        upsertBot(newBot)
      }

      return newBot
    } catch (error: unknown) {
      handleError(error, 'addSingleBot')
      setLastError(error, 'Failed to add bot')
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadBotById(id: number): Promise<Bot | null> {
    const cached = bots.value.find((bot: Bot) => bot.id === id)

    if (cached) {
      currentBot.value = cached
      botForm.value = toBotForm(cached)
      currentImagePath.value = cached.avatarImage ?? ''
      persist()
      return cached
    }

    if (loadBotByIdPromises.value[id]) {
      return loadBotByIdPromises.value[id]
    }

    loadBotByIdPromises.value[id] = (async () => {
      loading.value = true

      try {
        clearError()

        const bot = await getBotById(id)

        if (bot) {
          upsertBot(bot)
          currentBot.value = bot
          botForm.value = toBotForm(bot)
          currentImagePath.value = bot.avatarImage ?? ''
          persist()
        }

        return bot
      } catch (error: unknown) {
        handleError(error, 'loadBotById')
        setLastError(error, 'Failed to load bot')
        return null
      } finally {
        loading.value = false
        delete loadBotByIdPromises.value[id]
      }
    })()

    return loadBotByIdPromises.value[id]
  }

  function getBotFromStore(id: number): Bot | null {
    return bots.value.find((bot) => bot.id === id) ?? null
  }

  async function getBotImage(botId: number): Promise<string> {
    const bot = bots.value.find((entry: Bot) => entry.id === botId)

    if (!bot) {
      return botPlaceholder
    }

    if (botImagePromises.value[botId]) {
      return botImagePromises.value[botId]
    }

    botImagePromises.value[botId] = (async () => {
      try {
        return await botImage(bot)
      } catch (error: unknown) {
        handleError(error, 'getBotImage')
        return botPlaceholder
      } finally {
        delete botImagePromises.value[botId]
      }
    })()

    return botImagePromises.value[botId]
  }

  async function seedBots(): Promise<void> {
    loading.value = true

    try {
      clearError()

      const seeds = await seedBotsHelper()
      await addBotsToStore(seeds as Partial<BotForm>[])
      await fetchBots(true)
    } catch (error: unknown) {
      handleError(error, 'seeding bots')
      setLastError(error, 'Failed to seed bots')
    } finally {
      loading.value = false
    }
  }

  function setBotServer(serverId: number | null): void {
    botForm.value.serverId = serverId

    if (typeof serverId !== 'number') {
      botForm.value.serverName = null
      persist()
      return
    }

    const server = serverStore.getServerById(serverId)
    botForm.value.serverName = server?.title || null
    persist()
  }

  function applyActiveTextServer(): void {
    const server = serverStore.activeTextServer
    botForm.value.serverId = server?.id ?? null
    botForm.value.serverName = server?.title ?? null
    persist()
  }

  function setCurrentImagePath(path: string): void {
    currentImagePath.value = path
    botForm.value.avatarImage = path
    persist()
  }

  function resetInitialization(): void {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchBotsPromise.value = null
    loadBotByIdPromises.value = {}
    botImagePromises.value = {}
    lastError.value = null
  }

  watch(
    () => botForm.value.serverId,
    (serverId: number | null | undefined) => {
      if (typeof serverId !== 'number') {
        if (botForm.value.serverName !== null) {
          botForm.value.serverName = null
        }

        return
      }

      const server = serverStore.getServerById(serverId)
      const nextServerName = server?.title || null

      if (botForm.value.serverName !== nextServerName) {
        botForm.value.serverName = nextServerName
      }
    },
    { immediate: false },
  )

  return {
    bots,
    currentBot,
    selectedBot,
    botForm,
    currentImagePath,
    loading,
    isSaving,
    isLoaded,
    isInitialized,
    isInitializing,
    lastError,
    error,
    pendingLaunchMessage,
    initializePromise,
    fetchBotsPromise,
    loadBotByIdPromises,
    botImagePromises,

    totalBots,
    selectedBotId,
    hasUnsavedChanges,
    ownedBots,
    publicBots,
    readyBots,
    visibleBots,

    setPendingLaunchMessage,
    clearPendingLaunchMessage,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    persist,

    fetchBots,
    loadBotById,
    selectBot,
    deselectBot,
    revertBotForm,

    startAddingBot,
    startEditingBot,
    startCloningBot,
    createNewBot,
    createDefaultBotForm,
    toBotForm,
    normalizeBotForm,
    setBotForm,

    updateCurrentBot,
    saveUserIntro,
    saveBot,
    deleteBotById,
    addBotsToStore,
    addSingleBot,
    getBotImage,
    getBotFromStore,
    seedBots,
    setBotServer,
    applyActiveTextServer,
    setCurrentImagePath,

    getBotById,
    updateBot,
    addBot,
    addBots,
    generateFields,
  }
})

export type { Bot }
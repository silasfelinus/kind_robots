// /stores/botStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, type Ref } from 'vue'
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

const isClient = typeof window !== 'undefined'
const botsStorageKey = 'bots'
const botFormStorageKey = 'botForm'
const currentBotStorageKey = 'currentBot'
const currentImagePathStorageKey = 'currentImagePath'

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
  return a.name.localeCompare(b.name)
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
  const lastError = ref<string | null>(null)

  const pendingLaunchMessage = ref('')

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchBotsPromise = ref<Promise<Bot[]> | null>(null)
  const loadBotByIdPromises = ref<Record<number, Promise<Bot | null>>>({})
  const botImagePromises = ref<Record<number, Promise<string>>>({})

  const serverStore = useServerStore()

  const totalBots = computed<number>(() => bots.value.length)

  const selectedBotId = computed<number | null>(
    () => currentBot.value?.id ?? null,
  )

  const hasUnsavedChanges = computed<boolean>(() => {
    return (
      JSON.stringify(currentBot.value ?? {}) !== JSON.stringify(botForm.value)
    )
  })

  const ownedBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => typeof bot.userId === 'number')
  })

  const publicBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => Boolean(bot.isPublic))
  })

  const readyBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => !bot.underConstruction)
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
    safeSetLocalStorage(currentBotStorageKey, JSON.stringify(currentBot.value))
    safeSetLocalStorage(currentImagePathStorageKey, currentImagePath.value)
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

  function removeBotLocally(id: number): void {
    bots.value = bots.value.filter((bot: Bot) => bot.id !== id)

    if (currentBot.value?.id === id) {
      currentBot.value = null
      botForm.value = {}
      currentImagePath.value = ''
    }

    persist()
  }

  function normalizeBotForm(input: Partial<BotForm> = {}): BotForm {
    const activeTextServer = serverStore.activeTextServer

    return {
      ...input,
      serverId: input.serverId ?? activeTextServer?.id ?? null,
      serverName: input.serverName ?? activeTextServer?.title ?? null,
    }
  }

  function setPendingLaunchMessage(message: string): void {
    pendingLaunchMessage.value = message
  }

  function clearPendingLaunchMessage(): void {
    pendingLaunchMessage.value = ''
  }

  function createNewBot(): void {
    const activeTextServer = serverStore.activeTextServer

    botForm.value = {
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
      designer: '',
      serverId: activeTextServer?.id ?? null,
      serverName: activeTextServer?.title ?? null,
    }

    currentBot.value = null
    currentImagePath.value = ''
    pendingLaunchMessage.value = ''
    persist()
  }

  async function initialize(options: BotInitializeOptions = {}): Promise<void> {
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        hydrateFromLocalStorage()

        if (options.initializeServerStore !== false) {
          await serverStore.initialize()
        }

        if (options.fetchRemote) {
          await fetchBots(Boolean(options.force))
        }

        if (
          options.createBlankForm !== false &&
          !currentBot.value &&
          Object.keys(botForm.value).length === 0
        ) {
          createNewBot()
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
    if (!force && isLoaded.value && bots.value.length) return bots.value
    if (fetchBotsPromise.value && !force) return fetchBotsPromise.value

    fetchBotsPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const response = await performFetch<Bot[]>('/api/bots')

        if (response.success && response.data) {
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

  async function selectBot(botId: number): Promise<void> {
    if (currentBot.value?.id === botId) return

    const found = bots.value.find((bot: Bot) => bot.id === botId)

    if (!found) {
      const fetched = await loadBotById(botId)

      if (!fetched) {
        handleError(`Bot ID ${botId} not found`, 'selecting bot')
        return
      }

      return
    }

    currentBot.value = found
    botForm.value = normalizeBotForm(found as BotForm)
    currentImagePath.value = found.avatarImage || ''
    persist()
  }

  function revertBotForm(): void {
    if (!currentBot.value) return

    botForm.value = normalizeBotForm(currentBot.value as BotForm)
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
      return null
    }

    loading.value = true

    try {
      clearError()

      const updated = await updateBot(
        currentBot.value.id,
        botForm.value,
        currentImagePath.value,
      )

      if (updated) {
        upsertBot(updated)
        currentBot.value = updated
        botForm.value = normalizeBotForm(updated as BotForm)
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

  async function saveBot(): Promise<Bot | null> {
    if (typeof botForm.value.id === 'number') {
      return await updateCurrentBot()
    }

    const created = await addSingleBot(botForm.value)

    if (created) {
      currentBot.value = created
      botForm.value = normalizeBotForm(created as BotForm)
      currentImagePath.value = created.avatarImage || ''
      persist()
    }

    return created
  }

  async function deleteBotById(id: number): Promise<boolean> {
    loading.value = true

    try {
      clearError()

      const success = await deleteBot(id)

      if (success) {
        removeBotLocally(id)

        if (!currentBot.value && Object.keys(botForm.value).length === 0) {
          createNewBot()
        }
      }

      return success
    } catch (error: unknown) {
      handleError(error, 'deleteBotById')
      setLastError(error, 'Failed to delete bot')
      return false
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
      botForm.value = normalizeBotForm(cached as BotForm)
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
          botForm.value = normalizeBotForm(bot as BotForm)
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

  async function getBotImage(botId: number): Promise<string> {
    const bot = bots.value.find((entry: Bot) => entry.id === botId)

    if (!bot) {
      return '/images/bot.webp'
    }

    if (botImagePromises.value[botId]) {
      return botImagePromises.value[botId]
    }

    botImagePromises.value[botId] = (async () => {
      try {
        return await botImage(bot)
      } catch (error: unknown) {
        handleError(error, 'getBotImage')
        return '/images/bot.webp'
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
    botForm,
    currentImagePath,
    loading,
    isLoaded,
    isInitialized,
    isInitializing,
    lastError,
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

    setPendingLaunchMessage,
    clearPendingLaunchMessage,
    selectBot,
    revertBotForm,
    deselectBot,
    createNewBot,
    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    fetchBots,
    updateCurrentBot,
    saveUserIntro,
    saveBot,
    deleteBotById,
    addBotsToStore,
    addSingleBot,
    loadBotById,
    getBotImage,
    seedBots,
    setBotServer,
    applyActiveTextServer,

    getBotById,
    updateBot,
    addBot,
    addBots,
  }
})

export type { Bot }

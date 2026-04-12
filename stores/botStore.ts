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

export const useBotStore = defineStore('botStore', () => {
  const bots: Ref<Bot[]> = ref([])
  const currentBot: Ref<Bot | null> = ref(null)
  const botForm: Ref<BotForm> = ref({})
  const currentImagePath = ref('')
  const loading = ref(false)
  const isLoaded = ref(false)

  const serverStore = useServerStore()

  const totalBots = computed<number>(() => bots.value.length)

  const selectedBotId = computed<number | null>(
    () => currentBot.value?.id ?? null,
  )

  const hasUnsavedChanges = computed<boolean>(() => {
    return JSON.stringify(currentBot.value) !== JSON.stringify(botForm.value)
  })

  const ownedBots = computed<Bot[]>(() => {
    return bots.value.filter((bot: Bot) => typeof bot.userId === 'number')
  })

  watch(
    () => botForm.value.serverId,
    (serverId: number | null | undefined) => {
      if (typeof serverId !== 'number') {
        botForm.value.serverName = null
        return
      }

      const server = serverStore.getServerById(serverId)
      botForm.value.serverName = server?.title || null
    },
    { immediate: true },
  )

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
  }

  async function selectBot(botId: number): Promise<void> {
    if (currentBot.value?.id === botId) return

    const found = bots.value.find((bot: Bot) => bot.id === botId)
    if (!found) {
      handleError(`Bot ID ${botId} not found`, 'selecting bot')
      return
    }

    currentBot.value = found
    botForm.value = {
      ...found,
      serverId:
        (found as BotForm).serverId ?? serverStore.activeTextServer?.id ?? null,
      serverName:
        (found as BotForm).serverName ??
        serverStore.activeTextServer?.title ??
        null,
    }
    currentImagePath.value = found.avatarImage || ''
  }

  function revertBotForm(): void {
    if (!currentBot.value) return

    botForm.value = {
      ...currentBot.value,
      serverId:
        (currentBot.value as BotForm).serverId ??
        serverStore.activeTextServer?.id ??
        null,
      serverName:
        (currentBot.value as BotForm).serverName ??
        serverStore.activeTextServer?.title ??
        null,
    }
  }

  function deselectBot(): void {
    currentBot.value = null
    botForm.value = {}
    currentImagePath.value = ''
  }

  async function fetchBots(force = false): Promise<void> {
    if (isLoaded.value && !force) return

    loading.value = true

    try {
      const response = await performFetch<Bot[]>('/api/bots')
      if (response.success && response.data) {
        bots.value = response.data
        isLoaded.value = true
      } else if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bots')
      }
    } catch (error: unknown) {
      handleError(error, 'fetching bots')
    } finally {
      loading.value = false
    }
  }

  async function initialize(): Promise<void> {
    if (isLoaded.value || loading.value) return

    loading.value = true

    try {
      await serverStore.initialize()
      await fetchBots()

      if (!currentBot.value && Object.keys(botForm.value).length === 0) {
        createNewBot()
      }
    } catch (error: unknown) {
      handleError(error, 'initializing bot store')
    } finally {
      loading.value = false
    }
  }

  async function updateCurrentBot(): Promise<Bot | null> {
    if (!currentBot.value) {
      handleError('No current bot', 'updateCurrentBot')
      return null
    }

    const updated = await updateBot(
      currentBot.value.id,
      botForm.value,
      currentImagePath.value,
    )

    if (updated) {
      const index = bots.value.findIndex((bot: Bot) => bot.id === updated.id)
      if (index !== -1) {
        bots.value[index] = updated
      } else {
        bots.value.push(updated)
      }

      currentBot.value = updated
      botForm.value = { ...updated }
      currentImagePath.value = updated.avatarImage || ''
    }

    return updated
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
      botForm.value = { ...created }
      currentImagePath.value = created.avatarImage || ''
    }
    return created
  }

  async function deleteBotById(id: number): Promise<boolean> {
    const success = await deleteBot(id)

    if (success) {
      bots.value = bots.value.filter((bot: Bot) => bot.id !== id)

      if (currentBot.value?.id === id) {
        deselectBot()
        createNewBot()
      }
    }

    return success
  }

  async function addBotsToStore(newBots: Partial<BotForm>[]): Promise<Bot[]> {
    const normalizedBots = newBots.map((bot: Partial<BotForm>) => ({
      ...bot,
      serverId: bot.serverId ?? serverStore.activeTextServer?.id ?? null,
      serverName: bot.serverName ?? serverStore.activeTextServer?.title ?? null,
    }))

    const added = await addBots(normalizedBots)
    bots.value = [...bots.value, ...added]
    return added
  }

  async function addSingleBot(botData: Partial<BotForm>): Promise<Bot | null> {
    const payload: Partial<BotForm> = {
      ...botData,
      avatarImage: currentImagePath.value || botData.avatarImage || '',
      serverId: botData.serverId ?? serverStore.activeTextServer?.id ?? null,
      serverName:
        botData.serverName ?? serverStore.activeTextServer?.title ?? null,
    }

    const newBot = await addBot(payload)
    if (newBot) {
      bots.value.push(newBot)
    }
    return newBot
  }

  async function loadBotById(id: number): Promise<Bot | null> {
    const bot = await getBotById(id)

    if (bot) {
      currentBot.value = bot
      botForm.value = { ...bot }
      currentImagePath.value = bot.avatarImage ?? ''
    }

    return bot
  }

  async function getBotImage(botId: number): Promise<string> {
    const bot = bots.value.find((entry: Bot) => entry.id === botId)
    return bot ? await botImage(bot) : '/images/bot.webp'
  }

  async function seedBots(): Promise<void> {
    try {
      const seeds = await seedBotsHelper()
      await addBotsToStore(seeds as Partial<BotForm>[])
      await fetchBots(true)
    } catch (error: unknown) {
      handleError(error, 'seeding bots')
    }
  }

  function setBotServer(serverId: number | null): void {
    botForm.value.serverId = serverId

    if (typeof serverId !== 'number') {
      botForm.value.serverName = null
      return
    }

    const server = serverStore.getServerById(serverId)
    botForm.value.serverName = server?.title || null
  }

  function applyActiveTextServer(): void {
    const server = serverStore.activeTextServer
    botForm.value.serverId = server?.id ?? null
    botForm.value.serverName = server?.title ?? null
  }

  return {
    bots,
    currentBot,
    botForm,
    currentImagePath,
    loading,
    isLoaded,
    totalBots,
    selectedBotId,
    hasUnsavedChanges,
    ownedBots,
    selectBot,
    revertBotForm,
    deselectBot,
    createNewBot,
    fetchBots,
    initialize,
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

// /stores/botStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Bot } from '~/server/generated/prisma'
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

export const useBotStore = defineStore('botStore', () => {
  const bots = ref<Bot[]>([])
  const currentBot = ref<Bot | null>(null)
  const botForm = ref<Partial<Bot>>({})
  const currentImagePath = ref('')
  const loading = ref(false)
  const isLoaded = ref(false)

  const totalBots = computed(() => bots.value.length)
  const selectedBotId = computed(() => currentBot.value?.id ?? null)
  const hasUnsavedChanges = computed(
    () => JSON.stringify(currentBot.value) !== JSON.stringify(botForm.value),
  )

  async function selectBot(botId: number) {
    if (currentBot.value?.id === botId) return
    const found = bots.value.find((b: { id: number }) => b.id === botId)
    if (!found) return handleError(`Bot ID ${botId} not found`, 'selecting bot')
    currentBot.value = found
    botForm.value = { ...found }
    currentImagePath.value = found.avatarImage || ''
  }

  function revertBotForm() {
    if (currentBot.value) botForm.value = { ...currentBot.value }
  }

  function deselectBot() {
    currentBot.value = null
    botForm.value = {}
    currentImagePath.value = ''
  }

  async function fetchBots() {
    if (isLoaded.value) return
    loading.value = true
    try {
      const res = await performFetch<Bot[]>('/api/bots')
      if (res.success && res.data) bots.value = res.data
      isLoaded.value = true
    } catch (error) {
      handleError(error, 'fetching bots')
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    if (isLoaded.value || loading.value) return
    loading.value = true
    try {
      await fetchBots()
    } catch (e) {
      handleError(e, 'initialize')
    } finally {
      loading.value = false
    }
  }

  async function updateCurrentBot() {
    if (!currentBot.value)
      return handleError('No current bot', 'updateCurrentBot')
    const updated = await updateBot(
      currentBot.value.id,
      botForm.value,
      currentImagePath.value,
    )
    if (updated) {
      const i = bots.value.findIndex((b: { id: any }) => b.id === updated.id)
      if (i !== -1) bots.value[i] = updated
      currentBot.value = updated
      botForm.value = { ...updated }
      currentImagePath.value = updated.avatarImage || ''
    }
  }

  async function saveUserIntro(newUserIntro: string) {
    if (!currentBot.value) return
    botForm.value.userIntro = newUserIntro
    await updateCurrentBot()
  }

  async function deleteBotById(id: number) {
    const success = await deleteBot(id)
    if (success)
      bots.value = bots.value.filter((b: { id: number }) => b.id !== id)
  }

  async function addBotsToStore(newBots: Partial<Bot>[]) {
    const added = await addBots(newBots)
    bots.value = [...bots.value, ...added]
    return added
  }

  async function addSingleBot(botData: Partial<Bot>) {
    const newBot = await addBot(botData)
    if (newBot) bots.value.push(newBot)
    return newBot
  }

  async function loadBotById(id: number) {
    const bot = await getBotById(id)
    if (bot) {
      currentBot.value = bot
      botForm.value = { ...bot }
      currentImagePath.value = bot.avatarImage ?? ''
    }
    return bot
  }

  async function getBotImage(botId: number): Promise<string> {
    const bot = bots.value.find((b: { id: number }) => b.id === botId)
    return bot ? await botImage(bot) : '/images/bot.webp'
  }

  async function seedBots() {
    try {
      const seeds = await seedBotsHelper()
      await addBotsToStore(seeds)
      await fetchBots()
    } catch (e) {
      handleError(e, 'seeding bots')
    }
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
    selectBot,
    revertBotForm,
    deselectBot,
    fetchBots,
    initialize,
    updateCurrentBot,
    saveUserIntro,
    deleteBotById,
    addBotsToStore,
    addSingleBot,
    loadBotById,
    getBotImage,
    seedBots,
    getBotById,

    updateBot,

    addBot,

    addBots,
  }
})

export type { Bot }

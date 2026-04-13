// /stores/weirdStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat } from '~/prisma/generated/prisma/client'
import { scenarios } from '@/utils/sceneChoices'
import {
  STORAGE_KEY,
  toPrismaScenario,
  fromPrismaScenario,
  fromSeedScenario,
  parseIntros,
  type ScenarioView,
} from './helpers/weirdHelper'

const isClient = typeof window !== 'undefined'

export const useWeirdStore = defineStore('weirdStore', () => {
  const activeChatId = ref<number | null>(null)
  const activeCharacterId = ref<number | null>(null)
  const setting = ref<string | null>(null)
  const history = ref<Chat[]>([])
  const artImage = ref<string | null>(null)
  const mode = ref<'adventure' | 'chat' | 'setting'>('adventure')
  const loading = ref(false)
  const initialized = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)

  const initialChoices = ref<ScenarioView[]>(scenarios.map(fromSeedScenario))
  const currentOptions = ref<string[]>([])

  const characterStore = useCharacterStore()
  const chatStore = useChatStore()
  const userStore = useUserStore()

  const actionLock = ref<Promise<any> | null>(null)

  const activeCharacter = computed(() =>
    activeCharacterId.value
      ? characterStore.characters.find((c) => c.id === activeCharacterId.value)
      : null,
  )

  const activeChat = computed(() =>
    activeChatId.value
      ? chatStore.chats.find((c) => c.id === activeChatId.value)
      : null,
  )

  function populateInitialChoices() {
    initialChoices.value = scenarios.map(fromSeedScenario)
  }

  function populateCurrentOptions() {
    currentOptions.value = initialChoices.value.flatMap((choice) =>
      Array.isArray(choice.intros) ? choice.intros : [],
    )
  }

  async function initialize() {
    if (initialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        loadFromLocalStorage()

        await Promise.all([
          chatStore.initialize?.(),
          characterStore.initialize?.(),
        ])

        if (!initialChoices.value.length) populateInitialChoices()
        if (!currentOptions.value.length) populateCurrentOptions()

        initialized.value = true
      } catch (error) {
        handleError(
          new Error('WeirdStore Initialization Failed'),
          (error as Error).message,
        )
        initialized.value = false
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function startAdventure(characterId: number, newSetting: string) {
    try {
      loading.value = true

      const scenario = initialChoices.value.find((s) => s.title === newSetting)

      if (!scenario) throw new Error('Scenario not found')

      const intro = `Welcome to ${scenario.title}. ${scenario.description}`

      const newChat = await chatStore.addChat({
        content: intro,
        userId: userStore.user?.id ?? 0,
        characterId,
        recipientId: null,
        type: 'Weirdlandia',
        isPublic: false,
      })

      activeChatId.value = newChat.id
      activeCharacterId.value = characterId
      setting.value = newSetting

      if (!history.value.find((c) => c.id === newChat.id)) {
        history.value.push(newChat)
      }
    } catch (error) {
      handleError(
        new Error('Failed to start adventure'),
        (error as Error).message,
      )
    } finally {
      loading.value = false
    }
  }

  async function processAction(action: string) {
    if (!action.trim()) return

    if (actionLock.value) return actionLock.value

    actionLock.value = (async () => {
      try {
        loading.value = true

        const response = await performFetch<Chat>(
          `/api/chats/${activeChatId.value}/process`,
          {
            method: 'POST',
            body: JSON.stringify({ action }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (!response.success || !response.data) {
          throw new Error(response.message)
        }

        const newChat = response.data

        if (!chatStore.chats.find((c) => c.id === newChat.id)) {
          chatStore.chats.push(newChat)
        }

        if (!history.value.find((c) => c.id === newChat.id)) {
          history.value.push(newChat)
        }
      } catch (error) {
        handleError(
          new Error('Error processing action'),
          (error as Error).message,
        )
      } finally {
        loading.value = false
        actionLock.value = null
      }
    })()

    return actionLock.value
  }

  function setSetting(newSetting: string) {
    if (!newSetting.trim()) return
    setting.value = newSetting.trim()
  }

  function loadFromLocalStorage() {
    if (!isClient) return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      activeChatId.value = parsed.activeChatId
      activeCharacterId.value = parsed.activeCharacterId
      setting.value = parsed.setting
      artImage.value = parsed.artImage
      mode.value = parsed.mode
      currentOptions.value = parsed.currentOptions || []

      initialChoices.value =
        parsed.initialChoices?.map(fromPrismaScenario) ?? initialChoices.value

      history.value = (parsed.history || []).slice(-50)
    } catch (error) {
      handleError(
        new Error('Failed to parse weird state'),
        (error as Error).message,
      )
    }
  }

  function saveToLocalStorage() {
    if (!isClient) return

    const payload = {
      activeChatId: activeChatId.value,
      activeCharacterId: activeCharacterId.value,
      setting: setting.value,
      artImage: artImage.value,
      mode: mode.value,
      currentOptions: currentOptions.value,
      initialChoices: initialChoices.value.map(toPrismaScenario),
      history: history.value.slice(-50),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  watch([activeChatId, activeCharacterId, setting, mode], saveToLocalStorage)

  return {
    activeChatId,
    activeCharacterId,
    setting,
    history,
    artImage,
    mode,
    loading,
    initialized,
    initialChoices,
    currentOptions,
    activeCharacter,
    activeChat,
    initialize,
    startAdventure,
    processAction,
    setSetting,
    populateInitialChoices,
    populateCurrentOptions,
    loadFromLocalStorage,
    saveToLocalStorage,
    parseIntros,
  }
})

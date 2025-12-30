// /stores/weirdStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat } from '@prisma/client'
import { scenarios } from '@/utils/sceneChoices'
import type { Scenario } from '@prisma/client'
import {
  STORAGE_KEY,
  toPrismaScenario,
  fromPrismaScenario,
  fromSeedScenario,
  parseIntros,
  type ScenarioView,
} from './helpers/weirdHelper'

export const useWeirdStore = defineStore('weirdStore', () => {
  const activeChatId = ref<number | null>(null)
  const activeCharacterId = ref<number | null>(null)
  const setting = ref<string | null>(null)
  const history = ref<Chat[]>([])
  const artImage = ref<string | null>(null)
  const mode = ref<'adventure' | 'chat' | 'setting'>('adventure')
  const loading = ref(false)
  const initialized = ref(false)
  const initialChoices = ref<ScenarioView[]>(scenarios.map(fromSeedScenario))

  const currentOptions = ref<string[]>([])

  const characterStore = useCharacterStore()
  const chatStore = useChatStore()
  const userStore = useUserStore()

  const activeCharacter = computed(() =>
    activeCharacterId.value
      ? characterStore.characters.find(
          (c: { id: number | null }) => c.id === activeCharacterId.value,
        )
      : null,
  )

  const activeChat = computed(() =>
    activeChatId.value
      ? chatStore.chats.find(
          (c: { id: number | null }) => c.id === activeChatId.value,
        )
      : null,
  )

  function populateInitialChoices() {
    initialChoices.value = scenarios.map(fromSeedScenario)
  }

  function populateCurrentOptions() {
    if (initialChoices.value.length > 0) {
      currentOptions.value = initialChoices.value.flatMap((choice) => {
        return Array.isArray(choice.intros) ? choice.intros : []
      })
    } else {
      console.warn('No initial choices available to populate current options.')
    }
  }

  async function initialize() {
    if (initialized.value) return
    try {
      loadFromLocalStorage()

      if (!chatStore.isInitialized) await chatStore.initialize()
      if (!characterStore.isInitialized) await characterStore.initialize()

      if (initialChoices.value.length === 0) populateInitialChoices()
      if (currentOptions.value.length === 0) populateCurrentOptions()

      initialized.value = true
    } catch (error) {
      handleError(
        new Error('WeirdStore Initialization Failed'),
        (error as Error).message,
      )
    }
  }

  async function startAdventure(characterId: number, newSetting: string) {
    try {
      loading.value = true

      const selectedScenario = initialChoices.value.find(
        (scenario: ScenarioView) => scenario.title === newSetting,
      )
      if (!selectedScenario) throw new Error('Selected scenario not found.')

      const introContent = `Welcome to ${selectedScenario.title}. ${selectedScenario.description}`

      const newChat = await chatStore.addChat({
        content: introContent,
        userId: userStore.user?.id ?? 0,
        characterId,
        recipientId: null,
        type: 'Weirdlandia',
        isPublic: false,
      })

      activeChatId.value = newChat.id
      activeCharacterId.value = characterId
      setting.value = newSetting
      history.value.push(newChat)
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
    if (typeof action !== 'string' || !action.trim()) {
      handleError(new Error('Invalid action'), 'Processing action')
      return
    }

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

      if (response.success && response.data) {
        const newChat = response.data
        chatStore.chats.push(newChat)
        history.value.push(newChat)
      } else {
        throw new Error(response.message || 'Failed to process action.')
      }
    } catch (error) {
      handleError(
        new Error('Error processing action'),
        (error as Error).message,
      )
    } finally {
      loading.value = false
    }
  }

  function setSetting(newSetting: string) {
    if (typeof newSetting !== 'string' || !newSetting.trim()) {
      handleError(
        new Error('Invalid setting value'),
        'Setting adventure setting',
      )
      return
    }
    setting.value = newSetting.trim()
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (!savedState) return

    try {
      const parsed = JSON.parse(savedState)
      activeChatId.value = parsed.activeChatId
      activeCharacterId.value = parsed.activeCharacterId
      setting.value = parsed.setting
      history.value = parsed.history || []
      artImage.value = parsed.artImage
      mode.value = parsed.mode
      currentOptions.value = parsed.currentOptions || []

      initialChoices.value =
        parsed.initialChoices?.map(fromPrismaScenario) ?? []
    } catch (error) {
      handleError(
        new Error('Failed to parse weirdState from localStorage'),
        (error as Error).message,
      )
    }
  }

  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    const toSave = {
      activeChatId: activeChatId.value,
      activeCharacterId: activeCharacterId.value,
      setting: setting.value,
      history: history.value,
      artImage: artImage.value,
      mode: mode.value,
      initialChoices: initialChoices.value.map(toPrismaScenario),

      currentOptions: currentOptions.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }

  watch(
    [
      activeChatId,
      activeCharacterId,
      setting,
      history,
      artImage,
      mode,
      initialChoices,
      currentOptions,
    ],
    saveToLocalStorage,
    { deep: true },
  )

  return {
    // State
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
    populateInitialChoices,
    populateCurrentOptions,
    startAdventure,
    processAction,
    setSetting,
    loadFromLocalStorage,
    saveToLocalStorage,
    parseIntros,
  }
})

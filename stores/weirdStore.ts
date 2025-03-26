import { defineStore } from 'pinia'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat } from '@prisma/client'
import { scenarios } from '@/utils/sceneChoices'

export const useWeirdStore = defineStore('weirdStore', {
  state: () => ({
    activeChatId: null as number | null,
    activeCharacterId: null as number | null,
    setting: null as string | null,
    history: [] as Chat[],
    artImage: null as string | null,
    mode: 'adventure' as 'adventure' | 'chat' | 'setting',
    loading: false,
    initialized: false,
    initialChoices: [] as typeof scenarios, // Predefined settings
    currentOptions: [] as string[], // Current intro options
  }),

  getters: {
    activeCharacter(state) {
      const characterStore = useCharacterStore()
      return state.activeCharacterId
        ? characterStore.characters.find(
            (character) => character.id === state.activeCharacterId,
          )
        : null
    },
    activeChat(state) {
      const chatStore = useChatStore()
      return state.activeChatId
        ? chatStore.chats.find((chat) => chat.id === state.activeChatId)
        : null
    },
  },

  actions: {
    async initialize() {
      if (this.initialized) return
      try {
        this.loadFromLocalStorage()

        const chatStore = useChatStore()
        if (!chatStore.isInitialized) {
          await chatStore.initialize()
        }

        const characterStore = useCharacterStore()
        if (!characterStore.isInitialized) {
          await characterStore.initialize()
        }

        if (this.initialChoices.length === 0) {
          this.populateInitialChoices()
        }

        if (this.currentOptions.length === 0) {
          this.populateCurrentOptions()
        }

        this.initialized = true
      } catch (error) {
        handleError(
          new Error('WeirdStore Initialization Failed'),
          (error as Error).message,
        )
      }
    },
    populateInitialChoices() {
      this.initialChoices = scenarios.map((choice) => ({
        ...choice,
        intros: JSON.stringify(choice.intros), // Convert intros to string
      }))
      this.saveToLocalStorage()
    },

    populateCurrentOptions() {
      if (this.initialChoices.length > 0) {
        this.currentOptions = this.initialChoices.flatMap((choice) => {
          const intros =
            typeof choice.intros === 'string'
              ? JSON.parse(choice.intros)
              : choice.intros
          return Array.isArray(intros) ? intros : []
        })
      } else {
        console.warn(
          'No initial choices available to populate current options.',
        )
      }
      this.saveToLocalStorage()
    },

    async startAdventure(characterId: number, setting: string) {
      try {
        this.loading = true

        const selectedScenario = this.initialChoices.find(
          (scenario) => scenario.title === setting,
        )
        if (!selectedScenario) {
          throw new Error('Selected scenario not found.')
        }

        const introContent = `Welcome to ${selectedScenario.title}. ${selectedScenario.description}`

        const userStore = useUserStore()
        const chatStore = useChatStore()

        const newChat = await chatStore.addChat({
          content: introContent,
          userId: userStore.user?.id ?? 0,
          characterId,
          recipientId: null,
          type: 'Weirdlandia',
          isPublic: false,
        })

        this.activeChatId = newChat.id
        this.activeCharacterId = characterId
        this.setting = setting
        this.history.push(newChat)

        this.saveToLocalStorage()
      } catch (error) {
        handleError(
          new Error('Failed to start adventure'),
          (error as Error).message,
        )
      } finally {
        this.loading = false
      }
    },

    async processAction(action: string) {
      if (typeof action !== 'string' || !action.trim()) {
        handleError(new Error('Invalid action'), 'Processing action')
        return
      }

      try {
        this.loading = true
        const chatStore = useChatStore()

        const response = await performFetch<Chat>(
          `/api/chats/${this.activeChatId}/process`,
          {
            method: 'POST',
            body: JSON.stringify({ action }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          const newChat = response.data
          chatStore.chats.push(newChat)
          this.history.push(newChat)
          this.saveToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to process action.')
        }
      } catch (error) {
        handleError(
          new Error('Error processing action'),
          (error as Error).message,
        )
      } finally {
        this.loading = false
      }
    },

    setSetting(setting: string) {
      if (typeof setting !== 'string' || !setting.trim()) {
        handleError(
          new Error('Invalid setting value'),
          'Setting adventure setting',
        )
        return
      }
      this.setting = setting.trim()
      this.saveToLocalStorage()
    },

    loadFromLocalStorage() {
      if (typeof window === 'undefined') return

      const savedState = localStorage.getItem('weirdState')
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          if (parsedState.initialChoices) {
            parsedState.initialChoices = parsedState.initialChoices.map(
              (choice: Scenario) => ({
                ...choice,
                intros: JSON.stringify(choice.intros),
              }),
            )
          }
          Object.assign(this, parsedState)
        } catch (error) {
          handleError(
            new Error('Failed to parse weirdState from localStorage'),
            (error as Error).message,
          )
        }
      }
    },

    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        const stateToSave = {
          activeChatId: this.activeChatId ?? null,
          activeCharacterId: this.activeCharacterId ?? null,
          setting: this.setting ?? '',
          history: this.history ?? [],
          artImage: this.artImage ?? null,
          mode: this.mode ?? 'adventure',
          initialChoices: this.initialChoices ?? [],
          currentOptions: this.currentOptions ?? [],
        }
        localStorage.setItem('weirdState', JSON.stringify(stateToSave))
      }
    },
  },
})

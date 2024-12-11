import { defineStore } from 'pinia'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat } from '@prisma/client'

export const useWeirdStore = defineStore({
  id: 'weird',
  state: () => ({
    activeChatId: null as number | null,
    activeCharacterId: null as number | null,
    setting: null as string | null,
    history: [] as Chat[],
    artImage: null as string | null,
    mode: 'adventure' as 'adventure' | 'chat' | 'setting',
    loading: false,
    initialized: false,
    currentOptions: [] as string[],
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

        this.initialized = true
      } catch (error) {
        handleError(
          new Error('WeirdStore Initialization Failed'),
          (error as Error).message,
        )
      }
    },

    async startAdventure(characterId: number, setting: string) {
      try {
        this.loading = true

        const characterStore = useCharacterStore()
        const character = characterStore.characters.find(
          (char) => char.id === characterId,
        )
        if (!character) throw new Error('Character not found.')

        const userStore = useUserStore()
        const chatStore = useChatStore()

        const introContent = `You are ${character.name ?? 'Unknown'}, a ${character.species ?? 'mysterious being'} ${character.class ?? 'adventurer'}, entering the setting: ${setting}.`

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

    loadFromLocalStorage(this: typeof useWeirdStore.prototype) {
      if (typeof window === 'undefined') return

      const savedState = localStorage.getItem('weirdState')
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState) as Partial<typeof this>
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
        }
        localStorage.setItem('weirdState', JSON.stringify(stateToSave))
      }
    },
  },
})

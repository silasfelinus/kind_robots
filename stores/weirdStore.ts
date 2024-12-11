// /stores/weirdStore.ts
import { defineStore } from 'pinia'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'
import { useUserStore } from './userStore'
import { useArtStore } from './artStore'
import { useRewardStore } from './rewardStore'
import { performFetch, handleError } from './utils'
import type { Chat, Character } from '@prisma/client'

export const useWeirdStore = defineStore({
  id: 'weird',
  state: () => ({
    activeChatId: null as number | null,
    activeCharacterId: null as number | null,
    setting: null as string | null, // The story's current setting
    history: [] as Chat[], // Stores the chat history for the adventure
    artImage: null as string | null, // Art representing the current scene
    mode: 'adventure' as 'adventure' | 'chat' | 'setting',
    loading: false,
    initialized: false,
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
    // Initialize WeirdStore from localStorage
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
        handleError('WeirdStore Initialization Failed', error)
      }
    },

    // Start a new adventure
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

        const introContent = `You are ${character.name}, a ${character.species} ${character.class}, entering the setting: ${setting}.`

        const newChat = await chatStore.addChat({
          content: introContent,
          userId: userStore.user?.id ?? 0,
          characterId,
          type: 'Weirdlandia',
          isPublic: false,
        })

        this.activeChatId = newChat.id
        this.activeCharacterId = characterId
        this.setting = setting
        this.history.push(newChat)

        this.saveToLocalStorage()
      } catch (error) {
        handleError('Failed to start adventure', error)
      } finally {
        this.loading = false
      }
    },

    // Process user action
    async processAction(action: string) {
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
        handleError('Error processing action', error)
      } finally {
        this.loading = false
      }
    },

    // Start a character chat session
    async startCharacterChat(characterId: number) {
      try {
        this.mode = 'chat'
        this.activeCharacterId = characterId

        const characterStore = useCharacterStore()
        const character = characterStore.characters.find(
          (char) => char.id === characterId,
        )
        if (!character) throw new Error('Character not found.')

        const userStore = useUserStore()
        const chatStore = useChatStore()

        const introContent = `You are now chatting with ${character.name}, a ${character.species} ${character.class}.`

        const newChat = await chatStore.addChat({
          content: introContent,
          userId: userStore.user?.id ?? 0,
          characterId,
          type: 'ToCharacter',
          isPublic: false,
        })

        this.activeChatId = newChat.id
        this.history.push(newChat)

        this.saveToLocalStorage()
      } catch (error) {
        handleError('Failed to start character chat', error)
      }
    },

    // Update the setting using Weird-Space
    setSetting(setting: string) {
      this.setting = setting
      this.saveToLocalStorage()
    },

    // Load state from localStorage
    loadFromLocalStorage() {
      if (typeof window === 'undefined') return

      const savedState = localStorage.getItem('weirdState')
      if (savedState) {
        Object.assign(this, JSON.parse(savedState))
      }
    },

    // Save state to localStorage
    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        const stateToSave = {
          activeChatId: this.activeChatId,
          activeCharacterId: this.activeCharacterId,
          setting: this.setting,
          history: this.history,
          artImage: this.artImage,
          mode: this.mode,
        }
        localStorage.setItem('weirdState', JSON.stringify(stateToSave))
      }
    },
  },
})

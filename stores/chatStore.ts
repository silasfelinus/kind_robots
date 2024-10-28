import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
    currentPrompt: '' as string,
    activeChats: [] as ChatExchange[], // Tracks active chats
    isInitialized: false,
  }),
  getters: {
    chatExchangesByUserId: (state) => {
      const userStore = useUserStore()
      return state.chatExchanges.filter((exchange: ChatExchange) => exchange.userId === userStore.user?.id)
    },
    activeChatsByBotId: (state) => (botId: number) => {
      return state.activeChats.filter((exchange: ChatExchange) => exchange.botId === botId)
    },
    publicChatExchanges(state) {
      const userStore = useUserStore()
      return state.chatExchanges.filter((exchange: ChatExchange) => exchange.isPublic && exchange.userId !== userStore.user?.id)
    },
  },
  actions: {
    async initialize() {
      if (this.isInitialized) return
      try {
        this.loadFromLocalStorage()
        const userStore = useUserStore()
        if (userStore.user?.id) {
          await this.fetchChatExchangesByUserId(userStore.user.id)
        }
        this.saveToLocalStorage()
        this.isInitialized = true
      } catch (error) {
        this.handleError(ErrorType.NETWORK_ERROR, 'Failed to initialize chat exchanges.' + error)
      }
    },

    async fetch(url: string, options: RequestInit = {}) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          let errorMessage = `HTTP error! Status: ${response.status}`
          const errorDetails = await response.json().catch(() => null)
          if (errorDetails?.message) {
            errorMessage += ` - ${errorDetails.message}`
          }
          throw new Error(errorMessage)
        }
        return await response.json()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during fetch'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        throw error
      }
    },

    async addOrUpdateExchange(prompt: string, userId: number, botId?: number) {
      const userStore = useUserStore()
      const botStore = useBotStore()
      const promptStore = usePromptStore()

      if (!prompt || !userId) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Required data missing: prompt or userId.')
        return
      }

      try {
        const promptData = await promptStore.addPrompt(prompt, userId, botId ?? 1)
        if (!promptData?.id) {
          throw new Error('Failed to add the prompt to the promptStore.')
        }

        const botName = botId ? botStore.currentBot?.name ?? 'Unknown Bot' : 'No Bot Assigned'

        const exchange: ChatExchange = {
          createdAt: new Date(),
          updatedAt: new Date(),
          username: userStore.username ?? 'Unknown User',
          previousEntryId: null,
          botName: botName,
          userPrompt: prompt,
          botResponse: '',
          isPublic: false,
          userId,
          botId: botId ?? null,
          promptId: promptData.id,
        }

        const response = await this.fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exchange),
        })

        if (!response.success) {
          throw new Error(`Failed to add/update exchange: ${response.message || 'Unknown error'}`)
        }

        const newExchange = response.chatExchanges
        this.chatExchanges.push(newExchange)
        this.activeChats.push(newExchange)
        this.saveToLocalStorage()
        return newExchange
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        this.handleError(ErrorType.NETWORK_ERROR, errorMessage)
        throw error
      }
    },

    async fetchChatExchanges() {
      try {
        const data = await this.fetch('/api/chats')
        this.chatExchanges = data.chatExchanges
      } catch (error) {
        this.handleError(ErrorType.NETWORK_ERROR, 'Failed to fetch chat exchanges' + error)
      }
    },

    async fetchChatExchangesByUserId(userId: number) {
      try {
        const data = await this.fetch(`/api/chats/user/${userId}`)
        if (data.success) {
          this.setChatExchanges(data.chatExchanges)
        } else {
          this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch exchanges for user ${userId}: ${data.message}`)
        }
      } catch (error) {
        this.handleError(ErrorType.NETWORK_ERROR, 'Failed to fetch chat exchanges by user.' + error)
      }
    },

    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },

    loadFromLocalStorage() {
      if (typeof window !== 'undefined') {
        const savedExchanges = localStorage.getItem('chatExchanges')
        if (savedExchanges) {
          this.chatExchanges = JSON.parse(savedExchanges)
        }
      }
    },

    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatExchanges', JSON.stringify(this.chatExchanges))
      }
    },

    // Save active chats to localStorage
    saveActiveChats() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeChats', JSON.stringify(this.activeChats))
      }
    },

    // Load active chats from localStorage
    loadActiveChats() {
      if (typeof window !== 'undefined') {
        const savedActiveChats = localStorage.getItem('activeChats')
        if (savedActiveChats) {
          this.activeChats = JSON.parse(savedActiveChats)
        }
      }
    },

    async deleteExchange(exchangeId: number) {
      try {
        await this.fetch(`/api/chats/${exchangeId}`, {
          method: 'DELETE',
        })
        this.chatExchanges = this.chatExchanges.filter((exchange) => exchange.id !== exchangeId)
        this.activeChats = this.activeChats.filter((exchange) => exchange.id !== exchangeId)
        this.saveToLocalStorage()
        this.saveActiveChats()
      } catch (error) {
        this.handleError(ErrorType.NETWORK_ERROR, 'Failed to delete chat exchange.' + error)
      }
    },

    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore()
      errorStore.setError(type, message)
      console.error(message)
    },
  },
})

export type { ChatExchange }

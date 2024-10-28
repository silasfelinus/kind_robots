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
      return state.chatExchanges.filter(
        (exchange: ChatExchange) => exchange.userId === userStore.user?.id,
      )
    },
    activeChatsByBotId: (state) => (botId: number) => {
      return state.activeChats.filter(
        (exchange: ChatExchange) => exchange.botId === botId,
      )
    },
    publicChatExchanges(state) {
      const userStore = useUserStore()
      return state.chatExchanges.filter(
        (exchange: ChatExchange) =>
          exchange.isPublic && exchange.userId !== userStore.user?.id,
      )
    },
  },
  actions: {
    // Enhanced initialize function
    async initialize() {
      if (this.isInitialized) return
      try {
        console.log('Initializing chat exchanges...')
        this.loadFromLocalStorage()
        const userStore = useUserStore()
        if (userStore.user?.id) {
          console.log(
            `Fetching chat exchanges for user ID: ${userStore.user.id}`,
          )
          await this.fetchChatExchangesByUserId(userStore.user.id)
        } else {
          console.warn('User ID not found during initialization.')
        }
        this.saveToLocalStorage()
        this.isInitialized = true
        console.log('Chat exchanges initialized successfully.')
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Failed to initialize chat exchanges: ${error}`,
        )
        console.error('Error during initialization:', error)
      }
    },

    // Enhanced addExchange function
    async addExchange(prompt: string, userId: number, botId?: number) {
      if (!prompt || !userId) {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          'Required data missing: prompt or userId.',
        )
        console.warn('Prompt or userId missing:', { prompt, userId })
        return
      }

      console.log('Adding exchange:', { prompt, userId, botId })

      const userStore = useUserStore()
      const botStore = useBotStore()
      const promptStore = usePromptStore()

      try {
        const promptData = await promptStore.addPrompt(
          prompt,
          userId,
          botId ?? 1,
        )
        console.log('Prompt added to promptStore:', promptData)

        if (!promptData?.id) {
          throw new Error('Failed to add the prompt to the promptStore.')
        }

        const botName = botId
          ? (botStore.currentBot?.name ?? 'Unknown Bot')
          : 'No Bot Assigned'

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

        console.log('Prepared exchange object:', exchange)

        const response = await this.fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exchange),
        })
        console.log('API response from /api/chats:', response)

        if (!response.success) {
          throw new Error(
            `Failed to add exchange: ${response.message || 'Unknown error'}`,
          )
        }

        const newExchange: ChatExchange = response.newExchange
        this.chatExchanges.push(newExchange)
        this.activeChats.push(newExchange)
        this.saveToLocalStorage()
        console.log('Exchange successfully added and saved.')
        return newExchange
      } catch (error: unknown) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error in addExchange: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        console.error('Error adding exchange:', error)
        throw error
      }
    },

    // New method to get exchange by ID
    getExchangeById(exchangeId: number): ChatExchange | undefined {
      return this.chatExchanges.find(
        (exchange: ChatExchange) => exchange.id === exchangeId,
      )
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
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during fetch'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        throw error
      }
    },

    async editExchange(exchangeId: number, updatedData: Partial<ChatExchange>) {
      try {
        const response = await this.fetch(`/api/chats/${exchangeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        })

        if (!response.success) {
          throw new Error(
            `Failed to edit exchange: ${response.message || 'Unknown error'}`,
          )
        }

        const updatedExchange: ChatExchange = response.chatExchanges
        this.chatExchanges = this.chatExchanges.map((exchange: ChatExchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        )
        this.activeChats = this.activeChats.map((exchange: ChatExchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        )
        this.saveToLocalStorage()
        return updatedExchange
      } catch (error: unknown) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error in editExchange: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        throw error
      }
    },

    async continueExchange(previousExchangeId: number, newPrompt: string) {
      const previousExchange = this.chatExchanges.find(
        (exchange: ChatExchange) => exchange.id === previousExchangeId,
      )

      if (!previousExchange) {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          'Previous exchange not found.',
        )
        return
      }

      return await this.addExchange(
        newPrompt,
        previousExchange.userId,
        previousExchange.botId,
      )
    },

    async fetchChatExchangesByUserId(userId: number) {
      try {
        const data = await this.fetch(`/api/chats/user/${userId}`)
        if (data.success) {
          this.setChatExchanges(data.chatExchanges)
        } else {
          this.handleError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch exchanges for user ${userId}: ${data.message}`,
          )
        }
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Failed to fetch chat exchanges by userId: ${error}`,
        )
      }
    },

    // Reintroduced addOrUpdateChatExchange for backward compatibility
    async addOrUpdateExchange(prompt: string, userId: number, botId?: number) {
      console.log('Attempting to add or update exchange:', {
        prompt,
        userId,
        botId,
      })

      try {
        const result = await this.addExchange(prompt, userId, botId)
        console.log('Exchange added or updated successfully:', result)
        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error('Error in addOrUpdateExchange:', errorMessage)

        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error in addOrUpdateChatExchange: ${errorMessage}`,
        )
        throw error
      }
    },

    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },

    // Action to delete a chat exchange
    async deleteExchange(exchangeId: number) {
      const userStore = useUserStore()
      const exchange = this.chatExchanges.find(
        (exchange: ChatExchange) => exchange.id === exchangeId,
      )

      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Exchange not found.')
        return
      }

      if (exchange.userId !== userStore.user?.id) {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          'You do not have permission to delete this message.',
        )
        return
      }

      try {
        // Remove from local store
        this.chatExchanges = this.chatExchanges.filter(
          (exchange: ChatExchange) => exchange.id !== exchangeId,
        )
        this.activeChats = this.activeChats.filter(
          (exchange: ChatExchange) => exchange.id !== exchangeId,
        )
        this.saveToLocalStorage()

        // Optional: Call backend to delete from database
        await this.fetch(`/api/chats/${exchangeId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error deleting exchange: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        throw error
      }
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
        localStorage.setItem(
          'chatExchanges',
          JSON.stringify(this.chatExchanges),
        )
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

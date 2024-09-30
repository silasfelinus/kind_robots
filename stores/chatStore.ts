import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
    currentPrompt: '' as string, // For keeping track of user's input
  }),
  actions: {
    // Fetch helper
    async fetch(url: string, options: RequestInit = {}) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
        return await response.json()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        console.error(`Network error occurred: ${errorMessage}`)
        throw error
      }
    },

    // Add or update ChatExchange and return it
    async addOrUpdateExchange(prompt: string, userId: number, botId: number) {
      const userStore = useUserStore()
      const botStore = useBotStore()
      const promptStore = usePromptStore()

      // Add prompt to the promptStore first
      const promptData = await promptStore.addPrompt(prompt, userId, botId)

      const exchange: ChatExchange = {
        id: 0, // Placeholder, gets assigned by the DB
        createdAt: new Date(),
        updatedAt: new Date(),
        username: userStore.username,
        previousEntryId: null, // Can be set for follow-up
        botName: botStore.currentBot?.name,
        userPrompt: prompt,
        botResponse: '', // Placeholder, populated after AI response
        isPublic: false,
        userId,
        botId,
        promptId: promptData.id, // Link to the new prompt
        Reactions: [],
      }

      // Send the chat exchange to the backend for processing
      const data = await this.fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exchange),
      })

      if (data.success) {
        const newExchange = data.newExchange
        this.chatExchanges.push(newExchange)
        return newExchange
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to add or update exchange: ${data.message}`)
      }
    },

    // Handle follow-up messages linked to previous ChatExchange
    async sendFollowUpMessage(exchangeId: number, followUpPrompt: string) {
      const exchange = this.getExchangeById(exchangeId)
      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Chat exchange not found.')
        return
      }

      const followUpExchange = {
        ...exchange,
        previousEntryId: exchange.id,
        userPrompt: followUpPrompt,
        updatedAt: new Date(),
      }

      const data = await this.fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpExchange),
      })

      if (data.success) {
        const updatedExchange = data.newExchange
        this.chatExchanges.push(updatedExchange)
        return updatedExchange
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to send follow-up message: ${data.message}`)
      }
    },

    // Get a chat exchange by ID
    getExchangeById(id: number) {
      return this.chatExchanges.find((exchange: ChatExchange) => exchange.id === id) || null
    },

    // Set exchanges in state
    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },

    // Fetch all chat exchanges for a specific bot
    async fetchChatExchangesByBot(botId: number) {
      const data = await this.fetch(`/api/chats/bot/${botId}`)
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch exchanges for bot ${botId}: ${data.message}`)
      }
    },

    // Load chat exchanges from localStorage (when client)
    loadFromLocalStorage() {
      if (window ) {
        const savedExchanges = localStorage.getItem('chatExchanges')
        if (savedExchanges) {
          this.chatExchanges = JSON.parse(savedExchanges)
        }
      }
    },

    // Save exchanges to localStorage
    saveToLocalStorage() {
     if (typeof window !== 'undefined' && window.localStorage)  {
        localStorage.setItem('chatExchanges', JSON.stringify(this.chatExchanges))
      }
    },

    // Add reaction to a ChatExchange
    async addReaction(exchangeId: number, reaction: ReactionType) {
      const exchange = this.getExchangeById(exchangeId)
      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Chat exchange not found.')
        return
      }

      const data = await this.fetch(`/api/chats/${exchangeId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      })

      if (data.success) {
        exchange.Reactions.push(data.newReaction)
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to add reaction: ${data.message}`)
      }
    },

    // Error handling
    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore()
      errorStore.setError(type, message)
      console.error(message)
    },
  },
})

export type { ChatExchange }

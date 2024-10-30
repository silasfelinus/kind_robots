import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import type { ChatExchange } from '@prisma/client'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
    activeChats: [] as ChatExchange[],
    currentPrompt: '',
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
    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore()
      errorStore.setError(type, message)
      console.error(message)
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
    async addExchange(
      prompt: string,
      userId: number,
      botId?: number,
      previousEntryId?: number,
      promptId?: number,
    ) {
      if (!prompt || !userId) {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          'Missing prompt or userId.',
        )
        return
      }

      const userStore = useUserStore()
      const botStore = useBotStore()
      const promptStore = usePromptStore()

      try {
        // Ensure finalPromptId is only the ID integer
        let finalPromptId = promptId

        if (!finalPromptId) {
          const promptResult = await promptStore.addPrompt(
            prompt,
            userId,
            botId ?? 1,
          )
          
      finalPromptId = promptResult ? promptResult.id : null


          if (!finalPromptId) {
            throw new Error('Failed to obtain a prompt ID.')
          }
        }


    // Final safety check to ensure finalPromptId is an integer
    if (typeof finalPromptId === 'object' && 'id' in finalPromptId) {
      finalPromptId = finalPromptId.id
    }


        const exchange: Omit<ChatExchange, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          username: userStore.username ?? 'Unknown User',
          previousEntryId: previousEntryId ?? null,
          botName: botStore.currentBot?.name ?? 'Unknown Bot',
          userPrompt: prompt,
          botResponse: '',
          isPublic: true,
          botId: botId ?? null,
          promptId: finalPromptId, // Ensure only integer ID is set here
        }

        // Send exchange to API
        const response = await this.fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exchange),
        })

        if (!response.success) {
          throw new Error(response.message || 'Unknown error from API')
        }

        const newExchange = response.newExchange as ChatExchange
        if (!this.isValidChatExchange(newExchange)) {
          throw new Error('Invalid ChatExchange object returned from API')
        }

        // Initialize bot response as an empty string
        newExchange.botResponse = ''
        this.activeChats.push(newExchange)

        // Fetch bot response as a stream
        await this.fetchStream(
          'https://kind-robots.vercel.app/api/botcafe/chat',
          {
            method: 'POST',
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 1,
              n: 1,
              maxTokens: 300,
            }),
          },
          (chunk) => {
            newExchange.botResponse += chunk
            this.chatExchanges = [...this.chatExchanges]
          },
        )

        this.saveToLocalStorage()
        return newExchange
      } catch (error) {
        console.error('Error in addExchange:', error)
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error in addExchange: ${error}`,
        )
        throw error
      }
    },
async fetchStream(
  url: string,
  options: RequestInit = {},
  onData: (chunk: string) => void,
) {
  const errorStore = useErrorStore()
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok || !response.body) {
      const errorDetails = await response.json().catch(() => null)
      const errorMessage = errorDetails?.message
        ? `HTTP error! ${response.status} - ${errorDetails.message}`
        : `HTTP error! Status: ${response.status}`
      throw new Error(errorMessage)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      try {
        const parsedChunk = JSON.parse(chunk)
        const messageContent = parsedChunk?.choices?.[0]?.message?.content

        if (messageContent) {
          onData(messageContent) // Send the extracted content to the callback
        }
      } catch (error) {
        console.warn('Failed to parse chunk as JSON:', chunk, error)
      }
    }

    return true
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during fetch'
    errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
    throw error
  }
},

    async initialize() {
      if (this.isInitialized) return
      try {
        this.loadFromLocalStorage()

        const userStore = useUserStore()
        if (userStore.user?.id) {
          await this.fetchChatExchangesByUserId(userStore.user.id)
        } else {
          this.handleError(ErrorType.VALIDATION_ERROR, 'User ID not found.')
        }

        this.isInitialized = true
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Initialization failed: ${error}`,
        )
      }
    },
    async continueExchange(
      previousExchangeId: number,
      newPrompt: string,
      promptId?: number,
    ) {
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

      const userStore = useUserStore()

      // Pass promptId if provided, otherwise use the previous exchange's promptId
      return await this.addExchange(
        newPrompt,
        userStore.userId,
        previousExchange.botId ?? 1,
        previousExchange.id,
        promptId ?? previousExchange.promptId ?? undefined, // Use passed promptId if available, else fallback to previousExchange.promptId
      )
    },

    async fetchChatExchangesByUserId(userId: number) {
      try {
        const data = await this.fetch(`/api/chats/user/${userId}`)
        if (data.success) {
          this.chatExchanges = data.userChats
          this.saveToLocalStorage()
        } else {
          this.handleError(ErrorType.NETWORK_ERROR, data.message)
        }
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Failed to fetch exchanges: ${error}`,
        )
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
          throw new Error(response.message || 'Unknown error')
        }

        const updatedExchange: ChatExchange = response.chatExchanges
        this.chatExchanges = this.chatExchanges.map((exchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        )
        this.saveToLocalStorage()
        return updatedExchange
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error editing exchange: ${error}`,
        )
        throw error
      }
    },

    async deleteExchange(exchangeId: number) {
      const userStore = useUserStore()
      const exchange = this.chatExchanges.find(
        (exchange) => exchange.id === exchangeId,
      )

      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Exchange not found.')
        return
      }

      if (exchange.userId !== userStore.user?.id) {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          'No permission to delete this exchange.',
        )
        return
      }

      try {
        this.chatExchanges = this.chatExchanges.filter(
          (exchange) => exchange.id !== exchangeId,
        )
        this.saveToLocalStorage()

        await this.fetch(`/api/chats/${exchangeId}`, { method: 'DELETE' })
      } catch (error) {
        this.handleError(
          ErrorType.NETWORK_ERROR,
          `Error deleting exchange: ${error}`,
        )
        throw error
      }
    },

    loadFromLocalStorage() {
      if (typeof window === 'undefined') return // Prevent running on the server

      const savedExchanges = localStorage.getItem('chatExchanges')

      if (savedExchanges) {
        try {
          const parsedExchanges = JSON.parse(savedExchanges)

          // Validate the parsed data
          if (Array.isArray(parsedExchanges)) {
            this.chatExchanges = parsedExchanges.map((exchange) => ({
              ...exchange,
              createdAt: exchange.createdAt
                ? new Date(exchange.createdAt)
                : new Date(),
              updatedAt: exchange.updatedAt
                ? new Date(exchange.updatedAt)
                : new Date(),
              userId: exchange.userId ?? 0, // Fallback for missing userId
              username: exchange.username || 'Unknown User',
              userPrompt: exchange.userPrompt || 'No prompt available',
              botResponse: exchange.botResponse || '',
              isPublic: exchange.isPublic ?? true,
              botId: exchange.botId ?? null,
              promptId: exchange.promptId ?? null,
              previousEntryId: exchange.previousEntryId ?? null,
            }))
          } else {
            // If data is not in the expected format, clear `localStorage` and reset
            console.warn('Invalid data format in localStorage, clearing data.')
            localStorage.removeItem('chatExchanges')
            this.chatExchanges = []
          }
        } catch (error) {
          // Handle JSON parse errors by clearing localStorage and resetting
          this.handleError(
            ErrorType.PARSE_ERROR,
            `Failed to parse chat exchanges from localStorage: ${error}`,
          )
          console.warn('Clearing corrupted data from localStorage.')
          localStorage.removeItem('chatExchanges') // Clear corrupted data
          this.chatExchanges = [] // Reset to empty array
        }
      } else {
        // Initialize as empty array if no data exists in localStorage
        this.chatExchanges = []
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

    isValidChatExchange(obj: unknown): obj is ChatExchange {
      if (typeof obj !== 'object' || obj === null) return false
      const exchange = obj as Partial<ChatExchange>

      return (
        typeof exchange.id === 'number' &&
        typeof exchange.userId === 'number' &&
        (exchange.createdAt instanceof Date ||
          (typeof exchange.createdAt === 'string' &&
            !isNaN(Date.parse(exchange.createdAt)))) &&
        (exchange.updatedAt instanceof Date ||
          (typeof exchange.updatedAt === 'string' &&
            !isNaN(Date.parse(exchange.updatedAt)))) &&
        typeof exchange.username === 'string' &&
        typeof exchange.userPrompt === 'string' &&
        typeof exchange.botResponse === 'string' &&
        typeof exchange.isPublic === 'boolean' &&
        (typeof exchange.botId === 'number' || exchange.botId === null) &&
        (typeof exchange.promptId === 'number' || exchange.promptId === null) &&
        (typeof exchange.previousEntryId === 'number' ||
          exchange.previousEntryId === null)
      )
    },
  },
})

export type { ChatExchange }

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
  promptId?: { id: number }
) {
  if (!prompt || !userId) {
    this.handleError(ErrorType.VALIDATION_ERROR, 'Missing prompt or userId.')
    return
  }

  const userStore = useUserStore()
  const botStore = useBotStore()
  const promptStore = usePromptStore()

  try {
    let finalPromptId = promptId ? promptId.id : undefined

    if (!finalPromptId) {
      const promptResult = await promptStore.addPrompt(prompt, userId, botId ?? 1)
      finalPromptId = promptResult ? promptResult.id : null

      if (!finalPromptId) {
        throw new Error('Failed to obtain a prompt ID.')
      }
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
      promptId: finalPromptId, // Only the ID integer is sent here
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

    newExchange.botResponse = ''
    this.activeChats.push(newExchange)

    // Now call fetchStream using cleaned data
    await this.fetchStream(
      'gpt-4o-mini',
      [{ role: 'user', content: prompt }],
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
      options: RequestInit & { onData: (chunk: string) => void },
    ) {
      const errorStore = useErrorStore()
      const { onData, ...fetchOptions } = options

      console.log('--- FetchStream Initiated ---')
      console.log('URL:', url)
      console.log('Options:', fetchOptions)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        })

        if (!response.ok) {
          const errorDetails = await response.json().catch(() => null)
          const errorMessage = errorDetails?.message
            ? `HTTP error! ${response.status} - ${errorDetails.message}`
            : `HTTP error! Status: ${response.status}`

          console.error('Failed API Response:', errorMessage)
          console.error(
            'Detailed error:',
            JSON.stringify(errorDetails, null, 2),
          )

          throw new Error(errorMessage)
        }

        console.log('Response status:', response.status)

        if (response.body) {
          console.log('--- Stream Opened Successfully ---')
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          let responseData = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            console.log('Received raw chunk:', chunk)

            try {
              responseData += chunk
              onData(chunk)
            } catch (parseError) {
              console.warn('Failed to handle chunk:', chunk, parseError)
            }
          }
          console.log('--- Stream Ended ---')
          return JSON.parse(responseData)
        } else {
          console.log('--- Non-streaming response ---')
          const responseData = await response.json()
          console.log('Response data:', responseData)
          return responseData
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during fetchStream'
        console.error('fetchStream encountered an error:', errorMessage)
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

      return await this.addExchange(
        newPrompt,
        userStore.userId,
        previousExchange.botId ?? 1,
        previousExchange.id,
        promptId ?? previousExchange.promptId ?? undefined,
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
      if (typeof window === 'undefined') return

      const savedExchanges = localStorage.getItem('chatExchanges')

      if (savedExchanges) {
        try {
          const parsedExchanges = JSON.parse(savedExchanges)

          if (Array.isArray(parsedExchanges)) {
            this.chatExchanges = parsedExchanges.map((exchange) => ({
              ...exchange,
              createdAt: exchange.createdAt
                ? new Date(exchange.createdAt)
                : new Date(),
              updatedAt: exchange.updatedAt
                ? new Date(exchange.updatedAt)
                : new Date(),
              userId: exchange.userId ?? 0,
              username: exchange.username || 'Unknown User',
              userPrompt: exchange.userPrompt || 'No prompt available',
              botResponse: exchange.botResponse || '',
              isPublic: exchange.isPublic ?? true,
              botId: exchange.botId ?? null,
              promptId: exchange.promptId ?? null,
              previousEntryId: exchange.previousEntryId ?? null,
            }))
          } else {
            console.warn('Invalid data format in localStorage, clearing data.')
            localStorage.removeItem('chatExchanges')
            this.chatExchanges = []
          }
        } catch (error) {
          this.handleError(
            ErrorType.PARSE_ERROR,
            `Failed to parse chat exchanges from localStorage: ${error}`,
          )
          console.warn('Clearing corrupted data from localStorage.')
          localStorage.removeItem('chatExchanges')
          this.chatExchanges = []
        }
      } else {
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

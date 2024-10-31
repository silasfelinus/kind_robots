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
    currentStream: '',  // Track the latest stream chunk
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
        let finalPromptId = promptId

        if (!finalPromptId) {
          const promptResult = await promptStore.addPrompt(
            prompt,
            userId,
            botId ?? 1,
          )
          finalPromptId = promptResult?.id
          if (!finalPromptId) throw new Error('Failed to obtain a prompt ID.')
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
          promptId: finalPromptId,
          artImageId: null,
        }

        const response = await this.fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exchange),
        })

        if (!response.success) throw new Error(response.message || 'Unknown error from API')

        const newExchange = response.newExchange as ChatExchange
        newExchange.botResponse = ''
        this.activeChats.push(newExchange)
        this.chatExchanges.push(newExchange)

        // Start streaming the bot response and update currentStream
        await this.fetchStream(
          'https://kind-robots.vercel.app/api/botcafe/chat',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 1,
              n: 1,
              maxTokens: 300,
              stream: true,
            }),
            onData: (chunk) => {
              newExchange.botResponse += chunk;
              this.currentStream = chunk;  // Update currentStream with the latest chunk
              this.chatExchanges = [...this.chatExchanges];
            },
          },
        );

        this.saveToLocalStorage()
        return newExchange
      } catch (error) {
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

          throw new Error(errorMessage)
        }

        if (response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            let boundary
            while ((boundary = buffer.indexOf('\n\n')) >= 0) {
              let chunk = buffer.slice(0, boundary).trim()
              buffer = buffer.slice(boundary + 2)

              if (chunk.startsWith('data:')) {
                chunk = chunk.replace(/^data:\s*/, '').replace(/^data:\s*/, '')
              }

              if (!chunk || chunk === '[DONE]') continue

              try {
                const parsed = JSON.parse(chunk)
                const content = parsed.choices[0]?.delta?.content

                if (content) {
                  onData(content)
                  this.currentStream = content  // Update currentStream with each new content chunk
                }
              } catch (parseError) {
                console.warn('Failed to handle chunk:', chunk, parseError)
              }
            }
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during fetchStream'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        throw error
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



async deleteExchange(exchangeId: number): Promise<boolean> {
  const errorStore = useErrorStore()
  const userStore = useUserStore()
  const currentUserId = userStore.userId

  if (!currentUserId) {
    errorStore.setError(ErrorType.AUTHORIZATION_ERROR, 'User not authenticated.')
    return false
  }

  // Find the exchange to check ownership
  const exchange = this.chatExchanges.find(exchange => exchange.id === exchangeId)
  if (!exchange) {
    errorStore.setError(ErrorType.NOT_FOUND, 'Exchange not found.')
    return false
  }

  // Client-side authorization check
  if (exchange.userId !== currentUserId) {
    errorStore.setError(
      ErrorType.AUTHORIZATION_ERROR,
      'You are not authorized to delete this exchange.'
    )
    return false
  }

  try {
    // Proceed to delete if authorized
    const response = await fetch(`/api/exchanges/${exchangeId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    // Remove from local state after successful deletion
    this.chatExchanges = this.chatExchanges.filter(exchange => exchange.id !== exchangeId)
    return true
  } catch (error) {
    errorStore.setError(
      ErrorType.NETWORK_ERROR,
      `Error deleting exchange: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
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

import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'
import { usePromptStore } from './promptStore'
import { useUserStore } from './userStore'
import { useBotStore } from './botStore'
import { performFetch, handleError } from './utils'
import type { ChatExchange } from '@prisma/client'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
    activeChats: [] as ChatExchange[],
    currentPrompt: '',
    isInitialized: false,
    currentStream: '',
  }),

  getters: {
    chatExchangesByUserId: (state) => {
      const userStore = useUserStore()
      return state.chatExchanges.filter(
        (exchange) => exchange.userId === userStore.user?.id,
      )
    },
    activeChatsByBotId: (state) => (botId: number) => {
      return state.activeChats.filter((exchange) => exchange.botId === botId)
    },
    publicChatExchanges(state) {
      const userStore = useUserStore()
      return state.chatExchanges.filter(
        (exchange) =>
          exchange.isPublic && exchange.userId !== userStore.user?.id,
      )
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
        } else {
          handleError(ErrorType.VALIDATION_ERROR, 'User ID not found.')
        }

        this.isInitialized = true
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Initialization failed: ${error}`)
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
        handleError(ErrorType.VALIDATION_ERROR, 'Missing prompt or userId.')
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

        const response = await performFetch<{ newExchange: ChatExchange }>(
          '/api/chats',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exchange),
          },
        )

        const newExchange = response.data?.newExchange
        if (!newExchange) throw new Error('Failed to create new exchange.')

        newExchange.botResponse = ''
        this.activeChats.push(newExchange)
        this.chatExchanges.push(newExchange)

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
              newExchange.botResponse += chunk
              this.currentStream = chunk
              this.chatExchanges = [...this.chatExchanges]
            },
          },
        )

        this.saveToLocalStorage()
        return newExchange
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Error in addExchange: ${error}`)
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
                  this.currentStream = content
                }
              } catch (parseError) {
                console.warn('Failed to handle chunk:', chunk, parseError)
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during fetchStream'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        throw error
      }
    },

    async fetchChatExchangesByUserId(userId: number) {
      try {
        const response = await performFetch<{ userChats: ChatExchange[] }>(
          `/api/chats/user/${userId}`,
        )
        if (response.success) {
          this.chatExchanges = response.data?.userChats || []
          this.saveToLocalStorage()
        } else {
          handleError(ErrorType.NETWORK_ERROR, response.message)
        }
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Failed to fetch exchanges: ${error}`,
        )
      }
    },

    async editExchange(exchangeId: number, updatedData: Partial<ChatExchange>) {
      try {
        const response = await performFetch<{ chatExchanges: ChatExchange }>(
          `/api/chats/${exchangeId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          },
        )

        const updatedExchange = response.data?.chatExchanges
        if (updatedExchange) {
          this.chatExchanges = this.chatExchanges.map((exchange) =>
            exchange.id === exchangeId ? updatedExchange : exchange,
          )
          this.saveToLocalStorage()
          return updatedExchange
        } else {
          throw new Error('Failed to update exchange')
        }
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Error editing exchange: ${error}`)
        throw error
      }
    },

    async deleteExchange(exchangeId: number): Promise<boolean> {
      const userStore = useUserStore()
      const currentUserId = userStore.user?.id

      if (!currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'User not authenticated.')
        return false
      }

      const exchange = this.chatExchanges.find((ex) => ex.id === exchangeId)
      if (!exchange) {
        handleError(ErrorType.UNKNOWN_ERROR, 'Exchange not found.')
        return false
      }

      if (exchange.userId !== currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'Unauthorized delete attempt.')
        return false
      }

      try {
        const response = await performFetch(`/api/chats/${exchangeId}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.chatExchanges = this.chatExchanges.filter(
            (ex) => ex.id !== exchangeId,
          )
          this.saveToLocalStorage()
          return true
        } else {
          throw new Error(response.message || 'Unknown error from API')
        }
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Error deleting exchange: ${error}`,
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
          handleError(
            ErrorType.PARSE_ERROR,
            `Failed to parse chat exchanges from localStorage: ${error}`,
          )
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
  },
})

export type { ChatExchange }

// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { ErrorType } from './errorStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat, ChatType } from '@prisma/client'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chats: [] as Chat[],
    isInitialized: false,
    unreadMessages: [] as Chat[],
    selectedChat: null as Chat | null,
    selectedRecipientId: null as number | null,
  }),

  getters: {
    activeChatsByBotId() {
      return (botId: number) => {
        return this.chats.filter((chat) => chat.botId === botId)
      }
    },
    chatsByUserId: (state) => {
      const userStore = useUserStore()
      return state.chats.filter((chat) => chat.userId === userStore.user?.id)
    },
    // New getter for unread message count by recipient
    unreadCountByRecipient: (state) => {
      return (recipientId: number) =>
        state.unreadMessages.filter((chat) => chat.recipientId === recipientId)
          .length
    },
    publicChats(state) {
      const userStore = useUserStore()
      return state.chats.filter(
        (chat) => chat.isPublic && chat.userId !== userStore.user?.id,
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
          await this.fetchChatsByUserId(userStore.user.id)
        } else {
          handleError(ErrorType.VALIDATION_ERROR, 'User ID not found.')
        }

        this.isInitialized = true
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Initialization failed: ${error}`)
      }
    },
    async selectChat(chatId: number) {
      try {
        if (this.selectedChat?.id === chatId) return
        const foundChat = this.chats.find((chat) => chat.id === chatId)
        if (!foundChat) throw new Error(`Chat with ID ${chatId} not found`)

        this.selectedChat = foundChat
      } catch (error) {
        handleError(error, 'selecting chat')
      }
    },
    markMessagesAsRead(recipientId: number) {
      const unreadMessages = this.unreadMessages.filter(
        (chat) => chat.recipientId === recipientId,
      )

      unreadMessages.forEach(async (chat) => {
        try {
          chat.isRead = true
          await performFetch(`/api/chats/${chat.id}/read`, { method: 'PUT' })
        } catch (error) {
          handleError(
            ErrorType.NETWORK_ERROR,
            `Failed to mark chat as read: ${error}`,
          )
        }
      })

      this.unreadMessages = this.unreadMessages.filter(
        (chat) => chat.recipientId !== recipientId,
      )
    },

    async addChat({
      content,
      userId,
      botId = null,
      botName = null,
      recipientId = null,
      isPublic = true,
      originId = null,
      previousEntryId = null,
      promptId = null,
      botResponse = null,
      type = 'ToBot',
      characterId = null,
    }: {
      content: string
      userId: number
      botId?: number | null
      botName?: string | null
      recipientId: number | null
      isPublic?: boolean
      originId?: number | null
      previousEntryId?: number | null
      promptId?: number | null
      botResponse?: string | null
      type: ChatType
      characterId: number | null
    }) {
      try {
        const userStore = useUserStore()
        const username = userStore.username ?? 'Unknown User'

        // Determine sender and recipient based on whether it's a user prompt or bot response
        const isUserMessage = !!botId // If botId exists, it's a user message
        const sender = isUserMessage ? username : botName
        const recipient = isUserMessage ? botName : username

        // If this is a continuation, set originId and previousEntryId
        if (previousEntryId) {
          const lastChat = this.chats.find(
            (chat) => chat.id === previousEntryId,
          )
          if (lastChat) {
            originId = originId || lastChat.originId || lastChat.id
          }
        }

        const chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'> = {
          content,
          userId,
          sender: sender || 'Unknown',
          recipient: recipient || 'Unknown',
          isPublic,
          type,
          recipientId,
          botId,
          botName,
          originId,
          previousEntryId,
          artImageId: null,
          title: null,
          channel: null,
          isFavorite: false,
          promptId,
          botResponse,
          characterId,
          isRead: false,
        }

        const response = await performFetch<Chat>('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chat),
        })

        const newChat = response.data
        if (!newChat) throw new Error('Failed to create new chat.')

        this.chats.push(newChat)
        this.saveToLocalStorage()
        return newChat
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Error in addChat: ${error}`)
        throw error
      }
    },
    updateChat(chatId: number, updatedFields: Partial<Chat>) {
      const chatIndex = this.chats.findIndex((chat) => chat.id === chatId)
      if (chatIndex !== -1) {
        this.chats[chatIndex] = { ...this.chats[chatIndex], ...updatedFields }
      }
    },

    async streamResponse(chatId: number) {
      try {
        const chat = this.chats.find((c) => c.id === chatId)
        if (!chat) throw new Error('Chat not found.')

        const response = await fetch(`/api/chats/${chatId}/stream`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
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
              const chunk = buffer.slice(0, boundary).trim()
              buffer = buffer.slice(boundary + 2)

              if (!chunk || chunk === '[DONE]') continue

              try {
                const parsed = JSON.parse(chunk)
                const content = parsed.choices?.[0]?.delta?.content

                if (content) {
                  this.appendBotResponse(chatId, content)
                }
              } catch (err) {
                console.error('Error parsing chunk:', err)
              }
            }
          }
        } else {
          throw new Error('Streaming response not supported.')
        }
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Streaming failed: ${error}`)
      }
    },

    appendBotResponse(chatId: number, botResponse: string) {
      const chat = this.chats.find((c) => c.id === chatId)
      if (chat) {
        chat.botResponse = (chat.botResponse || '') + botResponse
        this.saveToLocalStorage()
      }
    },
    async deleteChat(chatId: number): Promise<boolean> {
      const userStore = useUserStore()
      const currentUserId = userStore.userId

      if (!currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'User not authenticated.')
        return false
      }

      const chat = this.chats.find((chat) => chat.id === chatId)
      if (!chat) {
        handleError(ErrorType.UNKNOWN_ERROR, 'Chat not found.')
        return false
      }

      if (chat.userId !== currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'Unauthorized delete attempt.')
        return false
      }

      try {
        const response = await performFetch(`/api/chats/${chatId}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.chats = this.chats.filter((chat) => chat.id !== chatId)
          this.saveToLocalStorage()
          return true
        } else {
          throw new Error(response.message || 'Unknown error from API')
        }
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Error deleting chat: ${error}`)
        return false
      }
    },

    async editChat(chatId: number, updatedData: Partial<Chat>) {
      try {
        const response = await performFetch<Chat>(`/api/chats/${chatId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        })

        const updatedChat = response.data
        if (updatedChat) {
          this.chats = this.chats.map((chat) =>
            chat.id === chatId ? updatedChat : chat,
          )
          this.saveToLocalStorage()
          return updatedChat
        } else {
          throw new Error('Failed to update chat')
        }
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Error editing chat: ${error}`)
        throw error
      }
    },

    async fetchChatsByUserId(userId: number) {
      try {
        const response = await performFetch<Chat[]>(`/api/chats/user/${userId}`)
        if (response.success) {
          this.chats = response.data || []
          this.saveToLocalStorage()
        } else {
          handleError(ErrorType.NETWORK_ERROR, response.message)
        }
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Failed to fetch chats: ${error}`)
      }
    },

    loadFromLocalStorage() {
      if (typeof window === 'undefined') return

      const savedChats = localStorage.getItem('chats')

      if (savedChats) {
        try {
          const parsedChats = JSON.parse(savedChats)
          if (Array.isArray(parsedChats)) {
            this.chats = parsedChats.map((chat) => ({
              ...chat,
              createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
              updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
              userId: chat.userId ?? 0,
              username: chat.username || 'Unknown User',
              content: chat.content || 'No content available',
              isPublic: chat.isPublic ?? true,
            }))
          } else {
            console.warn('Invalid data format in localStorage, clearing data.')
            localStorage.removeItem('chats')
            this.chats = []
          }
        } catch (error) {
          handleError(
            ErrorType.PARSE_ERROR,
            `Failed to parse chats from localStorage: ${error}`,
          )
          localStorage.removeItem('chats')
          this.chats = []
        }
      } else {
        this.chats = []
      }
    },

    async selectRecipient(recipientId: number) {
      this.selectedRecipientId = recipientId
      this.markMessagesAsRead(recipientId)
    },

    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chats', JSON.stringify(this.chats))
      }
    },
  },
})

export type { Chat }

// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { ErrorType } from './errorStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Chat } from '@prisma/client'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chats: [] as Chat[],
    isInitialized: false,
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

    async addChat({
      content,
      userId,
      botId = null,
      botName = null,
      recipientId,
      isPublic = true,
      originId = null,
      previousEntryId = null,
      promptId = null,
    }: {
      content: string
      userId: number
      botId?: number | null
      botName?: string | null
      recipientId: number
      isPublic?: boolean
      originId?: number | null
      previousEntryId?: number | null
      promptId?: number | null
    }) {
      try {
        const userStore = useUserStore()
        const username = userStore.username ?? 'Unknown User'

        // Determine sender and recipient based on whether it's a user prompt or bot response
        const isUserMessage = !!botId // If botId exists, it's a user message
        const sender = isUserMessage ? username : botName
        const recipient = isUserMessage ? botName : username

        const chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'> = {
          content,
          userId,
          sender: sender || 'Unknown',
          recipient: recipient || 'Unknown',
          isPublic,
          type: isUserMessage ? 'ToBot' : 'BotResponse',
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
        const response = await performFetch<Chat>(
          `/api/chats/${chatId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          },
        )

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
        const response = await performFetch<Chat[]>(
          `/api/chats/user/${userId}`,
        )
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

    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chats', JSON.stringify(this.chats))
      }
    },
  },
})

export type { Chat }

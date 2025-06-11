// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './userStore'
import { ErrorType } from './errorStore'
import { handleError } from './utils'
import type { Chat, ChatType } from '@prisma/client'
import {
  buildNewChat,
  createChat,
  patchChat,
  deleteChatById,
  fetchChatsForUser,
  markChatAsRead,
  streamChatResponse,
  type AddChatInput,
} from '@/stores/helpers/chatHelper'

export const useChatStore = defineStore('chatStore', () => {
  const chats = ref<Chat[]>([])
  const unreadMessages = ref<Chat[]>([])
  const selectedChat = ref<Chat | null>(null)
  const selectedRecipientId = ref<number | null>(null)
  const isInitialized = ref(false)

  const userStore = useUserStore()

  const activeChatsByBotId = (botId: number) =>
    chats.value.filter((chat) => chat.botId === botId)

  const chatsByUserId = computed(() =>
    chats.value.filter((chat) => chat.userId === userStore.user?.id),
  )

  const unreadCountByRecipient = (recipientId: number) =>
    unreadMessages.value.filter((chat) => chat.recipientId === recipientId)
      .length

  const publicChats = computed(() =>
    chats.value.filter(
      (chat) => chat.isPublic && chat.userId !== userStore.user?.id,
    ),
  )

  async function initialize() {
    if (isInitialized.value) return
    loadFromLocalStorage()

    if (userStore.user?.id) {
      await fetchChats(userStore.user.id)
      isInitialized.value = true
    } else {
      handleError(ErrorType.VALIDATION_ERROR, 'User ID not found.')
    }
  }

  async function selectChat(chatId: number) {
    const found = chats.value.find((chat) => chat.id === chatId)
    if (found) selectedChat.value = found
  }

  function markMessagesAsRead(recipientId: number) {
    const unread = unreadMessages.value.filter(
      (chat) => chat.recipientId === recipientId,
    )
    unread.forEach((chat) => {
      chat.isRead = true
      markChatAsRead(chat.id)
    })
    unreadMessages.value = unreadMessages.value.filter(
      (chat) => chat.recipientId !== recipientId,
    )
  }

  async function addChat(input: Omit<AddChatInput, 'username'>) {
    try {
      const username = userStore.username ?? 'Unknown User'
      const chatPayload = buildNewChat({ ...input, username })
      const newChat = await createChat(chatPayload)
      chats.value.push(newChat)
      saveToLocalStorage()
      return newChat
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error in addChat: ${error}`)
      throw error
    }
  }

  function updateChat(chatId: number, updatedFields: Partial<Chat>) {
    const index = chats.value.findIndex((chat) => chat.id === chatId)
    if (index !== -1) {
      chats.value[index] = { ...chats.value[index], ...updatedFields }
    }
  }

  async function streamResponse(chatId: number) {
    await streamChatResponse(chatId, (chunk) =>
      appendBotResponse(chatId, chunk),
    )
  }

  function appendBotResponse(chatId: number, botResponse: string) {
    const chat = chats.value.find((c) => c.id === chatId)
    if (chat) {
      chat.botResponse = (chat.botResponse || '') + botResponse
      saveToLocalStorage()
    }
  }

  async function deleteChat(chatId: number): Promise<boolean> {
    const currentUserId = userStore.userId
    const chat = chats.value.find((c) => c.id === chatId)

    if (!currentUserId || !chat || chat.userId !== currentUserId) {
      handleError(ErrorType.AUTH_ERROR, 'Unauthorized delete attempt.')
      return false
    }

    try {
      const success = await deleteChatById(chatId)
      if (success) {
        chats.value = chats.value.filter((c) => c.id !== chatId)
        saveToLocalStorage()
        return true
      }
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error deleting chat: ${error}`)
    }
    return false
  }

  async function editChat(chatId: number, updatedData: Partial<Chat>) {
    try {
      const updatedChat = await patchChat(chatId, updatedData)
      chats.value = chats.value.map((chat) =>
        chat.id === chatId ? updatedChat : chat,
      )
      saveToLocalStorage()
      return updatedChat
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error editing chat: ${error}`)
      throw error
    }
  }

  async function fetchChats(userId: number) {
    try {
      const data = await fetchChatsForUser(userId)
      chats.value = data
      saveToLocalStorage()
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Failed to fetch chats: ${error}`)
    }
  }

  function selectRecipient(recipientId: number) {
    selectedRecipientId.value = recipientId
    markMessagesAsRead(recipientId)
  }

  function saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chats', JSON.stringify(chats.value))
    }
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem('chats')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          chats.value = parsed.map((chat) => ({
            ...chat,
            createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
            updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
            userId: chat.userId ?? 0,
            username: chat.username || 'Unknown User',
            content: chat.content || 'No content available',
            isPublic: chat.isPublic ?? true,
          }))
        } else {
          localStorage.removeItem('chats')
          chats.value = []
        }
      } catch (error) {
        handleError(ErrorType.PARSE_ERROR, `Failed to parse chats: ${error}`)
        localStorage.removeItem('chats')
        chats.value = []
      }
    }
  }

  return {
    chats,
    unreadMessages,
    selectedChat,
    selectedRecipientId,
    isInitialized,
    activeChatsByBotId,
    chatsByUserId,
    unreadCountByRecipient,
    publicChats,
    initialize,
    selectChat,
    markMessagesAsRead,
    addChat,
    updateChat,
    streamResponse,
    appendBotResponse,
    deleteChat,
    editChat,
    fetchChats,
    selectRecipient,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})

export type { Chat }

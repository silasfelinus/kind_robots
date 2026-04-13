// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './userStore'
import { ErrorType } from './errorStore'
import { handleError } from './utils'
import type { Chat } from '~/prisma/generated/prisma/client'
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

const isClient = typeof window !== 'undefined'

export const useChatStore = defineStore('chatStore', () => {
  const chats = ref<Chat[]>([])
  const unreadMessages = ref<Chat[]>([])
  const selectedChat = ref<Chat | null>(null)
  const selectedRecipientId = ref<number | null>(null)
  const isInitialized = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchChatsPromise = ref<Promise<void> | null>(null)
  const lastFetchedUserId = ref<number | null>(null)

  const userStore = useUserStore()

  const activeChatsByBotId = (botId: number) =>
    chats.value.filter((chat) => chat.botId === botId)

  const chatsByUserId = computed(() => {
    const uid = userStore.user?.id
    if (!uid) return []
    return chats.value.filter((chat) => chat.userId === uid)
  })

  const unreadCountByRecipient = (recipientId: number) =>
    unreadMessages.value.filter((chat) => chat.recipientId === recipientId)
      .length

  const publicChats = computed(() => {
    const uid = userStore.user?.id
    return chats.value.filter((chat) => {
      if (!chat.isPublic) return false
      if (!uid) return true
      return chat.userId !== uid
    })
  })

  function refreshUnreadMessages(): void {
    const currentUserId = userStore.user?.id

    if (!currentUserId) {
      unreadMessages.value = []
      return
    }

    unreadMessages.value = chats.value.filter((chat) => {
      if (chat.isRead) return false
      return chat.recipientId === currentUserId
    })
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      loadFromLocalStorage()
      refreshUnreadMessages()

      const currentUserId = userStore.user?.id

      if (!currentUserId) {
        return
      }

      await fetchChats(currentUserId)
      isInitialized.value = true
    })()

    try {
      await initializePromise.value
    } catch (error) {
      handleError(
        ErrorType.NETWORK_ERROR,
        `Failed to initialize chats: ${error}`,
      )
    } finally {
      initializePromise.value = null
    }
  }

  async function selectChat(chatId: number): Promise<void> {
    const found = chats.value.find((chat) => chat.id === chatId)
    if (found) selectedChat.value = found
  }

  function markMessagesAsRead(recipientId: number): void {
    const unread = unreadMessages.value.filter(
      (chat) => chat.recipientId === recipientId,
    )

    unread.forEach((chat) => {
      chat.isRead = true
      void markChatAsRead(chat.id)
    })

    refreshUnreadMessages()
    saveToLocalStorage()
  }

  async function addChat(input: Omit<AddChatInput, 'username'>): Promise<Chat> {
    try {
      const username = userStore.username ?? 'Unknown User'
      const chatPayload = buildNewChat({ ...input, username })
      const newChat = await createChat(chatPayload)
      chats.value.push(newChat)
      refreshUnreadMessages()
      saveToLocalStorage()
      return newChat
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error in addChat: ${error}`)
      throw error
    }
  }

  function updateChat(chatId: number, updatedFields: Partial<Chat>): void {
    const index = chats.value.findIndex((chat) => chat.id === chatId)
    if (index !== -1) {
      chats.value[index] = { ...chats.value[index], ...updatedFields }
      refreshUnreadMessages()
      saveToLocalStorage()
    }
  }

  async function streamResponse(chatId: number): Promise<void> {
    await streamChatResponse(chatId, (chunk) =>
      appendBotResponse(chatId, chunk),
    )
  }

  function appendBotResponse(chatId: number, botResponse: string): void {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat) return
    chat.botResponse = (chat.botResponse || '') + botResponse
    saveToLocalStorage()
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
      if (!success) return false
      chats.value = chats.value.filter((c) => c.id !== chatId)

      if (selectedChat.value?.id === chatId) {
        selectedChat.value = null
      }

      refreshUnreadMessages()
      saveToLocalStorage()
      return true
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error deleting chat: ${error}`)
      return false
    }
  }

  async function editChat(
    chatId: number,
    updatedData: Partial<Chat>,
  ): Promise<Chat> {
    try {
      const updatedChat = await patchChat(chatId, updatedData)
      chats.value = chats.value.map((chat) =>
        chat.id === chatId ? updatedChat : chat,
      )
      refreshUnreadMessages()
      saveToLocalStorage()
      return updatedChat
    } catch (error) {
      handleError(ErrorType.NETWORK_ERROR, `Error editing chat: ${error}`)
      throw error
    }
  }

  async function fetchChats(userId: number, force = false): Promise<void> {
    if (!force && lastFetchedUserId.value === userId && isInitialized.value) {
      return
    }

    if (fetchChatsPromise.value) {
      return fetchChatsPromise.value
    }

    fetchChatsPromise.value = (async () => {
      try {
        const data = await fetchChatsForUser(userId)
        chats.value = data
        lastFetchedUserId.value = userId
        refreshUnreadMessages()
        saveToLocalStorage()
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Failed to fetch chats: ${error}`)
      } finally {
        fetchChatsPromise.value = null
      }
    })()

    return fetchChatsPromise.value
  }

  async function refreshForCurrentUser(force = true): Promise<void> {
    const currentUserId = userStore.user?.id
    if (!currentUserId) {
      refreshUnreadMessages()
      return
    }

    await fetchChats(currentUserId, force)
    isInitialized.value = true
  }

  function selectRecipient(recipientId: number): void {
    selectedRecipientId.value = recipientId
    markMessagesAsRead(recipientId)
  }

  function saveToLocalStorage(): void {
    if (!isClient) return
    localStorage.setItem('chats', JSON.stringify(chats.value))
  }

  function loadFromLocalStorage(): void {
    if (!isClient) return

    const saved = localStorage.getItem('chats')
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (!Array.isArray(parsed)) {
        localStorage.removeItem('chats')
        chats.value = []
        return
      }

      const normalized = parsed.map((chat) => ({
        ...chat,
        createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
        updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
        userId: chat.userId ?? null,
        username: chat.username || 'Unknown User',
        content: chat.content || 'No content available',
        isPublic: chat.isPublic ?? true,
        isRead: chat.isRead ?? false,
      }))

      chats.value = normalized as Chat[]
    } catch (error) {
      handleError(ErrorType.PARSE_ERROR, `Failed to parse chats: ${error}`)
      localStorage.removeItem('chats')
      chats.value = []
    }
  }

  return {
    chats,
    unreadMessages,
    selectedChat,
    selectedRecipientId,
    isInitialized,
    initializePromise,
    fetchChatsPromise,
    lastFetchedUserId,
    activeChatsByBotId,
    chatsByUserId,
    unreadCountByRecipient,
    publicChats,
    initialize,
    refreshForCurrentUser,
    refreshUnreadMessages,
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

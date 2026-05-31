// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './userStore'
import { useServerStore } from './serverStore'
import { useManaStore } from './manaStore'
import { ErrorType } from './errorStore'
import { performFetch, handleError } from './utils'
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

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type BotCafeResponse = {
  success?: boolean
  message?: string
  content?: string
  data?: unknown
  id?: string
  choices?: Array<{
    message?: {
      role?: string
      content?: string | null
    }
    delta?: {
      content?: string | null
    }
    finish_reason?: string | null
  }>
}

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
  const serverStore = useServerStore()

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

  type BotCafeResponseData = {
    content: string
    raw?: unknown
  }

  type StreamResponseOptions = {
    model?: string
    temperature?: number
    maxTokens?: number
    serverId?: number | null
    serverName?: string | null
    messages?: BotCafeMessage[]
    stream?: boolean
    // BYO-key / local-server billing. Leave undefined to auto-detect from the
    // selected server; pass explicitly to force free (true) or charged (false).
    useOwnResource?: boolean
    // The user-supplied key to forward when running on their own resource.
    userApiKey?: string | null
  }

  type TextBilling = {
    useOwnResource: boolean
    userApiKey: string | null
    serverId: number | null
  }

  /**
   * Decide whether this generation runs on the user's own resource (free) or
   * our community tokens (charged). Mirrors the art store's transport logic:
   * a LOCAL server or one carrying a user-supplied key is "their own."
   */
  function resolveTextBilling(options: StreamResponseOptions): TextBilling {
    const serverId =
      options.serverId ?? serverStore.activeTextServer?.id ?? null
    const server = serverId ? serverStore.getServerById?.(serverId) : null

    // Explicit override always wins.
    if (typeof options.useOwnResource === 'boolean') {
      return {
        useOwnResource: options.useOwnResource,
        userApiKey: options.userApiKey ?? null,
        serverId,
      }
    }

    // A user's own API key on their account counts as BYO.
    const ownKey = options.userApiKey ?? userStore.apiKey ?? null

    const isLocal =
      (server as { accessMode?: string } | null)?.accessMode === 'LOCAL'

    // Server flagged to run in-browser / on the user's own infra.
    const isOwnServer = Boolean(
      isLocal ||
      (server as { isPrivateNetwork?: boolean } | null)?.isPrivateNetwork,
    )

    // BYO when they bring a key, OR the selected server is their own/local.
    const useOwnResource = Boolean(ownKey) || isOwnServer

    return {
      useOwnResource,
      userApiKey: useOwnResource ? ownKey : null,
      serverId,
    }
  }

  function extractBotText(payload: BotCafeResponse): string {
    if (typeof payload.content === 'string' && payload.content.trim()) {
      return payload.content
    }

    const data = payload.data as BotCafeResponse | undefined

    const directChoice = payload.choices?.[0]?.message?.content
    if (directChoice?.trim()) return directChoice

    const wrappedContent = data?.content
    if (typeof wrappedContent === 'string' && wrappedContent.trim()) {
      return wrappedContent
    }

    const wrappedChoice = data?.choices?.[0]?.message?.content
    if (wrappedChoice?.trim()) return wrappedChoice

    if (
      payload.data &&
      typeof payload.data === 'object' &&
      'content' in payload.data &&
      typeof payload.data.content === 'string' &&
      payload.data.content.trim()
    ) {
      return payload.data.content
    }

    const wrappedMessage = data?.message
    if (typeof wrappedMessage === 'string' && wrappedMessage.trim()) {
      return wrappedMessage
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      const genericMessages = new Set([
        'Bot response received.',
        'Response received.',
        'Success',
        'OK',
      ])

      if (!genericMessages.has(payload.message.trim())) {
        return payload.message
      }
    }

    throw new Error('Bot response returned, but no assistant text was found.')
  }

  function extractStreamToken(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return ''

    const response = payload as BotCafeResponse
    const data = response.data as BotCafeResponse | undefined

    const directContent = response.content
    if (typeof directContent === 'string' && directContent.trim()) {
      return directContent
    }

    const deltaContent = response.choices?.[0]?.delta?.content
    if (typeof deltaContent === 'string' && deltaContent) {
      return deltaContent
    }

    const messageContent = response.choices?.[0]?.message?.content
    if (typeof messageContent === 'string' && messageContent.trim()) {
      return messageContent
    }

    const dataContent = data?.content
    if (typeof dataContent === 'string' && dataContent.trim()) {
      return dataContent
    }

    const dataDeltaContent = data?.choices?.[0]?.delta?.content
    if (typeof dataDeltaContent === 'string' && dataDeltaContent) {
      return dataDeltaContent
    }

    const dataMessageContent = data?.choices?.[0]?.message?.content
    if (typeof dataMessageContent === 'string' && dataMessageContent.trim()) {
      return dataMessageContent
    }

    const dataMessage = data?.message
    if (typeof dataMessage === 'string' && dataMessage.trim()) {
      return dataMessage
    }

    const directMessage = response.message
    if (typeof directMessage === 'string' && directMessage.trim()) {
      const genericMessages = new Set([
        'Bot response received.',
        'Response received.',
        'Success',
        'OK',
      ])

      if (!genericMessages.has(directMessage.trim())) {
        return directMessage
      }
    }

    return ''
  }

  function parseStreamLine(line: string): string {
    const trimmed = line.trim()

    if (!trimmed || trimmed === '[DONE]' || trimmed.startsWith('event:')) {
      return ''
    }

    const rawData = trimmed.startsWith('data:')
      ? trimmed.replace(/^data:\s*/, '')
      : trimmed

    if (!rawData || rawData === '[DONE]') return ''

    try {
      return extractStreamToken(JSON.parse(rawData))
    } catch {
      return trimmed.startsWith('data:') ? '' : rawData
    }
  }

  async function readJsonResponse(response: Response): Promise<string> {
    const payload = (await response.json()) as BotCafeResponse

    return extractBotText(payload)
  }

  async function readStreamingResponse(
    response: Response,
    onToken: (token: string) => void,
  ): Promise<string> {
    if (!response.body) {
      return readJsonResponse(response)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let pending = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      pending += decoder.decode(value, { stream: true })

      const lines = pending.split(/\r?\n/)
      pending = lines.pop() ?? ''

      for (const line of lines) {
        const token = parseStreamLine(line)

        if (!token) continue

        fullText += token
        onToken(token)
      }
    }

    const finalText = decoder.decode()
    if (finalText) {
      pending += finalText
    }

    if (pending.trim()) {
      const token = parseStreamLine(pending)

      if (token) {
        fullText += token
        onToken(token)
      }
    }

    return fullText
  }

  async function streamResponse(
    chatId: number,
    options: StreamResponseOptions = {},
  ): Promise<string> {
    // Guests become real users before generating text (ownership + wallet).
    if (userStore.isGuest) {
      const promo = await userStore.ensureRealUser()
      if (!promo.success) {
        throw new Error(
          promo.message ||
            'We could not set up your account for generating. Please try again.',
        )
      }
    }

    const chat = chats.value.find((entry) => entry.id === chatId)

    if (!chat) {
      throw new Error(`Chat ${chatId} was not found.`)
    }

    const messages: BotCafeMessage[] = options.messages?.length
      ? options.messages
      : [
          {
            role: 'user',
            content: chat.content,
          },
        ]

    updateChat(chatId, {
      botResponse: '',
    })

    const billing = resolveTextBilling(options)

    try {
      const response = await fetch('/api/botcafe/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'gpt-4o-mini',
          messages,
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 2048,
          stream: options.stream ?? true,
          serverId: billing.serverId,
          chatId,
          // Billing signals for the server-side mana gate. When the user
          // runs on their own resource, the backend treats it as free and
          // uses this key instead of our house tokens.
          useOwnResource: billing.useOwnResource,
          userApiKey: billing.userApiKey,
        }),
      })

      if (!response.ok) {
        let message = `Bot response failed with status ${response.status}.`

        try {
          const payload = (await response.json()) as BotCafeResponse
          message = payload.message || message
        } catch {
          const text = await response.text()
          message = text || message
        }

        throw new Error(message)
      }

      const contentType = response.headers.get('content-type') || ''
      const shouldReadAsStream =
        options.stream !== false &&
        response.body &&
        !contentType.includes('application/json')

      const finalText = shouldReadAsStream
        ? await readStreamingResponse(response, (token) => {
            appendBotResponse(chatId, token)
          })
        : await readJsonResponse(response)

      const cleanText = finalText.trim()

      if (!cleanText) {
        throw new Error(
          'Bot response returned, but no assistant text was found.',
        )
      }

      updateChat(chatId, {
        botResponse: cleanText,
      })

      try {
        await patchChat(chatId, {
          botResponse: cleanText,
        } as Partial<Chat>)
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Response streamed locally but failed to save: ${error}`,
        )
      }

      // Streaming responses can't carry a trailing balance field, so pull the
      // authoritative post-charge balance. Skip when the user ran on their own
      // resource — nothing was charged.
      if (!billing.useOwnResource) {
        void useManaStore().fetch()
      }

      return cleanText
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bot response failed.'

      updateChat(chatId, {
        botResponse: `⚠️ ${message}`,
      })

      throw error
    }
  }

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
      chats.value[index] = { ...chats.value[index], ...updatedFields } as Chat
      refreshUnreadMessages()
      saveToLocalStorage()
    }
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

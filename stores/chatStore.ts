// /stores/chatStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useUserStore } from './userStore'
import { useServerStore } from './serverStore'
import { useManaStore } from './manaStore'
import { ErrorType } from './errorStore'
import { handleError } from './utils'
import type { Chat, Server } from '~/prisma/generated/prisma/client'
import {
  buildNewChat,
  createChat,
  patchChat,
  deleteChatById,
  fetchChatsForUser,
  markChatAsRead,
  type AddChatInput,
} from '@/stores/helpers/chatHelper'

const isClient = typeof window !== 'undefined'
const chatsStorageKey = 'chats'

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

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

export type TextServerSelectionMode = 'default' | 'any' | 'specific'
export type TextGenerationProvider = 'any' | 'openai' | 'anthropic' | 'ollama'

export interface TextGenerationRequirement {
  provider?: TextGenerationProvider
}

export interface GenerateTextData {
  prompt: string
  botId?: number | null
  recipientId?: number | null
  characterId?: number | null
  userId?: number | null
  type?: AddChatInput['type']
  isPublic?: boolean
  model?: string
  temperature?: number
  maxTokens?: number
  messages?: BotCafeMessage[]
  stream?: boolean
  serverId?: number | null
  serverName?: string | null
  serverSelectionMode?: TextServerSelectionMode
  generationRequirement?: TextGenerationRequirement
  useOwnResource?: boolean
  userApiKey?: string | null
}

type StreamResponseOptions = Omit<GenerateTextData, 'prompt'>

type GenerateTextResult = {
  chat: Chat
  text: string
}

type TextBilling = {
  useOwnResource: boolean
  userApiKey: string | null
  serverId: number | null
}

type ChatStoreState = {
  isGenerating: boolean
  generationMessage: string
  generationMessageTone: 'success' | 'error'
  lastGeneratedText: string
  lastGeneratedChat: Chat | null
  textForm: GenerateTextData
}

function validateTextPrompt(prompt: string): ApiResponse<true> {
  const cleanPrompt = prompt.trim()

  if (!cleanPrompt) {
    return { success: false, message: 'Text prompt is empty.' }
  }

  if (cleanPrompt.length < 2) {
    return { success: false, message: 'Text prompt is too short.' }
  }

  if (cleanPrompt.length > 24000) {
    return {
      success: false,
      message: `Text prompt is too long. Received ${cleanPrompt.length} characters. Maximum is 24000.`,
    }
  }

  return { success: true, data: true }
}

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeRemoveLocalStorage(key: string): void {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
  } catch {}
}

function normalizeServerSearchText(server: Server): string {
  return [
    server.title,
    server.label,
    server.description,
    server.category,
    server.model,
    server.endpointPath,
    server.healthPath,
    server.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getServerLabel(server: Server): string {
  return server.label || server.title || `Server #${server.id}`
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

  const state = reactive<ChatStoreState>({
    isGenerating: false,
    generationMessage: '',
    generationMessageTone: 'success',
    lastGeneratedText: '',
    lastGeneratedChat: null,
    textForm: {
      prompt: '',
      botId: null,
      recipientId: null,
      characterId: null,
      userId: null,
      type: 'ToForum',
      isPublic: false,
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      messages: [],
      stream: true,
      serverId: null,
      serverName: null,
      serverSelectionMode: 'default',
      generationRequirement: { provider: 'any' },
      userApiKey: null,
    },
  })

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

  const generationServers = computed<Server[]>(() => {
    const servers = Array.isArray(serverStore.textServers)
      ? (serverStore.textServers as Server[])
      : []

    return servers.filter((server) => {
      if (!server.isActive) return false
      return ['OPENAI', 'ANTHROPIC', 'OLLAMA'].includes(
        String(server.serverType),
      )
    })
  })

  const activeGenerationServer = computed<Server | null>(() => {
    return resolveTextServer(state.textForm)
  })

  const canGenerateText = computed(() => {
    return Boolean(!state.isGenerating && state.textForm.prompt.trim())
  })

  function setGenerationMessage(
    tone: 'success' | 'error',
    message: string,
  ): void {
    state.generationMessageTone = tone
    state.generationMessage = message
  }

  function clearGenerationMessage(): void {
    state.generationMessage = ''
  }

  function setTextForm(updates: Partial<GenerateTextData>): void {
    state.textForm = {
      ...state.textForm,
      ...updates,
    }
  }

  function resetTextForm(overrides: Partial<GenerateTextData> = {}): void {
    state.textForm = {
      prompt: '',
      botId: null,
      recipientId: null,
      characterId: null,
      userId: userStore.userId || userStore.user?.id || 10,
      type: 'ToForum',
      isPublic: false,
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      messages: [],
      stream: true,
      serverId: null,
      serverName: null,
      serverSelectionMode: 'default',
      generationRequirement: { provider: 'any' },
      userApiKey: null,
      ...overrides,
    }
  }

  function selectGenerationServer(serverId: number | null): void {
    const server = serverId ? getServerByOptionalId(serverId) : null

    setTextForm({
      serverId,
      serverName: server ? getServerLabel(server) : null,
    })
  }

  async function prepareTextGenerator(): Promise<ApiResponse<true>> {
    try {
      clearGenerationMessage()

      if (!serverStore.hasLoaded) {
        await serverStore.initialize({ fetchRemote: true })
      }

      if (!state.textForm.userId) {
        setTextForm({ userId: userStore.userId || userStore.user?.id || 10 })
      }

      return {
        success: true,
        data: true,
        message: 'Text generator ready.',
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load text generator.'

      handleError(error, 'preparing text generator')
      setGenerationMessage('error', message)

      return {
        success: false,
        message,
      }
    }
  }

  function getServerProvider(server: Server): TextGenerationProvider {
    if (server.serverType === 'OPENAI') return 'openai'
    if (server.serverType === 'ANTHROPIC') return 'anthropic'
    if (server.serverType === 'OLLAMA') return 'ollama'
    return 'any'
  }

  function serverSupportsTextProvider(
    server: Server,
    provider: TextGenerationProvider = 'any',
  ): boolean {
    if (provider === 'any') return true

    const directProvider = getServerProvider(server)
    if (directProvider === provider) return true

    const searchText = normalizeServerSearchText(server)
    return searchText.includes(provider)
  }

  function isUsableTextServer(
    server: Server | null | undefined,
  ): server is Server {
    return Boolean(server?.isActive)
  }

  function serverMatchesGenerationRequirement(
    server: Server | null | undefined,
    requirement: TextGenerationRequirement = {},
  ): server is Server {
    if (!isUsableTextServer(server)) return false

    const provider = requirement.provider ?? 'any'
    return serverSupportsTextProvider(server, provider)
  }

  function getServerByOptionalId(serverId?: number | null): Server | null {
    if (!serverId) return null
    return serverStore.getServerById(serverId) ?? null
  }

  function getGenerationRequirement(
    data: Partial<GenerateTextData>,
  ): TextGenerationRequirement {
    if (data.generationRequirement) return data.generationRequirement

    const server = getServerByOptionalId(data.serverId)
    if (server) return { provider: getServerProvider(server) }

    return { provider: 'any' }
  }

  function getCandidateGenerationServers(): Server[] {
    return generationServers.value.filter(isUsableTextServer)
  }

  function resolveTextServer(data: Partial<GenerateTextData> = {}): Server | null {
    const requirement = getGenerationRequirement(data)
    const selectionMode = data.serverSelectionMode ?? 'default'
    const explicitServer = getServerByOptionalId(data.serverId)

    if (
      selectionMode === 'specific' &&
      serverMatchesGenerationRequirement(explicitServer, requirement)
    ) {
      return explicitServer
    }

    if (selectionMode === 'specific') {
      return null
    }

    if (selectionMode === 'default') {
      const activeServer = serverStore.activeTextServer

      if (serverMatchesGenerationRequirement(activeServer, requirement)) {
        return activeServer
      }
    }

    const ownedServer = getCandidateGenerationServers().find((server) => {
      return (
        server.userId === userStore.userId &&
        serverMatchesGenerationRequirement(server, requirement)
      )
    })

    if (ownedServer) return ownedServer

    const publicServer = getCandidateGenerationServers().find((server) => {
      return (
        Boolean(server.isPublic) &&
        serverMatchesGenerationRequirement(server, requirement)
      )
    })

    if (publicServer) return publicServer

    return (
      getCandidateGenerationServers().find((server) => {
        return serverMatchesGenerationRequirement(server, requirement)
      }) ?? null
    )
  }

  function getSelectedTextServer(data: Partial<GenerateTextData>): Server | null {
    const selectedServer = resolveTextServer(data)

    if (data.serverSelectionMode === 'specific' && !selectedServer) {
      throw new Error('The selected text server is not available.')
    }

    return selectedServer
  }

  function serverUsesOwnResource(server: Server | null | undefined): boolean {
    if (!server) return false
    if (!server.isActive) return false
    if (server.userId && server.userId === userStore.userId) return true
    if (server.isPublic && !server.isOfficial) return true

    return (
      server.accessMode === 'BROWSER' ||
      server.accessMode === 'LOCAL' ||
      server.accessMode === 'TAILSCALE' ||
      server.serverType === 'OLLAMA'
    )
  }

  function resolveTextBilling(options: StreamResponseOptions): TextBilling {
    const server = getSelectedTextServer(options)
    const serverId = server?.id ?? null

    if (typeof options.useOwnResource === 'boolean') {
      return {
        useOwnResource: options.useOwnResource,
        userApiKey: options.userApiKey ?? null,
        serverId,
      }
    }

    const ownKey = options.userApiKey ?? userStore.apiKey ?? null
    const useOwnResource = Boolean(ownKey) || serverUsesOwnResource(server)

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

  function buildMessagesForChat(
    chat: Chat,
    options: StreamResponseOptions,
  ): BotCafeMessage[] {
    if (options.messages?.length) return options.messages

    return [
      {
        role: 'user',
        content: chat.content,
      },
    ]
  }

  function buildStreamPayload(
    chatId: number,
    messages: BotCafeMessage[],
    options: StreamResponseOptions,
    billing: TextBilling,
  ): Record<string, unknown> {
    const server = getSelectedTextServer(options)
    const provider = server ? getServerProvider(server) : 'openai'
    const model =
      options.model || server?.model || (provider === 'ollama' ? 'llama3.1' : 'gpt-4o-mini')

    return {
      model,
      provider,
      serverType: server?.serverType ?? null,
      serverName: server ? getServerLabel(server) : options.serverName ?? null,
      messages,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2048,
      stream: options.stream ?? true,
      serverId: billing.serverId,
      chatId,
      useOwnResource: billing.useOwnResource,
      userApiKey: billing.userApiKey,
    }
  }

  async function streamResponse(
    chatId: number,
    options: StreamResponseOptions = {},
  ): Promise<string> {
    if (userStore.isGuest) {
      const promo = await userStore.ensureRealUser()
      if (!promo.success) {
        throw new Error(
          promo.message ||
            'We could not set up your account for generating. Please try again.',
        )
      }
      void useManaStore().fetch()
    }

    const chat = chats.value.find((entry) => entry.id === chatId)

    if (!chat) {
      throw new Error(`Chat ${chatId} was not found.`)
    }

    const selectedServer = getSelectedTextServer(options)
    const runtimeOptions: StreamResponseOptions = selectedServer
      ? {
          ...options,
          serverId: selectedServer.id,
          serverName: getServerLabel(selectedServer),
        }
      : options

    const messages = buildMessagesForChat(chat, runtimeOptions)
    const billing = resolveTextBilling(runtimeOptions)

    updateChat(chatId, {
      botResponse: '',
      serverId: billing.serverId,
    } as Partial<Chat>)

    try {
      const response = await fetch('/api/botcafe/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildStreamPayload(chatId, messages, runtimeOptions, billing),
        ),
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
        runtimeOptions.stream !== false &&
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
          serverId: billing.serverId,
        } as Partial<Chat>)
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Response streamed locally but failed to save: ${error}`,
        )
      }

      if (!billing.useOwnResource) {
        void useManaStore().fetch()
      }

      state.lastGeneratedText = cleanText
      state.lastGeneratedChat = chats.value.find((entry) => entry.id === chatId) ?? null

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

  async function generateText(
    data: Partial<GenerateTextData> = {},
  ): Promise<ApiResponse<GenerateTextResult>> {
    const prompt = data.prompt?.trim() || state.textForm.prompt.trim()
    const promptValidation = validateTextPrompt(prompt)

    clearGenerationMessage()

    if (!promptValidation.success) {
      const message = promptValidation.message || 'Invalid text prompt.'
      setGenerationMessage('error', message)
      return { success: false, message }
    }

    state.isGenerating = true

    try {
      if (userStore.isGuest) {
        const promo = await userStore.ensureRealUser()
        if (!promo.success) {
          throw new Error(
            promo.message ||
              'We could not set up your account for generating. Please try again.',
          )
        }
        void useManaStore().fetch()
      }

      const mergedData: GenerateTextData = {
        ...state.textForm,
        ...data,
        prompt,
        userId: data.userId ?? state.textForm.userId ?? userStore.userId ?? userStore.user?.id ?? 10,
        type:
          data.type ??
          state.textForm.type ??
          (data.botId || state.textForm.botId ? 'ToBot' : 'ToForum'),
      }

      const server = getSelectedTextServer(mergedData)
      const runtimeData: GenerateTextData = server
        ? {
            ...mergedData,
            serverId: server.id,
            serverName: getServerLabel(server),
          }
        : mergedData

      const chatPayload = buildNewChat({
        botId: runtimeData.botId ?? undefined,
        content: prompt,
        isPublic: runtimeData.isPublic ?? false,
        userId: runtimeData.userId ?? 10,
        type: runtimeData.type ?? 'ToForum',
        recipientId:
          runtimeData.recipientId ?? runtimeData.botId ?? undefined,
        characterId: runtimeData.characterId ?? null,
        serverId: runtimeData.serverId ?? null,
        serverName: runtimeData.serverName ?? null,
        username: userStore.username ?? 'Unknown User',
      } as AddChatInput & { serverName?: string | null })

      const newChat = await createChat(chatPayload)
      chats.value.push(newChat)
      refreshUnreadMessages()
      saveToLocalStorage()

      const text = await streamResponse(newChat.id, runtimeData)
      const generatedChat = chats.value.find((entry) => entry.id === newChat.id) ?? newChat

      state.lastGeneratedText = text
      state.lastGeneratedChat = generatedChat
      setGenerationMessage('success', 'Response generated.')

      return {
        success: true,
        data: {
          chat: generatedChat,
          text,
        },
        message: 'Response generated.',
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Text generation failed.'

      handleError(error, 'generating text')
      setGenerationMessage('error', message)

      return {
        success: false,
        message,
      }
    } finally {
      state.isGenerating = false
    }
  }

  async function generateCurrentText(
    overrides: Partial<GenerateTextData> = {},
  ): Promise<ApiResponse<GenerateTextResult>> {
    return await generateText({
      ...state.textForm,
      ...overrides,
      prompt: overrides.prompt?.trim() || state.textForm.prompt || '',
    })
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
    safeSetLocalStorage(chatsStorageKey, JSON.stringify(chats.value))
  }

  function loadFromLocalStorage(): void {
    if (!isClient) return

    const saved = safeGetLocalStorage(chatsStorageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (!Array.isArray(parsed)) {
        safeRemoveLocalStorage(chatsStorageKey)
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
      safeRemoveLocalStorage(chatsStorageKey)
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
    state,
    textForm: computed(() => state.textForm),
    isGenerating: computed(() => state.isGenerating),
    generationMessage: computed(() => state.generationMessage),
    generationMessageTone: computed(() => state.generationMessageTone),
    lastGeneratedText: computed(() => state.lastGeneratedText),
    lastGeneratedChat: computed(() => state.lastGeneratedChat),
    generationServers,
    activeGenerationServer,
    canGenerateText,
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
    generateText,
    generateCurrentText,
    appendBotResponse,
    deleteChat,
    editChat,
    fetchChats,
    selectRecipient,
    saveToLocalStorage,
    loadFromLocalStorage,
    prepareTextGenerator,
    setTextForm,
    resetTextForm,
    selectGenerationServer,
    clearGenerationMessage,
    setGenerationMessage,
    resolveTextServer,
    getSelectedTextServer,
    serverUsesOwnResource,
    getServerProvider,
  }
})

export type { Chat, BotCafeMessage, GenerateTextResult }

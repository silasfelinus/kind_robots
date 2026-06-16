// /stores/helpers/chatHelper.ts
import type { Chat, ChatType } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { ErrorType } from '@/stores/errorStore'

export interface AddChatInput {
  content: string
  userId: number
  botId?: number | null
  botName?: string | null
  recipientId: number | null
  recipient?: string | null
  isPublic?: boolean
  originId?: number | null
  previousEntryId?: number | null
  promptId?: number | null
  botResponse?: string | null
  type: ChatType
  characterId: number | null
  username: string
  channel?: string | null
  sender?: string | null
  serverId?: number | null
  serverName?: string | null
  dreamId?: number | null
}

function normalizeChatIdentity(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function toPositiveId(value?: number | null): number | null {
  const id = Number(value || 0)
  return Number.isFinite(id) && id > 0 ? id : null
}

function chatMatchesUserId(
  chat: Partial<Chat>,
  currentUserId?: number | null,
): boolean {
  const userId = toPositiveId(currentUserId)

  if (!userId) return false

  return chat.userId === userId || chat.recipientId === userId
}

function chatMatchesUsername(
  chat: Partial<Chat>,
  currentUsername?: string | null,
): boolean {
  const username = normalizeChatIdentity(currentUsername)

  if (!username) return false

  const sender = normalizeChatIdentity(chat.sender)
  const recipient = normalizeChatIdentity(chat.recipient)

  return sender === username || recipient === username
}

export function isInboxChat(
  chat: Partial<Chat> | null | undefined,
  currentUserId?: number | null,
  currentUsername?: string | null,
): chat is Chat {
  if (!chat) return false
  if (chat.isActive === false) return false

  return (
    chatMatchesUserId(chat, currentUserId) ||
    chatMatchesUsername(chat, currentUsername)
  )
}

export function isHumanDirectChat(
  chat: Partial<Chat> | null | undefined,
  currentUserId?: number | null,
  currentUsername?: string | null,
): chat is Chat {
  return isInboxChat(chat, currentUserId, currentUsername)
}

export function buildNewChat(
  input: AddChatInput,
): Omit<Chat, 'id' | 'createdAt' | 'updatedAt'> {
  const isDirectUserChat = input.type === 'ToUser'
  const isBotChat = input.type === 'ToBot' || input.type === 'BotResponse'
  const isCharacterChat =
    input.type === 'ToCharacter' || input.type === 'Character'

  const sender = input.sender || input.username || 'Unknown User'

  const recipient =
    input.recipient ||
    (isBotChat || isCharacterChat ? input.botName : null) ||
    (isDirectUserChat && input.recipientId
      ? `User #${input.recipientId}`
      : null) ||
    'Unknown'

  return {
    content: input.content,
    userId: input.userId,
    sender,
    recipient,
    isPublic: input.isPublic ?? !isDirectUserChat,
    type: input.type,
    recipientId: input.recipientId,
    botId: input.botId ?? null,
    botName: input.botName ?? null,
    originId: input.originId ?? null,
    previousEntryId: input.previousEntryId ?? null,
    artImageId: null,
    title: null,
    channel: input.channel ?? null,
    isFavorite: false,
    promptId: input.promptId ?? null,
    botResponse: input.botResponse ?? null,
    characterId: input.characterId ?? null,
    isRead: false,
    readAt: null,
    isMature: false,
    serverId: input.serverId ?? null,
    serverName: input.serverName ?? null,
    dreamId: input.dreamId ?? null,
    isActive: true,
  }
}

export async function createChat(
  chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Chat> {
  const response = await performFetch<Chat>('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat),
  })

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to create chat')
  }

  return response.data
}

export async function patchChat(
  chatId: number,
  data: Partial<Chat>,
): Promise<Chat> {
  const response = await performFetch<Chat>(`/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to patch chat')
  }

  return response.data
}

export async function deleteChatById(chatId: number): Promise<boolean> {
  const response = await performFetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
  })

  return response.success
}

export async function fetchChatsForUser(userId: number): Promise<Chat[]> {
  const response = await performFetch<Chat[]>(`/api/chats/user/${userId}`)

  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch chats')
  }

  return response.data || []
}

export async function fetchInboxChatsForUser(userId: number): Promise<Chat[]> {
  const response = await performFetch<Chat[]>(`/api/chats/user/inbox/${userId}`)

  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch inbox chats')
  }

  return response.data || []
}

export async function fetchHumanChatsForUser(userId: number): Promise<Chat[]> {
  return await fetchInboxChatsForUser(userId)
}

export async function markChatAsRead(chatId: number): Promise<void> {
  try {
    await performFetch(`/api/chats/${chatId}/read`, { method: 'PUT' })
  } catch (error) {
    handleError(
      ErrorType.NETWORK_ERROR,
      `Failed to mark chat ${chatId} as read: ${String(error)}`,
    )
  }
}

export async function streamChatResponse(
  chatId: number,
  appendFn: (chunk: string) => void,
): Promise<void> {
  try {
    const response = await fetch(`/api/chats/${chatId}/stream`)

    if (!response.ok || !response.body) {
      throw new Error('Streaming response not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let boundary = -1

      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, boundary).trim()
        buffer = buffer.slice(boundary + 2)

        if (!chunk || chunk === '[DONE]') continue

        try {
          const parsed = JSON.parse(chunk)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) appendFn(content)
        } catch (error) {
          console.error('Error parsing stream chunk:', error)
        }
      }
    }
  } catch (error) {
    handleError(ErrorType.NETWORK_ERROR, `Streaming failed: ${String(error)}`)
  }
}

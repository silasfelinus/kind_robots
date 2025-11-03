// /stores/helpers/chatHelper.ts
import type { Chat, Chat_type } from '@prisma/client'
import { performFetch } from '@/stores/utils'
import { ErrorType } from '@/stores/errorStore'
import { handleError } from '@/stores/utils'

export interface AddChatInput {
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
  type: Chat_type
  characterId: number | null
  username: string
  channel?: string | null
  sender?: string | null
}

export function buildNewChat(
  input: AddChatInput,
): Omit<Chat, 'id' | 'createdAt' | 'updatedAt'> {
  const isUserMessage = !!input.botId
  const sender = isUserMessage ? input.username : input.botName
  const recipient = isUserMessage ? input.botName : input.username

  return {
    content: input.content,
    userId: input.userId,
    sender: input.sender ?? sender ?? 'Unknown',
    recipient: recipient ?? 'Unknown',
    isPublic: input.isPublic ?? true,
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
    isMature: false,
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
  if (!response.success || !response.data)
    throw new Error(response.message || 'Failed to create chat')
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
  if (!response.success || !response.data)
    throw new Error(response.message || 'Failed to patch chat')
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
  if (!response.success)
    throw new Error(response.message || 'Failed to fetch chats')
  return response.data || []
}

export async function markChatAsRead(chatId: number) {
  try {
    await performFetch(`/api/chats/${chatId}/read`, { method: 'PUT' })
  } catch (error) {
    handleError(
      ErrorType.NETWORK_ERROR,
      `Failed to mark chat ${chatId} as read`,
    )
  }
}

export async function streamChatResponse(
  chatId: number,
  appendFn: (chunk: string) => void,
): Promise<void> {
  try {
    const response = await fetch(`/api/chats/${chatId}/stream`)
    if (!response.ok || !response.body)
      throw new Error('Streaming response not supported')

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
          if (content) appendFn(content)
        } catch (err) {
          console.error('Error parsing stream chunk:', err)
        }
      }
    }
  } catch (error) {
    handleError(ErrorType.NETWORK_ERROR, `Streaming failed: ${error}`)
  }
}

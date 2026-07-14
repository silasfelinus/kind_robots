// /stores/conversationStore.ts
//
// Threaded direct messages (new Conversation/DirectMessage models), separate
// from the bot/forum chatStore. Handles the conversation list, the active
// thread, unread counts, and consent-gated sends.
//
// API:
//   GET   /api/conversations
//   POST  /api/conversations                    { recipientId }
//   GET   /api/conversations/:id/messages
//   POST  /api/conversations/:id/messages        { content, isMature? }
//   POST  /api/conversations/:id/read

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from './utils'

export type ConversationParticipant = {
  id: number
  username: string
  avatarImage?: string | null
  artImageId?: number | null
}

export type ConversationSummary = {
  id: number
  isGroup: boolean
  title?: string | null
  lastMessageAt?: string | Date | null
  isMuted: boolean
  isArchived: boolean
  lastReadAt?: string | Date | null
  participants: ConversationParticipant[]
  lastMessage: {
    id: number
    content: string
    senderId: number
    createdAt: string | Date
    isMature: boolean
  } | null
  unreadCount: number
}

export type DirectMessage = {
  id: number
  conversationId: number
  senderId: number
  content: string
  isMature: boolean
  createdAt: string | Date
  editedAt?: string | Date | null
  Sender?: ConversationParticipant
}

export const useConversationStore = defineStore('conversationStore', () => {
  const conversations = ref<ConversationSummary[]>([])
  const messages = ref<DirectMessage[]>([])
  const activeId = ref<number | null>(null)
  const isLoadingList = ref(false)
  const isLoadingThread = ref(false)
  const isSending = ref(false)
  const lastError = ref('')

  const unreadTotal = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
  )
  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeId.value) ?? null,
  )

  async function loadConversations(): Promise<void> {
    isLoadingList.value = true
    try {
      const res = await performFetch<ConversationSummary[]>('/api/conversations')
      conversations.value = res.success && Array.isArray(res.data) ? res.data : []
    } catch (error) {
      handleError(error, 'loadConversations')
    } finally {
      isLoadingList.value = false
    }
  }

  async function loadMessages(conversationId: number): Promise<void> {
    isLoadingThread.value = true
    activeId.value = conversationId
    try {
      const res = await performFetch<DirectMessage[]>(
        `/api/conversations/${conversationId}/messages`,
      )
      messages.value = res.success && Array.isArray(res.data) ? res.data : []
      await markRead(conversationId)
    } catch (error) {
      handleError(error, 'loadMessages')
    } finally {
      isLoadingThread.value = false
    }
  }

  // Open (creating if needed) a 1:1 conversation with a user, then load it.
  async function startWith(recipientId: number): Promise<number | null> {
    lastError.value = ''
    try {
      const res = await performFetch<{ id: number; created: boolean }>(
        '/api/conversations',
        { method: 'POST', body: JSON.stringify({ recipientId }) },
      )
      if (!res.success || !res.data) {
        lastError.value = res.message || 'Could not open conversation.'
        return null
      }
      await loadConversations()
      await loadMessages(res.data.id)
      return res.data.id
    } catch (error) {
      handleError(error, 'startWith')
      lastError.value = 'Could not open conversation.'
      return null
    }
  }

  async function sendMessage(
    conversationId: number,
    content: string,
    isMature = false,
  ): Promise<boolean> {
    const text = content.trim()
    if (!text) return false
    isSending.value = true
    lastError.value = ''
    try {
      const res = await performFetch<DirectMessage>(
        `/api/conversations/${conversationId}/messages`,
        { method: 'POST', body: JSON.stringify({ content: text, isMature }) },
      )
      if (res.success && res.data) {
        if (conversationId === activeId.value) messages.value.push(res.data)
        // Refresh the list so ordering + previews update.
        await loadConversations()
        return true
      }
      lastError.value = res.message || 'Message not sent.'
      return false
    } catch (error) {
      handleError(error, 'sendMessage')
      lastError.value = 'Message not sent.'
      return false
    } finally {
      isSending.value = false
    }
  }

  async function markRead(conversationId: number): Promise<void> {
    try {
      await performFetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      })
      const convo = conversations.value.find((c) => c.id === conversationId)
      if (convo) convo.unreadCount = 0
    } catch (error) {
      handleError(error, 'markRead')
    }
  }

  function reset(): void {
    conversations.value = []
    messages.value = []
    activeId.value = null
  }

  return {
    conversations,
    messages,
    activeId,
    activeConversation,
    unreadTotal,
    isLoadingList,
    isLoadingThread,
    isSending,
    lastError,
    loadConversations,
    loadMessages,
    startWith,
    sendMessage,
    markRead,
    reset,
  }
})

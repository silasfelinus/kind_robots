// /stores/groupChatStore.ts
//
// Shared live group chat for front-end pages (utils/community/rooms.ts).
// Polls /api/rooms/:slug/messages while a room is open and the tab is
// visible; there is no socket. Components only call these actions.
import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'

export type RoomMessage = {
  id: number
  userId: number
  author: string
  body: string
  hidden: boolean
  mine: boolean
  createdAt: string
}

export type RoomInfo = {
  slug: string
  title: string
  welcome: string
  isOpen: boolean
}

type RoomState = {
  info: RoomInfo | null
  messages: RoomMessage[]
  loading: boolean
  sending: boolean
  error: string
  lastSentAt: number
}

const POLL_MS = 6000

export const useGroupChatStore = defineStore('groupChat', () => {
  const userStore = useUserStore()
  const rooms = reactive<Record<string, RoomState>>({})
  const timers = new Map<string, ReturnType<typeof setInterval>>()

  function room(slug: string): RoomState {
    if (!rooms[slug]) {
      rooms[slug] = {
        info: null,
        messages: [],
        loading: false,
        sending: false,
        error: '',
        lastSentAt: 0,
      }
    }
    return rooms[slug]
  }

  const canJoin = () => userStore.isLoggedIn && !userStore.isMaturityRestricted

  async function refresh(slug: string): Promise<boolean> {
    const state = room(slug)
    if (!canJoin() || state.loading) return false
    state.loading = true
    try {
      const after = state.messages[state.messages.length - 1]?.id
      const response = await performFetch<{
        room: RoomInfo
        messages: RoomMessage[]
      }>(`/api/rooms/${slug}/messages${after ? `?after=${after}` : ''}`, {
        cache: 'no-store',
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load the room.')
      }
      state.info = response.data.room
      const known = new Set(state.messages.map((message) => message.id))
      const fresh = response.data.messages.filter((m) => !known.has(m.id))
      if (fresh.length) {
        state.messages = [...state.messages, ...fresh].slice(-200)
      }
      state.error = ''
      return true
    } catch (caught) {
      state.error =
        caught instanceof Error ? caught.message : 'Could not load the room.'
      return false
    } finally {
      state.loading = false
    }
  }

  function open(slug: string) {
    room(slug)
    if (typeof window === 'undefined' || timers.has(slug)) return
    void refresh(slug)
    timers.set(
      slug,
      setInterval(() => {
        if (document.visibilityState === 'visible') void refresh(slug)
      }, POLL_MS),
    )
  }

  function close(slug: string) {
    const timer = timers.get(slug)
    if (timer) clearInterval(timer)
    timers.delete(slug)
  }

  async function send(slug: string, body: string): Promise<boolean> {
    const state = room(slug)
    const text = body.trim()
    if (!text || state.sending || !canJoin()) return false
    state.sending = true
    state.error = ''
    try {
      const response = await performFetch<{ id: number }>(
        `/api/rooms/${slug}/messages`,
        { method: 'POST', body: JSON.stringify({ body: text }) },
      )
      if (!response.success) {
        throw new Error(response.message || 'Message not sent.')
      }
      state.lastSentAt = Date.now()
      await refresh(slug)
      return true
    } catch (caught) {
      state.error =
        caught instanceof Error ? caught.message : 'Message not sent.'
      return false
    } finally {
      state.sending = false
    }
  }

  async function remove(slug: string, id: number): Promise<boolean> {
    const state = room(slug)
    const response = await performFetch<{ id: number }>(
      `/api/rooms/messages/${id}`,
      { method: 'DELETE' },
    )
    if (!response.success) {
      state.error = response.message || 'Could not remove that message.'
      return false
    }
    state.messages = state.messages.map((message) =>
      message.id === id ? { ...message, hidden: true, body: '' } : message,
    )
    return true
  }

  return { rooms, room, canJoin, refresh, open, close, send, remove }
})

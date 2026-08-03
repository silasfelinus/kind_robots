// /stores/notificationStore.ts
//
// In-app notifications (new DM, friend request/accept, admin/system notices).
// Conductor attention is projected into the same bell for admins without
// duplicating roadmap state into the application database.
//
// API:
//   GET  /api/notifications                 -> { items, unreadCount }
//   POST /api/notifications/:id/read
//   POST /api/notifications/read-all

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch, handleError } from './utils'
import { useConductorStore } from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'

export type NotificationType =
  | 'MESSAGE'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'ADMIN'
  | 'SYSTEM'

export type AppNotification = {
  id: number
  type: NotificationType
  title: string
  body?: string | null
  linkPath?: string | null
  actorId?: number | null
  entityId?: number | null
  isRead: boolean
  createdAt: string | Date
}

const CONDUCTOR_NOTIFICATION_ID = -1
const CONDUCTOR_SEEN_KEY = 'kr.conductorAttentionSeenSignature'

function readSeenSignature(): string {
  if (!import.meta.client) return ''
  try {
    return localStorage.getItem(CONDUCTOR_SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeSeenSignature(signature: string): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(CONDUCTOR_SEEN_KEY, signature)
  } catch {}
}

export const useNotificationStore = defineStore('notificationStore', () => {
  const items = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const conductorAttentionSignature = ref('')

  async function conductorNotification(): Promise<AppNotification | null> {
    const userStore = useUserStore()
    if (!userStore.isAdmin) return null

    const conductorStore = useConductorStore()
    await conductorStore.fetchProjects()
    if (!conductorStore.hasLiveData) return null

    const gateKeys = conductorStore.humanGates.map(
      ({ project, task }) =>
        `gate:${project.slug}/${task.id}:${task.updated ?? task.status}`,
    )
    const pitchKeys = conductorStore.pendingPitches.map(
      (pitch) => `pitch:${pitch.slug}:${pitch.status}`,
    )
    const keys = [...gateKeys, ...pitchKeys].sort()
    if (!keys.length) {
      conductorAttentionSignature.value = ''
      return null
    }

    const signature = JSON.stringify(keys)
    conductorAttentionSignature.value = signature
    const gateCount = conductorStore.humanGates.length
    const pitchCount = conductorStore.pendingPitches.length
    const parts = [
      gateCount
        ? `${gateCount} human gate${gateCount === 1 ? '' : 's'}`
        : '',
      pitchCount
        ? `${pitchCount} pitch${pitchCount === 1 ? '' : 'es'}`
        : '',
    ].filter(Boolean)

    return {
      id: CONDUCTOR_NOTIFICATION_ID,
      type: 'ADMIN',
      title: 'Conductor needs your attention',
      body: `${parts.join(' and ')} waiting in For You.`,
      linkPath: '/for-you',
      isRead: readSeenSignature() === signature,
      createdAt: conductorStore.fetchedAt ?? new Date().toISOString(),
    }
  }

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const [res, conductorItem] = await Promise.all([
        performFetch<{
          items: AppNotification[]
          unreadCount: number
        }>('/api/notifications'),
        conductorNotification(),
      ])
      if (res.success && res.data) {
        const databaseItems = res.data.items ?? []
        items.value = conductorItem
          ? [conductorItem, ...databaseItems]
          : databaseItems
        unreadCount.value =
          (res.data.unreadCount ?? 0) +
          (conductorItem && !conductorItem.isRead ? 1 : 0)
      }
    } catch (error) {
      handleError(error, 'loadNotifications')
    } finally {
      isLoading.value = false
    }
  }

  async function markRead(id: number): Promise<void> {
    if (id === CONDUCTOR_NOTIFICATION_ID) {
      writeSeenSignature(conductorAttentionSignature.value)
      const notification = items.value.find((item) => item.id === id)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      return
    }

    try {
      const res = await performFetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })
      if (res.success) {
        const notification = items.value.find((item) => item.id === id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    } catch (error) {
      handleError(error, 'markNotificationRead')
    }
  }

  async function markAllRead(): Promise<void> {
    try {
      const res = await performFetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (res.success) {
        if (conductorAttentionSignature.value) {
          writeSeenSignature(conductorAttentionSignature.value)
        }
        items.value.forEach((item) => (item.isRead = true))
        unreadCount.value = 0
      }
    } catch (error) {
      handleError(error, 'markAllNotificationsRead')
    }
  }

  function reset(): void {
    items.value = []
    unreadCount.value = 0
    conductorAttentionSignature.value = ''
  }

  return { items, unreadCount, isLoading, load, markRead, markAllRead, reset }
})

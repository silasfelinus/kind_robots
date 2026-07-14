// /stores/notificationStore.ts
//
// In-app notifications (new DM, friend request/accept, admin/system notices).
//
// API:
//   GET  /api/notifications                 -> { items, unreadCount }
//   POST /api/notifications/:id/read
//   POST /api/notifications/read-all

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch, handleError } from './utils'

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

export const useNotificationStore = defineStore('notificationStore', () => {
  const items = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const res = await performFetch<{
        items: AppNotification[]
        unreadCount: number
      }>('/api/notifications')
      if (res.success && res.data) {
        items.value = res.data.items ?? []
        unreadCount.value = res.data.unreadCount ?? 0
      }
    } catch (error) {
      handleError(error, 'loadNotifications')
    } finally {
      isLoading.value = false
    }
  }

  async function markRead(id: number): Promise<void> {
    try {
      const res = await performFetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })
      if (res.success) {
        const n = items.value.find((i) => i.id === id)
        if (n && !n.isRead) {
          n.isRead = true
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
        items.value.forEach((i) => (i.isRead = true))
        unreadCount.value = 0
      }
    } catch (error) {
      handleError(error, 'markAllNotificationsRead')
    }
  }

  function reset(): void {
    items.value = []
    unreadCount.value = 0
  }

  return { items, unreadCount, isLoading, load, markRead, markAllRead, reset }
})

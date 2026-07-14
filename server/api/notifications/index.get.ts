// /server/api/notifications/index.get.ts
// Authenticated: my recent notifications (newest first) + unread count.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])

    return { success: true, data: { items, unreadCount } }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to load notifications.', data: { items: [], unreadCount: 0 } }
  }
})

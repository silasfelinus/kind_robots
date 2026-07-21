// /server/api/notifications/index.get.ts
// Authenticated: my recent notifications (newest first) + unread count.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    // Older notifications were not linked to their UserRelation row, so a
    // canceled request or deleted test account could leave a convincing ghost.
    // Reconcile request notifications against the live pending relationships
    // whenever the notification inbox is loaded.
    const requestNotifications = await prisma.notification.findMany({
      where: { userId: user.id, type: 'FRIEND_REQUEST' },
      select: { id: true, actorId: true, entityId: true },
    })

    if (requestNotifications.length > 0) {
      const actorIds = [
        ...new Set(
          requestNotifications
            .map((notification) => notification.actorId)
            .filter((actorId): actorId is number => actorId !== null),
        ),
      ]
      const pendingRequests =
        actorIds.length > 0
          ? await prisma.userRelation.findMany({
              where: {
                userId: { in: actorIds },
                relatedUserId: user.id,
                type: 'FRIEND',
                status: 'PENDING',
              },
              select: { id: true, userId: true },
            })
          : []
      const pendingByActor = new Map(
        pendingRequests.map((request) => [request.userId, request.id]),
      )
      const staleIds = requestNotifications
        .filter((notification) => {
          if (notification.actorId === null) return true
          const relationId = pendingByActor.get(notification.actorId)
          if (!relationId) return true
          return (
            notification.entityId !== null &&
            notification.entityId !== relationId
          )
        })
        .map((notification) => notification.id)

      if (staleIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { id: { in: staleIds } },
        })
      }
    }

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
    return {
      success: false,
      message: handled.message || 'Failed to load notifications.',
      data: { items: [], unreadCount: 0 },
    }
  }
})

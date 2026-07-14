// /server/api/conversations/index.get.ts
// Authenticated: list my conversations with the other participant(s), the last
// message, and my unread count (derived from my lastReadAt).
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const memberships = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        Conversation: {
          include: {
            participants: {
              include: {
                User: {
                  select: { id: true, username: true, avatarImage: true, artImageId: true },
                },
              },
            },
          },
        },
      },
      orderBy: { Conversation: { lastMessageAt: 'desc' } },
    })

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const convo = m.Conversation
        const lastMessage = await prisma.directMessage.findFirst({
          where: { conversationId: convo.id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, senderId: true, createdAt: true, isMature: true },
        })
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: convo.id,
            deletedAt: null,
            senderId: { not: user.id },
            ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
          },
        })

        return {
          id: convo.id,
          isGroup: convo.isGroup,
          title: convo.title,
          lastMessageAt: convo.lastMessageAt,
          isMuted: m.isMuted,
          isArchived: m.isArchived,
          lastReadAt: m.lastReadAt,
          participants: convo.participants
            .filter((p) => p.userId !== user.id)
            .map((p) => ({
              id: p.User.id,
              username: p.User.username,
              avatarImage: p.User.avatarImage,
              artImageId: p.User.artImageId,
            })),
          lastMessage,
          unreadCount,
        }
      }),
    )

    return { success: true, data: conversations }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to load conversations.', data: [] }
  }
})

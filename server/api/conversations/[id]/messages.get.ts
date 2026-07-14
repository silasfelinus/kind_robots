// /server/api/conversations/[id]/messages.get.ts
// Authenticated + participant-only: fetch a conversation's messages (oldest
// first) with basic sender info.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const conversationId = Number(event.context.params?.id)
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid conversation id.',
      })
    }

    const membership = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      select: { id: true },
    })
    if (!membership) {
      throw createError({
        statusCode: 403,
        message: 'You are not in this conversation.',
      })
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        Sender: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
            artImageId: true,
          },
        },
      },
    })

    return { success: true, data: messages }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load messages.',
      data: [],
    }
  }
})

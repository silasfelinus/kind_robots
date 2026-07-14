// /server/api/conversations/[id]/messages.post.ts
// Authenticated + participant-only: send a message. Re-checks consent against
// each other participant, bumps the conversation, and notifies recipients.
// Body: { content, isMature? }
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { canMessage } from '../../../utils/messaging'
import { createNotification } from '../../../utils/notify'

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

    const { content, isMature } = await readBody<{
      content?: string
      isMature?: boolean
    }>(event)
    const text = String(content || '').trim()
    if (!text) {
      throw createError({
        statusCode: 400,
        message: 'Message content is required.',
      })
    }

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    })
    const isMember = participants.some((p) => p.userId === user.id)
    if (!isMember) {
      throw createError({
        statusCode: 403,
        message: 'You are not in this conversation.',
      })
    }

    // Consent re-check against the other participant(s) at send time.
    const others = participants
      .map((p) => p.userId)
      .filter((id) => id !== user.id)
    for (const otherId of others) {
      const gate = await canMessage(user.id, otherId)
      if (!gate.ok) {
        throw createError({ statusCode: gate.status, message: gate.reason })
      }
    }

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        content: text,
        isMature: isMature === true,
      },
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

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    })

    // Mark my own read pointer forward so my unread count stays at zero.
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: message.createdAt },
    })

    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text
    await Promise.all(
      others.map((otherId) =>
        createNotification({
          userId: otherId,
          type: 'MESSAGE',
          title: `New message from ${message.Sender.username}`,
          body: preview,
          linkPath: `/messages?c=${conversationId}`,
          actorId: user.id,
          entityId: conversationId,
        }),
      ),
    )

    event.node.res.statusCode = 201
    return { success: true, message: 'Message sent.', data: message }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to send message.',
    }
  }
})

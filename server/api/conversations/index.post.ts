// /server/api/conversations/index.post.ts
// Authenticated: start (or return the existing) 1:1 conversation with a user.
// Consent-gated via canMessage. Body: { recipientId }.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { canMessage } from '../../utils/messaging'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const { recipientId } = await readBody<{ recipientId?: number }>(event)

    const targetId = Number(recipientId)
    if (!Number.isInteger(targetId) || targetId <= 0) {
      throw createError({ statusCode: 400, message: 'recipientId is required.' })
    }

    const gate = await canMessage(user.id, targetId)
    if (!gate.ok) {
      throw createError({ statusCode: gate.status, message: gate.reason })
    }

    // Reuse an existing 1:1 conversation if one exists.
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetId } } },
        ],
      },
      select: { id: true },
    })

    if (existing) {
      return { success: true, message: 'Conversation ready.', data: { id: existing.id, created: false } }
    }

    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: user.id }, { userId: targetId }],
        },
      },
      select: { id: true },
    })

    return { success: true, message: 'Conversation started.', data: { id: created.id, created: true } }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to start conversation.' }
  }
})

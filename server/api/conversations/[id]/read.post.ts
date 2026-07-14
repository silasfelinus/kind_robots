// /server/api/conversations/[id]/read.post.ts
// Authenticated + participant-only: mark the conversation read up to now
// (stamps my lastReadAt, which drives unread counts / read receipts).
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const conversationId = Number(event.context.params?.id)
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid conversation id.' })
    }

    const membership = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      select: { id: true },
    })
    if (!membership) {
      throw createError({ statusCode: 403, message: 'You are not in this conversation.' })
    }

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    })

    return { success: true, message: 'Marked read.' }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to mark read.' }
  }
})

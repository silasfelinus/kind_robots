// /server/api/notifications/[id]/read.post.ts
// Authenticated: mark one of my notifications read.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid notification id.' })
    }

    // Scope the update to the owner so nobody can read others' notifications.
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    })
    if (result.count === 0) {
      throw createError({ statusCode: 404, message: 'Notification not found.' })
    }

    return { success: true, message: 'Marked read.' }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to mark read.' }
  }
})

// /server/api/users/[id]/restrict.post.ts
// Admin-only: shadow-restrict a user. Sets isRestricted, records who/why/when,
// bulk-flips all their content to private, and emails a courtesy notice.
// The user can still sign in; their content is just hidden from the public.
// Body: { reason? }
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { privatizeUserContent } from '../../../utils/restriction'
import { sendRestrictionNotice } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid user id.' })
    }
    if (userId === admin.id) {
      throw createError({ statusCode: 400, message: 'You cannot restrict yourself.' })
    }

    const { reason } = await readBody<{ reason?: string }>(event)

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, name: true },
    })
    if (!target) {
      throw createError({ statusCode: 404, message: 'User not found.' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isRestricted: true,
        restrictedAt: new Date(),
        restrictedReason: reason ? String(reason).slice(0, 1000) : null,
        restrictedById: admin.id,
      },
      select: { id: true, username: true, isRestricted: true, restrictedAt: true },
    })

    await privatizeUserContent(userId)

    if (target.email) {
      await sendRestrictionNotice(target.email, target.name || target.username, reason)
    }

    await logAdminAction(
      admin,
      `Restricted user ${target.username} (#${userId})${reason ? `: ${reason}` : ''}.`,
    )

    return { success: true, message: `${target.username} restricted.`, data: updated }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Restrict failed.' }
  }
})

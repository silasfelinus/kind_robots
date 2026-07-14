// /server/api/users/[id]/unrestrict.post.ts
// Admin-only: lift a shadow-restriction. Clears the flag; content stays private
// (the user re-shares what they want) so un-restrict is intentionally not an
// auto-un-hide.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid user id.' })
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })
    if (!target) {
      throw createError({ statusCode: 404, message: 'User not found.' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isRestricted: false,
        restrictedAt: null,
        restrictedReason: null,
        restrictedById: null,
      },
      select: { id: true, username: true, isRestricted: true },
    })

    await logAdminAction(admin, `Lifted restriction on ${target.username} (#${userId}).`)

    return {
      success: true,
      message: `${target.username} is no longer restricted. Their content stays private until they re-share it.`,
      data: updated,
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Unrestrict failed.' }
  }
})

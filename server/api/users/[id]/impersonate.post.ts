// /server/api/users/[id]/impersonate.post.ts
// Admin-only: mint a session token for another user so an admin can "log in as"
// them (added to the login-manager directory client-side). Audited.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { createToken } from '~/server/api/auth'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid user id.' })
    }

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) {
      throw createError({ statusCode: 404, message: 'User not found.' })
    }
    if (target.isActive === false) {
      throw createError({ statusCode: 400, message: 'That account is inactive.' })
    }

    const token = await createToken(target)

    await logAdminAction(
      admin,
      `Impersonated ${target.username} (#${userId}).`,
    )

    return {
      success: true,
      message: `Session minted for ${target.username}.`,
      data: {
        token,
        user: {
          id: target.id,
          username: target.username,
          Role: target.Role,
          avatarImage: target.avatarImage,
          artImageId: target.artImageId,
        },
      },
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Impersonation failed.' }
  }
})

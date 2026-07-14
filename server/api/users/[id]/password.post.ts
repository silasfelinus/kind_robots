// /server/api/users/[id]/password.post.ts
// Admin-only: securely set a user's password (no current-password needed).
// Body: { newPassword }. Never returns the hash.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { hashPassword, validatePassword } from '~/server/api/auth'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid user id.' })
    }

    const { newPassword } = await readBody<{ newPassword?: string }>(event)
    if (!newPassword) {
      throw createError({
        statusCode: 400,
        message: 'newPassword is required.',
      })
    }
    const check = validatePassword(newPassword)
    if (!check.isValid) {
      throw createError({ statusCode: 400, message: check.message })
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })
    if (!target) {
      throw createError({ statusCode: 404, message: 'User not found.' })
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    await logAdminAction(
      admin,
      `Reset password for ${target.username} (#${userId}).`,
    )

    return {
      success: true,
      message: `Password updated for ${target.username}.`,
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Password reset failed.',
    }
  }
})

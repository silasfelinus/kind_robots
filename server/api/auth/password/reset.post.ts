// /server/api/auth/password/reset.post.ts
// Complete a password reset. Body: { token, newPassword }.
// Consumes a PASSWORD_RESET token and sets the new password.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { consumeAuthToken } from '../../../utils/authToken'
import { hashPassword, validatePassword } from '~/server/api/auth'

export default defineEventHandler(async (event) => {
  try {
    const { token, newPassword } = await readBody<{
      token?: string
      newPassword?: string
    }>(event)

    if (!token) {
      throw createError({ statusCode: 400, message: 'Reset token is required.' })
    }
    if (!newPassword) {
      throw createError({ statusCode: 400, message: 'newPassword is required.' })
    }

    const check = validatePassword(newPassword)
    if (!check.isValid) {
      throw createError({ statusCode: 400, message: check.message })
    }

    const result = await consumeAuthToken(token, 'PASSWORD_RESET')
    if (!result.ok) {
      throw createError({
        statusCode: 400,
        message:
          result.reason === 'expired'
            ? 'This reset link has expired. Please request a new one.'
            : 'This reset link is invalid or already used.',
      })
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: result.userId },
      data: { password: hashed },
    })

    return { success: true, message: 'Password reset. You can now sign in.' }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Password reset failed.' }
  }
})

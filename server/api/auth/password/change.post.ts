// /server/api/auth/password/change.post.ts
// Authenticated self-service password change.
// Body: { currentPassword?, newPassword }
// - Verifies currentPassword when the account already has one.
// - Passwordless accounts (password === null) may set a first password without
//   a currentPassword (mirrors validateUserCredentials' passwordless design).
import { defineEventHandler, createError, readBody } from 'h3'
import { compare as bcryptCompare } from 'bcryptjs'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { hashPassword, validatePassword } from '~/server/api/auth'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const { currentPassword, newPassword } = await readBody<{
      currentPassword?: string
      newPassword?: string
    }>(event)

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

    // Fetch the current hash directly (authGuard's user may be a projection).
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (record?.password) {
      const matches = currentPassword
        ? await bcryptCompare(currentPassword, record.password)
        : false
      if (!matches) {
        throw createError({
          statusCode: 403,
          message: 'Current password is incorrect.',
        })
      }
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return { success: true, message: 'Password updated.' }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Password change failed.',
    }
  }
})

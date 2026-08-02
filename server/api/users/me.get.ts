// /server/api/users/me.get.ts
import { createError, defineEventHandler } from 'h3'
import { requireApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const { user } = auth

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        Role: user.Role,
        // The complete set, so the client's isUserAdmin/hasUserRole can answer
        // correctly instead of reading only the primary column.
        roles: [...new Set([user.Role, ...user.roles])],
        isAdmin: auth.isAdmin,
        isServerKey: auth.isServerKey,
        authKind: auth.kind,
        avatarImage: user.avatarImage,
        artImageId: user.artImageId,
        isActive: user.isActive,
        introDismissedAt: user.introDismissedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    throw createError({
      statusCode: statusCode ?? 401,
      message,
    })
  }
})

// /server/api/socials/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SocialPost ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const item = await prisma.socialPost.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!item) {
      throw createError({
        statusCode: 404,
        message: `SocialPost with ID ${id} not found.`,
      })
    }

    if (user.Role !== 'ADMIN' && item.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this SocialPost.',
      })
    }

    const deleted = await prisma.socialPost.delete({ where: { id } })
    event.node.res.statusCode = 200

    return {
      success: true,
      message: `SocialPost with ID ${id} successfully deleted.`,
      data: deleted,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Error deleting SocialPost:', handled)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        (Number.isInteger(id) && id > 0
          ? `Failed to delete SocialPost with ID ${id}.`
          : 'Failed to delete SocialPost.'),
      data: null,
      statusCode,
    }
  }
})

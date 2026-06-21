// /server/api/socials/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SocialPost ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }
    const userId = user.id

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

    if (user.Role === 'ADMIN' || item.userId === userId) {
      // onDelete: Cascade on SocialTarget handles child rows.
      const deleted = await prisma.socialPost.delete({ where: { id } })
      return {
        success: true,
        message: `SocialPost with ID ${id} successfully deleted.`,
        data: deleted,
        statusCode: 200,
      }
    }

    throw createError({
      statusCode: 403,
      message: 'You are not authorized to delete this SocialPost.',
    })
  } catch (error) {
    const handled = errorHandler(error)
    console.error('Error deleting SocialPost:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to delete SocialPost with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

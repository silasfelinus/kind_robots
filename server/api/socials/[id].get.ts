// /server/api/socials/[id].get.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SocialPost ID. Must be a positive integer.',
      })
    }

    const data = await prisma.socialPost.findUnique({
      where: { id },
      include: { targets: true },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `SocialPost with ID ${id} not found.`,
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'SocialPost fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Error fetching SocialPost:', handled)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        (Number.isInteger(id) && id > 0
          ? `Failed to fetch SocialPost with ID ${id}.`
          : 'Failed to fetch SocialPost.'),
      data: null,
      statusCode,
    }
  }
})

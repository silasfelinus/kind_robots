// /server/api/socials/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  let response

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
    response = {
      success: true,
      message: 'SocialPost fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('Error fetching SocialPost:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message:
        handled.message ||
        (Number.isInteger(id) && id > 0
          ? `Failed to fetch SocialPost with ID ${id}.`
          : 'Failed to fetch SocialPost.'),
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

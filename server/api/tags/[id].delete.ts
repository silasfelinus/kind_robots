// /server/api/tags/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  const tagId = Number(event.context.params?.id)

  try {
    // Validate Tag ID
    if (isNaN(tagId) || tagId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Tag ID. It must be a positive integer.',
      })
    }

    // Validate Authorization Token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }
    const userId = user.id

    // Validate Tag Existence and Ownership
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })

    if (!tag) {
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }

    if (tag.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this tag.',
      })
    }

    // Perform Deletion
    await prisma.tag.delete({ where: { id: tagId } })

    // Success Response
    response = {
      success: true,
      message: `Tag with ID ${tagId} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error) {
    // Handle and respond with a standardized error format
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || `Failed to delete tag with ID ${tagId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})

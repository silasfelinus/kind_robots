// /server/api/tags/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const tagId = Number(event.context.params?.id)

  try {
    // Validate Tag ID
    if (isNaN(tagId) || tagId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Tag ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
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

    // Successful deletion response
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Tag with ID ${tagId} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting tag:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || `Failed to delete tag with ID ${tagId}.`,
    }
  }
})

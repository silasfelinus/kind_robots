// /server/api/tags/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let tagId: number | null = null

  try {
    // Parse and validate the Tag ID
    tagId = Number(event.context.params?.id)
    if (isNaN(tagId) || tagId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Tag ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete tag with ID: ${tagId}`)

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the tag exists and if the user is authorized to delete it
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })

    if (!tag) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }

    // Ensure the user is the creator of the tag
    if (tag.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this tag.',
      })
    }

    // Delete the tag
    await prisma.tag.delete({ where: { id: tagId } })
    console.log(`Successfully deleted tag with ID: ${tagId}`)

    // Successful deletion response
    response = {
      success: true,
      message: `Tag with ID ${tagId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    console.error('Error deleting tag:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete tag with ID ${tagId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

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
      console.error(`Invalid tag ID provided: ${tagId}`)
      throw createError({
        statusCode: 400,
        message: 'Invalid Tag ID. It must be a positive integer.',
      })
    }
    console.log(`Attempting to delete tag with ID: ${tagId}`)

    // Validate Authorization Token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
      console.error('Authorization token is missing or incorrectly formatted.')
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
      console.error(`Invalid or expired token: ${token}`)
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }
    const userId = user.id
    console.log(`User ID from token: ${userId}`)

    // Validate Tag Existence and Ownership
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })

    if (!tag) {
      console.error(`Tag with ID ${tagId} does not exist.`)
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }

    if (tag.userId !== userId) {
      console.error(
        `User ${userId} does not have permission to delete tag ${tagId}`,
      )
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this tag.',
      })
    }

    // Perform Deletion
    await prisma.tag.delete({ where: { id: tagId } })
    console.log(`Successfully deleted tag with ID: ${tagId}`)

    // Success Response
    response = {
      success: true,
      message: `Tag with ID ${tagId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(`Error deleting tag with ID ${tagId}:`, handledError)

    // Error Response with Status Code and Message
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete tag with ID ${tagId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

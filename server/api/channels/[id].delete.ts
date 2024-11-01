import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { extractTokenFromHeader, getUserIdFromToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id
  try {
    // Validate and parse the channel ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Channel ID. It must be a positive integer.',
      })
    }

    // Extract and verify authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    const token = extractTokenFromHeader(authorizationHeader)
    if (!token) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    // Get userId from token
    const tokenUserId = await getUserIdFromToken(token)
    if (!tokenUserId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the channel and verify ownership in one step
    const channel = await prisma.channel.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!channel) {
      throw createError({
        statusCode: 404,
        message: `Channel with ID ${id} does not exist.`,
      })
    }

    // Check if the user is authorized to delete this channel
    if (channel.userId !== tokenUserId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this channel.',
      })
    }

    // Attempt to delete the channel
    await prisma.channel.delete({ where: { id } })

    return {
      success: true,
      message: `Channel with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete channel with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate and parse the channel ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Channel ID. It must be a positive integer.',
      })
    }

    // Extract the token from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the channel to verify ownership
    const channel = await prisma.channel.findUnique({ where: { id } })
    if (!channel) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Channel with ID ${id} does not exist.`,
      })
    }

    // Verify that the user is the owner of the channel
    if (channel.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this channel.',
      })
    }

    // Attempt to delete the channel
    await prisma.channel.delete({ where: { id } })

    return {
      success: true,
      message: `Channel with ID ${id} successfully deleted.`,
      statusCode: 200, // Explicitly setting statusCode for Cypress testing
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

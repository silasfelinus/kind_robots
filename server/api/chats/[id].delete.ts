import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate and parse the chat ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Chat ID. It must be a positive integer.',
      })
    }

    // Extract and verify the JWT token
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

    // Check if the chat entry exists and verify ownership
    const chatExchange = await prisma.chatExchange.findUnique({ where: { id } })
    if (!chatExchange) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Chat exchange with ID ${id} does not exist.`,
      })
    }

    if (chatExchange.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this chat exchange.',
      })
    }

    // Proceed to delete the chat entry
    await prisma.chatExchange.delete({ where: { id } })

    return {
      success: true,
      message: `Chat exchange with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete chat exchange with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

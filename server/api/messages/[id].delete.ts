// server/api/messages/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate and parse the message ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Message ID. It must be a positive integer.',
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

    // Check if the message exists and verify ownership
    const message = await prisma.message.findUnique({ where: { id } })
    if (!message) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Message with ID ${id} does not exist.`,
      })
    }

    if (message.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this message.',
      })
    }

    // Proceed to delete the message
    await prisma.message.delete({ where: { id } })

    return {
      success: true,
      message: `Message with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete message with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to delete a message by ID (used in other parts of the application)
export async function deleteMessage(
  id: number,
  userId: number,
): Promise<boolean> {
  try {
    const message = await prisma.message.findUnique({ where: { id } })

    if (!message || message.userId !== userId) {
      return false
    }

    await prisma.message.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

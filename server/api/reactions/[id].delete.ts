// /server/api/reactions/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let reactionId: number | null = null

  try {
    // Validate and parse the reaction ID
    reactionId = Number(event.context.params?.id)
    if (isNaN(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid reaction ID. ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete reaction with ID: ${reactionId}`)

    // Extract and verify the JWT token from the request
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

    // Check if the reaction exists and if the user is authorized to delete it
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    })

    if (!reaction) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Reaction with ID ${reactionId} not found.`,
      })
    }

    if (reaction.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this reaction.',
      })
    }

    // Delete the reaction
    await prisma.reaction.delete({
      where: { id: reactionId },
    })

    console.log(`Successfully deleted reaction with ID: ${reactionId}`)

    return {
      success: true,
      message: `Reaction with ID ${reactionId} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error deleting reaction:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete reaction with ID ${reactionId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

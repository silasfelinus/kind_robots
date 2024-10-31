// /server/api/rewards/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let rewardId: number | null = null

  try {
    // Parse and validate the reward ID
    rewardId = Number(event.context.params?.id)
    if (isNaN(rewardId) || rewardId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid reward ID. ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete reward with ID: ${rewardId}`)

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

    // Check if the reward exists and if the user is authorized to delete it
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } })
    if (!reward) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Reward with ID ${rewardId} not found.`,
      })
    }

    // Only the creator or admin should be able to delete the reward
    if (reward.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this reward.',
      })
    }

    // Delete the reward
    await prisma.reward.delete({ where: { id: rewardId } })
    console.log(`Successfully deleted reward with ID: ${rewardId}`)

    return {
      success: true,
      message: `Reward with ID ${rewardId} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error deleting reward:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete reward with ID ${rewardId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

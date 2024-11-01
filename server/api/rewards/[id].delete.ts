// /server/api/rewards/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let rewardId

  try {
    // Parse and validate the reward ID
    rewardId = Number(event.context.params?.id)
    if (isNaN(rewardId) || rewardId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete reward with ID: ${rewardId}`)

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401, // Unauthorized
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
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the reward exists and if the user is authorized to delete it
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true },
    })

    if (!reward) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404, // Not Found
        message: `Reward with ID ${rewardId} does not exist.`,
      })
    }

    // Ensure the user is the creator of the reward
    if (reward.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this reward.',
      })
    }

    // Delete the reward
    await prisma.reward.delete({ where: { id: rewardId } })
    console.log(`Successfully deleted reward with ID: ${rewardId}`)

    // Successful deletion response
    response = {
      success: true,
      message: `Reward with ID ${rewardId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting reward:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to delete reward with ID ${rewardId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

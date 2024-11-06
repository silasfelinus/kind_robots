// /server/api/rewards/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  const rewardId = Number(event.context.params?.id)

  try {
    // Validate Reward ID
    if (isNaN(rewardId) || rewardId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

    // Validate Authorization Token
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
    console.log(
      `User ID ${userId} is requesting deletion for Reward ID ${rewardId}`,
    )

    // Check if the reward exists and if the user is authorized to delete it
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true },
    })

    if (!reward) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Reward with ID ${rewardId} does not exist.`,
      })
    }

    // Ensure the requesting user is the creator of the reward
    if (reward.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this reward.',
      })
    }

    // Perform Deletion
    await prisma.reward.delete({ where: { id: rewardId } })
    console.log(`Successfully deleted reward with ID: ${rewardId}`)

    // Return Success Response
    response = {
      success: true,
      message: `Reward with ID ${rewardId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error deleting reward with ID ${rewardId}:`, handledError)

    // Set response with error information
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

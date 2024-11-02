// /server/api/rewards/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Reward } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let rewardId

  try {
    // Validate the Reward ID
    rewardId = Number(event.context.params?.id)
    if (isNaN(rewardId) || rewardId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

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

    // Fetch the existing reward and verify ownership
    const existingReward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true },
    })

    if (!existingReward) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Reward with ID ${rewardId} does not exist.`,
      })
    }

    if (existingReward.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'User is not authorized to update this reward.',
      })
    }

    // Parse and validate the update data
    const updatedRewardData: Partial<Reward> = await readBody(event)
    if (!updatedRewardData || Object.keys(updatedRewardData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the reward in the database
    const updatedReward = await prisma.reward.update({
      where: { id: rewardId },
      data: updatedRewardData,
    })

    // Successful update response
    response = {
      success: true,
      updatedReward,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error updating reward with ID ${rewardId}:`, handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update reward with ID ${rewardId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

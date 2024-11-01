// /server/api/rewards/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import type { Reward } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let rewardId: number | null = null

  try {
    // Parse and validate the reward ID from the URL params
    rewardId = Number(event.context.params?.id)
    if (isNaN(rewardId) || rewardId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID.',
      })
    }

    // Extract and validate the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = verificationResult.userId // Use userId from the token

    // Fetch the existing reward to ensure it exists
    const existingReward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true }, // Fetch userId to check ownership
    })
    if (!existingReward) {
      throw createError({
        statusCode: 404,
        message: 'Reward not found.',
      })
    }

    // Verify ownership of the reward
    if (existingReward.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reward.',
      })
    }

    // Parse the request body as partial Reward data
    const data: Partial<Reward> = await readBody(event)

    // Update the reward in the database
    const updatedReward = await prisma.reward.update({
      where: { id: rewardId },
      data,
    })

    return {
      success: true,
      reward: updatedReward,
    }
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: `Updating reward with ID ${rewardId}`,
    })
  }
})

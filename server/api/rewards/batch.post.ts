// /server/api/rewards/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { createRewardsBatch } from './' // Import the batch creation function
import { errorHandler } from '../utils/error' // Import centralized error handler
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate incoming rewards data
    const rewardsData = await readBody(event)

    if (!Array.isArray(rewardsData)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Expected an array of rewards.',
      })
    }

    // Validate each reward object in the array
    for (const rewardData of rewardsData) {
      if (!rewardData.text || !rewardData.power || !rewardData.icon) {
        throw createError({
          statusCode: 400,
          message: 'Each reward must have "text," "power," and an "icon".',
        })
      }

      // Check if userId is provided in the reward and matches the authenticated user
      if (rewardData.userId && rewardData.userId !== authenticatedUserId) {
        throw createError({
          statusCode: 403,
          message: 'User ID in reward does not match the authenticated user.',
        })
      }
    }

    // Create rewards in batch
    const { count, rewards, errors } = await createRewardsBatch(rewardsData)

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Some rewards could not be created.',
        errors,
        createdCount: count,
      }
    }

    event.node.res.statusCode = 201 // Created
    return { success: true, count, rewards }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    console.error(`Failed to create new rewards: ${message}`)
    return {
      success: false,
      message: `Failed to create new rewards: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})

// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reward } from '@prisma/client'

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

    // Read and validate the reward data from the request body
    const rewardData = await readBody<Partial<Reward>>(event)

    // Validate required fields
    if (!rewardData.text || !rewardData.power || !rewardData.icon) {
      return {
        success: false,
        message: '"text", "power", and "icon" are required fields.',
        statusCode: 400,
      }
    }

    // Verify userId in rewardData matches the authenticated user
    if (rewardData.userId && rewardData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the reward data does not match the authenticated user.',
      })
    }

    // Create the reward, filling in defaults for missing optional fields
    const newReward = await prisma.reward.create({
      data: {
        icon: rewardData.icon,
        text: rewardData.text,
        power: rewardData.power,
        collection: rewardData.collection || 'genesis',
        rarity: rewardData.rarity ?? 0,
        label: rewardData.label || null,
        userId: rewardData.userId ?? authenticatedUserId, // Use authenticated user ID as fallback
        artImageId: rewardData.artImageId || null, // Optional artImageId
      } as Prisma.RewardCreateInput,
    })

    event.node.res.statusCode = 201 // Created
    return { success: true, reward: newReward }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new reward',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})

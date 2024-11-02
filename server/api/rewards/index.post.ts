// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reward } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const rewardData = await readBody<Partial<Reward>>(event)

    // Validate required fields
    if (!rewardData.text || !rewardData.power || !rewardData.icon) {
      return {
        success: false,
        message: '"text", "power", and "icon" are required fields.',
        statusCode: 400,
      }
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
        userId: rewardData.userId ?? 1, // Default userId if not provided
        artImageId: rewardData.artImageId || null, // Optional artImageId
      } as Prisma.RewardCreateInput,
    })

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

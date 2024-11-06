// /server/api/rewards/random.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  let response

  try {
    // Count the total number of rewards in the database
    const totalRewards = await prisma.reward.count()

    if (totalRewards === 0) {
      return {
        success: false,
        message: 'No rewards available in the database.',
        statusCode: 404,
      }
    }

    // Generate a random offset to pick a reward
    const randomOffset = Math.floor(Math.random() * totalRewards)

    // Fetch a random reward from the database
    const randomReward = await prisma.reward.findFirst({
      skip: randomOffset,
      take: 1,
    })

    if (!randomReward) {
      return {
        success: false,
        message: 'No reward found after random selection.',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      reward: randomReward,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error fetching random reward: ${errorMessage}`)

    response = {
      success: false,
      message: `Failed to fetch random reward: ${errorMessage}`,
      statusCode: 500,
    }
  }

  return response
})

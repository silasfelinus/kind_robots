import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma' // Import your prisma client

export default defineEventHandler(async () => {
  try {
    // Count the total number of rewards in the database
    const totalRewards = await prisma.reward.count()

    if (totalRewards === 0) {
      throw new Error('No rewards available in the database')
    }

    // Generate a random offset to pick a reward
    const randomOffset = Math.floor(Math.random() * totalRewards)

    // Fetch a random reward from the database
    const randomReward = await prisma.reward.findFirst({
      skip: randomOffset,
      take: 1,
    })

    if (!randomReward) {
      throw new Error('No reward found after random selection')
    }

    return { success: true, reward: randomReward }
  } catch (error: unknown) {
    console.error(
      `Failed to fetch random reward: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return {
      success: false,
      message: `Failed to fetch random reward: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})

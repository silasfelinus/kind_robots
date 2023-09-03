import prisma from '../utils/prisma' // Import your prisma client

export default defineEventHandler(async (event) => {
  try {
    // Count the total number of rewards in the database
    const totalRewards = await prisma.reward.count()

    // Generate a random offset to pick a reward
    const randomOffset = Math.floor(Math.random() * totalRewards)

    // Fetch a random reward from the database
    const randomReward = await prisma.reward.findFirst({
      skip: randomOffset,
      take: 1
    })

    if (!randomReward) {
      throw new Error('No reward found')
    }

    return { success: true, reward: randomReward }
  } catch (error: any) {
    console.error(`Failed to fetch random reward: ${error.message}`)
    return { success: false, message: `Failed to fetch random reward: ${error.message}` }
  }
})

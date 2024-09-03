// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const rewardData = await readBody(event)

    // Validate required fields
    if (!rewardData.text || !rewardData.power || !rewardData.icon) {
      throw new Error('Text, power, and icon must be provided')
    }

    const newReward = await prisma.reward.create({
      data: {
        icon: rewardData.icon,
        text: rewardData.text,
        power: rewardData.power,
        collection: rewardData.collection || 'genesis',
        rarity: rewardData.rarity || 50,
        label: rewardData.label || null, // Ensure the label is saved correctly
      },
    })

    return { success: true, reward: newReward }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

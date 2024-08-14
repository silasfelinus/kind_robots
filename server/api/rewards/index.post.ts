// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createReward } from './'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const rewardData = await readBody(event)

    // Validate incoming data
    if (
      !rewardData ||
      !rewardData.text ||
      !rewardData.power ||
      !rewardData.icon
    ) {
      return {
        success: false,
        message:
          'Invalid JSON body. "text", "power", and "icon" fields are required.',
      }
    }

    // Create a new reward
    const newReward = await createReward(rewardData)
    return { success: true, reward: newReward }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})

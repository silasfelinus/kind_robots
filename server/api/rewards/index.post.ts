// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createReward } from './'

export default defineEventHandler(async (event) => {
  try {
    const rewardData = await readBody(event)

    if (!rewardData || !rewardData.text || !rewardData.power || !rewardData.icon) {
      return { success: false, message: 'Invalid JSON body' }
    }

    const newReward = await createReward(rewardData)
    return { success: true, reward: newReward }
  }
  catch (error: any) {
    return { success: false, message: 'Failed to create new reward', error: error.message }
  }
})

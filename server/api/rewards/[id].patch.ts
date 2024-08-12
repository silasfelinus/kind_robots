// /server/api/rewards/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { updateReward, fetchRewardById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid reward ID.')

  try {
    const reward = await fetchRewardById(id)
    const data = await readBody(event)

    if (!reward) {
      throw new Error('Reward not found.')
    }

    const updatedReward = await updateReward(id, data)
    return { success: true, reward: updatedReward }
  }
  catch (error: unknown) {
    return {
      success: false,
      message: `Failed to update reward with ID ${id}.`,
      error: error.message,
    }
  }
})

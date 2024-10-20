// /server/api/rewards/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { updateRewardById } from './index'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      }
    }

    const body = await readBody(event)
    const updatedReward = await updateRewardById(id, body)

    if (!updatedReward) {
      return {
        success: false,
        message: 'Reward not found or could not be updated.',
        statusCode: 404, // Not Found
      }
    }

    return { success: true, reward: updatedReward }
  } catch (error: unknown) {
    // Type assertion to handle 'error' as Error
    return errorHandler(error as Error)
  }
})

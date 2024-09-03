// server/api/rewards/[id].get.ts
import { defineEventHandler } from 'h3'
import { fetchRewardById } from './index'
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

    const reward = await fetchRewardById(id)

    if (!reward) {
      return {
        success: false,
        message: 'Reward not found.',
        statusCode: 404, // Not Found
      }
    }

    return { success: true, reward }
  } catch (error: unknown) {
    // Use the errorHandler to process the error
    return errorHandler(error)
  }
})

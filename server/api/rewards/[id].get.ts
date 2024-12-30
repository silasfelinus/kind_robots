// /server/api/rewards/[id].get.ts
import { defineEventHandler } from 'h3'
import { fetchRewardById } from './index'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const id = Number(event.context.params?.id)

  try {
    // Validate the ID format
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400 // Bad Request
      throw new Error('Invalid ID format. ID must be a positive integer.')
    }

    // Fetch reward by ID
    const reward = await fetchRewardById(id)

    if (!reward) {
      event.node.res.statusCode = 404 // Not Found
      throw new Error('Reward not found.')
    }

    // Successful response
    response = {
      success: true,
      reward,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    // Process error with errorHandler and set appropriate response
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch the reward.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

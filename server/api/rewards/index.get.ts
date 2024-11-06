// /server/api/rewards/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchAllRewards } from './'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const rewards = await fetchAllRewards()

    // Success Response
    response = {
      success: true,
      rewards,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    // Error Handling
    const { message, statusCode } = errorHandler(error)

    response = {
      success: false,
      message: message || 'Failed to fetch rewards',
      statusCode: statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})

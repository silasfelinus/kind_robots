// /server/api/rewards/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchAllRewards } from './'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const data = await fetchAllRewards()

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to fetch rewards.',
      statusCode: event.node.res.statusCode,
    }
  }
})

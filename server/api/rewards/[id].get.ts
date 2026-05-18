// /server/api/rewards/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { fetchRewardById } from './index'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ID format. ID must be a positive integer.',
      })
    }

    const data = await fetchRewardById(id)

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'Reward not found.',
      })
    }

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
      message: message || 'Failed to fetch the reward.',
      statusCode: event.node.res.statusCode,
    }
  }
})

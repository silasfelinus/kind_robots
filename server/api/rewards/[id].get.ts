// /server/api/rewards/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { fetchRewardById } from './index'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { canView } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ID format. ID must be a positive integer.',
      })
    }

    const [data, auth] = await Promise.all([
      fetchRewardById(id),
      getOptionalApiUser(event),
    ])

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'Reward not found.',
      })
    }

    if (!(await canView(data, null, auth?.user))) {
      throw createError({
        statusCode: auth ? 403 : 404,
        message: auth
          ? 'You do not have permission to view this Reward.'
          : 'Reward not found.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      reward: data,
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

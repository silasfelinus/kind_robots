import { defineEventHandler, readBody, createError } from 'h3'
import { createRewardsBatch, type RewardMutationInput } from './'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const rewardsData = await readBody<RewardMutationInput[]>(event)

    if (!Array.isArray(rewardsData)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Expected an array of rewards.',
      })
    }

    if (rewardsData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Reward batch cannot be empty.',
      })
    }

    for (const [index, rewardData] of rewardsData.entries()) {
      if (!rewardData || typeof rewardData !== 'object') {
        throw createError({
          statusCode: 400,
          message: `Invalid reward at index ${index}. Expected an object.`,
        })
      }

      if (
        rewardData.userId !== undefined &&
        rewardData.userId !== null &&
        rewardData.userId !== user.id
      ) {
        throw createError({
          statusCode: 403,
          message: `User ID in reward at index ${index} does not match the authenticated user.`,
        })
      }
    }

    const { count, rewards, errors } = await createRewardsBatch(
      rewardsData,
      user.id,
    )

    if (errors.length > 0) {
      event.node.res.statusCode = count > 0 ? 207 : 400

      return {
        success: count > 0,
        message:
          count > 0
            ? 'Some rewards were created, but some failed.'
            : 'No rewards could be created.',
        errors,
        count,
        data: rewards,
        statusCode: event.node.res.statusCode,
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      count,
      data: rewards,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create rewards batch.',
      statusCode: event.node.res.statusCode,
    }
  }
})

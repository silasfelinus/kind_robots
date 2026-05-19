// /server/api/rewards/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { createReward, type RewardMutationInput } from './'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const rewardData = await readBody<RewardMutationInput>(event)

    if (
      !rewardData ||
      typeof rewardData !== 'object' ||
      Array.isArray(rewardData)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Reward payload is required.',
      })
    }

    if (
      rewardData.userId !== undefined &&
      rewardData.userId !== null &&
      rewardData.userId !== user.id
    ) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the reward data does not match the authenticated user.',
      })
    }

    const data = await createReward(rewardData, user.id)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Reward created successfully.',
      data,
      reward: data,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create reward.',
      statusCode: event.node.res.statusCode,
    }
  }
})

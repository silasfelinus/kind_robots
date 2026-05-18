// /server/api/rewards/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { updateRewardById, type RewardMutationInput } from './index'

export default defineEventHandler(async (event) => {
  const rewardId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(rewardId) || rewardId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingReward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: {
        userId: true,
      },
    })

    if (!existingReward) {
      throw createError({
        statusCode: 404,
        message: `Reward with ID ${rewardId} does not exist.`,
      })
    }

    if (existingReward.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reward.',
      })
    }

    const rewardData = await readBody<RewardMutationInput>(event)

    if (!rewardData || Object.keys(rewardData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    if (rewardData.userId && rewardData.userId !== existingReward.userId) {
      throw createError({
        statusCode: 403,
        message: 'Reward ownership cannot be changed here.',
      })
    }

    const data = await updateRewardById(rewardId, rewardData)

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
      message: message || `Failed to update reward with ID ${rewardId}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})

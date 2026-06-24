// /server/api/rewards/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  let response
  const rewardId = Number(event.context.params?.id)

  try {
    if (Number.isNaN(rewardId) || rewardId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Reward ID. It must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { userId: true },
    })

    if (!reward) {
      throw createError({
        statusCode: 404,
        message: `Reward with ID ${rewardId} does not exist.`,
      })
    }

    if (!isAdmin && reward.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this reward.',
      })
    }

    await prisma.reward.delete({ where: { id: rewardId } })

    response = {
      success: true,
      message: isAdmin
        ? `Reward entry with ID ${rewardId} deleted successfully by admin.`
        : `Reward with ID ${rewardId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to delete reward with ID ${rewardId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

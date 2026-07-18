// /server/api/achievements/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import { prismaErrorCode } from './definition'

export default defineEventHandler(async (event) => {
  const achievementId = Number(event.context.params?.id)

  try {
    await requireAdminApiUser(event)

    if (!Number.isInteger(achievementId) || achievementId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Achievement ID must be a positive integer.',
      })
    }

    const existing = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Achievement not found.',
      })
    }

    await prisma.achievement.delete({ where: { id: achievementId } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Achievement with ID ${achievementId} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = prismaErrorCode(error) === 'P2003'
      ? 409
      : handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        statusCode === 409
          ? 'Achievement cannot be deleted while award records still reference it.'
          : handled.message ||
            `Failed to delete Achievement with ID ${achievementId}.`,
      data: null,
      statusCode,
    }
  }
})

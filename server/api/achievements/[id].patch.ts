// /server/api/achievements/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildAchievementUpdateInput,
  prismaErrorCode,
} from './definition'

export default defineEventHandler(async (event) => {
  const achievementId = Number(event.context.params?.id)

  try {
    await requireAdminApiUser(event)

    if (!Number.isInteger(achievementId) || achievementId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Achievement ID. It must be a positive integer.',
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

    const data = await prisma.achievement.update({
      where: { id: achievementId },
      data: await buildAchievementUpdateInput(await readBody<unknown>(event)),
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Achievement updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = prismaErrorCode(error) === 'P2002'
      ? 409
      : handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        statusCode === 409
          ? 'An Achievement with that triggerCode already exists.'
          : handled.message ||
            `Failed to update Achievement with ID ${achievementId}.`,
      data: null,
      statusCode,
    }
  }
})

// /server/api/users/achievements/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import type { AchievementRecord } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const userId = Number(event.context.params?.id)

  try {
    if (Number.isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID. It must be a positive integer.',
      })
    }

    const achievementRecords = await prisma.achievementRecord.findMany({
      where: { userId },
      select: {
        achievementId: true,
        createdAt: true,
      },
    })

    const achievementIds = achievementRecords.map(
      (record: Pick<AchievementRecord, 'achievementId'>) => record.achievementId,
    )

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Achievement records fetched successfully',
      data: { achievementIds },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error fetching achievement records for user ${userId}:`,
      handledError,
    )

    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch achievement records for user ${userId}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})

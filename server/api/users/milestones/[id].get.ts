// /server/api/users/milestones/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import type { MilestoneRecord } from '~/server/generated/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(event.context.params?.id)

  try {
    if (Number.isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID. It must be a positive integer.',
      })
    }

    const milestoneRecords = await prisma.milestoneRecord.findMany({
      where: { userId },
      select: {
        milestoneId: true,
        createdAt: true,
      },
    })

    const milestoneIds = milestoneRecords.map(
      (record: Pick<MilestoneRecord, 'milestoneId'>) => record.milestoneId,
    )

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Milestone records fetched successfully',
      data: { milestoneIds },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error fetching milestone records for user ${userId}:`,
      handledError,
    )

    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch milestone records for user ${userId}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})

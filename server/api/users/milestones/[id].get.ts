// /server/api/users/milestones/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from './../../../../server/api/utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  const userId = Number(event.context.params?.id)

  try {
    // Validate the user ID
    if (isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID. It must be a positive integer.',
      })
    }

    // Fetch milestone records for the user
    const milestoneRecords = await prisma.milestoneRecord.findMany({
      where: { userId },
      select: {
        milestoneId: true,
        createdAt: true,
      },
    })

    // Extract just the milestone IDs into an array
    const milestoneIds = milestoneRecords.map((record) => record.milestoneId)

    // Successful response
    response = {
      success: true,
      message: 'Milestone records fetched successfully',
      data: {
        milestoneIds,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error fetching milestone records for user ${userId}:`,
      handledError,
    )

    // Set response and status code based on handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch milestone records for user ${userId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

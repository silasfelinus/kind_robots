// /server/api/achievements/records/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { AchievementRecord } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let recordId: number | null = null

  try {
    // Validate and parse the record ID from the URL parameters
    recordId = Number(event.context.params?.id)
    if (isNaN(recordId) || recordId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Achievement Record ID. It must be a positive integer.',
      })
    }

    // Fetch the existing achievement record to ensure it exists
    const existingRecord = await prisma.achievementRecord.findUnique({
      where: { id: recordId },
    })

    if (!existingRecord) {
      throw createError({
        statusCode: 404, // Not Found
        message: 'Achievement Record not found.',
      })
    }

    // Read the update data from the request body
    const recordData: Partial<AchievementRecord> = await readBody(event)

    // Validate the update payload (optional but recommended)
    if (Object.keys(recordData).length === 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Update payload cannot be empty.',
      })
    }

    // Update the achievement record in the database
    const data = await prisma.achievementRecord.update({
      where: { id: recordId },
      data: recordData,
    })

    // Return success response
    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error updating achievement record with ID ${recordId}:`,
      handledError,
    )

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update achievement record with ID ${recordId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

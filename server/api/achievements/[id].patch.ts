// /server/api/achievements/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { Achievement } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let achievementId: number | null = null

  try {
    // Validate and parse the achievement ID from the URL parameters
    achievementId = Number(event.context.params?.id)
    if (isNaN(achievementId) || achievementId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Achievement ID. It must be a positive integer.',
      })
    }

    // Fetch the existing achievement to ensure it exists
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!existingAchievement) {
      throw createError({
        statusCode: 404, // Not Found
        message: 'Achievement not found.',
      })
    }

    // Read the update data from the request body
    const achievementData: Partial<Achievement> = await readBody(event)

    // Update the achievement in the database
    const data = await prisma.achievement.update({
      where: { id: achievementId },
      data: achievementData,
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
      `Error updating achievement with ID ${achievementId}:`,
      handledError,
    )

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update achievement with ID ${achievementId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

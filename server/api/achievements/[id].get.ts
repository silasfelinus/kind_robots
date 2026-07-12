// server/api/achievements/[id].get.ts
import { defineEventHandler, createError } from 'h3'
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
        message: 'Achievement ID must be a positive integer.',
      })
    }

    // Fetch the achievement using the helper function
    const data = await fetchAchievementById(achievementId)

    if (!data) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Achievement with ID ${achievementId} does not exist.`,
      })
    }

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
      `Error fetching achievement with ID ${achievementId}:`,
      handledError,
    )

    // Set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch achievement with ID ${achievementId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to fetch a single Achievement by ID
export async function fetchAchievementById(
  id: number,
): Promise<Achievement | null> {
  const data = await prisma.achievement.findUnique({
    where: { id },
  })
  return data
}

// /server/api/achievements/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

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

    // Attempt to delete the achievement with the given ID
    const deletedAchievement = await prisma.achievement.delete({
      where: { id: achievementId },
    })

    // Return success response
    response = {
      success: true,
      message: `Achievement with ID ${achievementId} successfully deleted.`,
      data: deletedAchievement, // Optional, can include the deleted achievement data if needed
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error deleting achievement with ID ${achievementId}:`,
      handledError,
    )

    // Set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete achievement with ID ${achievementId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

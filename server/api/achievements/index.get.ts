// /server/api/achievements/index.get.ts
import { defineEventHandler, setResponseStatus } from 'h3'
import type { Achievement } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const data = await prisma.achievement.findMany()

    // Set response for successful fetch
    response = {
      success: true,
      message: 'Achievements fetched successfully.',
      data,
    }
    setResponseStatus(event, 200)
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching achievements:', handledError)

    // Set error response with appropriate status code
    setResponseStatus(event, handledError.statusCode || 500)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch achievements.',
    }
  }

  return response
})

// Function to fetch all Achievements
export async function fetchAllAchievements(): Promise<Achievement[]> {
  return await prisma.achievement.findMany()
}

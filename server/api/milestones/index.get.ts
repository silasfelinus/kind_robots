// /server/api/milestones/index.get.ts
import { defineEventHandler, setResponseStatus } from 'h3'
import type { Milestone } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const milestones = await prisma.milestone.findMany()

    // Set response for successful fetch
    response = {
      success: true,
      message: 'Milestones fetched successfully.',
      data: milestones,
    }
    setResponseStatus(event, 200)
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching milestones:', handledError)

    // Set error response with appropriate status code
    setResponseStatus(event, handledError.statusCode || 500)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch milestones.',
    }
  }

  return response
})

// Function to fetch all Milestones
export async function fetchAllMilestones(): Promise<Milestone[]> {
  return await prisma.milestone.findMany()
}

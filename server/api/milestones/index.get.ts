// /server/api/milestones/index.get.ts
import { defineEventHandler } from 'h3'
import type { Milestone } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  let response

  try {
    const milestones = await prisma.milestone.findMany()
    
    // Return success response with milestones data
    response = {
      success: true,
      message: 'Milestones fetched successfully.',
      data: milestones,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching milestones:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch milestones.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to fetch all Milestones
export async function fetchAllMilestones(): Promise<Milestone[]> {
  return await prisma.milestone.findMany()
}

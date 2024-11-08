// server/api/milestones/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import type { Milestone } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let milestoneId: number | null = null

  try {
    // Validate and parse the milestone ID from the URL parameters
    milestoneId = Number(event.context.params?.id)
    if (isNaN(milestoneId) || milestoneId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Milestone ID must be a positive integer.',
      })
    }

    // Fetch the milestone using the helper function
    const data = await fetchMilestoneById(milestoneId)

    if (!data) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Milestone with ID ${milestoneId} does not exist.`,
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
      `Error fetching milestone with ID ${milestoneId}:`,
      handledError,
    )

    // Set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch milestone with ID ${milestoneId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to fetch a single Milestone by ID
export async function fetchMilestoneById(
  id: number,
): Promise<Milestone | null> {
  return await prisma.milestone.findUnique({
    where: { id },
  })
}

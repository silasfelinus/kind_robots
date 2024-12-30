// /server/api/milestones/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
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
        message: 'Invalid Milestone ID. It must be a positive integer.',
      })
    }

    // Fetch the existing milestone to ensure it exists
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    })

    if (!existingMilestone) {
      throw createError({
        statusCode: 404, // Not Found
        message: 'Milestone not found.',
      })
    }

    // Read the update data from the request body
    const milestoneData: Partial<Milestone> = await readBody(event)

    // Update the milestone in the database
    const data = await prisma.milestone.update({
      where: { id: milestoneId },
      data: milestoneData,
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
    console.error(`Error updating milestone with ID ${milestoneId}:`, handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update milestone with ID ${milestoneId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/milestones/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

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

    // Attempt to delete the milestone with the given ID
    const deletedMilestone = await prisma.milestone.delete({
      where: { id: milestoneId },
    })

    // Return success response
    response = {
      success: true,
      message: `Milestone with ID ${milestoneId} successfully deleted.`,
      data: deletedMilestone, // Optional, can include the deleted milestone data if needed
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error deleting milestone with ID ${milestoneId}:`, handledError)

    // Set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete milestone with ID ${milestoneId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

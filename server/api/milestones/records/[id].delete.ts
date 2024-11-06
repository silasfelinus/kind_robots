// server/api/users/milestones/records/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let recordId: number | null = null

  try {
    // Validate and parse the milestone record ID
    recordId = Number(event.context.params?.id)
    if (isNaN(recordId) || recordId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Milestone Record ID must be a positive integer.',
      })
    }

    console.log('Attempting to delete Milestone Record with ID:', recordId)

    // Extract and validate the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the milestone record exists and verify ownership
    const milestoneRecord = await prisma.milestoneRecord.findUnique({
      where: { id: recordId },
    })
    if (!milestoneRecord) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Milestone Record with ID ${recordId} does not exist.`,
      })
    }

    if (milestoneRecord.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this milestone record.',
      })
    }

    // Proceed to delete the milestone record
    await prisma.milestoneRecord.delete({
      where: { id: recordId },
    })

    console.log('Milestone Record deleted successfully:', recordId)

    // Successful response
    response = {
      success: true,
      message: `Milestone Record with ID ${recordId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error while deleting Milestone Record with ID "${recordId}":`,
      handledError
    )

    // Set the appropriate status code and response message
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete Milestone Record with ID ${recordId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

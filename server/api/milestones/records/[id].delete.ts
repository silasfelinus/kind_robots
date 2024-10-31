// server/api/users/milestones/records/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
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

    // Extract and verify the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

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

    if (milestoneRecord.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this milestone record.',
      })
    }

    // Proceed to delete the milestone record
    const deletedRecord = await prisma.milestoneRecord.delete({
      where: { id: recordId },
    })

    console.log('Milestone Record deleted successfully:', deletedRecord)

    return {
      success: true,
      message: `Milestone Record with ID ${recordId} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error while deleting Milestone Record:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete Milestone Record with ID ${recordId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

//server/api/milestones/records/clear.delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Use validateApiKey to authenticate the user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Delete all milestone records for the authenticated user
    await prisma.milestoneRecord.deleteMany({
      where: { userId },
    })

    console.log(
      `All milestone records deleted successfully for user ID: ${userId}`,
    )

    // Successful response
    response = {
      success: true,
      message: `All milestone records for user ID ${userId} have been successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error while deleting all milestone records:`, handledError)

    // Set the appropriate status code and response message
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || 'Failed to delete all milestone records.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

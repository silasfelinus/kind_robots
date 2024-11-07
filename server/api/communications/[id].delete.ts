// /server/api/communications/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null // Declare 'id' for broader scope

  try {
    // 1. Extract and validate the communication ID from the request parameters
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Communication ID. ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete communication with ID: ${id}`)

    // 2. Use the utility function to validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // 3. Fetch the communication to verify ownership
    const communication = await prisma.communication.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!communication) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Communication with ID ${id} does not exist.`,
      })
    }

    // 4. Check if the logged-in user is the owner of the communication
    if (communication.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this communication.',
      })
    }

    // 5. Attempt to delete the communication
    await prisma.communication.delete({ where: { id } })

    console.log(`Communication with ID ${id} successfully deleted`)
    response = {
      success: true,
      message: `Communication with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting communication:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete communication with ID ${id !== null ? id : 'unknown'}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import {
  extractTokenFromHeader,
  getUserIdFromToken,
  authorizeUserForArtEntry,
} from '.'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate Art ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Extract and verify authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    const token = extractTokenFromHeader(authorizationHeader)
    if (!token) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    // Get userId from token
    const userId = await getUserIdFromToken(token)
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Authorize user for the art entry
    await authorizeUserForArtEntry(userId, id)

    // Attempt to delete the art entry
    await prisma.art.delete({ where: { id } })

    return {
      success: true,
      message: `Art entry with ID ${id} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Error handling with detailed logging
    const handledError = errorHandler(error)
    console.log('Error Handled:', handledError)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete art entry with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

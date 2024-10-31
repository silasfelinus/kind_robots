import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Extract and validate the Art ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Extract the token from the Authorization header
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

    // Fetch the art entry to check if the user is the owner
    const artEntry = await prisma.art.findUnique({ where: { id } })
    if (!artEntry) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Art entry with ID ${id} does not exist.`,
      })
    }

    // Verify ownership of the art entry
    if (artEntry.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this art entry.',
      })
    }

    // Delete the art entry
    await prisma.art.delete({ where: { id } })

    return {
      success: true,
      message: `Art entry with ID ${id} deleted successfully.`,
    }
  } catch (error: unknown) {
    // Use errorHandler for consistent error responses
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete art entry with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

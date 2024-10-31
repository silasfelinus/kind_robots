// server/api/pitches/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // 1. Validate and parse the pitch ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Pitch ID. It must be a positive integer.',
      })
    }

    console.log('Attempting to delete Pitch with ID:', id)

    // 2. Extract and verify the JWT token
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

    // 3. Fetch the pitch to verify ownership
    const pitch = await prisma.pitch.findUnique({ where: { id } })
    if (!pitch) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Pitch with ID ${id} does not exist.`,
      })
    }

    if (pitch.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this pitch.',
      })
    }

    // 4. Proceed to delete the pitch
    await prisma.pitch.delete({ where: { id } })

    console.log(
      `Pitch with ID ${id} successfully deleted by user ${verificationResult.userId}`,
    )
    return {
      success: true,
      message: `Pitch with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error while deleting Pitch:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete Pitch with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

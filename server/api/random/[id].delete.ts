// /server/api/random/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate and parse the item ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid ID. ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete item with ID: ${id}`)

    // Extract and verify the JWT token from the request
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

    // Fetch the item to verify ownership
    const item = await prisma.randomList.findUnique({ where: { id } })
    if (!item) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Item with ID ${id} does not exist.`,
      })
    }

    // Ensure the user owns this item
    if (item.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this item.',
      })
    }

    // Delete the item
    await prisma.randomList.delete({ where: { id } })
    console.log(`Successfully deleted item with ID: ${id}`)

    return {
      success: true,
      message: `Item with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error deleting item:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete item with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

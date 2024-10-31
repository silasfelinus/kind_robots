// server/api/art/collection/[id].delete.ts

import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  let collectionId: number | null = null

  try {
    // 1. Validate and parse collection ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Collection ID. It must be a positive integer.',
      })
    }

    // 2. Check for Authorization header and verify JWT token
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

    // 3. Fetch the collection and verify ownership
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
    })
    if (!collection) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Collection with ID ${collectionId} does not exist.`,
      })
    }

    // Check if the authenticated user is the owner of the collection
    if (collection.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this collection.',
      })
    }

    // 4. Attempt to delete the collection
    await prisma.artCollection.delete({
      where: { id: collectionId },
    })

    // Success response
    return {
      success: true,
      message: `Collection ${collectionId} deleted successfully.`,
    }
  } catch (error: unknown) {
    // Use errorHandler for structured error handling
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete collection with ID ${collectionId ?? 'unknown'}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

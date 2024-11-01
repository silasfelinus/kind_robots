// server/api/art/collection/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let collectionId: number | null = null

  try {
    // Validate and parse collection ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Collection ID. It must be a positive integer.',
      })
    }

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

    // Fetch the collection and verify ownership
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    })
    if (!collection) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Collection with ID ${collectionId} does not exist.`,
      })
    }

    if (collection.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this collection.',
      })
    }

    // Attempt to delete the collection
    await prisma.artCollection.delete({
      where: { id: collectionId },
    })

    // Success response
    return {
      success: true,
      message: `Collection ${collectionId} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
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

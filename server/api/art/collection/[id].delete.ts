// server/api/art/collection/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let collectionId

  try {
    // Validate the Collection ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Collection ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

 

    const userId = user.id

    // Fetch the collection entry and verify ownership
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    })
    if (!collection) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} does not exist.`,
      })
    }

       // Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the art entry directly
      await prisma.artCollection.delete({ where: { id: collectionId } })
      return {
        success: true,
        message: `Art Collection with ID ${collectionId} deleted successfully by admin.`,
      }
    }


    if (collection.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this collection.',
      })
    }

    // Attempt to delete the collection
    await prisma.artCollection.delete({ where: { id: collectionId } })

    // Successful deletion response
    response = {
      success: true,
      message: `Collection with ID ${collectionId} deleted successfully.`,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting collection:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete collection with ID ${collectionId}.`,
    }
  }

  return response
})

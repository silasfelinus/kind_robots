// server/api/art/collection/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let collectionId

  try {
    // Parse and validate collection ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID. It must be a positive integer.',
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

    // Fetch the collection and verify ownership
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: { art: true },
    })

    if (!collection) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    if (collection.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this collection.',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const { artIds } = body





    if (!Array.isArray(artIds) || artIds.length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'artIds must be a non-empty array.',
      })
    }

if (!artIds.every(Number.isInteger)) {
  throw createError({
    statusCode: 400,
    message: 'All artIds must be valid integers.',
  });
}

    const validArtItems = await prisma.art.findMany({
      where: { id: { in: artIds } },
    })

    if (validArtItems.length !== artIds.length) {
      const missingArtIds = artIds.filter(
        (id) => !validArtItems.some((art) => art.id === id),
      )
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `The following art IDs were not found: ${missingArtIds.join(', ')}`,
      })
    }

    // Update the collection with validated art items
    const data = await prisma.artCollection.update({
      where: { id: collectionId },
      data: {
        art: {
          set: validArtItems.map((art) => ({ id: art.id })),
        },
      },
      include: { art: true },
    })

    // Successful response with data wrapper
    response = {
      success: true,
      data,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error updating collection:', handledError)

    // Set the appropriate status code based on the error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update collection with ID ${collectionId}.`,
    }
  }

  return response
})

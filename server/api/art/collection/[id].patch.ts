import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  let collectionId: number | null = null
  try {
    // Parse and validate collection ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID. It must be a positive integer.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Ensure collection exists and belongs to the user
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: { art: true },
    })
    if (!collection) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    if (collection.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this collection.',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const { artIds } = body

    // Validate artIds exists and is a non-empty array
    if (!Array.isArray(artIds) || artIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'artIds must be a non-empty array.',
      })
    }

    // Ensure all artIds exist in the Art table
    const validArtItems = await prisma.art.findMany({
      where: { id: { in: artIds } },
    })
    if (validArtItems.length !== artIds.length) {
      throw createError({
        statusCode: 404,
        message: 'One or more art IDs do not exist.',
      })
    }

    // Update the collection with validated art items
    const updatedCollection = await prisma.artCollection.update({
      where: { id: collectionId },
      data: {
        art: {
          set: validArtItems.map((art) => ({ id: art.id })),
        },
      },
      include: { art: true },
    })

    return {
      success: true,
      collection: updatedCollection,
      statusCode: 200, // Explicit statusCode for successful update
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to update collection with ID ${collectionId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

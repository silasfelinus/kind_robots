// /server/api/art/collection/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: {
        art: {
          orderBy: {
            id: 'desc',
          },
        },
        ArtImages: {
          orderBy: {
            id: 'desc',
          },
        },
      },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    return {
      success: true,
      data: collection,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

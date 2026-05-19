// /server/api/art/image/imagebyart/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const artImageId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid art image ID provided.',
      })
    }

    const data = await prisma.artImage.findUnique({
      where: {
        id: artImageId,
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `ArtImage with ID ${artImageId} not found.`,
      })
    }

    return {
      success: true,
      data,
      message: 'ArtImage fetched successfully.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: null,
      message:
        handled.message || `Failed to fetch ArtImage with ID ${artImageId}.`,
    }
  }
})

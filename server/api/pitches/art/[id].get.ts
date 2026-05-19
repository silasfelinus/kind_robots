// /server/api/pitches/art/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  let pitchId = 0

  try {
    pitchId = Number(event.context.params?.id)

    if (!Number.isInteger(pitchId) || pitchId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Pitch ID. It must be a positive integer.',
      })
    }

    const artImages = await prisma.artImage.findMany({
      where: {
        Pitches: {
          some: {
            id: pitchId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data: artImages,
      message: artImages.length
        ? 'Art images fetched successfully.'
        : 'No art images found for this pitch.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      data: [],
      message:
        handledError.message ||
        `Failed to fetch art images for pitch ${pitchId}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})

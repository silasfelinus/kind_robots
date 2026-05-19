// /server/api/art/prompt/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  const promptId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(promptId) || promptId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing prompt ID.',
      })
    }

    const artImages = await prisma.artImage.findMany({
      where: {
        Prompts: {
          some: {
            id: promptId,
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
      data: {
        artImages,
      },
      message: artImages.length
        ? 'Art images fetched successfully.'
        : `No art images found for prompt ID ${promptId}.`,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: {
        artImages: [],
      },
      message:
        handled.message ||
        `Failed to fetch art images for prompt ID ${promptId}.`,
    }
  }
})

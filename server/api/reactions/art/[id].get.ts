// /server/api/reactions/art/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const artImageId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid art image ID is required.',
      })
    }

    const reactions = await prisma.reaction.findMany({
      where: {
        artImageId,
      },
      include: {
        User: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: {
        reactions,
      },
      message: reactions.length
        ? 'Reactions found.'
        : `No reactions found for art image ${artImageId}.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch reactions for art image ${artImageId}.`,
      data: {
        reactions: [],
      },
    }
  }
})

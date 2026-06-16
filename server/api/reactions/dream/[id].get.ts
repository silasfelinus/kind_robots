// /server/api/reactions/dream/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    dreamId = Number(event.context.params?.id)

    if (!Number.isInteger(dreamId) || dreamId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid dream ID is required.',
      })
    }

    const reactions = await prisma.reaction.findMany({
      where: { dreamId },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data: { reactions },
      count: reactions.length,
      message: reactions.length
        ? `Fetched ${reactions.length} reaction(s) for dream #${dreamId}.`
        : `No reactions found for dream #${dreamId}.`,
    }
  } catch (error) {
    console.error(`Error fetching reactions for dream ID ${dreamId}:`, error)

    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      data: {
        reactions: [],
        message: handledError.message || 'Failed to retrieve reactions.',
      },
    }
  }
})

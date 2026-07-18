// /server/api/reactions/chat/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const chatId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(chatId) || chatId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid chat ID is required.',
      })
    }

    const data = await prisma.reaction.findMany({
      where: { chatId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        User: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarImage: true,
            Role: true,
            isPublic: true,
          },
        },
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        `Failed to retrieve reactions for chat exchange with ID ${chatId}.`,
      data: [],
      statusCode,
    }
  }
})

// /server/api/bots/[id].get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid bot ID.',
      })
    }

    const { isValid } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const bot = await prisma.bot.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        Server: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
            
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot with id ${id} does not exist.`,
      })
    }

    return {
      success: true,
      message: 'Bot retrieved successfully.',
      data: bot,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to retrieve bot.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

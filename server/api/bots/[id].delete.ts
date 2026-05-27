// /server/api/bots/[id].delete.ts
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

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const bot = await prisma.bot.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot with id ${id} does not exist.`,
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const isOwner = user?.id === bot.userId

    if (!isAdmin && !isServerKey && !isOwner) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this bot.',
      })
    }

    const deleted = await prisma.bot.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Bot deleted successfully.',
      data: deleted,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to delete bot.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

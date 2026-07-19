// /server/api/logs/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid log ID.',
      })
    }

    const log = await prisma.log.findUnique({
      where: { id },
    })

    if (!log) {
      throw createError({
        statusCode: 404,
        message: 'Log not found.',
      })
    }

    if (!auth.isAdmin && log.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to read this log.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Log retrieved successfully.',
      data: log,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to retrieve log.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

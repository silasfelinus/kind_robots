// /server/api/logs/[id].delete.ts
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

    const existing = await prisma.log.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Log not found.',
      })
    }

    if (!auth.isAdmin && existing.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this log.',
      })
    }

    await prisma.log.delete({
      where: { id },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Log deleted successfully.',
      data: null,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to delete log.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

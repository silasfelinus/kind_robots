// /server/api/logs/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const validation = await validateApiKey(event)

    if (!validation.isValid) {
      return errorHandler({
        error: new Error('Unauthorized'),
        message: 'Unauthorized',
        statusCode: 401,
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      return errorHandler({
        error: new Error('Invalid log ID.'),
        message: 'Invalid log ID.',
        statusCode: 400,
      })
    }

    const existing = await prisma.log.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorHandler({
        error: new Error('Log not found.'),
        message: 'Log not found.',
        statusCode: 404,
      })
    }

    const log = await prisma.log.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Log deleted successfully.',
      data: log,
    }
  } catch (error) {
    return errorHandler({
      error,
      message: 'Failed to delete log.',
      statusCode: 500,
    })
  }
})

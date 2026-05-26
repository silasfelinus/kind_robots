// /server/api/logs/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
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

    const query = getQuery(event)
    const rawTake = Number(query.take || 50)
    const rawSkip = Number(query.skip || 0)
    const rawUserId = query.userId ? Number(query.userId) : undefined

    const take = Number.isFinite(rawTake)
      ? Math.min(Math.max(rawTake, 1), 100)
      : 50

    const skip = Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0

    const userId =
      typeof rawUserId === 'number' && Number.isInteger(rawUserId)
        ? rawUserId
        : undefined

    const username =
      typeof query.username === 'string' && query.username.trim()
        ? query.username.trim()
        : undefined

    const where = {
      ...(typeof userId === 'number' ? { userId } : {}),
      ...(username ? { username } : {}),
    }

    const [logs, count] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take,
        skip,
      }),
      prisma.log.count({ where }),
    ])

    return {
      success: true,
      message: 'Logs retrieved successfully.',
      data: {
        logs,
        count,
      },
    }
  } catch (error) {
    return errorHandler({
      error,
      message: 'Failed to retrieve logs.',
      statusCode: 500,
    })
  }
})

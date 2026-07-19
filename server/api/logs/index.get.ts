// /server/api/logs/index.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery(event)
    const rawTake = Number(query.take || 50)
    const rawSkip = Number(query.skip || 0)

    if (!Number.isInteger(rawTake) || rawTake < 1 || rawTake > 100) {
      throw createError({
        statusCode: 400,
        message: 'take must be an integer from 1 to 100.',
      })
    }

    if (!Number.isInteger(rawSkip) || rawSkip < 0) {
      throw createError({
        statusCode: 400,
        message: 'skip must be a non-negative integer.',
      })
    }

    const requestedUserId =
      typeof query.userId === 'undefined' ? null : Number(query.userId)

    if (
      requestedUserId !== null &&
      (!Number.isInteger(requestedUserId) || requestedUserId <= 0)
    ) {
      throw createError({
        statusCode: 400,
        message: 'userId must be a positive integer.',
      })
    }

    const requestedUsername =
      typeof query.username === 'string' && query.username.trim()
        ? query.username.trim()
        : null

    if (!auth.isAdmin && (requestedUserId || requestedUsername)) {
      throw createError({
        statusCode: 403,
        message: 'Only admins may query another user’s logs.',
      })
    }

    const where = auth.isAdmin
      ? {
          ...(requestedUserId ? { userId: requestedUserId } : {}),
          ...(requestedUsername ? { username: requestedUsername } : {}),
        }
      : { userId: auth.user.id }

    const [logs, count] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take: rawTake,
        skip: rawSkip,
      }),
      prisma.log.count({ where }),
    ])

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Logs retrieved successfully.',
      data: {
        logs,
        count,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to retrieve logs.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

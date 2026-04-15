// /server/api/server/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    console.log('[server.get] Fetching servers...')

    const { isValid, user } = await validateApiKey(event)
    console.log('[DB URL]', process.env.DATABASE_URL)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const whereClause = includeUserData
      ? {
          OR: [{ isPublic: true }, { userId: user.id }],
        }
      : { isPublic: true }

    const data = await prisma.server.findMany({
      where: whereClause,
      orderBy: [
        { isOfficial: 'desc' },
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        label: true,
        serverType: true,
        url: true,
        isPublic: true,
        isOfficial: true,
        isDefault: true,
        sortOrder: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `All servers retrieved for user ${user.id}.`
        : 'Public servers retrieved successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[server.get] Error:', handled)

    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch servers.',
      data: [],
      statusCode: event.node.res.statusCode,
    }
  }
})

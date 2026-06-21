// /server/api/socials/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const whereClause = includeUserData
      ? { OR: [{ isPublic: true }, { userId: user.id }] }
      : { isPublic: true }

    const data = await prisma.socialPost.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { targets: true },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `Social posts retrieved for user ${user.id}.`
        : 'Public social posts retrieved successfully.',
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[socials.get] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch social posts.',
    }
  }
})

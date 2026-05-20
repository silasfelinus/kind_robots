// /server/api/code/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const modelName = 'code'

  try {
    const query = getQuery(event)
    const includeInactive = query.includeInactive === 'true'
    const officialOnly = query.officialOnly === 'true'
    const mineOnly = query.mineOnly === 'true'

    const { isValid, user } = await validateApiKey(event)
    const currentUser = isValid && user ? user : null
    const isAdmin = currentUser?.Role === 'ADMIN'

    const where: Prisma.CodeWhereInput = {}

    if (!includeInactive || !isAdmin) {
      where.isActive = true
    }

    if (officialOnly) {
      where.isOfficial = true
    }

    if (mineOnly) {
      if (currentUser) {
        where.userId = currentUser.id
      } else {
        where.isPublic = true
      }
    } else if (!isAdmin) {
      if (currentUser) {
        where.OR = [{ isPublic: true }, { userId: currentUser.id }]
      } else {
        where.isPublic = true
      }
    }

    const data = await prisma.code.findMany({
      where,
      orderBy: [{ isOfficial: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        title: true,
        description: true,
        icon: true,
        graph: true,
        isPublic: true,
        isOfficial: true,
        isActive: true,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: currentUser
        ? `Code blueprints retrieved for user ${currentUser.id}.`
        : 'Public code blueprints retrieved successfully.',
      data,
      count: data.length,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`[${modelName}.get] Error:`, handled)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch code blueprints.',
      data: [],
      statusCode: event.node.res.statusCode,
    }
  }
})

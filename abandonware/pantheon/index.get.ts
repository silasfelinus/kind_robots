// /server/api/pantheon/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'pantheon'
  try {
    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'
    const q = getQuery(event)

    const whereClause = includeUserData
      ? {
          OR: [
            { isPublic: true },
            { userId: user!.id },
            { editorIds: { contains: `${user!.id}` } },
          ],
        }
      : { isPublic: true }

    // optional filters
    if (q.search && typeof q.search === 'string') {
      Object.assign(whereClause, {
        AND: [{ name: { contains: q.search, mode: 'insensitive' } }],
      })
    }
    if (q.userId && !Number.isNaN(Number(q.userId))) {
      Object.assign(whereClause, {
        AND: [{ userId: Number(q.userId) }],
      })
    }

    const data = await prisma.pantheon.findMany({
      where: whereClause as any,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isPublic: true,
        isMature: true,
        userId: true,
        coverArtImageId: true,
        chatId: true,
        names: true,
        imageIds: true,
        galleryIds: true,
        editorIds: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `All ${modelName}s retrieved for user ${user!.id}.`
        : `Public ${modelName}s retrieved successfully.`,
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to fetch ${modelName}s.`,
    }
  }
})

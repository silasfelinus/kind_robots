// /server/api/art/storefront-featured.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 24

function readLimit(value: unknown): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(parsed), MAX_LIMIT)
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = readLimit(query.limit)

    const data = await prisma.artImage.findMany({
      where: {
        storefrontFeatured: true,
        isPublic: true,
        isActive: true,
        isMature: false,
      },
      select: {
        id: true,
        createdAt: true,
        imagePath: true,
        path: true,
        thumbnailPath: true,
        cardPath: true,
        promptString: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Storefront-featured art retrieved successfully.',
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch storefront-featured art.',
      data: [],
    }
  }
})

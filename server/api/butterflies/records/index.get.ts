// /server/api/butterfly/records/index.get.ts
// Returns the authenticated user's caught butterfly records,
// including the full butterfly data so the gallery can render without
// a second request.

import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const data = await prisma.butterflyRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        Butterfly: {
          select: {
            id: true,
            name: true,
            message: true,
            wingTopColor: true,
            wingBottomColor: true,
            speed: true,
            wingSpeed: true,
            scale: true,
            rarityNumber: true,
            artImageId: true,
            designer: true,
          },
        },
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${data.length} butterfly records retrieved.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly-records.get] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch butterfly records.',
      statusCode: event.node.res.statusCode,
    }
  }
})

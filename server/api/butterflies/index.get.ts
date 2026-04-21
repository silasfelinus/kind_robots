// /server/api/butterflies/index.get.ts
// Public roster of all butterfly species.
// No auth required — the full list is always visible so the gallery
// can render locked slots even for logged-out users.

import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const data = await prisma.butterfly.findMany({
      where: { isPublic: true },
      orderBy: { rarityNumber: 'asc' },
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
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${data.length} butterflies retrieved.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterflies.get] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch butterflies.',
      statusCode: event.node.res.statusCode,
    }
  }
})

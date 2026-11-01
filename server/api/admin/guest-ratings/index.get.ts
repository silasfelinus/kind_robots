import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

// Held guest notes (conductor interface-vision t-150): newest first, capped.
// voterHash is never returned.
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const rows = await prisma.arcadeGuestRating.findMany({
      where: { commentHeld: true, comment: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        gameSlug: true,
        rating: true,
        comment: true,
        updatedAt: true,
      },
    })
    return { success: true, data: rows, statusCode: 200 }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return {
      success: false,
      message: failure.message,
      statusCode: event.node.res.statusCode,
    }
  }
})

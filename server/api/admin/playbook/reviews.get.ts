import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { REVIEW_GAME_SLUGS } from '~/utils/playbook/runReview'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery(event)
    const game = typeof query.game === 'string' ? query.game : undefined
    const stars = typeof query.stars === 'string' ? Number(query.stars) : undefined
    if (game && !REVIEW_GAME_SLUGS.some((slug) => slug === game))
      throw createError({ statusCode: 400, message: 'Unknown game.' })
    if (stars !== undefined && (!Number.isInteger(stars) || stars < 1 || stars > 5))
      throw createError({ statusCode: 400, message: 'Invalid star filter.' })
    const count = Math.max(1, Math.min(100, Math.trunc(Number(query.take) || 40)))
    const rows = await prisma.playbookRunReview.findMany({
      where: {
        ...(game ? { gameSlug: game } : {}),
        ...(stars ? { stars } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: count,
      select: {
        id: true, gameSlug: true, endingKey: true, stars: true,
        comment: true, history: true, createdAt: true,
      },
    })
    return {
      success: true,
      statusCode: 200,
      data: rows.map((row) => ({
        ...row,
        history: JSON.parse(row.history) as Record<string, unknown>,
      })),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})

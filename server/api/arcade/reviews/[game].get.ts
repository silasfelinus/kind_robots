import { createError, defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { HALL_GAMES } from '~/utils/arcade/games'

export default defineEventHandler(async (event) => {
  try {
    const game = String(event.context.params?.game ?? '')
    if (!HALL_GAMES.some((entry) => entry.slug === game))
      throw createError({ statusCode: 404, message: 'Game not listed in the Arcade.' })
    const rows = await prisma.arcadeReview.findMany({
      where: { gameSlug: game },
      select: { id: true, userId: true, username: true, rating: true, comment: true, createdAt: true, updatedAt: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 100,
    })
    return { success: true, data: rows, statusCode: 200 }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { success: false, message: failure.message, statusCode: event.node.res.statusCode }
  }
})

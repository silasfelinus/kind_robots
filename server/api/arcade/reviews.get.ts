import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { HALL_GAMES } from '~/utils/arcade/games'

export default defineEventHandler(async (event) => {
  try {
    const groups = await prisma.arcadeReview.groupBy({
      by: ['gameSlug'],
      where: { gameSlug: { in: HALL_GAMES.map((game) => game.slug) } },
      _avg: { rating: true },
      _count: { rating: true },
    })
    return {
      success: true,
      data: Object.fromEntries(
        groups.map((row) => [
          row.gameSlug,
          { average: row._avg.rating ?? 0, count: row._count.rating },
        ]),
      ),
      statusCode: 200,
    }
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

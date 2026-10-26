import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { HALL_GAMES } from '~/utils/arcade/games'
import { mergeRatingSummaries } from '~/utils/arcade/guestRatings'

export default defineEventHandler(async (event) => {
  try {
    const where = { gameSlug: { in: HALL_GAMES.map((game) => game.slug) } }
    const [groups, guestGroups] = await Promise.all([
      prisma.arcadeReview.groupBy({
        by: ['gameSlug'],
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.arcadeGuestRating.groupBy({
        by: ['gameSlug'],
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ])
    const summarize = (rows: typeof groups) =>
      Object.fromEntries(
        rows.map((row) => [
          row.gameSlug,
          { average: row._avg.rating ?? 0, count: row._count.rating },
        ]),
      )
    return {
      success: true,
      data: mergeRatingSummaries(summarize(groups), summarize(guestGroups)),
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

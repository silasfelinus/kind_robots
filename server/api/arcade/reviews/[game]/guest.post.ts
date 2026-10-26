import { createError, defineEventHandler, getRequestIP, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import {
  allowGuestRating,
  guestVoterHash,
} from '../../../../utils/guestRatingDamping'
import { HALL_GAMES } from '~/utils/arcade/games'
import {
  GUEST_COMMENT_MAX,
  GUEST_DAILY_LIMIT,
  validGuestRating,
} from '~/utils/arcade/guestRatings'

// Logged-out star rating. One rating per browser token per game (re-posting
// edits it); comments are stored held and never shown until released.
export default defineEventHandler(async (event) => {
  try {
    const game = String(event.context.params?.game ?? '')
    if (!HALL_GAMES.some((entry) => entry.slug === game))
      throw createError({
        statusCode: 404,
        message: 'Game not listed in the Arcade.',
      })
    const body: unknown = await readBody(event)
    if (!validGuestRating(body))
      throw createError({
        statusCode: 400,
        message: `Choose 1–5 stars and keep any note within ${GUEST_COMMENT_MAX} characters.`,
      })
    const address = getRequestIP(event, { xForwardedFor: true }) ?? ''
    if (!allowGuestRating(address))
      throw createError({
        statusCode: 429,
        message: 'Lots of ratings from this connection. Try again later.',
      })
    const voterHash = guestVoterHash(body.token)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = await prisma.arcadeGuestRating.count({
      where: { voterHash, updatedAt: { gte: dayAgo } },
    })
    if (today >= GUEST_DAILY_LIMIT)
      throw createError({
        statusCode: 429,
        message: 'That is plenty of ratings for today. Thank you!',
      })
    const comment = body.comment?.trim() || null
    await prisma.arcadeGuestRating.upsert({
      where: { gameSlug_voterHash: { gameSlug: game, voterHash } },
      create: { gameSlug: game, voterHash, rating: body.rating, comment },
      update: { rating: body.rating, comment, commentHeld: true },
      select: { id: true },
    })
    return {
      success: true,
      message: 'Thanks for rating! Your stars are counted.',
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

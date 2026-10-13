import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { HALL_GAMES } from '~/utils/arcade/games'
import { validArcadeReview } from '~/utils/arcade/reviews'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    if (auth.user.id === 10)
      throw createError({
        statusCode: 401,
        message: 'Sign in to review a game.',
      })
    const game = String(event.context.params?.game ?? '')
    if (!HALL_GAMES.some((entry) => entry.slug === game))
      throw createError({
        statusCode: 404,
        message: 'Game not listed in the Arcade.',
      })
    const body: unknown = await readBody(event)
    if (!validArcadeReview(body))
      throw createError({
        statusCode: 400,
        message:
          'Choose 1–5 stars and keep your comment within 2,000 characters.',
      })
    const comment = body.comment?.trim() || null
    const row = await prisma.arcadeReview.upsert({
      where: { gameSlug_userId: { gameSlug: game, userId: auth.user.id } },
      create: {
        gameSlug: game,
        userId: auth.user.id,
        username: auth.user.username,
        rating: body.rating,
        comment,
      },
      update: { username: auth.user.username, rating: body.rating, comment },
      select: {
        id: true,
        userId: true,
        username: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return {
      success: true,
      data: row,
      message: 'Your review was saved.',
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

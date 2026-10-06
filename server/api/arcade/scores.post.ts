// /server/api/arcade/scores.post.ts
//
// Submit a Kind Robots Arcade high score. Anyone can post (the arcade is free
// and needs no account); a signed-in player's userId is attached so scores
// can be credited later. Body: { game, initials, score, level }.

import { createError, defineEventHandler, getRequestIP, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import {
  enforceArcadeScoreRateLimit,
  parseArcadeSubmission,
  arcadeRankOf,
} from '../../utils/arcadeScores'

export default defineEventHandler(async (event) => {
  let response
  try {
    const parsed = parseArcadeSubmission(await readBody(event))
    if (!parsed.ok) {
      throw createError({ statusCode: 400, message: parsed.message })
    }
    enforceArcadeScoreRateLimit(
      getRequestIP(event, { xForwardedFor: true }) || 'unknown',
    )
    const auth = await getOptionalApiUser(event).catch(() => null)
    const { game, initials, score, level } = parsed.value
    const row = await prisma.arcadeScore.create({
      data: {
        gameSlug: game,
        initials,
        score,
        level,
        userId: auth?.user.id ?? null,
      },
      select: { id: true },
    })
    response = {
      success: true,
      message: 'Score saved.',
      data: { id: row.id, rank: await arcadeRankOf(game, score) },
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not save the score.',
      statusCode: event.node.res.statusCode,
    }
  }
  return response
})

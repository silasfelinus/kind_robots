// /server/api/arcade/scores/[game].get.ts
//
// Public Kind Robots Arcade leaderboard: top 10 for one cabinet, all time or
// today (UTC). Returns initials, score, level and, for scores set while signed
// in, the player's username (Silas, 2026-10-06). Guests stay initials only.
//
// Query: ?range=all|today

import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { errorHandler } from '../../../utils/error'
import { parseArcadeRange, readArcadeBoard } from '../../../utils/arcadeScores'
import { findArcadeGame } from '~/utils/arcade/games'

export default defineEventHandler(async (event) => {
  let response
  try {
    const game = getRouterParam(event, 'game') ?? ''
    if (!findArcadeGame(game)) {
      throw createError({ statusCode: 404, message: 'Unknown game.' })
    }
    const range = parseArcadeRange(getQuery(event).range)
    const data = await readArcadeBoard(game, range)
    response = {
      success: true,
      data,
      meta: { game, range },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not load the high scores.',
      statusCode: event.node.res.statusCode,
    }
  }
  return response
})

// /server/api/arcade/leaderboard.get.ts
//
// The Kind Robots Arcade hall of fame (conductor kr-arcade): one call that
// returns every cabinet's global top scores, today's best and score count.
// Initials, scores and levels only -- never who submitted.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { readArcadeHallOfFame } from '../../utils/arcadeScores'

export default defineEventHandler(async (event) => {
  let response
  try {
    const data = await readArcadeHallOfFame()
    response = { success: true, data, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not load the hall of fame.',
      statusCode: event.node.res.statusCode,
    }
  }
  return response
})

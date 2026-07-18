// /server/api/achievements/updateMatchRecord.put.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import {
  parseAchievementScoreBody,
  updateAchievementHighScore,
} from './scoreRecord'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const newScore = parseAchievementScoreBody(await readBody<unknown>(event))
    const data = await updateAchievementHighScore({
      userId: user.id,
      field: 'matchRecord',
      newScore,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: data.improved
        ? 'Match high score updated successfully.'
        : 'Match score did not exceed the existing high score.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to update match high score.',
      data: null,
      statusCode,
    }
  }
})

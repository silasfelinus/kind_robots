// /server/api/aquarium/clean.post.ts
//
// Manually clears debris from the authenticated user's tank -- the active-
// play channel cthulhuquarium/t-027 builds: -5 debris per click, instant,
// free, no cooldown (data/economy.yaml's debris.clean.click_clears).
//
// No body -- there is nothing to parse; every click clears the same amount.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { cleanTankForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const result = await cleanTankForUser(user.id, user.username)

    response = {
      success: true,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to clean the tank.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/clean.post.ts
//
// Manually clears debris from the authenticated user's tank -- the active-
// play channel cthulhuquarium/t-027 builds: -5 debris per click, instant,
// free, no cooldown (data/economy.yaml's debris.clean.click_clears).
//
// Optional body `{ clicks?: number }` (cthulhuquarium/t-013): the client
// debounces a click spree into one request instead of one POST per click
// and reports how many landed. Missing/invalid `clicks` defaults to 1, so a
// client that sends no body at all keeps the original single-click
// behavior. `cleanTankForUser` clamps the value server-side.

import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { cleanTankForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const clicks =
      body && typeof body === 'object' && typeof body.clicks === 'number'
        ? body.clicks
        : 1
    const result = await cleanTankForUser(user.id, user.username, clicks)

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

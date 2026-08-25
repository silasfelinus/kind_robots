// /server/api/aquarium/tick.post.ts
//
// Settles offline income against the authenticated user's tank, server-
// authoritative and capped per data/economy.yaml (cthulhuquarium/t-009).
// The client submits no earned amount -- only elapsed real time (implicit,
// via `lastTickAt` on the tank row) drives what gets credited.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { settleTickForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await settleTickForUser(user.id, user.username)

    response = {
      success: true,
      message:
        result.ticksProcessed > 0
          ? `Settled ${result.ticksProcessed} tick(s): +${result.coinsEarned} coins.`
          : 'No ticks have elapsed since your last visit.',
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to settle tank tick.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/floor-key.post.ts
//
// Buys the key to the next floor of Charlotte's building (cthulhuquarium/t-105).
// Price and eligibility come from utils/cthulhuquariumFloors.ts, never the
// request: the player must know enough species, hold the key above it, and
// have the coins.
//
// Body: { floor: 2 | 3 | 4 | 5 }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { purchaseFloorKeyForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const floor: unknown = body?.floor
    if (
      typeof floor !== 'number' ||
      !Number.isInteger(floor) ||
      floor < 2 ||
      floor > 5
    ) {
      throw createError({
        statusCode: 400,
        message: 'floor must be 2, 3, 4 or 5.',
      })
    }

    const result = await purchaseFloorKeyForUser(user.id, user.username, floor)

    response = {
      success: true,
      message: `Bought the key for ${result.cost} coins.`,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to buy that key.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/upgrade.post.ts
//
// Buys the next level of one coin upgrade track (cthulhuquarium/t-071,
// DESIGN-BRIEF MVP item 4). Price and effect come from
// server/utils/aquariumCollect.ts's UPGRADE_CATALOG, never the request.
//
// Body: { track: 'food' | 'dropSpeed' }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { purchaseUpgradeForUser } from '../../utils/aquarium'
import { isKnownUpgradeTrack } from '../../utils/aquariumCollect'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const track: unknown = body?.track
    if (!isKnownUpgradeTrack(track)) {
      throw createError({
        statusCode: 400,
        message: 'track must be one of: food, dropSpeed.',
      })
    }

    const result = await purchaseUpgradeForUser(user.id, user.username, track)

    response = {
      success: true,
      message: `Upgraded for ${result.cost} coins.`,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to buy that upgrade.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/feed.post.ts
//
// Feeds one fish in the authenticated user's tank, restoring its hunger to
// data/economy.yaml's feed.restores_hunger_to and charging
// feed.cost_factor_of_unlock_cost * that fish's unlock_cost in coins,
// rejecting if the tank can't afford it (cthulhuquarium/t-009).
//
// Body: { aquariumStockId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { feedFishForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const aquariumStockId = Number(body?.aquariumStockId)
    if (!Number.isInteger(aquariumStockId) || aquariumStockId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'aquariumStockId must be a positive integer.',
      })
    }

    const result = await feedFishForUser(
      user.id,
      user.username,
      aquariumStockId,
    )

    response = {
      success: true,
      message: `Fed for ${result.cost} coins.`,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to feed fish.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

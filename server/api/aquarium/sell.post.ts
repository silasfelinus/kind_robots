// /server/api/aquarium/sell.post.ts
//
// Releases one fish out of the authenticated user's tank for a flat half of
// its species' unlock cost (cthulhuquarium/t-030, t-082 -- LOOP.md: how a
// full tank trades up to rarer fish). Priced server-side. The species stays
// re-orderable afterward through the Ichthyonomicon (GET
// /api/aquarium/bestiary's `currentlyOwned` flag + POST /api/aquarium/purchase)
// regardless of today's rotating catalog -- selling never touches
// AquariumCodexEntry.
//
// Body: { aquariumStockId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { sellFishForUser } from '../../utils/aquarium'

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

    const result = await sellFishForUser(
      user.id,
      user.username,
      aquariumStockId,
    )

    response = {
      success: true,
      message: `Sold for ${result.salePrice} coins.`,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to sell that fish.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

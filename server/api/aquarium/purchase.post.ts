// /server/api/aquarium/purchase.post.ts
//
// Purchases into the authenticated user's tank, priced and validated
// entirely server-side from data/economy.yaml (cthulhuquarium/t-009).
//
// Body: { type: 'species', characterId: number }
//
// Only `type: 'species'` (unlocking a new fish species) is implemented.
// The task note also named `food` and `upgrade` purchase types, but neither
// has a real mechanic to price against in economy.yaml or the live schema:
//   - food: economy.yaml bundles buying and consuming food into a single
//     action ("the food is alive") -- POST /api/aquarium/feed already IS
//     that purchase, priced the same way (feed.cost_factor_of_unlock_cost *
//     the fish's unlock_cost). A standalone food-purchase-for-later type
//     would need its own inventory column that does not exist on any
//     Aquarium/AquariumStock row.
//   - upgrade: economy.yaml's `slots` section states capacity growth is
//     "entirely landmark-driven... never purchased with coins" ("coins buy
//     breadth, milestones buy room"). Inventing a coin price for it would
//     contradict the balance spec this task is required to read from.
// Both return 400 rather than silently succeeding at a made-up price --
// the whole point of "the server disposes" is refusing to invent economy
// the spec doesn't define. Flagged in the PR for reviewer confirmation.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { purchaseSpeciesForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const type = String(body?.type ?? '')

    if (type !== 'species') {
      throw createError({
        statusCode: 400,
        message:
          type === 'food' || type === 'upgrade'
            ? `Purchase type '${type}' is not implemented -- see this route's file header for why (feed food via POST /api/aquarium/feed; capacity grows only via milestones).`
            : "Unsupported purchase type. Only { type: 'species', characterId } is implemented.",
      })
    }

    const characterId = Number(body?.characterId)
    if (!Number.isInteger(characterId) || characterId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'characterId must be a positive integer.',
      })
    }

    const result = await purchaseSpeciesForUser(
      user.id,
      user.username,
      characterId,
    )

    response = {
      success: true,
      message: `Unlocked for ${result.cost} coins.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to complete purchase.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/decor/purchase.post.ts
//
// Purchases and places one decor item in the authenticated user's tank
// (cthulhuquarium/t-017), priced and validated entirely server-side: rejects
// an unknown kind or insufficient coins. Unlike set pieces, there is no slot
// cap and duplicates of the same kind are allowed -- each purchase creates
// its own AquariumDecor row.
//
// Body: { kind: string, x?: number, y?: number }  (x/y default to center;
// out-of-range values are clamped, never rejected)

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { purchaseDecorForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const kind = String(body?.kind ?? '')
    if (!kind) {
      throw createError({
        statusCode: 400,
        message: 'kind is required.',
      })
    }
    const x = body?.x === undefined ? undefined : Number(body.x)
    const y = body?.y === undefined ? undefined : Number(body.y)

    const result = await purchaseDecorForUser(
      user.id,
      user.username,
      kind,
      x,
      y,
    )

    response = {
      success: true,
      message: `Placed ${result.decor.kind}.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to place that decor item.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

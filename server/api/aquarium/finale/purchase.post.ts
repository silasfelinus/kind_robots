// /server/api/aquarium/finale/purchase.post.ts
//
// Buys the last aquarium (cthulhuquarium/t-039): a one-time, non-refundable,
// non-equippable terminal purchase. Priced and validated entirely
// server-side, same discipline as sets/equip.post.ts -- rejects a repeat
// purchase or insufficient coins. No request body.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { purchaseLastAquariumForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await purchaseLastAquariumForUser(user.id, user.username)

    response = {
      success: true,
      message: 'The last aquarium is yours.',
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not buy the last aquarium.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

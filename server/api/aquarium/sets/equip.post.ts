// /server/api/aquarium/sets/equip.post.ts
//
// Equips one set piece into the authenticated user's tank, priced and
// validated entirely server-side (cthulhuquarium/t-026): rejects an unknown
// kind, a duplicate, a full setSlotsCap, the no_stack_idle_effects pair
// (roaming_collector + idle_hoarder), or insufficient coins.
//
// Body: { kind: string }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { equipSetForUser } from '../../../utils/aquarium'

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

    const result = await equipSetForUser(user.id, user.username, kind)

    response = {
      success: true,
      message: `Equipped ${result.set.kind}.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to equip that set piece.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

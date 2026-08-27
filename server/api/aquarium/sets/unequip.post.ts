// /server/api/aquarium/sets/unequip.post.ts
//
// Removes one equipped set piece from the authenticated user's tank
// (cthulhuquarium/t-026), freeing its setSlotsCap slot. No coin refund --
// see equipSetForUser/unequipSetForUser's own doc comments for why this
// isn't treated as a reversible purchase.
//
// Body: { aquariumSetId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { unequipSetForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const aquariumSetId = Number(body?.aquariumSetId)
    if (!Number.isInteger(aquariumSetId) || aquariumSetId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'aquariumSetId must be a positive integer.',
      })
    }

    const result = await unequipSetForUser(
      user.id,
      user.username,
      aquariumSetId,
    )

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
      message: handledError.message || 'Failed to unequip that set piece.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

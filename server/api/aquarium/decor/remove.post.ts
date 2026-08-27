// /server/api/aquarium/decor/remove.post.ts
//
// Removes one placed decor item from the authenticated user's tank
// (cthulhuquarium/t-017). No coin refund -- same "not a refundable purchase"
// shape as unequipping a set piece.
//
// Body: { aquariumDecorId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { removeDecorForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const aquariumDecorId = Number(body?.aquariumDecorId)
    if (!Number.isInteger(aquariumDecorId) || aquariumDecorId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'aquariumDecorId must be a positive integer.',
      })
    }

    const result = await removeDecorForUser(
      user.id,
      user.username,
      aquariumDecorId,
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
      message: handledError.message || 'Failed to remove that decor item.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

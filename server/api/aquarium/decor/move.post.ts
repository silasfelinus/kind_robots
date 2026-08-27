// /server/api/aquarium/decor/move.post.ts
//
// Repositions one already-placed decor item in the authenticated user's tank
// (cthulhuquarium/t-017). Free -- moving something you already placed costs
// nothing. x/y are clamped to the 0-100 stage-percentage range server-side.
//
// Body: { aquariumDecorId: number, x: number, y: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { moveDecorForUser } from '../../../utils/aquarium'

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
    const x = Number(body?.x)
    const y = Number(body?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw createError({
        statusCode: 400,
        message: 'x and y must be numbers.',
      })
    }

    const result = await moveDecorForUser(
      user.id,
      user.username,
      aquariumDecorId,
      x,
      y,
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
      message: handledError.message || 'Failed to move that decor item.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

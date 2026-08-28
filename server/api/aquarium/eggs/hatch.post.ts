// /server/api/aquarium/eggs/hatch.post.ts
//
// Hatches one already-purchased, not-yet-hatched egg in the authenticated
// user's tank (cthulhuquarium/t-041). Free -- the coins were already spent
// at purchase -- and never touches capacity: the egg's size was reserved
// the moment it was bought, and the resolved species is always
// size <= egg.size, so the reservation already covers it.
//
// Body: { aquariumEggId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { hatchEggForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const aquariumEggId = Number(body?.aquariumEggId)
    if (!Number.isInteger(aquariumEggId) || aquariumEggId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'aquariumEggId must be a positive integer.',
      })
    }

    const result = await hatchEggForUser(user.id, user.username, aquariumEggId)

    response = {
      success: true,
      message: `Hatched ${result.stock.Monster.name}.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to hatch that egg.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

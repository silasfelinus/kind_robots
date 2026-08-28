// /server/api/aquarium/breed.post.ts
//
// Breeds two individuals of the same species in the authenticated user's
// tank into a new offspring, priced and validated entirely server-side
// (cthulhuquarium/t-029). Parents are never consumed or modified -- see
// server/utils/aquarium.ts's breedFishForUser header comment for the full
// design rationale and the v1 same-species scope decision.
//
// Body: { parentAId: number, parentBId: number }

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { breedFishForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const parentAId = Number(body?.parentAId)
    const parentBId = Number(body?.parentBId)

    if (!Number.isInteger(parentAId) || parentAId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'parentAId must be a positive integer.',
      })
    }
    if (!Number.isInteger(parentBId) || parentBId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'parentBId must be a positive integer.',
      })
    }

    const result = await breedFishForUser(
      user.id,
      user.username,
      parentAId,
      parentBId,
    )

    response = {
      success: true,
      message: result.evolved
        ? `A secret evolution! Bred for ${result.cost} coins.`
        : `Bred for ${result.cost} coins.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to breed fish.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

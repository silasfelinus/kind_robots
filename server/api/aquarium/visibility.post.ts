// /server/api/aquarium/visibility.post.ts
//
// One-click public/private toggle for the authenticated user's own tank
// (cthulhuquarium/t-014's "make the toggle obvious and one click"). Body:
// `{ isPublic: boolean }`. Never affects anyone else's tank -- always reads
// and writes against the caller's own aquarium, same as feed/clean/purchase.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { setTankVisibilityForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)

    if (
      !body ||
      typeof body !== 'object' ||
      typeof body.isPublic !== 'boolean'
    ) {
      throw createError({
        statusCode: 400,
        message: 'isPublic (boolean) is required.',
      })
    }

    const result = await setTankVisibilityForUser(
      user.id,
      user.username,
      body.isPublic,
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
      message:
        handledError.message || "Could not update the tank's visibility.",
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

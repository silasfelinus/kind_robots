// /server/api/aquarium/sets/index.get.ts
//
// Lists the Cthulhuquarium set-piece catalog (cthulhuquarium/t-026) alongside
// which ones the authenticated user's tank currently has equipped -- the
// build layer's own catalog view, same shape as GET /api/aquarium/catalog
// for species.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listSetsForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await listSetsForUser(user.id, user.username)

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
      message: handledError.message || 'Failed to load set pieces.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

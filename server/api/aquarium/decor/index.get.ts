// /server/api/aquarium/decor/index.get.ts
//
// Lists the Cthulhuquarium decor catalog (cthulhuquarium/t-017) alongside
// what the authenticated user's tank currently has placed -- same shape as
// GET /api/aquarium/sets for set pieces.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listDecorForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await listDecorForUser(user.id, user.username)

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
      message: handledError.message || 'Failed to load decor.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

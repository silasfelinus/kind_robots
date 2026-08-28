// /server/api/aquarium/eggs/index.get.ts
//
// Lists the Cthulhuquarium egg catalog (cthulhuquarium/t-041) alongside the
// authenticated user's own unhatched eggs -- same "catalog + this tank's
// own state" shape as GET /api/aquarium/sets and GET /api/aquarium/decor.
// Unlike the species catalog, this one never rotates -- all six rarities x
// three sizes are always on offer.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listEggCatalogForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await listEggCatalogForUser(user.id, user.username)

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
      message: handledError.message || 'Failed to load the egg catalog.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

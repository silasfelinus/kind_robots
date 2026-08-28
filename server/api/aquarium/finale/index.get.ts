// /server/api/aquarium/finale/index.get.ts
//
// Reports the last-aquarium terminal purchase (cthulhuquarium/t-039):
// its static config (cost/description) plus whether this tank has already
// triggered it. Same shape as GET /api/aquarium/sets for the build layer.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { getFinaleStatusForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const result = await getFinaleStatusForUser(user.id, user.username)

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
      message: handledError.message || 'Failed to load the finale status.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

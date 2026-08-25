// /server/api/aquarium/index.get.ts
//
// Returns the authenticated user's Cthulhuquarium tank, creating one with
// default state on first visit (cthulhuquarium/t-009).

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { getOrCreateTankForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const data = await getOrCreateTankForUser(user.id, user.username)

    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to load your tank.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

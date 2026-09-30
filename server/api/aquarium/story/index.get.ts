// /server/api/aquarium/story/index.get.ts
//
// The caller's story state: which Charlotte/Wilbur scenes they have seen, which
// tank backgrounds have been handed over, and the one currently shown.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { getStoryStateForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const data = await getStoryStateForUser(user.id, user.username)
    response = { success: true, data, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not load the story.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

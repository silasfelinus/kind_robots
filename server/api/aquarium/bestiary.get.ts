// /server/api/aquarium/bestiary.get.ts
//
// The completionist codex (cthulhuquarium/t-024): every species in the
// bestiary the authenticated user has ever collected stays listed and
// collected forever, plus every currently-active species not yet found (shown
// without art or field note -- see server/utils/aquarium.ts's
// toBestiaryEntry). Includes the collected/total counts the bestiary panel's
// completion badge reads directly, so the client never has to derive them
// from the list itself.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { listBestiaryForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const result = await listBestiaryForUser(user.id)

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
      message: handledError.message || 'Failed to load the bestiary.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// /server/api/aquarium/story/reconcile.post.ts
//
// Grants, once, any bestiary milestone the caller's collection already earned
// but never logged (reconcileBestiaryMilestonesForUser). Returns what fired so
// Charlotte can hand the backgrounds over; an empty list once caught up.

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { reconcileBestiaryMilestonesForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const firedMilestones = await reconcileBestiaryMilestonesForUser(
      user.id,
      user.username,
    )
    response = { success: true, data: { firedMilestones }, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not reconcile milestones.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

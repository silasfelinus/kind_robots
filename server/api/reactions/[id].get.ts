// /server/api/reactions/[id].get.ts
//
// Read one Reaction by its own id.
//
// A comment is as public as the thing it was left on, so this serves any
// reaction whose target is public -- signed in or not -- plus the caller's own
// and, for admins, all of them. Silas, 2026-08-12: "reviews are public and
// defaulted so ... as long as people can see the comments left by others, then
// we are good."
//
// It used to return an arbitrary row to anyone with no check at all, which made
// securing GET /api/reactions (#1788) cosmetic: walking ids rebuilt the same
// table one request at a time, including comments on objects their owners had
// never made public. The rule now comes from server/utils/reactionVisibility.ts
// so this route and the per-target one cannot drift apart again.
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { canViewReaction } from '../../utils/reactionVisibility'
import { fetchReactionById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid reaction ID is required.',
      })
    }

    const auth = await getOptionalApiUser(event)
    const viewer = {
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin ?? false,
    }

    const data = await fetchReactionById(id)

    // One answer for "no such reaction" and "not yours to read": a 403 would
    // confirm the row exists, which is the enumeration this route was leaking.
    if (!data || !(await canViewReaction(data, viewer))) {
      throw createError({
        statusCode: 404,
        message: `Reaction with ID ${id} not found.`,
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Fetched reaction #${id}.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success,
      message: message || 'An error occurred while fetching the reaction.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})

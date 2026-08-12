// /server/api/reactions/[id].get.ts
//
// Read one Reaction by its own id: the author's, or any of them for an admin.
//
// Securing GET /api/reactions (#1788) would have been cosmetic while this route
// still returned an arbitrary row to anyone, since walking ids 1..N rebuilds
// the same table one request at a time. Nothing in the app calls this -- the
// store reads through /api/reactions/<target>/<id> and only ever PATCHes or
// DELETEs by id -- so restricting it costs no existing behaviour.
//
// This is deliberately STRICTER than the per-target route, which serves any
// reaction on a public object to anybody. Matching that would mean resolving
// each reaction's target model to re-derive its visibility; owner-or-admin is
// the conservative reading until there is a caller that needs more. Public
// reading of reactions happens through the target route, which already checks
// the target.
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { fetchReactionById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid reaction ID is required.',
      })
    }

    const data = await fetchReactionById(id)

    // Same answer for "does not exist" and "not yours": a 403 here would
    // confirm the row exists, which is the enumeration this route was leaking.
    if (!data || (!auth.isAdmin && data.userId !== auth.user.id)) {
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

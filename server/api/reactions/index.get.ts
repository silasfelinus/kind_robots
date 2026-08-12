// /server/api/reactions/index.get.ts
//
// GET /api/reactions -- the caller's own reactions. Admins may read another
// user's, or the whole table, by asking explicitly.
//
// This route used to call fetchAllReactions(), an unauthenticated
// `prisma.reaction.findMany({})` that returned every Reaction row in the
// database to anyone who asked: every comment, every rating, and the userId
// behind each one, including reactions on records their owners had never made
// public (#1788).
//
// It is scoped rather than deleted because "my reactions" is a legitimate
// surface and the unscoped one was the defect. Nothing in the app called this
// route -- the store reads through /api/reactions/<target>/<id> -- so the
// blast radius of narrowing it is a caller we do not have.
import { createError, defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireApiUser } from '../../utils/authGuard'

const MAX_TAKE = 200

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery<{ userId?: string; all?: string; take?: string; skip?: string }>(
      event,
    )

    const requestedUserId = toPositiveInt(query.userId)
    const wantsEveryone = query.all === 'true' || query.all === '1'

    // Reading somebody else's reactions, or everybody's, is an admin act. A
    // non-admin asking for either gets 403 rather than a silent downgrade to
    // their own rows, so a broken caller fails loudly instead of looking like
    // it worked.
    if ((requestedUserId && requestedUserId !== auth.user.id) || wantsEveryone) {
      if (!auth.isAdmin) {
        throw createError({
          statusCode: 403,
          message: 'Only an admin may read another user’s reactions.',
        })
      }
    }

    const where =
      wantsEveryone && auth.isAdmin
        ? {}
        : { userId: requestedUserId && auth.isAdmin ? requestedUserId : auth.user.id }

    const take = Math.min(MAX_TAKE, toPositiveInt(query.take) ?? MAX_TAKE)
    const skip = toPositiveInt(query.skip) ?? 0

    const data = await prisma.reaction.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Fetched ${data.length} reaction(s).`,
      data,
      count: data.length,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success,
      message: message || 'Failed to fetch reactions.',
      data: [],
      count: 0,
      statusCode: statusCode || 500,
    }
  }
})

// /server/api/reactions/tzaddikCandidate/[id].get.ts
//
// Read the reactions on one Tzaddik candidate.
//
// Not served by the catch-all [target]/[id].get.ts: that route's generic
// visibility check selects {userId, isPublic} on the target's own model, and
// TzaddikCandidate has neither column. It has its own route here, same as
// chat, with a real visibility check shared with the write path
// (reactionVisibility.ts's canViewReactionsOn) rather than skipping one.
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { getOptionalApiUser } from '../../../utils/authGuard'
import { canViewReactionsOn } from '../../../utils/reactionVisibility'

export default defineEventHandler(async (event) => {
  try {
    const targetId = Number(event.context.params?.id)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid Tzaddik candidate id is required.',
      })
    }

    const auth = await getOptionalApiUser(event)
    const viewer = {
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin ?? false,
    }

    if (!(await canViewReactionsOn('tzaddikCandidate', targetId, viewer))) {
      throw createError({
        statusCode: 403,
        message:
          'You do not have permission to read reactions on this Tzaddik candidate.',
      })
    }

    const reactions = await prisma.reaction.findMany({
      where: { tzaddikCandidateId: targetId },
      include: {
        User: { select: { id: true, username: true, avatarImage: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Fetched ${reactions.length} reaction(s) for Tzaddik candidate #${targetId}.`,
      data: reactions,
      count: reactions.length,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to fetch reactions.',
      data: [],
      count: 0,
      statusCode: statusCode || 500,
    }
  }
})

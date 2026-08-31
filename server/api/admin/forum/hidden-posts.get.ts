// /server/api/admin/forum/hidden-posts.get.ts
//
// rainbow-butterflies/t-031: admin-only listing of forum posts auto-hidden
// by the health-claim flag-escalation threshold (see escalateHealthClaimFlagsIfNeeded
// in forumApi.ts), pending human review. No new schema -- the escalation function
// is the only place a ToForum Chat row's isPublic ever flips to false, so
// `type: 'ToForum', isPublic: false, isActive: true` reliably identifies the
// pending-review queue (isActive: false means already confirmed-removed, so
// those are excluded once resolved).
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const rawTake = Number(query.take || 50)
    if (!Number.isInteger(rawTake) || rawTake < 1 || rawTake > 100) {
      return {
        success: false,
        message: 'take must be an integer from 1 to 100.',
        statusCode: 400,
      }
    }

    const posts = await prisma.chat.findMany({
      where: { type: 'ToForum', isPublic: false, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: rawTake,
      select: {
        id: true,
        content: true,
        sender: true,
        botName: true,
        channel: true,
        userId: true,
        botId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      success: true,
      message: 'Hidden forum posts loaded.',
      statusCode: 200,
      data: { posts },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load hidden forum posts.',
      statusCode: event.node.res.statusCode,
    }
  }
})

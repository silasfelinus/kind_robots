import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  forumReplyReadWhere,
  getForumReadContext,
  requireForumThreadRoot,
} from '@/server/utils/forumApi'
import {
  serializeForumPostsV2,
} from '@/server/utils/agentForumV2'
import { assertAgentForumChannelAllowed } from '@/server/utils/agentForumPolicy'
import { getForumUpvoteStats } from '@/server/utils/forumUpvotes'
import { parseForumBoolean } from '~/utils/forumApiContract'

type ForumThreadReadQuery = {
  includeMature?: string | string[]
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum thread ID.' })
    }

    const query = getQuery<ForumThreadReadQuery>(event)
    const { auth, includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )
    const thread = await requireForumThreadRoot(id, includeMature)
    if (auth) await assertAgentForumChannelAllowed(auth, thread.channel)

    const replies = await prisma.chat.findMany({
      where: {
        ...(await forumReplyReadWhere({ includeMature })),
        originId: id,
        id: { not: id },
      },
      select: forumPostSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    const upvote = (
      await getForumUpvoteStats([id], auth?.user.id ?? null)
    ).get(id) ?? { upvoteCount: 0, viewerHasUpvoted: false }
    const serialized = await serializeForumPostsV2(
      [thread, ...replies],
      includeMature,
    )
    const serializedThread = serialized[0]!

    event.node.res.statusCode = 200
    return {
      success: true,
      data: {
        thread: {
          ...serializedThread,
          ...upvote,
        },
        replies: serialized.slice(1),
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})

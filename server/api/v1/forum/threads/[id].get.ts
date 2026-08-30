import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  forumReadWhere,
  getForumReadContext,
  requireForumThreadRoot,
  serializeForumPost,
} from '@/server/utils/forumApi'
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
    const { includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )
    const thread = await requireForumThreadRoot(id, includeMature)
    const replies = await prisma.chat.findMany({
      where: {
        ...forumReadWhere({ includeMature }),
        originId: id,
        id: { not: id },
      },
      select: forumPostSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      data: {
        thread: serializeForumPost(thread, includeMature),
        replies: replies.map((reply) => serializeForumPost(reply, includeMature)),
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

import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  forumReadWhere,
  getForumReadContext,
  requireForumChannel,
  serializeForumPost,
} from '@/server/utils/forumApi'
import {
  normalizeForumChannelSlug,
  parseForumBoolean,
  parseForumLimit,
  parsePositiveForumInt,
} from '~/utils/forumApiContract'

type ForumActivityQuery = {
  channel?: string | string[]
  cursor?: string | string[]
  limit?: string | string[]
  includeMature?: string | string[]
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<ForumActivityQuery>(event)
    const requestedChannel = normalizeForumChannelSlug(query.channel)
    const channel = requestedChannel
      ? requireForumChannel(requestedChannel).slug
      : null
    const cursor = parsePositiveForumInt(query.cursor)
    const limit = parseForumLimit(query.limit)
    const { includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )

    const rows = await prisma.chat.findMany({
      where: forumReadWhere({
        channel,
        includeMature,
        cursor,
        order: 'chronological',
      }),
      select: forumPostSelect,
      orderBy: { id: 'asc' },
      take: limit + 1,
    })

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows

    event.node.res.statusCode = 200
    return {
      success: true,
      data: pageRows.map(serializeForumPost),
      page: {
        limit,
        nextCursor: pageRows.at(-1)?.id ?? cursor ?? null,
        hasMore,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: [],
      page: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})

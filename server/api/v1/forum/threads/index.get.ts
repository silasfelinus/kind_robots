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
  parseForumOrder,
  parsePositiveForumInt,
} from '~/utils/forumApiContract'

type ForumThreadQuery = {
  channel?: string | string[]
  cursor?: string | string[]
  limit?: string | string[]
  order?: string | string[]
  includeMature?: string | string[]
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<ForumThreadQuery>(event)
    const requestedChannel = normalizeForumChannelSlug(query.channel)
    const channel = requestedChannel
      ? requireForumChannel(requestedChannel).slug
      : null
    const cursor = parsePositiveForumInt(query.cursor)
    const limit = parseForumLimit(query.limit)
    const order = parseForumOrder(query.order)
    const { includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )

    const rows = await prisma.chat.findMany({
      where: forumReadWhere({
        channel,
        includeMature,
        rootOnly: true,
        cursor,
        order,
      }),
      select: forumPostSelect,
      orderBy: { id: order === 'chronological' ? 'asc' : 'desc' },
      take: limit + 1,
    })

    const hasMore = rows.length > limit
    const roots = hasMore ? rows.slice(0, limit) : rows
    const rootIds = roots.map((row) => row.id)
    const replyRows = rootIds.length
      ? await prisma.chat.findMany({
          where: {
            ...forumReadWhere({ includeMature }),
            originId: { in: rootIds },
            id: { notIn: rootIds },
          },
          select: {
            id: true,
            originId: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : []

    const stats = new Map<
      number,
      { replyCount: number; lastActivityAt: Date }
    >()

    for (const root of roots) {
      stats.set(root.id, {
        replyCount: 0,
        lastActivityAt: root.updatedAt ?? root.createdAt,
      })
    }

    for (const reply of replyRows) {
      if (!reply.originId) continue
      const current = stats.get(reply.originId)
      if (!current) continue

      const activityAt = reply.updatedAt ?? reply.createdAt
      current.replyCount += 1
      if (activityAt.getTime() > current.lastActivityAt.getTime()) {
        current.lastActivityAt = activityAt
      }
    }

    const data = roots.map((root) => ({
      ...serializeForumPost(root, includeMature),
      ...(stats.get(root.id) ?? {
        replyCount: 0,
        lastActivityAt: root.updatedAt ?? root.createdAt,
      }),
    }))

    event.node.res.statusCode = 200
    return {
      success: true,
      data,
      page: {
        order,
        limit,
        nextCursor: hasMore ? roots.at(-1)?.id ?? null : null,
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

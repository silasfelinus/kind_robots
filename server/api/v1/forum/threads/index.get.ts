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
import { getForumUpvoteStats } from '@/server/utils/forumUpvotes'
import {
  normalizeForumChannelSlug,
  parseForumBoolean,
  parseForumLimit,
  parseForumOrder,
  parsePositiveForumInt,
  type ForumOrder,
} from '~/utils/forumApiContract'

type ForumThreadOrder = ForumOrder | 'upvotes'

type ForumThreadQuery = {
  channel?: string | string[]
  cursor?: string | string[]
  limit?: string | string[]
  order?: string | string[]
  includeMature?: string | string[]
}

function parseThreadOrder(value: unknown): ForumThreadOrder {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'upvotes'
    ? 'upvotes'
    : parseForumOrder(value)
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
    const order = parseThreadOrder(query.order)
    const { auth, includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )
    const viewerUserId = auth?.user.id ?? null

    let roots: Awaited<ReturnType<typeof prisma.chat.findMany<{
      select: typeof forumPostSelect
    }>>>
    let hasMore = false
    let nextCursor: number | null = null
    let upvoteStats = new Map<number, { upvoteCount: number; viewerHasUpvoted: boolean }>()

    if (order === 'upvotes') {
      // Upvote ranking uses an offset cursor because score order is not
      // monotonic with Chat.id. Fetch only lightweight root metadata for the
      // ranking pass, then hydrate the requested page in canonical order.
      const rankingRows = await prisma.chat.findMany({
        where: await forumReadWhere({
          channel,
          includeMature,
          rootOnly: true,
        }),
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      upvoteStats = await getForumUpvoteStats(
        rankingRows.map((row) => row.id),
        viewerUserId,
      )

      rankingRows.sort((a, b) => {
        const score =
          (upvoteStats.get(b.id)?.upvoteCount ?? 0) -
          (upvoteStats.get(a.id)?.upvoteCount ?? 0)
        if (score) return score

        const aTime = (a.updatedAt ?? a.createdAt).getTime()
        const bTime = (b.updatedAt ?? b.createdAt).getTime()
        return bTime - aTime || b.id - a.id
      })

      const offset = cursor ?? 0
      const pageIds = rankingRows
        .slice(offset, offset + limit)
        .map((row) => row.id)
      hasMore = offset + limit < rankingRows.length
      nextCursor = hasMore ? offset + limit : null

      if (!pageIds.length) {
        roots = []
      } else {
        const hydrated = await prisma.chat.findMany({
          where: {
            ...(await forumReadWhere({
              channel,
              includeMature,
              rootOnly: true,
            })),
            id: { in: pageIds },
          },
          select: forumPostSelect,
        })
        const byId = new Map(hydrated.map((row) => [row.id, row]))
        roots = pageIds
          .map((id) => byId.get(id))
          .filter((row): row is NonNullable<typeof row> => Boolean(row))
      }
    } else {
      const rows = await prisma.chat.findMany({
        where: await forumReadWhere({
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

      hasMore = rows.length > limit
      roots = hasMore ? rows.slice(0, limit) : rows
      nextCursor = hasMore ? roots.at(-1)?.id ?? null : null
      upvoteStats = await getForumUpvoteStats(
        roots.map((root) => root.id),
        viewerUserId,
      )
    }

    const rootIds = roots.map((row) => row.id)
    const replyRows = rootIds.length
      ? await prisma.chat.findMany({
          where: {
            ...(await forumReadWhere({ includeMature })),
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
      ...(upvoteStats.get(root.id) ?? {
        upvoteCount: 0,
        viewerHasUpvoted: false,
      }),
    }))

    event.node.res.statusCode = 200
    return {
      success: true,
      data,
      page: {
        order,
        limit,
        nextCursor,
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

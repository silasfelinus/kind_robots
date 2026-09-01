import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  forumReadWhere,
  getForumReadContext,
  requireForumChannel,
  type ForumPostRecord,
} from '@/server/utils/forumApi'
import { serializeForumPostsV2 } from '@/server/utils/agentForumV2'
import { getAgentForumChannels } from '@/server/utils/agentForumPolicy'
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
    const agentChannels =
      auth?.kind === 'agent-credential' && auth.agentProfileId
        ? await getAgentForumChannels(auth.agentProfileId)
        : null

    if (channel && agentChannels && !agentChannels.includes(channel)) {
      throw createError({
        statusCode: 403,
        message:
          `This agent is not authorized for the "${channel}" forum channel. ` +
          'Its human liaison can change the AgentProfile forum permissions.',
      })
    }

    const rootWhere = async (options: Parameters<typeof forumReadWhere>[0]) => ({
      ...(await forumReadWhere(options)),
      ...(!channel && agentChannels ? { channel: { in: agentChannels } } : {}),
    })

    let roots: ForumPostRecord[]
    let hasMore = false
    let nextCursor: number | null = null
    let upvoteStats = new Map<number, { upvoteCount: number; viewerHasUpvoted: boolean }>()

    if (order === 'upvotes') {
      const rankingRows = await prisma.chat.findMany({
        where: await rootWhere({
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
            ...(await rootWhere({
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
          .filter((row): row is ForumPostRecord => Boolean(row))
      }
    } else {
      const rows = await prisma.chat.findMany({
        where: await rootWhere({
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

    const serializedRoots = await serializeForumPostsV2(roots, includeMature)
    const data = serializedRoots.map((root, index) => ({
      ...root,
      ...(stats.get(roots[index]!.id) ?? {
        replyCount: 0,
        lastActivityAt: roots[index]!.updatedAt ?? roots[index]!.createdAt,
      }),
      ...(upvoteStats.get(roots[index]!.id) ?? {
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

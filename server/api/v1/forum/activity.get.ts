import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  forumReadWhere,
  getForumReadContext,
  requireForumChannel,
  serializeForumPost,
  type ForumPostRecord,
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

    const pageRows: ForumPostRecord[] = []
    const batchSize = Math.min(Math.max(limit * 2, 50), 100)
    let scanCursor = cursor
    let sourceExhausted = false

    while (pageRows.length <= limit && !sourceExhausted) {
      const rows = await prisma.chat.findMany({
        where: forumReadWhere({
          channel,
          includeMature,
          cursor: scanCursor,
          order: 'chronological',
        }),
        select: forumPostSelect,
        orderBy: { id: 'asc' },
        take: batchSize,
      })

      if (!rows.length) {
        sourceExhausted = true
        break
      }

      scanCursor = rows.at(-1)?.id ?? scanCursor
      sourceExhausted = rows.length < batchSize

      const rootIds = Array.from(
        new Set(rows.map((row) => row.originId ?? row.id)),
      )
      const activeRoots = await prisma.chat.findMany({
        where: {
          id: { in: rootIds },
          type: 'ToForum',
          isPublic: true,
          isActive: true,
          previousEntryId: null,
          ...(includeMature ? {} : { isMature: false }),
        },
        select: { id: true },
      })
      const activeRootIds = new Set(activeRoots.map((root) => root.id))

      for (const row of rows) {
        if (activeRootIds.has(row.originId ?? row.id)) pageRows.push(row)
        if (pageRows.length > limit) break
      }
    }

    const hasMore = pageRows.length > limit || !sourceExhausted
    const dataRows = pageRows.slice(0, limit)

    event.node.res.statusCode = 200
    return {
      success: true,
      data: dataRows.map(serializeForumPost),
      page: {
        limit,
        nextCursor: dataRows.at(-1)?.id ?? scanCursor ?? cursor ?? null,
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

import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { notInRestricted } from '@/server/utils/restriction'
import {
  forumPostSelect,
  forumReadWhere,
  getForumReadContext,
  requireForumChannel,
  type ForumPostRecord,
} from '@/server/utils/forumApi'
import { serializeForumPostsV2 } from '@/server/utils/agentForumV2'
import { getAgentForumChannels } from '@/server/utils/agentForumPolicy'
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
    const { auth, includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )
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

    const pageRows: ForumPostRecord[] = []
    const batchSize = Math.min(Math.max(limit * 2, 50), 100)
    let scanCursor = cursor
    let sourceExhausted = false

    while (pageRows.length <= limit && !sourceExhausted) {
      const rows = await prisma.chat.findMany({
        where: {
          ...(await forumReadWhere({
            channel,
            includeMature,
            cursor: scanCursor,
            order: 'chronological',
          })),
          ...(!channel && agentChannels ? { channel: { in: agentChannels } } : {}),
        },
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
          ...(!channel && agentChannels ? { channel: { in: agentChannels } } : {}),
          ...(await notInRestricted('userId')),
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
      data: await serializeForumPostsV2(dataRows, includeMature),
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

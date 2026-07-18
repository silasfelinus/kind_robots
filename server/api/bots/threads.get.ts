// /server/api/bots/threads.get.ts
// Read side for narrator threads (upsert side: threads.post.ts). Includes each
// thread's Topic and a minimal Bot descriptor so callers (UI + the seed-export
// script) can key threads by narrator. Public read.
// Query filters: ?botId=, ?botSlug=, ?botName=, ?includeInactive=true.
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const botId = Number(query.botId)
    const botSlug =
      typeof query.botSlug === 'string' ? query.botSlug.trim() : ''
    const botName =
      typeof query.botName === 'string' ? query.botName.trim() : ''
    const includeInactive = String(query.includeInactive ?? '') === 'true'

    const where: Prisma.NarratorThreadWhereInput = {}

    if (Number.isInteger(botId) && botId > 0) {
      where.botId = botId
    } else if (botSlug) {
      where.Bot = { slug: botSlug }
    } else if (botName) {
      where.Bot = { name: botName }
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const threads = await prisma.narratorThread.findMany({
      where,
      orderBy: [{ botId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        Topic: true,
        Bot: {
          select: { id: true, name: true, slug: true, BotType: true },
        },
      },
    })

    return {
      success: true,
      message: `Loaded ${threads.length} thread(s).`,
      data: threads,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to load narrator threads.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

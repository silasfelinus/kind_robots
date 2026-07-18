// /server/api/bots/topics.get.ts
// Read side for the shared narrator topic menu (upsert side: topics.post.ts).
// Public: topics are the near-canon conversation menu shown to every narrator.
// Query: ?includeInactive=true to also return soft-deleted rows.
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const includeInactive = String(query.includeInactive ?? '') === 'true'

    const topics = await prisma.narratorTopic.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    })

    return {
      success: true,
      message: `Loaded ${topics.length} topic(s).`,
      data: topics,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to load narrator topics.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})

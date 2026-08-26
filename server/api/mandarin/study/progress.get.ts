// /server/api/mandarin/study/progress.get.ts
//
// mandarin-tutor/t-015: study diagnostics for the current learner -- due-for-review
// count, rolling retention rate, and weakest cards -- plus, when ?cardKeys= is given, the
// per-card progress rows for exactly those keys (so the client can badge individual cards
// without fetching the learner's entire history).
import { defineEventHandler, getQuery } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'
import { summarizeMandarinStudyDiagnostics } from '../../../utils/mandarinSrs'

const DIAGNOSTICS_EVENT_LIMIT = 30
const MAX_CARD_KEYS = 500

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id
    const query = getQuery(event)

    const requestedKeys = String(query.cardKeys ?? '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean)
      .slice(0, MAX_CARD_KEYS)

    const [allProgress, recentEvents] = await Promise.all([
      prisma.mandarinCardProgress.findMany({
        where: { userId, dimension: 'overall' },
        select: {
          cardKey: true,
          dueAt: true,
          repetitions: true,
          lapses: true,
          intervalDays: true,
          easeFactor: true,
          lastRating: true,
        },
      }),
      prisma.mandarinReviewEvent.findMany({
        where: { userId, dimension: 'overall' },
        orderBy: { ratedAt: 'desc' },
        take: DIAGNOSTICS_EVENT_LIMIT,
        select: { cardKey: true, rating: true, ratedAt: true },
      }),
    ])

    const diagnostics = summarizeMandarinStudyDiagnostics(
      allProgress,
      recentEvents,
    )

    const cardsByKey = requestedKeys.length
      ? Object.fromEntries(
          allProgress
            .filter((row) => requestedKeys.includes(row.cardKey))
            .map((row) => [
              row.cardKey,
              {
                dueAt: row.dueAt.toISOString(),
                repetitions: row.repetitions,
                lapses: row.lapses,
                intervalDays: row.intervalDays,
                easeFactor: row.easeFactor,
                lastRating: row.lastRating,
              },
            ]),
        )
      : undefined

    return {
      success: true,
      statusCode: 200,
      message: 'Study progress loaded.',
      data: {
        diagnostics,
        cards: cardsByKey,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load study progress.',
    }
  }
})

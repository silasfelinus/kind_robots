// /server/api/mandarin/points.get.ts
//
// mandarin-tutor/t-023: the learner's points, and which lessons they have completed.
//
// The completed-lesson key list is what drives the SOFT study gate on the client -- the
// study queue sorts un-lessoned cards to the back and offers "Learn this first" rather
// than withholding them, which is the behaviour Silas chose explicitly. The gate is
// therefore presentational, and this endpoint is the only thing it needs.
//
// Returns zeroed totals and an empty list for a learner who has never earned anything,
// rather than 404ing: "no points yet" is a normal state, not an error.
import { defineEventHandler, getQuery } from 'h3'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { prisma } from '../../utils/prisma'
import { readMandarinTotals } from '../../utils/mandarinPointsLedger'

const RECENT_EVENT_LIMIT = 20
const MAX_COMPLETED_KEYS = 5_000

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id
    const query = getQuery(event)
    const includeHistory = String(query.history ?? '') === '1'

    const [totals, completed, recent] = await Promise.all([
      readMandarinTotals(userId),
      prisma.mandarinLessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        select: { cardKey: true, completedAt: true },
        take: MAX_COMPLETED_KEYS,
      }),
      includeHistory
        ? prisma.mandarinPointEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: RECENT_EVENT_LIMIT,
            select: {
              cardKey: true,
              reason: true,
              amount: true,
              balanceAfter: true,
              note: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ])

    return {
      success: true,
      statusCode: 200,
      message: `${totals.totalPoints} Mandarin points.`,
      data: {
        totals,
        completedLessonKeys: completed.map((row) => row.cardKey),
        ...(includeHistory
          ? {
              recent: recent.map((row) => ({
                cardKey: row.cardKey,
                reason: row.reason,
                amount: row.amount,
                balanceAfter: row.balanceAfter,
                note: row.note,
                createdAt: row.createdAt.toISOString(),
              })),
            }
          : {}),
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load Mandarin points.',
      data: null,
    }
  }
})

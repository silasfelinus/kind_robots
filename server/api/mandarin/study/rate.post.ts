// /server/api/mandarin/study/rate.post.ts
//
// mandarin-tutor/t-015: persists a Study-loop self-rating (Again/Hard/Good/Easy) into
// durable SM-2-lite scheduling state (MandarinCardProgress) and an append-only history
// event (MandarinReviewEvent). See server/utils/mandarinSrs.ts for the scheduling math.
//
// mandarin-tutor/t-023: also pays recall points. The award is computed from the card's
// state BEFORE this review is applied (see `pointsState` below), which is what makes
// "re-drilling an easy card earns almost nothing" true -- scoring against the
// already-updated row would reset the interval first and hand out full credit for a
// grind. server/utils/mandarinPoints.ts owns the arithmetic and explains each factor.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'
import {
  MANDARIN_SRS_INITIAL_STATE,
  nextMandarinSrsSchedule,
} from '../../../utils/mandarinSrs'
import {
  MANDARIN_POINTS_NEW_CARD,
  awardForRecall,
} from '../../../utils/mandarinPoints'
import {
  readMandarinTotals,
  recordMandarinPoints,
} from '../../../utils/mandarinPointsLedger'
import type { StudyRating } from '../../../../stores/mandarinTutorStore'

const VALID_RATINGS = new Set<StudyRating>(['again', 'hard', 'good', 'easy'])
const DEFAULT_DIMENSION = 'overall'
const MAX_CARD_KEY_LENGTH = 255
const MAX_DIMENSION_LENGTH = 32

type RequestBody = {
  cardKey?: unknown
  rating?: unknown
  dimension?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = ((await readBody(event)) ?? {}) as RequestBody

    const cardKey = String(body.cardKey ?? '').trim()
    if (!cardKey || cardKey.length > MAX_CARD_KEY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid cardKey is required.',
      })
    }

    const rating = String(body.rating ?? '').trim() as StudyRating
    if (!VALID_RATINGS.has(rating)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'rating must be one of: again, hard, good, easy.',
      })
    }

    const dimension =
      String(body.dimension ?? DEFAULT_DIMENSION)
        .trim()
        .slice(0, MAX_DIMENSION_LENGTH) || DEFAULT_DIMENSION

    const userId = auth.user.id

    const existing = await prisma.mandarinCardProgress.findUnique({
      where: { userId_cardKey_dimension: { userId, cardKey, dimension } },
    })

    const currentState = existing
      ? {
          repetitions: existing.repetitions,
          intervalDays: existing.intervalDays,
          easeFactor: existing.easeFactor,
        }
      : MANDARIN_SRS_INITIAL_STATE

    // Captured before the upsert below rewrites the row. Everything the points model
    // weighs -- how overdue the card was, how often it has been forgotten, how long the
    // interval had grown -- describes the review that just happened, not the one being
    // scheduled.
    const pointsState = existing
      ? {
          repetitions: existing.repetitions,
          intervalDays: existing.intervalDays,
          lapses: existing.lapses,
          lastReviewedAt: existing.lastReviewedAt,
        }
      : MANDARIN_POINTS_NEW_CARD

    const now = new Date()
    const next = nextMandarinSrsSchedule(currentState, rating, now)
    const award = awardForRecall(rating, pointsState, now)

    const progress = await prisma.mandarinCardProgress.upsert({
      where: { userId_cardKey_dimension: { userId, cardKey, dimension } },
      create: {
        userId,
        cardKey,
        dimension,
        repetitions: next.repetitions,
        lapses: next.lapsed ? 1 : 0,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        dueAt: next.dueAt,
        lastRating: rating,
        lastReviewedAt: now,
      },
      update: {
        repetitions: next.repetitions,
        lapses: next.lapsed ? { increment: 1 } : undefined,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        dueAt: next.dueAt,
        lastRating: rating,
        lastReviewedAt: now,
      },
    })

    await prisma.mandarinReviewEvent.create({
      data: {
        userId,
        cardKey,
        dimension,
        rating,
        intervalDays: next.intervalDays,
        ratedAt: now,
      },
    })

    // Points are a reward layer on top of scheduling, never a precondition for it: a
    // ledger failure must not cost the learner their review. The schedule and the review
    // event are already committed by this point.
    const totals = award.points
      ? await recordMandarinPoints({
          userId,
          reason: 'recall',
          amount: award.points,
          cardKey,
          note: award.reason,
        })
      : await readMandarinTotals(userId)

    return {
      success: true,
      statusCode: 200,
      message: award.points
        ? `Study rating recorded. +${award.points} points.`
        : 'Study rating recorded.',
      data: {
        awarded: award.points,
        awardReason: award.reason,
        totals,
        cardKey: progress.cardKey,
        dimension: progress.dimension,
        repetitions: progress.repetitions,
        lapses: progress.lapses,
        intervalDays: progress.intervalDays,
        easeFactor: progress.easeFactor,
        dueAt: progress.dueAt.toISOString(),
        lastRating: progress.lastRating,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to record the study rating.',
    }
  }
})

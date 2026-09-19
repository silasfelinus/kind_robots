// /server/api/mandarin/lessons/[key]/complete.post.ts
//
// mandarin-tutor/t-023: records that a learner read a word's lesson through, and pays
// the one-time lesson point for it.
//
// Two distinct events, on purpose. `viewed` is every open of the page and earns nothing;
// `completed` is the learner saying they have read it, and earns MANDARIN_LESSON_POINTS
// exactly once per card, ever. Re-completing is idempotent and pays nothing -- without
// that, the lesson button is a points faucet.
//
// Unlike GET /api/mandarin/lessons/[key], which is public, this needs a session: it is
// learner state.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireApiUser } from '../../../../utils/authGuard'
import { errorHandler } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'
import { MANDARIN_LESSON_POINTS } from '../../../../utils/mandarinPoints'
import {
  readMandarinTotals,
  recordMandarinPoints,
} from '../../../../utils/mandarinPointsLedger'

const MAX_KEY_LENGTH = 255

type RequestBody = {
  /** 'viewed' simply records the open; 'completed' is the one that can earn. */
  state?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id

    const rawKey = getRouterParam(event, 'key') ?? ''
    let cardKey = ''
    try {
      cardKey = decodeURIComponent(rawKey).trim()
    } catch {
      cardKey = rawKey.trim()
    }

    if (!cardKey || cardKey.length > MAX_KEY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid Mandarin card key is required.',
      })
    }

    const body = ((await readBody(event)) ?? {}) as RequestBody
    const requestedState = String(body.state ?? 'completed').trim()
    if (requestedState !== 'completed' && requestedState !== 'viewed') {
      throw createError({
        statusCode: 400,
        statusMessage: 'state must be either "viewed" or "completed".',
      })
    }

    const now = new Date()
    const existing = await prisma.mandarinLessonProgress.findUnique({
      where: { userId_cardKey: { userId, cardKey } },
      select: { completedAt: true },
    })

    // The award is decided from the row as it was BEFORE this write. A learner who has
    // completed this lesson before earns nothing, no matter how many times they press it.
    const earnsPoint = requestedState === 'completed' && !existing?.completedAt

    const progress = await prisma.mandarinLessonProgress.upsert({
      where: { userId_cardKey: { userId, cardKey } },
      create: {
        userId,
        cardKey,
        viewedAt: now,
        views: 1,
        ...(requestedState === 'completed' ? { completedAt: now } : {}),
      },
      update: {
        viewedAt: now,
        views: { increment: 1 },
        // Never overwrite an earlier completedAt: the first time a learner understood
        // this word is the interesting timestamp, not the most recent revisit.
        ...(requestedState === 'completed' && !existing?.completedAt
          ? { completedAt: now }
          : {}),
      },
      select: { cardKey: true, viewedAt: true, completedAt: true, views: true },
    })

    const awarded = earnsPoint ? MANDARIN_LESSON_POINTS : 0
    const totals = earnsPoint
      ? await recordMandarinPoints({
          userId,
          reason: 'lesson',
          amount: MANDARIN_LESSON_POINTS,
          cardKey,
          note: `Read the lesson for ${cardKey} through for the first time.`,
        })
      : await readMandarinTotals(userId)

    return {
      success: true,
      statusCode: 200,
      message: earnsPoint
        ? `Lesson complete. +${MANDARIN_LESSON_POINTS} points.`
        : 'Lesson progress recorded.',
      data: {
        cardKey: progress.cardKey,
        viewedAt: progress.viewedAt.toISOString(),
        completedAt: progress.completedAt?.toISOString() ?? null,
        views: progress.views,
        awarded,
        totals,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to record lesson progress.',
      data: null,
    }
  }
})

// /server/utils/mandarinPointsLedger.ts
//
// mandarin-tutor/t-023: the only place points are written.
//
// server/utils/mandarinPoints.ts decides what an action is WORTH (pure, testable).
// This decides how that value is recorded, and it is deliberately the single writer, so
// there is exactly one code path that can move a balance.
//
// Every award writes two rows inside one transaction: an append-only MandarinPointEvent
// carrying the amount, the resulting balance and the human-readable reason, and an
// updated MandarinLearnerProfile summarising it. Same relationship MandarinCardProgress
// has to MandarinReviewEvent -- the log is the truth, the profile is the fast read.
import { prisma } from './prisma'
import type { MandarinPointReason } from './mandarinPoints'

export type MandarinPointAward = {
  userId: number
  reason: MandarinPointReason
  amount: number
  cardKey?: string | null
  note?: string | null
}

export type MandarinLearnerTotals = {
  totalPoints: number
  lessonsCompleted: number
  recallsEarned: number
}

const ZERO_TOTALS: MandarinLearnerTotals = {
  totalPoints: 0,
  lessonsCompleted: 0,
  recallsEarned: 0,
}

export async function readMandarinTotals(
  userId: number,
): Promise<MandarinLearnerTotals> {
  const profile = await prisma.mandarinLearnerProfile.findUnique({
    where: { userId },
    select: { totalPoints: true, lessonsCompleted: true, recallsEarned: true },
  })
  return profile ?? ZERO_TOTALS
}

/**
 * Record one award and return the learner's new totals.
 *
 * An award of 0 still writes nothing but the counters it belongs to -- a zero-point
 * review is real history the learner may want explained, but writing a ledger row for
 * every failed recall would bloat the log with entries that never move a balance, and
 * MandarinReviewEvent already records that the review happened. So: zero amounts are
 * accepted and simply return current totals unchanged.
 */
export async function recordMandarinPoints(
  award: MandarinPointAward,
): Promise<MandarinLearnerTotals> {
  const amount = Math.trunc(award.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return readMandarinTotals(award.userId)
  }

  const lessonDelta = award.reason === 'lesson' ? 1 : 0
  const recallDelta = award.reason === 'recall' ? 1 : 0

  return prisma.$transaction(async (tx) => {
    // Read inside the transaction so two awards racing (a rating saved while a lesson
    // completion is in flight) cannot both compute balanceAfter from the same stale
    // balance and lose one of them.
    const existing = await tx.mandarinLearnerProfile.findUnique({
      where: { userId: award.userId },
      select: {
        totalPoints: true,
        lessonsCompleted: true,
        recallsEarned: true,
      },
    })
    const current = existing ?? ZERO_TOTALS
    const balanceAfter = current.totalPoints + amount

    const profile = await tx.mandarinLearnerProfile.upsert({
      where: { userId: award.userId },
      create: {
        userId: award.userId,
        totalPoints: balanceAfter,
        lessonsCompleted: lessonDelta,
        recallsEarned: recallDelta,
      },
      update: {
        totalPoints: { increment: amount },
        ...(lessonDelta
          ? { lessonsCompleted: { increment: lessonDelta } }
          : {}),
        ...(recallDelta ? { recallsEarned: { increment: recallDelta } } : {}),
      },
      select: {
        totalPoints: true,
        lessonsCompleted: true,
        recallsEarned: true,
      },
    })

    await tx.mandarinPointEvent.create({
      data: {
        userId: award.userId,
        cardKey: award.cardKey ?? null,
        reason: award.reason,
        amount,
        // The upsert's own return value is authoritative here: `increment` is applied by
        // the database, so it reflects any concurrent award the pre-read missed.
        balanceAfter: profile.totalPoints,
        note: award.note ?? null,
      },
    })

    return profile
  })
}

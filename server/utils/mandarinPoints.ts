// /server/utils/mandarinPoints.ts
//
// mandarin-tutor/t-023: what a Mandarin Tutor point is worth.
//
// Silas chose, in the 2026-09-19 reopening conversation, that points reward "lesson
// comprehension + recall ... weighted by SRS difficulty, so re-drilling an easy card
// earns almost nothing and genuine recall of a lapsed card earns a lot. Rewards
// learning, not clicking." He explicitly did NOT select daily streaks or daily point
// targets -- that is the nagging mechanic his own request rules out ("insistent and
// focused on interactions, notifications, nudges") -- so nothing here counts days.
//
// The whole scoring model is pure and lives in this one file so it can be read, argued
// with, and tested without a database (utils/scripts/verifyMandarinPoints.test.ts). Same
// discipline as server/utils/mandarinSrs.ts, which owns the scheduling half.
//
// THE ANTI-GRINDING RULE IS THE POINT OF THIS FILE. A points system attached to a
// spaced-repetition trainer has one obvious exploit: sit on one easy card and rate it
// "Easy" a hundred times. `dueFactor` closes it by scoring a review against how much of
// its scheduled interval had actually elapsed -- a card drilled the moment after it was
// last rated is worth essentially nothing, no matter what button is pressed. Everything
// else here is a multiplier on top of that.
import type { StudyRating } from '../../stores/mandarinTutorStore'

/** Awarded once, the first time a learner completes a word's lesson page. */
export const MANDARIN_LESSON_POINTS = 10

/**
 * Base value by self-rating, before any difficulty weighting.
 *
 * `hard` beats `good` beats `easy` on purpose, and it is the least obvious number here.
 * A card recalled with effort is a card that was on the edge of being forgotten, and
 * pulling it back is where the learning actually happened. A card that was effortless
 * taught the learner nothing they did not already know, so it pays the least. `again` is
 * a failed recall and pays nothing -- but nothing is ever DEDUCTED, because a system that
 * punishes honesty just teaches people to press "Good" when they did not remember.
 */
const RATING_BASE: Record<StudyRating, number> = {
  again: 0,
  easy: 2,
  good: 4,
  hard: 5,
}

/** The card's scheduling state as it was BEFORE this review was applied. */
export type MandarinPointsCardState = {
  repetitions: number
  intervalDays: number
  lapses: number
  /** null for a card that has never been reviewed. */
  lastReviewedAt: Date | null
}

export const MANDARIN_POINTS_NEW_CARD: MandarinPointsCardState = {
  repetitions: 0,
  intervalDays: 0,
  lapses: 0,
  lastReviewedAt: null,
}

export type MandarinRecallAward = {
  points: number
  /** Human-readable breakdown, surfaced in the ledger note so a score is never a mystery. */
  reason: string
  dueFactor: number
  lapseFactor: number
  maturityFactor: number
}

const MS_PER_DAY = 86_400_000

/**
 * How much of the card's scheduled interval had elapsed, clamped to [0, 1].
 *
 * A brand-new card scores 1: there is no interval to be early against, and a learner's
 * first honest recall of something they just studied should count.
 *
 * Reviewing EARLY scales down linearly -- half the interval elapsed is half the points --
 * which is what makes grinding unprofitable without ever blocking it. Reviewing LATE caps
 * at 1 rather than paying a bonus: coming back to a neglected card is good, but it is not
 * worth more than keeping up, and an uncapped factor would reward abandoning the deck.
 */
export function dueFactor(
  state: MandarinPointsCardState,
  now: Date = new Date(),
): number {
  if (state.repetitions <= 0 || !state.lastReviewedAt) return 1
  if (state.intervalDays <= 0) return 1

  const elapsedDays =
    (now.getTime() - state.lastReviewedAt.getTime()) / MS_PER_DAY
  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) return 0

  return Math.min(1, elapsedDays / state.intervalDays)
}

/**
 * Cards you have forgotten before are worth more when you finally hold onto them.
 * Capped at 3 lapses so a chronically failed card cannot become a points farm.
 */
export function lapseFactor(state: MandarinPointsCardState): number {
  return 1 + Math.min(Math.max(state.lapses, 0), 3) * 0.25
}

/**
 * Recalling something after a month is a stronger result than recalling it after a day.
 * Saturates at 60 days so the curve flattens rather than running away on mature cards.
 */
export function maturityFactor(state: MandarinPointsCardState): number {
  const interval = Math.min(Math.max(state.intervalDays, 0), 60)
  return 1 + (interval / 60) * 0.5
}

export function awardForRecall(
  rating: StudyRating,
  state: MandarinPointsCardState,
  now: Date = new Date(),
): MandarinRecallAward {
  const base = RATING_BASE[rating] ?? 0
  const due = dueFactor(state, now)
  const lapse = lapseFactor(state)
  const maturity = maturityFactor(state)

  if (base <= 0) {
    return {
      points: 0,
      reason:
        'No points for a recall you did not make. Nothing is deducted either -- rating honestly is what makes the schedule work.',
      dueFactor: due,
      lapseFactor: lapse,
      maturityFactor: maturity,
    }
  }

  const raw = base * due * lapse * maturity
  // Round rather than floor, but never round a real recall down to zero on the strength
  // of `due` alone -- a first review of a new card must always be worth something, and a
  // learner who genuinely came back early still did the work.
  const points = Math.max(raw > 0 ? 1 : 0, Math.round(raw))

  const parts: string[] = [`${rating} recall (base ${base})`]
  if (due < 0.995) {
    parts.push(
      `reviewed early, ${Math.round(due * 100)}% of the ${state.intervalDays}-day interval elapsed`,
    )
  }
  if (lapse > 1) {
    parts.push(`previously forgotten ${state.lapses}x (x${lapse.toFixed(2)})`)
  }
  if (maturity > 1.005) {
    parts.push(`${state.intervalDays}-day interval (x${maturity.toFixed(2)})`)
  }

  return {
    points,
    reason: parts.join(' · '),
    dueFactor: due,
    lapseFactor: lapse,
    maturityFactor: maturity,
  }
}

/** Ledger reasons. Kept short and stable -- they are stored in a VARCHAR(32) column. */
export const MANDARIN_POINT_REASONS = {
  lesson: 'lesson',
  recall: 'recall',
} as const

export type MandarinPointReason =
  (typeof MANDARIN_POINT_REASONS)[keyof typeof MANDARIN_POINT_REASONS]

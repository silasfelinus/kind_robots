// /server/utils/mandarinSrs.ts
//
// mandarin-tutor/t-015: a simple, inspectable spaced-repetition scheduler for the
// Mandarin Tutor Study loop's four-button self-rating (Again/Hard/Good/Easy), per the
// task's own note ("a simple inspectable spaced-repetition model -- e.g. Leitner or a
// basic SM-2 variant, not a black box"). This is the well-known SM-2 algorithm (SuperMemo
// 2), the same scheduling shape Anki's default algorithm was originally derived from --
// not a novel invention, and every step is a plain arithmetic rule a person can check by
// hand.
//
// Pure functions only -- no prisma, no Nuxt/H3 runtime. Callers (the API endpoints) own
// reading/writing MandarinCardProgress and MandarinReviewEvent; this file owns the math.
import type { StudyRating } from '../../stores/mandarinTutorStore'

export type MandarinSrsState = {
  repetitions: number
  intervalDays: number
  easeFactor: number
}

export type MandarinSrsResult = MandarinSrsState & {
  dueAt: Date
  lapsed: boolean
}

export const MANDARIN_SRS_INITIAL_STATE: MandarinSrsState = {
  repetitions: 0,
  intervalDays: 0,
  easeFactor: 2.5,
}

const MIN_EASE_FACTOR = 1.3

// SM-2's quality scale is 0-5. The Study loop's four buttons map onto it as: a failed
// recall (Again) is well below the "correct" threshold of 3; the other three are all
// "correct, with decreasing friction" grades.
const RATING_QUALITY: Record<StudyRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

/**
 * Computes the next SM-2 schedule from the current state and a self-rating.
 *
 * On a failed recall (quality < 3, i.e. "again"): repetitions resets to 0, the interval
 * drops back to 1 day, and the ease factor takes the usual SM-2 penalty (floored at
 * MIN_EASE_FACTOR so a rough patch never turns into an ever-shrinking spiral).
 *
 * On a successful recall: repetitions increments, the interval grows (1 day -> 6 days ->
 * previous interval * ease factor), and the ease factor adjusts by SM-2's standard
 * formula -- higher for "easy", essentially flat for "good", and a small penalty for
 * "hard" even though it still counts as a pass.
 */
export function nextMandarinSrsSchedule(
  current: MandarinSrsState,
  rating: StudyRating,
  now: Date = new Date(),
): MandarinSrsResult {
  const quality = RATING_QUALITY[rating]
  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  const nextEase = Math.max(MIN_EASE_FACTOR, current.easeFactor + easeDelta)

  if (quality < 3) {
    return {
      repetitions: 0,
      intervalDays: 1,
      easeFactor: nextEase,
      dueAt: addDays(now, 1),
      lapsed: true,
    }
  }

  const repetitions = current.repetitions + 1
  let intervalDays: number
  if (repetitions === 1) intervalDays = 1
  else if (repetitions === 2) intervalDays = 6
  else intervalDays = Math.max(1, Math.round(current.intervalDays * nextEase))

  return {
    repetitions,
    intervalDays,
    easeFactor: nextEase,
    dueAt: addDays(now, intervalDays),
    lapsed: false,
  }
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export type MandarinReviewEventLite = {
  cardKey: string
  rating: string
  ratedAt: Date
}

export type MandarinProgressLite = {
  cardKey: string
  dueAt: Date
  repetitions: number
  lapses: number
  lastRating: string | null
}

export type MandarinStudyDiagnostics = {
  totalTracked: number
  dueCount: number
  retentionRate: number | null
  weakCardKeys: string[]
}

const RETENTION_WINDOW = 30
const WEAK_CARD_LIMIT = 10

/**
 * Summarizes study diagnostics from a user's progress rows and recent review events:
 * how many cards are tracked at all, how many are due right now, a rolling retention
 * rate (share of the most recent RETENTION_WINDOW reviews that were NOT "again"), and
 * the weakest cards (most lapses, ties broken by lowest ease via repetitions as a proxy)
 * worth extra attention.
 */
export function summarizeMandarinStudyDiagnostics(
  progress: MandarinProgressLite[],
  recentEvents: MandarinReviewEventLite[],
  now: Date = new Date(),
): MandarinStudyDiagnostics {
  const dueCount = progress.filter(
    (row) => row.dueAt.getTime() <= now.getTime(),
  ).length

  const window = recentEvents.slice(0, RETENTION_WINDOW)
  const retentionRate = window.length
    ? window.filter((event) => event.rating !== 'again').length / window.length
    : null

  const weakCardKeys = [...progress]
    .filter((row) => row.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses || a.repetitions - b.repetitions)
    .slice(0, WEAK_CARD_LIMIT)
    .map((row) => row.cardKey)

  return {
    totalTracked: progress.length,
    dueCount,
    retentionRate,
    weakCardKeys,
  }
}

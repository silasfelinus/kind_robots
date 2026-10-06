// /utils/arcade/leaderboard.ts
//
// Global leaderboard helpers shared by the arcade store, the hall and the
// contract test (conductor kr-arcade). Pure: no storage, no network.

/** A score that could not reach the server yet; it waits in this browser. */
export type PendingArcadeScore = {
  /** Negative, so it never collides with a server row id. */
  id: number
  game: string
  initials: string
  score: number
  level: number
  createdAt: string
}

/** One cabinet's slice of the hall of fame. */
export type HallOfFameEntry = {
  slug: string
  top: Array<{ initials: string; score: number; level: number }>
  todayBest: { initials: string; score: number } | null
  plays: number
}

/** Most pending scores kept per browser; the oldest drop off first. */
export const MAX_PENDING_SCORES = 25

/** Uploads per flush: stays under the server's 6-per-minute rate limit. */
export const PENDING_FLUSH_BATCH = 5

/**
 * Should a failed submission wait and retry? Yes when the server could not be
 * reached or was busy (no status, 408, 429, 5xx); no when it answered and
 * rejected the score (400, 404, 422...), which retrying would never change.
 */
export function shouldRetryScore(status: number | undefined): boolean {
  if (status === undefined || status === 0) return true
  if (status === 408 || status === 429) return true
  return status >= 500
}

/** Add a score to the pending queue, newest last, capped. */
export function enqueuePending(
  queue: PendingArcadeScore[],
  entry: PendingArcadeScore,
): PendingArcadeScore[] {
  const next = [...queue.filter((row) => row.id !== entry.id), entry]
  return next.slice(-MAX_PENDING_SCORES)
}

/** Keep only well-formed pending rows (storage can hold anything). */
export function sanitizePending(value: unknown): PendingArcadeScore[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (row): row is PendingArcadeScore =>
        !!row &&
        typeof row === 'object' &&
        typeof (row as PendingArcadeScore).id === 'number' &&
        typeof (row as PendingArcadeScore).game === 'string' &&
        typeof (row as PendingArcadeScore).initials === 'string' &&
        typeof (row as PendingArcadeScore).score === 'number' &&
        typeof (row as PendingArcadeScore).level === 'number' &&
        typeof (row as PendingArcadeScore).createdAt === 'string',
    )
    .slice(-MAX_PENDING_SCORES)
}

/** "1,234" style score with the initials, for compact hall labels. */
export function formatChampion(
  entry: { initials: string; score: number } | null | undefined,
): string {
  return entry ? `${entry.initials} ${entry.score.toLocaleString('en-US')}` : ''
}

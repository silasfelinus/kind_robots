// /server/utils/arcadeScores.ts
//
// Kind Robots Arcade leaderboard helpers (conductor kr-arcade/t-005). It is a
// hobby leaderboard: submissions are checked for plausibility (known game,
// allowed initials, score under the game's ceiling, a per-IP rate limit), not
// for cheating.

import { createError } from 'h3'
import prisma from './prisma'
import { findArcadeGame, isPlausibleScore } from '~/utils/arcade/games'
import { isAllowedInitials } from '~/utils/arcade/initials'

export const ARCADE_BOARD_SIZE = 10
export type ArcadeScoreRange = 'all' | 'today'

export type ArcadeBoardRow = {
  id: number
  initials: string
  score: number
  level: number
  createdAt: string
}

export type ArcadeScoreSubmission = {
  game: string
  initials: string
  score: number
  level: number
}

export function parseArcadeRange(value: unknown): ArcadeScoreRange {
  return value === 'today' ? 'today' : 'all'
}

/** Start of the current UTC day; "today" boards reset at UTC midnight. */
export function arcadeDayStart(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
}

/** Validate a POST body; returns the clean submission or a 400 message. */
export function parseArcadeSubmission(
  body: unknown,
): { ok: true; value: ArcadeScoreSubmission } | { ok: false; message: string } {
  const raw = (body ?? {}) as Record<string, unknown>
  const game = typeof raw.game === 'string' ? raw.game : ''
  if (!findArcadeGame(game)) return { ok: false, message: 'Unknown game.' }
  const initials =
    typeof raw.initials === 'string' ? raw.initials.toUpperCase() : ''
  if (!isAllowedInitials(initials)) {
    return { ok: false, message: 'Initials must be three letters or digits.' }
  }
  if (!isPlausibleScore(game, raw.score)) {
    return { ok: false, message: 'That score is not possible.' }
  }
  const level = Number(raw.level)
  return {
    ok: true,
    value: {
      game,
      initials,
      score: raw.score as number,
      level: Number.isInteger(level) && level > 0 && level < 10_000 ? level : 1,
    },
  }
}

// Sliding window per client IP, in memory (one server process).
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 6
const submissions = new Map<string, number[]>()

export function enforceArcadeScoreRateLimit(key: string, now = Date.now()) {
  const recent = (submissions.get(key) ?? []).filter(
    (at) => now - at < WINDOW_MS,
  )
  if (recent.length >= MAX_PER_WINDOW) {
    throw createError({
      statusCode: 429,
      message: 'Too many scores at once. Take a breather and try again.',
    })
  }
  recent.push(now)
  submissions.set(key, recent)
  if (submissions.size > 5000) {
    for (const [ip, times] of submissions) {
      if (!times.some((at) => now - at < WINDOW_MS)) submissions.delete(ip)
    }
  }
}

export async function readArcadeBoard(
  game: string,
  range: ArcadeScoreRange,
): Promise<ArcadeBoardRow[]> {
  const rows = await prisma.arcadeScore.findMany({
    where: {
      gameSlug: game,
      ...(range === 'today' ? { createdAt: { gte: arcadeDayStart() } } : {}),
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take: ARCADE_BOARD_SIZE,
    select: {
      id: true,
      initials: true,
      score: true,
      level: true,
      createdAt: true,
    },
  })
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }))
}

/** 1-based all-time rank of a score (ties go to the earlier entry). */
export async function arcadeRankOf(
  game: string,
  score: number,
): Promise<number> {
  const better = await prisma.arcadeScore.count({
    where: { gameSlug: game, score: { gt: score } },
  })
  return better + 1
}

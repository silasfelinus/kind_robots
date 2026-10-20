// /utils/arcade/seedLander/modes.ts
//
// Seed Lander's side modes (conductor kr-arcade/t-073): the Daily Hill (one island seeded from the
// date, the same for everyone that day), per-mission Time Trial after a clear, and the mastery
// ladder that turns everything earned into a rank. All pure: the game supplies the date and its
// saved progress, and a stored value is untrusted, so the readers clamp and drop junk.

import { mulberry32 } from '../curve'
import { ISLANDS } from './islands'
import { freeHill } from './missions'
import type { MissionSpec } from './missions'

/** A date as `YYYY-MM-DD` (the player's local day). */
export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
export function isDateKey(v: unknown): v is string {
  return typeof v === 'string' && DATE_KEY.test(v)
}

/** A stable 32-bit hash of the day (FNV-1a), the Daily Hill's seed. */
export function dailySeed(key: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Daily hills run from DAILY_MIN up to DAILY_MIN + DAILY_SPAN - 1, so every day has hazards. */
export const DAILY_MIN = 4
export const DAILY_SPAN = 13

/** Which Free Flight hill the day's island is built to. */
export function dailyHillNumber(key: string): number {
  return DAILY_MIN + (dailySeed(key) % DAILY_SPAN)
}

/** The Daily Hill: the same island and the same wind for a given day, whoever flies it. */
export function dailyHill(key: string): MissionSpec {
  const spec = freeHill(dailyHillNumber(key), mulberry32(dailySeed(key)))
  return { ...spec, id: `daily-${key}`, name: `DAILY ${key.slice(5)}` }
}

/** Seconds as m:ss for a tick count at 60 Hz. */
export function clock(ticks: number): string {
  const s = Math.ceil(ticks / 60)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export type TrialMedal = 'gold' | 'silver' | 'bronze'
/** A Time Trial finish against the mission's par: gold well under it, silver under, bronze over. */
export function trialMedal(ticks: number, parTicks: number): TrialMedal {
  return ticks <= parTicks * 0.8
    ? 'gold'
    : ticks <= parTicks
      ? 'silver'
      : 'bronze'
}

export const TRIAL_MAX_TICKS = 60 * 60 * 30

/** A saved best-times table checked field by field: ids and tick counts that make sense only. */
export function readTrials(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, t] of Object.entries(raw)) {
    if (!/^[a-z0-9-]{1,32}$/.test(id)) continue
    if (typeof t !== 'number' || !Number.isInteger(t)) continue
    if (t < 1 || t > TRIAL_MAX_TICKS) continue
    out[id] = t
    if (Object.keys(out).length >= 64) break
  }
  return out
}

/** The best Daily Hill score on a day. */
export type DailyBest = { date: string; score: number }
export function readDaily(raw: unknown): DailyBest | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Record<string, unknown>
  if (!isDateKey(r.date)) return undefined
  if (
    typeof r.score !== 'number' ||
    !Number.isInteger(r.score) ||
    r.score < 0 ||
    r.score > 249_999_999
  )
    return undefined
  return { date: r.date, score: r.score }
}

/** Missions that can be raced: any whose medals show it has been cleared, in campaign order. */
export function trialMissions(
  medals: Readonly<Record<string, number>>,
): MissionSpec[] {
  return ISLANDS.flatMap((i) => i.missions).filter((m) => m.id in medals)
}

export type Rank = { name: string; from: number }
export const RANKS: readonly Rank[] = [
  { name: 'SEEDLING', from: 0 },
  { name: 'SPROUT', from: 6 },
  { name: 'SAPLING', from: 20 },
  { name: 'GARDENER', from: 45 },
  { name: 'GROVE KEEPER', from: 80 },
  { name: 'SKY WARDEN', from: 120 },
]

export type Progress = {
  /** Medal bits by mission id. */
  medals: Readonly<Record<string, number>>
  /** Golden acorns found. */
  acorns: number
  /** Islands whose boss has fallen. */
  cleared: number
  bestHill: number
  /** Time Trial best times by mission id. */
  trials: Readonly<Record<string, number>>
}

/** Mastery points: medals, acorns, replanted islands, Free Flight depth and trial bests. */
export function masteryPoints(p: Progress): number {
  let medals = 0
  for (const bits of Object.values(p.medals))
    medals += (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
  return (
    medals +
    p.acorns * 2 +
    p.cleared * 4 +
    Math.floor(p.bestHill / 4) +
    Object.keys(p.trials).length
  )
}

/** The rank a point total earns, and how many points to the next one (null at the top). */
export function masteryRank(points: number): {
  rank: Rank
  next: number | null
} {
  let rank = RANKS[0]!
  for (const r of RANKS) if (points >= r.from) rank = r
  const next = RANKS.find((r) => r.from > points)
  return { rank, next: next ? next.from - points : null }
}

// /utils/arcade/mastery.ts
//
// Mastery goals (conductor kind-pinball/t-014): a cabinet may carry a ladder
// of challenges, each earned once and kept for good. The game says which it
// earned in a play; the arcade store keeps each player's set on this device
// (by game slug) and hands it back at the next start, so a goal is announced
// only the first time. These helpers are the store's pure half.

import type { ArcadeMasteryGoal } from './types'

export const MASTERY_KEY = 'kr-arcade-mastery'

/** Earned goal ids by game slug, as kept in this browser. */
export type MasteryRecord = Record<string, string[]>

const ID = /^[a-z0-9-]{1,40}$/

/** Whatever was stored, reduced to slugs mapped to lists of goal ids. */
export function sanitizeMastery(raw: unknown): MasteryRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const record: MasteryRecord = {}
  for (const [game, ids] of Object.entries(raw)) {
    if (!ID.test(game) || !Array.isArray(ids)) continue
    const kept = ids.filter((id): id is string => typeof id === 'string')
    record[game] = [...new Set(kept.filter((id) => ID.test(id)))]
  }
  return record
}

/** `record` with `ids` added to the game's earned set (order kept, no repeats). */
export function mergeMastery(
  record: MasteryRecord,
  game: string,
  ids: readonly string[],
): MasteryRecord {
  const earned = record[game] ?? []
  const added = ids.filter((id, i) => ID.test(id) && ids.indexOf(id) === i)
  const fresh = added.filter((id) => !earned.includes(id))
  if (!fresh.length) return record
  return { ...record, [game]: [...earned, ...fresh] }
}

/** Ladder goals whose parts are now all earned, and that are not yet. */
export function partsComplete(
  ladder: readonly ArcadeMasteryGoal[],
  earned: ReadonlySet<string>,
): string[] {
  return ladder
    .filter((g) => g.parts?.length && !earned.has(g.id))
    .filter((g) => g.parts!.every((part) => earned.has(part)))
    .map((g) => g.id)
}

/** A player's place on a ladder: how many earned, and the next to go for. */
export function masteryProgress(
  ladder: readonly ArcadeMasteryGoal[],
  earned: Iterable<string>,
): { earned: number; total: number; next: ArcadeMasteryGoal | null } {
  const have = new Set(earned)
  return {
    earned: ladder.filter((g) => have.has(g.id)).length,
    total: ladder.length,
    next: ladder.find((g) => !have.has(g.id)) ?? null,
  }
}

/**
 * How a ladder rung reads on the attract page: an earned goal by its title, an
 * open one with what to do, and an open secret as question marks, so the
 * guide never gives a hidden feature away.
 */
export function masteryLine(
  goal: ArcadeMasteryGoal,
  earned: ReadonlySet<string>,
): string {
  if (earned.has(goal.id)) return goal.title
  if (goal.secret) return '???'
  const parts = goal.parts
  const sofar = parts
    ? ` ${parts.filter((p) => earned.has(p)).length}/${parts.length}`
    : ''
  return `${goal.title} - ${goal.hint}${sofar}`
}

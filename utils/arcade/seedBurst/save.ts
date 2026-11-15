// /utils/arcade/seedBurst/save.ts
//
// Seed Burst's saved run (utils/arcade/saves.ts, conductor kr-arcade/t-137): progress saves at the
// start of each season. A save holds the season to resume, the score, spares, seeds and pouch the
// gardeners started it with, a golden-seed hint bought in the Potting Shed, and what is kept for
// good whatever happens next: the plots whose golden seed has been found. The game owns the shape
// and checks it on the way back in; anything it doesn't recognise is dropped.

import { PLOTS } from './plots'
import { VARIETIES } from './pouch'
import type { Variety } from './pouch'

export type SeedSave = {
  v: 1
  /** Seasons completed before the one to resume (laps included). */
  season: number
  score: number
  spares: number
  /** Seeds to spend in the Potting Shed. */
  seeds: number
  /** The varieties every gardener starts the season with. */
  pouch: Variety[]
  /** Plot ids whose golden seed has been found (kept even after a game over). */
  golden: string[]
  /** A golden-seed hint bought for this season. */
  hint: boolean
  /** The run ended in a game over: a continue keeps the season, never the score. */
  continued: boolean
}

export const MAX_SAVED_SPARES = 9
export const MAX_SEEDS = 9_999

const count = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/** A stored save, checked against this build; null when unusable. */
export function readSeedSave(raw: unknown): SeedSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  if (!count(r.season, 999) || !count(r.score, 1_999_999)) return null
  const known = new Set(PLOTS.map((p) => p.id))
  const golden = Array.isArray(r.golden)
    ? [
        ...new Set(
          r.golden.filter(
            (g): g is string => typeof g === 'string' && known.has(g),
          ),
        ),
      ]
    : []
  const pouch = Array.isArray(r.pouch)
    ? VARIETIES.filter((v) => (r.pouch as unknown[]).includes(v))
    : []
  return {
    v: 1,
    season: r.season as number,
    score: r.score as number,
    spares: count(r.spares, MAX_SAVED_SPARES) ? (r.spares as number) : 2,
    seeds: count(r.seeds, MAX_SEEDS) ? (r.seeds as number) : 0,
    pouch: pouch.includes('sunflower') ? pouch : ['sunflower', ...pouch],
    golden,
    hint: r.hint === true,
    continued: r.continued === true,
  }
}

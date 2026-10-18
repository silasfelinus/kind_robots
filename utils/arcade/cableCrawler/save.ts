// /utils/arcade/cableCrawler/save.ts
//
// Cable Crawler's saved run (utils/arcade/saves.ts, conductor kr-arcade/t-064 on): the component
// the run reached, with the score, spare cables and Workbench kit it started that component with,
// and what is kept for good whatever happens next: the golden bytes found. Beating a boss saves
// at once, pointing at the Workbench before the next component, so a quit there loses nothing.
// The game owns the shape and checks it on the way back in; anything it doesn't recognise is
// dropped.

import { BIOS, BYTE_MAZES } from './components'
import { MEDALS } from './medals'
import { CABLE_COLOURS, MAX_INSULATION } from './workbench'

export type CableSave = {
  v: 1
  /** The campaign index of the component to resume at the start of. */
  comp: number
  score: number
  lives: number
  /** The run ended in a game over: a continue keeps the component, never the score. */
  continued: boolean
  /** Maze ids whose golden byte has been found. */
  bytes: string[]
  /** Maze medals earned, as `mazeId:medal`. */
  medals?: string[]
  /** How many components the campaign has reached. */
  reached: number
  /** The Workbench kit: copper, the long surge, insulation, cable colour, the byte finder. */
  copper?: number
  reach?: number
  insulation?: number
  colour?: number
  finder?: boolean
  /** Resume at the Workbench before component `comp` (the boss before it was just beaten). */
  bench?: boolean
  /** Maze ids cleared in any mode: the Maze Trials it opens. */
  cleared?: string[]
  /** Best Maze Trial time per maze id, in ticks. */
  best?: Record<string, number>
}

/** Earned spares fit the existing save domain; Workbench purchases stop separately at nine. */
export const MAX_SAVED_LIVES = 99

const count = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/** A stored save, checked against this build; null when unusable. */
export function readCableSave(raw: unknown): CableSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  if (!count(r.comp, 999) || !count(r.score, 249_999_999)) return null
  if (!count(r.lives, MAX_SAVED_LIVES)) return null
  const known = new Set(BYTE_MAZES)
  const bytes = Array.isArray(r.bytes)
    ? [
        ...new Set(
          r.bytes.filter(
            (b): b is string => typeof b === 'string' && known.has(b),
          ),
        ),
      ]
    : []
  const medalIds = new Set(
    [...BYTE_MAZES, ...BIOS.mazes.map((m) => m.id)].flatMap((id) =>
      MEDALS.map((m) => `${id}:${m}`),
    ),
  )
  const medals = Array.isArray(r.medals)
    ? [
        ...new Set(
          r.medals.filter(
            (m): m is string => typeof m === 'string' && medalIds.has(m),
          ),
        ),
      ]
    : []
  const mazeIds = new Set([...BYTE_MAZES, ...BIOS.mazes.map((m) => m.id)])
  const cleared = Array.isArray(r.cleared)
    ? [
        ...new Set(
          r.cleared.filter(
            (m): m is string => typeof m === 'string' && mazeIds.has(m),
          ),
        ),
      ]
    : []
  const best: Record<string, number> = {}
  if (r.best && typeof r.best === 'object' && !Array.isArray(r.best))
    for (const [id, t] of Object.entries(r.best as Record<string, unknown>))
      if (mazeIds.has(id) && count(t, 60 * 3600)) best[id] = t as number
  const num = (v: unknown, max: number) => (count(v, max) ? (v as number) : 0)
  return {
    v: 1,
    comp: r.comp as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    continued: r.continued === true,
    bytes,
    medals,
    reached: count(r.reached, 999) ? Math.max(1, r.reached as number) : 1,
    copper: num(r.copper, 9999),
    reach: num(r.reach, 1),
    insulation: num(r.insulation, MAX_INSULATION),
    colour: num(r.colour, CABLE_COLOURS - 1),
    finder: r.finder === true,
    bench: r.bench === true && (r.comp as number) > 0,
    cleared,
    best,
  }
}

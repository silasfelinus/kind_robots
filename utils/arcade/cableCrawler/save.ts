// /utils/arcade/cableCrawler/save.ts
//
// Cable Crawler's saved run (utils/arcade/saves.ts, conductor kr-arcade/t-064): the component the
// run reached, with the score and spare cables it started that component with, and what is kept
// for good whatever happens next: the golden bytes found. The game owns the shape and checks it
// on the way back in; anything it doesn't recognise is dropped.

import { BYTE_MAZES } from './components'

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
  /** How many components the campaign has reached. */
  reached: number
}

const count = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/** A stored save, checked against this build; null when unusable. */
export function readCableSave(raw: unknown): CableSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  if (!count(r.comp, 999) || !count(r.score, 249_999_999)) return null
  if (!count(r.lives, 99)) return null
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
  return {
    v: 1,
    comp: r.comp as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    continued: r.continued === true,
    bytes,
    reached: count(r.reached, 999) ? Math.max(1, r.reached as number) : 1,
  }
}

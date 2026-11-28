// /utils/arcade/games/glitchGardenSave.ts
//
// Glitch Garden's save (conductor kr-arcade/t-089, through utils/arcade/saves.ts): how many
// gardens the player has reached (for the garden select), the golden trowels earned, and the run
// in progress, resumed at the start of the garden it was in. Untrusted on the way in: anything
// that doesn't read cleanly is dropped.

import { GARDENS, MIDNIGHT_INDEX, hasAllTrowels } from './glitchGardenGardens'
import { MAX_KIT_CANS, NEW_KIT } from './glitchGardenShed'
import type { Kit } from './glitchGardenShed'

export type GardenRun = {
  /** The garden (index into GARDENS) to resume at the start of. */
  garden: number
  lap: number
  score: number
  lives: number
  petals: number
  kit: Kit
}

export type GardenSave = {
  v: 1
  /** Gardens reached on any run (1 to GARDENS.length): the garden select offers this many. */
  reached: number
  /** Garden ids whose golden trowel has been earned. */
  trowels: string[]
  run: GardenRun | null
  champion?: boolean
  trueChampion?: boolean
}

export const MAX_SAVED_LIVES = 99
export const MAX_SAVED_LAP = 99

const whole = (n: unknown, max: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max

function readKit(raw: unknown): Kit {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return NEW_KIT
  const k = raw as Record<string, unknown>
  return {
    nozzle: k.nozzle === true,
    twin: k.twin === true,
    siren: k.siren === true,
    prismLane: whole(k.prismLane, 29) ? k.prismLane : null,
    cans: whole(k.cans, MAX_KIT_CANS) ? k.cans : 0,
  }
}

function readRun(raw: unknown, midnight: boolean): GardenRun | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (!whole(r.garden, midnight ? MIDNIGHT_INDEX : GARDENS.length - 1))
    return null
  if (!whole(r.lap, MAX_SAVED_LAP) || !whole(r.score, 99_999_999)) return null
  if (!whole(r.lives, MAX_SAVED_LIVES) || r.lives < 1) return null
  if (!whole(r.petals, 99_999)) return null
  return {
    garden: r.garden,
    lap: r.lap,
    score: r.score,
    lives: r.lives,
    petals: r.petals,
    kit: readKit(r.kit),
  }
}

export function readGardenSave(raw: unknown): GardenSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1 || !whole(r.reached, GARDENS.length) || r.reached < 1)
    return null
  const known = new Set(GARDENS.map((g) => g.id))
  const trowels = Array.isArray(r.trowels)
    ? [
        ...new Set(
          r.trowels.filter(
            (t): t is string => typeof t === 'string' && known.has(t),
          ),
        ),
      ]
    : []
  const midnight = hasAllTrowels(new Set(trowels))
  return {
    v: 1,
    reached: r.reached,
    trowels,
    run: readRun(r.run, midnight),
    ...(r.champion === true || (r.trueChampion === true && midnight)
      ? { champion: true }
      : {}),
    ...(r.trueChampion === true && midnight ? { trueChampion: true } : {}),
  }
}

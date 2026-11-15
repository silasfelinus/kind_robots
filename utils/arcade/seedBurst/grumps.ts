// /utils/arcade/seedBurst/grumps.ts
//
// Seed Burst's grumps (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24, slice 1).
// Every grump asks the gardeners a different question, and each one with a move shows a tell
// first. The table holds pace and points; the helpers are the pure rules the cabinet calls.
//
//   Grumpy gnat    wanders.
//   Drifter gnat   drifts through hedges, glowing purple.
//   Sniffer gnat   follows the nearest gardener at junctions.
//   Sulky slug     slow in its shell; the first bloom knocks the shell off and the bare slug hurries.
//                  Leaves slime that slows gardeners. Two blooms in a row.
//   Burrow mole    tunnels under the board and surfaces beside the nearest gardener. Tell: its
//                  mound wobbles for a second. Plant on the mound before it pops up.
//   Hedge hopper   hops one hedge in a straight line. Tell: it crouches and winds its legs, and a
//                  shadow ring marks the landing tile. Bloom the landing tile.
//   Buzz bully     charges at double speed down a clear lane at a gardener. Tell: antennae spark
//                  and a "!". Step out of line, or bait it into a waiting pod.
//   Seed thief     runs to pods and pickups and carries them to the compost heap. Bloom it to
//                  drop the loot, with a bonus.
//   Puffball       a bloom bursts it into four spore gnats. Pre-plant so the spores land in a
//                  second burst.

import type { GrumpKind } from './plots'

export type GrumpInfo = {
  name: string
  /** Pace as a share of the plot's grump speed. */
  pace: number
  /** Multiplies the bloom chain's points. */
  worth: number
  /** Drifts through hedges. */
  ghost?: boolean
}

export const GRUMPS: Record<GrumpKind, GrumpInfo> = {
  gnat: { name: 'GRUMPY GNAT', pace: 1, worth: 1 },
  drifter: { name: 'DRIFTER GNAT', pace: 0.8, worth: 1, ghost: true },
  sniffer: { name: 'SNIFFER GNAT', pace: 0.9, worth: 1 },
  slug: { name: 'SULKY SLUG', pace: 0.55, worth: 2 },
  mole: { name: 'BURROW MOLE', pace: 0.9, worth: 2 },
  hopper: { name: 'HEDGE HOPPER', pace: 0.95, worth: 2 },
  bully: { name: 'BUZZ BULLY', pace: 0.85, worth: 2 },
  thief: { name: 'SEED THIEF', pace: 1.05, worth: 2 },
  puffball: { name: 'PUFFBALL', pace: 0.75, worth: 2 },
  spore: { name: 'SPORE GNAT', pace: 1.25, worth: 1 },
}

/** A slug out of its shell hurries at this share of the plot's speed. */
export const BARE_SLUG_PACE = 1.5
/** Ticks a slug's slime stays on a tile, and the pace a gardener keeps on it. */
export const SLIME_TICKS = 240
export const SLIME_PACE = 0.6

/** Mole timings: up and about, digging down (a tell), tunnelling, the wobbling mound (a tell). */
export const MOLE_UP = 240
export const MOLE_DIG = 30
export const MOLE_UNDER = 150
export const MOLE_WOBBLE = 60

/** Hopper timings: the crouch (a tell), the hop, and the rest before it hops again. */
export const HOP_CROUCH = 40
export const HOP_AIR = 24
export const HOP_REST = 150

/** Bully timings and reach: the spark (a tell), its charge pace, its rest, how far it sees. */
export const BULLY_SPARK = 36
export const BULLY_CHARGE_PACE = 2.2
export const BULLY_REST = 150
export const BULLY_SIGHT = 7

/** How long the compost heap rumbles before the bell's grumps climb out, and their spacing. */
export const BELL_RUMBLE = 60
export const BELL_GAP = 24
/** The bell rings this many times in one plot at most. */
export const BELL_MAX = 2

export type Tile = { x: number; y: number }
export type Step = { dx: number; dy: number }

const DIRS: readonly Step[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]

/**
 * The way a bully at `from` would charge: the first direction with a gardener in a clear straight
 * lane within BULLY_SIGHT tiles, or null. `clear` says whether a tile can be charged across.
 */
export function chargeLane(
  from: Tile,
  gardeners: readonly Tile[],
  clear: (x: number, y: number) => boolean,
): Step | null {
  for (const d of DIRS)
    for (let r = 1; r <= BULLY_SIGHT; r++) {
      const x = from.x + d.dx * r
      const y = from.y + d.dy * r
      if (!clear(x, y)) break
      if (gardeners.some((g) => g.x === x && g.y === y)) return d
    }
  return null
}

/**
 * Where a hopper at `from` facing `dir` would land: two tiles on, when the tile in between is a
 * hedge and the landing tile is open. Null when there is nothing to hop.
 */
export function hopLanding(
  from: Tile,
  dir: Step,
  look: (x: number, y: number) => 'hedge' | 'open' | 'blocked',
): Tile | null {
  if (look(from.x + dir.dx, from.y + dir.dy) !== 'hedge') return null
  const land = { x: from.x + dir.dx * 2, y: from.y + dir.dy * 2 }
  return look(land.x, land.y) === 'open' ? land : null
}

/**
 * Where a mole surfaces near `target`: an open tile two steps away if there is one (three if not),
 * never on a gardener. `roll` (0..1) picks among the candidates.
 */
export function moundSpot(
  target: Tile,
  open: (x: number, y: number) => boolean,
  roll: number,
): Tile | null {
  for (const ring of [2, 3]) {
    const spots: Tile[] = []
    for (let dy = -ring; dy <= ring; dy++)
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== ring) continue
        if (open(target.x + dx, target.y + dy))
          spots.push({ x: target.x + dx, y: target.y + dy })
      }
    if (spots.length)
      return spots[Math.min(spots.length - 1, Math.floor(roll * spots.length))]!
  }
  return null
}

/**
 * The step from `from` that closes the most distance to `goal` among `options` (ties keep the
 * option order). Used by thieves heading for loot and home.
 */
export function stepToward(
  from: Tile,
  goal: Tile,
  options: readonly Step[],
): Step | null {
  let best: Step | null = null
  let bestDistance = Infinity
  for (const o of options) {
    const d =
      Math.abs(from.x + o.dx - goal.x) + Math.abs(from.y + o.dy - goal.y)
    if (d < bestDistance) {
      best = o
      bestDistance = d
    }
  }
  return best
}

/** Whether a grump of this kind in this phase can be bloomed. */
export function bloomable(kind: GrumpKind, phase: GrumpPhase): boolean {
  if (kind === 'mole')
    return phase === 'walk' || phase === 'tell' || phase === 'mound'
  if (kind === 'hopper') return phase !== 'air'
  return true
}

/** Whether a grump of this kind in this phase bonks a gardener it touches. */
export function touches(kind: GrumpKind, phase: GrumpPhase): boolean {
  if (kind === 'mole') return phase === 'walk' || phase === 'tell'
  if (kind === 'hopper') return phase !== 'air'
  return true
}

/**
 * A grump's phase: walking about; showing its tell (a mole digging, a hopper crouching, a bully
 * sparking); a hopper in the air; a bully charging; a mole tunnelling; a mole's wobbling mound.
 */
export type GrumpPhase = 'walk' | 'tell' | 'air' | 'charge' | 'under' | 'mound'

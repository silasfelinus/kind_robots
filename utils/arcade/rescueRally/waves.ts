// /utils/arcade/rescueRally/waves.ts
//
// Rescue Rally's waves as data (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "Waves
// are data-defined scripts"). Every wave is a script: which foes, how many, where they come in (the
// edges, the corners, a ring round the hero, or late through the wall vents), the pylon shapes on the
// floor, where the family waits and where the beacon pad sits. The game only plays what is written.
//
// Slice 1 writes sixteen waves in two runs of eight, the first drafts of the Neon Plaza and the Toy
// Factory: each run opens on its new foes, plays its signature wave third (the Pylon Garden, then
// the Hypno wave), remixes, and closes on a big wave. After the last one the rally loops, every
// group a quarter bigger each time round, and the foe curves (roster.ts) keep climbing.
//
// Card text is drawn in the arcade's pixel font: capitals, digits and . , ! ? - + = : / ( ) ' only.

import { CX, CY } from './arena'
import type { Point } from './arena'
import type { RescueeKind } from './family'
import { kindWord } from './pylons'
import type { PylonPlacement } from './pylons'
import type { FoeKind } from './roster'

/**
 * Where a group comes in: scattered over the floor (away from the hero), spread round the four
 * walls, bunched in the corners, in a ring round the hero, along one wall, or through the wall
 * vents (late arrivals always use the vents, after a glowing tell).
 */
export type Entry =
  | 'scatter'
  | 'edges'
  | 'corners'
  | 'ring'
  | 'vents'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'

export type Group = {
  kind: FoeKind
  count: number
  from: Entry
  /** Ticks into the wave before it arrives (0: there from the start). */
  at?: number
  /** Repeat it this many times in all, `every` ticks apart. */
  times?: number
  every?: number
  /** Loops never grow it (a wave's one big set piece). */
  fixed?: boolean
}

/** Where the family waits: scattered, in the middle, in the corners, round the hero, or in the shapes. */
export type FamilySpots = 'scatter' | 'center' | 'corners' | 'ring' | 'shapes'

export type WaveScript = {
  name: string
  /** One line under the wave's banner: what it asks of the hero. */
  hint: string
  groups: readonly Group[]
  pylons?: readonly PylonPlacement[]
  puddles?: number
  family: { count: number; at: FamilySpots; kinds?: readonly RescueeKind[] }
  /** The beacon pad a parade is walked to for double the bonus (null: no pad this wave). */
  beacon: Point | null
  /** Where the hero starts (the middle by default). */
  hero?: Point
  /** The run's signature wave. */
  signature?: boolean
}

const TOP_PAD = { x: CX, y: 58 }
const BOTTOM_PAD = { x: CX, y: 316 }
const LEFT_PAD = { x: 52, y: CY }
const RIGHT_PAD = { x: 428, y: CY }

/** The Neon Plaza's eight: the five old foes, then the stomper and the pylon shapes. */
export const NEON_PLAZA: readonly WaveScript[] = [
  {
    name: 'FIRST SHUFFLE',
    hint: 'BEAM THE DRONES, GRAB THE FAMILY',
    groups: [{ kind: 'drone', count: 19, from: 'edges' }],
    puddles: 2,
    family: { count: 5, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'SEEKER SPRING',
    hint: 'POP SPAWNERS BEFORE THEY HATCH',
    groups: [
      { kind: 'drone', count: 19, from: 'edges' },
      { kind: 'spawner', count: 2, from: 'corners' },
    ],
    puddles: 3,
    family: { count: 6, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'PYLON GARDEN',
    hint: 'THREAD THE SHAPES, FREE THE FAMILY',
    signature: true,
    groups: [
      { kind: 'drone', count: 19, from: 'ring' },
      { kind: 'drone', count: 10, from: 'vents', at: 420 },
      { kind: 'spawner', count: 1, from: 'top' },
    ],
    pylons: [
      { shape: 'heart', x: 110, y: CY },
      { shape: 'star', x: 370, y: CY },
      { shape: 'diamond', x: CX, y: 92 },
      { shape: 'ring', x: CX, y: 282 },
    ],
    family: { count: 8, at: 'shapes' },
    beacon: { x: CX, y: CY + 2 },
    hero: { x: CX, y: CY + 40 },
  },
  {
    name: 'STOMP STOMP',
    hint: 'STEER THE STOMPERS FROM THE FAMILY',
    groups: [
      { kind: 'stomper', count: 2, from: 'corners' },
      { kind: 'drone', count: 19, from: 'edges' },
      { kind: 'tank', count: 1, from: 'bottom' },
    ],
    family: { count: 7, at: 'scatter' },
    beacon: LEFT_PAD,
  },
  {
    name: 'K-I-N-D',
    hint: 'SPELL IT OUT',
    groups: [
      { kind: 'drone', count: 22, from: 'edges' },
      { kind: 'tank', count: 2, from: 'corners' },
      { kind: 'stomper', count: 1, from: 'top' },
    ],
    pylons: kindWord(CX, CY),
    puddles: 2,
    family: { count: 7, at: 'scatter' },
    beacon: BOTTOM_PAD,
    hero: { x: CX, y: 290 },
  },
  {
    name: 'VENT RUSH',
    hint: 'WATCH THE VENTS',
    groups: [
      { kind: 'drone', count: 13, from: 'edges' },
      {
        kind: 'drone',
        count: 10,
        from: 'vents',
        at: 240,
        times: 3,
        every: 300,
      },
      { kind: 'spawner', count: 2, from: 'scatter' },
      { kind: 'stomper', count: 1, from: 'corners' },
    ],
    puddles: 6,
    family: { count: 7, at: 'scatter' },
    beacon: RIGHT_PAD,
  },
  {
    name: 'CORNER SQUEEZE',
    hint: 'THE CORNERS ARE COMING',
    groups: [
      { kind: 'drone', count: 26, from: 'corners' },
      { kind: 'spawner', count: 2, from: 'edges' },
      { kind: 'tank', count: 2, from: 'top' },
      { kind: 'stomper', count: 1, from: 'bottom' },
    ],
    pylons: [
      { shape: 'heart', x: 120, y: 100 },
      { shape: 'heart', x: 360, y: 272 },
    ],
    family: { count: 8, at: 'center' },
    beacon: TOP_PAD,
  },
  {
    name: 'BIG STOMP',
    hint: 'FOUR STOMPERS. SAVE WHO YOU CAN',
    groups: [
      { kind: 'stomper', count: 4, from: 'corners', fixed: true },
      { kind: 'drone', count: 29, from: 'edges' },
      { kind: 'spawner', count: 1, from: 'scatter' },
      { kind: 'tank', count: 2, from: 'vents', at: 600 },
    ],
    pylons: [{ shape: 'star', x: CX, y: CY }],
    family: { count: 9, at: 'ring' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: CY + 70 },
  },
]

/** The Toy Factory's eight: the hypno and its glitched friends, the sparker and its leading shots. */
export const TOY_FACTORY: readonly WaveScript[] = [
  {
    name: 'SWIRLY EYES',
    hint: 'A HYPNO HUNTS THE FAMILY',
    groups: [
      { kind: 'hypno', count: 1, from: 'top' },
      { kind: 'drone', count: 19, from: 'edges' },
    ],
    family: { count: 7, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'SPARK CHECK',
    hint: 'SPARKERS FLASH, THEN FIRE',
    groups: [
      { kind: 'sparker', count: 2, from: 'corners' },
      { kind: 'drone', count: 19, from: 'edges' },
    ],
    puddles: 3,
    family: { count: 6, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'HYPNO WAVE',
    hint: 'THREE HYPNOS. SAVE WHO YOU CAN',
    signature: true,
    groups: [
      { kind: 'hypno', count: 3, from: 'edges', fixed: true },
      { kind: 'drone', count: 13, from: 'corners' },
      { kind: 'drone', count: 10, from: 'vents', at: 480 },
    ],
    family: { count: 12, at: 'center' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: CY + 60 },
  },
  {
    name: 'CROSSFIRE',
    hint: 'KEEP MOVING',
    groups: [
      { kind: 'sparker', count: 3, from: 'edges' },
      { kind: 'tank', count: 2, from: 'corners' },
      { kind: 'drone', count: 19, from: 'ring' },
      { kind: 'stomper', count: 1, from: 'top' },
    ],
    family: { count: 7, at: 'scatter' },
    beacon: RIGHT_PAD,
  },
  {
    name: 'STAR PATROL',
    hint: 'HYPNOS IN THE STARS',
    groups: [
      { kind: 'hypno', count: 2, from: 'corners' },
      { kind: 'sparker', count: 2, from: 'top' },
      { kind: 'drone', count: 19, from: 'ring' },
    ],
    pylons: [
      { shape: 'star', x: 110, y: 110 },
      { shape: 'star', x: 370, y: 262 },
    ],
    family: { count: 8, at: 'shapes' },
    beacon: { x: 370, y: 110 },
  },
  {
    name: 'NIGHT SHIFT',
    hint: 'THE VENTS KEEP COMING',
    groups: [
      { kind: 'drone', count: 16, from: 'edges' },
      {
        kind: 'drone',
        count: 10,
        from: 'vents',
        at: 300,
        times: 2,
        every: 360,
      },
      { kind: 'hypno', count: 2, from: 'vents', at: 600 },
      { kind: 'sparker', count: 2, from: 'corners' },
      { kind: 'spawner', count: 1, from: 'scatter' },
    ],
    puddles: 4,
    family: { count: 8, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'GRAND MIX',
    hint: 'EVERYTHING AT ONCE',
    groups: [
      { kind: 'stomper', count: 2, from: 'corners' },
      { kind: 'hypno', count: 2, from: 'edges' },
      { kind: 'sparker', count: 2, from: 'edges' },
      { kind: 'spawner', count: 2, from: 'scatter' },
      { kind: 'tank', count: 2, from: 'bottom' },
      { kind: 'drone', count: 22, from: 'ring' },
    ],
    pylons: kindWord(CX, 86, 10),
    family: { count: 9, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'FACTORY FLOOR',
    hint: 'THE WHOLE FACTORY. HOLD ON',
    groups: [
      { kind: 'stomper', count: 3, from: 'corners', fixed: true },
      { kind: 'hypno', count: 3, from: 'edges' },
      { kind: 'sparker', count: 3, from: 'ring' },
      { kind: 'drone', count: 26, from: 'edges' },
      { kind: 'drone', count: 10, from: 'vents', at: 600 },
    ],
    pylons: [
      { shape: 'heart', x: 100, y: CY },
      { shape: 'heart', x: 380, y: CY },
    ],
    family: { count: 10, at: 'center' },
    beacon: TOP_PAD,
  },
]

export const RALLY_WAVES: readonly WaveScript[] = [
  ...NEON_PLAZA,
  ...TOY_FACTORY,
]

/** Each loop round the rally, every group grows by this much (fixed groups never do). */
export const LOOP_GROWTH = 0.35
/** ...up to this many times its written size. */
export const LOOP_GROWTH_CAP = 3

/** The script for global wave `n` (1-based), and which loop round the rally it is on. */
export function waveAt(n: number): { script: WaveScript; loop: number } {
  const i = Math.max(0, Math.floor(n) - 1)
  return {
    script: RALLY_WAVES[i % RALLY_WAVES.length]!,
    loop: Math.floor(i / RALLY_WAVES.length) + 1,
  }
}

/** A group's size on a given loop. */
export function groupSize(group: Group, loop: number): number {
  if (group.fixed || loop <= 1) return group.count
  const grow = Math.min(LOOP_GROWTH_CAP, 1 + LOOP_GROWTH * (loop - 1))
  return Math.round(group.count * grow)
}

/** Every foe a script brings over the whole wave (each repeat counted), on a given loop. */
export function scriptFoes(script: WaveScript, loop = 1): Map<FoeKind, number> {
  const counts = new Map<FoeKind, number>()
  for (const g of script.groups) {
    const n = groupSize(g, loop) * (g.times ?? 1)
    counts.set(g.kind, (counts.get(g.kind) ?? 0) + n)
  }
  return counts
}

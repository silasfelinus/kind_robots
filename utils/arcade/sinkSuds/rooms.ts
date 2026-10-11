// /utils/arcade/sinkSuds/rooms.ts
//
// Sink Suds' campaign as data (conductor kr-arcade/t-044, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3, "The Big House Wash").
// The whole robot house needs a wash, room by room. Every room has four
// basins: basins 1-2 bring in the room's water and pests, basin 3 is its
// special basin with an objective of its own, and basin 4 remixes everything
// learned so far. Rooms run in Wash Cycles that each end on a boss, and the
// Soap Shop opens between rooms. The game reads these; nothing room-specific
// lives in its update loop.

import type { BasinId, Point } from './basins'
import type { PestKind } from './pests'

/** A rectangle in logical pixels (a shampoo slick, a rack's shadow). */
export type Box = { x: number; y: number; w: number; h: number }

export type SpecialKind = 'dish-stack' | 'duck-roundup'

export type BasinPlan = {
  /** The basin's name on its title card. */
  title: string
  basin: BasinId
  /** Pests in the basin at the start. */
  pests: Partial<Record<PestKind, number>>
  /** Crumbs and grease at the start. */
  mess: number
  /** Ticks between drips from the tap. */
  drip: number
  /** The difficulty the pests' speeds run at (the endless sink's level). */
  heat: number
  /** Scrub passes a grime cell needs (1 unless set). */
  dirt?: number
  /** Rubber ducks bobbing at fixed spots: bumpers. */
  ducks?: readonly Point[]
  /** Shampoo slicks: fast lanes where the bubble slides quicker. */
  slicks?: readonly Box[]
  /** Shadows from a drying rack overhead, hiding the crumbs under them. */
  shadows?: readonly Box[]
  /** The special basin's objective; the drain opens when it is done. */
  special?: SpecialKind
  /** What the special basin asks, on its title card. */
  goal?: string
  /** Quick Rinse par, in seconds. */
  par: number
}

export type Backdrop = 'kitchen' | 'bath'
export type MusicId = 'kitchen' | 'bath' | 'boss' | 'shop'

export type RoomDef = {
  id: string
  name: string
  cycle: number
  backdrop: Backdrop
  music: MusicId
  basins: readonly [BasinPlan, BasinPlan, BasinPlan, BasinPlan]
  /** The Soap Shop's hint for the room's golden soap. */
  hint: string
}

export type BossId = 'bristleton'

export type CycleDef = {
  name: string
  rooms: readonly string[]
  boss: BossId
}

/** Dish Stack's floating plates: where they start. */
export const PLATE_SPOTS: readonly Point[] = [
  { x: 110, y: 130 },
  { x: 300, y: 118 },
  { x: 92, y: 250 },
  { x: 320, y: 258 },
  { x: 210, y: 92 },
]

/** Duck Round-up: the pen at the tap end of the tub, and where the five ducks start. */
export const DUCK_PEN = { x: 96, y: 192, r: 50 }
export const ROUNDUP_DUCKS: readonly Point[] = [
  { x: 220, y: 140 },
  { x: 250, y: 236 },
  { x: 300, y: 170 },
  { x: 330, y: 230 },
  { x: 280, y: 128 },
]

const RACK_SHADOWS: readonly Box[] = [0, 1, 2, 3, 4].map((i) => ({
  x: 234 + i * 32,
  y: 66,
  w: 14,
  h: 248,
}))

const TUB_SLICKS: readonly Box[] = [
  { x: 130, y: 118, w: 210, h: 16 },
  { x: 92, y: 250, w: 230, h: 16 },
]

const TUB_DUCKS: readonly Point[] = [
  { x: 180, y: 150 },
  { x: 250, y: 232 },
  { x: 300, y: 140 },
]

export const ROOMS: readonly RoomDef[] = [
  {
    id: 'kitchen',
    name: 'KITCHEN SINK',
    cycle: 1,
    backdrop: 'kitchen',
    music: 'kitchen',
    hint: 'SCRUB THE DISH STACK 95% CLEAN',
    basins: [
      {
        title: 'MORNING DISHES',
        basin: 'oval',
        pests: { mite: 3, sponge: 1 },
        mess: 30,
        drip: 150,
        heat: 1,
        par: 70,
      },
      {
        title: 'THE DOUBLE SINK',
        basin: 'double',
        pests: { mite: 3, brush: 1, gremlin: 1 },
        mess: 32,
        drip: 140,
        heat: 2,
        par: 80,
      },
      {
        title: 'DISH STACK',
        basin: 'oval',
        pests: { mite: 2, sponge: 1 },
        mess: 24,
        drip: 140,
        heat: 2,
        special: 'dish-stack',
        goal: 'SCRUB EVERY PLATE CLEAN',
        par: 90,
      },
      {
        title: 'UNDER THE RACK',
        basin: 'double',
        pests: { mite: 4, brush: 2, sponge: 1, gremlin: 1 },
        mess: 40,
        drip: 120,
        heat: 3,
        shadows: RACK_SHADOWS,
        par: 100,
      },
    ],
  },
  {
    id: 'bath',
    name: 'BATH TIME',
    cycle: 1,
    backdrop: 'bath',
    music: 'bath',
    hint: 'ROUND UP THE DUCKS 95% CLEAN',
    basins: [
      {
        title: 'RUNNING WATER',
        basin: 'tub',
        pests: { mite: 3, slug: 2 },
        mess: 32,
        drip: 140,
        heat: 3,
        ducks: TUB_DUCKS,
        par: 80,
      },
      {
        title: 'SHAMPOO SLICKS',
        basin: 'tub',
        pests: { mite: 3, slug: 1, loofah: 1, brush: 1 },
        mess: 34,
        drip: 130,
        heat: 4,
        slicks: TUB_SLICKS,
        par: 90,
      },
      {
        title: 'DUCK ROUND-UP',
        basin: 'tub',
        pests: { mite: 2, slug: 1 },
        mess: 26,
        drip: 130,
        heat: 4,
        special: 'duck-roundup',
        goal: 'NUDGE FIVE DUCKS TO THE TAP',
        par: 110,
      },
      {
        title: 'BUBBLE BATH',
        basin: 'tub',
        pests: { mite: 3, slug: 2, loofah: 1, brush: 2, sponge: 1, gremlin: 1 },
        mess: 44,
        drip: 110,
        heat: 5,
        ducks: TUB_DUCKS,
        slicks: TUB_SLICKS,
        par: 110,
      },
    ],
  },
]

export const CYCLES: readonly CycleDef[] = [
  { name: 'MORNING RINSE', rooms: ['kitchen', 'bath'], boss: 'bristleton' },
]

export type Step =
  | { kind: 'basin'; room: number; basin: number }
  | { kind: 'shop' }
  | { kind: 'boss'; boss: BossId; cycle: number }
  /** Past the last room so far: the endless sink, every shape in turn. */
  | { kind: 'endless' }

/** The campaign in play order: each room's basins, the shop between rooms, a boss per cycle. */
export function campaignSteps(): Step[] {
  const steps: Step[] = []
  CYCLES.forEach((cycle, c) => {
    for (const id of cycle.rooms) {
      const room = ROOMS.findIndex((r) => r.id === id)
      if (steps.length) steps.push({ kind: 'shop' })
      for (let basin = 0; basin < 4; basin++)
        steps.push({ kind: 'basin', room, basin })
    }
    steps.push({ kind: 'boss', boss: cycle.boss, cycle: c })
  })
  steps.push({ kind: 'shop' })
  steps.push({ kind: 'endless' })
  return steps
}

/** Steps that start a room: where progress saves. */
export function isRoomStart(step: Step | undefined): boolean {
  return !!step && step.kind === 'basin' && step.basin === 0
}

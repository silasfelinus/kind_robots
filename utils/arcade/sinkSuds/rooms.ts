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

export type SpecialKind =
  | 'dish-stack'
  | 'duck-roundup'
  | 'odd-socks'
  | 'clean-goal'
  | 'rain-race'
  | 'full-detail'

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
  /** Raindrops: ticks between drops landing anywhere (each grimes a spot and leaves a crumb). */
  rain?: number
  /** Leaves drifting on the water: cover that hides the bubble from hunters. */
  leaves?: number
  /** Car-wash roller brushes: one sweeps a lane every `every` ticks after a lane-light tell. */
  rollers?: { every: number; tell: number }
  /** Wax jets on the rim, puffing on a beat and pushing the bubble away. */
  jets?: readonly Point[]
  /** Clean-goal specials: the percentage that opens the drain. */
  cleanGoal?: number
  /** The special basin's objective; the drain opens when it is done. */
  special?: SpecialKind
  /** What the special basin asks, on its title card. */
  goal?: string
  /** Quick Rinse par, in seconds. */
  par: number
}

export type Backdrop =
  | 'kitchen'
  | 'bath'
  | 'laundry'
  | 'aquarium'
  | 'garden'
  | 'carwash'
  | 'plaza'
  | 'palace'
export type MusicId =
  | 'kitchen'
  | 'bath'
  | 'laundry'
  | 'tank'
  | 'garden'
  | 'carwash'
  | 'palace'
  | 'boss'
  | 'shop'
  | 'ending'

export type RoomDef = {
  id: string
  name: string
  cycle: number
  backdrop: Backdrop
  music: MusicId
  basins: readonly [BasinPlan, BasinPlan, BasinPlan, BasinPlan]
  /** The Soap Shop's hint for the room's golden soap. */
  hint: string
  /** The secret room: only open with every golden soap. */
  secret?: boolean
}

export type BossId = 'bristleton' | 'mossback' | 'grimeking'

export type CycleDef = {
  name: string
  rooms: readonly string[]
  boss: BossId
}

/** Each boss's arena and its music and backdrop. */
export const BOSS_ARENAS: Record<
  BossId,
  {
    name: string
    title: string
    basin: BasinId
    backdrop: Backdrop
    mess: number
    drip: number
    heat: number
  }
> = {
  bristleton: {
    name: 'BRISTLETON',
    title: 'THE BIG BRUSH',
    basin: 'tub',
    backdrop: 'bath',
    mess: 34,
    drip: 70,
    heat: 5,
  },
  mossback: {
    name: 'MOSSBACK',
    title: 'THE OLD GIANT SNAIL',
    basin: 'tank',
    backdrop: 'aquarium',
    mess: 34,
    drip: 90,
    heat: 8,
  },
  grimeking: {
    name: 'THE GRIME KING',
    title: 'AT THE TOWN FOUNTAIN',
    basin: 'fountain',
    backdrop: 'plaza',
    mess: 30,
    drip: 90,
    heat: 11,
  },
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

/** Wax jets on the wash bay's rim. */
const WAX_JETS: readonly Point[] = [
  { x: 40, y: 120 },
  { x: 380, y: 260 },
  { x: 380, y: 124 },
  { x: 40, y: 262 },
]

const PALACE_SLICKS: readonly Box[] = [
  { x: 70, y: 100, w: 280, h: 14 },
  { x: 70, y: 272, w: 280, h: 14 },
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
  {
    id: 'laundry',
    name: 'LAUNDRY DRUM',
    cycle: 2,
    backdrop: 'laundry',
    music: 'laundry',
    hint: 'PAIR EVERY ODD SOCK 95% CLEAN',
    basins: [
      {
        title: 'FIRST SPIN',
        basin: 'drum',
        pests: { mite: 3, lint: 2 },
        mess: 34,
        drip: 130,
        heat: 5,
        par: 90,
      },
      {
        title: 'SOCK SNAKE',
        basin: 'drum',
        pests: { mite: 2, lint: 1, sock: 1, sponge: 1 },
        mess: 36,
        drip: 120,
        heat: 6,
        par: 100,
      },
      {
        title: 'ODD SOCKS',
        basin: 'drum',
        pests: { mite: 2, lint: 1 },
        mess: 28,
        drip: 120,
        heat: 6,
        special: 'odd-socks',
        goal: 'BUMP MATCHING SOCKS TOGETHER',
        par: 120,
      },
      {
        title: 'HEAVY LOAD',
        basin: 'drum',
        pests: { mite: 3, lint: 2, sock: 1, brush: 1, slug: 1, gremlin: 1 },
        mess: 44,
        drip: 100,
        heat: 7,
        par: 120,
      },
    ],
  },
  {
    id: 'tank',
    name: 'FISH TANK',
    cycle: 2,
    backdrop: 'aquarium',
    music: 'tank',
    hint: 'CLEAR THE GLASS 95% CLEAN',
    basins: [
      {
        title: 'BUBBLES UP',
        basin: 'tank',
        pests: { mite: 2, algae: 3 },
        mess: 34,
        drip: 120,
        heat: 6,
        par: 100,
      },
      {
        title: 'SHELLS AND SPINES',
        basin: 'tank',
        pests: { algae: 2, snail: 2, puffer: 1 },
        mess: 36,
        drip: 110,
        heat: 7,
        par: 110,
      },
      {
        title: 'CLEAR THE GLASS',
        basin: 'tank',
        pests: { algae: 3, snail: 1 },
        mess: 30,
        drip: 110,
        heat: 7,
        dirt: 2,
        special: 'clean-goal',
        cleanGoal: 85,
        goal: 'SCRUB THE GLASS TILL YOU SEE THE FISH',
        par: 130,
      },
      {
        title: 'THE DEEP END',
        basin: 'tank',
        pests: { mite: 2, algae: 3, snail: 1, puffer: 2, sponge: 1 },
        mess: 44,
        drip: 100,
        heat: 8,
        par: 130,
      },
    ],
  },
  {
    id: 'birdbath',
    name: 'GARDEN BIRDBATH',
    cycle: 3,
    backdrop: 'garden',
    music: 'garden',
    hint: 'WIN THE RAIN RACE 95% CLEAN',
    basins: [
      {
        title: 'A LIGHT DRIZZLE',
        basin: 'birdbath',
        pests: { mite: 3, strider: 1 },
        mess: 34,
        drip: 120,
        heat: 8,
        rain: 70,
        leaves: 3,
        par: 100,
      },
      {
        title: 'FALLING LEAVES',
        basin: 'birdbath',
        pests: { mite: 2, leafboat: 2, strider: 1 },
        mess: 36,
        drip: 110,
        heat: 9,
        rain: 60,
        leaves: 4,
        par: 110,
      },
      {
        title: 'RAIN RACE',
        basin: 'birdbath',
        pests: { mite: 2, strider: 1 },
        mess: 30,
        drip: 110,
        heat: 9,
        rain: 12,
        leaves: 2,
        special: 'rain-race',
        goal: 'OUT-CLEAN THE SHOWER',
        par: 90,
      },
      {
        title: 'THUNDERSTORM',
        basin: 'birdbath',
        pests: {
          mite: 2,
          strider: 2,
          leafboat: 2,
          brush: 1,
          slug: 1,
          algae: 2,
        },
        mess: 44,
        drip: 100,
        heat: 10,
        rain: 40,
        leaves: 4,
        par: 130,
      },
    ],
  },
  {
    id: 'carwash',
    name: 'THE CAR WASH',
    cycle: 3,
    backdrop: 'carwash',
    music: 'carwash',
    hint: 'FINISH THE FULL DETAIL 95% CLEAN',
    basins: [
      {
        title: 'ROLLERS',
        basin: 'conveyor',
        pests: { mite: 2, wax: 3 },
        mess: 34,
        drip: 110,
        heat: 9,
        rollers: { every: 60 * 6, tell: 75 },
        par: 100,
      },
      {
        title: 'HOT WAX',
        basin: 'conveyor',
        pests: { wax: 2, spinner: 1, mite: 2 },
        mess: 36,
        drip: 110,
        heat: 10,
        jets: WAX_JETS,
        par: 110,
      },
      {
        title: 'FULL DETAIL',
        basin: 'conveyor',
        pests: { wax: 2, mite: 2 },
        mess: 26,
        drip: 110,
        heat: 10,
        rollers: { every: 60 * 7, tell: 80 },
        special: 'full-detail',
        goal: 'CLEAN THE ROBOT CAR PANEL BY PANEL',
        par: 130,
      },
      {
        title: 'THE WORKS',
        basin: 'conveyor',
        pests: { mite: 2, wax: 3, spinner: 2, brush: 1, gremlin: 1 },
        mess: 44,
        drip: 100,
        heat: 11,
        rollers: { every: 60 * 5, tell: 70 },
        jets: WAX_JETS,
        par: 140,
      },
    ],
  },
  {
    id: 'palace',
    name: 'BUBBLE BATH PALACE',
    cycle: 4,
    backdrop: 'palace',
    music: 'palace',
    hint: 'THE PALACE HAS NO GOLDEN SOAP',
    secret: true,
    basins: [
      {
        title: 'RAINBOW FOAM',
        basin: 'palace',
        pests: { mite: 3, brush: 1, sponge: 1, gremlin: 1, slug: 1, loofah: 1 },
        mess: 44,
        drip: 100,
        heat: 11,
        slicks: PALACE_SLICKS,
        par: 120,
      },
      {
        title: 'THE ROYAL LAUNDRY',
        basin: 'palace',
        pests: { mite: 2, lint: 2, sock: 1, algae: 2, snail: 1, puffer: 1 },
        mess: 44,
        drip: 100,
        heat: 12,
        par: 130,
      },
      {
        title: 'SHINE THE PALACE',
        basin: 'palace',
        pests: { strider: 1, leafboat: 1, wax: 2, spinner: 1, mite: 2 },
        mess: 40,
        drip: 100,
        heat: 12,
        rain: 50,
        leaves: 3,
        special: 'clean-goal',
        cleanGoal: 90,
        goal: 'MAKE THE WHOLE PALACE SHINE',
        par: 150,
      },
      {
        title: 'EVERY PEST AT ONCE',
        basin: 'palace',
        pests: {
          mite: 2,
          brush: 1,
          sponge: 1,
          gremlin: 1,
          slug: 1,
          loofah: 1,
          lint: 1,
          sock: 1,
          algae: 1,
          snail: 1,
          puffer: 1,
          strider: 1,
          leafboat: 1,
          wax: 1,
          spinner: 1,
        },
        mess: 50,
        drip: 90,
        heat: 13,
        slicks: PALACE_SLICKS,
        par: 160,
      },
    ],
  },
]

export const CYCLES: readonly CycleDef[] = [
  { name: 'MORNING RINSE', rooms: ['kitchen', 'bath'], boss: 'bristleton' },
  { name: 'MIDDAY SPIN', rooms: ['laundry', 'tank'], boss: 'mossback' },
  { name: 'EVENING SHINE', rooms: ['birdbath', 'carwash'], boss: 'grimeking' },
]

/** The six rooms with a golden soap (every room but the palace). */
export const GOLDEN_ROOMS = ROOMS.filter((r) => !r.secret).map((r) => r.id)

export type EndingKind = 'clean' | 'true'

export type Step =
  | { kind: 'basin'; room: number; basin: number }
  | { kind: 'shop'; secret?: boolean }
  | { kind: 'boss'; boss: BossId; cycle: number }
  /** The credits roll: the house clean, or (after the palace) the true ending. */
  | { kind: 'ending'; ending: EndingKind }
  /** Round again as Deep Clean: dirtier basins, faster pests. */
  | { kind: 'deep' }
  /** The endless sink, every shape in turn (the Endless Sink mode). */
  | { kind: 'endless' }

/**
 * The campaign in play order: each room's basins, the shop between rooms, a
 * boss per cycle, the ending; then, with all six golden soaps, the palace and
 * the true ending; then Deep Clean.
 */
export function campaignSteps(): Step[] {
  const steps: Step[] = []
  const room = (id: string, secret = false) => {
    const index = ROOMS.findIndex((r) => r.id === id)
    if (steps.length)
      steps.push(secret ? { kind: 'shop', secret } : { kind: 'shop' })
    for (let basin = 0; basin < 4; basin++)
      steps.push({ kind: 'basin', room: index, basin })
  }
  CYCLES.forEach((cycle, c) => {
    for (const id of cycle.rooms) room(id)
    steps.push({ kind: 'boss', boss: cycle.boss, cycle: c })
  })
  steps.push({ kind: 'ending', ending: 'clean' })
  for (const r of ROOMS) if (r.secret) room(r.id, true)
  steps.push({ kind: 'ending', ending: 'true' })
  steps.push({ kind: 'deep' })
  return steps
}

/** Is this step only played with every golden soap (the palace, its shop, the true ending)? */
export function isSecretStep(step: Step | undefined): boolean {
  if (!step) return false
  if (step.kind === 'basin') return !!ROOMS[step.room]?.secret
  if (step.kind === 'shop') return !!step.secret
  return step.kind === 'ending' && step.ending === 'true'
}

/** Steps that start a room: where progress saves. */
export function isRoomStart(step: Step | undefined): boolean {
  return !!step && step.kind === 'basin' && step.basin === 0
}

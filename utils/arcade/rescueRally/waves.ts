// /utils/arcade/rescueRally/waves.ts
//
// Rescue Rally's waves as data (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "Waves
// are data-defined scripts"). Every wave is a script: which foes, how many, where they come in (the
// edges, the corners, a ring round the hero, or late through the wall vents), the pylon shapes on the
// floor, where the family waits and where the beacon pad sits. The game only plays what is written.
//
// Each district (districts.ts) is eight scripts: waves 1-2 bring in its new foes and floor, wave 3 is
// its signature wave, waves 4-7 remix everything so far, and wave 8 is its boss (bosses.ts). Floors
// add their own furniture: the Toy Factory's conveyor strips carry everyone, and its crates are cover
// until they're broken. Past the last district the rally loops, every group a third bigger each time
// round, and the foe curves (roster.ts) keep climbing.
//
// Card text is drawn in the arcade's pixel font: capitals, digits and . , ! ? - + = : / ( ) ' only.

import { CX, CY } from './arena'
import type { Point } from './arena'
import type { RescueeKind } from './family'
import { kindWord } from './pylons'
import type { PylonPlacement } from './pylons'
import type { FoeKind } from './roster'
import type { BossKind } from './bosses'
import type { PowerKind } from './powers'
import type { LaserGate, PadPair, Rect, Sprinkler, Storm } from './floors'

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
export type FamilySpots =
  'scatter' | 'center' | 'corners' | 'ring' | 'shapes' | 'beds'

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
  /** The district's signature wave. */
  signature?: boolean
  /** The district's boss wave: the boss, and the groups as its escort. */
  boss?: BossKind
  /** Conveyor strips: everyone standing on one is carried along it. */
  conveyors?: readonly Conveyor[]
  /** Crates, laid out like pylon shapes: cover for everyone until a beam breaks them. */
  crates?: readonly PylonPlacement[]
  /** A power-up that waits on the floor from the start. */
  power?: { kind: PowerKind; x: number; y: number }
  /** The Botanic Dome: vine walls, sprinkler sprays, flowerbeds the family hides in. */
  vines?: readonly Rect[]
  sprinklers?: readonly Sprinkler[]
  beds?: readonly Rect[]
  /** The Data Docks: teleport pad pairs, laser gates, magnet floors. */
  pads?: readonly PadPair[]
  gates?: readonly LaserGate[]
  magnets?: readonly Rect[]
  /** The Storm Rooftops: wind and lightning. */
  storm?: Storm
  /** The Reunion: no foes, everyone to greet. */
  reunion?: boolean
}

/** A strip of moving floor: a rectangle (its top-left and size) and the way it runs. */
export type Conveyor = {
  x: number
  y: number
  w: number
  h: number
  dir: 'up' | 'down' | 'left' | 'right'
}
/** How fast a conveyor carries whoever stands on it (px per tick). */
export const CONVEYOR_SPEED = 0.7
/** Crates sit a little further apart than pylons: each is a box the hero can't walk through. */
export const CRATE_SPACING = 16

/** The way a conveyor runs, as a unit step. */
export function conveyorStep(c: Conveyor): Point {
  return c.dir === 'up'
    ? { x: 0, y: -1 }
    : c.dir === 'down'
      ? { x: 0, y: 1 }
      : c.dir === 'left'
        ? { x: -1, y: 0 }
        : { x: 1, y: 0 }
}

/** A ring of four belts round a box, running clockwise (or anticlockwise). */
export function beltLoop(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  clockwise = true,
  band = 20,
): Conveyor[] {
  const L = cx - halfW
  const T = cy - halfH
  const R = cx + halfW
  const B = cy + halfH
  return [
    { x: L, y: T, w: R - L - band, h: band, dir: clockwise ? 'right' : 'left' },
    {
      x: R - band,
      y: T,
      w: band,
      h: B - T - band,
      dir: clockwise ? 'down' : 'up',
    },
    {
      x: L + band,
      y: B - band,
      w: R - L - band,
      h: band,
      dir: clockwise ? 'left' : 'right',
    },
    {
      x: L,
      y: T + band,
      w: band,
      h: B - T - band,
      dir: clockwise ? 'up' : 'down',
    },
  ]
}

const TOP_PAD = { x: CX, y: 58 }
const BOTTOM_PAD = { x: CX, y: 316 }
const LEFT_PAD = { x: 52, y: CY }
const RIGHT_PAD = { x: 428, y: CY }

/** District 1, the Neon Plaza: the five old foes, then the stomper and the pylon shapes. */
export const NEON_PLAZA: readonly WaveScript[] = [
  {
    name: 'FIRST SHUFFLE',
    hint: 'BEAM THE DRONES, GRAB THE FAMILY',
    groups: [{ kind: 'drone', count: 19, from: 'edges' }],
    pylons: [
      { shape: 'row', x: 120, y: 100 },
      { shape: 'row', x: 360, y: 272 },
    ],
    puddles: 2,
    family: { count: 5, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'WIND-UP WALK',
    hint: 'NO BEAM STOPS A STOMPER. SHOVE IT',
    groups: [
      { kind: 'stomper', count: 1, from: 'top' },
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
    power: { kind: 'spread', x: 360, y: 120 },
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
    name: 'BIG STOMP',
    hint: 'FOUR STOMPERS. SAVE WHO YOU CAN',
    groups: [
      { kind: 'stomper', count: 4, from: 'corners', fixed: true },
      { kind: 'drone', count: 26, from: 'edges' },
      { kind: 'spawner', count: 2, from: 'scatter' },
      { kind: 'tank', count: 2, from: 'vents', at: 600 },
    ],
    pylons: [
      { shape: 'heart', x: 120, y: 100 },
      { shape: 'heart', x: 360, y: 272 },
    ],
    family: { count: 9, at: 'ring' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: CY + 70 },
  },
  {
    name: 'THE BIG WIND-UP',
    hint: 'WIND IT DOWN: BEAM THE KEY',
    boss: 'windup',
    groups: [{ kind: 'drone', count: 8, from: 'edges' }],
    pylons: [
      { shape: 'row', x: 100, y: 70 },
      { shape: 'row', x: 380, y: 302 },
    ],
    family: { count: 5, at: 'corners' },
    beacon: BOTTOM_PAD,
    hero: { x: CX, y: 280 },
  },
]

/**
 * District 2, the Toy Factory: the hypno and its glitched friends, the sparker and its leading shots,
 * on conveyor belts and among crates.
 */
export const TOY_FACTORY: readonly WaveScript[] = [
  {
    name: 'SWIRLY EYES',
    hint: 'A HYPNO HUNTS THE FAMILY',
    groups: [
      { kind: 'hypno', count: 1, from: 'top' },
      { kind: 'drone', count: 19, from: 'edges' },
    ],
    conveyors: [
      { x: 60, y: 98, w: 360, h: 22, dir: 'right' },
      { x: 60, y: 252, w: 360, h: 22, dir: 'left' },
    ],
    family: { count: 7, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'SPARK CHECK',
    hint: 'SPARKERS FLASH, THEN FIRE. TAKE COVER',
    groups: [
      { kind: 'sparker', count: 2, from: 'corners' },
      { kind: 'drone', count: 19, from: 'edges' },
    ],
    crates: [
      { shape: 'row', x: 150, y: 120 },
      { shape: 'row', x: 330, y: 250 },
      { shape: 'column', x: 70, y: 250 },
      { shape: 'column', x: 410, y: 120 },
    ],
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
    conveyors: beltLoop(CX, CY, 120, 76),
    family: { count: 12, at: 'center' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: CY },
  },
  {
    name: 'CROSSFIRE',
    hint: 'KEEP MOVING, KEEP COVER',
    groups: [
      { kind: 'sparker', count: 3, from: 'edges' },
      { kind: 'tank', count: 2, from: 'corners' },
      { kind: 'drone', count: 19, from: 'ring' },
      { kind: 'stomper', count: 1, from: 'top' },
    ],
    crates: [
      { shape: 'diamond', x: 130, y: 110, spacing: 12 },
      { shape: 'diamond', x: 350, y: 262, spacing: 12 },
    ],
    family: { count: 7, at: 'shapes' },
    beacon: RIGHT_PAD,
    power: { kind: 'shield', x: 110, y: 280 },
  },
  {
    name: 'CRATE STACKS',
    hint: 'HYPNOS BEHIND THE CRATES',
    groups: [
      { kind: 'hypno', count: 2, from: 'corners' },
      { kind: 'sparker', count: 2, from: 'top' },
      { kind: 'drone', count: 19, from: 'ring' },
    ],
    crates: [
      { shape: 'heart', x: 110, y: 120 },
      { shape: 'heart', x: 370, y: 252 },
    ],
    pylons: [
      { shape: 'star', x: 370, y: 110 },
      { shape: 'star', x: 110, y: 262 },
    ],
    family: { count: 8, at: 'shapes' },
    beacon: { x: CX, y: CY },
  },
  {
    name: 'NIGHT SHIFT',
    hint: 'THE BELTS AND THE VENTS KEEP COMING',
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
    conveyors: [
      { x: 128, y: 50, w: 24, h: 272, dir: 'down' },
      { x: 328, y: 50, w: 24, h: 272, dir: 'up' },
    ],
    puddles: 4,
    family: { count: 8, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'FACTORY FLOOR',
    hint: 'THE WHOLE FACTORY. HOLD ON',
    groups: [
      { kind: 'stomper', count: 3, from: 'corners', fixed: true },
      { kind: 'hypno', count: 3, from: 'edges' },
      { kind: 'sparker', count: 3, from: 'ring' },
      { kind: 'drone', count: 22, from: 'edges' },
      { kind: 'drone', count: 10, from: 'vents', at: 600 },
    ],
    conveyors: [{ x: 40, y: 168, w: 400, h: 22, dir: 'right' }],
    crates: [
      { shape: 'row', x: 130, y: 90 },
      { shape: 'row', x: 350, y: 282 },
    ],
    family: { count: 10, at: 'center' },
    beacon: TOP_PAD,
  },
  {
    name: 'THE JACK-IN-THE-BOX',
    hint: 'IT POPS UP WHERE THE SHADOW FALLS',
    boss: 'jack',
    groups: [{ kind: 'drone', count: 6, from: 'edges' }],
    conveyors: [{ x: 60, y: 300, w: 360, h: 20, dir: 'left' }],
    crates: [
      { shape: 'column', x: 140, y: CY - 30, spacing: 16 },
      { shape: 'column', x: 340, y: CY - 30, spacing: 16 },
    ],
    family: { count: 6, at: 'scatter' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: 250 },
  },
]

// --- districts 3-5 -----------------------------------------------------------------------------------

/** The dome's vine walls, in the order they grow: each wave has more of them. */
const VINES: readonly Rect[] = [
  { x: 150, y: 110, w: 12, h: 70 },
  { x: 318, y: 192, w: 12, h: 70 },
  { x: 200, y: 270, w: 80, h: 12 },
  { x: 200, y: 90, w: 80, h: 12 },
  { x: 60, y: 180, w: 64, h: 12 },
  { x: 356, y: 180, w: 64, h: 12 },
  { x: 96, y: 52, w: 12, h: 64 },
  { x: 372, y: 256, w: 12, h: 64 },
]
const vines = (n: number) => VINES.slice(0, n)
const BEDS: readonly Rect[] = [
  { x: 40, y: 262, w: 64, h: 44 },
  { x: 376, y: 62, w: 64, h: 44 },
  { x: 376, y: 262, w: 64, h: 44 },
]

/**
 * District 3, the Botanic Dome: the prism and its thornballs (their shells bounce), the splitter;
 * vine walls that grow wave by wave, sprinklers that slow everyone, flowerbeds the family hides in.
 */
export const BOTANIC_DOME: readonly WaveScript[] = [
  {
    name: 'GREENHOUSE',
    hint: 'POP THE PRISMS BEFORE THEY HATCH',
    groups: [
      { kind: 'prism', count: 2, from: 'corners' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    vines: vines(2),
    sprinklers: [{ x: CX, y: CY, r: 46 }],
    beds: BEDS.slice(0, 1),
    family: { count: 7, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'THORN BOUNCE',
    hint: "DON'T STAND ON REBOUND LINES",
    groups: [
      { kind: 'thornball', count: 3, from: 'edges' },
      { kind: 'splitter', count: 2, from: 'corners' },
      { kind: 'drone', count: 14, from: 'edges' },
    ],
    vines: vines(3),
    beds: BEDS.slice(0, 2),
    family: { count: 8, at: 'beds' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'BOUNCE WAVE',
    hint: 'PRISMS AND THORNBALLS. ALL RICOCHET',
    signature: true,
    groups: [
      { kind: 'prism', count: 3, from: 'corners' },
      { kind: 'thornball', count: 4, from: 'edges' },
      { kind: 'drone', count: 10, from: 'ring' },
    ],
    vines: vines(4),
    beds: BEDS,
    family: { count: 9, at: 'beds' },
    beacon: LEFT_PAD,
  },
  {
    name: 'SPLIT DECISION',
    hint: 'FINISH ALL FOUR PIECES',
    groups: [
      { kind: 'splitter', count: 4, from: 'edges' },
      { kind: 'hypno', count: 2, from: 'corners' },
      { kind: 'drone', count: 12, from: 'edges' },
    ],
    vines: vines(5),
    beds: BEDS,
    family: { count: 9, at: 'beds' },
    beacon: TOP_PAD,
  },
  {
    name: 'SPRINKLER SEASON',
    hint: 'THE SPRAY SLOWS EVERYONE',
    groups: [
      { kind: 'stomper', count: 2, from: 'corners' },
      { kind: 'prism', count: 2, from: 'edges' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    vines: vines(5),
    sprinklers: [
      { x: 120, y: 110, r: 40 },
      { x: 360, y: 262, r: 40 },
      { x: CX, y: CY, r: 36 },
    ],
    family: { count: 8, at: 'scatter' },
    beacon: BOTTOM_PAD,
    power: { kind: 'bounce', x: 120, y: 280 },
  },
  {
    name: 'ROOT MAZE',
    hint: 'THE VINES HAVE GROWN',
    groups: [
      { kind: 'sparker', count: 2, from: 'corners' },
      { kind: 'thornball', count: 3, from: 'edges' },
      { kind: 'drone', count: 10, from: 'edges' },
      { kind: 'drone', count: 8, from: 'vents', at: 360, times: 2, every: 360 },
    ],
    vines: vines(8),
    beds: BEDS.slice(0, 2),
    family: { count: 8, at: 'beds' },
    beacon: TOP_PAD,
  },
  {
    name: 'FULL BLOOM',
    hint: 'THE WHOLE DOME AT ONCE',
    groups: [
      { kind: 'prism', count: 3, from: 'corners' },
      { kind: 'splitter', count: 3, from: 'edges' },
      { kind: 'hypno', count: 2, from: 'edges' },
      { kind: 'thornball', count: 3, from: 'ring' },
      { kind: 'drone', count: 18, from: 'edges' },
    ],
    vines: vines(8),
    sprinklers: [
      { x: 120, y: 262, r: 36 },
      { x: 360, y: 110, r: 36 },
    ],
    beds: BEDS,
    family: { count: 10, at: 'beds' },
    beacon: TOP_PAD,
  },
  {
    name: 'OVERGROWTH',
    hint: 'BREAK THE PETALS, WATCH THE ROOTS',
    boss: 'overgrowth',
    groups: [{ kind: 'drone', count: 6, from: 'edges' }],
    vines: [VINES[4]!, VINES[5]!],
    beds: [BEDS[0]!, BEDS[2]!],
    family: { count: 6, at: 'beds' },
    beacon: LEFT_PAD,
    hero: { x: CX, y: 290 },
  },
]

const PADS_X: PadPair = [
  { x: 60, y: 64 },
  { x: 420, y: 308 },
]
const PADS_Y: PadPair = [
  { x: 420, y: 64 },
  { x: 60, y: 308 },
]
const gate = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  offset = 0,
  period = 180,
  on = 70,
): LaserGate => ({ x0, y0, x1, y1, period, on, offset })

/**
 * District 4, the Data Docks: the mimic, the shield bot and the magnet; teleport pads, laser gates
 * on a beat, magnet floors.
 */
export const DATA_DOCKS: readonly WaveScript[] = [
  {
    name: 'MIRROR MIRROR',
    hint: 'AN ECHO WALKS YOUR OLD PATH',
    groups: [
      { kind: 'mimic', count: 1, from: 'vents', at: 120 },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    pads: [PADS_X],
    family: { count: 7, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'SHIELD WALL',
    hint: 'SHIELD BOTS: FLANK THEM',
    groups: [
      { kind: 'shieldbot', count: 3, from: 'top' },
      { kind: 'drone', count: 14, from: 'edges' },
    ],
    gates: [gate(110, CY, 200, CY), gate(280, CY, 370, CY, 90)],
    family: { count: 7, at: 'scatter' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'MIRROR WAVE',
    hint: 'MIMICS OF YOU AND YOUR PAST MOVES',
    signature: true,
    groups: [
      { kind: 'mimic', count: 1, from: 'vents', at: 90, times: 4, every: 150 },
      { kind: 'drone', count: 12, from: 'edges' },
    ],
    pads: [PADS_X, PADS_Y],
    family: { count: 9, at: 'scatter' },
    beacon: LEFT_PAD,
  },
  {
    name: 'MAGNETIC',
    hint: 'MOVE ACROSS THE PULL, NOT AGAINST IT',
    groups: [
      { kind: 'magnet', count: 2, from: 'corners' },
      { kind: 'shieldbot', count: 1, from: 'bottom' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    magnets: [
      { x: 60, y: 120, w: 100, h: 40 },
      { x: 320, y: 212, w: 100, h: 40 },
    ],
    family: { count: 8, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'GATEWAY',
    hint: 'MIND THE GATES ON THE BEAT',
    groups: [
      { kind: 'hypno', count: 2, from: 'corners' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    gates: [
      gate(CX, 40, CX, 130),
      gate(CX, 242, CX, 332, 90),
      gate(30, CY, 140, CY, 45),
      gate(340, CY, 450, CY, 135),
    ],
    pads: [PADS_X, PADS_Y],
    family: { count: 9, at: 'scatter' },
    beacon: { x: 130, y: 290 },
  },
  {
    name: 'DATA STORM',
    hint: 'EVERYTHING ON THE DOCKS',
    groups: [
      { kind: 'mimic', count: 2, from: 'vents', at: 120, times: 2, every: 200 },
      { kind: 'shieldbot', count: 2, from: 'top' },
      { kind: 'magnet', count: 1, from: 'corners' },
      { kind: 'sparker', count: 2, from: 'edges' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    gates: [gate(110, 110, 200, 110), gate(280, 262, 370, 262, 90)],
    magnets: [{ x: 190, y: 166, w: 100, h: 40 }],
    family: { count: 9, at: 'scatter' },
    beacon: RIGHT_PAD,
  },
  {
    name: 'BUFFER OVERFLOW',
    hint: 'THE VENTS ARE OVERFLOWING',
    groups: [
      { kind: 'shieldbot', count: 2, from: 'corners' },
      { kind: 'magnet', count: 2, from: 'edges' },
      { kind: 'hypno', count: 2, from: 'edges' },
      { kind: 'drone', count: 14, from: 'edges' },
      {
        kind: 'drone',
        count: 10,
        from: 'vents',
        at: 300,
        times: 3,
        every: 300,
      },
    ],
    pads: [PADS_X, PADS_Y],
    gates: [gate(CX, 40, CX, 130), gate(CX, 242, CX, 332, 90)],
    family: { count: 10, at: 'center' },
    beacon: { x: 130, y: 80 },
  },
  {
    name: 'THE STATIC TWINS',
    hint: 'BREAK THE LINK WHEN THEY ARE FAR APART',
    boss: 'twins',
    groups: [{ kind: 'drone', count: 6, from: 'edges' }],
    pads: [PADS_X, PADS_Y],
    family: { count: 6, at: 'corners' },
    beacon: BOTTOM_PAD,
    hero: { x: CX, y: 300 },
  },
]

const STORM = { lightningEvery: 210, wind: 0.3 }

/** District 5, the Storm Rooftops: the kite drone and remixes of everything; wind and lightning. */
export const STORM_ROOFTOPS: readonly WaveScript[] = [
  {
    name: 'KITE SEASON',
    hint: 'STAY OFF THE SHADOWS',
    groups: [
      { kind: 'kite', count: 3, from: 'top' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    storm: { lightningEvery: 0, wind: 0.25 },
    family: { count: 7, at: 'center' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'LIGHTNING',
    hint: 'THE RING GLOWS, THEN IT STRIKES',
    groups: [
      { kind: 'sparker', count: 2, from: 'corners' },
      { kind: 'drone', count: 18, from: 'edges' },
    ],
    storm: STORM,
    family: { count: 8, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'STORM WAVE',
    hint: 'EVERY FOE AT ONCE',
    signature: true,
    groups: [
      { kind: 'drone', count: 10, from: 'edges' },
      { kind: 'spawner', count: 1, from: 'corners' },
      { kind: 'tank', count: 1, from: 'bottom' },
      { kind: 'stomper', count: 1, from: 'corners' },
      { kind: 'hypno', count: 1, from: 'top' },
      { kind: 'sparker', count: 1, from: 'edges' },
      { kind: 'prism', count: 1, from: 'corners' },
      { kind: 'thornball', count: 1, from: 'edges' },
      { kind: 'splitter', count: 1, from: 'edges' },
      { kind: 'mimic', count: 1, from: 'vents', at: 120 },
      { kind: 'shieldbot', count: 1, from: 'top' },
      { kind: 'magnet', count: 1, from: 'corners' },
      { kind: 'kite', count: 1, from: 'top' },
    ],
    pylons: [
      { shape: 'heart', x: 100, y: 110 },
      { shape: 'star', x: 380, y: 262 },
    ],
    puddles: 2,
    storm: STORM,
    family: { count: 10, at: 'center' },
    beacon: LEFT_PAD,
  },
  {
    name: 'HIGH WINDS',
    hint: 'THE WIND PUSHES THE FAMILY TO THE EDGE',
    groups: [
      { kind: 'kite', count: 3, from: 'edges' },
      { kind: 'splitter', count: 2, from: 'corners' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    storm: { lightningEvery: 0, wind: 0.45 },
    pylons: [{ shape: 'row', x: CX, y: 100 }],
    family: { count: 9, at: 'center' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'ROOF RACE',
    hint: 'TANKS ON THE ROOF',
    groups: [
      { kind: 'tank', count: 3, from: 'corners' },
      { kind: 'stomper', count: 2, from: 'edges' },
      { kind: 'hypno', count: 2, from: 'top' },
      { kind: 'drone', count: 18, from: 'edges' },
    ],
    storm: STORM,
    family: { count: 9, at: 'scatter' },
    beacon: TOP_PAD,
  },
  {
    name: 'GLITCH RAIN',
    hint: 'PRISMS IN THE RAIN',
    groups: [
      { kind: 'prism', count: 3, from: 'corners' },
      { kind: 'thornball', count: 3, from: 'edges' },
      { kind: 'magnet', count: 2, from: 'edges' },
      { kind: 'kite', count: 2, from: 'top' },
      { kind: 'drone', count: 16, from: 'edges' },
    ],
    storm: { lightningEvery: 170, wind: 0.3 },
    family: { count: 9, at: 'scatter' },
    beacon: RIGHT_PAD,
  },
  {
    name: 'LAST STAND',
    hint: 'ONE MORE, THEN THE CORE',
    groups: [
      { kind: 'stomper', count: 2, from: 'corners', fixed: true },
      { kind: 'hypno', count: 3, from: 'edges' },
      { kind: 'mimic', count: 2, from: 'vents', at: 120 },
      { kind: 'shieldbot', count: 2, from: 'top' },
      { kind: 'kite', count: 2, from: 'edges' },
      { kind: 'drone', count: 20, from: 'edges' },
    ],
    storm: STORM,
    pylons: kindWord(CX, 86, 10),
    family: { count: 10, at: 'center' },
    beacon: BOTTOM_PAD,
  },
  {
    name: 'THE GLITCH CORE',
    hint: 'SHOOT THROUGH THE GAPS IN ITS SHIELDS',
    boss: 'core',
    groups: [{ kind: 'drone', count: 6, from: 'edges' }],
    storm: { lightningEvery: 0, wind: 0.2 },
    family: { count: 8, at: 'ring' },
    beacon: BOTTOM_PAD,
    hero: { x: CX, y: 300 },
  },
]

/** The Reunion: with all five golden chips, every family on the roof together. No foes; greet them all. */
export const REUNION: WaveScript = {
  name: 'THE REUNION',
  hint: 'EVERY FAMILY, TOGETHER AGAIN',
  reunion: true,
  groups: [],
  family: { count: 24, at: 'scatter' },
  beacon: null,
}

/** Each loop round the rally, every group grows by this much (fixed groups never do). */
export const LOOP_GROWTH = 0.35
/** ...up to this many times its written size. */
export const LOOP_GROWTH_CAP = 3

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

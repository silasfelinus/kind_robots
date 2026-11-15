// /utils/arcade/lanternSwarm/zones.ts
//
// Lantern Swarm depth pass, slice 1 (conductor kr-arcade/t-093): the Long Night Festival as data.
// A zone is one Watch of the night: six stages (three formation stages, a Glow Stage, a remix and a
// Guardian). Each formation stage scripts its own entrance (groups, paths, fill order and entry
// fire), its formation layout, the dive shapes its moths may fly and its tuning, so stage 2 no
// longer flies stage 1's entrance and the difficulty lives here instead of in the update loop.
// Once the last zone's Guardian floats home the night goes round again, one lap harder.

export const W = 224
export const H = 288

export type Kind = 'moth' | 'luna' | 'queen' | 'escort'
export type Pt = { x: number; y: number }

const mirror = (path: readonly Pt[]): Pt[] =>
  path.map((p) => ({ x: W - p.x, y: p.y }))

const TOP_L: Pt[] = [
  { x: W / 2 - 10, y: -10 },
  { x: W / 2 - 10, y: 110 },
  { x: 50, y: 190 },
  { x: 28, y: 140 },
  { x: 64, y: 112 },
]
const SIDE_L: Pt[] = [
  { x: -10, y: 230 },
  { x: 70, y: 215 },
  { x: 120, y: 165 },
  { x: 96, y: 120 },
  { x: 54, y: 142 },
]
/** Down the left, a full loop-the-loop over the rooftops, then up to the swarm. */
const LOOP_L: Pt[] = [
  { x: 40, y: -10 },
  { x: 60, y: 120 },
  { x: 110, y: 200 },
  { x: 152, y: 172 },
  { x: 132, y: 128 },
  { x: 92, y: 150 },
  { x: 72, y: 112 },
]
/** In low from the side, a long glide under the swarm and a hook back up. */
const HOOK_L: Pt[] = [
  { x: -10, y: 150 },
  { x: 80, y: 182 },
  { x: 160, y: 192 },
  { x: 192, y: 142 },
  { x: 150, y: 110 },
]
/** Straight down the middle like a dropped ribbon, then a curl out to the side. */
const DROP_L: Pt[] = [
  { x: W / 2 - 18, y: -10 },
  { x: W / 2 - 18, y: 176 },
  { x: 70, y: 212 },
  { x: 38, y: 160 },
  { x: 62, y: 118 },
]

export const PATHS = {
  topL: TOP_L,
  topR: mirror(TOP_L),
  sideL: SIDE_L,
  sideR: mirror(SIDE_L),
  loopL: LOOP_L,
  loopR: mirror(LOOP_L),
  hookL: HOOK_L,
  hookR: mirror(HOOK_L),
  dropL: DROP_L,
  dropR: mirror(DROP_L),
} as const satisfies Record<string, readonly Pt[]>
export type PathName = keyof typeof PATHS

/** The mirror twin of a path name (topL <-> topR). */
export function mirrorPath(name: PathName): PathName {
  const base = name.slice(0, -1)
  return (name.endsWith('L') ? `${base}R` : `${base}L`) as PathName
}

// --- formation layouts and fill orders ---------------------------------------------------------

export type Slot = { row: number; col: number }
export type Layout = Record<
  Kind,
  ReadonlyArray<{ row: number; cols: readonly number[] }>
>

/** Formation grids (10 columns, 5 rows); each holds 4 queens, 4 escorts, 12 lunas and 20 moths. */
export const LAYOUTS = {
  /** The classic block: escorts tucked right under the queens. */
  classic: {
    queen: [{ row: 0, cols: [3, 4, 5, 6] }],
    escort: [{ row: 1, cols: [3, 4, 5, 6] }],
    luna: [
      { row: 1, cols: [1, 2, 7, 8] },
      { row: 2, cols: [1, 2, 3, 4, 5, 6, 7, 8] },
    ],
    moth: [
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    ],
  },
  /** Two rooftop wings: queens split to the eaves with an escort on each side. */
  eaves: {
    queen: [{ row: 0, cols: [1, 2, 7, 8] }],
    escort: [{ row: 0, cols: [0, 3, 6, 9] }],
    luna: [
      { row: 1, cols: [0, 1, 2, 3, 6, 7, 8, 9] },
      { row: 2, cols: [1, 2, 7, 8] },
    ],
    moth: [
      { row: 2, cols: [3, 4, 5, 6] },
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [2, 3, 4, 5, 6, 7] },
    ],
  },
  /** A lantern arch: the swarm hangs in a curve, its crown of queens in the middle. */
  arch: {
    queen: [{ row: 0, cols: [3, 4, 5, 6] }],
    escort: [
      { row: 0, cols: [2, 7] },
      { row: 1, cols: [2, 7] },
    ],
    luna: [
      { row: 1, cols: [0, 1, 3, 4, 5, 6, 8, 9] },
      { row: 2, cols: [0, 1, 8, 9] },
    ],
    moth: [
      { row: 2, cols: [2, 3, 4, 5, 6, 7] },
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [3, 4, 5, 6] },
    ],
  },
} as const satisfies Record<string, Layout>
export type LayoutName = keyof typeof LAYOUTS

/** The order a stage hands out its slots: across, from the middle out, or from the edges in. */
export type FillOrder = 'across' | 'centre' | 'edges'

/** A kind's slots in a layout, in the stage's fill order. */
export function slotsFor(
  layout: LayoutName,
  kind: Kind,
  fill: FillOrder,
): Slot[] {
  const rows: Layout[Kind] = LAYOUTS[layout][kind]
  const slots = rows.flatMap((r) => r.cols.map((col) => ({ row: r.row, col })))
  if (fill === 'across') return slots
  const off = (s: Slot) => Math.abs(s.col - 4.5)
  const sign = fill === 'centre' ? 1 : -1
  return [...slots].sort(
    (a, b) => sign * (off(a) - off(b)) || a.row - b.row || a.col - b.col,
  )
}

// --- entrances, dives and tuning ---------------------------------------------------------------

export type EntryGroup = {
  path: PathName
  /** Fly the mirror image at the same time, the kinds alternating between the two lines. */
  pair?: boolean
  kinds: Kind[]
  /** When the group sets off, in entrance beats (GROUP_GAP ticks each). */
  at: number
  /** Dust dropped on the way in, as a share of the stage's dive dust (absent: none). */
  fire?: number
}

export type DiveShape = 'sweep' | 'loop' | 'zig' | 'swoop'

export type Tuning = {
  /** Ticks between dives once the swarm is in. */
  diveGap: number
  /** Most moths diving at once. */
  divers: number
  diveSpeed: number
  /** Chance per tick that a diving moth drops dust. */
  dust: number
  /** Chance a queen without a captive comes down to shine her glow. */
  capture: number
}

export type FormationStage = {
  kind: 'formation'
  name: string
  layout: LayoutName
  fill: FillOrder
  entrance: EntryGroup[]
  dives: DiveShape[]
  tune: Tuning
  /** Dives may start before the last group has settled. */
  earlyDives?: boolean
}
export type GlowName = 'paper-cranes'
export type GlowStage = {
  kind: 'glow'
  name: string
  choreography: GlowName
}
export type GuardianName = 'grand-lantern-moth'
export type GuardianStage = {
  kind: 'guardian'
  name: string
  guardian: GuardianName
}
export type Stage = FormationStage | GlowStage | GuardianStage

export type SkyName = 'rooftop'
export type Zone = {
  id: string
  /** The Watch of the night this zone fills. */
  watch: string
  name: string
  sky: SkyName
  stages: Stage[]
}

const Q = 'queen'
const E = 'escort'
const L = 'luna'
const M = 'moth'
const n = (kind: Kind, count: number): Kind[] =>
  Array.from({ length: count }, () => kind)

export const ROOFTOP_FESTIVAL: Zone = {
  id: 'rooftop-festival',
  watch: 'DUSK',
  name: 'ROOFTOP FESTIVAL',
  sky: 'rooftop',
  stages: [
    {
      kind: 'formation',
      name: 'LANTERN LIGHTING',
      layout: 'classic',
      fill: 'across',
      entrance: [
        { path: 'topL', kinds: n(L, 4), at: 0 },
        { path: 'topR', kinds: n(M, 4), at: 0 },
        { path: 'sideL', kinds: [Q, E, Q, E, Q, E, Q, E], at: 1 },
        { path: 'sideR', kinds: n(L, 8), at: 2 },
        { path: 'topL', kinds: n(M, 8), at: 3 },
        { path: 'topR', kinds: n(M, 8), at: 4 },
      ],
      dives: ['sweep'],
      tune: {
        diveGap: 170,
        divers: 2,
        diveSpeed: 1.7,
        dust: 0.012,
        capture: 0.45,
      },
    },
    {
      kind: 'formation',
      name: 'ROOFTOP PARADE',
      layout: 'eaves',
      fill: 'edges',
      entrance: [
        { path: 'loopL', pair: true, kinds: [Q, Q, E, E, Q, Q, E, E], at: 0 },
        { path: 'hookL', kinds: n(L, 6), at: 1, fire: 0.3 },
        { path: 'hookR', kinds: n(L, 6), at: 1.5, fire: 0.3 },
        { path: 'dropL', pair: true, kinds: n(M, 10), at: 2.5, fire: 0.3 },
        { path: 'topR', pair: true, kinds: n(M, 10), at: 3.5 },
      ],
      dives: ['sweep', 'loop'],
      tune: {
        diveGap: 150,
        divers: 3,
        diveSpeed: 1.85,
        dust: 0.016,
        capture: 0.45,
      },
    },
    {
      kind: 'formation',
      name: 'RIBBON DANCE',
      layout: 'arch',
      fill: 'centre',
      entrance: [
        { path: 'sideL', pair: true, kinds: n(M, 10), at: 0, fire: 0.4 },
        { path: 'loopR', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 1 },
        { path: 'dropR', pair: true, kinds: n(L, 12), at: 2, fire: 0.4 },
        { path: 'hookL', pair: true, kinds: n(M, 10), at: 3.2, fire: 0.4 },
      ],
      dives: ['sweep', 'loop', 'zig'],
      tune: {
        diveGap: 132,
        divers: 4,
        diveSpeed: 2,
        dust: 0.02,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'glow',
      name: 'PAPER CRANES',
      choreography: 'paper-cranes',
    },
    {
      kind: 'formation',
      name: 'FESTIVAL REMIX',
      layout: 'classic',
      fill: 'edges',
      entrance: [
        { path: 'dropL', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        { path: 'loopL', pair: true, kinds: n(L, 12), at: 0.8, fire: 0.5 },
        { path: 'sideR', pair: true, kinds: n(M, 10), at: 1.8, fire: 0.5 },
        { path: 'hookR', pair: true, kinds: n(M, 10), at: 2.6, fire: 0.5 },
      ],
      dives: ['sweep', 'loop', 'zig', 'swoop'],
      tune: {
        diveGap: 112,
        divers: 4,
        diveSpeed: 2.15,
        dust: 0.024,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'guardian',
      name: 'THE GRAND LANTERN MOTH',
      guardian: 'grand-lantern-moth',
    },
  ],
}

/** The night's zones in order (the Evening, Midnight and Small Hours forks join in later slices). */
export const ZONES: readonly Zone[] = [ROOFTOP_FESTIVAL]

/** Each lap of the night tightens every stage's tuning, up to these limits. */
export const LAP_RAMP = {
  diveGap: { factor: 0.82, limit: 45 },
  divers: { step: 1, limit: 7 },
  diveSpeed: { step: 0.25, limit: 3.2 },
  dust: { factor: 1.3, limit: 0.045 },
} as const

/** A stage's tuning on lap `lap` (1 is the first time through the night). */
export function tuneFor(tune: Tuning, lap: number): Tuning {
  const k = Math.max(0, Math.floor(lap) - 1)
  return {
    diveGap: Math.max(
      LAP_RAMP.diveGap.limit,
      Math.round(tune.diveGap * LAP_RAMP.diveGap.factor ** k),
    ),
    divers: Math.min(
      LAP_RAMP.divers.limit,
      tune.divers + LAP_RAMP.divers.step * k,
    ),
    diveSpeed: Math.min(
      LAP_RAMP.diveSpeed.limit,
      tune.diveSpeed + LAP_RAMP.diveSpeed.step * k,
    ),
    dust: Math.min(LAP_RAMP.dust.limit, tune.dust * LAP_RAMP.dust.factor ** k),
    capture: tune.capture,
  }
}

export type StagePlace = {
  zone: Zone
  zoneIndex: number
  stageIndex: number
  lap: number
  stage: Stage
}

/** Where the night stands at its `index`th stage (0-based): zone, stage in the zone, lap. */
export function stageAt(index: number): StagePlace {
  const perLap = ZONES.reduce((sum, z) => sum + z.stages.length, 0)
  const i = Math.max(0, Math.floor(index))
  const lap = Math.floor(i / perLap) + 1
  let rest = i % perLap
  let zoneIndex = 0
  while (rest >= ZONES[zoneIndex]!.stages.length) {
    rest -= ZONES[zoneIndex]!.stages.length
    zoneIndex++
  }
  const zone = ZONES[zoneIndex]!
  return { zone, zoneIndex, stageIndex: rest, lap, stage: zone.stages[rest]! }
}

// --- Glow Stage choreographies -----------------------------------------------------------------

export type GlowGroup = { path: Pt[]; count: number; at: number }

/**
 * A figure-of-eight weave (a lemniscate of Gerono) across the middle of the sky, entered from
 * `from` and left off a top corner. `flip` starts on the other lobe.
 */
export function figureEight(from: Pt, flip: boolean): Pt[] {
  const cx = W / 2
  const cy = 138
  const ax = 82
  const ay = 52
  const s = flip ? -1 : 1
  const points: Pt[] = [from]
  for (let i = 1; i <= 16; i++) {
    const t = (i / 16) * Math.PI * 2
    points.push({
      x: Math.round(cx + s * ax * Math.sin(t)),
      y: Math.round(cy - ay * Math.sin(t) * Math.cos(t) * 2),
    })
  }
  points.push({ x: cx + s * 40, y: 60 }, { x: s > 0 ? W + 24 : -24, y: 20 })
  return points
}

/** Every Glow Stage flies forty in five groups of eight. */
export const GLOW_CHOREOGRAPHIES: Record<GlowName, GlowGroup[]> = {
  'paper-cranes': [
    { path: figureEight({ x: W / 2, y: -12 }, false), count: 8, at: 0 },
    { path: figureEight({ x: W / 2, y: -12 }, true), count: 8, at: 0.9 },
    { path: figureEight({ x: -12, y: 210 }, false), count: 8, at: 1.8 },
    { path: figureEight({ x: W + 12, y: 210 }, true), count: 8, at: 2.7 },
    { path: figureEight({ x: W / 2, y: -12 }, false), count: 8, at: 3.6 },
  ],
}

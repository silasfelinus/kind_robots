// /utils/arcade/ribbonRiders/fairgrounds.ts
//
// The Lantern Festival Circuit's fairgrounds (conductor kr-arcade/t-075): Boardwalk at Dusk and
// Frostlight Rink. Each is five authored arenas and a Grand Marshal, laid out on the Festival
// Board as a little route map: every path reaches the Marshal, and the side events pay tickets.
// An arena is an ArenaSpec (layout, crew, pickups) plus an objective, a par time and its place on
// the board. Adding an arena is a new entry here, never a branch in the update loop.

import type { MusicLoop } from '../sound'
import type { ArenaSpec, Spawn } from './arenas'
import { GRID, idx } from './grid'
import { BOARDWALK_MUSIC, FROSTLIGHT_MUSIC } from './music'

export type ObjectiveId =
  'last' | 'giftwrap' | 'glowbug' | 'art' | 'taglap' | 'escort'

export type ObjectiveSpec = { name: string; about: string }

export const OBJECTIVES: Record<ObjectiveId | 'marshal', ObjectiveSpec> = {
  last: { name: 'LAST RIDER ROLLING', about: 'BE THE LAST RIDER ROLLING' },
  giftwrap: {
    name: 'GIFT WRAP',
    about: 'WRAP EVERY RIVAL BEFORE TIME RUNS OUT',
  },
  glowbug: {
    name: 'GLOWBUG RUN',
    about: 'COLLECT GLOWBUGS. FIRST TO THE COUNT WINS',
  },
  art: { name: 'RIBBON ART', about: 'TRACE THE GLOWING OUTLINE' },
  taglap: { name: 'TAG LAP', about: 'RIDE THE ARCHES IN ORDER. BEAT THE CREW' },
  escort: {
    name: 'MOON PARADE',
    about: 'KEEP ENEMY RIBBONS OFF THE MOON FLOAT',
  },
  marshal: { name: 'GRAND MARSHAL', about: 'WRAP THE GLOWING HUB' },
}

export type MarshalKind = 'keeper' | 'swan' | 'conductor' | 'loom'

export type Rect = { x: number; y: number; w: number; h: number }

export type FairArena = ArenaSpec & {
  objective: ObjectiveId | 'marshal'
  /** Ticks to finish a timed objective (Gift Wrap, Ribbon Art). */
  limit?: number
  /** Finish inside this many ticks for the par bonus. */
  par: number
  /** Tickets for a clear (before the par and kindness bonuses). */
  tickets: number
  /** How fast and how cunning the crew rides (the Midway's round number). */
  tier: number
  /** Its lantern on the Festival Board, in board pixels. */
  at: readonly [number, number]
  /** The events this one opens on the board. */
  next: readonly string[]
  /** The fairground's special arena (a side event). */
  special?: boolean
  intro: string
  /** Glowbug Run: how many hang in the air at once, and the count that wins. */
  glowbugs?: { lit: number; target: number }
  /** Ribbon Art: the outline's corners (a closed path of straight runs) and the share to trace. */
  art?: { corners: readonly (readonly [number, number])[]; share: number }
  /** Tag Lap: the arches, in order. */
  arches?: readonly Rect[]
  /** Parade Escort: the float crosses this row, surviving this many ribbon hits. */
  escort?: { row: number; health: number }
  marshal?: MarshalKind
}

export type Fairground = {
  id: string
  name: string
  tagline: string
  music: MusicLoop
  /** The board's sky and the strings between its lanterns. */
  sky: readonly [string, string, string]
  string: string
  arenas: readonly FairArena[]
}

const S = 60

/** A Tag Lap's crew lines up on the start line beside the rider, nose up, like a race. */
const START_LINE: readonly Spawn[] = [
  [17, 41, 0],
  [31, 41, 0],
]

// --- Boardwalk at Dusk ---------------------------------------------------------------------------

const BOARDWALK: Fairground = {
  id: 'boardwalk',
  name: 'BOARDWALK AT DUSK',
  tagline: 'LAMPS ON, PIER LOOPS, ONE TURNING CAROUSEL',
  music: BOARDWALK_MUSIC,
  sky: ['#1c0f3a', '#3b1650', '#7a2d5c'],
  string: '#fbbf24',
  arenas: [
    {
      id: 'bw-gate',
      name: 'BOARDWALK GATE',
      floor: 'boardwalk',
      features: [],
      shrink: { every: 420, max: 14 },
      crew: ['roamer', 'cutter'],
      objective: 'last',
      par: S * 40,
      tickets: 3,
      tier: 1,
      at: [144, 222],
      next: ['bw-lamps', 'bw-carousel'],
      intro: 'THE OLD SQUARE, TIGHTER',
    },
    {
      id: 'bw-lamps',
      name: 'LAMPLIGHT PROMENADE',
      floor: 'boardwalk',
      mirror: 'xy',
      features: [
        { kind: 'pillar', x: 10, y: 10 },
        { kind: 'pillar', x: 17, y: 10 },
        { kind: 'pillar', x: 10, y: 17 },
        { kind: 'pillar', x: 17, y: 17 },
      ],
      shrink: { every: 600, max: 8 },
      crew: ['roamer', 'copycat', 'lanternKid'],
      objective: 'giftwrap',
      limit: S * 75,
      par: S * 45,
      tickets: 3,
      tier: 2,
      at: [72, 178],
      next: ['bw-pier', 'bw-glowbug'],
      intro: 'SIXTEEN LAMP POSTS TO WRAP AGAINST',
    },
    {
      id: 'bw-carousel',
      name: 'THE CAROUSEL',
      floor: 'dusk',
      features: [{ kind: 'pillar', x: 23, y: 22, w: 3, h: 3 }],
      carousel: { cx: 24, cy: 23, r: 7, horses: 8, every: 18 },
      shrink: { every: 540, max: 10 },
      crew: ['cutter', 'copycat', 'lanternKid'],
      objective: 'last',
      par: S * 45,
      tickets: 3,
      tier: 3,
      at: [216, 178],
      next: ['bw-pier', 'bw-glowbug'],
      intro: 'MIND THE HORSES. THEY TURN',
    },
    {
      id: 'bw-pier',
      name: "PIER'S END",
      floor: 'pier',
      mirror: 'x',
      features: [{ kind: 'pillar', x: 12, y: 20, w: 2, h: 2 }],
      wrap: { x: true },
      shrink: null,
      crew: ['pacer', 'dasher'],
      rivalSpawns: START_LINE,
      objective: 'taglap',
      par: S * 30,
      tickets: 3,
      tier: 4,
      at: [72, 130],
      next: ['marshal'],
      intro: 'RIDE OFF ONE END, COME IN THE OTHER',
      arches: [
        { x: 21, y: 32, w: 7, h: 1 },
        { x: 21, y: 10, w: 7, h: 1 },
        { x: 44, y: 5, w: 1, h: 9 },
        { x: 4, y: 5, w: 1, h: 9 },
        { x: 1, y: 30, w: 9, h: 1 },
        { x: 14, y: 36, w: 1, h: 10 },
      ],
    },
    {
      id: 'bw-glowbug',
      name: 'GLOWBUG PIER',
      floor: 'pier',
      mirror: 'xy',
      features: [{ kind: 'pillar', x: 14, y: 14, w: 2, h: 2 }],
      wrap: { x: true },
      shrink: null,
      crew: ['lanternKid', 'lanternKid', 'roamer'],
      pickups: { first: S * 6, every: S * 10 },
      objective: 'glowbug',
      glowbugs: { lit: 5, target: 8 },
      par: S * 40,
      tickets: 5,
      tier: 3,
      special: true,
      at: [216, 130],
      next: ['marshal'],
      intro: 'THE LANTERN KIDS RACE YOU FOR THE BUGS',
    },
    {
      id: 'marshal',
      name: 'THE CAROUSEL KEEPER',
      floor: 'dusk',
      features: [],
      shrink: null,
      crew: [],
      pickups: { first: S * 8, every: S * 9, kinds: ['snip', 'spark', 'bow'] },
      objective: 'marshal',
      marshal: 'keeper',
      par: S * 90,
      tickets: 6,
      tier: 4,
      at: [144, 82],
      next: [],
      intro: 'A CAROUSEL ON WHEELS. WRAP ITS PONIES',
    },
  ],
}

// --- Frostlight Rink -----------------------------------------------------------------------------

const FROSTLIGHT: Fairground = {
  id: 'frostlight',
  name: 'FROSTLIGHT RINK',
  tagline: 'ICE SLIDES, SNOWBANKS MELT, ARROWS SPIN YOU',
  music: FROSTLIGHT_MUSIC,
  sky: ['#06142e', '#0e2f5c', '#3d6fa8'],
  string: '#bae6fd',
  arenas: [
    {
      id: 'fr-rink',
      name: 'THE OPEN RINK',
      floor: 'rink',
      features: [{ kind: 'ice', x: 9, y: 9, w: 30, h: 28 }],
      shrink: { every: 520, max: 10 },
      crew: ['snowplow', 'roamer'],
      objective: 'last',
      par: S * 45,
      tickets: 3,
      tier: 5,
      at: [144, 222],
      next: ['fr-banks', 'fr-waltz'],
      intro: 'ON ICE A TURN TAKES ONE MORE CELL',
    },
    {
      id: 'fr-banks',
      name: 'SNOWBANK ALLEY',
      floor: 'frost',
      mirror: 'x',
      features: [
        { kind: 'snow', x: 10, y: 11, w: 2, h: 8 },
        { kind: 'snow', x: 10, y: 28, w: 2, h: 8 },
        { kind: 'snow', x: 19, y: 20, w: 3, h: 3 },
      ],
      shrink: { every: 600, max: 8 },
      crew: ['tandem', 'hugger'],
      objective: 'giftwrap',
      limit: S * 80,
      par: S * 50,
      tickets: 3,
      tier: 5,
      at: [72, 178],
      next: ['fr-pond', 'fr-flake'],
      intro: 'BRUSH A BANK AND IT MELTS',
    },
    {
      id: 'fr-waltz',
      name: 'ARROW WALTZ',
      floor: 'rink',
      mirror: 'rot',
      features: [
        { kind: 'pad', x: 33, y: 20, dir: 2 },
        { kind: 'ice', x: 17, y: 17, w: 7, h: 7 },
      ],
      shrink: null,
      crew: ['pacer', 'snowplow'],
      rivalSpawns: START_LINE,
      objective: 'taglap',
      par: S * 32,
      tickets: 3,
      tier: 6,
      at: [216, 178],
      next: ['fr-pond', 'fr-flake'],
      intro: 'THE ARROWS SPIN YOU. THE ARCHES WAIT',
      arches: [
        { x: 21, y: 33, w: 7, h: 1 },
        { x: 21, y: 14, w: 7, h: 1 },
        { x: 6, y: 6, w: 1, h: 9 },
        { x: 1, y: 31, w: 9, h: 1 },
        { x: 24, y: 42, w: 1, h: 6 },
        { x: 39, y: 30, w: 9, h: 1 },
      ],
    },
    {
      id: 'fr-pond',
      name: 'THE FROZEN POND',
      floor: 'frost',
      mirror: 'xy',
      features: [
        { kind: 'ice', x: 12, y: 12, w: 12, h: 12 },
        { kind: 'snow', x: 21, y: 21, w: 3, h: 3 },
        { kind: 'pillar', x: 6, y: 13, w: 1, h: 1 },
      ],
      shrink: { every: 560, max: 10 },
      crew: ['tandem', 'cutter', 'dasher'],
      objective: 'last',
      par: S * 50,
      tickets: 3,
      tier: 6,
      at: [72, 130],
      next: ['marshal'],
      intro: 'A POND OF ICE ROUND A SNOWY ISLAND',
    },
    {
      id: 'fr-flake',
      name: 'SNOWFLAKE SKATE',
      floor: 'frost',
      features: [],
      shrink: null,
      crew: ['snowplow', 'copycat'],
      objective: 'art',
      limit: S * 70,
      par: S * 40,
      tickets: 5,
      tier: 5,
      special: true,
      at: [216, 130],
      next: ['marshal'],
      intro: 'SKATE THE SNOWFLAKE ON THE ICE',
      art: {
        share: 0.75,
        corners: [
          [21, 10],
          [27, 10],
          [27, 21],
          [38, 21],
          [38, 27],
          [27, 27],
          [27, 38],
          [21, 38],
          [21, 27],
          [10, 27],
          [10, 21],
          [21, 21],
        ],
      },
    },
    {
      id: 'marshal',
      name: 'THE ZAMBONI SWAN',
      floor: 'rink',
      mirror: 'xy',
      features: [{ kind: 'snow', x: 10, y: 16, w: 3, h: 3 }],
      shrink: null,
      crew: [],
      pickups: { first: S * 8, every: S * 9, kinds: ['snip', 'spark', 'bow'] },
      objective: 'marshal',
      marshal: 'swan',
      par: S * 100,
      tickets: 6,
      tier: 6,
      at: [144, 82],
      next: [],
      intro: 'IT ERASES EVERY RIBBON IN ITS WAKE',
    },
  ],
}

const CLOCKWORK: Fairground = {
  id: 'clockwork',
  name: 'CLOCKWORK BAZAAR',
  tagline: 'THE GATES CHIME AS THE MARKET TURNS',
  music: FROSTLIGHT_MUSIC,
  sky: ['#21122f', '#63345c', '#c17a42'],
  string: '#fbbf24',
  arenas: [
    {
      id: 'cb-entrance',
      name: 'TICKTOCK ENTRANCE',
      floor: 'gold',
      features: [{ kind: 'gate', x: 23, y: 18, w: 2, h: 8, every: 4, open: 2 }],
      shrink: { every: 480, max: 10 },
      crew: ['gatekeeper', 'cutter'],
      objective: 'last',
      par: S * 40,
      tickets: 3,
      tier: 7,
      at: [144, 222],
      next: ['cb-stalls', 'cb-clock'],
      intro: 'THE GATE OPENS ON THE BEAT',
    },
    {
      id: 'cb-stalls',
      name: 'MARKET STALLS',
      floor: 'boardwalk',
      features: [
        { kind: 'pillar', x: 13, y: 13, w: 3, h: 3 },
        { kind: 'gate', x: 33, y: 23, every: 6, open: 3 },
        { kind: 'conveyor', x: 20, y: 8, w: 1, h: 29, dir: 1 },
        { kind: 'conveyor', x: 27, y: 8, w: 1, h: 29, dir: 3 },
      ],
      shrink: { every: 480, max: 10 },
      crew: ['hugger', 'dasher'],
      objective: 'giftwrap',
      limit: S * 80,
      par: S * 45,
      tickets: 3,
      tier: 8,
      at: [72, 178],
      next: ['cb-alleys', 'cb-arches'],
      intro: 'BELTS SHIFT YOU EVERY EIGHT CELLS',
    },
    {
      id: 'cb-clock',
      name: 'CLOCK SQUARE',
      floor: 'gold',
      features: [
        { kind: 'gate', x: 18, y: 18, w: 2, h: 10, every: 4, open: 2 },
        {
          kind: 'gate',
          x: 29,
          y: 18,
          w: 2,
          h: 10,
          every: 4,
          open: 2,
          offset: 2,
        },
      ],
      shrink: { every: 480, max: 10 },
      crew: ['gatekeeper', 'pacer'],
      objective: 'last',
      par: S * 50,
      tickets: 3,
      tier: 9,
      at: [216, 178],
      next: ['cb-alleys', 'cb-arches'],
      intro: 'TWO GATES, TWO RHYTHMS',
    },
    {
      id: 'cb-alleys',
      name: 'BELL ALLEY',
      floor: 'violet',
      features: [
        { kind: 'pillar', x: 12, y: 12, w: 2, h: 12 },
        { kind: 'pillar', x: 34, y: 12, w: 2, h: 12 },
        { kind: 'bell', x: 17, y: 27, w: 2, h: 2 },
        { kind: 'bell', x: 29, y: 27, w: 2, h: 2 },
        { kind: 'bell', x: 24, y: 34 },
      ],
      shrink: { every: 480, max: 10 },
      crew: ['sprinter', 'cutter'],
      objective: 'last',
      par: S * 55,
      tickets: 3,
      tier: 10,
      at: [72, 130],
      next: ['marshal'],
      intro: 'RING BELLS: ALL RIBBONS FLARE',
    },
    {
      id: 'cb-arches',
      name: 'ARCHES OF TIME',
      floor: 'gold',
      features: [
        { kind: 'gate', x: 12, y: 20, every: 5, open: 3 },
        { kind: 'gate', x: 35, y: 20, every: 5, open: 3 },
        { kind: 'conveyor', x: 15, y: 8, w: 1, h: 30, dir: 1 },
        { kind: 'conveyor', x: 32, y: 8, w: 1, h: 30, dir: 3 },
        { kind: 'bell', x: 24, y: 24 },
      ],
      shrink: null,
      crew: ['gatekeeper', 'sprinter'],
      rivalSpawns: START_LINE,
      objective: 'taglap',
      par: S * 60,
      tickets: 5,
      tier: 11,
      at: [216, 130],
      next: ['marshal'],
      intro: 'THREE ARCHES BEFORE THE CHIME',
      arches: [
        { x: 21, y: 33, w: 7, h: 1 },
        { x: 21, y: 12, w: 7, h: 1 },
        { x: 6, y: 18, w: 1, h: 8 },
      ],
      special: true,
    },
    {
      id: 'marshal',
      name: 'THE CLOCKWORK CONDUCTOR',
      floor: 'violet',
      features: [
        { kind: 'gate', x: 16, y: 20, every: 4, open: 2 },
        { kind: 'gate', x: 32, y: 20, every: 4, open: 2, offset: 2 },
        { kind: 'conveyor', x: 14, y: 8, w: 1, h: 31, dir: 1 },
        { kind: 'conveyor', x: 33, y: 8, w: 1, h: 31, dir: 3 },
        { kind: 'bell', x: 24, y: 35 },
      ],
      shrink: null,
      crew: [],
      objective: 'marshal',
      marshal: 'conductor',
      par: S * 100,
      tickets: 6,
      tier: 12,
      at: [144, 82],
      next: [],
      intro: 'THE GRAND MARSHAL AWAITS',
    },
  ],
}
const STARLIGHT: Fairground = {
  id: 'starlight',
  name: 'STARLIGHT LOOM',
  tagline: 'THE SKY IS A RIBBON OF STARS',
  music: FROSTLIGHT_MUSIC,
  sky: ['#080e30', '#25205c', '#694aaf'],
  string: '#a5b4fc',
  arenas: [
    {
      id: 'sl-sky',
      name: 'SKY BRIDGE',
      portals: [[[10, 12], [36, 34]], [[37, 12], [11, 34]]],
      ribbonLifetime: S * 6,
      floor: 'violet',
      wrap: { x: true },
      features: [],
      shrink: { every: 420, max: 12 },
      crew: ['glimmer', 'sprinter'],
      objective: 'last',
      par: S * 40,
      tickets: 3,
      tier: 7,
      at: [144, 222],
      next: ['sl-stars', 'sl-mirror'],
      intro: 'PORTALS PAIR. COMET TRAILS FADE.',
    },
    {
      id: 'sl-stars',
      name: 'FALLING STARS',
      portals: [[[9, 18], [38, 29]]],
      floor: 'teal',
      features: [
        { kind: 'pillar', x: 12, y: 12, w: 2, h: 2 },
        { kind: 'pillar', x: 35, y: 35, w: 2, h: 2 },
      ],
      shrink: { every: 480, max: 10 },
      crew: ['glimmer', 'copycat'],
      objective: 'giftwrap',
      limit: S * 85,
      par: S * 45,
      tickets: 3,
      tier: 8,
      at: [72, 178],
      next: ['sl-comets', 'sl-parade'],
      intro: 'WRAP THE STARS',
    },
    {
      id: 'sl-mirror',
      name: 'MIRROR SKY',
      floor: 'violet',
      features: [
        { kind: 'gate', x: 24, y: 18, w: 1, h: 12, every: 6, open: 4 },
      ],
      wrap: { x: true },
      shrink: null,
      crew: ['shieldRider', 'glimmer'],
      objective: 'last',
      par: S * 50,
      tickets: 3,
      tier: 9,
      at: [216, 178],
      next: ['sl-comets', 'sl-parade'],
      intro: 'THE HORIZON WRAPS AROUND',
    },
    {
      id: 'sl-comets',
      name: 'COMET CROSSING',
      portals: [[[8, 12], [39, 34]]],
      ribbonLifetime: S * 6,
      floor: 'teal',
      features: [
        { kind: 'pad', x: 12, y: 24, dir: 1 },
        { kind: 'pad', x: 36, y: 24, dir: 3 },
      ],
      shrink: { every: 420, max: 26, shape: 'spiral' },
      crew: ['sprinter', 'shieldRider'],
      objective: 'last',
      par: S * 55,
      tickets: 3,
      tier: 10,
      at: [72, 130],
      next: ['marshal'],
      intro: 'SPIRAL CLOSES. RIBBONS FADE.',
    },
    {
      id: 'sl-parade',
      name: 'MOONLIGHT PARADE',
      floor: 'violet',
      features: [{ kind: 'pillar', x: 22, y: 22, w: 4, h: 4 }],
      shrink: null,
      crew: ['glimmer', 'sprinter'],
      objective: 'escort',
      limit: S * 75,
      escort: { row: 32, health: 3 },
      par: S * 80,
      tickets: 5,
      tier: 11,
      at: [216, 130],
      next: ['marshal'],
      intro: 'PROTECT THE MOON FLOAT TO THE LAST LANTERN',
      special: true,
    },
    {
      id: 'marshal',
      name: 'THE LOOM SPINNER',
      floor: 'violet',
      portals: [[[8, 14], [39, 33]]],
      wrap: { x: true },
      features: [
        { kind: 'pad', x: 12, y: 24, dir: 1 },
        { kind: 'pad', x: 36, y: 24, dir: 3 },
      ],
      shrink: null,
      crew: [],
      objective: 'marshal',
      marshal: 'loom',
      par: S * 100,
      tickets: 6,
      tier: 12,
      at: [144, 82],
      next: [],
      intro: 'THE GRAND MARSHAL AWAITS',
    },
  ],
}

export const FAIRGROUNDS: readonly Fairground[] = [
  BOARDWALK,
  FROSTLIGHT,
  CLOCKWORK,
  STARLIGHT,
]

/** The Encore reverses the arenas' handedness and raises the crew's pace. */
export function encoreArena(a: FairArena): FairArena {
  const flip = (x: number) => GRID - 1 - x
  const turn = (d: Spawn[2]): Spawn[2] => (d === 1 ? 3 : d === 3 ? 1 : d)
  return {
    ...a,
    tier: a.tier + 4,
    features: a.features.map((f) =>
      f.kind === 'pad'
        ? { ...f, x: flip(f.x), dir: turn(f.dir) }
        : f.kind === 'conveyor'
          ? { ...f, x: GRID - f.x - (f.w ?? 1), dir: turn(f.dir) }
          : { ...f, x: GRID - f.x - (f.w ?? 1) },
    ),
    portals: a.portals?.map(([one, two]) => [[flip(one[0]), one[1]], [flip(two[0]), two[1]]]),
    rivalSpawns: a.rivalSpawns?.map(([x, y, d]): Spawn => [
      flip(x),
      y,
      turn(d),
    ]),
    carousel: a.carousel
      ? { ...a.carousel, cx: flip(a.carousel.cx) }
      : undefined,
    art: a.art
      ? {
          ...a.art,
          corners: a.art.corners.map(([x, y]) => [flip(x), y] as const),
        }
      : undefined,
    arches: a.arches?.map((r) => ({ ...r, x: GRID - r.x - r.w })),
  }
}

/** The hidden fifth fairground is separate from the four standard campaign acts. */
export const SECRET_FAIR_INDEX = FAIRGROUNDS.length

const SPOOL_PHASES = ['keeper', 'swan', 'conductor', 'loom'] as const
const spoolRematches: FairArena[] = FAIRGROUNDS.map((fair, i) => {
  const source = fair.arenas.find((a) => a.marshal)!
  const phase = SPOOL_PHASES[i]!
  return {
    ...encoreArena(source),
    id: `spool-${phase}`,
    name: `ECHO ${i + 1}: ${source.name.replace('THE ', '')}`,
    at: [i % 2 === 0 ? 74 : 214, 218 - Math.floor(i / 2) * 64],
    next: [
      i + 1 < SPOOL_PHASES.length
        ? `spool-${SPOOL_PHASES[i + 1]}`
        : 'spool-itself',
    ],
    intro: 'THE SPOOL REMEMBERS EVERY MARSHAL',
  }
})

export const RAINBOW_SPOOL: Fairground = {
  id: 'rainbow-spool',
  name: 'THE RAINBOW SPOOL',
  tagline: 'FOUR ECHOES. ONE FINAL DUEL.',
  music: FROSTLIGHT_MUSIC,
  sky: ['#140c34', '#442470', '#8b43a6'],
  string: '#f9a8d4',
  arenas: [
    ...spoolRematches,
    {
      id: 'spool-itself',
      name: 'THE SPOOL ITSELF',
      floor: 'violet',
      portals: [[[8, 10], [39, 33]], [[39, 10], [8, 33]]],
      wrap: { x: true },
      ribbonLifetime: S * 6,
      features: [
        { kind: 'snow', x: 12, y: 16, w: 2, h: 3 },
        { kind: 'ice', x: 32, y: 16, w: 5, h: 5 },
        { kind: 'gate', x: 23, y: 18, w: 2, h: 5, every: 4, open: 3 },
        { kind: 'pad', x: 12, y: 30, dir: 1 },
        { kind: 'pad', x: 35, y: 30, dir: 3 },
        { kind: 'conveyor', x: 18, y: 8, w: 1, h: 28, dir: 1 },
        { kind: 'conveyor', x: 29, y: 8, w: 1, h: 28, dir: 3 },
        { kind: 'bell', x: 24, y: 34 },
      ],
      crew: ['cutter', 'snowplow', 'gatekeeper', 'glimmer'],
      shrink: { every: 420, max: 26, shape: 'spiral' },
      objective: 'last',
      par: S * 100,
      tickets: 10,
      tier: 17,
      at: [144, 82],
      next: [],
      intro: 'FOUR COLOURS. ONE RIDER LEFT.',
    },
  ],
}

export function fairgroundAt(index: number): Fairground {
  return index === SECRET_FAIR_INDEX ? RAINBOW_SPOOL : FAIRGROUNDS[index]!
}

export const FIRST_EVENT = 0

export function arenaById(fair: Fairground, id: string): FairArena {
  const a = fair.arenas.find((x) => x.id === id)
  if (!a) throw new Error(`no arena ${id} in ${fair.id}`)
  return a
}

/** Board events open now: the first, and every event a cleared one leads to, not yet cleared. */
export function openEvents(
  fair: Fairground,
  cleared: ReadonlySet<string>,
): string[] {
  const first = fair.arenas[FIRST_EVENT]!.id
  const open = new Set<string>()
  if (!cleared.has(first)) open.add(first)
  for (const a of fair.arenas) {
    if (!cleared.has(a.id)) continue
    for (const n of a.next) if (!cleared.has(n)) open.add(n)
  }
  return fair.arenas.map((a) => a.id).filter((id) => open.has(id))
}

/** Every cell along a closed path of straight runs between corners. */
export function outlineCells(
  corners: readonly (readonly [number, number])[],
): number[] {
  const out = new Set<number>()
  for (let k = 0; k < corners.length; k++) {
    const [ax, ay] = corners[k]!
    const [bx, by] = corners[(k + 1) % corners.length]!
    const sx = Math.sign(bx - ax)
    const sy = Math.sign(by - ay)
    let x = ax
    let y = ay
    out.add(idx(x, y))
    while (x !== bx || y !== by) {
      x += sx
      y += sy
      if (x >= 0 && y >= 0 && x < GRID && y < GRID) out.add(idx(x, y))
    }
  }
  return [...out]
}

/** The cells of an arch. */
export function rectCells(r: Rect): number[] {
  const out: number[] = []
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++)
      if (x >= 0 && y >= 0 && x < GRID && y < GRID) out.push(idx(x, y))
  return out
}

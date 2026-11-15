// /utils/arcade/seedBurst/plots.ts
//
// Seed Burst's plots as data (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24,
// slice 1). A plot replaces the old SEED_CURVES as the source of difficulty: its hedge mask, its
// gimmick tiles and its grump script. Hedges marked '?' still roll from the seeded rng, so replays
// differ while the shape stays designed. Every plot hides a Garden Gate and one golden seed under
// its hedges (the cabinet picks which), plus a seed packet for each variety it offers.
//
// Mask legend (15 x 13, the garden wall included):
//   '#' stone (the wall and the pillars)     '.' always open ground
//   'H' always a hedge                       '?' a hedge when the plot's density roll says so
//   'C' the compost heap: the gate bell calls grumps out of it, and seed thieves bury loot there
// The four corners and the tiles beside them are always cleared for the gardeners.
//
// After the last plot the list loops: each lap the grumps quicken and one more gnat joins in.

import type { Variety } from './pouch'

export const PLOT_COLS = 15
export const PLOT_ROWS = 13

export type GrumpKind =
  | 'gnat'
  | 'drifter'
  | 'sniffer'
  | 'slug'
  | 'mole'
  | 'hopper'
  | 'bully'
  | 'thief'
  | 'puffball'
  | 'spore'

/** How many of each grump a plot starts with (spores only ever come out of puffballs). */
export type GrumpScript = Partial<Record<Exclude<GrumpKind, 'spore'>, number>>

export type PlotData = {
  id: string
  name: string
  /** The line under the plot's title card: what is new here. */
  intro: string
  mask: readonly string[]
  /** Share of '?' tiles that grow a hedge. */
  density: number
  /** Grump speed in pixels per tick before each kind's own pace. */
  speed: number
  grumps: GrumpScript
  /** The three grumps the gate bell calls out of the compost heap. */
  bell: readonly [GrumpKind, GrumpKind, GrumpKind]
  /** Seed packets hidden in this plot's hedges, one per variety. */
  offers: readonly Variety[]
  /** Share of the other hedges hiding a seed packet, fertiliser or quick boots. */
  powers: number
  /** Seconds before the Grumble Cloud rolls in. */
  time: number
}

export const PLOTS: readonly PlotData[] = [
  {
    id: 'potting-path',
    name: 'THE POTTING PATH',
    intro: 'FIND THE GARDEN GATE',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#?????...?????#',
      '#?#?#?#.#?#?#?#',
      '#????.....????#',
      '#?#?#..C..#?#?#',
      '#????.....????#',
      '#?#?#?#.#?#?#?#',
      '#?????...?????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.42,
    speed: 0.5,
    grumps: { gnat: 3 },
    bell: ['gnat', 'gnat', 'gnat'],
    offers: ['clover'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'lettuce-rows',
    name: 'THE LETTUCE ROWS',
    intro: 'SULKY SLUG: BLOOM IT TWICE',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#HHH?HHHHH?HHH#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '#?#?#?#C#?#?#?#',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#HHH?HHHHH?HHH#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.4,
    speed: 0.52,
    grumps: { gnat: 2, slug: 2 },
    bell: ['gnat', 'slug', 'gnat'],
    offers: ['bramble'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'molehill-patch',
    name: 'MOLEHILL PATCH',
    intro: 'BURROW MOLE: PLANT ON ITS MOUND',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#???.......???#',
      '#?#?#.#.#.#?#?#',
      '#???.......???#',
      '#?#?#.#C#.#?#?#',
      '#???.......???#',
      '#?#?#.#.#.#?#?#',
      '#???.......???#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.42,
    speed: 0.54,
    grumps: { gnat: 2, sniffer: 1, mole: 2 },
    bell: ['gnat', 'mole', 'gnat'],
    offers: ['pumpkin'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'hopscotch-hedges',
    name: 'HOPSCOTCH HEDGES',
    intro: 'HEDGE HOPPER: BLOOM WHERE IT LANDS',
    mask: [
      '###############',
      '#?????????????#',
      '#?#H#?#?#?#H#?#',
      '#?H?H?????H?H?#',
      '#?#?#?#H#?#?#?#',
      '#?????H?H?????#',
      '#?#?#?#C#?#?#?#',
      '#?????H?H?????#',
      '#?#?#?#H#?#?#?#',
      '#?H?H?????H?H?#',
      '#?#H#?#?#?#H#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.5,
    speed: 0.56,
    grumps: { gnat: 2, drifter: 1, hopper: 2 },
    bell: ['hopper', 'gnat', 'gnat'],
    offers: ['dandelion'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'bully-lane',
    name: 'BULLY LANE',
    intro: 'BUZZ BULLY: STEP OUT OF ITS LANE',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#.#?#?#?#',
      '#??????.??????#',
      '#?#?#?#.#?#?#?#',
      '#.............#',
      '#?#?#?#C#?#?#?#',
      '#.............#',
      '#?#?#?#.#?#?#?#',
      '#??????.??????#',
      '#?#?#?#.#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.45,
    speed: 0.58,
    grumps: { gnat: 2, sniffer: 1, bully: 2 },
    bell: ['bully', 'gnat', 'gnat'],
    offers: ['puffcap'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'thieves-corner',
    name: "THIEVES' CORNER",
    intro: 'SEED THIEF: BLOOM IT TO DROP THE LOOT',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#?????HHH?????#',
      '#?#?#?#?#?#?#?#',
      '#???H?????H???#',
      '#?#?#?#?#?#?#?#',
      '#???H?????H???#',
      '#?#?#?#?#?#?#?#',
      '#?????.C.?????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.48,
    speed: 0.6,
    grumps: { gnat: 2, sniffer: 1, thief: 2 },
    bell: ['thief', 'gnat', 'gnat'],
    offers: ['clover', 'pumpkin'],
    powers: 0.3,
    time: 150,
  },
  {
    id: 'puffball-meadow',
    name: 'PUFFBALL MEADOW',
    intro: 'PUFFBALL: PLANT WHERE THE SPORES LAND',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#??????.??????#',
      '#?#?#?...?#?#?#',
      '#????.....????#',
      '#?#?...C...?#?#',
      '#????.....????#',
      '#?#?#?...?#?#?#',
      '#??????.??????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.48,
    speed: 0.6,
    grumps: { gnat: 1, drifter: 1, puffball: 3 },
    bell: ['puffball', 'gnat', 'gnat'],
    offers: ['bramble', 'dandelion'],
    powers: 0.22,
    time: 150,
  },
  {
    id: 'grumpy-glade',
    name: 'THE GRUMPY GLADE',
    intro: 'EVERY GRUMP AT ONCE',
    mask: [
      '###############',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#?????H.H?????#',
      '#?#?#?.C.?#?#?#',
      '#?????H.H?????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '#?#?#?#?#?#?#?#',
      '#?????????????#',
      '###############',
    ],
    density: 0.5,
    speed: 0.62,
    grumps: {
      gnat: 1,
      drifter: 1,
      sniffer: 1,
      slug: 1,
      mole: 1,
      hopper: 1,
      bully: 1,
      thief: 1,
      puffball: 1,
    },
    bell: ['bully', 'hopper', 'puffball'],
    offers: ['puffcap'],
    powers: 0.25,
    time: 150,
  },
]

/** Each lap round the plot list quickens the grumps by this much, up to LOOP_SPEED_MAX. */
export const LOOP_SPEED_STEP = 0.1
export const LOOP_SPEED_MAX = 1.6
/** Each lap adds one more gnat, up to this many. */
export const LOOP_GNATS_MAX = 4

export type PlotPlan = {
  plot: PlotData
  /** How many times the list has looped (0 on the first pass). */
  loop: number
  /** Grump speed in pixels per tick for this visit. */
  speed: number
  /** The grumps to place, in spawn order. */
  roster: Exclude<GrumpKind, 'spore'>[]
}

const SCRIPT_ORDER: readonly Exclude<GrumpKind, 'spore'>[] = [
  'drifter',
  'slug',
  'mole',
  'hopper',
  'bully',
  'thief',
  'puffball',
  'sniffer',
  'gnat',
]

/** The plot for the n-th plot of a run (0-based), with its lap's speed and roster. */
export function planPlot(index: number): PlotPlan {
  const plot = PLOTS[index % PLOTS.length]!
  const loop = Math.floor(index / PLOTS.length)
  const roster: Exclude<GrumpKind, 'spore'>[] = []
  for (const kind of SCRIPT_ORDER) {
    const extra = kind === 'gnat' ? Math.min(LOOP_GNATS_MAX, loop) : 0
    for (let i = 0; i < (plot.grumps[kind] ?? 0) + extra; i++) roster.push(kind)
  }
  return {
    plot,
    loop,
    speed: plot.speed * Math.min(LOOP_SPEED_MAX, 1 + LOOP_SPEED_STEP * loop),
    roster,
  }
}

export type ParsedMask = {
  stone: readonly boolean[]
  /** 'H' tiles: always a hedge. */
  hedge: readonly boolean[]
  /** '?' tiles: a hedge when the density roll says so. */
  maybe: readonly boolean[]
  /** The compost heap's tile key (y * PLOT_COLS + x). */
  heap: number
}

export function parseMask(mask: readonly string[]): ParsedMask {
  const stone: boolean[] = []
  const hedge: boolean[] = []
  const maybe: boolean[] = []
  let heap = -1
  for (let y = 0; y < PLOT_ROWS; y++)
    for (let x = 0; x < PLOT_COLS; x++) {
      const ch = mask[y]?.[x] ?? '#'
      const edge =
        x === 0 || y === 0 || x === PLOT_COLS - 1 || y === PLOT_ROWS - 1
      stone.push(edge || ch === '#')
      hedge.push(!edge && ch === 'H')
      maybe.push(!edge && ch === '?')
      if (ch === 'C') heap = y * PLOT_COLS + x
    }
  return { stone, hedge, maybe, heap }
}

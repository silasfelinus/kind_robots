// /utils/arcade/seedBurst/plots.ts
//
// Seed Burst's campaign as data (conductor kr-arcade/t-136 and t-137, depth-pass CABINETS.md
// section 24). The Four Seasons Allotment is played a season at a time. Each season has six plots,
// a Bonus Bed after plot 3 and a boss plot at the end; the Potting Shed opens between seasons.
// Slice 2 authors Spring (the Kitchen Allotment) and Summer (the Glasshouse Rows); after the last
// authored season the campaign laps round, each lap quicker with one more gnat per plot.
//
// A plot is its hedge mask, its gimmick tiles and its grump script. Hedges marked '?' still roll
// from the seeded rng, so replays differ while the shape stays designed. Every ordinary plot hides
// a Garden Gate and one golden seed under its hedges (the cabinet picks which), plus a seed packet
// for each variety it offers.
//
// Mask legend (15 x 13, the garden wall included):
//   '#' stone (the wall and the pillars)     '.' always open ground
//   'H' always a hedge                       '?' a hedge when the plot's density roll says so
//   'C' the compost heap: the gate bell calls grumps out of it, and seed thieves bury loot there
//   'W' a watering can: bloom it to soak its row, and the next bloom along that row reaches twice
//       as far
//   '<' '>' '^' 'v' an irrigation channel flowing that way: it carries pods, gardeners and grumps
//   'G' a glass pane: the first bloom cracks it, a second one shatters it
//   'M' a springy mushroom: step on it and it bounces you two tiles on, over whatever is between
//   'V' a valve on Hothouse Hector's pipes: bloom all four to vent him
// A plot with `regrow` grows its hedges back: a cleared hedge leaves a stump that sprouts back
// after twenty seconds unless a second bloom digs it out.
// The four corners and the tiles beside them are always cleared for the gardeners.

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
  | 'caterpillar'

/** How many of each grump a plot starts with (spores only ever come out of puffballs). */
export type GrumpScript = Partial<
  Record<Exclude<GrumpKind, 'spore' | 'caterpillar'>, number>
>

export type BonusKind = 'butterfly-release' | 'sprinkler-dash'
export type BossKind = 'bramblebeard' | 'hector'

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
  /** Seconds before the Grumble Cloud rolls in (a Bonus Bed's whole length). */
  time: number
  /** Cleared hedges leave stumps that grow back. */
  regrow?: boolean
  /** A Bonus Bed: no gate, no grumps, a short game of its own. */
  bonus?: BonusKind
  /** A boss plot: no gate; the boss is the plot. */
  boss?: BossKind
}

export type SeasonId = 'spring' | 'summer'

export type SeasonData = {
  id: SeasonId
  /** The season's word on its title card ("SPRING"). */
  name: string
  /** The place ("THE KITCHEN ALLOTMENT"). */
  title: string
  /** The title card's line about what grows here. */
  tagline: string
  plots: readonly PlotData[]
  bonus: PlotData
  boss: PlotData
}

const STANDARD_BELL: readonly [GrumpKind, GrumpKind, GrumpKind] = [
  'gnat',
  'gnat',
  'gnat',
]

const SPRING: SeasonData = {
  id: 'spring',
  name: 'SPRING',
  title: 'THE KITCHEN ALLOTMENT',
  tagline: 'HEDGES REGROW - TIP THE WATERING CANS',
  plots: [
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
      bell: STANDARD_BELL,
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
        '#??W??????????#',
        '#?#?#?#C#?#?#?#',
        '#??????????W??#',
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
      regrow: true,
    },
    {
      id: 'molehill-patch',
      name: 'MOLEHILL PATCH',
      intro: 'BURROW MOLE: PLANT ON ITS MOUND',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#???...W...???#',
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
      regrow: true,
    },
    {
      id: 'bean-poles',
      name: 'THE BEAN POLES',
      intro: 'DRIFTERS SLIP THROUGH THE POLES',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#??H???W???H??#',
        '#?#H#?#?#?#H#?#',
        '#??H???????H??#',
        '#?#?#?#C#?#?#?#',
        '#??H???????H??#',
        '#?#H#?#?#?#H#?#',
        '#??H???W???H??#',
        '#?#?#?#?#?#?#?#',
        '#?????????????#',
        '###############',
      ],
      density: 0.45,
      speed: 0.56,
      grumps: { gnat: 1, drifter: 2, sniffer: 1, slug: 1 },
      bell: ['slug', 'gnat', 'drifter'],
      offers: ['dandelion'],
      powers: 0.22,
      time: 150,
      regrow: true,
    },
    {
      id: 'carrot-tops',
      name: 'THE CARROT TOPS',
      intro: 'MOLES UNDER EVERY ROW',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#?????W.W?????#',
        '#?#?#?#.#?#?#?#',
        '#???.......???#',
        '#?#?#?#C#?#?#?#',
        '#???.......???#',
        '#?#?#?#.#?#?#?#',
        '#?????W.W?????#',
        '#?#?#?#?#?#?#?#',
        '#?????????????#',
        '###############',
      ],
      density: 0.44,
      speed: 0.58,
      grumps: { gnat: 2, sniffer: 1, mole: 2 },
      bell: ['mole', 'gnat', 'gnat'],
      offers: ['bramble'],
      powers: 0.22,
      time: 150,
      regrow: true,
    },
    {
      id: 'compost-corner',
      name: 'THE COMPOST CORNER',
      intro: 'THE WHOLE SPRING CROWD',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#???W?????W???#',
        '#?#?#?#?#?#?#?#',
        '#?????HHH?????#',
        '#?#?#?#?#?#?#?#',
        '#?????.C.?????#',
        '#?#?#?#?#?#?#?#',
        '#???W?????W???#',
        '#?#?#?#?#?#?#?#',
        '#?????????????#',
        '###############',
      ],
      density: 0.5,
      speed: 0.6,
      grumps: { gnat: 1, drifter: 1, sniffer: 1, slug: 1, mole: 1 },
      bell: ['slug', 'mole', 'drifter'],
      offers: ['pumpkin'],
      powers: 0.25,
      time: 150,
      regrow: true,
    },
  ],
  bonus: {
    id: 'butterfly-release',
    name: 'BUTTERFLY RELEASE',
    intro: 'BLOOM THE CATERPILLARS - CHAINS DOUBLE',
    mask: [
      '###############',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '###############',
    ],
    density: 0,
    speed: 0.4,
    grumps: {},
    bell: STANDARD_BELL,
    offers: [],
    powers: 0,
    time: 30,
    bonus: 'butterfly-release',
  },
  boss: {
    id: 'bramblebeard',
    name: 'OLD BRAMBLEBEARD',
    intro: 'BLOOM THE GLOWING ROOTS',
    mask: [
      '###############',
      '#.............#',
      '#.#.........#.#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.#.........#.#',
      '#.............#',
      '###############',
    ],
    density: 0,
    speed: 0.55,
    grumps: {},
    bell: STANDARD_BELL,
    offers: [],
    powers: 0,
    time: 180,
    boss: 'bramblebeard',
  },
}

const SUMMER: SeasonData = {
  id: 'summer',
  name: 'SUMMER',
  title: 'THE GLASSHOUSE ROWS',
  tagline: 'RIDE THE CHANNELS - MIND THE GLASS',
  plots: [
    {
      id: 'hopscotch-hedges',
      name: 'HOPSCOTCH HEDGES',
      intro: 'HEDGE HOPPER: BLOOM WHERE IT LANDS',
      mask: [
        '###############',
        '#?????????????#',
        '#?#H#?#?#?#H#?#',
        '#?H?H??M??H?H?#',
        '#?#?#?#H#?#?#?#',
        '#?????H?H?????#',
        '#?#?#?#C#?#?#?#',
        '#?????H?H?????#',
        '#?#?#?#H#?#?#?#',
        '#?H?H??M??H?H?#',
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
        '#>>>>>>.<<<<<<#',
        '#?#?#?#C#?#?#?#',
        '#<<<<<<.>>>>>>#',
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
        '#?????GGG?????#',
        '#?#?#?#?#?#?#?#',
        '#???G?????G???#',
        '#?#?#?#?#?#?#?#',
        '#???G?????G???#',
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
        '#??????M??????#',
        '#?#?#?...?#?#?#',
        '#???G.....G???#',
        '#?#?...C...?#?#',
        '#???G.....G???#',
        '#?#?#?...?#?#?#',
        '#??????M??????#',
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
      id: 'seedling-benches',
      name: 'THE SEEDLING BENCHES',
      intro: 'THE CHANNEL CARRIES YOUR PODS',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#v#?#?#?#',
        '#?GGG??v??GGG?#',
        '#?#?#?#v#?#?#?#',
        '#?????>v<?????#',
        '#?#?#?#C#?#?#?#',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#?GGG?????GGG?#',
        '#?#?#?#?#?#?#?#',
        '#?????????????#',
        '###############',
      ],
      density: 0.45,
      speed: 0.62,
      grumps: { gnat: 1, sniffer: 1, hopper: 1, bully: 1, thief: 1 },
      bell: ['thief', 'hopper', 'gnat'],
      offers: ['puffcap'],
      powers: 0.25,
      time: 150,
    },
    {
      id: 'grumpy-glade',
      name: 'THE GRUMPY GLADE',
      intro: 'THE WHOLE SUMMER CROWD',
      mask: [
        '###############',
        '#?????????????#',
        '#?#?#?#?#?#?#?#',
        '#???M?????M???#',
        '#?#?#?#?#?#?#?#',
        '#?????G.G?????#',
        '#?#?#?.C.?#?#?#',
        '#?????G.G?????#',
        '#?#?#?#?#?#?#?#',
        '#>>>>>...<<<<<#',
        '#?#?#?#?#?#?#?#',
        '#?????????????#',
        '###############',
      ],
      density: 0.5,
      speed: 0.62,
      grumps: {
        gnat: 1,
        drifter: 1,
        hopper: 1,
        bully: 1,
        thief: 1,
        puffball: 1,
      },
      bell: ['bully', 'hopper', 'puffball'],
      offers: ['clover'],
      powers: 0.25,
      time: 150,
    },
  ],
  bonus: {
    id: 'sprinkler-dash',
    name: 'SPRINKLER DASH',
    intro: 'GRAB THE SEEDS BEFORE THEY FALL OFF',
    mask: [
      '###############',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#.>>>>>>>>>>>.#',
      '#.#.#.#.#.#.#.#',
      '#.<<<<<<<<<<<.#',
      '#.#.#.#.#.#.#.#',
      '#.>>>>>>>>>>>.#',
      '#.#.#.#.#.#.#.#',
      '#.<<<<<<<<<<<.#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '###############',
    ],
    density: 0,
    speed: 0.4,
    grumps: {},
    bell: STANDARD_BELL,
    offers: [],
    powers: 0,
    time: 30,
    bonus: 'sprinkler-dash',
  },
  boss: {
    id: 'hector',
    name: 'HOTHOUSE HECTOR',
    intro: 'BLOOM THE FOUR VALVES TO VENT HIM',
    mask: [
      '###############',
      '#.............#',
      '#.#.#.#.#.#.#.#',
      '#..V...v...V..#',
      '#.#.#.#v#.#.#.#',
      '#......v......#',
      '#.#.#.#v#.#.#.#',
      '#......v......#',
      '#.#.#.#v#.#.#.#',
      '#..V>>>.<<<V..#',
      '#.#.#.#.#.#.#.#',
      '#.............#',
      '###############',
    ],
    density: 0,
    speed: 0.55,
    grumps: {},
    bell: STANDARD_BELL,
    offers: [],
    powers: 0,
    time: 180,
    boss: 'hector',
  },
}

export const SEASONS: readonly SeasonData[] = [SPRING, SUMMER]

/** Every ordinary (gated) plot of the campaign, season by season. */
export const PLOTS: readonly PlotData[] = SEASONS.flatMap((s) => s.plots)

/** A season's steps: three plots, the Bonus Bed, three plots, the boss. */
export const STEPS_PER_SEASON = 8

/** Each lap round the campaign quickens the grumps by this much, up to LOOP_SPEED_MAX. */
export const LOOP_SPEED_STEP = 0.1
export const LOOP_SPEED_MAX = 1.6
/** Each lap adds one more gnat to every gated plot, up to this many. */
export const LOOP_GNATS_MAX = 4

export type PlotPlan = {
  plot: PlotData
  /** How many times the campaign has lapped (0 on the first pass). */
  loop: number
  /** Grump speed in pixels per tick for this visit. */
  speed: number
  /** The grumps to place, in spawn order. */
  roster: Exclude<GrumpKind, 'spore' | 'caterpillar'>[]
}

const SCRIPT_ORDER: readonly Exclude<GrumpKind, 'spore' | 'caterpillar'>[] = [
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

/** A plot's plan on lap `loop`: its speed and roster. */
export function planPlot(plot: PlotData, loop = 0): PlotPlan {
  const gated = !plot.bonus && !plot.boss
  const roster: PlotPlan['roster'] = []
  for (const kind of SCRIPT_ORDER) {
    const extra = kind === 'gnat' && gated ? Math.min(LOOP_GNATS_MAX, loop) : 0
    for (let i = 0; i < (plot.grumps[kind] ?? 0) + extra; i++) roster.push(kind)
  }
  return {
    plot,
    loop,
    speed: plot.speed * Math.min(LOOP_SPEED_MAX, 1 + LOOP_SPEED_STEP * loop),
    roster,
  }
}

export type CampaignStep = {
  index: number
  season: SeasonData
  /** Seasons played before this one, laps included (0 for the first Spring). */
  seasonNumber: number
  /** 0..7 within the season: plots 0-2, the Bonus Bed (3), plots 4-6, the boss (7). */
  inSeason: number
  lap: number
  kind: 'plot' | 'bonus' | 'boss'
  plan: PlotPlan
}

/** The campaign's step `index` (0-based), lapping after the last season. */
export function campaignStep(index: number): CampaignStep {
  const seasonNumber = Math.floor(index / STEPS_PER_SEASON)
  const season = SEASONS[seasonNumber % SEASONS.length]!
  const lap = Math.floor(seasonNumber / SEASONS.length)
  const inSeason = index % STEPS_PER_SEASON
  const kind = inSeason === 3 ? 'bonus' : inSeason === 7 ? 'boss' : 'plot'
  const plot =
    kind === 'bonus'
      ? season.bonus
      : kind === 'boss'
        ? season.boss
        : season.plots[inSeason < 3 ? inSeason : inSeason - 1]!
  return {
    index,
    season,
    seasonNumber,
    inSeason,
    lap,
    kind,
    plan: planPlot(plot, lap),
  }
}

export type ParsedMask = {
  stone: readonly boolean[]
  /** 'H' tiles: always a hedge. */
  hedge: readonly boolean[]
  /** '?' tiles: a hedge when the density roll says so. */
  maybe: readonly boolean[]
  /** The compost heap's tile key (y * PLOT_COLS + x), or -1. */
  heap: number
  cans: readonly number[]
  glass: readonly number[]
  mushrooms: readonly number[]
  valves: readonly number[]
  /** Irrigation channels by tile key, with the way each one flows. */
  channels: ReadonlyMap<number, { dx: number; dy: number }>
}

const FLOWS: Record<string, { dx: number; dy: number }> = {
  '<': { dx: -1, dy: 0 },
  '>': { dx: 1, dy: 0 },
  '^': { dx: 0, dy: -1 },
  v: { dx: 0, dy: 1 },
}

export function parseMask(mask: readonly string[]): ParsedMask {
  const stone: boolean[] = []
  const hedge: boolean[] = []
  const maybe: boolean[] = []
  const cans: number[] = []
  const glass: number[] = []
  const mushrooms: number[] = []
  const valves: number[] = []
  const channels = new Map<number, { dx: number; dy: number }>()
  let heap = -1
  for (let y = 0; y < PLOT_ROWS; y++)
    for (let x = 0; x < PLOT_COLS; x++) {
      const k = y * PLOT_COLS + x
      const ch = mask[y]?.[x] ?? '#'
      const edge =
        x === 0 || y === 0 || x === PLOT_COLS - 1 || y === PLOT_ROWS - 1
      stone.push(edge || ch === '#')
      hedge.push(!edge && ch === 'H')
      maybe.push(!edge && ch === '?')
      if (edge) continue
      if (ch === 'C') heap = k
      else if (ch === 'W') cans.push(k)
      else if (ch === 'G') glass.push(k)
      else if (ch === 'M') mushrooms.push(k)
      else if (ch === 'V') valves.push(k)
      else if (FLOWS[ch]) channels.set(k, FLOWS[ch]!)
    }
  return { stone, hedge, maybe, heap, cans, glass, mushrooms, valves, channels }
}

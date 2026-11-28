// /utils/arcade/games/glitchGardenGardens.ts
//
// Glitch Garden's gardens as data (conductor kr-arcade/t-088, t-089). A garden is an authored
// layout (lamps, sprinkler cans, fruit trees, sunflower walls and the maze's exit) and a run of
// five waves; a wave says how the worm comes (body length, loose heads, speed), which other foes
// join it, how many fresh cans are planted and, on the special wave, the objective. The campaign
// strings the gardens together with their season bosses and the Compost Shed between gardens. The
// update loop reads these and never branches on a wave number.
//
// Spring and Summer (slice 2) are the first four gardens. Once Summer's boss is fixed the glitch
// grows back: the year starts over one lap harder (faster worms, more heads, a hungrier beetle),
// so the campaign never goes flat. Autumn and Winter (slice 3) slot in before that lap.

/** Layout letters; anything else is open lawn. */
export const LAYOUT_LAMP = 'o'
export const LAYOUT_CAN = 'C'
/** A fruit tree: a wall the worm turns at and the beam cannot pass; it drops apples. */
export const LAYOUT_TREE = 'T'
/** A tall sunflower: a wall the worm follows; the beam slips between the stalks. */
export const LAYOUT_SUNFLOWER = 'S'
/** A gap in the sunflower maze: a worm that finds it drops through. */
export const LAYOUT_EXIT = 'E'
/** Leaves cover targets and soak a beam before a gust shuffles them. */
export const LAYOUT_LEAF = 'L'
/** A pumpkin patch grows two-cell obstacles from these authored seed positions. */
export const LAYOUT_PUMPKIN = 'P'
/** A winter heater: spray to thaw frozen lamps within three cells. */
export const LAYOUT_HEATER = 'H'

type ObjectiveText = { title: string; hint: string; bonus: number }
export type GardenObjective =
  /** Bloom at least one flower in each marked lane (column) before the wave is fixed. */
  | (ObjectiveText & { kind: 'bloom-lanes'; lanes: readonly number[] })
  /** Catch this many falling apples before the wave is fixed. */
  | (ObjectiveText & { kind: 'catch-apples'; count: number })
  /** Fix every worm before any of them drops through the maze exit. */
  | (ObjectiveText & { kind: 'maze-exit' })
  /** See this many bee bots safely across, spraying none of them. */
  | (ObjectiveText & { kind: 'escort-bees'; count: number })
  /** Clear the autumn leaf piles from the flowerbed. */
  | (ObjectiveText & { kind: 'clear-leaves'; count: number })
  /** Crack the oversized rolling pumpkin before fixing the wave. */
  | (ObjectiveText & { kind: 'great-pumpkin' })
  /** Bring every heater online before the winter wave ends. */
  | (ObjectiveText & { kind: 'warm-heaters'; count: number })
  /** Shrink and fix this many rolling snowballs before the worm is finished. */
  | (ObjectiveText & { kind: 'snow-day'; count: number })

export type GardenWave = {
  /** Segments in the main glitch-worm, head included. */
  segments: number
  /** Loose one-segment heads that come with it. */
  heads: number
  /** Pixels per tick (fractions accumulate, so 1.5 really is half again as fast as 1). */
  speed: number
  /** Ticks between beetle runs, or null for none this wave. */
  beetleEvery: number | null
  moth: boolean
  snail: boolean
  /** Side-crawlers join a worm that lingers in the bed. */
  crawlers: boolean
  /** Fresh sprinkler cans planted near the top as the wave starts. */
  cans: number
  /** Dragonfly bots on the lawn at once (0 for none). */
  dragonflies: number
  /** Bee bots per flight (0 for none), and whether a wasp-glitch hides among them. */
  bees: number
  wasp: boolean
  /** Movable leaf piles that soak one shot each, in autumn gardens. */
  leaves: number
  /** Seeded pumpkins, rolling pumpkin foes and slow-down inchworms. */
  pumpkins: number
  rollers: number
  inchworms: number
  /** Number of lamps that begin this wave under ice. */
  frost: number
  snowballs: number
  /** A timed underground ambusher that erupts beneath the sprayer. */
  mole: boolean
  sub: string
  objective?: GardenObjective
}

export type BossId =
  'queen-wiggle' | 'mow-bot' | 'gourd-hydra' | 'frost-millipede' | 'root-kernel'

export type Boss = {
  id: BossId
  name: string
  sub: string
  /** Shown when it is fixed. */
  thanks: string
  bonus: number
}

export const BOSSES: Record<BossId, Boss> = {
  'queen-wiggle': {
    id: 'queen-wiggle',
    name: 'QUEEN WIGGLE',
    sub: 'SPRAY HER BRIGHT JOINTS',
    thanks: 'THE QUEEN WIGGLES KINDLY HOME',
    bonus: 10_000,
  },
  'mow-bot': {
    id: 'mow-bot',
    name: 'MOW-BOT 3000',
    sub: 'FIX ITS THREE FUEL CAPS',
    thanks: 'MOW-BOT PARKS AND TIDIES UP',
    bonus: 12_000,
  },
  'gourd-hydra': {
    id: 'gourd-hydra',
    name: 'THE GOURD HYDRA',
    sub: 'SHINE ON THE LIT PUMPKIN HEAD',
    thanks: 'THREE FRIENDLY VINES TAKE ROOT',
    bonus: 15_000,
  },
  'frost-millipede': {
    id: 'frost-millipede',
    name: 'THE FROST MILLIPEDE',
    sub: 'LIGHT HEATERS • THAW • SPRAY',
    thanks: 'THE WINTER GARDEN THAWS',
    bonus: 18_000,
  },
  'root-kernel': {
    id: 'root-kernel',
    name: 'THE ROOT KERNEL',
    sub: 'FOLLOW ALL FOUR PRISM COLOURS',
    thanks: 'THE WHOLE GARDEN BLOOMS',
    bonus: 25_000,
  },
}

export type Garden = {
  id: string
  name: string
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'midnight'
  /** The title card: what the garden does and who is new. */
  intro: readonly [string, string]
  /** One string per row, one letter per cell (30 x 36). */
  layout: readonly string[]
  /** Rows of drifting lily pads: odd entries drift right, even ones left. */
  /** The sprayer coasts after releasing a direction on frozen soil. */
  icyBed?: boolean
  pondRows?: readonly number[]
  /** Ticks between apples falling from the garden's trees. */
  appleEvery?: number
  waves: readonly GardenWave[]
  /** The season boss fought once this garden's five waves are done. */
  boss?: BossId
}

export const MAX_HEADS = 7
export const MIN_BODY = 6
export const MIN_BEETLE_EVERY = 300
export const MAX_SPEED = 3.5

/** A wave from the parts that change, with every foe off unless named. */
function wave(
  parts: Pick<GardenWave, 'segments' | 'heads' | 'speed' | 'sub'> &
    Partial<GardenWave>,
): GardenWave {
  return {
    beetleEvery: null,
    moth: false,
    snail: false,
    crawlers: false,
    cans: 0,
    dragonflies: 0,
    bees: 0,
    wasp: false,
    leaves: 0,
    pumpkins: 0,
    rollers: 0,
    inchworms: 0,
    frost: 0,
    snowballs: 0,
    mole: false,
    ...parts,
  }
}

/**
 * Spring 1, the Kitchen Plot: the old lawn, planted in tidy staggered rows with open lanes
 * between them, three sprinkler cans in the middle beds, and the flowerbed left clear.
 */
export const KITCHEN_PLOT: Garden = {
  id: 'kitchen-plot',
  name: 'KITCHEN PLOT',
  season: 'spring',
  intro: ['BLOOMED FLOWERS POWER YOUR BEAM', 'NEW: THE SLIME SNAIL'],
  layout: [
    '..............................',
    '..............................',
    '...o.......o......o.......o...',
    '..............................',
    '.......o.......o......o.......',
    '..............................',
    '.o.........o.......o........o.',
    '..............................',
    '.....o........o.........o.....',
    '..............................',
    '...o.....o........o.......o...',
    '..............................',
    '........C....o.......o........',
    '..............................',
    '.o.........o.....o.........o..',
    '..............C...............',
    '.....o.................o......',
    '..............................',
    '...o..........o.....o.....o...',
    '.........................C....',
    '........o........o............',
    '..............................',
    '............o.................',
    '..............................',
    '....o.........................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({ segments: 12, heads: 0, speed: 1, sub: 'FIX THE GLITCH-WORM' }),
    wave({
      segments: 12,
      heads: 0,
      speed: 1.25,
      beetleEvery: 900,
      moth: true,
      cans: 1,
      sub: 'SPRAY A CAN: SPLASH!',
    }),
    wave({
      segments: 11,
      heads: 1,
      speed: 1.25,
      beetleEvery: 810,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'FIRST BLOOM',
      objective: {
        kind: 'bloom-lanes',
        title: 'FIRST BLOOM!',
        hint: 'BLOOM A FLOWER IN EACH LANE',
        lanes: [3, 11, 18, 26],
        bonus: 2500,
      },
    }),
    wave({
      segments: 10,
      heads: 2,
      speed: 1.5,
      beetleEvery: 720,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'MIND THE SLIME SNAIL',
    }),
    wave({
      segments: 9,
      heads: 3,
      speed: 1.5,
      beetleEvery: 630,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'THE WHOLE PLOT AT ONCE',
    }),
  ],
}

/** Spring 2: rows of fruit trees that drop apples, and side-crawlers in the bed. */
export const ORCHARD_ROWS: Garden = {
  id: 'orchard-rows',
  name: 'ORCHARD ROWS',
  season: 'spring',
  intro: ['CATCH FALLING APPLES FOR POINTS', 'NEW: SIDE-CRAWLERS IN THE BED'],
  appleEvery: 170,
  boss: 'queen-wiggle',
  layout: [
    '..............................',
    '..............................',
    '.....o.........o.........o....',
    '..............................',
    '..T......T.......T......T.....',
    '..............................',
    'o.......o.....o.......o.....o.',
    '..............................',
    '....o......o.......o......o...',
    '..............................',
    '.....T.......T.......T........',
    '..............................',
    '..o.......o......C.....o......',
    '..............................',
    '......o.......o.......o.......',
    '..............................',
    '..T......T.......T......T.....',
    '..............................',
    '.o.......o.....o.......o......',
    '..............................',
    '.....o.....C........o.........',
    '..............................',
    '.........o.........o..........',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 12,
      heads: 1,
      speed: 1.5,
      beetleEvery: 760,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      sub: 'APPLES ARE PEST-FREE POINTS',
    }),
    wave({
      segments: 11,
      heads: 2,
      speed: 1.5,
      beetleEvery: 700,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      sub: 'CLEAR THE BED FAST',
    }),
    wave({
      segments: 11,
      heads: 2,
      speed: 1.75,
      beetleEvery: 660,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      sub: 'APPLE HARVEST',
      objective: {
        kind: 'catch-apples',
        title: 'APPLE HARVEST!',
        hint: 'CATCH 10 APPLES',
        count: 10,
        bonus: 3000,
      },
    }),
    wave({
      segments: 10,
      heads: 3,
      speed: 1.75,
      beetleEvery: 620,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      sub: 'THE ORCHARD BUZZES',
    }),
    wave({
      segments: 9,
      heads: 4,
      speed: 2,
      beetleEvery: 580,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      sub: 'SPRING IS NEARLY FIXED',
    }),
  ],
}

/**
 * Summer 3: rows of tall sunflowers make a winding maze. The worm follows the lanes and turns
 * back at every wall, until it finds the gap at the bottom (the exit).
 */
export const SUNFLOWER_MAZE: Garden = {
  id: 'sunflower-maze',
  name: 'SUNFLOWER MAZE',
  season: 'summer',
  intro: ['THE WORM WINDS THROUGH THE MAZE', 'NEW: THE DRAGONFLY BOT'],
  layout: [
    '..............................',
    '..............................',
    '...o.......o.......o.......o..',
    '..............................',
    '......o.......o.......o.......',
    '..............................',
    'SSSSSSSSSSSSSSSSSSSSSSSSS.....',
    '..............................',
    '....o.........o.........o.....',
    '..............................',
    '.....SSSSSSSSSSSSSSSSSSSSSSSSS',
    '..............................',
    '..o.......C.........o.....o...',
    '..............................',
    'SSSSSSSSSSSSSSSSSSSSSSSSS.....',
    '..............................',
    '......o.........o.........o...',
    '..............................',
    '.....SSSSSSSSSSSSSSSSSSSSSSSSS',
    '..............................',
    '...o.........o.........C......',
    '..............................',
    'SSSSSSSSSSSSSSEESSSSSSSSSSSSSS',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 11,
      heads: 2,
      speed: 2,
      beetleEvery: 620,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      sub: 'LEAD THE DRAGONFLY INTO ITS STOP',
    }),
    wave({
      segments: 10,
      heads: 3,
      speed: 2,
      beetleEvery: 580,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      sub: 'SPRAY BETWEEN THE STALKS',
    }),
    wave({
      segments: 12,
      heads: 2,
      speed: 2,
      beetleEvery: 600,
      moth: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      sub: 'MAZE RUNNER',
      objective: {
        kind: 'maze-exit',
        title: 'MAZE RUNNER!',
        hint: 'FIX THE WORM BEFORE IT GETS OUT',
        bonus: 4000,
      },
    }),
    wave({
      segments: 9,
      heads: 4,
      speed: 2.25,
      beetleEvery: 540,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 2,
      sub: 'TWO DRAGONFLIES NOW',
    }),
    wave({
      segments: 8,
      heads: 5,
      speed: 2.5,
      beetleEvery: 500,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 2,
      sub: 'THE MAZE AT FULL BLOOM',
    }),
  ],
}

/** Summer 4: a strip of drifting lily pads, friendly bee bots, and a wasp-glitch among them. */
export const LILY_POND: Garden = {
  id: 'lily-pond',
  name: 'LILY POND',
  season: 'summer',
  intro: [
    'LILY PADS CARRY LAMPS AND WORMS',
    'NEW: BEE BOTS. DO NOT SPRAY THEM!',
  ],
  pondRows: [14, 15],
  boss: 'mow-bot',
  layout: [
    '..............................',
    '..............................',
    '....o......o......o......o....',
    '..............................',
    '.o.......o.......o.......o....',
    '..............................',
    '......o.......C.......o.......',
    '..............................',
    '...o.......o.......o.......o..',
    '..............................',
    '......o.........o.........o...',
    '..............................',
    '..............................',
    '..............................',
    '..o.....o.....o.....o.....o...',
    '.....o.....o.....o.....o......',
    '..............................',
    '..............................',
    '....o.......o.......o.........',
    '..............................',
    '........o.....C.......o.......',
    '..............................',
    '..o.......o.......o.......o...',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 10,
      heads: 3,
      speed: 2.25,
      beetleEvery: 560,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      bees: 2,
      sub: 'HOLD FIRE FOR THE BEES',
    }),
    wave({
      segments: 10,
      heads: 3,
      speed: 2.25,
      beetleEvery: 520,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      bees: 3,
      wasp: true,
      sub: 'ONE BEE HAS JITTERY STRIPES',
    }),
    wave({
      segments: 9,
      heads: 3,
      speed: 2.25,
      beetleEvery: 560,
      moth: true,
      crawlers: true,
      cans: 2,
      bees: 3,
      sub: 'POLLINATORS',
      objective: {
        kind: 'escort-bees',
        title: 'POLLINATORS!',
        hint: 'SEE 3 BEE BOTS ACROSS SAFELY',
        count: 3,
        bonus: 4000,
      },
    }),
    wave({
      segments: 9,
      heads: 5,
      speed: 2.5,
      beetleEvery: 480,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      bees: 3,
      wasp: true,
      sub: 'THE POND IS BUSY',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.5,
      beetleEvery: 440,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 2,
      bees: 3,
      wasp: true,
      sub: 'HIGH SUMMER',
    }),
  ],
}

/** Autumn 5: leaf drifts shadow the lamps and push across the flowerbed in gusts. */
export const LEAF_PILE_LANE: Garden = {
  id: 'leaf-pile-lane',
  name: 'LEAF PILE LANE',
  season: 'autumn',
  intro: ['LEAVES SOAK UP YOUR FIRST SHOT', 'GUSTS SWEEP THEM SIDEWAYS'],
  layout: [
    '..............................',
    '..............................',
    '...o.......o........o......o..',
    '..............................',
    '..............................',
    '.......o.......o........o.....',
    '..............................',
    '..............................',
    '..o.......o........o........o.',
    '...............C..............',
    '..............................',
    '.....o.......o........o.......',
    '..............................',
    '..............................',
    '........o........o........o...',
    '..............................',
    '...........................L..',
    '........................C.....',
    '....o.......oL.........o......',
    '..............................',
    '..............................',
    '......Lo...........o..........',
    '..............................',
    '......................L.......',
    '..o...........o..........o....',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '....L.....................L...',
    '.....................L........',
    '.........L....................',
    '...............L..............',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 10,
      heads: 4,
      speed: 2.6,
      beetleEvery: 450,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      leaves: 4,
      sub: 'THE FIRST AUTUMN GUST',
    }),
    wave({
      segments: 9,
      heads: 5,
      speed: 2.65,
      beetleEvery: 430,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      leaves: 5,
      sub: 'WATCH THE FLOWER-PLUCKING CROW',
    }),
    wave({
      segments: 9,
      heads: 5,
      speed: 2.75,
      beetleEvery: 420,
      moth: true,
      crawlers: true,
      cans: 1,
      leaves: 5,
      sub: 'RAKE UP',
      objective: {
        kind: 'clear-leaves',
        title: 'RAKE UP!',
        hint: 'SPRAY FIVE BED PILES',
        count: 5,
        bonus: 4500,
      },
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.85,
      beetleEvery: 390,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      leaves: 7,
      sub: 'THE WIND AND THE WORM',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.95,
      beetleEvery: 370,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 2,
      leaves: 8,
      sub: 'AUTUMN IN FULL SWING',
    }),
  ],
}

/** Autumn 6: giant gourds hide the garden's lamps and roll into the flowerbed. */
export const PUMPKIN_PATCH: Garden = {
  id: 'pumpkin-patch',
  name: 'PUMPKIN PATCH',
  season: 'autumn',
  boss: 'gourd-hydra',
  intro: [
    'CRACK THE PUMPKINS TO PLANT SPROUTS',
    'FIX AN INCHWORM TO SLOW THE GLITCH',
  ],
  layout: [
    '..............................',
    '..............................',
    '...o.........o..........o.....',
    '..............................',
    '........o...........o.........',
    '.....P........................',
    '..o............o...........o..',
    '..................P...........',
    '..............................',
    '.....o.....o........o.....o...',
    '...............C..............',
    '..............................',
    '..o......o.......o......o.....',
    '..........P...................',
    '.......................P......',
    '..............................',
    '......o......o.........o......',
    '..............................',
    '...........................C..',
    '...o...........o..........o...',
    '..............................',
    '......P.......................',
    '..............................',
    '........o..........o..........',
    '....................P.........',
    '.........C....................',
    '............P.................',
    '....o...........o........o....',
    '.........................P....',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 9,
      heads: 5,
      speed: 2.8,
      beetleEvery: 390,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      pumpkins: 3,
      inchworms: 1,
      sub: 'SEEDS UNDER THE SHELL',
    }),
    wave({
      segments: 9,
      heads: 6,
      speed: 2.85,
      beetleEvery: 375,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      pumpkins: 4,
      inchworms: 1,
      rollers: 1,
      sub: 'THE FIRST ROLLER',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.9,
      beetleEvery: 360,
      moth: true,
      crawlers: true,
      cans: 2,
      pumpkins: 2,
      rollers: 1,
      inchworms: 1,
      sub: 'GREAT PUMPKIN',
      objective: {
        kind: 'great-pumpkin',
        title: 'GREAT PUMPKIN!',
        hint: 'CRACK THE ROLLING GIANT',
        bonus: 5000,
      },
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 3,
      beetleEvery: 345,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      pumpkins: 6,
      rollers: 2,
      inchworms: 1,
      sub: 'A PATCH IN MOTION',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.1,
      beetleEvery: 325,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      pumpkins: 7,
      rollers: 2,
      inchworms: 2,
      sub: 'AUTUMN TAKES ROOT',
    }),
  ],
}

export const FROST_FRAME_GREENHOUSE: Garden = {
  id: 'frost-frame-greenhouse',
  name: 'FROST FRAME GREENHOUSE',
  season: 'winter',
  intro: ['WINTER IS HERE', 'KEEP THE PRISM LANES OPEN'],
  layout: [
    '..............................',
    '..............................',
    '.........o....................',
    '....H.........o...............',
    '...................o..........',
    '........................o.....',
    '......o.......................',
    '...........o..C...............',
    '................o.............',
    '.....................o........',
    '...o...........H..........o...',
    '........o.....................',
    '.............o................',
    '..................o...........',
    '.......................o......',
    '.....o........C...............',
    '..........o...................',
    '........H......o..............',
    '....................o.........',
    '..o......................o....',
    '.......o......................',
    '............o.................',
    '.................o............',
    '..............C.......o..H....',
    '....o......................o..',
    '.........o....................',
    '..............o...............',
    '...................o..........',
    '........................o.....',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 9,
      heads: 5,
      speed: 2.8,
      beetleEvery: 390,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 0,
      bees: 0,
      wasp: false,
      frost: 8,
      sub: 'THE COLD FRONT',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.92,
      beetleEvery: 372,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 0,
      bees: 0,
      wasp: false,
      frost: 11,
      sub: 'FROST ON THE PATH',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.04,
      beetleEvery: 354,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 0,
      bees: 2,
      wasp: false,
      frost: 14,
      objective: {
        kind: 'warm-heaters',

        title: 'WARM UP',

        hint: 'LIGHT ALL FOUR HEATERS',

        count: 4,

        bonus: 2400,
      },
      sub: 'THE WINTER WATCH',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.16,
      beetleEvery: 336,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      frost: 17,
      sub: 'THE LONG FREEZE',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.28,
      beetleEvery: 318,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      frost: 20,
      sub: 'THE LAST THAW',
    }),
  ],
}

export const SNOWBALL_HILL: Garden = {
  id: 'snowball-hill',
  name: 'SNOWBALL HILL',
  season: 'winter',
  icyBed: true,
  boss: 'frost-millipede',
  intro: ['WINTER IS HERE', 'KEEP THE PRISM LANES OPEN'],
  layout: [
    '..............................',
    '..............................',
    '.....o........................',
    '..........o...................',
    '..............Co..............',
    '....................o.........',
    '..o......................o....',
    '.......o......................',
    '............o.................',
    '.................o............',
    '......................o.......',
    '....o......................o..',
    '.........o....C...............',
    '..............o...............',
    '...................o..........',
    '........................o.....',
    '......o.......................',
    '...........o..................',
    '................o.............',
    '.....................o........',
    '...o..........C...........o...',
    '........o.....................',
    '.............o................',
    '..................o...........',
    '.......................o......',
    '.....o........................',
    '..........o...................',
    '...............o..............',
    '..............C.....o.........',
    '....H..........H.........H....',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 9,
      heads: 5,
      speed: 2.8,
      beetleEvery: 390,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 0,
      bees: 0,
      wasp: false,
      snowballs: 1,
      sub: 'THE COLD FRONT',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 2.92,
      beetleEvery: 372,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 0,
      bees: 0,
      wasp: false,
      snowballs: 2,
      mole: true,
      sub: 'FROST ON THE PATH',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.04,
      beetleEvery: 354,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 0,
      bees: 2,
      wasp: false,
      snowballs: 3,
      mole: true,
      objective: {
        kind: 'snow-day',

        title: 'SNOW DAY',

        hint: 'SPRAY THREE ROLLING SNOWBALLS',

        count: 3,

        bonus: 2800,
      },
      sub: 'THE WINTER WATCH',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.16,
      beetleEvery: 336,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      snowballs: 3,
      mole: true,
      sub: 'THE LONG FREEZE',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.28,
      beetleEvery: 318,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 1,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      snowballs: 4,
      mole: true,
      sub: 'THE LAST THAW',
    }),
  ],
}

export const GARDENS: readonly Garden[] = [
  KITCHEN_PLOT,
  ORCHARD_ROWS,
  SUNFLOWER_MAZE,
  LILY_POND,
  LEAF_PILE_LANE,
  PUMPKIN_PATCH,
  FROST_FRAME_GREENHOUSE,
  SNOWBALL_HILL,
]

/** Midnight is separate from the standard 44-encounter lap. */
export const MIDNIGHT_INDEX = GARDENS.length
export const MIDNIGHT_GARDEN: Garden = {
  id: 'midnight-garden',
  name: 'MIDNIGHT GARDEN',
  season: 'midnight',
  intro: ['FOLLOW THE FIREFLIES', 'YOUR PRISMS LIGHT THE DARK'],
  boss: 'root-kernel',
  appleEvery: 360,
  layout: [
    '..............................',
    '..............................',
    '.....o......o......o......o...',
    '..............................',
    '..............................',
    '...o......o......o......o.....',
    '....T....................T....',
    '...........................L..',
    '......o......o......o......o..',
    '..............................',
    '..L...........................',
    '....o...S..o......o..S...o....',
    '..............................',
    '......C................C......',
    '..L....o......o......o........',
    '..............................',
    '....T....................T....',
    '.....o....P.o......P......o...',
    '..............................',
    '...........................L..',
    '...o......o......o......o.....',
    '........S............S........',
    '..L...........................',
    '......o......o......o......o..',
    '......C................C......',
    '...........................L..',
    '....o......o......o......o....',
    '.....H..................H.....',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    wave({
      segments: 10,
      heads: 4,
      speed: 2.8,
      beetleEvery: 440,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      sub: 'THE GARDEN DREAMS',
    }),
    wave({
      segments: 9,
      heads: 5,
      speed: 2.9,
      beetleEvery: 420,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      sub: 'SUMMER AFTER DARK',
    }),
    wave({
      segments: 8,
      heads: 5,
      speed: 3,
      beetleEvery: 400,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      leaves: 6,
      pumpkins: 2,
      rollers: 1,
      inchworms: 1,
      sub: 'THE AUTUMN SHADOWS',
    }),
    wave({
      segments: 8,
      heads: 6,
      speed: 3.1,
      beetleEvery: 380,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      frost: 6,
      snowballs: 2,
      mole: true,
      sub: 'FROST UNDER THE STARS',
    }),
    wave({
      segments: 7,
      heads: 7,
      speed: 3.2,
      beetleEvery: 360,
      moth: true,
      snail: true,
      crawlers: true,
      cans: 2,
      dragonflies: 1,
      bees: 2,
      wasp: true,
      leaves: 6,
      pumpkins: 2,
      rollers: 1,
      inchworms: 1,
      frost: 5,
      snowballs: 2,
      mole: true,
      sub: 'EVERY SEASON AT ONCE',
    }),
  ],
}

export function hasAllTrowels(trowels: ReadonlySet<string>): boolean {
  return GARDENS.every((garden) => trowels.has(garden.id))
}

export function gardenAt(index: number): Garden {
  return index === MIDNIGHT_INDEX ? MIDNIGHT_GARDEN : GARDENS[index]!
}

/** The wave's plan: authored, or past the end a remix of the garden's last wave. */
export function gardenWave(garden: Garden, wave: number): GardenWave {
  const n = Math.max(1, Math.floor(wave))
  const authored = garden.waves[n - 1]
  if (authored) return authored
  const last = garden.waves[garden.waves.length - 1]!
  const extra = n - garden.waves.length
  const heads = Math.min(MAX_HEADS, last.heads + extra)
  return {
    ...last,
    segments: Math.max(MIN_BODY, last.segments - (heads - last.heads)),
    heads,
    beetleEvery: Math.max(
      MIN_BEETLE_EVERY,
      (last.beetleEvery ?? 900) - 45 * extra,
    ),
    moth: true,
    snail: true,
    cans: extra % 2 === 1 ? 1 : 0,
    sub: 'REMIX: EVERYTHING SO FAR',
    objective: undefined,
  }
}

/**
 * A wave on a later lap of the year: the worm is a quarter faster per lap, brings a head more,
 * the beetle comes sooner and the snail is out from the first wave.
 */
export function lapWave(plan: GardenWave, lap: number): GardenWave {
  if (lap <= 0) return plan
  const heads = Math.min(MAX_HEADS, plan.heads + lap)
  return {
    ...plan,
    heads,
    segments: Math.max(MIN_BODY, plan.segments - Math.min(lap, 2)),
    speed: Math.min(MAX_SPEED, plan.speed + 0.25 * lap),
    beetleEvery: Math.max(
      MIN_BEETLE_EVERY,
      Math.round((plan.beetleEvery ?? 700) * 0.85 ** lap),
    ),
    moth: true,
    snail: true,
    crawlers: true,
  }
}

export type CampaignStep =
  | { kind: 'wave'; garden: number; wave: number }
  | { kind: 'boss'; garden: number; boss: BossId }
  | { kind: 'shed'; garden: number }

/**
 * The year in order: each garden's waves, its boss if it has one, then the Compost Shed before
 * the next garden (and before the year starts over).
 */
export const CAMPAIGN: readonly CampaignStep[] = GARDENS.flatMap(
  (garden, g): CampaignStep[] => [
    ...garden.waves.map((_, i): CampaignStep => ({
      kind: 'wave',
      garden: g,
      wave: i + 1,
    })),
    ...(garden.boss
      ? [{ kind: 'boss', garden: g, boss: garden.boss } as CampaignStep]
      : []),
    { kind: 'shed', garden: (g + 1) % GARDENS.length },
  ],
)

export const MIDNIGHT_STEPS: readonly CampaignStep[] = [
  ...MIDNIGHT_GARDEN.waves.map((_, i): CampaignStep => ({
    kind: 'wave',
    garden: MIDNIGHT_INDEX,
    wave: i + 1,
  })),
  { kind: 'boss', garden: MIDNIGHT_INDEX, boss: 'root-kernel' },
]

export function campaignStepAt(index: number): CampaignStep {
  return index < CAMPAIGN.length
    ? CAMPAIGN[index]!
    : MIDNIGHT_STEPS[index - CAMPAIGN.length]!
}

/** The campaign index of a garden's first wave. */
export function gardenStart(garden: number): number {
  if (garden === MIDNIGHT_INDEX) return CAMPAIGN.length
  return CAMPAIGN.findIndex((s) => s.kind === 'wave' && s.garden === garden)
}

/** Waves and bosses in one lap of the year. */
export const PLAYS_PER_LAP = CAMPAIGN.filter((s) => s.kind !== 'shed').length

/** The n-th wave or boss of a run (1-based), as a campaign index and a lap. */
export function campaignPlay(n: number): { index: number; lap: number } {
  const k = Math.max(1, Math.floor(n)) - 1
  const lap = Math.floor(k / PLAYS_PER_LAP)
  let left = k % PLAYS_PER_LAP
  for (let i = 0; i < CAMPAIGN.length; i++) {
    if (CAMPAIGN[i]!.kind === 'shed') continue
    if (left-- === 0) return { index: i, lap }
  }
  return { index: 0, lap }
}

/** Every cell of the layout holding `letter`, as [col, row]. */
export function layoutCells(
  garden: Garden,
  letter: string,
): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  garden.layout.forEach((row, r) => {
    for (let c = 0; c < row.length; c++)
      if (row[c] === letter) cells.push([c, r])
  })
  return cells
}

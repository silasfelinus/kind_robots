// /utils/arcade/games/glitchGarden.ts
//
// Glitch Garden -- the Kind Robots Arcade's Centipede riff (conductor
// kr-arcade/t-009 game factory, batch 3). A long glitch-worm winds down
// through a garden of glitchy mushroom lamps. Spray fix-it beams up from the
// flowerbed: a fixed segment drops out of the worm as a sprout (the worm
// splits there, and the piece behind grows a new head), and lamps and sprouts
// sprayed enough times bloom into flowers. The worm turns at every lamp, so a
// crowded garden brings it down sooner.
//
// From wave 2 a beetle zig-zags through the flowerbed nibbling lamps, and a
// moth dives straight down planting new lamps when the bed runs bare. Later
// worms are faster and arrive with extra loose heads. Touching a worm segment
// or the beetle costs a sprayer; every 12,000 points earns one back.
//
// From wave 3 a slime snail crawls across the upper lawn, glitching every lamp
// it touches (they turn static-grey). A worm that meets a glitched lamp plunges
// straight down to the flowerbed, and a worm that lingers in the bed sends
// side-crawlers in from the edges. Lamps creep down a row between waves, and
// every wave repaints the lawn and recolours the worm.
//
// The Prism Garden: every lamp and sprout has a bloom colour set by where it
// stands (shown as a dot on its cap), so you can plan your lanes. A beam that
// passes through a bloomed flower takes its power, up to two at a time: pink
// splits the beam, gold pierces, cyan freezes the worm it hits and violet homes.
// Consecutive hits raise a patch multiplier (x1 to x5, shown on the nozzle); a
// miss drops it a step.
//
// Sprinkler cans stand in the lawn: spray one and it bursts into a fix-it
// splash that fixes every worm segment and foe in reach, blooms the lamps
// around it and sets off any can nearby (Millipede's DDT, made kind).
//
// The garden is data (glitchGardenGardens.ts): an authored lamp layout with its
// cans, and waves that say how the worm comes, which foes join it and, on a
// special wave, the objective. The sprites are drawn at double density: the
// logical screen is twice the garden's size, so every sprite gets twice the
// pixels across.
//
// Spring and Summer (conductor kr-arcade/t-089): the campaign runs through four
// gardens of five waves, each with its own layout, look and title card. The
// Orchard Rows' trees drop apples to catch (or that land as obstacles), the
// Sunflower Maze's tall walls steer the worm toward the maze's exit, and the
// Lily Pond's pads drift lamps and worm heads across the water. The dragonfly
// bot darts and stops, friendly bee bots carry pollen across (spraying one
// costs the wave's Kind bonus) and a wasp-glitch with jittery stripes hides
// among them and dives. Queen Wiggle closes Spring and Mow-Bot 3000 closes
// Summer. Between gardens the Compost Shed sells kit for petals; a golden
// trowel rewards a special wave done without losing a sprayer; progress saves
// at every garden, and reached gardens open in the garden select. When Summer
// is fixed the year starts over a lap harder.
//
// Arrows move the sprayer around the flowerbed; A (or B) sprays. One beam at a
// time (two with the shed's second beam), so get close to fire faster.

import { drawText } from '../font'
import { mulberry32 } from '../curve'
import {
  CROSSFIRE_POINTS,
  CROSSFIRE_TICKS,
  RIVALS_RESPAWN_TICKS,
  RIVALS_TICKS,
  dailyGardenPlan,
  endlessGardenStep,
  gardenMedals,
} from './glitchGardenModes'
import type { GardenMode } from './glitchGardenModes'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  dropShadow,
  glow,
  hudPanel,
  mix,
  rgba,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  APPLE_SPRITE,
  BEE_SPRITES,
  DENSITY,
  DRAGONFLY_SPRITES,
  GARDEN_LOOKS,
  QUEEN_ARMOURED,
  QUEEN_HEADS,
  QUEEN_JOINT,
  QUEEN_SEGMENTS,
  SUNFLOWER_SPRITES,
  TREE_SPRITE,
  WASP_SPRITES,
  drawHd,
  drawLilyPad,
  drawMower,
  hdSprite,
} from './glitchGardenArt'
import {
  BOSSES,
  CAMPAIGN,
  GARDENS,
  KITCHEN_PLOT,
  MIDNIGHT_INDEX,
  MIDNIGHT_STEPS,
  campaignStepAt,
  gardenAt,
  hasAllTrowels,
  LAYOUT_CAN,
  LAYOUT_EXIT,
  LAYOUT_HEATER,
  LAYOUT_LAMP,
  LAYOUT_LEAF,
  LAYOUT_PUMPKIN,
  LAYOUT_SUNFLOWER,
  LAYOUT_TREE,
  campaignPlay,
  gardenStart,
  gardenWave,
  lapWave,
  layoutCells,
} from './glitchGardenGardens'
import type {
  BossId,
  CampaignStep,
  Garden,
  GardenWave,
} from './glitchGardenGardens'
import { readGardenSave } from './glitchGardenSave'
import type { GardenSave } from './glitchGardenSave'
import {
  NEW_KIT,
  SHED_ITEMS,
  SHED_TICKS,
  buy,
  cannotBuy,
} from './glitchGardenShed'
import type { Kit } from './glitchGardenShed'

export { DENSITY, scale2x } from './glitchGardenArt'

const CELL = 8
const COLS = 30
const ROWS = 36
const HUD = 16
const W = COLS * CELL
const H = HUD + ROWS * CELL
/** The flowerbed: the bottom rows, where the sprayer roams. */
const BED_ROWS = 6
const BED_TOP = ROWS - BED_ROWS
const BEAM_SPEED = 9
const SPRAYER_SPEED = 1.6
const LAMP_HP = 4
const SPROUT_HP = 3
const START_LIVES = 3
const DEATH_TICKS = 110
const WAVE_CLEAR_TICKS = 110
const EXTRA_EVERY = 12_000

/** The score that earns the n-th extra sprayer: 12,000, 30,000, 54,000, 84,000... (each dearer). */
export function extraAt(n: number): number {
  return EXTRA_EVERY * n + 3_000 * n * (n - 1)
}
/** Spare sprayers stop piling up here. */
export const MAX_LIVES = 6

const HEAD_POINTS = 100
const BODY_POINTS = 10
const BLOOM_POINTS = 1
const MOTH_POINTS = 200

/** Apples: how fast they fall, what a catch pays, and how much spray a landed one takes. */
export const APPLE_FALL = 0.9
export const APPLE_POINTS = 250
export const APPLE_HP = 2
/** The dragonfly darts this fast for this long, then stops (its tell: the wings stop). */
export const DRAGONFLY_DART = 2.4
export const DRAGONFLY_DART_TICKS = 26
export const DRAGONFLY_STOP_TICKS = 40
export const DRAGONFLY_EVERY = 420
export const DRAGONFLY_POINTS = 500
/** Bee flights: how often, how fast; a wasp-glitch dives once it lines up over the sprayer. */
export const BEE_EVERY = 520
export const BEE_SPEED = 0.6
export const WASP_DIVE = 2.6
export const WASP_POINTS = 800
/** A wave with bees and none sprayed pays this. */
export const KIND_BONUS = 1000
/** Lily pads drift a cell this often. */
export const PAD_EVERY = 45
/** Autumn leaves can be blown one cell sideways every three seconds. */
export const LEAF_GUST_TICKS = 180
export const CROW_EVERY = 360
export const CROW_TELL_TICKS = 45
export const CROW_SWOOP_TICKS = 70
export const CROW_POINTS = 700
export const PUMPKIN_HP = 8
export const GIANT_PUMPKIN_HP = 24
export const ROLLER_HP = 4
export const INCHWORM_SLOW_TICKS = 300
export const FROST_HP = 8
export const FROST_SPREAD_TICKS = 180
export const FROST_SPRITE_EVERY = 240
export const FROST_SPRITE_POINTS = 600
export const HEATER_RADIUS = 3
export const ICE_ACCEL = 0.45
export const ICE_DRAG = 0.92
export const ICE_MAX_SPEED = 2.8
export const SNOWBALL_HP = 3
export const SNOWBALL_POINTS = 450
export const MOLE_WAIT_TICKS = 300
export const MOLE_TELL_TICKS = 54
export const MOLE_UP_TICKS = 72
export const MOLE_POINTS = 650
export const HYDRA_HEAD_HP = 6
export const HYDRA_TELL_TICKS = 90
/** A worm turned back by a wall this many times in a row squeezes past it. */
export const SQUEEZE_AFTER = 3
/** Queen Wiggle: segments, joints every so often, helmet hits, and her detached head's hits. */
export const QUEEN_SEGMENTS_COUNT = 24
export const QUEEN_JOINT_EVERY = 6
export const QUEEN_ARMOUR = 3
export const QUEEN_HEAD_HP = 8
/** Mow-Bot 3000: size in cells, cap hits, and speed per phase. */
export const MOWER_COLS = 4
export const MOWER_ROWS = 2
export const MOWER_CAP_HP = 4
export const MOWER_SPEEDS = [0.7, 1.05, 1.5] as const
/** Where its three fuel caps sit along its top (pixels from its left edge). */
export const MOWER_CAPS = [5, 14, 23] as const
/** Petals: per bloom and apple, and per objective met. */
export const OBJECTIVE_PETALS = 5
export const TROWEL_PETALS = 10
/** How long a garden's title card shows over its first wave. */
export const CARD_TICKS = 200
/** Lamps in the first garden's authored layout (later lamps come from the moth and the creep). */
export const START_LAMPS = layoutCells(KITCHEN_PLOT, LAYOUT_LAMP).length
/** A sprayed can's splash reaches this many cells, and sets off cans this close. */
export const SPLASH_RADIUS = 2.5
export const CHAIN_RADIUS = 7
/** Ticks between one can bursting and the next one in the chain. */
export const CHAIN_DELAY = 10
export const MAX_CANS = 4
/** A can pays this much, times its place in the chain. */
export const CAN_POINTS = 150
/** The snail first crosses on this wave, and its crossings come this often (ticks). */
export const SNAIL_WAVE = 3
export const SNAIL_EVERY = 1100
export const SNAIL_POINTS = 1000
/** Ticks a worm must stay in the flowerbed before side-crawlers join it. */
export const CRAWLER_AFTER = 360
export const CRAWLER_EVERY = 300
export const MAX_CRAWLERS = 2
/** Rows of the upper lawn the snail crosses (the bed and the top row stay clear). */
export const SNAIL_ROWS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
/** The beetle stops getting faster at this wave. */
export const BEETLE_SPEED_CAP_WAVE = 10

/** The beetle's crawl speed: rises with the wave, then stops. */
export function beetleSpeed(wave: number): number {
  return 0.8 + Math.min(wave, BEETLE_SPEED_CAP_WAVE) * 0.05
}

export type Prism = 'pink' | 'gold' | 'cyan' | 'violet'
export const PRISM_ORDER: readonly Prism[] = ['pink', 'gold', 'cyan', 'violet']
export const PRISM_COLORS: Record<Prism, string> = {
  pink: '#f9a8d4',
  gold: '#fde047',
  cyan: '#67e8f9',
  violet: '#c4b5fd',
}
/** A beam carries at most this many flower powers. */
export const MAX_BEAM_POWERS = 2
export const PIERCE_HITS = 3
export const FREEZE_TICKS = 120
export const HOMING_RANGE = 32
export const SPLIT_OFFSET = 6
export const MAX_MULTIPLIER = 5
export const HITS_PER_STEP = 3

/** The bloom colour of whatever stands at this cell: chosen by the source, never random. */
export function prismFor(col: number, row: number): Prism {
  return PRISM_ORDER[(((col + row * 2) % 4) + 4) % 4]!
}

/** The patch multiplier for a run of consecutive hits. */
export function multiplierFor(streak: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(streak / HITS_PER_STEP))
}

/** A miss drops the multiplier one step. */
export function streakAfterMiss(streak: number): number {
  const mult = multiplierFor(streak)
  return mult <= 1 ? 0 : (mult - 2) * HITS_PER_STEP
}

type Obstacle = {
  hp: number
  /** Trees and sunflowers are walls: never sprayed away, never creeping. */
  kind: 'lamp' | 'sprout' | 'can' | 'apple' | 'tree' | 'sunflower' | 'heater'
  /** Glitched by the snail: grey static that sends a worm plunging. */
  glitched?: boolean
  frosted?: boolean
  /** A can already set off by a neighbour's splash, waiting its turn. */
  lit?: boolean
}
const isWall = (ob: Obstacle | null): boolean =>
  ob?.kind === 'tree' || ob?.kind === 'sunflower'
const isPermanentFixture = (ob: Obstacle): boolean =>
  isWall(ob) || ob.kind === 'heater'
type Apple = { x: number; y: number }
type Dragonfly = {
  x: number
  y: number
  vx: number
  vy: number
  /** Darting, or stopped (ticks left either way). */
  dart: boolean
  ticks: number
  darts: number
}
type Bee = {
  x: number
  y: number
  vx: number
  wasp: boolean
  /** A wasp that has broken off to dive at the sprayer. */
  diving: boolean
  ticks: number
}
type QueenHead = { x: number; y: number; vx: number; vy: number; hp: number }
type Mower = {
  x: number
  y: number
  dir: 1 | -1
  /** Pixels left to drop before it runs along the next row. */
  drop: number
  caps: number[]
  /** In the flowerbed, chasing the sprayer sideways. */
  chase: boolean
  parked: number
}
/** The fight in progress, while a boss step is on. */
type BossFight = {
  id: BossId
  /** Queen Wiggle: 1 joints only, 2 three worms in step, 3 her head. Mow-Bot: caps fixed. */
  phase: number
  joints: number
  defeated: boolean
}
type Shed = { cursor: number; lane: number; ticks: number; note: string }
type Menu = {
  items: Array<{
    label: string
    garden: number
    resume: boolean
    overgrown?: boolean
    mode?: GardenMode | 'medals'
  }>
  cursor: number
}
type PendingSplash = { col: number; row: number; ticks: number; chain: number }
type Ring = { x: number; y: number; life: number }
/** A worm: the head leads, and segment k sits k * spacing steps back along its trail. */
type Worm = {
  /** The head's past positions, newest first. */
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  /** Down until the flowerbed floor, then back up and down within the bed. */
  dy: 1 | -1
  /** Diving straight down to the flowerbed after meeting a glitched lamp. */
  plunge?: boolean
  /** A side-crawler: a one-segment head that entered the bed from an edge. */
  crawler?: boolean
  /** Ticks left frozen by a cyan beam. */
  frozen?: number
  /** A piece of Queen Wiggle. */
  queen?: boolean
  /** Hits left on an armoured head. */
  armour?: number
  /** Walls that have turned it back in a row. */
  squeeze?: number
  /** Queen Wiggle's segment k is her body's segment k + offset (for joints and colours). */
  offset?: number
  /** The last player to fix part of this worm, inherited by both split pieces. */
  crossfire?: { player: 0 | 1; tick: number }
}
type Beam = {
  x: number
  y: number
  powers: Prism[]
  pierce: number
  child: boolean
  lastMoth: Moth | null
  lastCell: number
  player?: 0 | 1
}
type Pumpkin = {
  x: number
  y: number
  hp: number
  maxHp: number
  rolling: boolean
  giant: boolean
  hydra?: boolean
  lit?: boolean
  vx: number
  vy: number
}
type Inchworm = { x: number; y: number; vx: number }
type Snowball = { x: number; y: number; hp: number; vy: number }
type FrostSprite = { x: number; y: number; vx: number }
type CrowBot = {
  x: number
  y: number
  startX: number
  startY: number
  target: Flower
  phase: 'tell' | 'swoop' | 'exit'
  ticks: number
}
type FrostSegment = { slot: number; x: number; y: number; thawed: boolean }
type FrostRay = { x: number; y: number; tx: number; ty: number; ticks: number }
type MoleBot = { x: number; y: number; phase: 'tell' | 'up'; ticks: number }
type Snail = { x: number; y: number; vx: number }
type Beetle = { x: number; y: number; vx: number; vy: number; turn: number }
type Moth = { x: number; y: number; hp: number }
type Flower = { col: number; row: number; prism: Prism }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const LAWN_TOP = HUD
const BED_Y = HUD + BED_TOP * CELL

/** The glitch-lamps' magenta, and the HUD's deep hedge green. */
const FUCHSIA: Ramp = ['#3a0a48', '#7a1a8a', '#c026d3', '#e879f9', '#fdf4ff']
const HEDGE: Ramp = ['#05140b', '#0b2a17', '#15472a', '#3a8a52', '#a7f3b0']

const TUFTS = (() => {
  const rand = backdropRng(53)
  return Array.from({ length: 120 }, () => ({
    x: Math.floor(rand() * W),
    y: LAWN_TOP + 2 + Math.floor(rand() * (BED_Y - LAWN_TOP - 4)),
    tall: rand() < 0.35,
    lean: rand() < 0.5 ? -1 : 1,
  }))
})()

const MOSS = (() => {
  const rand = backdropRng(71)
  return Array.from({ length: 14 }, () => ({
    x: Math.floor(rand() * W),
    y: Math.floor(LAWN_TOP + 10 + rand() * (BED_Y - LAWN_TOP - 20)),
    rx: 8 + Math.floor(rand() * 14),
    ry: 4 + Math.floor(rand() * 6),
  }))
})()

const PEBBLES = (() => {
  const rand = backdropRng(61)
  return Array.from({ length: 46 }, () => ({
    x: Math.floor(rand() * (W - 3)),
    y: BED_Y + 3 + Math.floor(rand() * (H - BED_Y - 5)),
    w: rand() < 0.4 ? 2 : 1,
  }))
})()

const FIREFLIES = (() => {
  const rand = backdropRng(91)
  return Array.from({ length: 7 }, () => ({
    x: 16 + rand() * (W - 32),
    y: LAWN_TOP + 20 + rand() * (BED_Y - LAWN_TOP - 40),
    phase: rand() * Math.PI * 2,
  }))
})()

const lampPalette = (cap: Ramp) => ({
  H: cap[4],
  L: cap[3],
  P: cap[2],
  p: cap[1],
  d: cap[0],
  c: RAMPS.teal[3],
  s: RAMPS.cream[3],
  S: RAMPS.cream[1],
})
const LAMP_PALETTE = lampPalette(FUCHSIA)
/** Flickering: the cap lights up a step and the glitch spots go white. */
const lampFlicker = (cap: Ramp) => ({
  ...lampPalette(cap),
  L: cap[4],
  P: cap[3],
  p: cap[2],
  c: '#ffffff',
})
/** One mushroom lamp per hp left (index 1..4): the cap is sprayed away. */
const LAMP_ROWS: readonly (readonly string[])[] = [
  [],
  ['......', '......', '..Lp..', '..dd..', '..sS..', '..sS..'],
  ['......', '..LP..', '.LcPp.', '.dppd.', '..sS..', '..sS..'],
  ['.LLP..', 'LHcPp.', 'LPPPcp', 'dpppd.', '..sS..', '..sS..'],
  ['.LLPP.', 'LHcPPp', 'LPPPcp', 'dpppdd', '..sS..', '..sS..'],
]
const lampSprites = (palette: Record<string, string>) =>
  LAMP_ROWS.map((rows) => (rows.length ? hdSprite(rows, palette) : null))

/** The sprinkler can: a teal watering can whose glint and drip blink (its tell). */
const CAN_PALETTE = {
  h: RAMPS.teal[4],
  L: RAMPS.teal[3],
  P: RAMPS.teal[2],
  p: RAMPS.teal[1],
  d: RAMPS.teal[0],
  t: RAMPS.steel[3],
  w: '#ffffff',
  b: RAMPS.water[3],
}
const CAN_SPRITES = [
  hdSprite(
    ['..hLLh.', '.h....P', 't.LLLPp', '.tLwPpd', '..LPPpd', '..ppdd.'],
    CAN_PALETTE,
  ),
  hdSprite(
    ['..hLLh.', '.h....P', 't.LwLPp', 'btLLPpd', '..LPPpd', '..ppdd.'],
    CAN_PALETTE,
  ),
] as const

/** A glitched lamp: dead grey static with a few stray bright pixels. */
const GLITCHED_PALETTE = {
  ...LAMP_PALETTE,
  H: RAMPS.steel[4],
  L: RAMPS.steel[3],
  P: RAMPS.steel[2],
  p: RAMPS.steel[1],
  d: RAMPS.steel[0],
  c: RAMPS.teal[3],
}
const GLITCHED_SPRITES = LAMP_ROWS.map((rows) =>
  rows.length ? hdSprite(rows, GLITCHED_PALETTE) : null,
)

const SNAIL_PALETTE = {
  h: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  P: RAMPS.leaf[2],
  p: RAMPS.leaf[1],
  s: RAMPS.pink[3],
  S: RAMPS.pink[2],
  d: RAMPS.pink[1],
  k: INK,
  e: RAMPS.gold[3],
}
/** The slime snail faces right; its eye-stalks bob in two frames. */
const SNAIL_SPRITES = [
  hdSprite(
    [
      '......sSS...',
      '.....sSdSS.e',
      '.e..sSddSS.e',
      '.kLLsSdSdS..',
      'hLLLPSSSSd..',
      'pPPPPPPpppp.',
    ],
    SNAIL_PALETTE,
  ),
  hdSprite(
    [
      '......sSS..e',
      '.....sSdSS.e',
      '....sSddSS..',
      '.ekLsSdSdS..',
      'hLLLPSSSSd..',
      'pPPPPPPpppp.',
    ],
    SNAIL_PALETTE,
  ),
] as const

/** A sprout keeps one leaf per hp left (index 1..3). */
const SPROUT_PALETTE = {
  H: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
  s: RAMPS.leaf[2],
}
const SPROUT_SPRITES = [
  null,
  hdSprite(
    ['......', '......', '..HL..', '..ld..', '..s...', '..s...'],
    SPROUT_PALETTE,
  ),
  hdSprite(
    ['......', '..HL..', 'Lld...', '.dsLl.', '..sd..', '..s...'],
    SPROUT_PALETTE,
  ),
  hdSprite(
    ['..HL..', '..ld..', 'LLs.Hl', '.dsLld', '..sd..', '..s...'],
    SPROUT_PALETTE,
  ),
] as const

/** A four-petal bloom per flower colour, shaded from its own hue. */
const FLOWER_SPRITES = new Map<Prism, PixelSprite>(
  PRISM_ORDER.map((prism) => {
    const c = PRISM_COLORS[prism]
    return [
      prism,
      hdSprite(['..HP..', '..Pp..', 'HPyYPp', 'Ppoypd', '..Pp..', '..pd..'], {
        H: mix(c, '#ffffff', 0.55),
        P: c,
        p: mix(c, INK, 0.35),
        d: mix(c, INK, 0.6),
        y: RAMPS.gold[3],
        Y: RAMPS.gold[4],
        o: RAMPS.gold[2],
      }),
    ]
  }),
)

/** The lawn's tint, the worm's and the lamps' colours, one set per wave (the classic's palette change). */
export const WAVE_PALETTES = [
  { tint: null, worm: RAMPS.purple, lamp: FUCHSIA },
  { tint: RAMPS.water[2], worm: RAMPS.ember, lamp: RAMPS.purple },
  { tint: RAMPS.gold[2], worm: RAMPS.teal, lamp: RAMPS.rust },
  { tint: RAMPS.rust[2], worm: RAMPS.sky, lamp: RAMPS.pink },
  { tint: RAMPS.pink[1], worm: RAMPS.leaf, lamp: RAMPS.water },
] as const
export const paletteFor = (wave: number) =>
  WAVE_PALETTES[(Math.max(1, wave) - 1) % WAVE_PALETTES.length]!
const LAMP_SETS = WAVE_PALETTES.map((p) => ({
  lit: lampSprites(lampPalette(p.lamp)),
  flicker: lampSprites(lampFlicker(p.lamp)),
}))

const rampPalette = (ramp: Ramp) => ({
  h: ramp[4],
  L: ramp[3],
  P: ramp[2],
  p: ramp[1],
  d: ramp[0],
})
/** Body segments: two crawl frames (the little feet shuffle). */
const SEGMENT_ROWS = [
  ['.hLLP.', 'hLLPPp', 'LLPPpp', 'PPPppd', 'Pppddd', '.pddd.', '.p..p.'],
  ['.hLLP.', 'hLPPPp', 'LLPPpp', 'PPppdd', 'Pppddd', '.pddd.', 'p....p'],
] as const
const SEGMENT_SETS = WAVE_PALETTES.map((p) =>
  SEGMENT_ROWS.map((rows) => hdSprite(rows, rampPalette(p.worm))),
)
/** A glitching segment flickers into another palette's colour. */
const GLITCH_SETS = WAVE_PALETTES.map((_, i) =>
  SEGMENT_ROWS.map((rows) =>
    hdSprite(
      rows,
      rampPalette(WAVE_PALETTES[(i + 2) % WAVE_PALETTES.length]!.worm),
    ),
  ),
)
/** The head faces right (flip it to go left): wiggling antennae and a chomping grin. */
const HEAD_SPRITES = [
  [
    '.a..a.',
    '.hLLP.',
    'hLLwkp',
    'LLPwkp',
    'PPPPkd',
    'Ppkkdd',
    '.pddd.',
    '.p..p.',
  ],
  [
    'a....a',
    '.hLLP.',
    'hLLwkp',
    'LLPwkp',
    'PPPPpd',
    'Pppkkd',
    '.pddd.',
    'p....p',
  ],
].map((rows) =>
  hdSprite(rows, {
    ...rampPalette(RAMPS.pink),
    a: RAMPS.gold[3],
    w: '#ffffff',
    k: INK,
  }),
)

const BEETLE_PALETTE = {
  h: RAMPS.gold[4],
  L: RAMPS.gold[3],
  P: RAMPS.gold[2],
  p: RAMPS.gold[1],
  d: RAMPS.gold[0],
  k: INK,
  e: RAMPS.ember[3],
  l: RAMPS.earth[1],
}
const BEETLE_BODY = [
  '.hhLLPpk..',
  'hLLLLPpkkk',
  'kkkkkkkkke',
  'LPPPPppkkk',
  '.pPppddk..',
]
/** The beetle faces right; its legs scuttle in two frames. */
const BEETLE_SPRITES = [
  hdSprite(['.l...l....', ...BEETLE_BODY, '...l...l..'], BEETLE_PALETTE),
  hdSprite(['...l...l..', ...BEETLE_BODY, '.l...l....'], BEETLE_PALETTE),
] as const

const MOTH_PALETTE = {
  h: RAMPS.purple[4],
  L: RAMPS.purple[3],
  P: RAMPS.purple[2],
  p: RAMPS.purple[1],
  B: RAMPS.purple[0],
  b: RAMPS.pink[1],
  e: RAMPS.gold[3],
}
/** Wings out, wings folded. */
const MOTH_ROWS = [
  [
    'hL..b..Lh',
    'LeL.b.LeL',
    'LPPpBpPPL',
    '.pPpBpPp.',
    '..p.B.p..',
    '....b....',
  ],
  [
    '...hbh...',
    '..LeBeL..',
    '..LPBPL..',
    '..pPBPp..',
    '...pBp...',
    '....b....',
  ],
] as const
const MOTH_SPRITES = MOTH_ROWS.map((rows) => hdSprite(rows, MOTH_PALETTE))
/** Sprayed once: it flushes hot pink. */
const MOTH_HURT_SPRITES = MOTH_ROWS.map((rows) =>
  hdSprite(rows, {
    ...MOTH_PALETTE,
    h: RAMPS.pink[4],
    L: RAMPS.pink[3],
    P: RAMPS.pink[2],
    p: RAMPS.pink[1],
    B: RAMPS.pink[0],
  }),
)

const SPRAYER_PALETTE = {
  C: RAMPS.teal[4],
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  h: RAMPS.sky[4],
  T: RAMPS.sky[2],
  t: RAMPS.sky[1],
  d: RAMPS.sky[0],
  y: RAMPS.gold[4],
  g: RAMPS.steel[1],
  G: RAMPS.steel[3],
  k: RAMPS.steel[0],
}
const SPRAYER_BODY = [
  '....C....',
  '....s....',
  '...sSs...',
  '.hhTTTTt.',
  'hTyTTTyTt',
  'hTTTTTTTt',
  '.tttttttd',
]
/** The gardening bot: a nozzle up top, lamp eyes, rolling treads. */
const SPRAYER_SPRITES = [
  hdSprite([...SPRAYER_BODY, 'gGgGgGgGg', '.k.k.k.k.'], SPRAYER_PALETTE),
  hdSprite([...SPRAYER_BODY, 'GgGgGgGgG', 'k.k.k.k.k'], SPRAYER_PALETTE),
] as const
/** The nozzle's tip at x1 to x5. */
const NOZZLE_COLORS = [
  RAMPS.teal[4],
  RAMPS.leaf[3],
  RAMPS.gold[3],
  RAMPS.rust[3],
  RAMPS.pink[3],
] as const
const LIFE_SPRITE = hdSprite(
  ['...s...', '.hTTTt.', 'hTyTyTt', '.ttttd.', '.g.g.g.'],
  SPRAYER_PALETTE,
)

class GlitchGarden implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private grid: Array<Obstacle | null> = new Array(COLS * ROWS).fill(null)
  private flowers: Flower[] = []
  private worms: Worm[] = []
  private px = W / 2
  private py = HUD + (ROWS - 2) * CELL
  private playerCount = 1
  private p2 = { x: W * 0.75, y: HUD + (ROWS - 2) * CELL, glideX: 0, glideY: 0 }
  private rivalsFixed: [number, number] = [0, 0]
  private rivalsShield: [number, number] = [0, 0]
  private rivalsTicks = RIVALS_TICKS
  private crossfires = 0
  private beams: Beam[] = []
  private volley: { hits: number; landed: boolean } | null = null
  private streak = 0
  private beetle: Beetle | null = null
  private beetleTimer = 0
  private moth: Moth | null = null
  private snail: Snail | null = null
  private snailTimer = 0
  private bedTicks = 0
  private crawlerTimer = 0
  private garden: Garden = KITCHEN_PLOT
  private wave: GardenWave = gardenWave(KITCHEN_PLOT, 1)
  /** Where the run is in the campaign (CAMPAIGN index), and which lap of the year. */
  private stepIndex = 0
  private lap = 0
  /** The garden whose layout is planted (-1 before the first). */
  private planted = -1
  /** Lanes of the special wave's objective that have bloomed this wave. */
  private laneBlooms = new Set<number>()
  private objectiveDone = false
  /** The special wave's objective can no longer be met (a bee sprayed, the worm got out). */
  private objectiveFailed = false
  private splashes: PendingSplash[] = []
  private rings: Ring[] = []
  private speed = 1
  /** Fractional worm steps carried to the next tick. */
  private moveOwed = 0
  // Spring and Summer's garden features and foes.
  private exits = new Set<number>()
  private apples: Apple[] = []
  private appleTimer = 0
  private caught = 0
  private padTimer = 0
  private padShift = 0
  private leafPiles: Array<{ col: number; row: number }> = []
  private leafGust = LEAF_GUST_TICKS
  private crow: CrowBot | null = null
  private crowTimer = CROW_EVERY
  private leafWind: 1 | -1 = 1
  private rakedLeaves = 0
  private pumpkins: Pumpkin[] = []
  private inchworms: Inchworm[] = []
  private slowTicks = 0
  private frostTimer = FROST_SPREAD_TICKS
  private frostSprite: FrostSprite | null = null
  private frostSpriteTimer = FROST_SPRITE_EVERY
  private frostMillipede: FrostSegment[] = []
  private frostRay: FrostRay | null = null
  private glideX = 0
  private glideY = 0
  private snowballs: Snowball[] = []
  private snowballsFixed = 0
  private mole: MoleBot | null = null
  private moleTimer = MOLE_WAIT_TICKS
  private dragonflies: Dragonfly[] = []
  private dragonflyTimer = 0
  private bees: Bee[] = []
  private beeTimer = 0
  private beesCrossed = 0
  private kindLost = false
  private sprayersLost = 0
  private boss: BossFight | null = null
  private queenHead: QueenHead | null = null
  private mower: Mower | null = null
  /** Mow-Bot fixed: it mows neat stripes into the lawn for the rest of the garden. */
  private mown = false
  // The run's meta: petals for the shed, its kit, the trowels, the furthest garden reached.
  private petals = 0
  private kit: Kit = { ...NEW_KIT }
  private trowels = new Set<string>()
  private reached = 1
  private champion = false
  private trueChampion = false
  private credits: 'season' | 'true' | null = null
  private selectEnabled = false
  private mode: GardenMode = 'campaign'
  private dailyDay = ''
  private medals: Record<string, number> = {}
  private waveFullPatch = false
  private medalPage = false
  private earned = new Set<string>()
  get mastered(): readonly string[] {
    return [...this.earned]
  }

  get scoreBoard(): string | null {
    return this.mode === 'endless' && this.playerCount === 1 ? 'glitch-garden' : null
  }

  get menuOpen(): boolean {
    return !!this.menu || this.medalPage || !!this.credits || !!this.shed
  }
  private rootLane = 6
  private shed: Shed | null = null
  private menu: Menu | null = null
  private card = 0
  /** What the cabinet keeps for this game (utils/arcade/saves.ts). */
  save: GardenSave | null = null
  private dead = 0
  private clear = 0
  private extras = 0
  private nextExtra = extraAt(1)
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(47)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.playerCount = !this.demo && options.players === 2 ? 2 : 1
    if (this.playerCount === 2) this.px = W * 0.25
    this.selectEnabled = !!options.selectScreen && !this.demo
    this.hiScore = options.hiScore
    this.startWave(1)
    // The save is read after the first garden is planted, so its run isn't overwritten.
    const stored = this.demo ? null : readGardenSave(options.resume)
    if (stored) {
      this.reached = stored.reached
      this.trowels = new Set(stored.trowels)
      this.champion = stored.champion === true
      this.trueChampion = stored.trueChampion === true
      this.medals = { ...stored.medals }
      this.save = stored
    }
    this.openGardenMenu(stored?.run ?? null)
  }

  private openGardenMenu(run: GardenSave['run']) {
    const items: Menu['items'] = []
    if (run)
      items.push({
        label: `CONTINUE: ${gardenAt(run.garden).name}`,
        garden: run.garden,
        resume: true,
      })
    if (this.selectEnabled)
      for (let g = 0; g < this.reached; g++)
        items.push({
          label: `${g + 1}  ${GARDENS[g]!.name}`,
          garden: g,
          resume: false,
        })
    if (this.selectEnabled && hasAllTrowels(this.trowels))
      items.push({
        label: '★ MIDNIGHT GARDEN',
        garden: MIDNIGHT_INDEX,
        resume: false,
      })
    if (this.selectEnabled && this.champion)
      items.push({
        label: 'OVERGROWN • NEW GAME+',
        garden: 0,
        resume: false,
        overgrown: true,
      })
    if (this.selectEnabled) {
      items.push(
        { label: 'ENDLESS LAWN', garden: 0, resume: false, mode: 'endless' },
        { label: 'MEDAL BOARD', garden: 0, resume: false, mode: 'medals' },
      )
    }
    if (this.selectEnabled && this.playerCount === 1)
      items.splice(-1, 0, {
        label: 'DAILY GARDEN', garden: 0, resume: false, mode: 'daily',
      })
    if (this.selectEnabled && this.playerCount === 2)
      items.splice(-1, 0, {
        label: 'GARDEN RIVALS', garden: 0, resume: false, mode: 'rivals',
      })
    if (items.length) {
      if (!items.some((i) => !i.resume))
        items.push({
          label: `1  ${KITCHEN_PLOT.name}`,
          garden: 0,
          resume: false,
        })
      this.menu = { items, cursor: 0 }
    }
  }

  /** Trail steps between one segment and the next: a cell's worth of pixel steps. */
  private get spacing(): number {
    return CELL
  }

  private idx(col: number, row: number): number {
    return row * COLS + col
  }

  private at(col: number, row: number): Obstacle | null {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
    return this.grid[this.idx(col, row)]!
  }

  /**
   * A fresh garden: its authored layout (lamps, cans, trees, sunflowers and the maze's exit) on a
   * cleared lawn, plus whatever the shed sent along (a prism flower in its lane, extra cans).
   */
  private plantLayout(garden: Garden) {
    this.grid.fill(null)
    this.flowers = []
    this.exits = new Set()
    const put = (letter: string, make: () => Obstacle) => {
      for (const [col, row] of layoutCells(garden, letter))
        if (col < COLS && row < ROWS) this.grid[this.idx(col, row)] = make()
    }
    put(LAYOUT_LAMP, () => ({ hp: LAMP_HP, kind: 'lamp' }))
    put(LAYOUT_CAN, () => ({ hp: 1, kind: 'can' }))
    put(LAYOUT_HEATER, () => ({ hp: 1, kind: 'heater', lit: false }))
    put(LAYOUT_TREE, () => ({ hp: 1, kind: 'tree' }))
    put(LAYOUT_SUNFLOWER, () => ({ hp: 1, kind: 'sunflower' }))
    for (const [col, row] of layoutCells(garden, LAYOUT_EXIT))
      this.exits.add(this.idx(col, row))
    if (this.kit.prismLane !== null) {
      const col = this.kit.prismLane
      const row = BED_TOP - 2
      if (!this.at(col, row))
        this.flowers.push({ col, row, prism: prismFor(col, row) })
      this.kit = { ...this.kit, prismLane: null }
    }
    if (this.kit.cans > 0) {
      this.plantCans(this.kit.cans)
      this.kit = { ...this.kit, cans: 0 }
    }
    this.apples = []
    this.leafPiles = []
    this.pumpkins = []
    this.inchworms = []
    this.snowballs = []
    this.mole = null
    this.glideX = 0
    this.glideY = 0
    this.mown = false
    this.padShift = 0
  }

  private plantSnowballs(count: number, preserveFixed = false) {
    if (!preserveFixed) this.snowballsFixed = 0
    this.snowballs = Array.from({ length: count }, (_, i) => ({
      x: (4 + ((i * 7) % 23)) * CELL + 4,
      y: HUD + (2 + (i % 3)) * CELL,
      hp: SNOWBALL_HP,
      vy: 0.65 + 0.12 * i,
    }))
  }

  private updateSnowballs() {
    for (const snowball of this.snowballs) {
      snowball.y += snowball.vy
      const col = Math.floor(snowball.x / CELL)
      const row = Math.floor((snowball.y - HUD) / CELL)
      const lamp = this.at(col, row)
      if (lamp && lamp.kind === 'lamp') {
        this.grid[this.idx(col, row)] = null
        this.burst(snowball.x, snowball.y, 3, RAMPS.sky[4])
      }
    }
    this.snowballs = this.snowballs.filter((ball) => ball.y < H + CELL)
  }

  private hitSnowball(x: number, y: number): boolean {
    const snowball = this.snowballs.find(
      (ball) => Math.abs(ball.x - x) < 7 && Math.abs(ball.y - y) < 7,
    )
    if (!snowball) return false
    snowball.hp--
    this.sound.play('blip')
    if (snowball.hp > 0) return true
    this.snowballs = this.snowballs.filter((ball) => ball !== snowball)
    this.snowballsFixed++
    this.registerHit()
    this.addScore(SNOWBALL_POINTS * this.multiplier, x, y)
    this.burst(x, y, 12, RAMPS.sky[4])
    if (
      this.wave.objective?.kind === 'snow-day' &&
      this.snowballsFixed >= this.wave.objective.count
    )
      this.meetObjective()
    return true
  }

  private updateMole() {
    if (!this.wave.mole) return
    const mole = this.mole
    if (!mole) {
      if (--this.moleTimer > 0) return
      this.mole = {
        x: this.px,
        y: Math.max(BED_Y + 7, Math.min(H - 12, this.py - 6)),
        phase: 'tell',
        ticks: MOLE_TELL_TICKS,
      }
      this.sound.play('warn')
      return
    }
    if (--mole.ticks > 0) return
    if (mole.phase === 'tell') {
      mole.phase = 'up'
      mole.ticks = MOLE_UP_TICKS
      this.sound.play('pop')
    } else {
      this.mole = null
      this.moleTimer = MOLE_WAIT_TICKS
    }
  }

  private hitMole(x: number, y: number): boolean {
    const mole = this.mole
    if (
      !mole ||
      mole.phase !== 'up' ||
      Math.abs(mole.x - x) >= 9 ||
      Math.abs(mole.y - y) >= 10
    )
      return false
    this.mole = null
    this.moleTimer = MOLE_WAIT_TICKS
    this.registerHit()
    this.addScore(MOLE_POINTS * this.multiplier, x, y)
    this.burst(x, y, 14, RAMPS.gold[4])
    this.sound.play('extra')
    return true
  }

  private inHeat(col: number, row: number): boolean {
    for (const [hc, hr] of layoutCells(this.garden, LAYOUT_HEATER)) {
      if (!this.at(hc, hr)?.lit) continue
      if (Math.hypot(hc - col, hr - row) <= HEATER_RADIUS) return true
    }
    return false
  }

  private thawHeater(col: number, row: number) {
    const heater = this.at(col, row)
    if (!heater || heater.kind !== 'heater' || heater.lit) return
    heater.lit = true
    for (let dy = -HEATER_RADIUS; dy <= HEATER_RADIUS; dy++)
      for (let dx = -HEATER_RADIUS; dx <= HEATER_RADIUS; dx++) {
        if (Math.hypot(dx, dy) > HEATER_RADIUS) continue
        const lamp = this.at(col + dx, row + dy)
        if (!lamp?.frosted) continue
        lamp.frosted = false
        lamp.hp = Math.min(LAMP_HP, lamp.hp)
      }
    this.sound.play('level')
    this.burst(col * CELL + 4, HUD + row * CELL + 4, 14, RAMPS.gold[4])
    const lit = layoutCells(this.garden, LAYOUT_HEATER).filter(
      ([x, y]) => this.at(x, y)?.lit,
    ).length
    this.banner = {
      text: `HEATER ${lit} ONLINE!`,
      sub: 'FROST MELTS NEAR THE LIGHT',
      ticks: 75,
    }
    if (
      this.wave.objective?.kind === 'warm-heaters' &&
      lit >= this.wave.objective.count
    )
      this.meetObjective()
  }

  private plantFrost(count: number) {
    for (const lamp of this.grid) {
      if (lamp?.frosted) {
        lamp.frosted = false
        lamp.hp = Math.min(LAMP_HP, lamp.hp)
      }
      if (lamp?.kind === 'heater') lamp.lit = false
    }
    let frosted = 0
    for (let row = 0; row < BED_TOP && frosted < count; row++)
      for (let col = 0; col < COLS && frosted < count; col++) {
        const lamp = this.at(col, row)
        if (lamp?.kind !== 'lamp' || this.inHeat(col, row)) continue
        lamp.frosted = true
        lamp.hp = FROST_HP
        frosted++
      }
    this.frostTimer = FROST_SPREAD_TICKS
    this.frostSprite = null
    this.frostSpriteTimer = FROST_SPRITE_EVERY
  }

  private updateFrostSprite() {
    if (this.wave.frost === 0) return
    if (!this.frostSprite) {
      if (--this.frostSpriteTimer > 0) return
      this.frostSpriteTimer = FROST_SPRITE_EVERY
      const rows: number[] = []
      for (let row = 0; row < BED_TOP; row++) {
        for (let col = 0; col < COLS; col++) {
          const lamp = this.at(col, row)
          if (lamp?.kind !== 'lamp' || lamp.frosted || this.inHeat(col, row))
            continue
          rows.push(row)
          break
        }
      }
      if (!rows.length) return
      const row = rows[Math.floor(this.rng() * rows.length)]!
      const vx = this.rng() < 0.5 ? -1 : 1
      this.frostSprite = {
        x: vx > 0 ? -8 : W + 8,
        y: HUD + row * CELL + 4,
        vx,
      }
      this.sound.play('warn')
    }
    const sprite = this.frostSprite
    sprite.x += sprite.vx
    const col = Math.floor(sprite.x / CELL)
    const row = Math.floor((sprite.y - HUD) / CELL)
    const lamp = this.at(col, row)
    if (lamp?.kind === 'lamp' && !lamp.frosted && !this.inHeat(col, row)) {
      lamp.frosted = true
      lamp.hp = Math.max(lamp.hp, FROST_HP)
    }
    if (sprite.x < -10 || sprite.x > W + 10) this.frostSprite = null
  }

  private hitFrostSprite(x: number, y: number): boolean {
    const sprite = this.frostSprite
    if (!sprite || Math.abs(sprite.x - x) > 7 || Math.abs(sprite.y - y) > 6)
      return false
    this.frostSprite = null
    this.frostSpriteTimer = FROST_SPRITE_EVERY
    this.registerHit()
    this.addScore(FROST_SPRITE_POINTS * this.multiplier, x, y)
    this.burst(x, y, 12, RAMPS.sky[4])
    this.sound.play('extra')
    return true
  }

  private updateFrost() {
    if (this.wave.frost === 0 || --this.frostTimer > 0) return
    this.frostTimer = FROST_SPREAD_TICKS
    const targets: Array<[number, number]> = []
    for (let row = 0; row < BED_TOP; row++)
      for (let col = 0; col < COLS; col++) {
        const lamp = this.at(col, row)
        if (lamp?.kind !== 'lamp' || lamp.frosted || this.inHeat(col, row))
          continue
        let nearby = false
        for (let dy = -6; dy <= 6 && !nearby; dy++)
          for (let dx = -6; dx <= 6 && !nearby; dx++)
            if (
              Math.abs(dx) + Math.abs(dy) <= 6 &&
              this.at(col + dx, row + dy)?.frosted
            )
              nearby = true
        if (nearby) targets.push([col, row])
      }
    if (!targets.length) return
    const [col, row] = targets[Math.floor(this.rng() * targets.length)]!
    const lamp = this.at(col, row)!
    lamp.frosted = true
    lamp.hp = Math.max(lamp.hp, FROST_HP)
  }

  /** Each wave plants its own cover from the garden's authored leaf anchors. */
  private plantLeaves(count: number, bedOnly: boolean) {
    const anchors = layoutCells(this.garden, LAYOUT_LEAF)
    const eligible = bedOnly
      ? anchors.filter(([, row]) => row >= BED_TOP)
      : anchors
          .filter(([, row]) => row < BED_TOP)
          .concat(anchors.filter(([, row]) => row >= BED_TOP))
    this.leafPiles = eligible
      .slice(0, count)
      .map(([col, row]) => ({ col, row }))
  }

  private updateLeaves() {
    if (!this.leafPiles.length || --this.leafGust > 0) return
    this.leafGust = LEAF_GUST_TICKS
    this.leafWind = this.leafWind === 1 ? -1 : 1
    for (const leaf of this.leafPiles) {
      leaf.col = Math.max(0, Math.min(COLS - 1, leaf.col + this.leafWind))
    }
  }

  private updateCrow() {
    if (
      (this.garden.id !== 'leaf-pile-lane' &&
        this.garden.season !== 'midnight') ||
      this.wave.leaves < 5
    )
      return
    if (!this.crow) {
      if (--this.crowTimer > 0) return
      this.crowTimer = CROW_EVERY
      const targets = this.flowers.filter(
        (flower) =>
          this.boss?.id !== 'root-kernel' || flower.col !== this.rootLane,
      )
      if (!targets.length) return
      const target = targets[Math.floor(this.rng() * targets.length)]!
      const x = target.col < COLS / 2 ? W - 8 : 8
      const y = HUD + 16
      this.crow = {
        x,
        y,
        startX: x,
        startY: y,
        target,
        phase: 'tell',
        ticks: CROW_TELL_TICKS,
      }
      this.sound.play('warn')
      return
    }
    const crow = this.crow
    if (crow.phase === 'tell') {
      if (--crow.ticks <= 0) {
        crow.phase = 'swoop'
        crow.ticks = CROW_SWOOP_TICKS
      }
      return
    }
    if (crow.phase === 'swoop') {
      const progress = 1 - --crow.ticks / CROW_SWOOP_TICKS
      const x = crow.target.col * CELL + CELL / 2
      const y = HUD + crow.target.row * CELL + CELL / 2
      crow.x = crow.startX + (x - crow.startX) * progress
      crow.y = crow.startY + (y - crow.startY) * progress
      if (crow.ticks > 0) return
      if (this.flowers.includes(crow.target)) {
        this.flowers = this.flowers.filter((f) => f !== crow.target)
        this.banner = {
          text: 'PRISM PLUCKED!',
          sub: 'FIX THE CROW DURING ITS SWOOP',
          ticks: 80,
        }
        this.sound.play('warn')
      }
      crow.phase = 'exit'
      return
    }
    crow.y -= 3
    crow.x += crow.startX < W / 2 ? 2 : -2
    if (crow.y < HUD - 8 || crow.x < -8 || crow.x > W + 8) this.crow = null
  }

  private hitCrow(x: number, y: number): boolean {
    const crow = this.crow
    if (!crow || crow.phase !== 'swoop') return false
    if (Math.hypot(crow.x - x, crow.y - y) > 7) return false
    this.crow = null
    this.crowTimer = CROW_EVERY
    this.registerHit()
    this.addScore(CROW_POINTS * this.multiplier, x, y)
    this.burst(x, y, 10, RAMPS.gold[3])
    this.sound.play('extra')
    return true
  }

  /** A leaf absorbs the first spray so the player must rake a lane clear. */
  private hitLeaf(col: number, row: number): boolean {
    const index = this.leafPiles.findIndex(
      (leaf) => leaf.col === col && leaf.row === row,
    )
    if (index < 0) return false
    this.leafPiles.splice(index, 1)
    this.rakedLeaves++
    const x = col * CELL + CELL / 2
    const y = HUD + row * CELL + CELL / 2
    this.registerHit()
    this.addScore(75 * this.multiplier, x, y)
    this.burst(x, y, 5, RAMPS.gold[3])
    this.sound.play('pop')
    const goal = this.wave.objective
    if (goal?.kind === 'clear-leaves' && this.rakedLeaves >= goal.count) {
      this.meetObjective()
    }
    return true
  }

  /** Pumpkins use two-by-two or four-by-four collision sprites, not map walls. */
  private plantPumpkins(plan: GardenWave) {
    const spots = layoutCells(this.garden, LAYOUT_PUMPKIN)
    this.pumpkins = spots.slice(0, plan.pumpkins).map(([col, row]) => ({
      x: (col + 1) * CELL,
      y: HUD + (row + 1) * CELL,
      hp: PUMPKIN_HP,
      maxHp: PUMPKIN_HP,
      rolling: false,
      giant: false,
      vx: 0,
      vy: 0,
    }))
    for (let i = 0; i < plan.rollers; i++) {
      this.pumpkins.push({
        x: (5 + ((i * 13) % 20)) * CELL,
        y: HUD + (i + 3) * CELL,
        hp: ROLLER_HP,
        maxHp: ROLLER_HP,
        rolling: true,
        giant: false,
        vx: i % 2 === 0 ? 0.7 : -0.7,
        vy: 0.55 + i * 0.1,
      })
    }
    if (plan.objective?.kind === 'great-pumpkin') {
      this.pumpkins.push({
        x: W / 2,
        y: HUD + 4 * CELL,
        hp: GIANT_PUMPKIN_HP,
        maxHp: GIANT_PUMPKIN_HP,
        rolling: true,
        giant: true,
        vx: 0.8,
        vy: 0.32,
      })
    }
    this.inchworms = Array.from({ length: plan.inchworms }, (_, i) => ({
      x: i % 2 === 0 ? -10 : W + 10,
      y: HUD + (9 + i * 6) * CELL,
      vx: i % 2 === 0 ? 0.65 : -0.65,
    }))
  }

  private updatePumpkins() {
    const bed = HUD + (BED_TOP + 1) * CELL
    for (const pumpkin of this.pumpkins) {
      if (!pumpkin.rolling) continue
      const radius = pumpkin.giant ? 16 : 8
      if (pumpkin.y < bed) {
        pumpkin.y = Math.min(bed, pumpkin.y + pumpkin.vy)
      } else {
        pumpkin.x += pumpkin.vx
        if (pumpkin.x < radius || pumpkin.x > W - radius) {
          pumpkin.vx *= -1
          pumpkin.x = Math.max(radius, Math.min(W - radius, pumpkin.x))
        }
      }
    }
  }

  private breakPumpkin(pumpkin: Pumpkin) {
    this.pumpkins = this.pumpkins.filter((p) => p !== pumpkin)
    this.addScore(
      (pumpkin.giant ? 2000 : 250) * this.multiplier,
      pumpkin.x,
      pumpkin.y,
    )
    this.burst(pumpkin.x, pumpkin.y, pumpkin.giant ? 22 : 10, RAMPS.gold[3])
    this.sound.play('pop')
    const col = Math.floor(pumpkin.x / CELL)
    const row = Math.floor((pumpkin.y - HUD) / CELL)
    for (const [dx, dy] of [
      [-1, -1],
      [0, -1],
      [-1, 0],
      [0, 0],
    ] as const) {
      const c = col + dx
      const r = row + dy
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS && !this.at(c, r)) {
        this.grid[this.idx(c, r)] = { hp: SPROUT_HP, kind: 'sprout' }
      }
    }
    if (pumpkin.giant) this.meetObjective()
    if (pumpkin.hydra && this.boss?.id === 'gourd-hydra') {
      const alive = this.pumpkins.filter((p) => p.hydra)
      this.boss.phase = 4 - alive.length
      if (alive.length === 1) {
        const last = alive[0]!
        last.rolling = true
        last.lit = true
        last.vy = 0.75
        last.vx = last.x < W / 2 ? 1.4 : -1.4
        this.banner = {
          text: 'ONE HEAD LEFT!',
          sub: 'IT ROLLS INTO THE BED',
          ticks: 90,
        }
        this.sound.play('warn')
      } else if (!alive.length) {
        this.defeatBoss(pumpkin.x, pumpkin.y)
      } else {
        this.banner = {
          text: 'ONE HYDRA HEAD FIXED!',
          sub: 'THE OTHERS GET FASTER',
          ticks: 90,
        }
      }
    }
  }

  private hitPumpkin(x: number, y: number): boolean {
    const pumpkin = this.pumpkins.find((p) => {
      const radius = p.giant ? 16 : 8
      return Math.abs(x - p.x) <= radius && Math.abs(y - p.y) <= radius
    })
    if (!pumpkin) return false
    if (pumpkin.hydra && !pumpkin.lit) {
      this.sound.play('blip')
      return true
    }
    pumpkin.hp--
    this.registerHit()
    this.sound.play('blip')
    if (pumpkin.hp <= 0) this.breakPumpkin(pumpkin)
    else if (pumpkin.giant && pumpkin.hp % 6 === 0) {
      this.banner = {
        text: 'THE GREAT PUMPKIN CRACKS',
        sub: `${pumpkin.hp} SPRAYS TO GO`,
        ticks: 60,
      }
    }
    return true
  }

  private updateInchworms() {
    for (const worm of this.inchworms) {
      if (this.tick % 20 < 12) continue
      worm.x += worm.vx
    }
    this.inchworms = this.inchworms.filter(
      (worm) => worm.x > -14 && worm.x < W + 14,
    )
  }

  private hitInchworm(x: number, y: number): boolean {
    const worm = this.inchworms.find(
      (i) => Math.abs(i.x - x) < 9 && Math.abs(i.y - y) < 7,
    )
    if (!worm) return false
    this.inchworms = this.inchworms.filter((i) => i !== worm)
    this.slowTicks = INCHWORM_SLOW_TICKS
    this.addScore(400 * this.multiplier, worm.x, worm.y)
    this.banner = {
      text: 'INCHWORM FIXED!',
      sub: 'THE GLITCH SLOWS FOR FIVE SECONDS',
      ticks: 90,
    }
    this.burst(worm.x, worm.y, 14, RAMPS.teal[3])
    this.sound.play('extra')
    return true
  }

  private get canCount(): number {
    return this.grid.filter((ob) => ob?.kind === 'can').length
  }

  /** Fresh cans for the wave, in the upper lawn, never more than the cap on the field. */
  private plantCans(count: number) {
    for (let tries = 0; count > 0 && tries < count * 12; tries++) {
      if (this.canCount >= MAX_CANS) return
      const col = 2 + Math.floor(this.rng() * (COLS - 4))
      const row = 3 + Math.floor(this.rng() * 10)
      if (this.at(col, row)) continue
      this.grid[this.idx(col, row)] = { hp: 1, kind: 'can' }
      count--
    }
  }

  // --- waves -------------------------------------------------------------------

  /** The n-th wave or boss of a run (1-based): the campaign decides which garden and step. */
  private startWave(n: number) {
    const { index, lap } = campaignPlay(n)
    this.beginStep(index, lap, n)
  }

  /** The level number (waves and bosses so far, counting laps) of a campaign step. */
  private levelAt(index: number, lap: number): number {
    let plays = 0
    for (let i = 0; i < index; i++)
      if (campaignStepAt(i).kind !== 'shed') plays++
    const perLap = CAMPAIGN.filter((s) => s.kind !== 'shed').length
    return lap * perLap + plays + 1
  }

  private get step(): CampaignStep {
    return campaignStepAt(this.stepIndex)
  }

  private beginStep(index: number, lap: number, level: number) {
    const step = campaignStepAt(index)
    this.stepIndex = index
    this.lap = lap
    if (step.kind === 'shed') {
      this.openShed()
      return
    }
    this.level = level
    const authoredGarden = gardenAt(step.garden)
    const garden =
      this.mode === 'daily'
        ? { ...authoredGarden, layout: dailyGardenPlan(this.dailyDay).layout }
        : this.mode === 'rivals'
          ? {
              ...authoredGarden,
              layout: authoredGarden.layout.map((row) => {
                const left = row.slice(0, COLS / 2)
                return left + [...left].reverse().join('')
              }),
            }
          : authoredGarden
    const fresh = this.planted !== step.garden
    this.garden = garden
    if (fresh) {
      this.plantLayout(garden)
      this.planted = step.garden
    }
    for (const [col, row] of layoutCells(garden, LAYOUT_HEATER)) {
      if (this.at(col, row)?.kind === 'heater') continue
      this.grid[this.idx(col, row)] = { hp: 1, kind: 'heater', lit: false }
      this.flowers = this.flowers.filter((f) => f.col !== col || f.row !== row)
    }
    const base = lapWave(
      gardenWave(garden, step.kind === 'wave' ? step.wave : 5),
      lap,
    )
    const plan: GardenWave =
      step.kind === 'wave'
        ? base
        : {
            ...base,
            heads: 0,
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
            objective: undefined,
            sub: BOSSES[step.boss].sub,
          }
    this.wave = plan
    this.speed = plan.speed
    this.moveOwed = 0
    this.worms = []
    this.snail = null
    this.snailTimer = Math.round(SNAIL_EVERY / 2)
    this.bedTicks = 0
    this.crawlerTimer = 0
    this.laneBlooms = new Set()
    this.objectiveDone = false
    this.objectiveFailed = false
    this.caught = 0
    this.beesCrossed = 0
    this.kindLost = false
    this.sprayersLost = 0
    this.waveFullPatch = this.multiplier === MAX_MULTIPLIER
    this.rakedLeaves = 0
    this.crow = null
    this.crowTimer = CROW_EVERY
    this.leafGust = LEAF_GUST_TICKS
    this.leafWind = plan.leaves > 0 ? (this.rng() < 0.5 ? 1 : -1) : 1
    this.plantLeaves(plan.leaves, plan.objective?.kind === 'clear-leaves')
    this.plantPumpkins(plan)
    this.plantFrost(plan.frost)
    this.plantSnowballs(plan.snowballs)
    this.mole = null
    this.moleTimer = MOLE_WAIT_TICKS
    this.glideX = 0
    this.glideY = 0
    this.slowTicks = 0
    this.dragonflies = []
    this.bees = []
    this.boss = null
    this.frostMillipede = []
    this.frostRay = null
    this.queenHead = null
    this.mower = null
    this.appleTimer = garden.appleEvery ?? 0
    this.dragonflyTimer = 150
    this.beeTimer = 180
    if (!fresh && level > 1) {
      this.creepLamps()
      this.plantCans(plan.cans)
    }
    this.beetleTimer = plan.beetleEvery ?? 0
    if (step.kind === 'boss') {
      this.startBoss(step.boss)
      return
    }
    if (this.mode === 'rivals') {
      this.spawnWorm(5 * CELL, plan.segments, 1)
      this.spawnWorm(24 * CELL, plan.segments, -1)
    } else this.spawnWorm(Math.floor(COLS / 2) * CELL, plan.segments, 1)
    for (let i = 0; i < plan.heads; i++)
      this.spawnWorm(
        Math.floor(this.rng() * COLS) * CELL,
        1,
        this.rng() < 0.5 ? 1 : -1,
      )
    this.banner = plan.objective
      ? { text: plan.sub, sub: plan.objective.hint, ticks: 120 }
      : { text: `WAVE ${level}`, sub: plan.sub, ticks: 80 }
    if (step.wave === 1) {
      // A new garden: its title card, a save point, and one more garden for the select.
      this.card = CARD_TICKS
      this.banner = null
      if (this.mode === 'campaign') {
        this.reached = Math.min(
          GARDENS.length,
          Math.max(this.reached, step.garden + 1),
        )
        this.writeSave(true)
      }
    }
  }

  /** What to keep: the gardens reached, the trowels, and (mid-run) where to pick up. */
  private writeSave(run: boolean) {
    if (this.demo || this.mode !== 'campaign') return
    const step = this.step
    this.save = {
      v: 1,
      reached: this.reached,
      trowels: [...this.trowels],
      ...(this.champion ? { champion: true } : {}),
      ...(this.trueChampion ? { trueChampion: true } : {}),
      ...(Object.keys(this.medals).length
        ? { medals: { ...this.medals } }
        : {}),
      ...(this.save?.dailyBest ? { dailyBest: this.save.dailyBest } : {}),
      run: run
        ? {
            garden: step.garden,
            lap: this.lap,
            score: this.score,
            lives: Math.max(1, this.lives),
            petals: this.petals,
            kit: { ...this.kit },
          }
        : null,
    }
  }

  /** On to the next step of the year (the shed, a wave, a boss), wrapping into the next lap. */
  private advance() {
    if (this.mode === 'rivals') {
      this.finishRivals()
      return
    }
    if (this.mode === 'daily') {
      this.recordDaily(true)
      this.over = true
      this.banner = {
        text: 'DAILY GARDEN FIXED!',
        sub: this.dailyDay,
        ticks: 9999,
      }
      return
    }
    if (this.mode === 'endless') {
      const next = endlessGardenStep(this.level + 1)
      this.beginStep(next.index, next.lap, this.level + 1)
      return
    }
    let index = this.stepIndex + 1
    let lap = this.lap
    if (this.stepIndex >= CAMPAIGN.length) {
      if (index >= CAMPAIGN.length + MIDNIGHT_STEPS.length) {
        this.finishYear(true)
        return
      }
    } else if (index >= CAMPAIGN.length) {
      if (this.selectEnabled && lap === 0) {
        this.finishYear(false)
        return
      }
      index = 0
      lap++
    }
    this.beginStep(index, lap, this.level + 1)
    if (lap > 0 && index === 0)
      this.banner = {
        text: 'IT GROWS BACK!',
        sub: `YEAR ${lap + 1}: THE GLITCH IS FASTER`,
        ticks: 150,
      }
  }

  private finishRivals() {
    this.over = true
    this.beams = []
    const [one, two] = this.rivalsFixed
    this.banner = {
      text: one === two ? 'GARDEN DRAW!' : `PLAYER ${one > two ? 1 : 2} WINS!`,
      sub: `P1 ${one}  /  P2 ${two} SEGMENTS`,
      ticks: 9999,
    }
    this.sound.play('extra')
  }

  private finishYear(secret: boolean) {
    this.champion = true
    this.trueChampion ||= secret
    this.earn('four-seasons')
    if (secret) this.earn('midnight-bloom')
    this.credits = secret ? 'true' : 'season'
    this.beams = []
    this.writeSave(false)
    this.sound.play('extra')
  }

  // --- the Compost Shed ------------------------------------------------------------

  private openShed() {
    this.worms = []
    this.beams = []
    this.volley = null
    this.beetle = null
    this.moth = null
    this.snail = null
    this.apples = []
    this.dragonflies = []
    this.bees = []
    this.shed = {
      cursor: 0,
      lane: Math.floor(COLS / 2),
      ticks: SHED_TICKS,
      note: '',
    }
    this.sound.play('level')
  }

  private updateShed(input: InputFrame) {
    const shed = this.shed!
    const item = SHED_ITEMS[shed.cursor]!
    if (input.pressed.up)
      shed.cursor = (shed.cursor + SHED_ITEMS.length - 1) % SHED_ITEMS.length
    if (input.pressed.down) shed.cursor = (shed.cursor + 1) % SHED_ITEMS.length
    if (item.id === 'prism') {
      if (input.pressed.left) shed.lane = Math.max(0, shed.lane - 1)
      if (input.pressed.right) shed.lane = Math.min(COLS - 1, shed.lane + 1)
    }
    if (input.pressed.a || input.pressed.start) {
      if (item.id === 'done') return this.leaveShed()
      const why = cannotBuy(item, this.kit, this.petals)
      if (why) {
        shed.note = why
        this.sound.play('blip')
      } else {
        const after = buy(item, this.kit, this.petals, shed.lane)
        this.kit = after.kit
        this.petals = after.petals
        shed.note = `${item.name}: THANK YOU!`
        this.sound.play('extra')
      }
    }
    if (input.pressed.b || --shed.ticks <= 0) this.leaveShed()
  }

  private leaveShed() {
    this.shed = null
    this.advance()
  }

  // --- the garden select -----------------------------------------------------------

  private updateMenu(input: InputFrame) {
    const menu = this.menu!
    const n = menu.items.length
    if (input.pressed.up) menu.cursor = (menu.cursor + n - 1) % n
    if (input.pressed.down) menu.cursor = (menu.cursor + 1) % n
    if (!(input.pressed.a || input.pressed.start)) return
    const item = menu.items[menu.cursor]!
    if (item.mode === 'medals') {
      this.medalPage = true
      return
    }
    this.menu = null
    this.mode = item.mode ?? 'campaign'
    this.rivalsFixed = [0, 0]
    this.rivalsShield = [0, 0]
    this.rivalsTicks = RIVALS_TICKS
    this.crossfires = 0
    if (this.playerCount === 2) this.resetPair()
    const run = item.resume ? this.save?.run : null
    this.score = run?.score ?? 0
    this.lives = run?.lives ?? START_LIVES
    this.petals = run?.petals ?? 0
    this.kit = run ? { ...run.kit } : { ...NEW_KIT }
    this.extras = 0
    while (extraAt(this.extras + 1) <= this.score) this.extras++
    this.nextExtra = extraAt(this.extras + 1)
    this.planted = -1
    const lap = run?.lap ?? (item.overgrown ? 1 : 0)
    if (this.mode === 'daily') {
      this.dailyDay = new Date().toISOString().slice(0, 10)
      const daily = dailyGardenPlan(this.dailyDay)
      this.rng = mulberry32(daily.seed)
      this.beginStep(daily.index, 0, 1)
      return
    }
    const index = gardenStart(item.garden)
    this.beginStep(index, lap, this.levelAt(index, lap))
  }

  /**
   * Between waves every lamp and can in the upper lawn creeps down a row (Millipede's drift), so
   * the field never chokes. A lamp that would enter the flowerbed sinks into the soil, and a fresh
   * lamp is planted near the top for each one lost; a can that reaches the bed is simply gone.
   */
  private creepLamps() {
    let lost = 0
    for (let row = BED_TOP - 1; row >= 1; row--)
      for (let col = 0; col < COLS; col++) {
        const ob = this.at(col, row)
        if (!ob || (ob.kind !== 'lamp' && ob.kind !== 'can')) continue
        if (ob.kind === 'can') {
          this.grid[this.idx(col, row)] = null
          if (row + 1 >= BED_TOP) continue
          if (!this.at(col, row + 1)) this.grid[this.idx(col, row + 1)] = ob
          else this.grid[this.idx(col, row)] = ob
          continue
        }
        this.grid[this.idx(col, row)] = null
        if (row + 1 >= BED_TOP) lost++
        else if (!this.at(col, row + 1)) this.grid[this.idx(col, row + 1)] = ob
        else lost++
      }
    for (let tries = 0; lost > 0 && tries < lost * 8; tries++) {
      const col = Math.floor(this.rng() * COLS)
      const row = 1 + Math.floor(this.rng() * 3)
      if (this.at(col, row)) continue
      this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
      lost--
    }
  }

  private spawnWorm(
    x: number,
    segments: number,
    dx: 1 | -1,
    extra: Partial<Worm> = {},
  ): Worm {
    // A worm enters at the top, its body trailing off the screen above.
    const trail: Array<{ x: number; y: number }> = []
    for (let i = 0; i < segments * this.spacing + 1; i++)
      trail.push({ x, y: HUD - Math.floor(i / this.spacing) * CELL - CELL })
    trail[0] = { x, y: HUD }
    const worm: Worm = { trail, segments, dx, dy: 1, ...extra }
    this.worms.push(worm)
    return worm
  }

  private segmentPos(w: Worm, k: number): { x: number; y: number } {
    return w.trail[Math.min(w.trail.length - 1, k * this.spacing)]!
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.medalPage) {
      if (input.pressed.a || input.pressed.b || input.pressed.start)
        this.medalPage = false
      return
    }
    if (this.credits) {
      if (input.pressed.a || input.pressed.start) {
        this.credits = null
        this.openGardenMenu(null)
      }
      return
    }
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    const controls = this.demo ? this.demoInput() : input
    if (this.shed) {
      this.updateShed(this.demo ? this.demoShedInput() : input)
      return
    }
    if (this.card > 0) this.card--
    if (this.dead > 0) {
      if (--this.dead === 0) this.afterDeath()
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.advance()
      return
    }
    if (this.mode === 'rivals') {
      if (--this.rivalsTicks <= 0) return this.finishRivals()
      for (const player of [0, 1] as const)
        if (this.rivalsShield[player] > 0) this.rivalsShield[player]--
    }
    this.moveSprayer(controls)
    this.fireSprayer(0, controls)
    if (this.playerCount === 2 && players?.[1]) {
      const second = players[1]
      this.withSecondSprayer(() => this.moveSprayer(second, 1))
      this.fireSprayer(1, second)
    }
    this.updateBeams()
    this.updateLeaves()
    this.updateCrow()
    this.updateFrost()
    this.updateFrostSprite()
    this.updateSnowballs()
    this.updateMole()
    this.moveWorms()
    if (this.slowTicks > 0) this.slowTicks--
    const slowFrame = this.slowTicks > 0 && this.tick % 2 !== 0
    if (!slowFrame) {
      this.updateBeetle()
      this.updateMoth()
      this.updateSnail()
      this.updateCrawlers()
      this.updateApples()
      this.updatePads()
      this.updateDragonflies()
      this.updateBees()
      this.updatePumpkins()
      this.updateInchworms()
      this.updateBoss()
    }
    this.updateSplashes()
    this.checkHits()
    if (this.playerCount === 2 && this.dead === 0)
      this.checkHits(1)
    if (
      !this.worms.length &&
      this.dead === 0 &&
      (!this.boss || this.boss.defeated) &&
      !this.pumpkins.some((p) => p.giant)
    )
      this.waveFixed()
  }

  /** One beam at a time; with the second beam, another once the first is well on its way. */
  private canFire(player: 0 | 1 = 0): boolean {
    const own = this.beams.filter((b) => !b.child && (b.player ?? 0) === player)
    if (!own.length) return true
    if (!this.kit.twin || own.length >= 2) return false
    const y = player === 0 ? this.py : this.p2.y
    return own.every((b) => b.y < y - 48)
  }

  /** The wave is fixed: settle its objective, the Kind bonus and the trowel, then move on. */
  private waveFixed() {
    this.clear = WAVE_CLEAR_TICKS
    this.cancelSplashes()
    const goal = this.wave.objective
    let sub: string | undefined
    if (goal?.kind === 'maze-exit' && !this.objectiveFailed)
      this.meetObjective()
    if (goal)
      sub = this.objectiveDone ? `${goal.title} DONE` : 'OBJECTIVE MISSED'
    if (this.wave.bees > 0 && !this.kindLost) {
      this.addScore(KIND_BONUS, W / 2, HUD + 60)
      sub = sub ? `${sub}  KIND +${KIND_BONUS}` : `KIND BONUS +${KIND_BONUS}`
    }
    const mask = gardenMedals(
      this.sprayersLost === 0,
      this.wave.bees > 0 && !this.kindLost,
      this.waveFullPatch,
    )
    if (mask & 1) this.earn('clean-patch')
    if (mask & 2) this.earn('kind-pollinator')
    if (mask & 4) this.earn('full-patch')
    if (this.mode === 'endless' && this.level >= 20) this.earn('endless-twenty')
    if (this.mode === 'campaign' && !this.demo && this.lap === 0) {
      const key = String(this.level - 1)
      const earned = (this.medals[key] ?? 0) | mask
      if (earned) {
        this.medals[key] = earned
        if (this.save) this.save = { ...this.save, medals: { ...this.medals } }
      }
    }
    if (
      this.mode === 'campaign' &&
      goal &&
      this.objectiveDone &&
      this.sprayersLost === 0
    ) {
      if (!this.trowels.has(this.garden.id)) {
        this.trowels.add(this.garden.id)
        if (hasAllTrowels(this.trowels)) this.earn('golden-gardener')
        this.petals += TROWEL_PETALS
        sub = 'GOLDEN TROWEL!'
        this.sound.play('extra')
        this.writeSave(true)
      }
    }
    this.banner = { text: 'WAVE FIXED!', sub, ticks: WAVE_CLEAR_TICKS }
    if (this.boss) {
      const boss = BOSSES[this.boss.id]
      this.banner = {
        text: 'BOSS FIXED!',
        sub: boss.thanks,
        ticks: WAVE_CLEAR_TICKS,
      }
    }
    this.sound.play('level')
  }

  /** The special wave's objective met: its bonus and petals, once. */
  private meetObjective() {
    const goal = this.wave.objective
    if (!goal || this.objectiveDone || this.objectiveFailed) return
    this.objectiveDone = true
    this.petals += OBJECTIVE_PETALS
    this.addScore(goal.bonus, W / 2, HUD + 40)
    this.banner = { text: goal.title, sub: 'KIND WORK, GARDENER!', ticks: 90 }
    this.sound.play('extra')
  }

  /** Both sprayers use the same collision and ice movement rules. */
  private withSecondSprayer(action: () => void) {
    const first = { x: this.px, y: this.py, glideX: this.glideX, glideY: this.glideY }
    this.px = this.p2.x
    this.py = this.p2.y
    this.glideX = this.p2.glideX
    this.glideY = this.p2.glideY
    try {
      action()
    } finally {
      this.p2 = { x: this.px, y: this.py, glideX: this.glideX, glideY: this.glideY }
      this.px = first.x
      this.py = first.y
      this.glideX = first.glideX
      this.glideY = first.glideY
    }
  }

  private resetPair() {
    this.px = W * 0.25
    this.py = HUD + (ROWS - 2) * CELL
    this.p2 = { x: W * 0.75, y: this.py, glideX: 0, glideY: 0 }
    for (const center of [7, 22])
      for (let c = center - 1; c <= center + 1; c++)
        for (let row = ROWS - 3; row < ROWS; row++)
          this.grid[this.idx(c, row)] = null
  }

  private fireSprayer(player: 0 | 1, input: InputFrame) {
    if (!(input.held.a || input.held.b) || !this.canFire(player)) return
    const x = player === 0 ? this.px : this.p2.x
    const y = player === 0 ? this.py : this.p2.y
    this.beams.push(this.newBeam(x, y - 6, false, player))
    if (!this.volley) this.volley = { hits: 0, landed: false }
  }

  private moveSprayer(input: InputFrame, player: 0 | 1 = 0) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= SPRAYER_SPEED
    if (input.held.right) dx += SPRAYER_SPEED
    if (input.held.up) dy -= SPRAYER_SPEED
    if (input.held.down) dy += SPRAYER_SPEED
    if (this.garden.icyBed) {
      this.glideX = Math.max(
        -ICE_MAX_SPEED,
        Math.min(
          ICE_MAX_SPEED,
          this.glideX * ICE_DRAG + Math.sign(dx) * ICE_ACCEL,
        ),
      )
      this.glideY = Math.max(
        -ICE_MAX_SPEED,
        Math.min(
          ICE_MAX_SPEED,
          this.glideY * ICE_DRAG + Math.sign(dy) * ICE_ACCEL,
        ),
      )
      dx = this.glideX
      dy = this.glideY
    }
    const minY = HUD + BED_TOP * CELL + 4
    const maxY = H - 5
    const left = this.mode === 'rivals' && player === 1 ? W / 2 + 4 : 4
    const right = this.mode === 'rivals' && player === 0 ? W / 2 - 4 : W - 4
    const nx = Math.max(left, Math.min(right, this.px + dx))
    if (!this.blocked(nx, this.py)) this.px = nx
    else this.glideX = 0
    const ny = Math.max(minY, Math.min(maxY, this.py + dy))
    if (!this.blocked(this.px, ny)) this.py = ny
    else this.glideY = 0
  }

  private blocked(x: number, y: number): boolean {
    for (const [ox, oy] of [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3],
    ] as const) {
      const col = Math.floor((x + ox) / CELL)
      const row = Math.floor((y + oy - HUD) / CELL)
      if (this.at(col, row)) return true
    }
    return false
  }

  private newBeam(x: number, y: number, child: boolean, player: 0 | 1 = 0): Beam {
    return { x, y, powers: [], pierce: 0, child, lastMoth: null, lastCell: -1, player }
  }

  /** The patch multiplier shown on the nozzle. */
  get multiplier(): number {
    return multiplierFor(this.streak)
  }

  private registerHit() {
    this.streak++
    if (this.multiplier === MAX_MULTIPLIER) this.waveFullPatch = true
    if (this.volley) this.volley.hits++
  }

  private updateBeams() {
    if (!this.beams.length) return
    for (const beam of [...this.beams]) {
      if (!this.stepBeam(beam))
        this.beams = this.beams.filter((b) => b !== beam)
    }
    if (!this.beams.length && this.volley) {
      if (!this.volley.hits && !this.volley.landed)
        this.streak = streakAfterMiss(this.streak)
      this.volley = null
    }
  }

  /** Picks up the power of any bloomed flower the beam is passing through. */
  private pickUpPower(beam: Beam, col: number, row: number) {
    const flower = this.flowers.find((f) => f.col === col && f.row === row)
    const maxPowers = this.boss?.id === 'root-kernel' ? 4 : MAX_BEAM_POWERS
    if (!flower || beam.powers.length >= maxPowers) return
    if (beam.powers.includes(flower.prism)) return
    if (flower.prism === 'pink' && beam.child) return
    beam.powers.push(flower.prism)
    this.sound.play('blip')
    this.fx.burst(beam.x, beam.y, this.fxRng, {
      count: 4,
      speed: 0.8,
      colours: [PRISM_COLORS[flower.prism], '#ffffff'],
    })
    if (flower.prism === 'gold') beam.pierce = PIERCE_HITS
    if (flower.prism === 'pink') {
      const x =
        beam.x + SPLIT_OFFSET > W - 4
          ? beam.x - SPLIT_OFFSET
          : beam.x + SPLIT_OFFSET
      const twin = this.newBeam(x, beam.y, true, beam.player ?? 0)
      twin.powers = beam.powers.filter((p) => p !== 'pink')
      twin.pierce = beam.pierce
      this.beams.push(twin)
    }
  }

  /** Violet beams bend toward the nearest foe above them. */
  private steerBeam(beam: Beam) {
    let best: { x: number; d: number } | null = null
    const consider = (x: number, y: number) => {
      const dy = beam.y - y
      const dx = x - beam.x
      if (dy < 0 || Math.abs(dx) > HOMING_RANGE) return
      const d = dy + Math.abs(dx)
      if (!best || d < best.d) best = { x, d }
    }
    for (const w of this.worms)
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y >= HUD) consider(p.x + CELL / 2, p.y + CELL / 2)
      }
    if (this.moth) consider(this.moth.x, this.moth.y)
    if (this.beetle) consider(this.beetle.x, this.beetle.y)
    if (this.snail) consider(this.snail.x, this.snail.y)
    if (
      this.boss?.id === 'root-kernel' &&
      !this.boss.defeated &&
      beam.powers.length === 4
    ) {
      const root = this.rootPosition()
      const gap = root.x - beam.x
      beam.x += Math.sign(gap) * Math.min(1, Math.abs(gap))
      return
    }
    const target = best as { x: number; d: number } | null
    if (!target) return
    const gap = target.x - beam.x
    beam.x += Math.sign(gap) * Math.min(1, Math.abs(gap))
  }

  /** Moves one beam; false when it is spent. */
  private stepBeam(beam: Beam): boolean {
    // Step in short hops so it can't skip a lamp.
    for (let s = 0; s < BEAM_SPEED; s += 4) {
      beam.y -= 4
      if (beam.y < HUD) return false
      if (beam.powers.includes('violet')) this.steerBeam(beam)
      if (
        this.mode === 'rivals' &&
        (beam.x < W / 2 ? 0 : 1) !== (beam.player ?? 0)
      ) return false
      const col = Math.floor(beam.x / CELL)
      const row = Math.floor((beam.y - HUD) / CELL)
      this.pickUpPower(beam, col, row)
      if (this.hitPumpkin(beam.x, beam.y)) return false
      if (this.hitInchworm(beam.x, beam.y)) return false
      if (this.hitSnowball(beam.x, beam.y)) return false
      if (this.hitFrostSprite(beam.x, beam.y)) return false
      if (this.hitFrostMillipede(beam.x, beam.y)) return false
      if (this.hitRootKernel(beam)) return false
      if (this.hitMole(beam.x, beam.y)) return false
      if (this.hitLeaf(col, row)) return false
      if (this.hitCrow(beam.x, beam.y)) return false
      // A bee bot in the way soaks up the spray (and the wave's Kind bonus with it).
      if (this.sprayBee(beam.x, beam.y)) return false
      const worm = this.hitWorm(beam.x, beam.y, beam.powers.includes('cyan'), beam.player ?? 0)
      const mower = this.hitMower(beam.x, beam.y)
      if (worm === 'plink' || mower === 'body') {
        if (this.volley) this.volley.landed = true
        this.sound.play('blip')
        return false
      }
      if (
        worm === 'fix' ||
        mower === 'cap' ||
        this.hitMoth(beam, beam.x, beam.y) ||
        this.hitBeetle(beam.x, beam.y) ||
        this.hitSnail(beam.x, beam.y) ||
        this.hitDragonfly(beam.x, beam.y) ||
        this.hitWasp(beam.x, beam.y) ||
        this.hitQueenHead(beam.x, beam.y)
      ) {
        this.registerHit()
        if (beam.pierce <= 0) return false
        beam.pierce--
        if (beam.pierce === 0)
          beam.powers = beam.powers.filter((p) => p !== 'gold')
      }
      const found = this.at(col, row)
      // The beam slips between the sunflowers' tall stalks.
      const ob = found?.kind === 'sunflower' ? null : found
      const cell = this.idx(col, row)
      if (ob && cell !== beam.lastCell) {
        if (ob.kind === 'tree') return false
        if (this.volley) this.volley.landed = true
        this.water(col, row, ob)
        if (beam.pierce <= 0) return false
        beam.lastCell = cell
        beam.pierce--
        if (beam.pierce === 0)
          beam.powers = beam.powers.filter((p) => p !== 'gold')
      }
    }
    return true
  }

  /** A lamp or sprout sprayed: once it's had enough, it blooms into a flower. */
  private water(col: number, row: number, ob: Obstacle) {
    if (ob.kind === 'heater') {
      if (ob.lit) this.reflectFrostHeat(col, row)
      else this.thawHeater(col, row)
      return
    }
    if (ob.kind === 'can') {
      if (!ob.lit) this.splash(col, row, 1)
      return
    }
    if (isWall(ob)) return
    ob.hp--
    this.sound.play('blip')
    if (ob.kind === 'apple' && ob.hp <= 0) {
      // A fallen apple sprayed clean: the lane is open again.
      this.grid[this.idx(col, row)] = null
      this.addScore(20, col * CELL + 4, HUD + row * CELL)
      this.burst(col * CELL + 4, HUD + row * CELL + 4, 5, RAMPS.ember[3])
      return
    }
    if (ob.hp > 0) {
      this.fx.burst(col * CELL + 4, HUD + row * CELL + 3, this.fxRng, {
        count: 3,
        speed: 0.9,
        colours: [RAMPS.water[3], RAMPS.water[4], RAMPS.teal[3]],
      })
      return
    }
    this.bloom(col, row, ob)
  }

  /** A lamp or sprout opens into a flower of its cell's colour. */
  private bloom(col: number, row: number, ob: Obstacle) {
    this.grid[this.idx(col, row)] = null
    this.petals++
    this.flowers = this.flowers.filter((f) => f.col !== col || f.row !== row)
    this.flowers.push({ col, row, prism: prismFor(col, row) })
    if (this.flowers.length > 120) this.flowers.shift()
    this.addScore(
      BLOOM_POINTS * (ob.kind === 'sprout' ? 5 : 1),
      col * CELL + 4,
      HUD + row * CELL,
    )
    this.burst(col * CELL + 4, HUD + row * CELL + 4, 4, '#bbf7d0')
    this.fx.burst(col * CELL + 4, HUD + row * CELL + 4, this.fxRng, {
      count: 8,
      colours: [RAMPS.pink[3], RAMPS.gold[4], RAMPS.leaf[3]],
    })
    this.markLane(col)
  }

  /** The special wave's objective: a bloom in each marked lane pays the bonus once. */
  private markLane(col: number) {
    const goal = this.wave.objective
    if (goal?.kind !== 'bloom-lanes' || this.objectiveDone) return
    if (!goal.lanes.includes(col)) return
    this.laneBlooms.add(col)
    if (goal.lanes.some((lane) => !this.laneBlooms.has(lane))) return
    this.meetObjective()
  }

  // --- sprinkler cans ------------------------------------------------------------

  /**
   * A can bursts: everything within the splash is fixed (worm segments, the beetle, the moth, the
   * snail), the lamps and sprouts around it bloom, and any can close enough is lit to go next.
   */
  private splash(col: number, row: number, chain: number) {
    if (this.at(col, row)?.kind === 'can') this.grid[this.idx(col, row)] = null
    const cx = col * CELL + 4
    const cy = HUD + row * CELL + 4
    const reach = SPLASH_RADIUS * CELL
    this.rings.push({ x: cx, y: cy, life: 24 })
    this.sound.play('pop')
    this.fx.burst(cx, cy, this.fxRng, {
      count: 18,
      speed: 2.2,
      colours: [RAMPS.water[3], RAMPS.water[4], RAMPS.teal[3], '#ffffff'],
    })
    this.addScore(CAN_POINTS * chain, cx, cy - 8)
    for (let guard = 0; guard < 64; guard++) {
      const hit = this.segmentNear(cx, cy, reach, true)
      if (!hit) break
      this.fixSegment(hit.worm, hit.k)
      if (hit.worm.queen) this.queenSplit(hit.worm, hit.k)
    }
    const near = (x: number, y: number) => Math.hypot(x - cx, y - cy) <= reach
    const b = this.beetle
    if (b && near(b.x, b.y)) this.hitBeetle(b.x, b.y)
    const m = this.moth
    if (m && near(m.x, m.y)) this.fixMoth(m)
    const s = this.snail
    if (s && near(s.x, s.y)) this.hitSnail(s.x, s.y)
    const span = Math.ceil(CHAIN_RADIUS)
    for (let r = row - span; r <= row + span; r++)
      for (let c = col - span; c <= col + span; c++) {
        const ob = this.at(c, r)
        if (!ob) continue
        const d = Math.hypot(c - col, r - row)
        if (ob.kind === 'can') {
          if (!ob.lit && d <= CHAIN_RADIUS) {
            ob.lit = true
            this.splashes.push({
              col: c,
              row: r,
              ticks: CHAIN_DELAY,
              chain: chain + 1,
            })
          }
        } else if (d <= SPLASH_RADIUS && !isPermanentFixture(ob)) {
          if (ob.kind === 'apple') this.grid[this.idx(c, r)] = null
          else this.bloom(c, r, ob)
        }
      }
    for (const d of this.dragonflies) if (near(d.x, d.y)) this.fixDragonfly(d)
    const head = this.queenHead
    if (head && near(head.x, head.y)) this.hitQueenHead(head.x, head.y)
  }

  private updateSplashes() {
    if (!this.splashes.length) return
    const due = this.splashes.filter((s) => --s.ticks <= 0)
    this.splashes = this.splashes.filter((s) => s.ticks > 0)
    for (const s of due) this.splash(s.col, s.row, s.chain)
  }

  /** Lit cans go back to waiting (a lost sprayer or a fixed wave stops the chain). */
  private cancelSplashes() {
    for (const s of this.splashes) {
      const ob = this.at(s.col, s.row)
      if (ob) ob.lit = false
    }
    this.splashes = []
  }

  /** The nearest worm segment on screen within `reach` of (x, y). */
  private segmentNear(
    x: number,
    y: number,
    reach: number,
    fixableOnly = false,
  ): { worm: Worm; k: number } | null {
    let best: { worm: Worm; k: number; d: number } | null = null
    for (const worm of this.worms)
      for (let k = 0; k < worm.segments; k++) {
        const p = this.segmentPos(worm, k)
        if (p.y < HUD) continue
        if (fixableOnly && !this.fixable(worm, k)) continue
        const d = Math.hypot(p.x + CELL / 2 - x, p.y + CELL / 2 - y)
        if (d <= reach && (!best || d < best.d)) best = { worm, k, d }
      }
    return best
  }

  /**
   * A beam meets a worm: 'fix' when a segment was fixed, 'plink' when it bounced off Queen
   * Wiggle's armour or a plain segment she won't split at yet, null when it missed.
   */
  private hitWorm(
    x: number,
    y: number,
    freeze = false,
    player: 0 | 1 = 0,
  ): 'fix' | 'plink' | null {
    const pad = this.kit.nozzle ? 2 : 0
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y < HUD) continue
        if (x < p.x - pad || x >= p.x + CELL + pad) continue
        if (y < p.y || y >= p.y + CELL) continue
        if (w.queen && k === 0 && (w.armour ?? 0) > 0) {
          w.armour = (w.armour ?? 0) - 1
          this.registerHit()
          this.fx.burst(p.x + 4, p.y + 2, this.fxRng, {
            count: 6,
            colours: [RAMPS.steel[4], RAMPS.gold[4]],
          })
          return 'plink'
        }
        if (!this.fixable(w, k)) return 'plink'
        this.creditWorm(w, player, p.x + 4, p.y)
        this.fixSegment(w, k, freeze)
        if (w.queen) this.queenSplit(w, k)
        return 'fix'
      }
    }
    return null
  }

  private creditWorm(w: Worm, player: 0 | 1, x: number, y: number) {
    if (this.mode === 'rivals') {
      this.rivalsFixed[player]++
      return
    }
    if (this.playerCount !== 2) return
    const prior = w.crossfire
    if (
      prior && prior.player !== player &&
      this.tick - prior.tick <= CROSSFIRE_TICKS
    ) {
      this.crossfires++
      this.addScore(CROSSFIRE_POINTS, x, y)
      this.banner = { text: 'CROSSFIRE!', sub: '+500 TEAM BONUS', ticks: 60 }
      this.sound.play('extra')
    }
    w.crossfire = { player, tick: this.tick }
  }

  /** Queen Wiggle only splits at her bright joints at first (and her head, once unhelmeted). */
  private fixable(w: Worm, k: number): boolean {
    if (!w.queen || this.boss?.phase !== 1) return true
    if (k === 0) return (w.armour ?? 0) <= 0
    return this.isJoint(w, k)
  }

  private isJoint(w: Worm, k: number): boolean {
    const n = k + (w.offset ?? 0)
    return w.queen === true && n > 0 && n % QUEEN_JOINT_EVERY === 0
  }

  /** A fixed segment drops out as a sprout; the worm splits around it. */
  private fixSegment(w: Worm, k: number, freeze = false) {
    const p = this.segmentPos(w, k)
    const col = Math.floor((p.x + CELL / 2) / CELL)
    const row = Math.floor((p.y - HUD + CELL / 2) / CELL)
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS && !this.at(col, row))
      this.grid[this.idx(col, row)] = { hp: SPROUT_HP, kind: 'sprout' }
    this.addScore(
      (k === 0 ? HEAD_POINTS : BODY_POINTS) * this.multiplier,
      p.x + 4,
      p.y,
    )
    this.burst(p.x + 4, p.y + 4, 8, k === 0 ? '#f0abfc' : '#a5f3fc')
    this.fx.burst(p.x + 4, p.y + 4, this.fxRng, {
      count: k === 0 ? 12 : 6,
      colours: [RAMPS.purple[4], RAMPS.teal[3], RAMPS.pink[3]],
    })
    this.sound.play('pop')
    this.worms = this.worms.filter((o) => o !== w)
    const frozen = freeze ? FREEZE_TICKS : (w.frozen ?? 0)
    if (k > 0)
      this.worms.push({
        ...w,
        segments: k,
        trail: w.trail.slice(0, k * this.spacing + 1),
        frozen,
      })
    if (k < w.segments - 1) {
      // The piece behind grows a head and carries on the way it was going.
      const start = (k + 1) * this.spacing
      const trail = w.trail.slice(start)
      if (!trail.length) return
      const here = trail[0]!
      const back = trail[1] ?? here
      const dx = Math.sign(here.x - back.x) || w.dx
      this.worms.push({
        trail,
        segments: w.segments - k - 1,
        dx: dx as 1 | -1,
        dy: w.dy,
        frozen,
        crossfire: w.crossfire,
        ...(w.queen
          ? { queen: true, offset: (w.offset ?? 0) + k + 1, armour: 0 }
          : {}),
      })
    }
  }

  private moveWorms() {
    // Fractional speeds carry over, so 1.5 really is half again as fast as 1.
    this.moveOwed += this.speed * (this.slowTicks > 0 ? 0.5 : 1)
    const steps = Math.floor(this.moveOwed)
    this.moveOwed -= steps
    const marching = this.boss?.id === 'queen-wiggle' && this.boss.phase === 2
    for (const w of this.worms) {
      if (w.frozen && w.frozen > 0) {
        w.frozen--
        continue
      }
      if (marching && w.queen) continue
      for (let s = 0; s < steps; s++) this.stepWorm(w)
    }
    if (marching) for (let s = 0; s < steps; s++) this.marchQueens()
  }

  /**
   * Queen Wiggle's second phase: her three worms move in step, like a dance line. They all slide
   * the same way, and when any one reaches the edge they all drop a row and turn together.
   */
  private marchQueens() {
    const line = this.worms.filter(
      (w) => w.queen && !(w.frozen && w.frozen > 0),
    )
    if (!line.length) return
    const lead = line[0]!
    const edge = line.some((w) => {
      const x = w.trail[0]!.x
      return lead.dx > 0 ? x + CELL >= W : x <= 0
    })
    let dy = lead.dy
    if (edge) {
      const rows = line.map((w) => Math.round((w.trail[0]!.y - HUD) / CELL))
      if (dy > 0 && Math.max(...rows) + 1 >= ROWS) dy = -1
      else if (dy < 0 && Math.min(...rows) - 1 < BED_TOP) dy = 1
    }
    const dx = (edge ? -lead.dx : lead.dx) as 1 | -1
    for (const w of line) {
      const { x, y } = w.trail[0]!
      w.trail.unshift(edge ? { x, y: y + dy * CELL } : { x: x + lead.dx, y })
      this.trimTrail(w)
      w.dx = dx
      w.dy = dy
    }
  }

  /** One pixel along: across the row, and down a row at a lamp or the edge. */
  private stepWorm(w: Worm) {
    const head = w.trail[0]!
    let { x, y } = head
    if (x % CELL === 0 && (y - HUD) % CELL === 0) {
      const col = x / CELL
      const row = (y - HUD) / CELL
      if (w.plunge) {
        // Diving: straight down a row at a time until it lands in the flowerbed.
        if (row >= BED_TOP || row + 1 >= ROWS) {
          w.plunge = false
          w.dy = -1
        } else {
          y += CELL
          w.trail.unshift({ x, y })
          this.trimTrail(w)
          return
        }
      }
      // The sunflower maze's exit: a worm passing over the gap drops through it.
      if (w.dy > 0 && this.exits.has(this.idx(col, row + 1))) {
        this.wormEscaped()
        w.squeeze = 0
        y += CELL
        w.trail.unshift({ x, y })
        this.trimTrail(w)
        return
      }
      const nextCol = col + w.dx
      const ahead =
        nextCol < 0 || nextCol >= COLS ? null : this.at(nextCol, row)
      const blocked = nextCol < 0 || nextCol >= COLS || ahead !== null
      if (blocked) {
        if (ahead?.glitched && row < BED_TOP) {
          // A glitched lamp: no turning, a dive.
          w.plunge = true
          w.dy = 1
          y += CELL
          w.trail.unshift({ x, y })
          this.trimTrail(w)
          return
        }
        // Turn: down a row (or up again, once it's bouncing in the flowerbed).
        if (row + w.dy >= ROWS) w.dy = -1
        else if (w.dy < 0 && row + w.dy < BED_TOP) w.dy = 1
        w.dx = (w.dx * -1) as 1 | -1
        // A wall below turns it back along its row instead (it follows the lanes), until it has
        // been turned back so often that it squeezes past.
        if (
          w.dy > 0 &&
          isWall(this.at(col, row + 1)) &&
          (w.squeeze ?? 0) < SQUEEZE_AFTER
        ) {
          w.squeeze = (w.squeeze ?? 0) + 1
          const back = col + w.dx
          if (back >= 0 && back < COLS && !this.at(back, row)) {
            x += w.dx
            w.trail.unshift({ x, y })
            this.trimTrail(w)
            return
          }
        }
        w.squeeze = 0
        y += w.dy * CELL
        w.trail.unshift({ x, y })
        this.trimTrail(w)
        return
      }
    }
    x += w.dx
    w.trail.unshift({ x, y })
    this.trimTrail(w)
  }

  /** A worm found the maze exit: the special wave's objective can no longer be met. */
  private wormEscaped() {
    const goal = this.wave.objective
    if (goal?.kind !== 'maze-exit' || this.objectiveFailed) return
    this.objectiveFailed = true
    this.banner = {
      text: 'IT FOUND THE EXIT!',
      sub: 'FIX IT ANYWAY',
      ticks: 90,
    }
    this.sound.play('warn')
  }

  private trimTrail(w: Worm) {
    const keep = w.segments * this.spacing + 1
    if (w.trail.length > keep) w.trail.length = keep
  }

  private updateBeetle() {
    const every = this.wave.beetleEvery
    if (every !== null && !this.beetle && --this.beetleTimer <= 0) {
      this.beetleTimer = every
      const fromLeft = this.rng() < 0.5
      this.beetle = {
        x: fromLeft ? -6 : W + 6,
        y: HUD + (BED_TOP + 1) * CELL,
        vx: (fromLeft ? 1 : -1) * beetleSpeed(this.level),
        vy: 1.2,
        turn: 20,
      }
      this.sound.play('warn')
    }
    const b = this.beetle
    if (!b) return
    b.x += b.vx
    b.y += b.vy
    const top = HUD + (BED_TOP - 2) * CELL
    if (b.y < top || b.y > H - 6) b.vy = -b.vy
    if (--b.turn <= 0) {
      b.turn = 12 + Math.floor(this.rng() * 30)
      b.vy = (this.rng() < 0.5 ? -1 : 1) * (0.6 + this.rng() * 1.2)
    }
    // It nibbles any lamp or sprout it scuttles over (a can is too tough).
    const col = Math.floor(b.x / CELL)
    const row = Math.floor((b.y - HUD) / CELL)
    const ob = this.at(col, row)
    if (ob && ob.kind !== 'can' && !isPermanentFixture(ob) && this.rng() < 0.05)
      this.grid[this.idx(col, row)] = null
    if (b.x < -10 || b.x > W + 10) this.beetle = null
  }

  /** On the waves that call for it, a slime snail crosses the upper lawn glitching every lamp it touches. */
  private updateSnail() {
    if (!this.snail && this.wave.snail && --this.snailTimer <= 0) {
      this.snailTimer = SNAIL_EVERY
      const fromLeft = this.rng() < 0.5
      const row = SNAIL_ROWS[Math.floor(this.rng() * SNAIL_ROWS.length)]!
      this.snail = {
        x: fromLeft ? -8 : W + 8,
        y: HUD + row * CELL + 2,
        vx: (fromLeft ? 1 : -1) * 0.5,
      }
      this.sound.play('warn')
      if (this.kit.siren) {
        this.sound.play('extra')
        this.banner = {
          text: 'SNAIL SIREN!',
          sub: fromLeft ? '→ FROM THE LEFT' : 'FROM THE RIGHT ←',
          ticks: 70,
        }
      }
    }
    const s = this.snail
    if (!s) return
    s.x += s.vx
    const col = Math.floor(s.x / CELL)
    const row = Math.floor((s.y - HUD) / CELL)
    const ob = this.at(col, row)
    if (ob && ob.kind === 'lamp' && !ob.glitched) {
      ob.glitched = true
      this.fx.burst(col * CELL + 4, HUD + row * CELL + 3, this.fxRng, {
        count: 5,
        speed: 0.8,
        colours: [RAMPS.steel[3], RAMPS.teal[3], '#ffffff'],
      })
    }
    if (s.x < -12 || s.x > W + 12) this.snail = null
  }

  private hitSnail(x: number, y: number): boolean {
    const s = this.snail
    if (!s || Math.abs(s.x - x) > 7 || Math.abs(s.y - y) > 6) return false
    this.addScore(SNAIL_POINTS * this.multiplier, s.x, s.y - 8)
    this.burst(s.x, s.y, 12, '#f9a8d4')
    this.fx.burst(s.x, s.y, this.fxRng, {
      count: 14,
      colours: [RAMPS.pink[3], RAMPS.leaf[3], RAMPS.gold[4]],
    })
    this.sound.play('pop')
    this.snail = null
    return true
  }

  // --- the orchard's apples ----------------------------------------------------------

  /**
   * Now and then a tree drops an apple. It falls down its column: catch it in the bed for points
   * (and a petal), or it lands on whatever is below it in the lawn and stays as an obstacle that
   * takes a couple of sprays to clear. One that reaches the bed's floor bruises and is gone.
   */
  private updateApples() {
    const harvest = this.wave.objective?.kind === 'catch-apples'
    const every = this.garden.appleEvery
    if (every && --this.appleTimer <= 0) {
      // The Apple Harvest shakes the trees: twice the apples.
      this.appleTimer = harvest ? Math.round(every / 2) : every
      const trees: Array<[number, number]> = []
      for (let r = 0; r < BED_TOP; r++)
        for (let c = 0; c < COLS; c++)
          if (this.at(c, r)?.kind === 'tree') trees.push([c, r])
      if (trees.length) {
        const [c, r] = trees[Math.floor(this.rng() * trees.length)]!
        if (!this.at(c, r + 1))
          this.apples.push({ x: c * CELL + 4, y: HUD + (r + 1) * CELL + 2 })
      }
    }
    for (const a of [...this.apples]) {
      a.y += APPLE_FALL
      if (
        (Math.abs(a.x - this.px) < 7 && Math.abs(a.y - this.py) < 8) ||
        (this.playerCount === 2 && Math.abs(a.x - this.p2.x) < 7 && Math.abs(a.y - this.p2.y) < 8)
      ) {
        this.catchApple(a)
        continue
      }
      const col = Math.floor(a.x / CELL)
      const row = Math.floor((a.y + 3 - HUD) / CELL)
      const drop = () => (this.apples = this.apples.filter((o) => o !== a))
      if (row >= ROWS) {
        drop()
        this.burst(a.x, H - 4, 5, RAMPS.ember[3])
        continue
      }
      const below = this.at(col, row)
      if (!below || below.kind === 'sunflower') continue
      drop()
      const rest = row - 1
      if (rest >= 1 && rest < BED_TOP && !this.at(col, rest))
        this.grid[this.idx(col, rest)] = { hp: APPLE_HP, kind: 'apple' }
    }
  }

  private catchApple(a: Apple) {
    this.apples = this.apples.filter((o) => o !== a)
    this.caught++
    this.petals++
    this.addScore(APPLE_POINTS, a.x, a.y - 8)
    this.sound.play('blip')
    this.fx.burst(a.x, a.y, this.fxRng, {
      count: 8,
      colours: [RAMPS.ember[3], RAMPS.leaf[3], '#ffffff'],
    })
    const goal = this.wave.objective
    if (goal?.kind === 'catch-apples' && this.caught >= goal.count)
      this.meetObjective()
  }

  // --- the lily pond ---------------------------------------------------------------

  /** The pond's pads drift a cell at a time, carrying their lamps, flowers and worm heads. */
  private updatePads() {
    const rows = this.garden.pondRows
    if (!rows?.length || ++this.padTimer < PAD_EVERY) return
    this.padTimer = 0
    this.padShift++
    rows.forEach((row, i) => {
      const dir = i % 2 === 0 ? 1 : -1
      const line = Array.from({ length: COLS }, (_, c) => this.at(c, row))
      line.forEach((ob, c) => {
        this.grid[this.idx((c + dir + COLS) % COLS, row)] = ob
      })
      for (const f of this.flowers)
        if (f.row === row) f.col = (f.col + dir + COLS) % COLS
      for (const w of this.worms) {
        const h = w.trail[0]!
        if (h.y !== HUD + row * CELL || h.x % CELL !== 0) continue
        const nx = h.x + dir * CELL
        if (nx < 0 || nx + CELL > W || this.at(nx / CELL, row)) continue
        w.trail.unshift({ x: nx, y: h.y })
        this.trimTrail(w)
      }
    })
  }

  // --- the dragonfly bot -----------------------------------------------------------

  /** It darts in a straight burst toward the bed, then stops dead (wings still) before the next. */
  private updateDragonflies() {
    const max = this.wave.dragonflies
    if (
      max > 0 &&
      this.dragonflies.length < max &&
      --this.dragonflyTimer <= 0
    ) {
      this.dragonflyTimer = DRAGONFLY_EVERY
      const fromLeft = this.rng() < 0.5
      this.dragonflies.push({
        x: fromLeft ? -6 : W + 6,
        y: HUD + (16 + Math.floor(this.rng() * 10)) * CELL,
        vx: 0,
        vy: 0,
        dart: false,
        ticks: 20,
        darts: 0,
      })
      this.sound.play('warn')
    }
    for (const d of [...this.dragonflies]) {
      if (--d.ticks <= 0) {
        if (d.dart) {
          d.dart = false
          d.ticks = DRAGONFLY_STOP_TICKS
        } else {
          d.darts++
          d.dart = true
          d.ticks = DRAGONFLY_DART_TICKS
          if (d.darts > 6) {
            d.vx = 0
            d.vy = -DRAGONFLY_DART
          } else {
            const tx = this.px + (this.rng() - 0.5) * 90
            const ty = Math.min(
              H - 10,
              Math.max(HUD + 14 * CELL, this.py - 24 + (this.rng() - 0.5) * 60),
            )
            const dist = Math.hypot(tx - d.x, ty - d.y) || 1
            d.vx = ((tx - d.x) / dist) * DRAGONFLY_DART
            d.vy = ((ty - d.y) / dist) * DRAGONFLY_DART
          }
        }
      }
      if (d.dart) {
        d.x += d.vx
        d.y = Math.min(H - 6, d.y + d.vy)
      }
      if (d.y < HUD - 10 || d.x < -24 || d.x > W + 24)
        this.dragonflies = this.dragonflies.filter((o) => o !== d)
    }
  }

  private hitDragonfly(x: number, y: number): boolean {
    const pad = this.kit.nozzle ? 2 : 0
    const d = this.dragonflies.find(
      (o) => Math.abs(o.x - x) <= 6 + pad && Math.abs(o.y - y) <= 5,
    )
    if (!d) return false
    this.fixDragonfly(d)
    return true
  }

  private fixDragonfly(d: Dragonfly) {
    this.dragonflies = this.dragonflies.filter((o) => o !== d)
    this.addScore(DRAGONFLY_POINTS * this.multiplier, d.x, d.y - 8)
    this.burst(d.x, d.y, 10, RAMPS.teal[3])
    this.fx.burst(d.x, d.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.sky[4], RAMPS.teal[3], RAMPS.gold[4]],
    })
    this.sound.play('pop')
  }

  // --- bee bots and the wasp-glitch --------------------------------------------------

  /**
   * A flight of bee bots crosses the lawn carrying pollen. Spray one and it's soaked (the Kind
   * bonus is gone). A wasp-glitch among them breaks off and dives once it lines up over you.
   */
  private updateBees() {
    const count = this.wave.bees
    if (count > 0 && !this.bees.length && --this.beeTimer <= 0) {
      this.beeTimer = BEE_EVERY
      const fromLeft = this.rng() < 0.5
      const row = 8 + Math.floor(this.rng() * 12)
      const wasp = this.wave.wasp ? Math.floor(this.rng() * count) : -1
      for (let i = 0; i < count; i++)
        this.bees.push({
          x: fromLeft ? -8 - i * 16 : W + 8 + i * 16,
          y: HUD + row * CELL + 4 + (i % 2) * 5,
          vx: (fromLeft ? 1 : -1) * BEE_SPEED,
          wasp: i === wasp,
          diving: false,
          ticks: 0,
        })
    }
    for (const b of [...this.bees]) {
      b.ticks++
      if (b.diving) {
        b.y += WASP_DIVE
        if (b.y > H + 8) this.bees = this.bees.filter((o) => o !== b)
        continue
      }
      b.x += b.vx
      b.y += Math.sin((this.tick + b.x) / 12) * 0.3
      if (
        b.wasp &&
        b.ticks > 90 &&
        b.x > 8 &&
        b.x < W - 8 &&
        Math.abs(b.x - this.px) < 4
      ) {
        b.diving = true
        this.sound.play('warn')
      }
      const across = b.vx > 0 ? b.x > W + 10 : b.x < -10
      if (!across || b.ticks < 30) continue
      this.bees = this.bees.filter((o) => o !== b)
      if (b.wasp) continue
      this.beesCrossed++
      const goal = this.wave.objective
      if (goal?.kind === 'escort-bees' && this.beesCrossed >= goal.count)
        this.meetObjective()
    }
  }

  /** The spray hit a friendly bee: it's soaked and buzzes off, and the Kind bonus is lost. */
  private sprayBee(x: number, y: number): boolean {
    const b = this.bees.find(
      (o) => !o.wasp && Math.abs(o.x - x) <= 5 && Math.abs(o.y - y) <= 5,
    )
    if (!b) return false
    this.bees = this.bees.filter((o) => o !== b)
    this.kindLost = true
    if (this.wave.objective?.kind === 'escort-bees') this.objectiveFailed = true
    this.floaters.push({ x: b.x, y: b.y - 8, text: 'SORRY, BEE!', life: 50 })
    this.burst(b.x, b.y, 6, RAMPS.water[3])
    this.sound.play('blip')
    if (this.volley) this.volley.landed = true
    return true
  }

  private hitWasp(x: number, y: number): boolean {
    const pad = this.kit.nozzle ? 2 : 0
    const b = this.bees.find(
      (o) => o.wasp && Math.abs(o.x - x) <= 5 + pad && Math.abs(o.y - y) <= 5,
    )
    if (!b) return false
    this.bees = this.bees.filter((o) => o !== b)
    this.addScore(WASP_POINTS * this.multiplier, b.x, b.y - 8)
    this.burst(b.x, b.y, 10, RAMPS.ember[3])
    this.fx.burst(b.x, b.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.gold[4], RAMPS.ember[3], '#ffffff'],
    })
    this.sound.play('pop')
    return true
  }

  // --- the season bosses -------------------------------------------------------------

  private startBoss(id: BossId) {
    this.boss = { id, phase: 1, joints: 0, defeated: false }
    this.card = CARD_TICKS
    this.banner = null
    if (id === 'queen-wiggle')
      this.spawnWorm(Math.floor(COLS / 2) * CELL, QUEEN_SEGMENTS_COUNT, 1, {
        queen: true,
        armour: QUEEN_ARMOUR,
        offset: 0,
      })
    else if (id === 'mow-bot') {
      this.mower = this.newMower([MOWER_CAP_HP, MOWER_CAP_HP, MOWER_CAP_HP])
    } else if (id === 'frost-millipede') {
      this.startFrostPhase()
    } else if (id === 'root-kernel') {
      this.rewriteRoot()
    } else {
      this.pumpkins = [5, 15, 25].map((col, i) => ({
        x: col * CELL,
        y: HUD + (12 + i * 2) * CELL,
        hp: HYDRA_HEAD_HP,
        maxHp: HYDRA_HEAD_HP,
        rolling: false,
        giant: false,
        hydra: true,
        lit: i === 0,
        vx: i % 2 === 0 ? 0.45 : -0.45,
        vy: 0,
      }))
    }
    this.sound.play('warn')
  }

  /** A queen segment was fixed: two joints split her into three worms that march in step. */
  private queenSplit(w: Worm, k: number) {
    const boss = this.boss
    if (boss?.id !== 'queen-wiggle' || boss.phase !== 1) return
    if (!this.isJoint(w, k)) return
    boss.joints++
    if (boss.joints < 2) return
    boss.phase = 2
    this.worms = this.worms.filter((o) => !o.queen)
    for (const col of [4, 13, 22])
      this.spawnWorm(col * CELL, 6, 1, { queen: true, offset: 1 })
    this.banner = {
      text: 'SHE SPLITS IN THREE!',
      sub: 'THEY MOVE IN STEP',
      ticks: 90,
    }
    this.sound.play('warn')
  }

  private updateBoss() {
    const boss = this.boss
    if (!boss || boss.defeated) return
    if (boss.id === 'mow-bot') {
      this.updateMower()
      return
    }
    if (boss.id === 'gourd-hydra') {
      this.updateHydra()
      return
    }
    if (boss.id === 'frost-millipede') {
      this.updateFrostMillipede()
      return
    }
    if (boss.id === 'root-kernel') return
    if (boss.phase < 3 && !this.worms.some((w) => w.queen)) {
      boss.phase = 3
      this.queenHead = {
        x: W / 2,
        y: HUD + (BED_TOP - 2) * CELL,
        vx: 1.3 + 0.15 * this.lap,
        vy: 1,
        hp: QUEEN_HEAD_HP,
      }
      this.banner = {
        text: 'HER CROWN BUZZES!',
        sub: 'FIX IT IN THE BED',
        ticks: 90,
      }
      this.sound.play('warn')
    }
    const h = this.queenHead
    if (!h) return
    h.x += h.vx
    h.y += h.vy
    if (h.x < 6 || h.x > W - 6) h.vx = -h.vx
    const top = HUD + (BED_TOP - 3) * CELL
    if (h.y < top || h.y > H - 6) h.vy = -h.vy
    if (this.tick % 37 === 0)
      h.vy = (this.rng() < 0.5 ? -1 : 1) * (0.7 + this.rng() * 0.9)
  }

  /** The Root rewrites the field and exposes a different four-colour firing lane each phase. */
  private rewriteRoot() {
    const phase = this.boss!.phase
    this.rootLane = [6, 15, 23][phase - 1]!
    this.grid.fill(null)
    this.flowers = []
    this.worms = []
    this.beams = []
    this.snail = null
    this.moth = null
    this.beetle = null
    this.bees = []
    this.dragonflies = []
    this.crow = null
    this.frostSprite = null
    this.mole = null
    this.apples = []
    this.leafPiles = []
    this.cancelSplashes()
    for (let row = 5; row < BED_TOP - 2; row += 4)
      for (let col = (row + phase * 3) % 7; col < COLS; col += 7)
        if (Math.abs(col - this.rootLane) > 1)
          this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
    // The four colours are authored here: pink first, violet last, on one clear lane.
    PRISM_ORDER.forEach((prism, i) =>
      this.flowers.push({ col: this.rootLane, row: 27 - i * 2, prism }),
    )
    this.wave = {
      ...this.wave,
      beetleEvery: 420,
      moth: phase === 1,
      snail: phase === 1,
      dragonflies: phase === 1 ? 1 : 0,
      bees: phase === 1 ? 2 : 0,
      wasp: phase === 1,
      leaves: phase === 2 ? 6 : 0,
      rollers: phase === 2 ? 1 : 0,
      inchworms: phase === 2 ? 1 : 0,
      frost: phase === 3 ? 5 : 0,
      snowballs: phase === 3 ? 2 : 0,
      mole: phase === 3,
    }
    this.beetleTimer = 420
    this.plantLeaves(this.wave.leaves, false)
    this.leafPiles = this.leafPiles.filter(
      (leaf) => Math.abs(leaf.col - this.rootLane) > 1,
    )
    this.plantPumpkins(this.wave)
    this.plantFrost(this.wave.frost)
    this.plantSnowballs(this.wave.snowballs)
    this.spawnWorm((this.rootLane < 15 ? 25 : 3) * CELL, 5 + phase, 1)
    this.banner = {
      text: `ROOT REWRITE ${phase}/3`,
      sub: 'ALIGN WITH THE FOUR GLOWING FLOWERS',
      ticks: 100,
    }
  }

  private rootPosition() {
    return { x: this.rootLane * CELL + 4, y: HUD + 13 * CELL + 4 }
  }

  private hitRootKernel(beam: Beam): boolean {
    const boss = this.boss
    if (boss?.id !== 'root-kernel' || boss.defeated) return false
    const { x, y } = this.rootPosition()
    if (Math.hypot(x - beam.x, y - beam.y) > 12) return false
    if (this.volley) this.volley.landed = true
    if (!PRISM_ORDER.every((prism) => beam.powers.includes(prism))) {
      this.sound.play('blip')
      return true
    }
    this.registerHit()
    if (boss.phase < 3) {
      boss.phase++
      this.rewriteRoot()
      this.sound.play('level')
    } else {
      this.defeatBoss(x, y)
      this.worms = []
      this.pumpkins = []
      for (let row = 0; row < BED_TOP; row++)
        for (let col = 0; col < COLS; col++) {
          const ob = this.at(col, row)
          if (ob?.kind === 'lamp' || ob?.kind === 'sprout')
            this.bloom(col, row, ob)
        }
    }
    return true
  }

  private startFrostPhase() {
    const phase = this.boss!.phase
    this.frostMillipede = Array.from({ length: 3 + phase }, (_, slot) => ({
      slot,
      x: W / 2,
      y: HUD + 50,
      thawed: false,
    }))
    this.updateFrostMillipede()
  }

  private updateFrostMillipede() {
    const phase = this.boss!.phase
    const clock = this.tick * (0.018 + phase * 0.004)
    for (const segment of this.frostMillipede) {
      const angle = clock - segment.slot * 0.3
      segment.x = 30 + segment.slot * 30 + Math.sin(angle) * 18
      segment.y =
        phase === 3
          ? HUD + BED_TOP * CELL - 12 + Math.cos(angle) * 26
          : HUD + phase * 54 + Math.cos(angle) * 20
    }
  }

  private reflectFrostHeat(col: number, row: number) {
    if (this.boss?.id !== 'frost-millipede' || this.boss.defeated) return
    if (!this.at(col, row)?.lit) return
    const x = col * CELL + CELL / 2
    const y = HUD + row * CELL + CELL / 2
    const segment = this.frostMillipede
      .filter((part) => !part.thawed)
      .sort(
        (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
      )[0]
    if (!segment) return
    segment.thawed = true
    this.frostRay = { x, y, tx: segment.x, ty: segment.y, ticks: 14 }
    this.registerHit()
    this.sound.play('level')
  }

  private hitFrostMillipede(x: number, y: number): boolean {
    if (this.boss?.id !== 'frost-millipede' || this.boss.defeated) return false
    const part = this.frostMillipede.find(
      (segment) => Math.hypot(segment.x - x, segment.y - y) <= 6,
    )
    if (!part) return false
    if (this.volley) this.volley.landed = true
    if (!part.thawed) {
      this.sound.play('blip')
      return true
    }
    this.frostMillipede = this.frostMillipede.filter((s) => s !== part)
    this.registerHit()
    this.addScore(400 * this.multiplier, x, y)
    this.burst(x, y, 10, RAMPS.sky[4])
    this.sound.play('pop')
    if (this.frostMillipede.length) return true
    if (this.boss.phase === 3) {
      this.defeatBoss(x, y)
      return true
    }
    this.boss.phase++
    this.startFrostPhase()
    this.banner = {
      text: this.boss.phase === 3 ? 'THE ICE COILS!' : 'THE ICE DESCENDS!',
      sub: 'HEAT THEN SPRAY',
      ticks: 90,
    }
    this.sound.play('warn')
    return true
  }

  private updateHydra() {
    const heads = this.pumpkins.filter((p) => p.hydra)
    if (!heads.length) return
    const lit = Math.floor(this.tick / HYDRA_TELL_TICKS) % heads.length
    for (let i = 0; i < heads.length; i++) {
      const head = heads[i]!
      head.lit = heads.length === 1 || i === lit
      if (head.rolling) continue
      head.x += head.vx * (4 - heads.length)
      if (head.x < 18 || head.x > W - 18) {
        head.vx *= -1
        head.x = Math.max(18, Math.min(W - 18, head.x))
      }
    }
  }

  private hitQueenHead(x: number, y: number): boolean {
    const h = this.queenHead
    if (!h || Math.abs(h.x - x) > 7 || Math.abs(h.y - y) > 6) return false
    h.hp--
    this.fx.burst(h.x, h.y, this.fxRng, {
      count: 6,
      colours: [RAMPS.gold[4], RAMPS.pink[3]],
    })
    this.sound.play('blip')
    if (h.hp > 0) return true
    this.queenHead = null
    this.defeatBoss(h.x, h.y)
    return true
  }

  private defeatBoss(x: number, y: number) {
    const boss = this.boss
    if (!boss) return
    boss.defeated = true
    this.addScore(BOSSES[boss.id].bonus, x, y - 10)
    this.petals += TROWEL_PETALS
    this.burst(x, y, 24, RAMPS.gold[4])
    this.fx.burst(x, y, this.fxRng, {
      count: 30,
      speed: 2.4,
      colours: [RAMPS.pink[3], RAMPS.gold[4], RAMPS.leaf[3], RAMPS.sky[3]],
    })
    this.sound.play('extra')
  }

  private newMower(caps: number[]): Mower {
    return {
      x: -MOWER_COLS * CELL,
      y: HUD + CELL,
      dir: 1,
      drop: 0,
      caps,
      chase: false,
      parked: 0,
    }
  }

  /**
   * Mow-Bot 3000 crosses the garden row by row, mowing everything under it. Each fixed fuel cap
   * makes it faster; once it reaches the bed, or with two caps fixed, it chases you sideways.
   */
  private updateMower() {
    const m = this.mower
    if (!m) return
    const mw = MOWER_COLS * CELL
    const mh = MOWER_ROWS * CELL
    const fixed = m.caps.filter((c) => c <= 0).length
    const speed = MOWER_SPEEDS[Math.min(fixed, 2)]! + 0.15 * this.lap
    const bedY = HUD + BED_TOP * CELL
    if (!m.chase && (fixed >= 2 || m.y + mh >= bedY)) {
      m.chase = true
      this.banner = {
        text: 'IT IS IN THE BED!',
        sub: 'DODGE AND AIM AT A CAP',
        ticks: 70,
      }
    }
    if (m.chase) {
      const cx = m.x + mw / 2
      const gap = this.px - cx
      m.x += Math.sign(gap) * Math.min(Math.abs(gap), speed)
      if (gap !== 0) m.dir = gap > 0 ? 1 : -1
      const ty = Math.max(bedY, Math.min(H - mh, this.py - mh / 2))
      const dy = ty - m.y
      m.y += Math.sign(dy) * Math.min(Math.abs(dy), speed * 0.6)
      m.x = Math.max(0, Math.min(W - mw, m.x))
    } else if (m.drop > 0) {
      const d = Math.min(speed, m.drop)
      m.y += d
      m.drop -= d
    } else {
      m.x += m.dir * speed
      if (m.dir > 0 && m.x + mw >= W) {
        m.x = W - mw
        m.dir = -1
        m.drop = mh
      } else if (m.dir < 0 && m.x <= 0) {
        m.x = 0
        m.dir = 1
        m.drop = mh
      }
    }
    // It mows whatever it rolls over (but never the trees or sunflowers).
    const c0 = Math.floor(m.x / CELL)
    const c1 = Math.floor((m.x + mw - 1) / CELL)
    const r0 = Math.floor((m.y - HUD) / CELL)
    const r1 = Math.floor((m.y + mh - 1 - HUD) / CELL)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const ob = this.at(c, r)
        if (ob && !isPermanentFixture(ob)) this.grid[this.idx(c, r)] = null
      }
  }

  /** A beam meets the mower: a fuel cap if it's under one, else it plinks off the body. */
  private hitMower(x: number, y: number): 'cap' | 'body' | null {
    const m = this.mower
    if (!m || this.boss?.defeated) return null
    const mw = MOWER_COLS * CELL
    const mh = MOWER_ROWS * CELL
    if (x < m.x || x >= m.x + mw || y < m.y - 2 || y >= m.y + mh) return null
    const i = MOWER_CAPS.findIndex(
      (off, k) =>
        (m.caps[k] ?? 0) > 0 && x >= m.x + off - 1 && x < m.x + off + 6,
    )
    if (i < 0) return 'body'
    m.caps[i]!--
    this.sound.play('blip')
    if (m.caps[i]! > 0) return 'cap'
    const left = m.caps.filter((c) => c > 0).length
    this.boss!.phase++
    this.burst(m.x + MOWER_CAPS[i]! + 2, m.y + 2, 10, RAMPS.leaf[3])
    if (left > 0) {
      this.banner = {
        text: 'FUEL CAP FIXED!',
        sub: left === 1 ? 'ONE CAP LEFT' : `${left} CAPS LEFT`,
        ticks: 70,
      }
      this.sound.play('pop')
      return 'cap'
    }
    m.parked = 1
    this.mown = true
    this.defeatBoss(m.x + mw / 2, m.y)
    return 'cap'
  }

  /** A worm that lingers in the flowerbed sends loose heads in from the sides. */
  private updateCrawlers() {
    const inBed = this.worms.some(
      (w) => (w.trail[0]!.y - HUD) / CELL >= BED_TOP,
    )
    this.bedTicks = inBed ? this.bedTicks + 1 : 0
    if (!this.wave.crawlers || this.bedTicks < CRAWLER_AFTER) return
    if (--this.crawlerTimer > 0) return
    this.crawlerTimer = CRAWLER_EVERY
    const crawlers = this.worms.filter((w) => w.crawler).length
    if (crawlers >= MAX_CRAWLERS) return
    const fromLeft = this.rng() < 0.5
    const row = BED_TOP + Math.floor(this.rng() * (BED_ROWS - 1))
    const x = fromLeft ? -CELL : W
    const y = HUD + row * CELL
    this.worms.push({
      trail: [{ x, y }],
      segments: 1,
      dx: fromLeft ? 1 : -1,
      dy: 1,
      crawler: true,
    })
    this.sound.play('warn')
  }

  private hitBeetle(x: number, y: number): boolean {
    const b = this.beetle
    if (!b || Math.abs(b.x - x) > 7 || Math.abs(b.y - y) > 6) return false
    // Closer to the sprayer pays more.
    const gap = this.py - b.y
    const points = gap < 16 ? 900 : gap < 40 ? 600 : 300
    this.addScore(points * this.multiplier, b.x, b.y - 8)
    this.burst(b.x, b.y, 12, '#fde047')
    this.fx.burst(b.x, b.y, this.fxRng, { count: 14, speed: 2 })
    this.sound.play('pop')
    this.beetle = null
    return true
  }

  private updateMoth() {
    if (!this.moth && this.wave.moth) {
      let bedLamps = 0
      for (let r = BED_TOP; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) if (this.at(c, r)) bedLamps++
      if (bedLamps < 5 && this.rng() < 0.004)
        this.moth = {
          x: Math.floor(this.rng() * COLS) * CELL + 4,
          y: HUD,
          hp: 2,
        }
    }
    const m = this.moth
    if (!m) return
    const before = Math.floor((m.y - HUD) / CELL)
    m.y += m.hp > 1 ? 1.6 : 3.2
    const row = Math.floor((m.y - HUD) / CELL)
    const col = Math.floor(m.x / CELL)
    // It plants glitch lamps on the way down.
    if (
      row !== before &&
      row > 0 &&
      row < ROWS - 1 &&
      !this.at(col, row) &&
      this.rng() < 0.25
    )
      this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
    if (m.y > H) this.moth = null
  }

  private hitMoth(beam: Beam, x: number, y: number): boolean {
    const m = this.moth
    if (!m || Math.abs(m.x - x) > 5 || Math.abs(m.y - y) > 6) return false
    if (beam.lastMoth === m) return false
    beam.lastMoth = m
    m.hp--
    this.sound.play('blip')
    if (m.hp > 0) return true
    this.fixMoth(m)
    return true
  }

  private fixMoth(m: Moth) {
    this.addScore(MOTH_POINTS * this.multiplier, m.x, m.y - 8)
    this.burst(m.x, m.y, 10, '#e9d5ff')
    this.fx.burst(m.x, m.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.purple[4], RAMPS.pink[3], RAMPS.gold[4]],
    })
    this.sound.play('pop')
    this.moth = null
    return true
  }

  private checkHits(player: 0 | 1 = 0) {
    if (this.mode === 'rivals' && this.rivalsShield[player] > 0) return
    const px = player === 0 ? this.px : this.p2.x
    const py = player === 0 ? this.py : this.p2.y
    const lose = () => {
      if (this.mode === 'rivals') {
        this.rivalsShield[player] = RIVALS_RESPAWN_TICKS
        if (player === 0) {
          this.px = W * 0.25
          this.py = HUD + (ROWS - 2) * CELL
          this.glideX = 0
          this.glideY = 0
        } else {
          this.p2 = { x: W * 0.75, y: HUD + (ROWS - 2) * CELL, glideX: 0, glideY: 0 }
        }
        this.beams = this.beams.filter((beam) => (beam.player ?? 0) !== player)
        this.sound.play('die')
      } else if (player === 1) this.withSecondSprayer(() => this.lose())
      else this.lose()
    }
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (
          Math.abs(p.x + 4 - px) < 6 &&
          Math.abs(p.y + 4 - py) < 6
        ) {
          lose()
          return
        }
      }
    }
    if (
      this.snowballs.some(
        (ball) =>
          Math.abs(ball.x - px) < 8 && Math.abs(ball.y - py) < 8,
      )
    )
      return lose()
    if (
      this.mole?.phase === 'up' &&
      Math.abs(this.mole.x - px) < 9 &&
      Math.abs(this.mole.y - py) < 12
    )
      return lose()
    const b = this.beetle
    if (b && Math.abs(b.x - px) < 7 && Math.abs(b.y - py) < 6)
      return lose()
    const m = this.moth
    if (m && Math.abs(m.x - px) < 6 && Math.abs(m.y - py) < 6)
      return lose()
    const touch = (x: number, y: number, rx: number, ry: number) =>
      Math.abs(x - px) < rx && Math.abs(y - py) < ry
    if (
      this.boss?.id === 'frost-millipede' &&
      this.boss.phase === 3 &&
      this.frostMillipede.some((part) => touch(part.x, part.y, 7, 7))
    )
      return lose()
    if (
      this.pumpkins.some(
        (p) =>
          p.rolling && touch(p.x, p.y, p.giant ? 20 : 12, p.giant ? 18 : 10),
      )
    )
      return lose()
    if (this.dragonflies.some((d) => touch(d.x, d.y, 7, 5))) return lose()
    if (this.bees.some((b) => b.wasp && b.diving && touch(b.x, b.y, 6, 6)))
      return lose()
    const h = this.queenHead
    if (h && touch(h.x, h.y, 7, 6)) return lose()
    const mo = this.mower
    if (mo && !this.boss?.defeated) {
      const mw = MOWER_COLS * CELL
      const mh = MOWER_ROWS * CELL
      if (
        px > mo.x - 3 &&
        px < mo.x + mw + 3 &&
        py > mo.y - 3 &&
        py < mo.y + mh + 3
      )
        lose()
    }
  }

  private lose() {
    this.lives--
    this.sprayersLost++
    this.dead = DEATH_TICKS
    this.beams = []
    this.volley = null
    this.streak = 0
    this.cancelSplashes()
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    this.banner = { text: 'SPRAYER DOWN', ticks: DEATH_TICKS }
  }

  /** After a lost sprayer, half-sprayed lamps perk back up (and pay a little). */
  private afterDeath() {
    if (this.lives <= 0) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
      if (this.mode === 'daily') this.recordDaily(false)
      this.writeSave(false)
      return
    }
    for (const ob of this.grid) {
      if (!ob || (ob.kind !== 'lamp' && ob.kind !== 'sprout')) continue
      if (ob.hp < (ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP)) {
        ob.hp = ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP
        this.addScore(5, W / 2, H / 2)
      }
    }
    // The worms start the wave over from the top, the same lengths (a queen stays a queen).
    const kept = this.worms.filter((w) => !w.crawler)
    this.worms = []
    kept.forEach((w, i) =>
      this.spawnWorm(
        this.boss?.phase === 2
          ? (4 + ((i * 9) % 27)) * CELL
          : ((i * 7 + 15) % COLS) * CELL,
        w.segments,
        this.boss?.phase === 2 ? 1 : i % 2 ? -1 : 1,
        w.queen ? { queen: true, offset: w.offset, armour: w.armour } : {},
      ),
    )
    this.beetle = null
    this.moth = null
    this.snail = null
    this.dragonflies = []
    this.bees = []
    this.crow = null
    this.crowTimer = CROW_EVERY
    this.frostSprite = null
    this.frostSpriteTimer = FROST_SPRITE_EVERY
    this.plantSnowballs(
      Math.max(0, this.wave.snowballs - this.snowballsFixed),
      true,
    )
    this.mole = null
    this.moleTimer = MOLE_WAIT_TICKS
    this.beeTimer = BEE_EVERY / 2
    if (this.queenHead)
      this.queenHead = {
        ...this.queenHead,
        x: W / 2,
        y: HUD + (BED_TOP - 2) * CELL,
      }
    if (this.mower && !this.boss?.defeated)
      this.mower = this.newMower(this.mower.caps)
    this.bedTicks = 0
    this.px = W / 2
    this.py = HUD + (ROWS - 2) * CELL
    this.glideX = 0
    this.glideY = 0
    if (this.playerCount === 2) this.resetPair()
    // Clear a spot to stand in.
    for (let c = 13; c <= 16; c++)
      for (let r = ROWS - 3; r < ROWS; r++) this.grid[this.idx(c, r)] = null
  }

  // --- scoring and effects ----------------------------------------------------

  private earn(id: string) {
    if (!this.demo && this.mode !== 'rivals') this.earned.add(id)
  }

  private recordDaily(cleared: boolean) {
    if (this.demo) return
    const prior = this.save?.dailyBest
    const today = prior?.day === this.dailyDay ? prior : null
    if (cleared) this.earn('daily-bloom')
    const dailyBest = {
      day: this.dailyDay,
      score: Math.max(this.score, today?.score ?? 0),
      cleared: cleared || !!today?.cleared,
    }
    if (this.save) this.save = { ...this.save, dailyBest }
  }

  private addScore(points: number, x: number, y: number) {
    if (this.demo || this.mode === 'rivals') return
    this.score += points
    if (points >= 100)
      this.floaters.push({ x, y, text: String(points), life: 36 })
    if (this.score >= this.nextExtra) {
      this.extras++
      this.nextExtra = extraAt(this.extras + 1)
      this.lives = Math.min(MAX_LIVES, this.lives + 1)
      this.banner = { text: 'EXTRA SPRAYER!', ticks: 80 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.3
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 14 + Math.floor(this.rng() * 12),
        color,
      })
    }
  }

  private updateEffects() {
    if (this.frostRay && --this.frostRay.ticks <= 0) this.frostRay = null
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
    this.fx.update()
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Slides under the lowest worm segment, sidesteps the beetle, sprays away. */
  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: true,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    let target: { x: number; y: number } | null = null
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y < HUD) continue
        if (!target || p.y > target.y) target = { x: p.x + 4, y: p.y }
      }
    }
    // Bosses and darting foes are the targets when they're about.
    for (const d of this.dragonflies)
      if (!d.dart && d.y > HUD) target = { x: d.x, y: d.y }
    if (this.queenHead) target = this.queenHead
    const mo = this.mower
    if (mo && !this.boss?.defeated) {
      const i = mo.caps.findIndex((c) => c > 0)
      if (i >= 0) target = { x: mo.x + MOWER_CAPS[i]! + 2, y: mo.y }
    }
    // Danger close: get away from it first.
    const threats: Array<{ x: number; y: number }> = []
    if (this.beetle) threats.push(this.beetle)
    for (const snowball of this.snowballs) threats.push(snowball)
    if (this.mole) threats.push(this.mole)
    for (const d of this.dragonflies) threats.push(d)
    for (const b of this.bees) if (b.wasp && b.diving) threats.push(b)
    if (this.queenHead) threats.push(this.queenHead)
    for (const pumpkin of this.pumpkins) {
      if (pumpkin.rolling) threats.push(pumpkin)
    }
    if (mo && !this.boss?.defeated)
      threats.push({
        x: mo.x + (MOWER_COLS * CELL) / 2,
        y: mo.y + (MOWER_ROWS * CELL) / 2 + (mo.chase ? 6 : 0),
      })
    // Never spray a bee bot: hold fire while one is over the nozzle.
    if (this.bees.some((b) => !b.wasp && Math.abs(b.x - this.px) < 8))
      held.a = false
    // A falling apple in reach is worth catching.
    const apple = this.apples.find((a) => a.y > HUD + (BED_TOP - 8) * CELL)
    if (apple) target = { x: apple.x, y: apple.y }
    for (const w of this.worms)
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y >= HUD + (BED_TOP - 1) * CELL)
          threats.push({ x: p.x + 4, y: p.y + 4 })
      }
    const near = threats.find(
      (t) => Math.abs(t.x - this.px) < 22 && Math.abs(t.y - this.py) < 22,
    )
    if (near) {
      if (near.x < this.px) held.right = true
      else held.left = true
      if (near.y < this.py) held.down = true
      else held.up = true
      return frame
    }
    // A can with a worm in splashing reach is the best shot on the lawn.
    const can = this.canInReach()
    if (can) target = can
    const giant = this.pumpkins.find((p) => p.giant)
    if (giant) target = giant
    const hydraHead = this.pumpkins.find((p) => p.hydra && p.lit)
    if (hydraHead) target = hydraHead
    if (this.snowballs.length) target = this.snowballs[0]!
    if (this.frostSprite) target = this.frostSprite
    if (this.crow?.phase === 'swoop') target = this.crow
    if (this.boss?.id === 'root-kernel' && !this.boss.defeated)
      target = this.rootPosition()
    if (this.boss?.id === 'frost-millipede' && !this.boss.defeated) {
      const part = this.frostMillipede.find((s) => s.thawed)
      const heater = layoutCells(this.garden, LAYOUT_HEATER)[1]
      if (part) target = part
      else if (heater) target = { x: heater[0] * CELL + CELL / 2, y: 0 }
    }
    if (target) {
      if (target.x < this.px - 2) held.left = true
      if (target.x > this.px + 2) held.right = true
    }
    // Hang near the bottom of the bed.
    if (this.py < H - 14) held.down = true
    return frame
  }

  /** The attract pilot's shopping: the best thing it can afford, then back out to the garden. */
  private demoShedInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const shed = this.shed!
    const want = ['nozzle', 'twin', 'siren', 'can', 'prism', 'done']
      .map((id) => SHED_ITEMS.findIndex((i) => i.id === id))
      .find((i) => {
        const item = SHED_ITEMS[i]!
        return item.id === 'done' || !cannotBuy(item, this.kit, this.petals)
      })!
    if (this.tick % 6 === 0) {
      if (shed.cursor !== want) held.down = true
      else held.a = true
    }
    return { held, pressed: { ...held } }
  }

  /** The lowest can with a worm segment inside its splash, as a point to line up under. */
  private canInReach(): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null
    for (let row = BED_TOP - 1; row >= 0 && !best; row--)
      for (let col = 0; col < COLS && !best; col++) {
        const ob = this.at(col, row)
        if (ob?.kind !== 'can' || ob.lit) continue
        const x = col * CELL + 4
        const y = HUD + row * CELL + 4
        if (this.segmentNear(x, y, SPLASH_RADIUS * CELL)) best = { x, y }
      }
    return best
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    // The garden is laid out in its own units; the screen carries twice the pixels.
    g.save()
    g.scale(DENSITY, DENSITY)
    this.renderScene(g)
    g.restore()
  }

  private renderScene(g: CanvasRenderingContext2D) {
    this.renderGarden(g)
    const tint = paletteFor(this.level).tint
    if (tint) {
      g.fillStyle = rgba(tint, 0.14)
      g.fillRect(0, LAWN_TOP, W, BED_Y - LAWN_TOP)
    }
    if (this.mown) this.renderMownStripes(g)
    this.renderPond(g)
    if (this.mode === 'rivals') {
      g.fillStyle = rgba(RAMPS.pink[3], 0.45)
      g.fillRect(W / 2 - 1, HUD, 2, H - HUD)
    }
    this.renderExits(g)
    this.renderLanes(g)
    for (const f of this.flowers) {
      const sprite = FLOWER_SPRITES.get(f.prism)
      if (sprite) drawHd(g, sprite, f.col * CELL + 4, HUD + f.row * CELL + 4)
    }
    this.renderFireflies(g)
    if (this.garden.season === 'midnight') {
      for (const f of this.flowers)
        glow(
          g,
          f.col * CELL + 4,
          HUD + f.row * CELL + 4,
          12,
          PRISM_COLORS[f.prism],
          0.55,
        )
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ob = this.at(c, r)
        if (ob) this.renderObstacle(g, c, r, ob)
      }
    for (const a of this.apples) drawHd(g, APPLE_SPRITE, a.x, a.y)
    this.renderLeaves(g)
    this.renderCrow(g)
    this.renderPumpkins(g)
    this.renderInchworms(g)
    this.renderSnowballs(g)
    this.renderFrostSprite(g)
    this.renderFrostMillipede(g)
    this.renderRootKernel(g)
    this.renderMole(g)
    for (const w of this.worms) this.renderWorm(g, w)
    if (this.beetle) this.renderBeetle(g, this.beetle)
    if (this.snail) this.renderSnail(g, this.snail)
    if (this.moth) this.renderMoth(g, this.moth)
    for (const d of this.dragonflies) this.renderDragonfly(g, d)
    for (const b of this.bees) this.renderBee(g, b)
    if (this.queenHead) this.renderQueenHead(g, this.queenHead)
    if (this.mower)
      drawMower(g, {
        x: this.mower.x,
        y: this.mower.y,
        w: MOWER_COLS * CELL,
        h: MOWER_ROWS * CELL,
        caps: this.mower.caps,
        capOffsets: MOWER_CAPS,
        tick: this.tick,
        dir: this.mower.dir,
        parked: this.boss?.defeated ?? false,
      })
    for (const beam of this.beams) this.renderBeam(g, beam)
    this.renderRings(g)
    if (this.dead === 0 && !this.shed) {
      this.renderSprayer(g)
      if (this.playerCount === 2) this.renderSprayer(g, 1)
    }
    this.renderSiren(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 26)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.card > 0) this.renderCard(g)
    if (this.shed) this.renderShed(g, this.shed)
    if (this.menu) this.renderMenu(g, this.menu)
    if (this.credits) this.renderCredits(g)
    if (this.medalPage) this.renderMedals(g)
  }

  /** The lawn and the flowerbed, painted once per garden in its own colours. */
  private renderGarden(g: CanvasRenderingContext2D) {
    const look = GARDEN_LOOKS[this.garden.id] ?? GARDEN_LOOKS['kitchen-plot']!
    cachedLayer(g, `glitch-garden-floor-${this.garden.id}`, W, H, (k) => {
      k.fillStyle = HEDGE[0]
      k.fillRect(0, 0, W, LAWN_TOP)
      // The lawn, banded darker toward the top, mowed in stripes.
      bandedGradient(k, 0, LAWN_TOP, W, BED_Y - LAWN_TOP, look.lawn, 8)
      k.fillStyle = rgba(look.stripe, 0.07)
      for (let x = 0; x < W; x += CELL * 4)
        k.fillRect(x, LAWN_TOP, CELL * 2, BED_Y - LAWN_TOP)
      // The glitch: the garden's cell grid shows through as faint dots.
      k.fillStyle = rgba(RAMPS.teal[3], 0.16)
      for (let y = LAWN_TOP + CELL; y < BED_Y; y += CELL)
        for (let x = CELL; x < W; x += CELL) k.fillRect(x, y, 1, 1)
      // Mossy shade patches, then grass tufts in a V, lit at the tips.
      k.fillStyle = rgba(RAMPS.night[0], 0.3)
      for (const m of MOSS) {
        for (let y = -m.ry; y <= m.ry; y++)
          for (let x = -m.rx; x <= m.rx; x++)
            if ((x + y) % 2 === 0 && (x / m.rx) ** 2 + (y / m.ry) ** 2 < 1)
              k.fillRect(m.x + x, m.y + y, 1, 1)
      }
      for (const t of TUFTS) {
        k.fillStyle = RAMPS.leaf[1]
        k.fillRect(t.x, t.y, 1, 2)
        k.fillRect(t.x - 1, t.y - 1, 1, 2)
        k.fillRect(t.x + 1, t.y - 1, 1, 2)
        if (t.tall) {
          k.fillStyle = mix(RAMPS.leaf[1], RAMPS.leaf[2], 0.6)
          k.fillRect(t.x + t.lean, t.y - 2, 1, 1)
        }
      }
      // The flowerbed: banded tilled soil, a furrow every row.
      bandedGradient(k, 0, BED_Y, W, H - BED_Y, look.soil, 4)
      for (let y = BED_Y + CELL - 1; y < H; y += CELL) {
        k.fillStyle = RAMPS.earth[0]
        k.fillRect(0, y, W, 1)
        k.fillStyle = rgba(RAMPS.earth[2], 0.5)
        for (let x = (y / CELL) % 2 ? 0 : 3; x < W; x += 6)
          k.fillRect(x, y - 3, 3, 1)
      }
      for (const p of PEBBLES) {
        k.fillStyle = RAMPS.earth[0]
        k.fillRect(p.x, p.y + 1, p.w + 1, 1)
        k.fillStyle = RAMPS.earth[3]
        k.fillRect(p.x, p.y, p.w, 1)
      }
      // A bevelled brick edging between the lawn and the bed.
      for (let x = 0; x < W; x += 12)
        bevel(k, x + 1, BED_Y - 1, 10, 3, look.edging, { depth: 1 })
    })
  }

  /** After Mow-Bot parks it has mown the lawn into neat diagonal stripes. */
  private renderMownStripes(g: CanvasRenderingContext2D) {
    g.fillStyle = rgba(RAMPS.leaf[3], 0.08)
    for (let y = LAWN_TOP; y < BED_Y; y += 4)
      for (let x = ((y >> 2) * 2) % 16; x < W; x += 16) g.fillRect(x, y, 8, 4)
  }

  /** The lily pond: a strip of water, and pads drifting along it under the lamps. */
  private renderPond(g: CanvasRenderingContext2D) {
    const rows = this.garden.pondRows
    if (!rows?.length) return
    const top = HUD + Math.min(...rows) * CELL - 2
    const bottom = HUD + (Math.max(...rows) + 1) * CELL + 2
    g.fillStyle = rgba(RAMPS.water[1], 0.85)
    g.fillRect(0, top, W, bottom - top)
    g.fillStyle = rgba(RAMPS.water[3], 0.4)
    for (let x = (this.tick >> 2) % 12; x < W; x += 12) {
      g.fillRect(x, top + 2, 4, 1)
      g.fillRect((x + 6) % W, bottom - 3, 4, 1)
    }
    rows.forEach((row, i) => {
      const dir = i % 2 === 0 ? 1 : -1
      for (let c = 0; c < COLS; c++) {
        const has = this.at(c, row) !== null
        const deco = (((c - dir * this.padShift) % 3) + 3) % 3 === 0
        if (has || deco)
          drawLilyPad(g, c * CELL + 4, HUD + row * CELL + 6, deco && !has)
      }
    })
  }

  /** Windblown leaves shade the lamp or flower underneath until sprayed away. */
  private renderLeaves(g: CanvasRenderingContext2D) {
    for (const leaf of this.leafPiles) {
      const x = leaf.col * CELL
      const y = HUD + leaf.row * CELL
      g.fillStyle = rgba(RAMPS.earth[0], 0.6)
      g.fillRect(x + 1, y + 6, 7, 2)
      for (const [dx, dy, color] of [
        [1, 4, RAMPS.rust[2]],
        [3, 2, RAMPS.gold[3]],
        [5, 4, RAMPS.ember[3]],
        [2, 5, RAMPS.rust[3]],
        [6, 3, RAMPS.gold[2]],
      ] as const) {
        g.fillStyle = color
        g.fillRect(x + dx, y + dy, 3, 2)
      }
    }
  }

  private renderCrow(g: CanvasRenderingContext2D) {
    const crow = this.crow
    if (!crow) return
    if (crow.phase === 'tell') {
      const x = crow.target.col * CELL + CELL / 2
      const y = HUD + crow.target.row * CELL + CELL / 2
      g.strokeStyle = RAMPS.gold[4]
      g.strokeRect(x - 6, y - 6, 12, 12)
      glow(g, x, y, 12, RAMPS.gold[3], 0.45)
    }
    const frame = Math.floor(this.tick / 6) % 2
    drawHd(g, MOTH_SPRITES[frame]!, crow.x, crow.y, {
      flipX: crow.startX > W / 2,
    })
    glow(g, crow.x, crow.y, 10, RAMPS.ember[3], 0.45)
  }

  private renderMole(g: CanvasRenderingContext2D) {
    const mole = this.mole
    if (!mole) return
    const x = Math.round(mole.x)
    const y = Math.round(mole.y)
    const rising = mole.phase === 'up'
    const pulse = 0.45 + 0.25 * Math.sin(this.tick / 5)
    glow(g, x, y, rising ? 14 : 11, RAMPS.gold[3], pulse)
    g.fillStyle = RAMPS.earth[1]
    g.fillRect(x - 9, y + 3, 18, 4)
    g.fillStyle = RAMPS.earth[3]
    g.fillRect(x - 6, y + 1, 12, 3)
    if (rising) {
      bevel(g, x - 5, y - 8, 10, 11, RAMPS.steel, {
        outline: INK,
        depth: 2,
      })
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 3, y - 5, 2, 2)
      g.fillRect(x + 2, y - 5, 2, 2)
    } else {
      g.strokeStyle = RAMPS.gold[3]
      g.strokeRect(x - 8.5, y - 7.5, 17, 13)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 1, y - 2, 3, 3)
    }
  }

  private renderFrostMillipede(g: CanvasRenderingContext2D) {
    const ray = this.frostRay
    if (ray) {
      g.strokeStyle = RAMPS.gold[4]
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(ray.x, ray.y)
      g.lineTo(ray.tx, ray.ty)
      g.stroke()
    }
    for (const part of this.frostMillipede) {
      const color = part.thawed ? RAMPS.gold[3] : RAMPS.sky[4]
      glow(g, part.x, part.y, 12, color, 0.65)
      const frame = Math.floor(this.tick / 8) % 2
      drawHd(g, HEAD_SPRITES[frame]!, part.x, part.y)
      if (!part.thawed) {
        g.fillStyle = rgba(RAMPS.sky[4], 0.65)
        g.fillRect(part.x - 5, part.y - 5, 10, 3)
      }
    }
  }

  private renderFrostSprite(g: CanvasRenderingContext2D) {
    const sprite = this.frostSprite
    if (!sprite) return
    glow(g, sprite.x, sprite.y, 13, RAMPS.sky[3], 0.65)
    const frame = Math.floor(this.tick / 8) % 2
    drawHd(g, DRAGONFLY_SPRITES[frame]!, sprite.x, sprite.y, {
      flipX: sprite.vx < 0,
      alpha: 0.8,
    })
    g.fillStyle = RAMPS.sky[4]
    g.fillRect(sprite.x - 2, sprite.y - 2, 4, 4)
  }

  private renderSnowballs(g: CanvasRenderingContext2D) {
    for (const ball of this.snowballs) {
      const x = Math.round(ball.x)
      const y = Math.round(ball.y)
      const radius = 3 + ball.hp * 2
      dropShadow(g, x, y + radius, radius, 2, 0.4)
      glow(g, x, y, radius + 6, RAMPS.sky[3], 0.5)
      g.fillStyle = INK
      g.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(x - radius + 1, y - radius + 1, radius * 2 - 2, radius * 2 - 2)
      g.fillStyle = RAMPS.sky[2]
      g.fillRect(x - radius + 2, y, radius * 2 - 4, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 2, y - radius + 2, 4, 2)
    }
  }

  private renderPumpkins(g: CanvasRenderingContext2D) {
    const heads = this.pumpkins.filter((p) => p.hydra)
    if (heads.length) {
      g.strokeStyle = RAMPS.leaf[3]
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(heads[0]!.x, heads[0]!.y)
      for (const head of heads.slice(1)) g.lineTo(head.x, head.y)
      g.stroke()
    }
    for (const pumpkin of this.pumpkins) {
      const radius = pumpkin.giant ? 16 : 8
      const x = Math.round(pumpkin.x)
      const y = Math.round(pumpkin.y)
      const cracked = 1 - pumpkin.hp / pumpkin.maxHp
      dropShadow(g, x, y + radius - 1, radius, 2, 0.4)
      glow(
        g,
        x,
        y,
        radius + 4,
        pumpkin.hydra && pumpkin.lit ? RAMPS.gold[4] : RAMPS.ember[2],
        pumpkin.hydra && pumpkin.lit ? 0.85 : 0.3,
      )
      g.fillStyle = INK
      g.fillRect(x - radius, y - radius + 3, radius * 2, radius * 2 - 4)
      g.fillStyle = RAMPS.ember[2]
      g.fillRect(x - radius + 1, y - radius + 4, radius * 2 - 2, radius * 2 - 6)
      for (const offset of [-0.55, 0, 0.55]) {
        const width = Math.max(2, Math.round(radius * 0.55))
        g.fillStyle = offset === 0 ? RAMPS.ember[3] : RAMPS.rust[2]
        g.fillRect(
          x + Math.round(offset * radius) - width / 2,
          y - radius + 4,
          width,
          radius * 2 - 6,
        )
      }
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(x - 2, y - radius, 4, 5)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - radius / 2, y - 2, 3, 2)
      g.fillRect(x + radius / 2 - 3, y - 2, 3, 2)
      if (pumpkin.hydra) {
        g.fillStyle = pumpkin.lit ? RAMPS.gold[4] : RAMPS.steel[3]
        g.fillRect(x - 3, y - radius - 3, 6, 2)
      }
      if (cracked > 0) {
        g.strokeStyle = INK
        g.lineWidth = 1 + cracked * 2
        g.beginPath()
        g.moveTo(x - radius / 3, y + 1)
        g.lineTo(x, y + radius / 3)
        g.lineTo(x + radius / 3, y + 1)
        g.stroke()
      }
    }
  }

  private renderInchworms(g: CanvasRenderingContext2D) {
    for (const inchworm of this.inchworms) {
      const x = Math.round(inchworm.x)
      const y = Math.round(inchworm.y)
      const raised = this.tick % 20 < 12 ? 0 : 2
      glow(g, x, y, 10, RAMPS.leaf[3], 0.25)
      g.fillStyle = INK
      g.fillRect(x - 8, y - raised + 1, 15, 7)
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(x - 7, y - raised + 2, 13, 5)
      g.fillStyle = RAMPS.teal[3]
      g.fillRect(x + 3, y - raised + 1, 3, 3)
      g.fillStyle = INK
      g.fillRect(x + 5, y - raised + 2, 1, 1)
    }
  }

  /** The sunflower maze's exit: a warm glow in the gap. */
  private renderExits(g: CanvasRenderingContext2D) {
    for (const i of this.exits) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const pulse = 0.25 + 0.15 * Math.sin(this.tick / 10)
      g.fillStyle = rgba(RAMPS.gold[3], pulse)
      g.fillRect(col * CELL, HUD + row * CELL, CELL, CELL)
    }
  }

  /** With the snail siren fitted, an arrow at the lawn's edge points out a crossing snail. */
  private renderSiren(g: CanvasRenderingContext2D) {
    const s = this.snail
    if (!s || !this.kit.siren || (this.tick >> 3) % 2) return
    const left = s.vx > 0
    drawText(g, left ? '→' : '←', left ? 4 : W - 4, s.y - 4, {
      align: left ? 'left' : 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
  }

  private renderDragonfly(g: CanvasRenderingContext2D, d: Dragonfly) {
    dropShadow(g, d.x, d.y + 7, 4, 1, 0.3)
    const flip = d.vx < 0
    if (d.dart) {
      // Darting: wings a blur, with a ghost trailing it.
      drawHd(g, DRAGONFLY_SPRITES[0], d.x - d.vx * 2, d.y - d.vy * 2, {
        flipX: flip,
        alpha: 0.35,
      })
      drawHd(g, DRAGONFLY_SPRITES[0], d.x, d.y, { flipX: flip, alpha: 0.85 })
    } else {
      // Stopped: wings folded and still (the moment to lead a shot into).
      glow(g, d.x, d.y, 7, RAMPS.teal[3], 0.25)
      drawHd(g, DRAGONFLY_SPRITES[1], d.x, d.y, { flipX: flip })
    }
  }

  private renderBee(g: CanvasRenderingContext2D, b: Bee) {
    const flap = (this.tick >> 2) % 2
    const flip = b.vx < 0
    if (b.wasp) {
      // The stripes jitter: it flickers between the bee's look and its own.
      const jitter = (this.tick >> 1) % 3 === 0 ? 1 : 0
      if (b.diving) glow(g, b.x, b.y, 8, RAMPS.ember[2], 0.4)
      drawHd(
        g,
        WASP_SPRITES[jitter]!,
        b.x + (b.diving ? 0 : jitter * 0.5),
        b.y,
        {
          flipX: flip,
        },
      )
      return
    }
    drawHd(g, BEE_SPRITES[flap]!, b.x, b.y, { flipX: flip })
  }

  private renderQueenHead(g: CanvasRenderingContext2D, h: QueenHead) {
    const frame = (this.tick >> 2) % 2
    glow(g, h.x, h.y, 12, RAMPS.gold[3], 0.4)
    // Buzzing wings either side of the crown.
    g.fillStyle = rgba(RAMPS.sky[4], 0.6)
    g.fillRect(h.x - 8, h.y - 4 - frame, 4, 2)
    g.fillRect(h.x + 4, h.y - 4 - frame, 4, 2)
    drawHd(g, QUEEN_HEADS[frame]!, h.x, h.y, { flipX: h.vx < 0 })
    for (let i = 0; i < h.hp; i++) {
      g.fillStyle = RAMPS.pink[3]
      g.fillRect(h.x - h.hp + i * 2, h.y - 9, 1, 1)
    }
  }

  /** Over a garden's first wave: its name, season and what's new there. */
  private renderCard(g: CanvasRenderingContext2D) {
    const step = this.step
    const fade = Math.min(1, this.card / 30)
    g.globalAlpha = fade
    g.fillStyle = rgba(INK, 0.72)
    g.fillRect(12, H / 2 - 56, W - 24, 92)
    g.strokeStyle = RAMPS.gold[3]
    g.lineWidth = 1
    g.strokeRect(12.5, H / 2 - 55.5, W - 25, 91)
    const line = (text: string, y: number, color: string, scale = 1) =>
      drawText(g, text, W / 2, y, {
        align: 'center',
        color,
        outline: INK,
        scale,
      })
    if (step.kind === 'boss') {
      const boss = BOSSES[step.boss]
      line('SEASON BOSS', H / 2 - 46, RAMPS.ember[3])
      line(boss.name, H / 2 - 30, '#ffffff', 2)
      line(boss.sub, H / 2 - 4, RAMPS.gold[3])
    } else {
      const garden = this.garden
      const season = garden.season.toUpperCase()
      line(`${season}  GARDEN ${step.garden + 1}`, H / 2 - 46, RAMPS.leaf[3])
      line(garden.name, H / 2 - 30, '#ffffff', 2)
      line(garden.intro[0], H / 2 - 4, RAMPS.gold[3])
      line(garden.intro[1], H / 2 + 8, RAMPS.pink[3])
      if (this.trowels.has(garden.id))
        line('GOLDEN TROWEL EARNED', H / 2 + 22, RAMPS.gold[4])
    }
    g.globalAlpha = 1
  }

  /** The Compost Shed: the kit for sale, petals to spend, and the lane for a prism flower. */
  private renderShed(g: CanvasRenderingContext2D, shed: Shed) {
    g.fillStyle = rgba(INK, 0.85)
    g.fillRect(0, HUD, W, H - HUD)
    bevel(g, 10, HUD + 8, W - 20, 30, RAMPS.earth, { depth: 2 })
    const text = (s: string, x: number, y: number, color: string, scale = 1) =>
      drawText(g, s, x, y, { align: 'center', color, outline: INK, scale })
    text('THE COMPOST SHED', W / 2, HUD + 13, RAMPS.cream[3], 2)
    text(`PETALS ${this.petals}`, W / 2, HUD + 46, RAMPS.pink[3])
    text(
      `GOLDEN TROWELS ${this.trowels.size}/${GARDENS.length}`,
      W / 2,
      HUD + 58,
      RAMPS.gold[3],
    )
    SHED_ITEMS.forEach((item, i) => {
      const y = HUD + 78 + i * 24
      const on = i === shed.cursor
      const why = cannotBuy(item, this.kit, this.petals)
      if (on) {
        g.fillStyle = rgba(RAMPS.leaf[2], 0.35)
        g.fillRect(14, y - 3, W - 28, 21)
      }
      const colour =
        item.id === 'done' ? RAMPS.leaf[3] : why ? RAMPS.steel[2] : '#ffffff'
      drawText(g, `${on ? '>' : ' '} ${item.name}`, 18, y, {
        color: colour,
        outline: INK,
      })
      if (item.cost > 0)
        drawText(g, String(item.cost), W - 18, y, {
          align: 'right',
          color: RAMPS.pink[3],
          outline: INK,
        })
      if (item.line)
        drawText(g, item.line, 30, y + 9, {
          color: RAMPS.steel[3],
          outline: INK,
        })
    })
    // The prism flower's lane: its column and the colour that cell blooms in.
    if (SHED_ITEMS[shed.cursor]!.id === 'prism') {
      const y = HUD + 78 + SHED_ITEMS.length * 24
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(14, y, W - 28, 6)
      const prism = prismFor(shed.lane, BED_TOP - 2)
      g.fillStyle = PRISM_COLORS[prism]
      g.fillRect(14 + (shed.lane * (W - 28)) / COLS, y - 1, 8, 8)
      text(
        `LANE ${shed.lane + 1}: ${prism.toUpperCase()}`,
        W / 2,
        y + 10,
        PRISM_COLORS[prism],
      )
    }
    if (shed.note) text(shed.note, W / 2, H - 40, RAMPS.gold[3])
    text(
      `A BUY  B LEAVE  ${Math.ceil(shed.ticks / 60)}`,
      W / 2,
      H - 22,
      RAMPS.leaf[3],
    )
  }

  /** The garden select: carry on the saved run, or start at any garden reached. */
  private renderMenu(g: CanvasRenderingContext2D, menu: Menu) {
    g.fillStyle = rgba(INK, 0.8)
    g.fillRect(0, HUD, W, H - HUD)
    drawText(g, 'GARDEN SELECT', W / 2, HUD + 30, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
      scale: 2,
    })
    menu.items.forEach((item, i) => {
      const on = i === menu.cursor
      const garden = gardenAt(item.garden)
      const y =
        HUD +
        56 +
        i * Math.min(22, Math.floor((H - HUD - 90) / menu.items.length))
      if (on) {
        g.fillStyle = rgba(RAMPS.leaf[2], 0.35)
        g.fillRect(
          14,
          y - 4,
          W - 28,
          Math.min(18, Math.floor((H - HUD - 90) / menu.items.length) - 1),
        )
      }
      drawText(g, `${on ? '>' : ' '} ${item.label}`, 18, y, {
        color: item.resume ? RAMPS.gold[3] : '#ffffff',
        outline: INK,
      })
      if (!item.mode && this.trowels.has(garden.id))
        drawText(g, '*', W - 20, y, { color: RAMPS.gold[4], outline: INK })
    })
    drawText(g, 'UP/DOWN PICK  A START', W / 2, H - 24, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
  }

  private renderMedals(g: CanvasRenderingContext2D) {
    g.fillStyle = rgba(INK, 0.94)
    g.fillRect(0, HUD, W, H - HUD)
    drawText(g, 'GARDEN MEDALS', W / 2, HUD + 12, {
      align: 'center',
      color: '#ffffff',
      scale: 2,
      outline: INK,
    })
    drawText(g, 'C CLEAN   K KIND   F FULL PATCH', W / 2, HUD + 36, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    for (let index = 0; index < 50; index++) {
      const x = 9 + (index % 5) * 45
      const y = HUD + 55 + Math.floor(index / 5) * 19
      const bits = this.medals[String(index)] ?? 0
      drawText(g, String(index + 1).padStart(2, '0'), x, y, {
        color: '#ffffff',
        outline: INK,
      })
      for (const [i, label] of ['C', 'K', 'F'].entries())
        drawText(g, label, x + 13 + i * 8, y, {
          color: bits & (1 << i) ? RAMPS.gold[4] : RAMPS.steel[2],
          outline: INK,
        })
    }
    drawText(g, 'A / B RETURN', W / 2, H - 20, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
  }

  /** The special wave's marked lanes: a faint gold furrow and a flag that turns into a bloom. */
  private renderLanes(g: CanvasRenderingContext2D) {
    const goal = this.wave.objective
    if (goal?.kind !== 'bloom-lanes' || this.clear > 0) return
    const pulse = 0.06 + 0.04 * Math.sin(this.tick / 14)
    for (const lane of goal.lanes) {
      const x = lane * CELL
      const done = this.laneBlooms.has(lane)
      g.fillStyle = rgba(done ? RAMPS.leaf[3] : RAMPS.gold[3], pulse)
      g.fillRect(x, LAWN_TOP, CELL, BED_Y - LAWN_TOP)
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(x + 3, LAWN_TOP + 1, 1, 7)
      if (done) {
        const bloom = FLOWER_SPRITES.get(prismFor(lane, 0))
        if (bloom) drawHd(g, bloom, x + 4, LAWN_TOP + 3)
      } else {
        g.fillStyle = RAMPS.gold[3]
        g.fillRect(x + 4, LAWN_TOP + 1, 3, 2)
        g.fillStyle = RAMPS.gold[2]
        g.fillRect(x + 4, LAWN_TOP + 3, 2, 1)
      }
    }
  }

  /** A can's splash: a ring of spray that grows out to the reach and fades. */
  private renderRings(g: CanvasRenderingContext2D) {
    for (const r of this.rings) {
      const t = 1 - r.life / 24
      g.globalAlpha = Math.max(0, 1 - t)
      g.strokeStyle = RAMPS.water[4]
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(r.x, r.y, 4 + t * SPLASH_RADIUS * CELL, 0, Math.PI * 2)
      g.stroke()
      glow(g, r.x, r.y, SPLASH_RADIUS * CELL, RAMPS.water[3], 0.35 * (1 - t))
    }
    g.globalAlpha = 1
  }

  /** Fireflies drifting over the lawn (cosmetic; they follow the clock). */
  private renderRootKernel(g: CanvasRenderingContext2D) {
    if (this.boss?.id !== 'root-kernel' || this.boss.defeated) return
    const { x, y } = this.rootPosition()
    glow(g, x, y, 34, RAMPS.purple[3], 0.8)
    for (let i = 0; i < PRISM_ORDER.length; i++) {
      const angle = this.tick / 35 + (i * Math.PI) / 2
      const px = x + Math.cos(angle) * 13
      const py = y + Math.sin(angle) * 13
      g.fillStyle = PRISM_COLORS[PRISM_ORDER[i]!]
      g.fillRect(px - 3, py - 3, 6, 6)
    }
    bevel(g, x - 9, y - 9, 18, 18, RAMPS.purple, { depth: 2 })
    drawText(g, String(this.boss.phase), x, y - 3, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
  }

  private renderCredits(g: CanvasRenderingContext2D) {
    g.fillStyle = rgba(INK, 0.88)
    g.fillRect(0, HUD, W, H - HUD)
    const line = (text: string, y: number, color: string, scale = 1) =>
      drawText(g, text, W / 2, y, {
        align: 'center',
        color,
        scale,
        outline: INK,
      })
    line(
      this.credits === 'true' ? 'ROOT RESTORED!' : 'FOUR SEASONS FIXED!',
      52,
      RAMPS.gold[4],
      2,
    )
    line(
      this.credits === 'true'
        ? 'EVERY FLOWER LIGHTS THE NIGHT'
        : 'THE GARDEN IS IN BLOOM',
      88,
      RAMPS.pink[3],
    )
    line('A KIND ROBOTS ARCADE GAME', 120, RAMPS.leaf[3])
    line('OVERGROWN UNLOCKED', 154, RAMPS.gold[3])
    line(`GOLDEN TROWELS ${this.trowels.size}/8`, 178, '#ffffff')
    line(
      hasAllTrowels(this.trowels)
        ? 'MIDNIGHT GARDEN OPEN'
        : 'EARN ALL EIGHT TO OPEN MIDNIGHT',
      196,
      RAMPS.sky[4],
    )
    line('A TO RETURN TO GARDEN SELECT', H - 28, RAMPS.leaf[3])
  }

  private renderFireflies(g: CanvasRenderingContext2D) {
    for (const f of FIREFLIES) {
      const pulse = Math.sin(this.tick / 22 + f.phase)
      if (pulse < -0.2) continue
      const x = Math.round(f.x + Math.sin(this.tick / 90 + f.phase) * 14)
      const y = Math.round(f.y + Math.cos(this.tick / 70 + f.phase * 1.3) * 9)
      glow(g, x, y, 6, RAMPS.leaf[3], 0.35 * (pulse + 0.2))
      g.fillStyle = pulse > 0.5 ? RAMPS.gold[4] : RAMPS.leaf[3]
      g.fillRect(x, y, 1, 1)
    }
  }

  private renderObstacle(
    g: CanvasRenderingContext2D,
    c: number,
    r: number,
    ob: Obstacle,
  ) {
    const x = c * CELL
    const y = HUD + r * CELL
    if (this.garden.season === 'midnight' && ob.kind === 'lamp')
      glow(
        g,
        x + 4,
        y + 4,
        10,
        PRISM_COLORS[prismFor(c, r)],
        0.2 + 0.12 * Math.sin(this.tick / 18 + c + r),
      )
    dropShadow(g, x + 5, y + 7, 3, 1, 0.45)
    const top = { anchor: 'topleft' } as const
    const bloomDot = () => {
      g.fillStyle = PRISM_COLORS[prismFor(c, r)]
      g.fillRect(x + 2, y + 1, 2, 1)
    }
    if (ob.kind === 'tree') {
      drawHd(g, TREE_SPRITE, x + 4, y + 2)
      return
    }
    if (ob.kind === 'sunflower') {
      // They nod in a slow wave along the row.
      const nod = (c + Math.floor(this.tick / 30)) % 4 === 0 ? 1 : 0
      drawHd(g, SUNFLOWER_SPRITES[nod]!, x + 4, y + 2)
      return
    }
    if (ob.kind === 'apple') {
      drawHd(g, APPLE_SPRITE, x + 4, y + 4, {
        alpha: ob.hp < APPLE_HP ? 0.7 : 1,
      })
      return
    }
    if (ob.kind === 'heater') {
      const lit = Boolean(ob.lit)
      const color = lit ? RAMPS.gold[4] : RAMPS.sky[4]
      glow(g, x + 4, y + 4, lit ? 18 : 8, color, lit ? 0.8 : 0.45)
      bevel(g, x + 1, y + 1, 6, 6, lit ? RAMPS.gold : RAMPS.sky, {
        depth: 1,
        outline: INK,
      })
      g.fillStyle = color
      g.fillRect(x + 3, y - 2, 2, 4)
      return
    }
    if (ob.kind === 'can') {
      // The can's tell: its glint and drip blink, faster once it's lit.
      const frame = Math.floor(this.tick / (ob.lit ? 3 : 18)) % 2
      glow(g, x + 4, y + 4, 8, RAMPS.water[3], ob.lit ? 0.7 : 0.25)
      drawHd(g, CAN_SPRITES[frame]!, x + 0.5, y, top)
      return
    }
    if (ob.kind === 'sprout') {
      // A sprout with as many leaves as it has hp left.
      const sprite = SPROUT_SPRITES[Math.max(1, Math.min(3, ob.hp))]
      if (sprite) drawHd(g, sprite, x + 0.5, y, top)
      bloomDot()
      return
    }
    // A glitchy mushroom lamp: the cap shrinks as it's sprayed.
    const hp = Math.max(1, Math.min(LAMP_HP, ob.hp))
    const flicker = (c * 7 + r * 3 + Math.floor(this.tick / 6)) % 11 === 0
    if (ob.glitched) {
      // Static: the grey lamp jitters sideways now and then.
      const jitter = (c + r + Math.floor(this.tick / 5)) % 7 === 0 ? 1 : 0
      const dead = GLITCHED_SPRITES[hp]
      if (dead) drawHd(g, dead, x + 0.5 + jitter, y, top)
      bloomDot()
      return
    }
    const pal = paletteFor(this.level)
    const set = LAMP_SETS[WAVE_PALETTES.indexOf(pal)]!
    const sprite = (flicker ? set.flicker : set.lit)[hp]
    if (flicker) glow(g, x + 4, y + 3, 9, pal.lamp[3], 0.5)
    if (sprite) drawHd(g, sprite, x + 0.5, y, top)
    if (ob.frosted) {
      g.fillStyle = rgba(RAMPS.sky[4], 0.65)
      g.fillRect(x, y, 8, 2)
      g.fillRect(x, y + 2, 2, 5)
      g.fillRect(x + 6, y + 2, 2, 5)
      glow(g, x + 4, y + 3, 9, RAMPS.sky[3], 0.35)
    }
    bloomDot()
  }

  private renderWorm(g: CanvasRenderingContext2D, w: Worm) {
    const step = Math.floor(this.tick / 6)
    for (let k = w.segments - 1; k >= 0; k--) {
      const p = this.segmentPos(w, k)
      if (p.y < HUD) continue
      const x = p.x
      const y = p.y
      const frame = (k + step) % 2
      if (w.frozen && w.frozen > 0) {
        g.fillStyle = rgba(PRISM_COLORS.cyan, 0.5)
        g.fillRect(x, y, CELL, CELL)
      }
      if (w.queen) {
        // Queen Wiggle: a rainbow body, gold-ringed joints, a crowned (maybe helmeted) head.
        const n = k + (w.offset ?? 0)
        const sprite =
          k === 0
            ? ((w.armour ?? 0) > 0 ? QUEEN_ARMOURED : QUEEN_HEADS)[frame]!
            : this.isJoint(w, k)
              ? QUEEN_JOINT[frame]!
              : QUEEN_SEGMENTS[n % QUEEN_SEGMENTS.length]![frame]!
        if (k === 0 || this.isJoint(w, k))
          glow(g, x + 4, y + 4, 9, RAMPS.gold[3], 0.35)
        drawHd(g, sprite, x + 0.5, y - (k === 0 ? 1.5 : 0), {
          anchor: 'topleft',
          flipX: k === 0 && w.dx < 0,
        })
        continue
      }
      if (k === 0) {
        glow(g, x + 4, y + 4, 10, RAMPS.pink[3], 0.35)
        drawHd(g, HEAD_SPRITES[frame]!, x + 0.5, y - 0.5, {
          anchor: 'topleft',
          flipX: w.dx < 0,
        })
        continue
      }
      const glitch = (k + Math.floor(this.tick / 4)) % 5 === 0
      const pal = (this.level - 1) % WAVE_PALETTES.length
      const SEGMENT_SPRITES = SEGMENT_SETS[pal]!
      const GLITCH_SPRITES = GLITCH_SETS[pal]!
      if (glitch) {
        // A chromatic tear: a ghost of the segment slips sideways.
        drawHd(g, GLITCH_SPRITES[frame]!, x + 2.5, y, {
          anchor: 'topleft',
          alpha: 0.45,
        })
      }
      drawHd(
        g,
        (glitch ? GLITCH_SPRITES : SEGMENT_SPRITES)[frame]!,
        x + 0.5,
        y,
        { anchor: 'topleft' },
      )
    }
  }

  private renderBeetle(g: CanvasRenderingContext2D, b: Beetle) {
    const frame = Math.floor(this.tick / 4) % 2
    dropShadow(g, b.x + 1, b.y + 5, 6, 1.5, 0.45)
    drawHd(g, BEETLE_SPRITES[frame]!, b.x, b.y, { flipX: b.vx < 0 })
  }

  private renderSnail(g: CanvasRenderingContext2D, s: Snail) {
    const frame = Math.floor(this.tick / 12) % 2
    dropShadow(g, s.x, s.y + 4, 6, 1.5, 0.4)
    glow(g, s.x, s.y, 9, RAMPS.pink[3], 0.3)
    drawHd(g, SNAIL_SPRITES[frame]!, s.x, s.y, { flipX: s.vx < 0 })
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const frame = Math.floor(this.tick / 3) % 2
    // It flies above the garden: a shadow far below and to the side.
    dropShadow(g, m.x + 4, m.y + 8, 4, 1.5, 0.3)
    glow(g, m.x, m.y, 10, RAMPS.purple[3], 0.3)
    const sprites = m.hp > 1 ? MOTH_SPRITES : MOTH_HURT_SPRITES
    drawHd(g, sprites[frame]!, m.x, m.y)
  }

  private renderBeam(g: CanvasRenderingContext2D, beam: Beam) {
    const x = Math.round(beam.x)
    const y = Math.round(beam.y)
    const tint = beam.powers.length
      ? PRISM_COLORS[beam.powers[beam.powers.length - 1]!]
      : RAMPS.teal[3]
    glow(g, x, y - 1, 8, tint, 0.6)
    g.fillStyle = rgba(tint, 0.35)
    g.fillRect(x - 1, y + 2, 2, 6)
    g.fillStyle = beam.powers.length ? tint : RAMPS.teal[2]
    g.fillRect(x - 1, y - 5, 3, 8)
    g.fillStyle =
      beam.powers.length > 1 ? PRISM_COLORS[beam.powers[0]!] : RAMPS.teal[4]
    g.fillRect(x, y - 5, 1, 7)
  }

  private renderSprayer(g: CanvasRenderingContext2D, player: 0 | 1 = 0) {
    if (this.mode === 'rivals' && this.rivalsShield[player] > 0 && this.tick % 8 < 4) return
    const x = Math.round(player === 0 ? this.px : this.p2.x)
    const y = Math.round(player === 0 ? this.py : this.p2.y)
    // A little gardening bot with a spray nozzle on top.
    dropShadow(g, x, y + 5, 6, 1.5, 0.45)
    glow(g, x, y - 5, 5, RAMPS.teal[3], 0.35)
    const frame = Math.floor(this.tick / 5) % 2
    drawHd(g, SPRAYER_SPRITES[frame]!, x, y - 1)
    if (this.playerCount === 2)
      drawText(g, String(player + 1), x, y + 8, {
        align: 'center', color: player === 0 ? RAMPS.teal[4] : RAMPS.pink[3], outline: INK,
      })
    // The patch multiplier lives on the nozzle: its tip warms from teal to pink, one pip a step.
    const mult = this.multiplier
    const tip = NOZZLE_COLORS[mult - 1] ?? RAMPS.teal[4]
    if (mult > 1) glow(g, x, y - 6, 3 + mult, tip, 0.55)
    g.fillStyle = tip
    g.fillRect(x - 0.5, y - 6.5, 1.5, 1.5)
    for (let i = 1; i < mult; i++) {
      g.fillStyle = INK
      g.fillRect(x - mult + i * 2 - 0.5, y - 10, 1.5, 1.5)
      g.fillStyle = tip
      g.fillRect(x - mult + i * 2 - 0.5, y - 10, 1, 1)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 0, 0, W, HUD - 1, HEDGE)
    drawText(g, String(this.score).padStart(6, '0'), 4, 0, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives - 1, 5)
    if (lives > 0) {
      g.fillStyle = HEDGE[0]
      g.fillRect(81, 2, lives * 10 + 3, HUD - 5)
      for (let i = 0; i < lives; i++)
        drawHd(g, LIFE_SPRITE, 83 + i * 10, 4, { anchor: 'topleft' })
    }
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    if (this.multiplier > 1)
      drawText(g, `x${this.multiplier}`, W - 60, 4, {
        align: 'right',
        color: RAMPS.gold[3],
        shadow: INK,
      })
    drawText(
      g,
      this.mode === 'daily' ? 'DAILY' : `WAVE ${this.level}`,
      W - 4,
      8,
      {
        align: 'right',
        color: RAMPS.leaf[3],
        shadow: INK,
      },
    )
    if (this.boss?.id === 'gourd-hydra' && !this.boss.defeated) {
      const heads = this.pumpkins.filter((p) => p.hydra)
      drawText(
        g,
        `HYDRA ${3 - heads.length}/3  SPRAY THE GLOW`,
        W / 2,
        HUD + 2,
        {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        },
      )
    }
    if (this.boss?.id === 'frost-millipede' && !this.boss.defeated) {
      drawText(g, `ICE ${this.boss.phase}/3  HEAT THEN SPRAY`, W / 2, HUD + 2, {
        align: 'center',
        color: RAMPS.sky[4],
        outline: INK,
      })
    }
    if (this.slowTicks > 0) {
      drawText(
        g,
        `INCHWORM SLOW ${Math.ceil(this.slowTicks / 60)}S`,
        W / 2,
        H - 15,
        {
          align: 'center',
          color: RAMPS.teal[4],
          outline: INK,
        },
      )
    }
    // The special wave's progress, just under the HUD.
    const goal = this.wave.objective
    if (goal && this.clear === 0 && !this.shed) {
      const progress =
        goal.kind === 'catch-apples'
          ? `APPLES ${Math.min(this.caught, goal.count)}/${goal.count}`
          : goal.kind === 'escort-bees'
            ? `BEES ACROSS ${Math.min(this.beesCrossed, goal.count)}/${goal.count}`
            : goal.kind === 'maze-exit'
              ? 'GUARD THE MAZE EXIT'
              : goal.kind === 'clear-leaves'
                ? `LEAVES ${Math.min(this.rakedLeaves, goal.count)}/${goal.count}`
                : goal.kind === 'great-pumpkin'
                  ? `GIANT ${this.pumpkins.find((p) => p.giant)?.hp ?? 0} HP`
                  : goal.kind === 'warm-heaters'
                    ? `HEATERS ${layoutCells(this.garden, LAYOUT_HEATER).filter(([x, y]) => this.at(x, y)?.lit).length}/${goal.count}`
                    : goal.kind === 'snow-day'
                      ? `SNOWBALLS ${Math.min(this.snowballsFixed, goal.count)}/${goal.count}`
                      : `LANES ${this.laneBlooms.size}/${goal.lanes.length}`
      const state = this.objectiveDone
        ? 'DONE!'
        : this.objectiveFailed
          ? 'MISSED'
          : ''
      drawText(g, `${progress} ${state}`.trim(), W / 2, HUD + 2, {
        align: 'center',
        color: this.objectiveFailed ? RAMPS.steel[3] : RAMPS.gold[3],
        outline: INK,
      })
    }
    if (this.mode === 'rivals') {
      hudPanel(g, 0, 0, W, HUD - 1, HEDGE)
      drawText(g, `P1 ${this.rivalsFixed[0]}`, 4, 3, { color: RAMPS.teal[4], outline: INK })
      drawText(g, `${Math.ceil(this.rivalsTicks / 60)}S`, W / 2, 3, { align: 'center', color: '#ffffff', outline: INK })
      drawText(g, `P2 ${this.rivalsFixed[1]}`, W - 4, 3, { align: 'right', color: RAMPS.pink[3], outline: INK })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 20, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, H / 2, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const glitchGarden: ArcadeGameModule = {
  create: (options) => new GlitchGarden(options),
}

export const create = glitchGarden.create
export default glitchGarden

// /utils/arcade/games/burrowBuddy.ts
//
// Burrow Buddy -- the Kind Robots Arcade's Dig Dug riff (conductor kr-arcade/
// t-009 game factory). Buddy, a little robot mole, tunnels through the layers
// of a garden's soil. Grumpy grubs (and, from the second garden, fire-breathing
// beetles) crawl through the tunnels; puff bubbles at them until they swell up
// and float gently away, or dig under a turnip and drop it on a whole group for
// a bonus. Two dropped turnips bring out a veggie bonus at the middle.
//
// Grubs get bored and drift through the soil as ghosts to find Buddy (ghosts
// are harmless until they settle back into a tunnel). The last grub left runs
// for the surface; let it go and the garden is still safe, but pop it for the
// points. Arrows dig, A puffs bubbles (tap or hold to keep puffing).
//
// Depth pass slice 1, "soil that moves" (conductor kr-arcade/t-106): every garden
// is a plan (utils/arcade/burrowBuddy/gardens.ts) with stones, cracked stones that
// hold bubble tools, and slump blocks: cut a block free on both sides and
// undercut it, and it slides down as one piece, carrying its turnips and stones,
// squashing the grumps under it and the ones riding on top, and setting off any
// block it frees for a chain. Grumps show their mood (calm, restless, ghost); the
// pill bug curls up when faced, the mole cricket digs its own tunnels and the
// mimic turnip bites. Two turnips bring out the next veggie on a twelve-rung
// ladder, and a five-grump crush brings out the Golden Beet. B runs the sprinkler.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawSprite,
  dropShadow,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
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
  BOULDER_SPRITE,
  CRACKED_SPRITES,
  CRICKET_SPRITES,
  PILLBUG_BALL_SPRITE,
  PILLBUG_SPRITES,
  TOOL_COLOURS,
  TOOL_ICONS,
  VEGGIE_SPRITES,
  happySprite,
} from '../burrowBuddy/art'
import {
  BURROW_CURVES,
  COLS,
  GRUMP_KINDS,
  ROWS,
  TOOL_KINDS,
  cellKey,
  gardenFor,
} from '../burrowBuddy/gardens'
import type {
  Cell,
  GardenPlan,
  GrumpKind,
  ToolKind,
} from '../burrowBuddy/gardens'
import {
  CHAIN_WINDOW,
  CRACK_PUSH,
  CREAK_TICKS,
  CRICKET_DIG,
  CURL_RANGE,
  CURL_REST,
  CURL_TICKS,
  GOLDEN_BEET,
  GOLDEN_BEET_CRUSH,
  GRUMPS,
  HEADLAMP_RADIUS,
  LAMP_RADIUS,
  MIMIC_AWAKE,
  MIMIC_BLINK,
  MIMIC_BLINK_EVERY,
  MIMIC_POINTS,
  MIMIC_RANGE,
  SLUMP_FALL,
  SPRAY_TICKS,
  SPRINKLER_REACH,
  TOOLS,
  VEGGIE_LADDER,
  crushBonus,
  leadingCells,
  moodFor,
  popAt,
  puffStats,
  slumpBonus,
  slumpFree,
  topCells,
  undercut,
  veggieForGarden,
} from '../burrowBuddy/rules'
import type { Mood, SlumpWorld, Veggie } from '../burrowBuddy/rules'

export { BURROW_CURVES, VEGGIE_LADDER, veggieForGarden }

const T = 16
const FY = 20
const W = COLS * T
const H = FY + ROWS * T + 18

const WALK_SPEED = 1 / 9
const DIG_SPEED = 1 / 15
const PUMP_REPEAT = 12
const DEFLATE_TICKS = 50
const GHOST_MIN = 70
const START_LIVES = 3
const DEATH_TICKS = 100
const LEVEL_CLEAR_TICKS = 140
const EXTRA_EVERY = 20_000
const DIG_POINTS = 10

type Dir = 0 | 1 | 2 | 3
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

type Mover = { tx: number; ty: number; nx: number; ny: number; p: number }
type Enemy = {
  kind: GrumpKind
  m: Mover
  spawn: { tx: number; ty: number }
  facing: Dir
  ghost: boolean
  gx: number
  gy: number
  ghostTicks: number
  ghostTimer: number
  inflate: number
  deflate: number
  fleeing: boolean
  fireCooldown: number
  fireWarn: number
  fire: number
  /** Pill bug: ticks left curled up, then ticks before it can curl again. */
  curl: number
  curlRest: number
  /** Mole cricket: the dirt-spray tell, then the cells it still means to dig. */
  spray: number
  digLeft: number
  /** Mimic turnip: ticks left awake (0 while it pretends to be a turnip). */
  awake: number
}
type Stone = { cracked: ToolKind | null; push: number }
type Slump = {
  cells: Cell[]
  state: 'held' | 'creak' | 'fall'
  t: number
  drop: number
  chain: number
  crushed: number
  riders: { kind: GrumpKind; x: number; y: number }[]
}
type Turnip = {
  tx: number
  ty: number
  state: 'idle' | 'wobble' | 'fall' | 'broken'
  t: number
  drop: number
  crushed: number
}
type Floater = { x: number; y: number; text: string; life: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floating = { x: number; y: number; life: number; kind: GrumpKind }

function centre(tx: number, ty: number) {
  return { x: tx * T + T / 2, y: FY + ty * T + T / 2 }
}

function at(m: Mover) {
  return {
    x: (m.tx + (m.nx - m.tx) * m.p) * T + T / 2,
    y: FY + (m.ty + (m.ny - m.ty) * m.p) * T + T / 2,
  }
}

function moving(m: Mover): boolean {
  return m.nx !== m.tx || m.ny !== m.ty
}

function depthPoints(row: number): number {
  if (row <= 3) return 200
  if (row <= 6) return 300
  if (row <= 9) return 400
  return 500
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The soil's four strata start on the rows where a pop's depth points step up. */
const BAND_ROWS = [1, 4, 7, 10] as const
const SURFACE_Y = FY + T
const FIELD_BOTTOM = FY + ROWS * T

type SoilSet = readonly [Ramp, Ramp, Ramp, Ramp]

const TOPSOIL: Ramp = [
  RAMPS.earth[1],
  RAMPS.earth[2],
  mix(RAMPS.earth[3], RAMPS.gold[2], 0.3),
  mix(RAMPS.earth[4], RAMPS.gold[3], 0.45),
  RAMPS.gold[4],
]
const CLAY: Ramp = [
  RAMPS.rust[0],
  RAMPS.rust[1],
  mix(RAMPS.rust[2], RAMPS.earth[2], 0.35),
  RAMPS.rust[3],
  RAMPS.rust[4],
]
const BEDROCK: Ramp = [
  RAMPS.night[1],
  mix(RAMPS.purple[0], RAMPS.earth[0], 0.3),
  mix(RAMPS.purple[1], RAMPS.earth[1], 0.35),
  mix(RAMPS.purple[2], RAMPS.earth[3], 0.3),
  RAMPS.purple[3],
]
const SAND: Ramp = [
  RAMPS.cream[0],
  mix(RAMPS.cream[0], RAMPS.cream[1], 0.5),
  RAMPS.cream[1],
  mix(RAMPS.cream[1], RAMPS.cream[2], 0.6),
  RAMPS.cream[3],
]
const DEEP_TEAL: Ramp = [
  RAMPS.night[1],
  RAMPS.teal[0],
  mix(RAMPS.teal[0], RAMPS.teal[1], 0.6),
  RAMPS.teal[1],
  RAMPS.teal[2],
]

/** Each garden digs through a different patch: the soil sets cycle by level. */
const SOIL_SETS: readonly SoilSet[] = [
  [TOPSOIL, RAMPS.earth, CLAY, BEDROCK],
  [SAND, CLAY, RAMPS.earth, DEEP_TEAL],
  [TOPSOIL, CLAY, BEDROCK, DEEP_TEAL],
]

/** Shades a tunnel wears in each stratum: dark channels with lit lips. */
type TunnelTones = {
  ceil: string
  mid: string
  floor: string
  wall: string
  lip: string
  rim: string
}
const TUNNEL_TONES: readonly (readonly TunnelTones[])[] = SOIL_SETS.map((set) =>
  set.map((r) => ({
    ceil: mix(INK, r[0], 0.25),
    mid: mix(INK, r[0], 0.6),
    floor: mix(r[0], r[1], 0.6),
    wall: r[0],
    lip: r[3],
    rim: mix(INK, r[0], 0.4),
  })),
)

/** Wavy seams between strata, a few pixels either side of the band row. */
const SEAMS = [1, 2, 3].map((i) => ridge(70 + i, W, 5, 1).map((h) => h - 2))
const STRATA = ridge(91, W, 6, 1)

function bandAt(x: number, y: number): number {
  let band = 0
  for (let i = 1; i < 4; i++) {
    if (y >= FY + BAND_ROWS[i]! * T + SEAMS[i - 1]![x]!) band = i
  }
  return band
}

function bandTop(band: number, x: number): number {
  return band === 0
    ? SURFACE_Y
    : FY + BAND_ROWS[band]! * T + SEAMS[band - 1]![x]!
}

function bandBottom(band: number, x: number): number {
  return band === 3 ? FIELD_BOTTOM : bandTop(band + 1, x)
}

function soilHash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function soilColour(set: SoilSet, x: number, y: number): string {
  const band = bandAt(x, y)
  const r = set[band]!
  const d = y - bandTop(band, x)
  const u = bandBottom(band, x) - 1 - y
  const checker = (x + y) & 1
  if (band > 0 && d === 0) return r[3]
  if (band > 0 && d === 1) return checker ? r[3] : r[2]
  if (band === 0 && d < 2) return r[1]
  if (band === 0 && d === 2) return checker ? r[1] : r[2]
  if (u === 0) return r[1]
  if (u === 1) return checker ? r[1] : r[2]
  const s = (y + STRATA[x]! + band * 3) % 10
  if (s === 0) return checker ? r[1] : r[2]
  if (s === 1) return r[1]
  if (s === 2) return checker ? r[3] : r[2]
  const n = soilHash(x, y)
  if (n < 0.05) return r[1]
  if (n > 0.95) return r[3]
  return r[2]
}

/** Paint a row of pixels from `colourAt` as runs of fillRect (null leaves the pixel alone). */
function paintRow(
  g: CanvasRenderingContext2D,
  y: number,
  colourAt: (x: number) => string | null,
) {
  let x = 0
  while (x < W) {
    const colour = colourAt(x)
    let run = 1
    while (x + run < W && colourAt(x + run) === colour) run++
    if (colour) {
      g.fillStyle = colour
      g.fillRect(x, y, run, 1)
    }
    x += run
  }
}

/** A canvas for state that changes now and then (null headless, where callers paint direct). */
function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas.getContext('2d') ? canvas : null
}

/**
 * Rows for a shaded pixel sphere of radius r, lit from the upper left: palette letters '0' (deep
 * shadow) to '4' (highlight). The puffed-up grubs and beetles are drawn from these.
 */
function orbRows(r: number): string[][] {
  const size = r * 2 + 1
  const lx = -0.45
  const ly = -0.6
  const lz = 0.66
  const rows: string[][] = []
  for (let y = 0; y < size; y++) {
    const row: string[] = []
    for (let x = 0; x < size; x++) {
      const nx = (x - r) / (r + 0.4)
      const ny = (y - r) / (r + 0.4)
      const d = nx * nx + ny * ny
      if (d > 1) {
        row.push('.')
        continue
      }
      const l = nx * lx + ny * ly + Math.sqrt(1 - d) * lz
      row.push(
        l > 0.92 ? '4' : l > 0.68 ? '3' : l > 0.3 ? '2' : l > -0.05 ? '1' : '0',
      )
    }
    rows.push(row)
  }
  return rows
}

function stamp(grid: string[][], x: number, y: number, art: readonly string[]) {
  art.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const ch = line[dx]!
      const row = grid[y + dy]
      if (ch !== ' ' && row && x + dx >= 0 && x + dx < row.length)
        row[x + dx] = ch
    }
  })
}

const BUDDY_PALETTE = {
  h: RAMPS.teal[4],
  L: RAMPS.teal[3],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  G: RAMPS.gold[3],
  g: RAMPS.gold[2],
  o: RAMPS.gold[1],
  n: RAMPS.pink[3],
  N: RAMPS.pink[2],
  w: '#ffffff',
  k: INK,
  c: RAMPS.cream[3],
  C: RAMPS.cream[1],
  s: RAMPS.steel[2],
  S: RAMPS.steel[3],
}
const BUDDY_SIDE = [
  '...LL..LL....',
  '..LhhLLhhL...',
  '.GLhLLLLLLT..',
  'GgLhLLLLwwkT.',
  'GgLLLLLLwkkTT',
  'ogTLLLLLTTTnN',
  '.tTLLLLTTTtNN',
  '.tTTTTTTTTtt.',
  '..tTTTTTTtcc.',
  '..dtttttdcCc.',
]
const BUDDY_FRONT = [
  '.LL......LL.',
  'LhhLGGGGLLLT',
  'GhLLLLLLLLTG',
  'GgLwwLLwwLtg',
  'GgLkkLLkkLtg',
  'ogLLLnNLLTto',
  '.tTLLNNLLTt.',
  '.tTTTTTTTTt.',
  'cCtTTTTTTtCc',
  '.cdttttttdc.',
]
const BUDDY_BACK = [
  '.LL......LL.',
  'LhhLGGGGLLLT',
  'GhLLLLLLLLTG',
  'GgLhLLLLLLtg',
  'GgLLLsSsLTtg',
  'ogLLLSssLTto',
  '.tTLLLLLLTt.',
  '.tTTTTTTTTt.',
  'cCtTTTTTTtCc',
  '.cdttttttdc.',
]
const BUDDY_SIDE_LEGS = [
  ['..dd....dd...', '.sS....sS....'],
  ['...dd..dd....', '...sS.sS.....'],
] as const
const BUDDY_FRONT_LEGS = [
  ['..dd....dd..', '..sS....sS..'],
  ['..dd....dd..', '.sS......sS.'],
] as const
const buddyFrames = (
  body: readonly string[],
  legs: readonly (readonly string[])[],
) =>
  [
    pixelSprite([...body, ...legs[0]!], BUDDY_PALETTE),
    pixelSprite([...body, ...legs[1]!], BUDDY_PALETTE),
  ] as const
const BUDDY_SPRITES = {
  side: buddyFrames(BUDDY_SIDE, BUDDY_SIDE_LEGS),
  front: buddyFrames(BUDDY_FRONT, BUDDY_FRONT_LEGS),
  back: buddyFrames(BUDDY_BACK, BUDDY_FRONT_LEGS),
}
const LIFE_SPRITE = pixelSprite(
  ['.L....L.', 'LhLLLLLT', 'GLwkLwkG', 'oLLnNLTo', '.tTNNTt.', '..tttt..'],
  BUDDY_PALETTE,
)

const GRUB_PALETTE = {
  h: RAMPS.pink[4],
  H: RAMPS.pink[3],
  P: RAMPS.pink[2],
  p: RAMPS.pink[1],
  d: RAMPS.pink[0],
  Y: RAMPS.gold[3],
  y: RAMPS.gold[2],
  w: '#ffffff',
  k: INK,
}
const GRUB_BODY = [
  '....HHHPp...',
  '..HhhHPPPPp.',
  '.HhHPPPPPPPp',
  '.HHPPYYYYYYp',
  'pPPPYwwYwwYp',
  'pPPPYwkYwkYp',
  'pPPPPyYYyYYp',
  'dpPPPPPPPPpd',
  '.dpPPPPPPpd.',
  '..ddppppdd..',
]
const grubFrames = (palette: Record<string, string>) =>
  [
    pixelSprite([...GRUB_BODY, '..dd...dd...'], palette),
    pixelSprite([...GRUB_BODY, '...dd.dd....'], palette),
  ] as const
const GRUB_SPRITES = grubFrames(GRUB_PALETTE)
/** A restless grub flushes ember-red: it is about to ghost through the soil. */
const GRUB_RESTLESS_SPRITES = grubFrames({
  ...GRUB_PALETTE,
  h: RAMPS.ember[4],
  H: RAMPS.ember[3],
  P: RAMPS.ember[2],
  p: RAMPS.ember[1],
  d: RAMPS.ember[0],
})

const beetlePalette = (shell: Ramp) => ({
  h: shell[4],
  L: shell[3],
  M: shell[2],
  m: shell[1],
  d: shell[0],
  G: RAMPS.purple[2],
  g: RAMPS.purple[1],
  e: RAMPS.gold[4],
  a: RAMPS.cream[2],
  l: RAMPS.purple[0],
  k: INK,
})
const BEETLE_BODY = [
  '....hhLL......',
  '..hhLLLLMm....',
  '.hLLhLMMMMm...',
  'hLLLMMMMMMmGG.',
  'LLMMMMhMMMmGeG',
  'MMMMMMMMMmGGGa',
  'mMMMMMMMmmGGa.',
  'dmmmmmmmmdgg..',
]
const BEETLE_LEGS = [
  ['.l..l..l......', 'l..l..l.......'],
  ['..l..l..l.....', '...l..l..l....'],
] as const
const beetleFrames = (shell: Ramp) =>
  [
    pixelSprite([...BEETLE_BODY, ...BEETLE_LEGS[0]], beetlePalette(shell)),
    pixelSprite([...BEETLE_BODY, ...BEETLE_LEGS[1]], beetlePalette(shell)),
  ] as const
const BEETLE_SPRITES = beetleFrames(RAMPS.leaf)
const BEETLE_RESTLESS_SPRITES = beetleFrames(RAMPS.gold)
const BEETLE_HOT_SPRITES = beetleFrames(RAMPS.ember)

/** Each grump's walk frames in its calm and restless colours. */
const MOOD_SPRITES: Record<
  'grub' | 'beetle' | 'pillbug' | 'cricket',
  { calm: readonly PixelSprite[]; restless: readonly PixelSprite[] }
> = {
  grub: { calm: GRUB_SPRITES, restless: GRUB_RESTLESS_SPRITES },
  beetle: { calm: BEETLE_SPRITES, restless: BEETLE_RESTLESS_SPRITES },
  pillbug: PILLBUG_SPRITES,
  cricket: CRICKET_SPRITES,
}

const PUFF_SHELLS: Record<GrumpKind, Ramp> = {
  grub: RAMPS.pink,
  beetle: RAMPS.leaf,
  pillbug: RAMPS.steel,
  cricket: RAMPS.earth,
  mimic: RAMPS.purple,
}

/** A grump pumped up to stage 1..3: a shaded sphere with a face that worries more. */
function puffedSprite(kind: GrumpKind, stage: number): PixelSprite {
  const r = Math.round(6 + stage * 2.2)
  const grid = orbRows(r)
  const ex = Math.round(r * 0.42)
  const ey = r - Math.round(r * 0.25)
  if (kind !== 'beetle') {
    const goggle =
      stage < 3
        ? ['YYY', 'YkY', 'YYY']
        : ['.YYY.', 'YwwwY', 'YwkwY', 'YwwwY', '.YYY.']
    const o = Math.floor(goggle.length / 2)
    stamp(grid, r - ex - o, ey - o, goggle)
    stamp(grid, r + ex - o, ey - o, goggle)
    stamp(grid, r - 1, r + Math.round(r * 0.4), ['.k.', 'k.k', '.k.'])
    if (kind === 'pillbug')
      for (let x = 3; x < r * 2 - 2; x += 3) stamp(grid, x, 2, ['k', 'k'])
    if (kind === 'mimic') stamp(grid, r - 2, 0, ['h.h.h', '.hhh.'])
  } else {
    stamp(grid, r + ex - 1, ey - 1, ['GGG', 'GeG', 'GGG'])
    for (let y = 2; y < r; y += 2) stamp(grid, r - 1, y, ['h'])
    stamp(grid, r * 2 - 1, r, ['a', 'a'])
  }
  const ramp = PUFF_SHELLS[kind]
  const shell = [ramp[1], ramp[2], ramp[3], ramp[4], '#ffffff'] as const
  return pixelSprite(
    grid.map((row) => row.join('')),
    {
      '0': shell[0],
      '1': shell[1],
      '2': shell[2],
      '3': shell[3],
      '4': shell[4],
      Y: RAMPS.gold[3],
      w: '#ffffff',
      k: INK,
      G: RAMPS.purple[1],
      e: RAMPS.gold[4],
      h: RAMPS.leaf[0],
      a: RAMPS.cream[2],
    },
  )
}
const PUFFED_SPRITES = Object.fromEntries(
  GRUMP_KINDS.map((kind) => [
    kind,
    [1, 2, 3].map((s) => puffedSprite(kind, s)),
  ]),
) as Record<GrumpKind, PixelSprite[]>

const GHOST_SPRITE = pixelSprite(
  ['.YYY.YYY.', 'YwwkYwwkY', 'YwwkYwwkY', '.YYY.YYY.'],
  { Y: RAMPS.purple[3], w: '#ffffff', k: INK },
)

const HAPPY_SPRITES: Record<GrumpKind, PixelSprite> = {
  grub: pixelSprite(
    ['.HHPp.', 'HhPPPp', 'PkPPkp', 'PPPPPp', 'pkkkpd', '.pppd.'],
    GRUB_PALETTE,
  ),
  beetle: pixelSprite(
    ['.hLLM.', 'hLMMMm', 'MkMMkm', 'MMMMMm', 'mkkkmd', '.mmmd.'],
    beetlePalette(RAMPS.leaf),
  ),
  pillbug: happySprite(RAMPS.steel),
  cricket: happySprite(RAMPS.earth),
  mimic: happySprite(RAMPS.purple),
}

const TURNIP_ROWS = [
  '...l..L..l..',
  '..lL.LLL.Ll.',
  '...lLLLLLl..',
  '....dLLd....',
  '...qPPPPq...',
  '.qPhPPPPPPq.',
  'pPhPPPPPPPPq',
  'pPPPPPPPPPpq',
  'cWwppppppwwc',
  'WwwwwwwwwwwC',
  '.Wwwwwwwwwc.',
  '..cwwwwwcC..',
  '...ccwwcC...',
  '.....cC.....',
  '.....C......',
]
const TURNIP_PALETTE = {
  l: RAMPS.leaf[2],
  L: RAMPS.leaf[3],
  d: RAMPS.leaf[1],
  h: RAMPS.purple[4],
  P: RAMPS.purple[3],
  p: RAMPS.purple[2],
  q: RAMPS.purple[1],
  W: RAMPS.cream[4],
  w: RAMPS.cream[3],
  c: RAMPS.cream[2],
  C: RAMPS.cream[1],
}
const TURNIP_SPRITE = pixelSprite(TURNIP_ROWS, TURNIP_PALETTE)
const TURNIP_BROKEN = pixelSprite(
  TURNIP_ROWS.map((row) => `${row.slice(0, 6)}...${row.slice(6)}`),
  TURNIP_PALETTE,
)

/** The mimic turnip: a turnip until its eyes open (the tell), then a toothy grin when awake. */
const mimicRows = (eyes: boolean, grin: boolean) =>
  TURNIP_ROWS.map((row, y) => {
    if (eyes && y === 6) return 'pPhEkPPEkPPq'
    if (grin && y === 5) return '.qPkPPPPkPq.'
    if (grin && y === 9) return 'WwkEkEkEkEwC'
    return row
  })
const MIMIC_PALETTE = { ...TURNIP_PALETTE, E: '#ffffff', k: INK }
const MIMIC_SPRITES = {
  blink: pixelSprite(mimicRows(true, false), MIMIC_PALETTE),
  awake: pixelSprite(mimicRows(true, true), MIMIC_PALETTE),
}

const BUBBLE_SPRITES = [
  pixelSprite(
    ['wW.', 'WWB', '.BB'],
    {
      w: '#ffffff',
      W: RAMPS.water[3],
      B: RAMPS.water[2],
    },
    { outline: RAMPS.water[0] },
  ),
  pixelSprite(
    ['.wWW.', 'wWWWB', 'WWWBB', 'WWBBb', '.Bbb.'],
    {
      w: '#ffffff',
      W: RAMPS.water[3],
      B: RAMPS.water[2],
      b: RAMPS.water[1],
    },
    { outline: RAMPS.water[0] },
  ),
] as const

const flowerSprite = (petal: Ramp) =>
  pixelSprite(['.H.h.', 'HhYhp', '.hpp.', '..l..', '.Ll..', '..l..'], {
    H: petal[4],
    h: petal[3],
    p: petal[2],
    Y: RAMPS.gold[4],
    l: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
  })
const FLOWER_SPRITES = [
  flowerSprite(RAMPS.pink),
  flowerSprite(RAMPS.gold),
  flowerSprite(RAMPS.purple),
  flowerSprite(RAMPS.teal),
] as const

const STONE_PALETTE = {
  h: RAMPS.steel[4],
  L: RAMPS.steel[3],
  M: RAMPS.steel[2],
  m: RAMPS.steel[1],
}
const STONE_SPRITES = [
  pixelSprite(['hL.', 'LMm', '.mm'], STONE_PALETTE),
  pixelSprite(['.hLL.', 'hLMMm', 'LMMmm', '.mmm.'], STONE_PALETTE),
  pixelSprite(['hLM', 'Mmm'], STONE_PALETTE),
] as const
const BONE_SPRITE = pixelSprite(['W..W', '.WwC', 'CwW.', 'C..C'], {
  W: RAMPS.cream[4],
  w: RAMPS.cream[3],
  C: RAMPS.cream[2],
})
const GEM_SPRITE = pixelSprite(['.h.', 'hLM', '.m.'], {
  h: '#ffffff',
  L: RAMPS.teal[3],
  M: RAMPS.teal[2],
  m: RAMPS.teal[1],
})

const CLOUDS = [
  { x: 92, y: 9, size: 4.5, speed: 0.05 },
  { x: 168, y: 6, size: 3.5, speed: 0.035 },
  { x: 250, y: 11, size: 5, speed: 0.06 },
] as const
const HILLS = ridge(57, W, 9, 4)
const HEDGE = ridge(58, W, 5, 2)

class BurrowBuddy implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private levelTick = 0
  private dug = new Uint8Array(COLS * ROWS)
  private links = new Set<number>()
  /** Bumped on every change to the soil, so the cached ground knows to repaint. */
  private soilVersion = 0
  private plan!: GardenPlan
  private start = { tx: 7, ty: 6 }
  private stones = new Map<number, Stone>()
  private slumps: Slump[] = []
  private slumpAt = new Map<number, Slump>()
  /** The last slump to move, for a short while: a block it frees joins its chain. */
  private slumpEcho = { ticks: 0, chain: 0 }
  /** What the last slump to land squashed and paid. */
  lastSlump: { crushed: number; chain: number; bonus: number } | null = null
  /** Ticks left on each timed bubble tool (the headlamp lasts the garden, at -1). */
  private tools: Record<ToolKind, number> = {
    wide: 0,
    long: 0,
    quick: 0,
    drill: 0,
    headlamp: 0,
    sprinkler: 0,
  }
  private spray: {
    x0: number
    y0: number
    x1: number
    y1: number
    t: number
  } | null = null
  private player: Mover = { tx: 7, ty: 6, nx: 7, ny: 6, p: 0 }
  private facing: Dir = 2
  private pumpTarget: Enemy | null = null
  /** With Wide Puff, the second grump in the line puffs up along with the first. */
  private pumpExtra: Enemy | null = null
  private pumpCooldown = 0
  private stream: {
    x0: number
    y0: number
    x1: number
    y1: number
    t: number
  } | null = null
  private enemies: Enemy[] = []
  private turnips: Turnip[] = []
  private dropped = 0
  private veggie: { ticks: number; prize: Veggie } | null = null
  private dead = 0
  private levelClear = 0
  private nextExtra = EXTRA_EVERY
  private floating: Floating[] = []
  private floaters: Floater[] = []
  private particles: Particle[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(67)
  /** The soil with every tunnel dug so far, repainted only when the dig changes. */
  private ground: HTMLCanvasElement | null | undefined = undefined
  private groundKey = ''
  private mask = new Uint8Array(W * H)
  private lastFlip = new WeakMap<Enemy, boolean>()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- the garden -------------------------------------------------------------------

  private key(tx: number, ty: number): number {
    return ty * COLS + tx
  }

  private isDug(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false
    return ty === 0 || this.dug[this.key(tx, ty)] === 1
  }

  private linkKey(ax: number, ay: number, bx: number, by: number): number {
    const a = this.key(ax, ay)
    const b = this.key(bx, by)
    return Math.min(a, b) * 1000 + Math.max(a, b)
  }

  private linked(ax: number, ay: number, bx: number, by: number): boolean {
    if (ay === 0 && by === 0) return true
    return this.links.has(this.linkKey(ax, ay, bx, by))
  }

  private dig(tx: number, ty: number, fromX: number, fromY: number) {
    if (ty > 0 && !this.dug[this.key(tx, ty)]) {
      this.dug[this.key(tx, ty)] = 1
      this.addScore(DIG_POINTS)
    }
    this.links.add(this.linkKey(fromX, fromY, tx, ty))
    this.soilVersion++
  }

  /** Join a dug cell to every dug neighbour (authored tunnels, and the gap a slump leaves). */
  private linkAround(tx: number, ty: number) {
    for (let d = 0; d < 4; d++) {
      const nx = tx + DX[d]!
      const ny = ty + DY[d]!
      if (this.isDug(nx, ny) && !this.solidAt(nx, ny))
        this.links.add(this.linkKey(tx, ty, nx, ny))
    }
  }

  private inField(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS
  }

  private stoneAt(tx: number, ty: number): Stone | undefined {
    return this.inField(tx, ty) ? this.stones.get(cellKey(tx, ty)) : undefined
  }

  private blockAt(tx: number, ty: number): Slump | undefined {
    return this.inField(tx, ty) ? this.slumpAt.get(cellKey(tx, ty)) : undefined
  }

  /** Stones and slump blocks: Buddy can't dig them and nothing crawls through them. */
  private solidAt(tx: number, ty: number): boolean {
    return !!this.stoneAt(tx, ty) || !!this.blockAt(tx, ty)
  }

  private indexSlumps() {
    this.slumpAt.clear()
    for (const s of this.slumps)
      for (const c of s.cells) this.slumpAt.set(cellKey(c.x, c.y), s)
  }

  private readonly slumpWorld: SlumpWorld = {
    cut: (x, y) => !this.inField(x, y) || this.dug[cellKey(x, y)] === 1,
    open: (x, y) =>
      this.inField(x, y) &&
      y >= 1 &&
      this.dug[cellKey(x, y)] === 1 &&
      !this.solidAt(x, y) &&
      !this.turnipAt(x, y),
  }

  private toolOn(tool: ToolKind): boolean {
    return this.tools[tool] !== 0
  }

  /** How Buddy's mood-reading grumps feel: calm, restless (about to act), or a ghost. */
  grumpMood(e: Enemy): Mood {
    if (e.kind === 'cricket')
      return e.spray > 0 || e.digLeft > 0 ? 'restless' : 'calm'
    if (e.kind === 'mimic') return e.awake > 0 ? 'restless' : 'calm'
    return moodFor(e.ghost, e.ghostTimer)
  }

  private turnipAt(tx: number, ty: number): Turnip | undefined {
    return this.turnips.find(
      (t) =>
        (t.state === 'idle' || t.state === 'wobble') &&
        t.tx === tx &&
        t.ty === ty,
    )
  }

  private startLevel(level: number) {
    this.level = level
    this.levelTick = 0
    this.loadGarden(gardenFor(level, this.rng))
    this.dropped = 0
    this.veggie = null
    this.tools.headlamp = 0
    this.resetPlayer()
    const authored = this.plan.name !== `GARDEN ${level}`
    this.banner = {
      text: `GARDEN ${level}`,
      sub: authored ? this.plan.name : 'PUFF THE GRUMPS AWAY',
      ticks: 90,
    }
  }

  /** Lay a garden plan out on the field: the one loader every garden runs through. */
  private loadGarden(plan: GardenPlan) {
    this.plan = plan
    this.start = { tx: plan.start.x, ty: plan.start.y }
    this.dug.fill(0)
    this.links.clear()
    this.soilVersion++
    this.stones.clear()
    for (const c of plan.stones)
      this.stones.set(cellKey(c.x, c.y), { cracked: null, push: 0 })
    for (const { at, tool } of plan.cracked)
      this.stones.set(cellKey(at.x, at.y), { cracked: tool, push: 0 })
    this.slumps = plan.slumps.map((cells) => ({
      cells: cells.map((c) => ({ ...c })),
      state: 'held',
      t: 0,
      drop: 0,
      chain: 0,
      crushed: 0,
      riders: [],
    }))
    this.indexSlumps()
    this.slumpEcho = { ticks: 0, chain: 0 }
    for (const c of plan.tunnels) this.dug[cellKey(c.x, c.y)] = 1
    for (const c of plan.tunnels) this.linkAround(c.x, c.y)
    this.turnips = plan.turnips.map((c) => ({
      tx: c.x,
      ty: c.y,
      state: 'idle',
      t: 0,
      drop: 0,
      crushed: 0,
    }))
    this.enemies = plan.burrows.map((b) =>
      this.newEnemy(b.kind, b.at, b.across),
    )
  }

  private newEnemy(kind: GrumpKind, at: Cell, across: boolean): Enemy {
    return {
      kind,
      m: { tx: at.x, ty: at.y, nx: at.x, ny: at.y, p: 0 },
      spawn: { tx: at.x, ty: at.y },
      facing: across ? 1 : 2,
      ghost: false,
      gx: 0,
      gy: 0,
      ghostTicks: 0,
      ghostTimer: this.ghostDelay(),
      inflate: 0,
      deflate: 0,
      fleeing: false,
      fireCooldown: 200 + Math.floor(this.rng() * 200),
      fireWarn: 0,
      fire: 0,
      curl: 0,
      curlRest: 0,
      spray: 0,
      digLeft: 0,
      awake: 0,
    }
  }

  private ghostDelay(): number {
    const base = levelCurve(this.level, BURROW_CURVES.ghostEvery)
    return Math.round(base * (0.7 + this.rng() * 0.6))
  }

  private resetPlayer() {
    const { tx, ty } = this.start
    this.player = { tx, ty, nx: tx, ny: ty, p: 0 }
    this.facing = 2
    this.pumpTarget = null
    this.pumpExtra = null
    this.stream = null
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.levelClear > 0) {
      this.updateTurnips()
      if (--this.levelClear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.enemies.length === 0) {
      // Let a falling turnip or slump land (and pay its bonus) before the garden clears.
      this.updateTurnips()
      this.updateSlumps()
      const settling =
        this.turnips.some((t) => t.state === 'fall') ||
        this.slumps.some((s) => s.state === 'fall')
      if (!settling) this.clearLevel()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetPlayer()
          for (const e of this.enemies) this.sendHome(e)
        }
      }
      return
    }
    this.levelTick++
    this.updateTools()
    this.updatePlayer(controls)
    for (const e of [...this.enemies]) this.updateEnemy(e)
    this.updateTurnips()
    this.updateSlumps()
    this.updateVeggie()
  }

  private updateTools() {
    for (const tool of TOOL_KINDS) {
      if (TOOLS[tool].ticks > 0 && this.tools[tool] > 0) this.tools[tool]--
    }
    if (this.spray && --this.spray.t <= 0) this.spray = null
  }

  private grantTool(tool: ToolKind, x: number, y: number) {
    const rules = TOOLS[tool]
    this.tools[tool] = rules.charges
      ? this.tools[tool] + rules.charges
      : rules.ticks || -1
    this.banner = {
      text: `${rules.name}!`,
      sub: 'OUT OF A CRACKED STONE',
      ticks: 80,
    }
    this.fx.burst(x, y, this.fxRng, {
      count: 16,
      colours: [TOOL_COLOURS[tool][3], TOOL_COLOURS[tool][4], '#ffffff'],
    })
    this.sound.play('pickup')
  }

  private updatePlayer(input: InputFrame) {
    if (this.pumpCooldown > 0) this.pumpCooldown--
    if (this.stream && --this.stream.t <= 0) this.stream = null
    const want = this.wanted(input)
    const m = this.player

    if (input.pressed.b && this.tools.sprinkler > 0 && !this.pumpTarget) {
      this.sprinkle()
    }

    if (this.pumpTarget) {
      if (want !== null || !this.enemies.includes(this.pumpTarget)) {
        this.pumpTarget = null
        this.pumpExtra = null
      } else {
        if (input.pressed.a || (input.held.a && this.pumpCooldown === 0)) {
          this.pumpCooldown = PUMP_REPEAT
          const extra = this.pumpExtra
          this.puff(this.pumpTarget)
          if (extra && this.enemies.includes(extra)) this.puff(extra)
        }
        return
      }
    }

    const firing = input.pressed.a || (input.held.a && this.pumpCooldown === 0)
    if (moving(m)) {
      if (want !== null && want === this.reverseOf(m)) {
        ;[m.tx, m.nx] = [m.nx, m.tx]
        ;[m.ty, m.ny] = [m.ny, m.ty]
        m.p = 1 - m.p
        this.facing = want
      }
      if (this.solidAt(m.nx, m.ny)) {
        // A slump slid into the cell Buddy was heading for: back off.
        m.nx = m.tx
        m.ny = m.ty
        m.p = 0
        return
      }
      const drill = this.toolOn('drill')
      m.p +=
        drill || (this.isDug(m.nx, m.ny) && this.linked(m.tx, m.ty, m.nx, m.ny))
          ? WALK_SPEED
          : DIG_SPEED
      if (m.p >= 1) {
        this.dig(m.nx, m.ny, m.tx, m.ty)
        const ax = m.nx + (m.nx - m.tx)
        const ay = m.ny + (m.ny - m.ty)
        m.tx = m.nx
        m.ty = m.ny
        m.p = 0
        // Digging right up to a tunnel breaks through the last thin wall.
        if (ay >= 1 && this.isDug(ax, ay) && !this.turnipAt(ax, ay)) {
          this.links.add(this.linkKey(m.tx, m.ty, ax, ay))
        }
      }
    } else if (want !== null && firing) {
      this.facing = want
    } else if (want !== null) {
      this.facing = want
      const nx = m.tx + DX[want]!
      const ny = m.ty + DY[want]!
      const inside = nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS
      const stone = this.stoneAt(nx, ny)
      if (stone?.cracked) this.pushStone(stone, nx, ny)
      if (inside && !this.turnipAt(nx, ny) && !this.solidAt(nx, ny)) {
        m.nx = nx
        m.ny = ny
        m.p = 0
      }
    }

    if (firing) {
      this.pumpCooldown = PUMP_REPEAT
      this.shoot()
    }
  }

  private wanted(input: InputFrame): Dir | null {
    const order: Array<[keyof InputFrame['held'], Dir]> = [
      ['up', 0],
      ['right', 1],
      ['down', 2],
      ['left', 3],
    ]
    for (const [button, dir] of order) if (input.pressed[button]) return dir
    for (const [button, dir] of order) if (input.held[button]) return dir
    return null
  }

  private reverseOf(m: Mover): Dir {
    const dx = m.nx - m.tx
    const dy = m.ny - m.ty
    if (dx > 0) return 3
    if (dx < 0) return 1
    return dy > 0 ? 0 : 2
  }

  /** The tile Buddy is mostly standing on. */
  private playerTile(): { tx: number; ty: number } {
    const m = this.player
    return m.p < 0.5 ? { tx: m.tx, ty: m.ty } : { tx: m.nx, ty: m.ny }
  }

  private enemyPos(e: Enemy) {
    return e.ghost ? { x: e.gx, y: e.gy } : at(e.m)
  }

  // --- bubbles -------------------------------------------------------------------

  private puffable(e: Enemy): boolean {
    return !(e.inflate === 0 && e.ghost && !e.fleeing)
  }

  private near(e: Enemy, c: { x: number; y: number }, r = 10): boolean {
    const p = this.enemyPos(e)
    return Math.abs(p.x - c.x) < r && Math.abs(p.y - c.y) < r
  }

  /** The tile a crawling grump is mostly on. */
  private enemyTile(e: Enemy): { tx: number; ty: number } {
    if (e.ghost) {
      return {
        tx: Math.round((e.gx - T / 2) / T),
        ty: Math.round((e.gy - FY - T / 2) / T),
      }
    }
    return e.m.p < 0.5 ? { tx: e.m.tx, ty: e.m.ty } : { tx: e.m.nx, ty: e.m.ny }
  }

  private shoot() {
    const stats = puffStats((tool) => this.toolOn(tool))
    const from = this.playerTile()
    const start = at(this.player)
    let tx = from.tx
    let ty = from.ty
    let end = { x: start.x, y: start.y }
    const hits: Enemy[] = []
    let hitEnd = end
    for (let step = 0; step < stats.reach; step++) {
      const nx = tx + DX[this.facing]!
      const ny = ty + DY[this.facing]!
      if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
      tx = nx
      ty = ny
      end = centre(tx, ty)
      const here = end
      const target = this.enemies.find(
        (e) => !hits.includes(e) && this.puffable(e) && this.near(e, here),
      )
      if (!target) continue
      if (target.curl > 0) {
        // A curled pill bug bounces the bubbles straight back.
        this.bounce(target, start, end)
        if (!hits.length) return
        break
      }
      hits.push(target)
      hitEnd = end
      if (!stats.wide || hits.length === 2) break
    }
    if (hits.length) {
      this.stream = {
        x0: start.x,
        y0: start.y,
        x1: hitEnd.x,
        y1: hitEnd.y,
        t: 10,
      }
      this.pumpTarget = hits[0]!
      this.pumpExtra = hits[1] ?? null
      for (const e of hits) this.puff(e)
      return
    }
    this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 8 }
    this.sound.play('shoot')
  }

  private bounce(
    e: Enemy,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) {
    this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 6 }
    const p = this.enemyPos(e)
    this.floaters.push({ x: p.x, y: p.y - 10, text: 'BOING', life: 30 })
    this.fx.burst(p.x, p.y, this.fxRng, {
      count: 6,
      colours: [RAMPS.water[3], RAMPS.steel[4]],
    })
    this.sound.play('shoot')
  }

  private puff(e: Enemy) {
    e.inflate++
    e.deflate = DEFLATE_TICKS
    e.fireWarn = 0
    e.fire = 0
    e.spray = 0
    e.digLeft = 0
    this.sound.play('blip')
    if (e.inflate >= popAt(e.kind, this.toolOn('quick'))) {
      if (e.kind === 'mimic') this.unmask(e)
      else this.pop(e)
    }
  }

  private pop(e: Enemy) {
    const p = this.enemyPos(e)
    const row = Math.max(1, Math.round((p.y - FY - T / 2) / T))
    let points = Math.round(depthPoints(row) * GRUMPS[e.kind].worth)
    // A beetle puffed from the side is worth double, as in the classic.
    if (e.kind === 'beetle' && (this.facing === 1 || this.facing === 3)) {
      points *= 2
    }
    this.addScore(points, p.x, p.y - 10)
    this.fx.burst(p.x, p.y, this.fxRng, { count: 10 })
    this.floating.push({ x: p.x, y: p.y, life: 70, kind: e.kind })
    this.removeEnemy(e)
    this.sound.play('pop')
  }

  /** Two puffs and a mimic turns back into a real turnip, right where it sat. */
  private unmask(e: Enemy) {
    const { tx, ty } = this.enemyTile(e)
    this.removeEnemy(e)
    const c = centre(tx, ty)
    this.addScore(MIMIC_POINTS, c.x, c.y - 10)
    this.fx.burst(c.x, c.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.purple[3], RAMPS.cream[4], RAMPS.leaf[3]],
    })
    this.sound.play('pop')
    const m = this.player
    const buddyThere =
      (m.tx === tx && m.ty === ty) || (m.nx === tx && m.ny === ty)
    if (ty < 1 || buddyThere || this.solidAt(tx, ty) || this.turnipAt(tx, ty))
      return
    this.dug[cellKey(tx, ty)] = 0
    for (let d = 0; d < 4; d++)
      this.links.delete(this.linkKey(tx, ty, tx + DX[d]!, ty + DY[d]!))
    this.soilVersion++
    this.turnips.push({ tx, ty, state: 'idle', t: 0, drop: 0, crushed: 0 })
    this.floaters.push({ x: c.x, y: c.y - 20, text: 'TURNIP!', life: 40 })
  }

  private removeEnemy(e: Enemy) {
    this.enemies = this.enemies.filter((other) => other !== e)
    if (this.pumpTarget === e) {
      this.pumpTarget = this.pumpExtra
      this.pumpExtra = null
    }
    if (this.pumpExtra === e) this.pumpExtra = null
  }

  /** Crack a cracked stone open by pushing into it, for the bubble tool inside. */
  private pushStone(stone: Stone, tx: number, ty: number) {
    stone.push++
    const c = centre(tx, ty)
    if (stone.push % 10 === 0) {
      this.burst(c.x, c.y, 3, RAMPS.steel[3])
      this.sound.play('blip')
    }
    if (stone.push < CRACK_PUSH || !stone.cracked) return
    this.stones.delete(cellKey(tx, ty))
    this.soilVersion++
    this.burst(c.x, c.y, 12, RAMPS.steel[3])
    this.grantTool(stone.cracked, c.x, c.y)
  }

  /** The sprinkler washes the tunnel ahead clear: every grump in it goes home, fires out. */
  private sprinkle() {
    this.tools.sprinkler--
    const from = this.playerTile()
    const start = at(this.player)
    let tx = from.tx
    let ty = from.ty
    let end = { x: start.x, y: start.y }
    let washed = 0
    for (let step = 0; step < SPRINKLER_REACH; step++) {
      const nx = tx + DX[this.facing]!
      const ny = ty + DY[this.facing]!
      if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
      tx = nx
      ty = ny
      end = centre(tx, ty)
      const here = end
      for (const e of this.enemies) {
        if (e.ghost && !e.fleeing) continue
        if (!this.near(e, here, 12)) continue
        if (this.pumpTarget === e) this.pumpTarget = null
        if (this.pumpExtra === e) this.pumpExtra = null
        this.sendHome(e)
        washed++
      }
    }
    this.spray = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 24 }
    if (washed) {
      this.floaters.push({ x: end.x, y: end.y - 10, text: 'WASHED!', life: 40 })
    }
    this.sound.play('shoot')
  }

  // --- grubs and beetles ----------------------------------------------------------

  private sendHome(e: Enemy) {
    e.m = {
      tx: e.spawn.tx,
      ty: e.spawn.ty,
      nx: e.spawn.tx,
      ny: e.spawn.ty,
      p: 0,
    }
    e.ghost = false
    e.inflate = 0
    e.fire = 0
    e.fireWarn = 0
    e.curl = 0
    e.curlRest = 0
    e.spray = 0
    e.digLeft = 0
    e.awake = 0
    e.ghostTimer = this.ghostDelay()
    // A slump may have buried its burrow: then it drifts out as a ghost.
    if (!this.isDug(e.spawn.tx, e.spawn.ty)) this.becomeGhost(e)
  }

  private updateEnemy(e: Enemy) {
    if (e.inflate > 0) {
      if (this.pumpTarget !== e && --e.deflate <= 0) {
        e.inflate--
        e.deflate = 40
      }
      return
    }
    // The last grump left makes a run for the surface.
    if (
      this.enemies.length === 1 &&
      this.levelTick > this.plan.escapeAfter &&
      !e.fleeing
    ) {
      e.fleeing = true
      e.curl = 0
      e.spray = 0
      e.digLeft = 0
      e.awake = 0
      this.becomeGhost(e)
    }
    const speed =
      levelCurve(this.level, BURROW_CURVES.speed) * GRUMPS[e.kind].pace
    if (!e.ghost) {
      if (e.kind === 'pillbug' && this.curled(e)) return
      if (e.kind === 'mimic' && !this.mimicAwake(e)) {
        if (this.dead === 0) this.touchPlayer(e)
        return
      }
      if (GRUMPS[e.kind].ghosts || e.kind === 'cricket') e.ghostTimer--
    }
    if (e.ghost) {
      this.drift(e, speed)
    } else if (e.kind === 'cricket') {
      this.burrow(e, speed)
    } else {
      this.crawl(e, speed)
      if (e.kind === 'beetle') this.breathe(e)
    }
    if (this.dead === 0) this.touchPlayer(e)
  }

  /** Is Buddy lined up on a grump and facing it, within a few tiles? */
  private faced(e: Enemy, range: number): boolean {
    const p = this.playerTile()
    const q = this.enemyTile(e)
    const dx = q.tx - p.tx
    const dy = q.ty - p.ty
    if (dx !== 0 && dy !== 0) return false
    const dist = Math.abs(dx) + Math.abs(dy)
    if (dist === 0 || dist > range) return false
    const dir: Dir = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0
    return this.facing === dir
  }

  /** A pill bug curls into a ball when Buddy faces it, then must rest before it can again. */
  private curled(e: Enemy): boolean {
    if (e.curl > 0) {
      if (--e.curl === 0) e.curlRest = CURL_REST
      return true
    }
    if (e.curlRest > 0) {
      e.curlRest--
      return false
    }
    if (!this.faced(e, CURL_RANGE)) return false
    e.curl = CURL_TICKS
    this.sound.play('blip')
    return true
  }

  /** A mimic pretends to be a turnip until Buddy comes close, then hops after it. */
  private mimicAwake(e: Enemy): boolean {
    if (e.awake > 0) {
      e.awake--
      return true
    }
    const p = this.playerTile()
    const q = this.enemyTile(e)
    if (Math.abs(p.tx - q.tx) + Math.abs(p.ty - q.ty) > MIMIC_RANGE)
      return false
    e.awake = MIMIC_AWAKE
    this.sound.play('warn')
    return true
  }

  /** Open a cell for a grump that digs (no points: only Buddy's digging scores). */
  private openCell(tx: number, ty: number, fromX: number, fromY: number) {
    this.dug[cellKey(tx, ty)] = 1
    this.links.add(this.linkKey(fromX, fromY, tx, ty))
    this.soilVersion++
  }

  /** The next cell a mole cricket would dig toward Buddy, or null when it is boxed in. */
  private cricketStep(e: Enemy): Dir | null {
    const m = e.m
    const p = this.playerTile()
    const dx = p.tx - m.tx
    const dy = p.ty - m.ty
    const across: Dir = dx > 0 ? 1 : 3
    const down: Dir = dy > 0 ? 2 : 0
    const order: Dir[] =
      Math.abs(dx) >= Math.abs(dy) ? [across, down] : [down, across]
    for (const d of order) {
      if ((d === 1 || d === 3) && dx === 0) continue
      if ((d === 0 || d === 2) && dy === 0) continue
      const nx = m.tx + DX[d]!
      const ny = m.ty + DY[d]!
      if (!this.inField(nx, ny) || ny < 1) continue
      if (this.solidAt(nx, ny) || this.turnipAt(nx, ny)) continue
      return d
    }
    return null
  }

  /** A mole cricket crawls like a grub, but when restless it digs new tunnels toward Buddy. */
  private burrow(e: Enemy, speed: number) {
    const m = e.m
    if (moving(m)) {
      if (this.solidAt(m.nx, m.ny)) {
        m.nx = m.tx
        m.ny = m.ty
        m.p = 0
        return
      }
      const digging = !this.isDug(m.nx, m.ny)
      m.p += digging ? speed * 0.6 : speed
      if (m.p < 1) return
      if (digging || !this.linked(m.tx, m.ty, m.nx, m.ny))
        this.openCell(m.nx, m.ny, m.tx, m.ty)
      m.tx = m.nx
      m.ty = m.ny
      m.p = 0
    }
    if (e.spray > 0) {
      if (--e.spray > 0) return
      const d = this.cricketStep(e)
      if (d === null) {
        e.digLeft = 0
        return
      }
      e.facing = d
      m.nx = m.tx + DX[d]!
      m.ny = m.ty + DY[d]!
      e.digLeft--
      return
    }
    if (e.digLeft > 0) {
      if (this.cricketStep(e) === null) e.digLeft = 0
      else e.spray = e.digLeft === CRICKET_DIG ? SPRAY_TICKS : 10
      return
    }
    if (e.ghostTimer <= 0) {
      e.ghostTimer = this.ghostDelay()
      e.digLeft = CRICKET_DIG
      return
    }
    this.crawl(e, speed)
  }

  private becomeGhost(e: Enemy) {
    const p = at(e.m)
    e.ghost = true
    e.gx = p.x
    e.gy = p.y
    e.ghostTicks = 0
  }

  private drift(e: Enemy, speed: number) {
    e.ghostTicks++
    const goal = e.fleeing ? centre(0, 0) : at(this.player)
    const dx = goal.x - e.gx
    const dy = goal.y - e.gy
    const d = Math.hypot(dx, dy) || 1
    const v = speed * T * (e.fleeing ? 1.2 : 0.8)
    e.gx += (dx / d) * v
    e.gy += (dy / d) * v
    if (e.fleeing) {
      if (d < 2) {
        this.removeEnemy(e)
        this.banner = {
          text: 'ONE GOT AWAY',
          sub: 'THE GARDEN IS STILL SAFE',
          ticks: 100,
        }
      }
      return
    }
    // Settle back into a tunnel once the ghost has drifted a while.
    if (e.ghostTicks < GHOST_MIN) return
    const tx = Math.round((e.gx - T / 2) / T)
    const ty = Math.round((e.gy - FY - T / 2) / T)
    const c = centre(tx, ty)
    if (
      ty >= 1 &&
      this.isDug(tx, ty) &&
      Math.hypot(c.x - e.gx, c.y - e.gy) < 3
    ) {
      e.ghost = false
      e.m = { tx, ty, nx: tx, ny: ty, p: 0 }
      e.ghostTimer = this.ghostDelay()
    }
  }

  private crawl(e: Enemy, speed: number) {
    const m = e.m
    if (moving(m) && this.solidAt(m.nx, m.ny)) {
      m.nx = m.tx
      m.ny = m.ty
      m.p = 0
    }
    if (moving(m)) {
      m.p += speed
      if (m.p >= 1) {
        m.tx = m.nx
        m.ty = m.ny
        m.p = 0
      } else {
        return
      }
    }
    if (e.fireWarn > 0 || e.fire > 0) return
    if (e.ghostTimer <= 0) {
      this.becomeGhost(e)
      return
    }
    const goal = at(this.player)
    const options: Dir[] = []
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      const nx = m.tx + DX[d]!
      const ny = m.ty + DY[d]!
      if (ny < 1 || !this.isDug(nx, ny) || this.turnipAt(nx, ny)) continue
      if (!this.linked(m.tx, m.ty, nx, ny)) continue
      options.push(d)
    }
    if (!options.length) return
    const back = ((e.facing + 2) % 4) as Dir
    const forward =
      options.length > 1 ? options.filter((d) => d !== back) : options
    let choice = forward[0]!
    if (this.rng() < 0.3) {
      choice = forward[Math.floor(this.rng() * forward.length)]!
    } else {
      let best = Infinity
      for (const d of forward) {
        const c = centre(m.tx + DX[d]!, m.ty + DY[d]!)
        const dist = Math.hypot(c.x - goal.x, c.y - goal.y)
        if (dist < best) {
          best = dist
          choice = d
        }
      }
    }
    e.facing = choice
    m.nx = m.tx + DX[choice]!
    m.ny = m.ty + DY[choice]!
  }

  /** Beetles stop, glow, then breathe a short flame along their row. */
  private breathe(e: Enemy) {
    if (e.fire > 0) {
      e.fire--
      return
    }
    if (e.fireWarn > 0) {
      if (--e.fireWarn === 0) {
        e.fire = 30
        this.sound.play('boom')
      }
      return
    }
    if (moving(e.m) || --e.fireCooldown > 0) return
    e.fireCooldown = 240 + Math.floor(this.rng() * 200)
    const p = this.playerTile()
    if (p.ty === e.m.ty && Math.abs(p.tx - e.m.tx) <= 4) {
      e.facing = p.tx > e.m.tx ? 1 : 3
    } else if (e.facing !== 1 && e.facing !== 3) {
      return
    }
    e.fireWarn = 40
    this.sound.play('warn')
  }

  private flameSpan(e: Enemy) {
    const c = at(e.m)
    const dir = e.facing === 1 ? 1 : -1
    const x0 = dir > 0 ? c.x + 6 : c.x - 6 - T * 2
    return { x0, x1: x0 + T * 2, y: c.y }
  }

  private touchPlayer(e: Enemy) {
    const p = at(this.player)
    if (e.fire > 0) {
      const f = this.flameSpan(e)
      if (p.x > f.x0 && p.x < f.x1 && Math.abs(p.y - f.y) < 8) {
        this.die('TOASTED!')
        return
      }
    }
    if (e.ghost || e.curl > 0) return
    const q = at(e.m)
    if (Math.hypot(p.x - q.x, p.y - q.y) < 11)
      this.die(e.kind === 'mimic' ? 'CHOMPED BY A MIMIC!' : 'CAUGHT!')
  }

  private die(text: string) {
    if (this.dead > 0) return
    this.lives--
    this.dead = DEATH_TICKS
    this.pumpTarget = null
    const p = at(this.player)
    this.burst(p.x, p.y, 16, '#5eead4')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 80 }
  }

  // --- turnips -------------------------------------------------------------------

  private updateTurnips() {
    for (const t of this.turnips) {
      // A turnip set in a slump block rides with the block, never on its own.
      if (t.state === 'idle' && this.blockAt(t.tx, t.ty)) continue
      if (t.state === 'idle') {
        const p = this.playerTile()
        const under = p.tx === t.tx && p.ty === t.ty + 1
        if (this.isDug(t.tx, t.ty + 1) && !under) {
          t.state = 'wobble'
          t.t = 40
        }
      } else if (t.state === 'wobble') {
        if (--t.t <= 0) {
          t.state = 'fall'
          this.sound.play('warn')
        }
      } else if (t.state === 'fall') {
        t.drop += 2
        this.crushUnder(t)
        if (t.drop % T === 0) {
          const row = t.ty + t.drop / T
          if (row + 1 >= ROWS || !this.isDug(t.tx, row + 1)) this.land(t)
        }
      } else if (t.state === 'broken' && t.t > 0) {
        t.t--
      }
    }
    this.turnips = this.turnips.filter((t) => t.state !== 'broken' || t.t > 0)
  }

  private crushUnder(t: Turnip) {
    const x = t.tx * T + T / 2
    const top = FY + t.ty * T + t.drop
    for (const e of [...this.enemies]) {
      const p = this.enemyPos(e)
      if (e.ghost && !e.fleeing) continue
      if (Math.abs(p.x - x) < 10 && p.y > top + 4 && p.y < top + T + 6) {
        t.crushed++
        this.floating.push({ x: p.x, y: p.y, life: 50, kind: e.kind })
        this.removeEnemy(e)
        this.sound.play('pop')
      }
    }
    const p = at(this.player)
    if (
      this.dead === 0 &&
      Math.abs(p.x - x) < 10 &&
      p.y > top + 6 &&
      p.y < top + T + 4
    ) {
      this.die('BONKED BY A TURNIP')
    }
  }

  private land(t: Turnip) {
    t.state = 'broken'
    t.t = 30
    const x = t.tx * T + T / 2
    const y = FY + t.ty * T + t.drop + T / 2
    this.burst(x, y, 10, '#e9d5ff')
    this.sound.play('boom')
    const bonus = crushBonus(t.crushed)
    if (bonus) {
      this.addScore(bonus, x, y - 12)
      this.fx.burst(x, y, this.fxRng, { count: 18, speed: 2.2 })
    }
    this.dropped++
    if (this.dropped === 2) this.offerVeggie(veggieForGarden(this.level))
    this.checkGoldenBeet(t.crushed)
  }

  private offerVeggie(prize: Veggie) {
    // The Golden Beet outranks any veggie already waiting.
    if (this.veggie?.prize === GOLDEN_BEET) return
    this.veggie = { ticks: 600, prize }
    this.banner = {
      text: `${prize.name}!`,
      sub: 'GRAB IT WHERE BUDDY STARTED',
      ticks: 90,
    }
  }

  private checkGoldenBeet(crushed: number) {
    if (crushed >= GOLDEN_BEET_CRUSH) this.offerVeggie(GOLDEN_BEET)
  }

  private updateVeggie() {
    if (!this.veggie) return
    if (--this.veggie.ticks <= 0) {
      this.veggie = null
      return
    }
    const p = this.playerTile()
    if (p.tx === this.start.tx && p.ty === this.start.ty) {
      const c = centre(this.start.tx, this.start.ty)
      this.addScore(this.veggie.prize.points, c.x, c.y - 12)
      this.fx.burst(c.x, c.y, this.fxRng, {
        count: 14,
        colours: [RAMPS.gold[4], RAMPS.rust[3], RAMPS.leaf[3]],
      })
      this.veggie = null
      this.sound.play('pickup')
    }
  }

  // --- slumps ------------------------------------------------------------------

  /** Slump blocks: held, then a creaking tell once cut free, then a fall as one piece. */
  private updateSlumps() {
    if (this.slumpEcho.ticks > 0) this.slumpEcho.ticks--
    for (const s of this.slumps) {
      if (s.state === 'held') {
        if (!slumpFree(s.cells, this.slumpWorld)) continue
        // Like a turnip, a block waits while Buddy stands right under it.
        const p = this.playerTile()
        if (leadingCells(s.cells).some((c) => c.x === p.tx && c.y === p.ty))
          continue
        s.state = 'creak'
        s.t = CREAK_TICKS
        s.chain = this.slumpEcho.ticks > 0 ? this.slumpEcho.chain + 1 : 1
        s.crushed = 0
        this.sound.play('warn')
      } else if (s.state === 'creak') {
        if (!slumpFree(s.cells, this.slumpWorld)) {
          s.state = 'held'
          continue
        }
        if (--s.t > 0) continue
        s.state = 'fall'
        s.drop = 0
        this.boardRiders(s)
      } else {
        s.drop += SLUMP_FALL
        this.crushUnderSlump(s)
        if (s.drop < T) continue
        this.shiftSlump(s)
        s.drop = 0
        this.slumpEcho = { ticks: CHAIN_WINDOW, chain: s.chain }
        // Once sliding it keeps going until something solid is under it.
        if (!undercut(s.cells, this.slumpWorld)) this.landSlump(s)
      }
    }
  }

  /** Grumps standing on top of a block when it lets go ride all the way down with it. */
  private boardRiders(s: Slump) {
    for (const c of topCells(s.cells)) {
      for (const e of [...this.enemies]) {
        if (e.ghost || e.inflate > 0) continue
        const q = this.enemyTile(e)
        if (q.tx !== c.x || q.ty !== c.y) continue
        const p = this.enemyPos(e)
        s.riders.push({ kind: e.kind, x: p.x, y: p.y })
        this.removeEnemy(e)
      }
    }
  }

  /** The block's bottom edge sweeps down through the row under it, squashing what it meets. */
  private crushUnderSlump(s: Slump) {
    for (const c of leadingCells(s.cells)) {
      const x = c.x * T + T / 2
      const top = FY + c.y * T
      const edge = top + s.drop
      for (const e of [...this.enemies]) {
        if (e.ghost && !e.fleeing) continue
        const p = this.enemyPos(e)
        if (Math.abs(p.x - x) >= 10 || p.y < top - 4 || p.y > edge + 6) continue
        s.crushed++
        this.floating.push({ x: p.x, y: p.y, life: 50, kind: e.kind })
        this.removeEnemy(e)
        this.sound.play('pop')
      }
      const p = at(this.player)
      if (
        this.dead === 0 &&
        Math.abs(p.x - x) < 10 &&
        p.y > top - 4 &&
        p.y < edge + 4
      ) {
        this.die('BONKED BY A SLUMP')
      }
    }
  }

  /** Move a block down one row: the gap it leaves is open tunnel, the row it fills is solid. */
  private shiftSlump(s: Slump) {
    const before = new Set(s.cells.map((c) => cellKey(c.x, c.y)))
    const moved = s.cells.map((c) => ({ x: c.x, y: c.y + 1 }))
    const after = new Set(moved.map((c) => cellKey(c.x, c.y)))
    for (const c of moved) {
      if (before.has(cellKey(c.x, c.y))) continue
      this.dug[cellKey(c.x, c.y)] = 0
      for (let d = 0; d < 4; d++)
        this.links.delete(this.linkKey(c.x, c.y, c.x + DX[d]!, c.y + DY[d]!))
    }
    const vacated = s.cells.filter((c) => !after.has(cellKey(c.x, c.y)))
    for (const c of vacated) this.dug[cellKey(c.x, c.y)] = 1
    // Stones and turnips set in the block come down with it, lowest first.
    const carried = [...this.stones.entries()]
      .filter(([k]) => before.has(k))
      .sort(([a], [b]) => b - a)
    for (const [k, stone] of carried) {
      this.stones.delete(k)
      this.stones.set(k + COLS, stone)
    }
    for (const t of this.turnips) {
      if (t.state === 'idle' && before.has(cellKey(t.tx, t.ty))) t.ty++
    }
    s.cells = moved
    this.indexSlumps()
    for (const c of vacated) this.linkAround(c.x, c.y)
    for (const r of s.riders) r.y += T
    this.soilVersion++
    this.sound.play('boom')
  }

  private landSlump(s: Slump) {
    s.state = 'held'
    const crushed = s.crushed + s.riders.length
    const lead = leadingCells(s.cells)
    const xs = lead.map((c) => c.x)
    const x = ((Math.min(...xs) + Math.max(...xs) + 1) * T) / 2
    const y = FY + lead[0]!.y * T
    for (const r of s.riders) {
      this.floating.push({ x: r.x, y: r.y, life: 60, kind: r.kind })
    }
    s.riders = []
    this.burst(x, y, 16, RAMPS.earth[3])
    this.sound.play('boom')
    const bonus = slumpBonus(crushed, s.chain)
    if (bonus) {
      this.addScore(bonus, x, y - 16)
      this.fx.burst(x, y, this.fxRng, { count: 24, speed: 2.4 })
    }
    if (s.chain > 1) {
      this.banner = {
        text: `SLUMP CHAIN X${s.chain}!`,
        sub: crushed ? `${crushed} GRUMPS SQUASHED` : undefined,
        ticks: 80,
      }
    }
    this.lastSlump = { crushed, chain: s.chain, bonus }
    this.checkGoldenBeet(crushed)
    s.crushed = 0
  }

  private clearLevel() {
    this.levelClear = LEVEL_CLEAR_TICKS
    this.pumpTarget = null
    const p = at(this.player)
    this.fx.burst(p.x, p.y, this.fxRng, { count: 20, speed: 2.4 })
    this.banner = {
      text: 'GARDEN SAFE!',
      sub: 'ON TO THE NEXT PATCH',
      ticks: LEVEL_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 40 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA BUDDY!', ticks: 90 }
      const p = at(this.player)
      this.fx.burst(p.x, p.y, this.fxRng, {
        count: 16,
        colours: [RAMPS.teal[3], RAMPS.teal[4], RAMPS.gold[4]],
      })
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const f of this.floating) {
      f.y -= 0.8
      f.life--
    }
    this.floating = this.floating.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    const names = ['up', 'right', 'down', 'left'] as const
    if (this.pumpTarget) {
      held.a = true
      return frame
    }
    const me = this.playerTile()
    const { reach } = puffStats((tool) => this.toolOn(tool))
    // A grump lined up in a tunnel within reach: face it and puff (or, close up, sprinkle it).
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      let tx = me.tx
      let ty = me.ty
      for (let step = 0; step < reach; step++) {
        const nx = tx + DX[d]!
        const ny = ty + DY[d]!
        if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
        tx = nx
        ty = ny
        const c = centre(tx, ty)
        const hit = this.enemies.some(
          (e) => this.puffable(e) && e.curl === 0 && this.near(e, c),
        )
        if (hit) {
          held[names[d]] = true
          if (step === 0 && this.tools.sprinkler > 0 && this.facing === d)
            frame.pressed.b = true
          else frame.pressed.a = true
          return frame
        }
      }
    }
    if (moving(this.player)) return frame
    // Otherwise line up with the nearest grub two or three tiles out, then
    // dig toward it to break into its tunnel (and puff next frame).
    const away = (c: { tx: number; ty: number }) =>
      Math.abs(c.tx - me.tx) + Math.abs(c.ty - me.ty)
    const grump = this.enemies
      .filter((e) => !e.ghost)
      .map((e) => e.m)
      .sort((a, b) => away(a) - away(b))[0]
    // With no grump close by, a cracked stone nearby is worth pushing open for its tool.
    const cracked = [...this.stones]
      .filter(([, s]) => s.cracked)
      .map(([k]) => ({ tx: k % COLS, ty: Math.floor(k / COLS) }))
      .sort((a, b) => away(a) - away(b))[0]
    const forStone =
      !!cracked && away(cracked) <= 5 && (!grump || away(grump) > 4)
    const target = forStone ? cracked : grump
    if (!target) return frame
    const dx = target.tx - me.tx
    const dy = target.ty - me.ty
    const dist = Math.abs(dx) + Math.abs(dy)
    if (forStone && dist === 1) {
      held[names[dx === 0 ? (dy > 0 ? 2 : 0) : dx > 0 ? 1 : 3]] = true
      return frame
    }
    const step = (dir: Dir) => {
      const nx = me.tx + DX[dir]!
      const ny = me.ty + DY[dir]!
      if (nx < 0 || nx >= COLS || ny < 1 || ny >= ROWS) return false
      if (this.turnipAt(nx, ny) || this.blockAt(nx, ny)) return false
      // Plain stones are in the way; a cracked one is worth pushing open.
      const stone = this.stoneAt(nx, ny)
      if (stone && !stone.cracked) return false
      held[names[dir]] = true
      return true
    }
    if (dist <= 1) {
      step(((this.facing + 2) % 4) as Dir)
      return frame
    }
    if (dx === 0 || dy === 0) {
      const toward: Dir = dx === 0 ? (dy > 0 ? 2 : 0) : dx > 0 ? 1 : 3
      step(toward)
      return frame
    }
    // Close the smaller gap first so the grub ends up in a straight line.
    const alignX = Math.abs(dx) <= Math.abs(dy)
    const first: Dir = alignX ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0
    const second: Dir = alignX ? (dy > 0 ? 2 : 0) : dx > 0 ? 1 : 3
    if (!step(first)) step(second)
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const set = (this.level - 1) % SOIL_SETS.length
    this.renderGarden(g, set)
    for (const s of this.slumps) this.renderSlump(g, s, set)
    for (const [k, stone] of this.stones) this.renderStone(g, k, stone)
    for (const t of this.turnips) this.renderTurnip(g, t)
    if (this.veggie) this.renderVeggie(g)
    for (const e of this.enemies) if (e.fleeing) this.renderEscapePath(g, e)
    for (const e of this.enemies) this.renderEnemy(g, e)
    for (const e of this.enemies) {
      if (!e.ghost && (e.fire > 0 || e.fireWarn > 0)) this.renderFire(g, e)
      if (!e.ghost && e.spray > 0) this.renderDirtSpray(g, e)
    }
    if (this.stream) this.renderStream(g)
    if (this.spray) this.renderSprinkler(g)
    if (this.toolOn('headlamp') && this.dead === 0) {
      const p = at(this.player)
      glow(g, p.x, p.y, this.lightRadius() * T, RAMPS.cream[4], 0.18)
    }
    if (this.dead === 0 && !this.over) this.renderBuddy(g)
    for (const f of this.floating) this.renderFloating(g, f)
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.25)
    this.renderHud(g)
  }

  private renderGarden(g: CanvasRenderingContext2D, set: number) {
    // The soil only changes when Buddy digs, so the dug garden lives on its own canvas and is
    // repainted (soil layer plus shaded tunnels) only when the dig state moves on.
    const key = `${this.level}:${this.soilVersion}`
    if (this.ground === undefined) this.ground = makeCanvas(W, H)
    const canvas = this.ground
    if (!canvas || key !== this.groundKey) {
      const k = canvas ? canvas.getContext('2d')! : g
      cachedLayer(k, `burrow-buddy-soil-${set}`, W, H, (s) =>
        paintSoil(s, SOIL_SETS[set]!),
      )
      this.paintTunnels(k, set)
      this.groundKey = key
    }
    if (canvas) {
      g.save()
      g.imageSmoothingEnabled = false
      g.drawImage(canvas, 0, 0)
      g.restore()
    }
    for (const c of CLOUDS) {
      const x = ((c.x + this.tick * c.speed) % (W + 40)) - 20
      drawCloud(g, x, c.y, c.size)
    }
    this.renderDigFront(g, set)
  }

  /** Every dug tile and passage as one shaded channel: dark walls, a lit lip on the floor. */
  private paintTunnels(k: CanvasRenderingContext2D, set: number) {
    const mask = this.mask
    mask.fill(0)
    const top = SURFACE_Y - 2
    const open = (x0: number, y0: number, w: number, h: number) => {
      const y1 = Math.min(FIELD_BOTTOM, y0 + h)
      for (let y = Math.max(top, y0); y < y1; y++)
        mask.fill(1, y * W + x0, y * W + x0 + w)
    }
    for (let ty = 1; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        if (!this.isDug(tx, ty)) continue
        const x = tx * T
        const y = FY + ty * T
        open(x + 2, y + 2, T - 4, T - 4)
        if (tx + 1 < COLS && this.linked(tx, ty, tx + 1, ty)) {
          open(x + T - 2, y + 2, 4, T - 4)
        }
        if (this.linked(tx, ty, tx, ty - 1)) open(x + 2, y - 2, T - 4, 4)
      }
    }
    const maskAt = (x: number, y: number) =>
      x >= 0 && x < W && y >= top && y < FIELD_BOTTOM && mask[y * W + x] === 1
    // Above the grass is open sky, so a shaft breaks out of the ground with no ceiling.
    const openAt = (x: number, y: number) => y < top || maskAt(x, y)
    // Round the outer corners off, two pixels deep.
    for (let pass = 0; pass < 2; pass++) {
      const cut: number[] = []
      for (let y = top; y < FIELD_BOTTOM; y++) {
        for (let x = 0; x < W; x++) {
          if (mask[y * W + x] !== 1) continue
          const vertical = !openAt(x, y - 1) || !openAt(x, y + 1)
          const horizontal = !openAt(x - 1, y) || !openAt(x + 1, y)
          if (vertical && horizontal) cut.push(y * W + x)
        }
      }
      for (const i of cut) mask[i] = 0
    }
    const tones = TUNNEL_TONES[set]!
    for (let y = top; y < FIELD_BOTTOM; y++) {
      paintRow(k, y, (x) => {
        if (maskAt(x, y)) {
          const t = tones[bandAt(x, y)]!
          if (!openAt(x, y - 1) || !openAt(x, y - 2) || !openAt(x - 1, y))
            return t.ceil
          if (!openAt(x, y + 1)) return t.floor
          if (!openAt(x + 1, y)) return t.wall
          if (!openAt(x, y + 2)) return (x + y) & 1 ? t.floor : t.mid
          return t.mid
        }
        if (maskAt(x, y - 1) || maskAt(x - 1, y))
          return tones[bandAt(x, y)]!.lip
        if (maskAt(x, y + 1) || maskAt(x + 1, y))
          return tones[bandAt(x, y)]!.rim
        return null
      })
    }
  }

  /** The tunnel Buddy is digging right now, with soil crumbling at the face. */
  private renderDigFront(g: CanvasRenderingContext2D, set: number) {
    const m = this.player
    if (!moving(m) || this.linked(m.tx, m.ty, m.nx, m.ny) || m.ny <= 0) return
    const a = centre(m.tx, m.ty)
    const b = at(m)
    const dx = Math.sign(m.nx - m.tx)
    const dy = Math.sign(m.ny - m.ty)
    // Start at the edge of the tile Buddy left when it is already open.
    const back = this.isDug(m.tx, m.ty) ? 6 : -6
    const sx = a.x + dx * back
    const sy = a.y + dy * back
    const ex = b.x + dx * 6
    const ey = b.y + dy * 6
    const x0 = dx !== 0 ? Math.round(Math.min(sx, ex)) : a.x - 6
    const y0 = dy !== 0 ? Math.round(Math.min(sy, ey)) : a.y - 6
    const w = dx !== 0 ? Math.round(Math.abs(ex - sx)) : 12
    const h = dy !== 0 ? Math.round(Math.abs(ey - sy)) : 12
    if (w <= 0 || h <= 0) return
    const band = bandAt(
      Math.max(0, Math.min(W - 1, Math.round(b.x))),
      Math.round(b.y),
    )
    const t = TUNNEL_TONES[set]![band]!
    g.fillStyle = t.mid
    g.fillRect(x0, y0, w, h)
    if (dx !== 0) {
      g.fillStyle = t.rim
      g.fillRect(x0, y0 - 1, w, 1)
      g.fillStyle = t.ceil
      g.fillRect(x0, y0, w, 2)
      g.fillStyle = t.floor
      g.fillRect(x0, y0 + h - 1, w, 1)
      g.fillStyle = t.lip
      g.fillRect(x0, y0 + h, w, 1)
      g.fillStyle = dx > 0 ? t.lip : t.rim
      g.fillRect(dx > 0 ? x0 + w : x0 - 1, y0, 1, h)
    } else {
      g.fillStyle = t.rim
      g.fillRect(x0 - 1, y0, 1, h)
      g.fillStyle = t.lip
      g.fillRect(x0 + w, y0, 1, h)
      g.fillStyle = t.ceil
      g.fillRect(x0, y0, 1, h)
      g.fillStyle = t.wall
      g.fillRect(x0 + w - 1, y0, 1, h)
      if (dy > 0) {
        g.fillStyle = t.floor
        g.fillRect(x0, y0 + h - 1, w, 1)
        g.fillStyle = t.lip
        g.fillRect(x0, y0 + h, w, 1)
      } else {
        g.fillStyle = t.rim
        g.fillRect(x0, y0 - 1, w, 1)
        g.fillStyle = t.ceil
        g.fillRect(x0, y0, w, 2)
      }
    }
    // Crumbs tumbling off the dig face.
    const soil = SOIL_SETS[set]![band]!
    const faceX = dx > 0 ? x0 + w : dx < 0 ? x0 : a.x
    const faceY = dy > 0 ? y0 + h : dy < 0 ? y0 : a.y
    for (let i = 0; i < 4; i++) {
      const k = (this.tick * 3 + i * 7) % 9
      const along = 1 + (k % 3)
      const across = k - 4
      const cx = faceX - dx * along + (dx === 0 ? across : 0)
      const cy = faceY - dy * along + (dy === 0 ? across : 0)
      g.fillStyle = i % 2 ? soil[3] : soil[1]
      g.fillRect(Math.round(cx), Math.round(cy), i === 0 ? 2 : 1, 1)
    }
  }

  private renderTurnip(g: CanvasRenderingContext2D, t: Turnip) {
    const wobble =
      t.state === 'wobble' ? Math.round(Math.sin(this.tick) * 1.5) : 0
    const x = t.tx * T + T / 2 + wobble
    const y = FY + t.ty * T + t.drop + T / 2 + this.slumpOffset(t.tx, t.ty)
    if (t.state === 'broken') {
      drawSprite(g, TURNIP_BROKEN, x, y, { alpha: t.t / 30 })
      return
    }
    if (t.state === 'fall') {
      // A puff of loose soil trailing the drop.
      g.fillStyle = rgba(RAMPS.cream[2], 0.6)
      const k = Math.floor(this.tick / 2) % 3
      g.fillRect(x - 5 + k, y - 12, 1, 1)
      g.fillRect(x + 3 - k, y - 14, 1, 1)
      g.fillRect(x - 1, y - 16 + k, 1, 1)
    }
    drawSprite(g, TURNIP_SPRITE, x, y - 1)
  }

  private renderVeggie(g: CanvasRenderingContext2D) {
    const c = centre(this.start.tx, this.start.ty)
    const veggie = this.veggie!
    if (veggie.ticks < 120 && Math.floor(this.tick / 6) % 2) return
    const golden = veggie.prize === GOLDEN_BEET
    glow(g, c.x, c.y, 14 + Math.sin(this.tick / 8) * 2, RAMPS.gold[3], 0.5)
    if (golden) glow(g, c.x, c.y, 22, RAMPS.gold[4], 0.35)
    dropShadow(g, c.x, c.y + 6, 4, 1.2)
    drawSprite(
      g,
      VEGGIE_SPRITES[veggie.prize.name]!,
      c.x,
      c.y + Math.round(Math.sin(this.tick / 10)),
    )
    const twinkle = Math.floor(this.tick / 8) % 4
    if (twinkle < 2) {
      const sx = c.x + (twinkle ? -6 : 6)
      const sy = c.y + (twinkle ? -5 : 2)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(sx - 1, sy, 3, 1)
      g.fillRect(sx, sy - 1, 1, 3)
    }
  }

  private renderEnemy(g: CanvasRenderingContext2D, e: Enemy) {
    const p = this.enemyPos(e)
    // Pixel sprites flip to face the way they last headed across, never rotate.
    let flip = this.lastFlip.get(e) ?? false
    if (e.facing === 1) flip = false
    else if (e.facing === 3) flip = true
    this.lastFlip.set(e, flip)
    if (e.ghost) {
      // A ghost is just goggles drifting through the soil, its body a faint shimmer.
      const body =
        e.kind === 'mimic' ? TURNIP_SPRITE : MOOD_SPRITES[e.kind].calm[0]!
      const shimmer = Math.floor(this.tick / 3) % 2
      drawSprite(g, body, p.x, p.y, {
        flipX: flip,
        alpha: 0.2 + shimmer * 0.08,
      })
      glow(g, p.x, p.y, 12, RAMPS.purple[3], 0.3)
      drawSprite(g, GHOST_SPRITE, p.x, p.y - 1)
      return
    }
    if (e.inflate > 0) {
      const sprite = PUFFED_SPRITES[e.kind][Math.min(3, e.inflate) - 1]!
      dropShadow(g, p.x, p.y + 6, sprite.width * 0.35, 1.5)
      drawSprite(g, sprite, p.x, p.y, { flipX: flip })
      return
    }
    const frame = moving(e.m) ? Math.floor(this.tick / 8) % 2 : 0
    if (e.kind === 'mimic') {
      // Just a turnip... except it sits in a tunnel, and now and then it blinks.
      const awake = e.awake > 0
      const blink =
        this.toolOn('headlamp') ||
        (this.tick + e.spawn.tx * 37) % MIMIC_BLINK_EVERY < MIMIC_BLINK
      const sprite = awake
        ? MIMIC_SPRITES.awake
        : blink
          ? MIMIC_SPRITES.blink
          : TURNIP_SPRITE
      const hop =
        awake && moving(e.m)
          ? -Math.abs(Math.round(Math.sin(this.tick / 4) * 3))
          : 0
      drawSprite(g, sprite, p.x, p.y - 1 + hop, { flipX: flip })
      return
    }
    dropShadow(g, p.x, p.y + 7, 5, 1.5, 0.4)
    if (e.kind === 'pillbug' && e.curl > 0) {
      const rock = Math.floor(this.tick / 10) % 2
      drawSprite(g, PILLBUG_BALL_SPRITE, p.x + rock, p.y + 1)
      return
    }
    const mood = this.grumpMood(e)
    const hot = e.fireWarn > 0 && Math.floor(this.tick / 4) % 2 === 0
    const sprites = hot
      ? BEETLE_HOT_SPRITES
      : MOOD_SPRITES[e.kind][mood === 'restless' ? 'restless' : 'calm']
    drawSprite(g, sprites[frame]!, p.x, p.y, { flipX: flip })
    if (mood === 'restless') {
      // Grumbling: a little puff of steam over its head.
      const k = Math.floor(this.tick / 6) % 3
      g.fillStyle = rgba(RAMPS.cream[4], 0.8)
      g.fillRect(Math.round(p.x) - 3 + k, Math.round(p.y) - 11 - k, 2, 2)
      g.fillRect(Math.round(p.x) + 2 - k, Math.round(p.y) - 13 + k, 1, 1)
    }
  }

  /** How far a slump block carrying this cell has slid into its next row. */
  private slumpOffset(tx: number, ty: number): number {
    const s = this.blockAt(tx, ty)
    return s?.state === 'fall' ? s.drop : 0
  }

  /** The light round Buddy: the headlamp widens it (dark pockets arrive with the Seasons). */
  lightRadius(): number {
    return this.toolOn('headlamp') ? HEADLAMP_RADIUS : LAMP_RADIUS
  }

  /** A slump block: a chunk of the soil set apart by its fault lines, creaking before it slides. */
  private renderSlump(g: CanvasRenderingContext2D, s: Slump, set: number) {
    const shake =
      s.state === 'creak' ? (Math.floor(this.tick / 3) % 2 ? 1 : -1) : 0
    const dy = s.state === 'fall' ? s.drop : 0
    const inBlock = (x: number, y: number) =>
      s.cells.some((c) => c.x === x && c.y === y)
    const tones = TUNNEL_TONES[set]!
    s.cells.forEach((c, i) => {
      const cx = c.x * T + T / 2
      const band = bandAt(cx, FY + c.y * T + T / 2)
      const ramp = SOIL_SETS[set]![band]!
      const x = c.x * T + shake
      const y = FY + c.y * T + dy
      if (dy > 0 && !inBlock(c.x, c.y - 1)) {
        g.fillStyle = tones[band]!.mid
        g.fillRect(c.x * T, FY + c.y * T, T, dy)
      }
      g.fillStyle = ramp[2]
      g.fillRect(x, y, T, T)
      g.fillStyle = ramp[1]
      for (let k = 0; k < 5; k++) {
        const px = Math.floor(soilHash(i * 5 + k, 3) * (T - 2)) + 1
        const py = Math.floor(soilHash(i * 5 + k, 9) * (T - 2)) + 1
        g.fillRect(x + px, y + py, 1, 1)
      }
      g.fillStyle = ramp[3]
      if (!inBlock(c.x, c.y - 1)) g.fillRect(x, y, T, 2)
      if (!inBlock(c.x - 1, c.y)) g.fillRect(x, y, 1, T)
      g.fillStyle = ramp[0]
      if (!inBlock(c.x, c.y + 1)) g.fillRect(x, y + T - 2, T, 2)
      if (!inBlock(c.x + 1, c.y)) g.fillRect(x + T - 1, y, 1, T)
      // The fault line round the block, and a crack through every chunk.
      g.fillStyle = INK
      if (!inBlock(c.x, c.y - 1)) g.fillRect(x, y - 1, T, 1)
      if (!inBlock(c.x, c.y + 1)) g.fillRect(x, y + T, T, 1)
      if (!inBlock(c.x - 1, c.y)) g.fillRect(x - 1, y, 1, T)
      if (!inBlock(c.x + 1, c.y)) g.fillRect(x + T, y, 1, T)
      g.fillStyle = mix(INK, ramp[0], 0.5)
      const h = soilHash(i, 17)
      let ky = y + 4 + Math.floor(h * 8)
      for (let kx = 1; kx < T - 1; kx += 2) {
        ky += soilHash(i * 13 + kx, 5) > 0.5 ? 1 : -1
        ky = Math.max(y + 3, Math.min(y + T - 4, ky))
        g.fillRect(x + kx, ky, 2, 1)
      }
    })
    if (s.state === 'creak') {
      // Crumbs trickle off the bottom edge: the tell that it is about to go.
      g.fillStyle = RAMPS.cream[2]
      for (const c of leadingCells(s.cells)) {
        const k = (this.tick + c.x * 5) % 12
        g.fillRect(c.x * T + 4 + ((c.x * 7) % 8), FY + c.y * T + k, 1, 2)
      }
    }
    for (const r of s.riders) {
      const sprite =
        r.kind === 'mimic' ? TURNIP_SPRITE : MOOD_SPRITES[r.kind].restless[0]!
      drawSprite(g, sprite, r.x, r.y + dy)
    }
  }

  private renderStone(g: CanvasRenderingContext2D, k: number, stone: Stone) {
    const tx = k % COLS
    const ty = Math.floor(k / COLS)
    const c = centre(tx, ty)
    const y = c.y + this.slumpOffset(tx, ty)
    if (!stone.cracked) {
      drawSprite(g, BOULDER_SPRITE, c.x, y)
      return
    }
    const jiggle = stone.push > 0 && this.tick % 4 < 2 ? 1 : 0
    const colour = TOOL_COLOURS[stone.cracked]
    glow(g, c.x, y, 9 + Math.sin(this.tick / 9) * 2, colour[3], 0.35)
    drawSprite(g, CRACKED_SPRITES[stone.cracked], c.x + jiggle, y)
    if (Math.floor(this.tick / 10) % 6 === 0) {
      g.fillStyle = colour[4]
      g.fillRect(c.x + 3, y - 4, 1, 3)
      g.fillRect(c.x + 2, y - 3, 3, 1)
    }
  }

  /** The escaping last grump shows the way it is going: a dotted trail to the corner. */
  private renderEscapePath(g: CanvasRenderingContext2D, e: Enemy) {
    const goal = centre(0, 0)
    const dx = goal.x - e.gx
    const dy = goal.y - e.gy
    const steps = Math.floor(Math.hypot(dx, dy) / 7)
    for (let i = 1; i < steps; i++) {
      if ((i + Math.floor(this.tick / 5)) % 3 === 0) continue
      const x = Math.round(e.gx + (dx * i) / steps)
      const y = Math.round(e.gy + (dy * i) / steps)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
    }
    g.fillStyle = INK
    g.fillRect(goal.x - 4, goal.y - 10, 1, 12)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(goal.x - 3, goal.y - 10, 5, 2)
    g.fillRect(goal.x - 3, goal.y - 8, 3, 2)
  }

  /** A mole cricket's tell: dirt spraying from the face it is about to dig. */
  private renderDirtSpray(g: CanvasRenderingContext2D, e: Enemy) {
    const d = this.cricketStep(e)
    if (d === null) return
    const p = at(e.m)
    const fx = p.x + DX[d]! * 9
    const fy = p.y + DY[d]! * 9
    for (let i = 0; i < 6; i++) {
      const k = (this.tick * 2 + i * 5) % 10
      const sx = fx + DX[d]! * (k / 2) + (DY[d] ? (i - 3) * 2 : 0)
      const sy = fy + DY[d]! * (k / 2) + (DX[d] ? (i - 3) * 2 : 0) - (k % 3)
      g.fillStyle = i % 2 ? RAMPS.earth[3] : RAMPS.earth[1]
      g.fillRect(Math.round(sx), Math.round(sy), 2, 1)
    }
  }

  private renderSprinkler(g: CanvasRenderingContext2D) {
    const s = this.spray!
    const dx = s.x1 - s.x0
    const dy = s.y1 - s.y0
    const len = Math.max(1, Math.hypot(dx, dy))
    g.globalAlpha = Math.min(1, s.t / 12)
    for (let i = 0; i < len; i += 3) {
      const f = i / len
      const wob = ((i + this.tick * 2) % 5) - 2
      const x = s.x0 + dx * f + (dy ? wob : 0)
      const y = s.y0 + dy * f + (dx ? wob : 0)
      g.fillStyle = i % 2 ? RAMPS.sky[3] : RAMPS.water[4]
      g.fillRect(Math.round(x), Math.round(y), 2, 2)
    }
    g.globalAlpha = 1
    glow(g, s.x1, s.y1, 10, RAMPS.sky[3], 0.4)
  }

  /** A beetle's warning glow and its breath of fire, lit with colour math. */
  private renderFire(g: CanvasRenderingContext2D, e: Enemy) {
    const c = at(e.m)
    const dir = e.facing === 1 ? 1 : -1
    if (e.fireWarn > 0) {
      const charge = 1 - e.fireWarn / 40
      glow(g, c.x, c.y, 12 + charge * 6, RAMPS.ember[3], 0.25 + charge * 0.3)
      glow(g, c.x + dir * 8, c.y, 4 + charge * 4, RAMPS.gold[4], 0.7)
      return
    }
    const f = this.flameSpan(e)
    const mouth = dir > 0 ? f.x0 : f.x1
    glow(g, (f.x0 + f.x1) / 2, f.y, 26, RAMPS.ember[3], 0.55)
    glow(g, mouth, f.y, 12, RAMPS.gold[4], 0.6)
    const len = f.x1 - f.x0
    const layers = [
      [RAMPS.ember[0], 1.25],
      [RAMPS.ember[2], 1],
      [RAMPS.ember[3], 0.65],
      [RAMPS.ember[4], 0.35],
    ] as const
    for (const [colour, k] of layers) {
      g.fillStyle = colour
      for (let i = 0; i < len; i += 2) {
        const t = i / len
        const flick = ((i * 7 + this.tick * 3) % 5) - 2
        const h = Math.round(
          (3 + Math.sin(t * Math.PI * 0.85) * 7 + flick * 0.5) * k,
        )
        if (h <= 0 || (k < 0.5 && t > 0.75)) continue
        const x = dir > 0 ? f.x0 + i : f.x1 - i - 2
        g.fillRect(x, Math.round(f.y - h / 2), 2, h)
      }
    }
    g.fillStyle = RAMPS.gold[4]
    for (let i = 0; i < 3; i++) {
      const k = (this.tick * 5 + i * 11) % len
      const x = dir > 0 ? f.x0 + k : f.x1 - k
      g.fillRect(x, Math.round(f.y - 6 + ((k * 3 + i * 5) % 12)), 1, 1)
    }
  }

  private renderFloating(g: CanvasRenderingContext2D, f: Floating) {
    const x = Math.round(f.x + Math.sin(f.life / 6) * 1.5)
    const y = Math.round(f.y)
    g.save()
    g.globalAlpha *= Math.min(1, f.life / 30)
    g.fillStyle = rgba(RAMPS.water[3], 0.25)
    g.beginPath()
    g.arc(x, y, 9, 0, Math.PI * 2)
    g.fill()
    drawSprite(g, HAPPY_SPRITES[f.kind], x, y + 1)
    g.lineWidth = 1
    g.strokeStyle = INK
    g.beginPath()
    g.arc(x, y, 9.5, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = rgba(RAMPS.water[4], 0.9)
    g.beginPath()
    g.arc(x, y, 8, Math.PI * 1.05, Math.PI * 1.55)
    g.stroke()
    g.strokeStyle = rgba(RAMPS.pink[3], 0.6)
    g.beginPath()
    g.arc(x, y, 8, Math.PI * 0.1, Math.PI * 0.6)
    g.stroke()
    g.fillStyle = '#ffffff'
    g.fillRect(x - 6, y - 6, 2, 2)
    g.restore()
  }

  private renderStream(g: CanvasRenderingContext2D) {
    const s = this.stream!
    const dx = s.x1 - s.x0
    const dy = s.y1 - s.y0
    const len = Math.hypot(dx, dy)
    const steps = Math.max(1, Math.round(len / 5))
    const nx = len ? -dy / len : 0
    const ny = len ? dx / len : 0
    for (let i = 1; i <= steps; i++) {
      const f = i / steps
      const wob = Math.round(Math.sin(this.tick / 2 + i * 1.7))
      drawSprite(
        g,
        BUBBLE_SPRITES[i % 2]!,
        s.x0 + dx * f + nx * wob,
        s.y0 + dy * f + ny * wob,
      )
    }
    glow(g, s.x1, s.y1, 9, RAMPS.water[3], 0.5)
  }

  private renderBuddy(g: CanvasRenderingContext2D) {
    const p = at(this.player)
    const frame = moving(this.player) ? Math.floor(this.tick / 5) % 2 : 0
    const sprites =
      this.facing === 0
        ? BUDDY_SPRITES.back
        : this.facing === 2
          ? BUDDY_SPRITES.front
          : BUDDY_SPRITES.side
    dropShadow(g, p.x, p.y + 7, 5, 1.5, 0.4)
    drawSprite(g, sprites[frame]!, p.x, p.y, { flipX: this.facing === 3 })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 2, 1, 78, 18)
    drawText(g, String(this.score).padStart(6, '0'), 6, 3, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const garden = `GARDEN ${this.level}`
    const pw = Math.max(measureText(hi), measureText(garden)) + 10
    hudPanel(g, W - 2 - pw, 1, pw, 18)
    drawText(g, hi, W - 7, 3, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, garden, W - 7, 11, {
      align: 'right',
      color: RAMPS.leaf[3],
      outline: INK,
    })
    // Spare Buddies bottom left, a flower for every garden bottom right.
    const base = FIELD_BOTTOM
    const spare = Math.min(this.lives - 1, 6)
    if (spare > 0) {
      hudPanel(g, 2, base + 2, spare * 11 + 5, 14, RAMPS.teal)
      for (let i = 0; i < spare; i++) {
        drawSprite(g, LIFE_SPRITE, 9 + i * 11, base + 9)
      }
    }
    const flowers = Math.min(this.level, 10)
    const fw = flowers * 8 + 6
    hudPanel(g, W - 2 - fw, base + 2, fw, 14, RAMPS.leaf)
    for (let i = 0; i < flowers; i++) {
      drawSprite(
        g,
        FLOWER_SPRITES[i % FLOWER_SPRITES.length]!,
        W - 2 - fw + 7 + i * 8,
        base + 15,
        { anchor: 'feet' },
      )
    }
    // The bubble tools Buddy is carrying, bottom middle, each with what it has left.
    const held = TOOL_KINDS.filter((tool) => this.toolOn(tool))
    if (held.length) {
      const tw = held.length * 13 + 5
      const tx = Math.round(W / 2 - tw / 2)
      hudPanel(g, tx, base + 2, tw, 14, RAMPS.water)
      held.forEach((tool, i) => {
        const x = tx + 9 + i * 13
        const left = this.tools[tool]
        const flash = left > 0 && left < 120 && Math.floor(this.tick / 6) % 2
        if (!flash) drawSprite(g, TOOL_ICONS[tool], x, base + 8)
        const rules = TOOLS[tool]
        g.fillStyle = TOOL_COLOURS[tool][3]
        if (rules.ticks > 0) {
          g.fillRect(x - 5, base + 14, Math.ceil((left / rules.ticks) * 10), 1)
        } else if (rules.charges > 0) {
          for (let c = 0; c < left; c++)
            g.fillRect(x - 5 + c * 3, base + 14, 2, 1)
        }
      })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, FY + 64, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, FY + 84, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

/**
 * The garden behind the dig: a banded sky with a sun, far hills, a picket fence and flowers on
 * the lawn, then four strata of soil with seams, pebbles, roots and the odd buried treasure.
 */
function paintSoil(k: CanvasRenderingContext2D, set: SoilSet) {
  bandedGradient(
    k,
    0,
    0,
    W,
    SURFACE_Y,
    [
      RAMPS.sky[1],
      RAMPS.sky[2],
      RAMPS.sky[3],
      mix(RAMPS.sky[3], RAMPS.sky[4], 0.6),
    ],
    3,
  )
  glow(k, 150, 9, 16, RAMPS.gold[3], 0.6)
  shadedOrb(k, 150, 9, 5, RAMPS.gold, { outline: null })
  drawRidge(k, HILLS, {
    base: SURFACE_Y - 4,
    bottom: SURFACE_Y,
    width: W,
    fill: mix(RAMPS.leaf[1], RAMPS.sky[2], 0.45),
    rim: mix(RAMPS.leaf[2], RAMPS.sky[3], 0.4),
  })
  drawRidge(k, HEDGE, {
    base: SURFACE_Y - 2,
    bottom: SURFACE_Y,
    width: W,
    step: 2,
    fill: RAMPS.leaf[1],
    rim: RAMPS.leaf[2],
  })
  // The picket fence: two rails behind lit, pointed pickets.
  const fenceTop = SURFACE_Y - 12
  for (const ry of [fenceTop + 3, fenceTop + 7]) {
    k.fillStyle = INK
    k.fillRect(0, ry - 1, W, 4)
    k.fillStyle = RAMPS.cream[2]
    k.fillRect(0, ry, W, 2)
    k.fillStyle = RAMPS.cream[3]
    k.fillRect(0, ry, W, 1)
  }
  for (let px = 2; px < W; px += 8) {
    k.fillStyle = INK
    k.fillRect(px - 1, fenceTop + 1, 6, 10)
    k.fillRect(px, fenceTop, 4, 1)
    k.fillRect(px + 1, fenceTop - 1, 2, 1)
    k.fillStyle = RAMPS.cream[3]
    k.fillRect(px, fenceTop + 1, 4, 9)
    k.fillStyle = RAMPS.cream[4]
    k.fillRect(px + 1, fenceTop, 2, 1)
    k.fillRect(px, fenceTop + 1, 1, 9)
    k.fillStyle = RAMPS.cream[1]
    k.fillRect(px + 3, fenceTop + 2, 1, 8)
  }
  // Soil, a pixel row at a time, then the lawn's edge over it.
  for (let y = SURFACE_Y; y < FIELD_BOTTOM; y++) {
    paintRow(k, y, (x) => soilColour(set, x, y))
  }
  const rand = backdropRng(301)
  for (let i = 0; i < 12; i++) {
    const x0 = Math.floor(rand() * W)
    const len = 5 + Math.floor(rand() * 14)
    const phase = rand() * 6
    for (let j = 0; j < len; j++) {
      const x = x0 + Math.round(Math.sin(j * 0.45 + phase) * 1.5)
      k.fillStyle = RAMPS.cream[1]
      k.fillRect(x, SURFACE_Y + 2 + j, 1, 1)
      k.fillStyle = set[0][1]
      k.fillRect(x + 1, SURFACE_Y + 2 + j, 1, 1)
    }
  }
  for (let i = 0; i < 30; i++) {
    const x = 3 + rand() * (W - 6)
    const y = SURFACE_Y + 8 + rand() * (FIELD_BOTTOM - SURFACE_Y - 12)
    drawSprite(k, STONE_SPRITES[Math.floor(rand() * 3)]!, x, y)
  }
  for (let i = 0; i < 3; i++) {
    const x = 10 + rand() * (W - 20)
    const y = FY + BAND_ROWS[2] * T + 6 + rand() * (T * 2)
    drawSprite(k, BONE_SPRITE, x, y)
  }
  for (let i = 0; i < 5; i++) {
    const x = 6 + rand() * (W - 12)
    const y = FY + BAND_ROWS[3] * T + 8 + rand() * (T * 3 - 14)
    glow(k, x, y, 5, RAMPS.teal[3], 0.4)
    drawSprite(k, GEM_SPRITE, x, y)
  }
  k.fillStyle = RAMPS.leaf[3]
  k.fillRect(0, SURFACE_Y - 2, W, 1)
  k.fillStyle = RAMPS.leaf[2]
  k.fillRect(0, SURFACE_Y - 1, W, 1)
  k.fillStyle = RAMPS.leaf[1]
  k.fillRect(0, SURFACE_Y, W, 1)
  k.fillStyle = RAMPS.leaf[0]
  k.fillRect(0, SURFACE_Y + 1, W, 1)
  for (let x = 0; x < W; x += 3) {
    const n = soilHash(x, 7)
    k.fillStyle = RAMPS.leaf[3]
    k.fillRect(x, SURFACE_Y - 3 - (n > 0.6 ? 1 : 0), 1, n > 0.6 ? 2 : 1)
    if (n < 0.4) {
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(x + 1, SURFACE_Y + 2, 1, n < 0.2 ? 2 : 1)
    }
  }
  for (let i = 0; i < 8; i++) {
    drawSprite(
      k,
      FLOWER_SPRITES[i % FLOWER_SPRITES.length]!,
      12 + i * 32,
      SURFACE_Y - 1,
      { anchor: 'feet' },
    )
  }
  // Bedrock under the garden, where the HUD sits.
  bandedGradient(
    k,
    0,
    FIELD_BOTTOM,
    W,
    H - FIELD_BOTTOM,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    2,
  )
  for (let i = 0, x = -6; x < W; i++) {
    const w = 10 + Math.floor(soilHash(i, 3) * 8)
    bevel(k, x, FIELD_BOTTOM + 4 + (i % 2) * 3, w, 7, RAMPS.night, {
      depth: 1,
    })
    x += w + 3
  }
  k.fillStyle = INK
  k.fillRect(0, FIELD_BOTTOM, W, 1)
  k.fillStyle = RAMPS.night[3]
  k.fillRect(0, FIELD_BOTTOM + 1, W, 1)
}

const burrowBuddy: ArcadeGameModule = {
  create: (options) => new BurrowBuddy(options),
}

export const create = burrowBuddy.create
export default burrowBuddy

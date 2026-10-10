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

const T = 16
const COLS = 16
const ROWS = 14
const FY = 20
const W = COLS * T
const H = FY + ROWS * T + 18

const START = { tx: 7, ty: 6 }
const WALK_SPEED = 1 / 9
const DIG_SPEED = 1 / 15
const PUMP_REACH = 3
const PUMP_REPEAT = 12
const POP_AT = 4
const DEFLATE_TICKS = 50
const GHOST_MIN = 70
const START_LIVES = 3
const DEATH_TICKS = 100
const LEVEL_CLEAR_TICKS = 140
const EXTRA_EVERY = 20_000
const DIG_POINTS = 10
const CRUSH_BONUS = [0, 1000, 2500, 4000, 6000, 8000, 10_000, 12_000]

export const BURROW_CURVES = {
  grubs: { start: 3, step: 1, limit: 5 },
  beetles: { start: 0, step: 0.5, limit: 3 },
  /** Enemy speed in tiles per tick. */
  speed: { start: 1 / 22, step: 1 / 300, limit: 1 / 12 },
  /** Ticks before a grub gets bored and ghosts through the soil. */
  ghostEvery: { start: 520, step: -40, limit: 220 },
  turnips: { start: 3, step: 0.34, limit: 5 },
} as const

type Dir = 0 | 1 | 2 | 3
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

type Mover = { tx: number; ty: number; nx: number; ny: number; p: number }
type Enemy = {
  kind: 'grub' | 'beetle'
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
type Floating = { x: number; y: number; life: number; kind: 'grub' | 'beetle' }

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
const GRUB_SPRITES = [
  pixelSprite([...GRUB_BODY, '..dd...dd...'], GRUB_PALETTE),
  pixelSprite([...GRUB_BODY, '...dd.dd....'], GRUB_PALETTE),
] as const

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
const BEETLE_HOT_SPRITES = beetleFrames(RAMPS.ember)

/** A grub or beetle pumped up to stage 1..3: a shaded sphere with a face that worries more. */
function puffedSprite(kind: 'grub' | 'beetle', stage: number): PixelSprite {
  const r = Math.round(6 + stage * 2.2)
  const grid = orbRows(r)
  const ex = Math.round(r * 0.42)
  const ey = r - Math.round(r * 0.25)
  if (kind === 'grub') {
    const goggle =
      stage < 3
        ? ['YYY', 'YkY', 'YYY']
        : ['.YYY.', 'YwwwY', 'YwkwY', 'YwwwY', '.YYY.']
    const o = Math.floor(goggle.length / 2)
    stamp(grid, r - ex - o, ey - o, goggle)
    stamp(grid, r + ex - o, ey - o, goggle)
    stamp(grid, r - 1, r + Math.round(r * 0.4), ['.k.', 'k.k', '.k.'])
  } else {
    stamp(grid, r + ex - 1, ey - 1, ['GGG', 'GeG', 'GGG'])
    for (let y = 2; y < r; y += 2) stamp(grid, r - 1, y, ['h'])
    stamp(grid, r * 2 - 1, r, ['a', 'a'])
  }
  const shell =
    kind === 'grub'
      ? ([
          RAMPS.pink[1],
          RAMPS.pink[2],
          RAMPS.pink[3],
          RAMPS.pink[4],
          '#ffffff',
        ] as const)
      : ([
          RAMPS.leaf[1],
          RAMPS.leaf[2],
          RAMPS.leaf[3],
          RAMPS.leaf[4],
          '#ffffff',
        ] as const)
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
const PUFFED_SPRITES = {
  grub: [1, 2, 3].map((s) => puffedSprite('grub', s)),
  beetle: [1, 2, 3].map((s) => puffedSprite('beetle', s)),
}

const GHOST_SPRITE = pixelSprite(
  ['.YYY.YYY.', 'YwwkYwwkY', 'YwwkYwwkY', '.YYY.YYY.'],
  { Y: RAMPS.purple[3], w: '#ffffff', k: INK },
)

const HAPPY_SPRITES = {
  grub: pixelSprite(
    ['.HHPp.', 'HhPPPp', 'PkPPkp', 'PPPPPp', 'pkkkpd', '.pppd.'],
    GRUB_PALETTE,
  ),
  beetle: pixelSprite(
    ['.hLLM.', 'hLMMMm', 'MkMMkm', 'MMMMMm', 'mkkkmd', '.mmmd.'],
    beetlePalette(RAMPS.leaf),
  ),
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

const CARROT_SPRITE = pixelSprite(
  [
    '.l..L..l.',
    '..lLLLl..',
    '...dLd...',
    '..hOOOo..',
    '..OOOOo..',
    '..hOOoq..',
    '...OOo...',
    '...hOq...',
    '...Ooq...',
    '....o....',
    '....q....',
  ],
  {
    l: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
    d: RAMPS.leaf[1],
    h: RAMPS.rust[4],
    O: RAMPS.rust[3],
    o: RAMPS.rust[2],
    q: RAMPS.rust[1],
  },
)

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
  private player: Mover = {
    tx: START.tx,
    ty: START.ty,
    nx: START.tx,
    ny: START.ty,
    p: 0,
  }
  private facing: Dir = 2
  private pumpTarget: Enemy | null = null
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
  private veggie: { ticks: number } | null = null
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
    this.dug.fill(0)
    this.links.clear()
    // Buddy's shaft from the surface down to the middle.
    for (let ty = 1; ty <= START.ty; ty++) {
      this.dug[this.key(START.tx, ty)] = 1
      this.links.add(this.linkKey(START.tx, ty - 1, START.tx, ty))
    }
    this.enemies = []
    const grubs = Math.round(levelCurve(level, BURROW_CURVES.grubs))
    const beetles = Math.floor(levelCurve(level, BURROW_CURVES.beetles))
    const kinds: Array<'grub' | 'beetle'> = [
      ...new Array<'grub'>(grubs).fill('grub'),
      ...new Array<'beetle'>(beetles).fill('beetle'),
    ]
    for (const kind of kinds) this.placeEnemy(kind)
    this.turnips = []
    const turnips = Math.round(levelCurve(level, BURROW_CURVES.turnips))
    for (let tries = 0; this.turnips.length < turnips && tries < 200; tries++) {
      const tx = 1 + Math.floor(this.rng() * (COLS - 2))
      const ty = 2 + Math.floor(this.rng() * (ROWS - 5))
      if (this.isDug(tx, ty) || this.isDug(tx, ty + 1)) continue
      if (Math.abs(tx - START.tx) < 2) continue
      if (
        this.turnips.some((t) => Math.abs(t.tx - tx) + Math.abs(t.ty - ty) < 3)
      )
        continue
      this.turnips.push({ tx, ty, state: 'idle', t: 0, drop: 0, crushed: 0 })
    }
    this.dropped = 0
    this.veggie = null
    this.resetPlayer()
    this.banner = {
      text: `GARDEN ${level}`,
      sub: 'PUFF THE GRUMPS AWAY',
      ticks: 90,
    }
  }

  /** A grub's starting burrow: a short dug tunnel away from Buddy. */
  private placeEnemy(kind: 'grub' | 'beetle') {
    for (let tries = 0; tries < 200; tries++) {
      const across = this.rng() < 0.5
      const tx = 1 + Math.floor(this.rng() * (COLS - (across ? 4 : 2)))
      const ty = 3 + Math.floor(this.rng() * (ROWS - (across ? 4 : 6)))
      const cells: Array<[number, number]> = [0, 1, 2].map((i) =>
        across ? [tx + i, ty] : [tx, ty + i],
      )
      const clash = cells.some(
        ([x, y]) =>
          this.isDug(x, y) ||
          this.isDug(x, y - 1) ||
          this.isDug(x, y + 1) ||
          (Math.abs(x - START.tx) < 3 && Math.abs(y - START.ty) < 3),
      )
      if (clash) continue
      cells.forEach(([x, y], i) => {
        this.dug[this.key(x, y)] = 1
        if (i > 0) {
          const [px, py] = cells[i - 1]!
          this.links.add(this.linkKey(px, py, x, y))
        }
      })
      const [sx, sy] = cells[1]!
      this.enemies.push({
        kind,
        m: { tx: sx, ty: sy, nx: sx, ny: sy, p: 0 },
        spawn: { tx: sx, ty: sy },
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
      })
      return
    }
  }

  private ghostDelay(): number {
    const base = levelCurve(this.level, BURROW_CURVES.ghostEvery)
    return Math.round(base * (0.7 + this.rng() * 0.6))
  }

  private resetPlayer() {
    this.player = {
      tx: START.tx,
      ty: START.ty,
      nx: START.tx,
      ny: START.ty,
      p: 0,
    }
    this.facing = 2
    this.pumpTarget = null
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
      // Let a falling turnip land (and pay its bonus) before the garden clears.
      this.updateTurnips()
      if (!this.turnips.some((t) => t.state === 'fall')) this.clearLevel()
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
    this.updatePlayer(controls)
    for (const e of [...this.enemies]) this.updateEnemy(e)
    this.updateTurnips()
    this.updateVeggie()
  }

  private updatePlayer(input: InputFrame) {
    if (this.pumpCooldown > 0) this.pumpCooldown--
    if (this.stream && --this.stream.t <= 0) this.stream = null
    const want = this.wanted(input)
    const m = this.player

    if (this.pumpTarget) {
      if (want !== null || !this.enemies.includes(this.pumpTarget)) {
        this.pumpTarget = null
      } else {
        if (input.pressed.a || (input.held.a && this.pumpCooldown === 0)) {
          this.pumpCooldown = PUMP_REPEAT
          this.puff(this.pumpTarget)
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
      m.p +=
        this.isDug(m.nx, m.ny) && this.linked(m.tx, m.ty, m.nx, m.ny)
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
      if (inside && !this.turnipAt(nx, ny)) {
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

  private shoot() {
    const from = this.playerTile()
    const start = at(this.player)
    let tx = from.tx
    let ty = from.ty
    let end = { x: start.x, y: start.y }
    for (let step = 0; step < PUMP_REACH; step++) {
      const nx = tx + DX[this.facing]!
      const ny = ty + DY[this.facing]!
      if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
      tx = nx
      ty = ny
      end = centre(tx, ty)
      const target = this.enemies.find((e) => {
        if (e.inflate === 0 && e.ghost && !e.fleeing) return false
        const p = this.enemyPos(e)
        return Math.abs(p.x - end.x) < 10 && Math.abs(p.y - end.y) < 10
      })
      if (target) {
        this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 10 }
        this.pumpTarget = target
        this.puff(target)
        return
      }
    }
    this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 8 }
    this.sound.play('shoot')
  }

  private puff(e: Enemy) {
    e.inflate++
    e.deflate = DEFLATE_TICKS
    e.fireWarn = 0
    e.fire = 0
    this.sound.play('blip')
    if (e.inflate >= POP_AT) this.pop(e)
  }

  private pop(e: Enemy) {
    const p = this.enemyPos(e)
    const row = Math.max(1, Math.round((p.y - FY - T / 2) / T))
    let points = depthPoints(row)
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

  private removeEnemy(e: Enemy) {
    this.enemies = this.enemies.filter((other) => other !== e)
    if (this.pumpTarget === e) this.pumpTarget = null
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
    e.ghostTimer = this.ghostDelay()
  }

  private updateEnemy(e: Enemy) {
    if (e.inflate > 0) {
      if (this.pumpTarget !== e && --e.deflate <= 0) {
        e.inflate--
        e.deflate = 40
      }
      return
    }
    // The last grub left makes a run for the surface.
    if (this.enemies.length === 1 && this.levelTick > 300 && !e.fleeing) {
      e.fleeing = true
      this.becomeGhost(e)
    }
    const speed = levelCurve(this.level, BURROW_CURVES.speed)
    if (!e.ghost) e.ghostTimer--
    if (e.ghost) {
      this.drift(e, speed)
    } else {
      this.crawl(e, speed)
      if (e.kind === 'beetle') this.breathe(e)
    }
    if (this.dead === 0) this.touchPlayer(e)
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
    if (e.ghost) return
    const q = at(e.m)
    if (Math.hypot(p.x - q.x, p.y - q.y) < 11) this.die('CAUGHT!')
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
    const bonus = CRUSH_BONUS[Math.min(t.crushed, CRUSH_BONUS.length - 1)]!
    if (bonus) {
      this.addScore(bonus, x, y - 12)
      this.fx.burst(x, y, this.fxRng, { count: 18, speed: 2.2 })
    }
    this.dropped++
    if (this.dropped === 2) {
      this.veggie = { ticks: 600 }
      this.banner = {
        text: 'VEGGIE BONUS!',
        sub: 'GRAB IT IN THE MIDDLE',
        ticks: 90,
      }
    }
  }

  private updateVeggie() {
    if (!this.veggie) return
    if (--this.veggie.ticks <= 0) {
      this.veggie = null
      return
    }
    const p = this.playerTile()
    if (p.tx === START.tx && p.ty === START.ty) {
      const c = centre(START.tx, START.ty)
      this.addScore(Math.min(8000, 400 * this.level), c.x, c.y - 12)
      this.fx.burst(c.x, c.y, this.fxRng, {
        count: 14,
        colours: [RAMPS.gold[4], RAMPS.rust[3], RAMPS.leaf[3]],
      })
      this.veggie = null
      this.sound.play('pickup')
    }
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
    // A grub lined up in a tunnel within reach: face it and puff.
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      let tx = me.tx
      let ty = me.ty
      for (let step = 0; step < PUMP_REACH; step++) {
        const nx = tx + DX[d]!
        const ny = ty + DY[d]!
        if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
        tx = nx
        ty = ny
        const c = centre(tx, ty)
        const hit = this.enemies.some((e) => {
          if (e.ghost && !e.fleeing) return false
          const p = this.enemyPos(e)
          return Math.abs(p.x - c.x) < 10 && Math.abs(p.y - c.y) < 10
        })
        if (hit) {
          held[names[d]] = true
          frame.pressed.a = true
          return frame
        }
      }
    }
    if (moving(this.player)) return frame
    // Otherwise line up with the nearest grub two or three tiles out, then
    // dig toward it to break into its tunnel (and puff next frame).
    const target = this.enemies
      .filter((e) => !e.ghost)
      .map((e) => e.m)
      .sort(
        (a, b) =>
          Math.abs(a.tx - me.tx) +
          Math.abs(a.ty - me.ty) -
          (Math.abs(b.tx - me.tx) + Math.abs(b.ty - me.ty)),
      )[0]
    if (!target) return frame
    const dx = target.tx - me.tx
    const dy = target.ty - me.ty
    const dist = Math.abs(dx) + Math.abs(dy)
    const step = (dir: Dir) => {
      const nx = me.tx + DX[dir]!
      const ny = me.ty + DY[dir]!
      if (nx < 0 || nx >= COLS || ny < 1 || ny >= ROWS) return false
      if (this.turnipAt(nx, ny)) return false
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
    for (const t of this.turnips) this.renderTurnip(g, t)
    if (this.veggie) this.renderVeggie(g)
    for (const e of this.enemies) this.renderEnemy(g, e)
    for (const e of this.enemies) {
      if (!e.ghost && (e.fire > 0 || e.fireWarn > 0)) this.renderFire(g, e)
    }
    if (this.stream) this.renderStream(g)
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
    let dugCount = 0
    for (const v of this.dug) dugCount += v
    const key = `${this.level}:${this.links.size}:${dugCount}`
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
    const y = FY + t.ty * T + t.drop + T / 2
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
    const c = centre(START.tx, START.ty)
    if (this.veggie!.ticks < 120 && Math.floor(this.tick / 6) % 2) return
    glow(g, c.x, c.y, 14 + Math.sin(this.tick / 8) * 2, RAMPS.gold[3], 0.5)
    dropShadow(g, c.x, c.y + 6, 4, 1.2)
    drawSprite(
      g,
      CARROT_SPRITE,
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
      const body = e.kind === 'grub' ? GRUB_SPRITES[0] : BEETLE_SPRITES[0]
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
    dropShadow(g, p.x, p.y + 7, 5, 1.5, 0.4)
    if (e.kind === 'grub') {
      drawSprite(g, GRUB_SPRITES[frame]!, p.x, p.y, { flipX: flip })
      return
    }
    const hot = e.fireWarn > 0 && Math.floor(this.tick / 4) % 2 === 0
    const sprites = hot ? BEETLE_HOT_SPRITES : BEETLE_SPRITES
    drawSprite(g, sprites[frame]!, p.x, p.y, { flipX: flip })
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

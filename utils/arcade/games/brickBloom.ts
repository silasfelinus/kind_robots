// /utils/arcade/games/brickBloom.ts
//
// Brick Bloom -- the Kind Robots Arcade's Breakout / Arkanoid riff (conductor
// kr-arcade/t-009 game factory, batch 3). A paddle bot bounces a pollen ball
// into walls of glitch crates; every crate cracked frees a flower. Clear every
// breakable crate to bloom the stage.
//
// Where the ball meets the paddle decides its angle (the edges send it off
// steep and wide). Some cracked crates drop seeds to catch: W widens the
// paddle, S makes it sticky (catch the ball, aim, let go with A), M splits the
// ball in three, C calms the ball down, and a rare + is a spare paddle.
//
// Stages cycle through wall patterns and ramp on BLOOM_CURVES: faster balls,
// crates that take more hits, bolted crates that never break (from stage 4),
// and a drifting gloom puff that knocks the ball off course (from stage 3).
// Arrows move the paddle; A launches (or lets go of) the ball.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
  starField,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 256
const H = 320
const LEFT = 8
const RIGHT = W - 8
const TOP = 26
const PADDLE_Y = 296
const PADDLE_H = 6
const PADDLE_W = 36
const WIDE_W = 56
const BALL_R = 2.5
const COLS = 12
const ROWS = 9
const BRICK_W = (RIGHT - LEFT) / COLS
const BRICK_H = 10
const BRICK_TOP = 48
const START_LIVES = 3
const SERVE_TICKS = 50
const CLEAR_TICKS = 150
const LOST_TICKS = 70
const POWER_TICKS = 60 * 14
const EXTRA_AT = [20_000, 60_000, 120_000]
const MAX_BALLS = 5

/** Crate colours by row, top first (the top rows score more). */
const ROW_COLORS = [
  '#f472b6',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#a3e635',
  '#4ade80',
  '#2dd4bf',
  '#38bdf8',
  '#a78bfa',
]
const FLOWER_COLORS = ['#f9a8d4', '#fde047', '#c4b5fd', '#fdba74', '#86efac']

export const BLOOM_CURVES = {
  /** Ball speed (pixels per tick) at the start of a stage. */
  speed: { start: 2.4, step: 0.18, limit: 4.2 },
  /** The most a ball speeds up to as it keeps hitting things. */
  maxSpeed: { start: 3.6, step: 0.2, limit: 5.6 },
  /** Hits the toughest crates take. */
  tough: { start: 1, step: 0.5, limit: 4 },
  /** Chance a cracked crate drops a seed. */
  seedChance: { start: 0.16, step: -0.01, limit: 0.09 },
  /** Bolted (unbreakable) crates per stage. */
  bolts: { start: -3, step: 1, limit: 8 },
  puffs: { start: -1, step: 0.5, limit: 2 },
} as const

type Seed = 'W' | 'S' | 'M' | 'C' | '+'
const SEEDS: Seed[] = ['W', 'W', 'S', 'M', 'M', 'C', 'C', '+']
const SEED_COLORS: Record<Seed, string> = {
  W: '#38bdf8',
  S: '#4ade80',
  M: '#f472b6',
  C: '#c4b5fd',
  '+': '#fde047',
}

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  /** Bolted crates never break and don't count toward clearing. */
  bolt: boolean
  flash: number
}
type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  /** Riding the paddle (serve or sticky catch), at this offset. */
  stuck: number | null
}
type Drop = { x: number; y: number; kind: Seed }
type Puff = { x: number; y: number; vx: number; vy: number; hp: number }
type Flower = { x: number; y: number; vy: number; life: number; color: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Wall patterns: true where a crate stands. They cycle stage by stage. */
const PATTERNS: Array<(c: number, r: number) => boolean> = [
  // Full bands.
  (_c, r) => r >= 1 && r <= 6,
  // Pyramid.
  (c, r) => r >= 1 && r <= 7 && Math.abs(c - 5.5) <= r - 0.5,
  // Checkerboard.
  (c, r) => r <= 7 && (c + r) % 2 === 0,
  // Diamond.
  (c, r) => Math.abs(c - 5.5) + Math.abs(r - 4) <= 5,
  // Two towers and a bridge.
  (c, r) => r <= 7 && (c <= 2 || c >= 9 || r === 1 || r === 2),
  // Stripes with gaps.
  (c, r) => r % 2 === 0 && c % 4 !== 3,
]

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A five-step ramp around one colour: inked shadows below it, white-lit steps above. */
function rampOf(base: string): Ramp {
  return [
    mix(base, INK, 0.68),
    mix(base, INK, 0.36),
    mix(base, base, 0),
    mix(base, '#ffffff', 0.42),
    mix(base, '#ffffff', 0.8),
  ]
}

const ROW_RAMPS = ROW_COLORS.map(rampOf)
const SEED_RAMPS = Object.fromEntries(
  Object.entries(SEED_COLORS).map(([k, c]) => [k, rampOf(c)]),
) as Record<Seed, Ramp>

const CRATE_W = Math.round(BRICK_W) - 2
const CRATE_H = BRICK_H - 2

/**
 * A glossy crate: a lit top edge and a specular glint, a pale gloss band over the base face,
 * a shadowed lower lip and a slat seam down the middle (bolted crates get rivets instead).
 */
function crateSprite(
  ramp: Ramp,
  kind: 'crate' | 'bolt' | 'flash',
): PixelSprite {
  const w = CRATE_W
  const h = CRATE_H
  const seam = w >> 1
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const left = x === 0
      const right = x === w - 1
      let ch: string
      if (y === 0) ch = right ? 'L' : 'H'
      else if (y === h - 1) ch = left ? 'S' : 'D'
      else if (y === h - 2) ch = left ? 'B' : 'S'
      else if (left) ch = y <= 2 ? 'H' : 'L'
      else if (right) ch = 'S'
      else if (y === 1 && x <= 2) ch = 'W'
      else if (y <= 2) ch = 'L'
      else ch = 'B'
      if (kind === 'crate' && y >= 2 && y <= h - 3) {
        if (x === seam) ch = 'S'
        if (x === seam + 1) ch = 'L'
      }
      if (kind === 'bolt' && y >= 3 && y <= 4) {
        for (const r of [3, w - 5]) {
          if (x === r) ch = y === 3 ? 'W' : 'S'
          if (x === r + 1) ch = 'D'
        }
      }
      row += ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    W: '#ffffff',
    H: ramp[4],
    L: ramp[3],
    B: ramp[2],
    S: ramp[1],
    D: ramp[0],
  })
}

const CRATE_SPRITES = ROW_RAMPS.map((r) => crateSprite(r, 'crate'))
const BOLT_SPRITE = crateSprite(RAMPS.steel, 'bolt')
const FLASH_SPRITE = crateSprite(RAMPS.cream, 'flash')

/**
 * The paddle bot: a lit tray with pink bumper caps and an inked visor with two shining eyes
 * (closed in the blink frame). Built per width, since the wide seed swaps in a longer tray.
 */
function paddleSprite(w: number, body: Ramp, blink: boolean): PixelSprite {
  const c = w / 2
  const rows: string[] = []
  for (let y = 0; y < PADDLE_H; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || x === w - 1
      if (edge && (y === 0 || y === PADDLE_H - 1)) {
        row += '.'
        continue
      }
      const v = x - c
      if ((y === 2 || y === 3) && v >= -5 && v < 5) {
        const eye = (v >= -3 && v <= -2) || (v >= 1 && v <= 2)
        if (eye && (y === 3 || !blink))
          row += y === 2 && (v === -3 || v === 1) ? 'w' : 'y'
        else row += 'k'
        continue
      }
      const cap = x < 4 || x >= w - 4
      let ch: string
      if (y === 0) ch = 'H'
      else if (y === PADDLE_H - 1) ch = 'D'
      else if (y === PADDLE_H - 2) ch = x === 0 ? 'B' : 'S'
      else if (x === 0) ch = y === 1 ? 'H' : 'L'
      else if (x === w - 1) ch = 'S'
      else if (y === 1) ch = x >= 5 && x <= 8 ? 'H' : 'L'
      else ch = x === 4 || x === w - 5 ? 'S' : 'B'
      row += cap ? ch.toLowerCase() : ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    H: body[4],
    L: body[3],
    B: body[2],
    S: body[1],
    D: body[0],
    h: RAMPS.pink[4],
    l: RAMPS.pink[3],
    b: RAMPS.pink[2],
    s: RAMPS.pink[1],
    d: RAMPS.pink[0],
    k: INK,
    y: RAMPS.gold[3],
    w: '#ffffff',
  })
}

function paddleSet(w: number) {
  return {
    sky: [paddleSprite(w, RAMPS.sky, false), paddleSprite(w, RAMPS.sky, true)],
    leaf: [
      paddleSprite(w, RAMPS.leaf, false),
      paddleSprite(w, RAMPS.leaf, true),
    ],
  } as const
}

const PADDLE_SPRITES = { normal: paddleSet(PADDLE_W), wide: paddleSet(WIDE_W) }

const LIFE_SPRITE = pixelSprite(['hLLLLLLLs', 'pBkykykBs', 'pSSSSSSSd'], {
  h: RAMPS.pink[4],
  p: RAMPS.pink[2],
  s: RAMPS.pink[1],
  d: RAMPS.pink[0],
  L: RAMPS.sky[3],
  B: RAMPS.sky[2],
  S: RAMPS.sky[1],
  k: INK,
  y: RAMPS.gold[3],
})

/** The pollen ball: lit from the upper left, its spore speckles shifting as it spins. */
const BALL_PALETTE = {
  W: '#ffffff',
  Y: RAMPS.gold[3],
  y: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
const BALL_SPRITES = [
  pixelSprite(['.YYy.', 'YWYyy', 'YYydy', 'ydyyd', '.ydd.'], BALL_PALETTE),
  pixelSprite(['.YYy.', 'YWyYy', 'YYyyy', 'yyydd', '.dyd.'], BALL_PALETTE),
] as const

/** Bud, half-open and full bloom, per flower colour. */
function flowerSprites(colour: string): readonly PixelSprite[] {
  const ramp = rampOf(colour)
  const palette = {
    H: ramp[4],
    P: ramp[2],
    p: ramp[1],
    C: RAMPS.gold[4],
    c: RAMPS.gold[3],
    o: RAMPS.gold[1],
    g: RAMPS.leaf[1],
    G: RAMPS.leaf[3],
  }
  return [
    pixelSprite(['..H..', '.HPp.', '.Ppp.', '.gGg.', '..g..'], palette),
    pixelSprite(['.H.P.', 'HPCPp', '.Ppp.', '.gGg.', '..g..'], palette),
    pixelSprite(
      [
        '.HP.HP.',
        'HPPpPPp',
        '.pCCcp.',
        'HPCcoPp',
        '.pcoop.',
        'HPPpPPp',
        '.Pp.pp.',
      ],
      palette,
    ),
  ]
}

const FLOWER_SPRITES: Record<string, readonly PixelSprite[]> =
  Object.fromEntries(FLOWER_COLORS.map((c) => [c, flowerSprites(c)]))

const SPROUT_SPRITE = pixelSprite(['G.G', 'gGg', '.g.', '.d.'], {
  G: RAMPS.leaf[3],
  g: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

const LEAF_SPRITE = pixelSprite(['.GG', 'Ggd', 'gd.'], {
  G: RAMPS.leaf[3],
  g: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

/** A seed capsule, rolling: its dark seam band steps across as it falls. */
function capsuleSprite(ramp: Ramp, frame: number): PixelSprite {
  const w = 15
  const h = 9
  const band = frame ? 9 : 4
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    const trim = y === 0 || y === h - 1 ? 2 : y === 1 || y === h - 2 ? 1 : 0
    let row = ''
    for (let x = 0; x < w; x++) {
      if (x < trim || x >= w - trim) {
        row += '.'
        continue
      }
      let ch =
        y <= 1
          ? 'H'
          : y === 2
            ? 'L'
            : y >= h - 2
              ? 'D'
              : y === h - 3
                ? 'S'
                : 'B'
      if (x === trim && y > 1 && y < h - 2) ch = 'L'
      if (x === w - 1 - trim && y > 1) ch = 'S'
      if ((x === band || x === band + 1) && y > 1 && y < h - 2) ch = 'S'
      row += ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    H: ramp[4],
    L: ramp[3],
    B: ramp[2],
    S: ramp[1],
    D: ramp[0],
  })
}

function capsuleFrames(kind: Seed): readonly PixelSprite[] {
  return [
    capsuleSprite(SEED_RAMPS[kind], 0),
    capsuleSprite(SEED_RAMPS[kind], 1),
  ]
}

const CAPSULE_SPRITES: Record<Seed, readonly PixelSprite[]> = {
  W: capsuleFrames('W'),
  S: capsuleFrames('S'),
  M: capsuleFrames('M'),
  C: capsuleFrames('C'),
  '+': capsuleFrames('+'),
}

const GLOOM: Ramp = ['#1a1430', '#3a3058', '#5a5080', '#8a82ae', '#c8c2e0']
const GLOOM_FRAYED: Ramp = [
  '#2a2244',
  '#4a4068',
  '#6e6490',
  '#a098c0',
  '#dcd6f0',
]

type Theme = {
  sky: readonly string[]
  frame: string
  far: string
  farRim: string
  near: string
  nearRim: string
  stars: boolean
}

/** One greenhouse sky per stage, cycling: dusk, moonlight, dawn, and a teal glasshouse night. */
const THEMES: readonly Theme[] = [
  {
    sky: ['#120f33', '#24124f', '#43246e', '#6b2f78', '#8f3a72'],
    frame: '#2c2350',
    far: '#2a2a52',
    farRim: '#4a3f7a',
    near: RAMPS.leaf[0],
    nearRim: RAMPS.leaf[1],
    stars: true,
  },
  {
    sky: [RAMPS.night[0], RAMPS.night[1], RAMPS.night[2], '#1f3a6e', '#2b5a8a'],
    frame: '#1c2a4e',
    far: '#16305a',
    farRim: '#2f5a8a',
    near: '#0f3326',
    nearRim: RAMPS.leaf[1],
    stars: true,
  },
  {
    sky: ['#24124f', '#4c2a99', '#8a3a8a', '#b84a6e', '#d8685a'],
    frame: '#3a2266',
    far: '#4a2458',
    farRim: '#7a3a6e',
    near: RAMPS.leaf[0],
    nearRim: RAMPS.leaf[1],
    stars: false,
  },
  {
    sky: [RAMPS.night[0], RAMPS.teal[0], '#0f4f5a', '#127070', '#1a8a80'],
    frame: '#0c2e3a',
    far: '#0c3a44',
    farRim: '#1a6a6a',
    near: '#0c2a20',
    nearRim: RAMPS.leaf[1],
    stars: false,
  },
]

const STARS = starField(13, 46, W, 150)
const FAR_RIDGE = ridge(17, W, 30, 4)
const NEAR_RIDGE = ridge(23, W, 12, 3)
const HEDGE_FLECKS = (() => {
  const rand = backdropRng(19)
  return Array.from({ length: 70 }, () => ({
    x: Math.floor(rand() * W),
    y: 286 + Math.floor(rand() * 20),
  }))
})()
const FIREFLIES = (() => {
  const rand = backdropRng(37)
  return Array.from({ length: 6 }, () => ({
    x: 24 + rand() * (W - 48),
    y: 236 + rand() * 40,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 0.6,
  }))
})()
const SOIL_TOP = 306
const PANE_X = [LEFT, 68, 128, 188, RIGHT]
const PANE_Y = [TOP, 170, 230, 270]

/** The greenhouse: banded sky through the glass, hills, a hedge, the soil bed and the trellis. */
function paintGarden(k: CanvasRenderingContext2D, t: Theme) {
  bandedGradient(k, 0, TOP, W, H - TOP, t.sky, 6)
  if (t.stars) {
    k.save()
    k.translate(0, TOP)
    drawStars(k, STARS, 0, RAMPS.purple)
    k.restore()
  }
  drawRidge(k, FAR_RIDGE, {
    base: 272,
    bottom: H,
    width: W,
    fill: t.far,
    rim: t.farRim,
  })
  // Glazing bars and the sheen on each pane of glass.
  for (let i = 1; i < PANE_X.length - 1; i++) {
    const x = PANE_X[i]!
    k.fillStyle = t.frame
    k.fillRect(x - 1, TOP, 3, 280 - TOP)
    k.fillStyle = rgba(RAMPS.steel[4], 0.14)
    k.fillRect(x - 1, TOP, 1, 280 - TOP)
  }
  for (let j = 1; j < PANE_Y.length - 1; j++) {
    const y = PANE_Y[j]!
    k.fillStyle = t.frame
    k.fillRect(LEFT, y - 1, RIGHT - LEFT, 3)
    k.fillStyle = rgba(RAMPS.steel[4], 0.14)
    k.fillRect(LEFT, y - 1, RIGHT - LEFT, 1)
  }
  k.fillStyle = rgba('#ffffff', 0.06)
  for (let i = 0; i < PANE_X.length - 1; i++) {
    for (let j = 0; j < PANE_Y.length - 1; j++) {
      const px = PANE_X[i]! + 8
      const py = PANE_Y[j]! + 26
      for (let s = 0; s < 18; s++) {
        k.fillRect(px + s, py - s, 3, 1)
        if (s < 10) k.fillRect(px + s + 8, py - s, 1, 1)
      }
    }
  }
  // The hedge, flecked with lit leaves.
  drawRidge(k, NEAR_RIDGE, {
    base: 298,
    bottom: H,
    width: W,
    step: 3,
    fill: t.near,
    rim: t.nearRim,
  })
  k.fillStyle = t.nearRim
  for (const f of HEDGE_FLECKS) k.fillRect(f.x, f.y, 2, 1)
  // The soil bed, furrowed, with sprouts and a few early blooms.
  bandedGradient(
    k,
    0,
    SOIL_TOP,
    W,
    H - SOIL_TOP,
    [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
    3,
  )
  k.fillStyle = RAMPS.earth[3]
  k.fillRect(0, SOIL_TOP, W, 1)
  for (let x = 4; x < W; x += 8) {
    k.fillStyle = RAMPS.earth[0]
    k.fillRect(x, SOIL_TOP + 5 + ((x >> 3) % 2) * 5, 4, 1)
    k.fillStyle = RAMPS.earth[3]
    k.fillRect(x + 1, SOIL_TOP + 4 + ((x >> 3) % 2) * 5, 2, 1)
  }
  for (let i = 0, x = 18; x < W - 12; i++, x += 19) {
    const sprite =
      i % 3 === 1
        ? FLOWER_SPRITES[FLOWER_COLORS[i % FLOWER_COLORS.length]!]![2]!
        : SPROUT_SPRITE
    drawSprite(k, sprite, x, SOIL_TOP + 2, { anchor: 'feet' })
  }
  // Trellis posts with climbing ivy, and the roof beam with ivy hanging from it.
  for (const x of [1, RIGHT + 1]) {
    bevel(k, x, TOP - 3, LEFT - 2, H, RAMPS.earth, { depth: 1 })
    k.fillStyle = RAMPS.earth[0]
    for (let y = TOP + 4; y < H; y += 10) k.fillRect(x, y, LEFT - 2, 1)
  }
  for (let y = TOP + 6, i = 0; y < H - 8; y += 14, i++) {
    drawSprite(k, LEAF_SPRITE, i % 2 ? 3 : 5, y, { flipX: i % 2 === 1 })
    drawSprite(k, LEAF_SPRITE, RIGHT + (i % 2 ? 5 : 3), y + 7, {
      flipX: i % 2 === 0,
    })
  }
  bandedGradient(
    k,
    0,
    0,
    W,
    TOP - 4,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    2,
  )
  bevel(k, 0, TOP - 4, W, 3, RAMPS.earth, { depth: 1 })
  for (const x of [30, 92, 160, 222]) {
    for (let i = 0; i < 3; i++)
      drawSprite(k, LEAF_SPRITE, x + (i % 2) * 3, TOP + 1 + i * 4, {
        flipX: i % 2 === 1,
      })
  }
}

class BrickBloom implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private paddleX = W / 2
  private paddleV = 0
  private wide = 0
  private sticky = 0
  private calm = 0
  private bricks: Brick[] = []
  private balls: Ball[] = []
  private drops: Drop[] = []
  private puffs: Puff[] = []
  private flowers: Flower[] = []
  private speed = 0
  private clear = 0
  private lost = 0
  private serveTimer = SERVE_TICKS
  private extraIndex = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles on their own rng, and each ball's recent path for its trail.
  private fx = new Sparkles()
  private fxRng = backdropRng(43)
  private trails = new Map<Ball, { x: number; y: number }[]>()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startStage(1)
  }

  private get paddleW(): number {
    return this.wide > 0 ? WIDE_W : PADDLE_W
  }

  // --- stages --------------------------------------------------------------------

  private startStage(stage: number) {
    this.level = stage
    const pattern = PATTERNS[(stage - 1) % PATTERNS.length]!
    const tough = Math.round(levelCurve(stage, BLOOM_CURVES.tough))
    this.bricks = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!pattern(c, r)) continue
        // The top rows are the toughest.
        const hp = Math.max(1, tough - Math.floor(r / 3))
        this.bricks.push({
          col: c,
          row: r,
          hp,
          maxHp: hp,
          bolt: false,
          flash: 0,
        })
      }
    }
    const bolts = Math.max(0, Math.round(levelCurve(stage, BLOOM_CURVES.bolts)))
    for (let i = 0; i < bolts && this.bricks.length > 12; i++) {
      const pick = this.bricks[Math.floor(this.rng() * this.bricks.length)]!
      // Keep the top row breakable, so no wall is sealed shut.
      if (pick.row > 0) pick.bolt = true
    }
    this.puffs = []
    const puffs = Math.max(0, Math.round(levelCurve(stage, BLOOM_CURVES.puffs)))
    for (let i = 0; i < puffs; i++) {
      this.puffs.push({
        x: 40 + this.rng() * (W - 80),
        y: 160 + this.rng() * 60,
        vx: (this.rng() < 0.5 ? -1 : 1) * 0.45,
        vy: (this.rng() - 0.5) * 0.4,
        hp: 2,
      })
    }
    this.speed = levelCurve(stage, BLOOM_CURVES.speed)
    this.drops = []
    this.wide = 0
    this.sticky = 0
    this.calm = 0
    this.serve()
    this.banner = {
      text: `STAGE ${stage}`,
      sub: 'BLOOM EVERY CRATE',
      ticks: 90,
    }
  }

  private serve() {
    this.balls = [
      { x: this.paddleX, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, stuck: 0 },
    ]
    this.serveTimer = SERVE_TICKS
  }

  private brickRect(b: Brick) {
    return {
      x: LEFT + b.col * BRICK_W,
      y: BRICK_TOP + b.row * BRICK_H,
      w: BRICK_W,
      h: BRICK_H,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.startStage(this.level + 1)
      return
    }
    if (this.lost > 0) {
      if (--this.lost === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else this.serve()
      }
      return
    }
    if (this.wide > 0) this.wide--
    if (this.sticky > 0) this.sticky--
    if (this.calm > 0) this.calm--
    this.movePaddle(controls)
    this.updateBalls(controls)
    this.updateDrops()
    this.updatePuffs()
    for (const b of this.bricks) if (b.flash > 0) b.flash--
    if (!this.bricks.some((b) => !b.bolt)) this.stageClear()
  }

  private movePaddle(input: InputFrame) {
    const dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0)
    // A little momentum: quick to start, quick to stop.
    this.paddleV = dir ? this.paddleV * 0.6 + dir * 2.2 : this.paddleV * 0.4
    this.paddleV = Math.max(-5, Math.min(5, this.paddleV))
    const half = this.paddleW / 2
    this.paddleX = Math.max(
      LEFT + half,
      Math.min(RIGHT - half, this.paddleX + this.paddleV),
    )
  }

  private launch(ball: Ball) {
    // Off at an angle set by where it sits on the paddle.
    const offset = (ball.stuck ?? 0) / (this.paddleW / 2)
    const angle =
      -Math.PI / 2 + Math.max(-0.9, Math.min(0.9, offset * 1.1 + 0.25))
    ball.vx = Math.cos(angle) * this.speed
    ball.vy = Math.sin(angle) * this.speed
    ball.stuck = null
    this.sound.play('blip')
  }

  private updateBalls(input: InputFrame) {
    const calmFactor = this.calm > 0 ? 0.7 : 1
    for (const ball of this.balls) {
      if (ball.stuck !== null) {
        ball.x = this.paddleX + ball.stuck
        ball.y = PADDLE_Y - BALL_R - 1
        if (this.serveTimer > 0) this.serveTimer--
        if (
          input.pressed.a ||
          input.pressed.b ||
          (this.serveTimer === 0 && this.sticky === 0)
        )
          this.launch(ball)
        continue
      }
      // Step in small pieces so a fast ball never tunnels through a crate.
      const v = Math.hypot(ball.vx, ball.vy) * calmFactor
      const steps = Math.max(1, Math.ceil(v / 1.5))
      for (let i = 0; i < steps && ball.stuck === null; i++) {
        this.stepBall(
          ball,
          (ball.vx * calmFactor) / steps,
          (ball.vy * calmFactor) / steps,
        )
      }
      // Never let a ball settle into a near-flat bounce that loops forever.
      const s = Math.hypot(ball.vx, ball.vy)
      if (ball.stuck === null && s > 0 && Math.abs(ball.vy) < s * 0.3) {
        ball.vy = Math.sign(ball.vy || 1) * s * 0.3
        ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(s * s - ball.vy * ball.vy)
      }
    }
    const before = this.balls.length
    this.balls = this.balls.filter((b) => b.y < H + 8)
    if (before && !this.balls.length) this.loseBall()
  }

  private stepBall(ball: Ball, dx: number, dy: number) {
    ball.x += dx
    if (ball.x < LEFT + BALL_R) {
      ball.x = LEFT + BALL_R
      ball.vx = Math.abs(ball.vx)
    } else if (ball.x > RIGHT - BALL_R) {
      ball.x = RIGHT - BALL_R
      ball.vx = -Math.abs(ball.vx)
    }
    const hitX = this.hitBrick(ball)
    if (hitX) {
      ball.x -= dx
      ball.vx = -ball.vx
      this.crack(hitX)
    }
    ball.y += dy
    if (ball.y < TOP + BALL_R) {
      ball.y = TOP + BALL_R
      ball.vy = Math.abs(ball.vy)
    }
    const hitY = this.hitBrick(ball)
    if (hitY) {
      ball.y -= dy
      ball.vy = -ball.vy
      this.crack(hitY)
    }
    this.hitPaddle(ball)
    for (const puff of this.puffs) {
      if (Math.hypot(puff.x - ball.x, puff.y - ball.y) > 9) continue
      // The gloom puff knocks the ball off at a random angle, and frays.
      const a = this.rng() * Math.PI * 2
      const s = Math.hypot(ball.vx, ball.vy)
      ball.vx = Math.cos(a) * s
      ball.vy = -Math.abs(Math.sin(a) * s) - 0.4
      this.hitPuff(puff)
    }
  }

  private hitBrick(ball: Ball): Brick | undefined {
    return this.bricks.find((b) => {
      const r = this.brickRect(b)
      return (
        ball.x + BALL_R > r.x &&
        ball.x - BALL_R < r.x + r.w &&
        ball.y + BALL_R > r.y &&
        ball.y - BALL_R < r.y + r.h
      )
    })
  }

  private hitPaddle(ball: Ball) {
    if (ball.vy <= 0) return
    const half = this.paddleW / 2
    if (
      ball.y + BALL_R < PADDLE_Y ||
      ball.y - BALL_R > PADDLE_Y + PADDLE_H ||
      ball.x < this.paddleX - half - BALL_R ||
      ball.x > this.paddleX + half + BALL_R
    )
      return
    const offset = Math.max(-1, Math.min(1, (ball.x - this.paddleX) / half))
    if (this.sticky > 0) {
      ball.stuck = ball.x - this.paddleX
      ball.vx = 0
      ball.vy = 0
      this.sound.play('pickup')
      return
    }
    // Where it lands decides the angle: steep in the middle, wide at the edges.
    const max = levelCurve(this.level, BLOOM_CURVES.maxSpeed)
    const speed = Math.min(max, Math.hypot(ball.vx, ball.vy) + 0.04)
    const angle = -Math.PI / 2 + offset * 1.05
    ball.vx = Math.cos(angle) * speed + this.paddleV * 0.08
    ball.vy = Math.sin(angle) * speed
    ball.y = PADDLE_Y - BALL_R - 0.1
    this.sound.play('blip')
  }

  private crack(b: Brick) {
    b.flash = 6
    if (b.bolt) {
      this.sound.play('blip')
      return
    }
    b.hp--
    const r = this.brickRect(b)
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    if (b.hp > 0) {
      this.sound.play('blip')
      this.addScore(5, cx, cy)
      return
    }
    this.bricks = this.bricks.filter((o) => o !== b)
    const points = (ROWS - b.row) * 10 * b.maxHp
    this.addScore(points, cx, cy - 4)
    this.burst(cx, cy, 6, ROW_COLORS[b.row]!)
    const ramp = ROW_RAMPS[b.row]!
    this.fx.burst(cx, cy, this.fxRng, {
      count: 7,
      colours: [ramp[4], ramp[3], RAMPS.gold[4]],
      speed: 1.4,
    })
    // A flower blooms where the crate was and floats away.
    this.flowers.push({
      x: cx,
      y: cy,
      vy: -0.4 - this.rng() * 0.3,
      life: 70,
      color: FLOWER_COLORS[Math.floor(this.rng() * FLOWER_COLORS.length)]!,
    })
    this.sound.play('pop')
    // Speed up a touch with every crate, up to the stage's cap.
    const max = levelCurve(this.level, BLOOM_CURVES.maxSpeed)
    for (const ball of this.balls) {
      const s = Math.hypot(ball.vx, ball.vy)
      if (s > 0 && s < max) {
        ball.vx *= (s + 0.015) / s
        ball.vy *= (s + 0.015) / s
      }
    }
    if (this.rng() < levelCurve(this.level, BLOOM_CURVES.seedChance))
      this.drops.push({
        x: cx,
        y: cy,
        kind: SEEDS[Math.floor(this.rng() * SEEDS.length)]!,
      })
  }

  private updateDrops() {
    for (const d of this.drops) {
      d.y += 1.1
      const half = this.paddleW / 2
      if (
        d.y > PADDLE_Y - 4 &&
        d.y < PADDLE_Y + PADDLE_H + 4 &&
        Math.abs(d.x - this.paddleX) < half + 5
      ) {
        d.y = H + 99
        this.power(d.kind)
      }
    }
    this.drops = this.drops.filter((d) => d.y < H + 10)
  }

  private power(kind: Seed) {
    this.addScore(50, this.paddleX, PADDLE_Y - 12)
    this.sound.play('pickup')
    this.fx.burst(this.paddleX, PADDLE_Y - 2, this.fxRng, {
      count: 10,
      colours: [SEED_RAMPS[kind][4], SEED_RAMPS[kind][3], RAMPS.gold[4]],
    })
    const label: Record<Seed, string> = {
      W: 'WIDE!',
      S: 'STICKY!',
      M: 'MULTI!',
      C: 'CALM!',
      '+': 'SPARE PADDLE!',
    }
    this.floaters.push({
      x: this.paddleX,
      y: PADDLE_Y - 22,
      text: label[kind],
      life: 50,
    })
    if (kind === 'W') this.wide = POWER_TICKS
    if (kind === 'S') this.sticky = POWER_TICKS
    if (kind === 'C') this.calm = POWER_TICKS
    if (kind === '+') {
      this.lives++
      this.sound.play('extra')
    }
    if (kind === 'M') {
      const free = this.balls.find((b) => b.stuck === null) ?? this.balls[0]
      if (!free) return
      if (free.stuck !== null) this.launch(free)
      const s = Math.hypot(free.vx, free.vy) || this.speed
      for (const turn of [-0.5, 0.5]) {
        if (this.balls.length >= MAX_BALLS) break
        const a = Math.atan2(free.vy, free.vx) + turn
        this.balls.push({
          x: free.x,
          y: free.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          stuck: null,
        })
      }
    }
  }

  private updatePuffs() {
    for (const p of this.puffs) {
      p.x += p.vx
      p.y += p.vy + Math.sin(this.tick / 30 + p.x) * 0.15
      if (p.x < LEFT + 10 || p.x > RIGHT - 10) p.vx = -p.vx
      if (p.y < 130 || p.y > 250) p.vy = -p.vy
      p.x = Math.max(LEFT + 10, Math.min(RIGHT - 10, p.x))
      p.y = Math.max(130, Math.min(250, p.y))
    }
  }

  private hitPuff(puff: Puff) {
    puff.hp--
    this.sound.play('warn')
    if (puff.hp > 0) return
    this.puffs = this.puffs.filter((p) => p !== puff)
    this.addScore(100 * this.level, puff.x, puff.y - 8)
    this.burst(puff.x, puff.y, 12, '#c4b5fd')
    this.fx.burst(puff.x, puff.y, this.fxRng, { count: 14, speed: 2 })
    this.sound.play('pop')
  }

  private loseBall() {
    this.lives--
    this.lost = LOST_TICKS
    this.wide = 0
    this.sticky = 0
    this.calm = 0
    this.drops = []
    this.burst(this.paddleX, PADDLE_Y, 12, '#f9a8d4')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text: 'BALL LOST', ticks: LOST_TICKS }
  }

  private stageClear() {
    const bonus = 1000 * this.level
    this.addScore(bonus, W / 2, 180)
    this.balls = []
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STAGE IN BLOOM!',
      sub: `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 50)
      this.floaters.push({ x, y, text: String(points), life: 36 })
    if (
      this.extraIndex < EXTRA_AT.length &&
      this.score >= EXTRA_AT[this.extraIndex]!
    ) {
      this.extraIndex++
      this.lives++
      this.banner = { text: 'SPARE PADDLE!', ticks: 80 }
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
    this.fx.update()
    // A stage in bloom keeps sparkling until the next one starts.
    if (this.clear > 0 && this.tick % 8 === 0)
      this.fx.burst(
        LEFT + 16 + this.fxRng() * (RIGHT - LEFT - 32),
        BRICK_TOP + this.fxRng() * ROWS * BRICK_H,
        this.fxRng,
        { count: 6 },
      )
    for (const ball of this.balls) {
      if (ball.stuck !== null) {
        this.trails.delete(ball)
        continue
      }
      const trail = this.trails.get(ball) ?? []
      trail.push({ x: ball.x, y: ball.y })
      if (trail.length > 6) trail.shift()
      this.trails.set(ball, trail)
    }
    for (const ball of this.trails.keys())
      if (!this.balls.includes(ball)) this.trails.delete(ball)
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.flowers) {
      f.y += f.vy
      f.life--
    }
    this.flowers = this.flowers.filter((f) => f.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Where a falling ball will cross the paddle line, bouncing off the side walls. */
  private landingX(ball: Ball): number {
    if (ball.vy <= 0) return ball.x
    const t = (PADDLE_Y - BALL_R - ball.y) / ball.vy
    let x = ball.x + ball.vx * t
    const span = RIGHT - LEFT - BALL_R * 2
    x -= LEFT + BALL_R
    x = ((x % (2 * span)) + 2 * span) % (2 * span)
    if (x > span) x = 2 * span - x
    return x + LEFT + BALL_R
  }

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
    // Follow the lowest falling ball (or a seed worth catching when all's calm).
    const falling = this.balls
      .filter((b) => b.stuck === null && b.vy > 0)
      .sort((a, b) => b.y - a.y)[0]
    let aim = this.paddleX
    if (falling) {
      // Meet it a little off-centre, toward the crates' side, to send it there.
      const bricksLeft = this.bricks.filter((b) => !b.bolt)
      const meanCol = bricksLeft.length
        ? bricksLeft.reduce((s, b) => s + b.col, 0) / bricksLeft.length
        : COLS / 2
      const towards = Math.sign(LEFT + (meanCol + 0.5) * BRICK_W - this.paddleX)
      aim = this.landingX(falling) - towards * this.paddleW * 0.2
    } else if (this.drops.length) {
      aim = this.drops[0]!.x
    } else if (this.balls[0]?.stuck !== null && this.tick % 40 === 0) {
      frame.pressed.a = true
    }
    if (aim < this.paddleX - 3) held.left = true
    if (aim > this.paddleX + 3) held.right = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGarden(g)
    this.renderWall(g)
    for (const f of this.flowers) this.renderFlower(g, f)
    for (const p of this.puffs) this.renderPuff(g, p)
    for (const d of this.drops) this.renderDrop(g, d)
    this.renderPaddle(g)
    for (const ball of this.balls) this.renderBall(g, ball)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 26)
      const x = Math.round(p.x) - 1
      const y = Math.round(p.y) - 1
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 4, 4)
      g.fillStyle = p.color
      g.fillRect(x, y, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x, y, 1, 1)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    const theme = (this.level - 1) % THEMES.length
    cachedLayer(g, `brick-bloom-garden-${theme}`, W, H, (k) =>
      paintGarden(k, THEMES[theme]!),
    )
    // Fireflies drifting over the hedge.
    for (const f of FIREFLIES) {
      const t = (this.tick / 60) * f.speed + f.phase
      const x = Math.round(f.x + Math.sin(t) * 18)
      const y = Math.round(f.y + Math.cos(t * 1.3) * 10)
      const lit = 0.5 + 0.5 * Math.sin(t * 3)
      glow(g, x, y, 7, RAMPS.leaf[4], 0.35 * lit)
      g.fillStyle = lit > 0.4 ? RAMPS.gold[4] : RAMPS.leaf[3]
      g.fillRect(x, y, 1, 1)
    }
  }

  private renderWall(g: CanvasRenderingContext2D) {
    // Every crate casts a shadow onto the glass behind it.
    g.fillStyle = rgba(INK, 0.4)
    for (const b of this.bricks) {
      const r = this.brickRect(b)
      g.fillRect(Math.round(r.x) + 3, r.y + 4, CRATE_W, CRATE_H)
    }
    for (const b of this.bricks) this.renderBrick(g, b)
  }

  private renderBrick(g: CanvasRenderingContext2D, b: Brick) {
    const r = this.brickRect(b)
    const x = Math.round(r.x) + 1
    const y = r.y + 1
    const sprite = b.flash
      ? FLASH_SPRITE
      : b.bolt
        ? BOLT_SPRITE
        : CRATE_SPRITES[b.row]!
    drawSprite(g, sprite, x - 1, y - 1, { anchor: 'topleft' })
    if (b.bolt || b.flash) return
    // Cracks as it weakens, and gold studs for the hits it has left.
    const w = CRATE_W
    if (b.hp < b.maxHp) {
      g.fillStyle = INK
      g.fillRect(x + 3, y + 2, 3, 1)
      g.fillRect(x + 5, y + 3, 1, 2)
      g.fillRect(x + 6, y + 5, 2, 1)
      if (b.maxHp - b.hp >= 2) {
        g.fillRect(x + w - 6, y + 3, 2, 1)
        g.fillRect(x + w - 7, y + 4, 1, 2)
      }
    }
    if (b.maxHp > 1) {
      for (let i = 0; i < b.hp; i++) {
        const px = x + w - 4 - i * 3
        g.fillStyle = RAMPS.gold[0]
        g.fillRect(px + 1, y + 3, 2, 2)
        g.fillStyle = RAMPS.gold[3]
        g.fillRect(px, y + 2, 2, 2)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(px, y + 2, 1, 1)
      }
    }
  }

  private renderFlower(g: CanvasRenderingContext2D, f: Flower) {
    const frames = FLOWER_SPRITES[f.color]
    if (!frames) return
    const stage = f.life > 60 ? 0 : f.life > 50 ? 1 : 2
    const alpha = Math.min(1, f.life / 30)
    const x = f.x + Math.round(Math.sin((f.life + f.x) / 9))
    if (stage === 2) glow(g, x, f.y, 9, f.color, 0.3 * alpha)
    drawSprite(g, frames[stage]!, x, f.y, { alpha })
  }

  private renderPuff(g: CanvasRenderingContext2D, p: Puff) {
    const ramp = p.hp > 1 ? GLOOM : GLOOM_FRAYED
    const wob = Math.sin(this.tick / 8 + p.x * 0.1) * 0.6
    const lobes: [number, number, number][] = [
      [-4, 0, 5 + wob],
      [4, 0, 5 - wob],
      [0, -3, 6],
    ]
    // A gloomy shade around it, then lobes shaded from ink up toward the light.
    g.fillStyle = rgba(INK, 0.22)
    g.beginPath()
    g.ellipse(p.x, p.y, 15, 12, 0, 0, Math.PI * 2)
    g.fill()
    const passes: [string, number, number, number][] = [
      [INK, 0, 0, 1],
      [ramp[1], 0, 0, 0],
      [ramp[2], -0.8, -1, -1.2],
      [ramp[3], -1.8, -2.2, -3],
    ]
    for (const [colour, dx, dy, dr] of passes) {
      g.fillStyle = colour
      g.beginPath()
      for (const [lx, ly, lr] of lobes) {
        g.moveTo(p.x + lx + dx + lr + dr, p.y + ly + dy)
        g.arc(
          p.x + lx + dx,
          p.y + ly + dy,
          Math.max(1, lr + dr),
          0,
          Math.PI * 2,
        )
      }
      g.fill()
    }
    // A grumpy face: scowling brows, shiny eyes, a frown.
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    g.fillStyle = INK
    g.fillRect(x - 5, y - 6, 2, 1)
    g.fillRect(x - 3, y - 5, 2, 1)
    g.fillRect(x + 1, y - 5, 2, 1)
    g.fillRect(x + 3, y - 6, 2, 1)
    g.fillRect(x - 4, y - 4, 3, 3)
    g.fillRect(x + 1, y - 4, 3, 3)
    g.fillRect(x - 2, y + 1, 4, 1)
    g.fillRect(x - 3, y + 2, 1, 1)
    g.fillRect(x + 2, y + 2, 1, 1)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(x - 3, y - 3, 1, 1)
    g.fillRect(x + 2, y - 3, 1, 1)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 4, y - 4, 1, 1)
    g.fillRect(x + 1, y - 4, 1, 1)
  }

  private renderDrop(g: CanvasRenderingContext2D, d: Drop) {
    glow(g, d.x, d.y, 11, SEED_COLORS[d.kind], 0.4)
    const frame = Math.floor((this.tick + d.x) / 8) % 2
    drawSprite(g, CAPSULE_SPRITES[d.kind][frame]!, d.x, d.y)
    drawText(g, d.kind, d.x + 1, d.y - 3, { align: 'center', color: INK })
  }

  private renderPaddle(g: CanvasRenderingContext2D) {
    if (this.lost > 0 && Math.floor(this.tick / 6) % 2) return
    const w = this.paddleW
    const x = Math.round(this.paddleX - w / 2)
    dropShadow(g, this.paddleX, SOIL_TOP + 3, w / 2, 2.5, 0.4)
    // Hover jets under each bumper cap.
    const jet = 2 + (Math.floor(this.tick / 3) % 2)
    for (const jx of [x + 1, x + w - 3]) {
      glow(g, jx + 1, PADDLE_Y + PADDLE_H + 2, 6, RAMPS.ember[3], 0.45)
      g.fillStyle = RAMPS.ember[2]
      g.fillRect(jx, PADDLE_Y + PADDLE_H, 2, jet + 1)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(jx, PADDLE_Y + PADDLE_H, 2, jet - 1)
    }
    const set = w === WIDE_W ? PADDLE_SPRITES.wide : PADDLE_SPRITES.normal
    const frames = this.sticky > 0 ? set.leaf : set.sky
    const blink = this.tick % 150 < 7 ? 1 : 0
    drawSprite(g, frames[blink], x - 1, PADDLE_Y - 1, { anchor: 'topleft' })
    if (this.sticky > 0)
      glow(g, this.paddleX, PADDLE_Y, w / 2, RAMPS.leaf[3], 0.2)
  }

  private renderBall(g: CanvasRenderingContext2D, ball: Ball) {
    const colour = this.calm > 0 ? SEED_COLORS.C : RAMPS.gold[3]
    const trail = this.trails.get(ball)
    if (trail) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      trail.forEach((p, i) => {
        const t = (i + 1) / (trail.length + 1)
        const s = 1 + Math.round(t * 2)
        g.globalAlpha = t * 0.7
        g.fillStyle = mix(RAMPS.pink[2], colour, t)
        g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s)
      })
      g.restore()
    }
    glow(g, ball.x, ball.y, 10, colour, 0.5)
    const frame = Math.floor(this.tick / 5) % 2
    drawSprite(g, BALL_SPRITES[frame]!, ball.x, ball.y)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 3, 2, 78, 18)
    drawText(g, String(this.score).padStart(6, '0'), 8, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    hudPanel(g, W - 66, 2, 63, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 7, 3, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `STAGE ${this.level}`, W - 7, 11, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    // Spare paddles, then the seeds still working and how long each has left.
    const spares = Math.max(0, Math.min(this.lives - 1, 5))
    const powers: [Seed, number][] = []
    if (this.wide > 0) powers.push(['W', this.wide])
    if (this.sticky > 0) powers.push(['S', this.sticky])
    if (this.calm > 0) powers.push(['C', this.calm])
    if (spares || powers.length) {
      hudPanel(g, 86, 2, 100, 18)
      for (let i = 0; i < spares; i++)
        drawSprite(g, LIFE_SPRITE, 91 + i * 13, 4, { anchor: 'topleft' })
      powers.forEach(([kind, left], i) => {
        const px = 91 + i * 31
        drawText(g, kind, px, 12, {
          color: SEED_RAMPS[kind][3],
          outline: INK,
        })
        gauge(g, px + 8, 14, 18, 3, left / POWER_TICKS, SEED_RAMPS[kind])
      })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 200, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 220, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const brickBloom: ArcadeGameModule = {
  create: (options) => new BrickBloom(options),
}

export const create = brickBloom.create
export default brickBloom

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
//
// Depth pass, slice 1 (conductor kr-arcade/t-078, "The Glasshouse Grand Tour"): walls are authored
// data (utils/arcade/brickBloom/walls.ts); cracked crates send flowers down to plant the Bloom Bed,
// and a plot in full bloom bounces a missed ball back once. The Pollen Chain multiplies crates
// cracked between paddle touches, Last-Crate Rush sends Bumble in for the last four, B right after
// a paddle hit while moving is the Leaf Curl, the ball glows hotter as it speeds up, the roof glass
// chimes for a double, and sprout, hinge and puffball crates plus the R, T and Q seeds join in.
// The rules' numbers live in utils/arcade/brickBloom/rules.ts.

import { levelCurve } from '../curve'
import {
  BALL_R,
  BUMBLE_TAP_TICKS,
  CHIME_MULT,
  COMPASS_TICKS,
  CURL_TICKS,
  CURL_TURN,
  CURL_WINDOW,
  FULL_BLOOM,
  HEAT_COLORS,
  LEFT,
  PLOTS,
  RAIN_EVERY,
  RAIN_TICKS,
  RIGHT,
  THORN_TICKS,
  TOP,
  W,
  ballHeat,
  bedSave,
  cashIn,
  chainColor,
  chainMultiplier,
  coolSpeed,
  curlDirection,
  newBed,
  plantPetal,
  plotCenter,
  predictPath,
  rotate,
  rushActive,
  rushBonus,
  steerToward,
} from '../brickBloom/rules'
import type { Bed } from '../brickBloom/rules'
import {
  miteGone,
  miteHit,
  mitesHatch,
  popMite,
  spawnMiteLine,
  stepMite,
} from '../brickBloom/mites'
import type { Mite, MiteLine } from '../brickBloom/mites'
import {
  crackSnail,
  snailHit,
  snailsPatrol,
  spawnSnail,
  stepSnail,
} from '../brickBloom/snails'
import type { Snail } from '../brickBloom/snails'
import {
  HOUSES,
  HOUSE_LEGEND,
  TOUR_START,
  houseWall,
  nextTourPos,
  ventSide,
} from '../brickBloom/houses'
import type { TourPos } from '../brickBloom/houses'
import { COLS, ROWS, parseWall, wallFor } from '../brickBloom/walls'
import type { CrateKind } from '../brickBloom/walls'
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

const H = 320
const PADDLE_Y = 296
const PADDLE_H = 6
const PADDLE_W = 36
const WIDE_W = 56
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
/** Where a missed ball meets the Bloom Bed, and where the bed's flowers stand. */
const BED_SAVE_Y = 306
const BED_FEET = H - 1
/** Hinge crates swing shut for the first HINGE_SHUT ticks of every HINGE_PERIOD. */
const HINGE_PERIOD = 150
const HINGE_SHUT = 100
const PETAL_SPEED = 1.3
const DROPLET_SPEED = 4

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

type Seed = 'W' | 'S' | 'M' | 'C' | '+' | 'R' | 'T' | 'Q'
const SEEDS: Seed[] = ['W', 'W', 'S', 'M', 'M', 'C', 'C', '+', 'R', 'T', 'Q']
const SEED_COLORS: Record<Seed, string> = {
  W: '#38bdf8',
  S: '#4ade80',
  M: '#f472b6',
  C: '#c4b5fd',
  '+': '#fde047',
  R: '#67e8f9',
  T: '#fb7185',
  Q: '#e879f9',
}

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  /** Bolted crates never break and don't count toward clearing. */
  bolt: boolean
  kind: CrateKind
  /** A hinge crate swings open on a beat and the ball passes through. */
  open: boolean
  flash: number
}
type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  /** Riding the paddle (serve or sticky catch), at this offset. */
  stuck: number | null
  /** Ticks of Leaf Curl left, and which way it bends. */
  curl: number
  curlDir: number
  /** Ticks since the paddle last hit it, and the paddle's direction then (the curl window). */
  since: number
  hitDir: number
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
/** A cracked crate's flower, falling to plant itself in the Bloom Bed. */
type Petal = { x: number; y: number; color: string }
type Droplet = { x: number; y: number }
type Bumble = { x: number; y: number; angle: number; tap: number }
type Floater = { x: number; y: number; text: string; life: number }

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
const SPROUT_CRATE = crateSprite(RAMPS.leaf, 'crate')
const HINGE_CRATE = crateSprite(RAMPS.earth, 'crate')
const PUFF_CRATE = crateSprite(RAMPS.pink, 'crate')
const ROOT_CRATE = crateSprite(RAMPS.rust, 'crate')
const VINE_CRATE = crateSprite(RAMPS.leaf, 'crate')
const TRELLIS_CRATE = crateSprite(RAMPS.cream, 'crate')

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
  R: capsuleFrames('R'),
  T: capsuleFrames('T'),
  Q: capsuleFrames('Q'),
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
  // The soil bed, furrowed; the live Bloom Bed is drawn over it.
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
  /** Seconds of the new seeds still working: Rain Spray, Thorn Ball, Queen's Compass. */
  private rain = 0
  private thorn = 0
  private compass = 0
  private bed: Bed = newBed()
  private petals: Petal[] = []
  private droplets: Droplet[] = []
  private bumble: Bumble | null = null
  /** Crates cracked since the paddle last touched a ball: the Pollen Chain. */
  private chain = 0
  private bestChain = 0
  /** The roof glass rang since the last crate: the next one pays double. */
  private chime = false
  private rushTicks = 0
  private bricks: Brick[] = []
  private balls: Ball[] = []
  private drops: Drop[] = []
  private puffs: Puff[] = []
  /** The Seedling House's pollen mites: a line of three swaying down from the roof vents. */
  private miteLine: MiteLine | null = null
  /** Vine Hall's snail bot: patrols a lane under the crates; its shell bounces the ball. */
  private snail: Snail | null = null
  private flowers: Flower[] = []
  private speed = 0
  /** The Grand Tour's place (Seedling House, Vine Hall), or null once the tour is over. */
  private tour: TourPos | null = TOUR_START
  /** Stages the tour took, so the classic walls start from their first after it. */
  private tourStages = 0
  /** Where the last crate cracked: that side of the screen picks the vent. */
  private lastCrackX = W / 2
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
    const tough = Math.round(levelCurve(stage, BLOOM_CURVES.tough))
    this.bricks = []
    const house = this.tour ? HOUSES[this.tour.house] : undefined
    const vented =
      house && this.tour ? houseWall(house, this.tour.wall) : undefined
    const wall = vented ?? wallFor(stage - this.tourStages)
    for (const cell of parseWall(wall, vented ? HOUSE_LEGEND : undefined)) {
      // The top rows are the toughest; special crates take one hit and let the wall's shape play.
      const plain = cell.kind === 'crate' || cell.kind === 'bolt'
      let hp = plain ? Math.max(1, tough - Math.floor(cell.row / 3)) : 1
      if (cell.kind === 'root') hp = 2
      this.bricks.push({
        col: cell.col,
        row: cell.row,
        hp,
        maxHp: hp,
        bolt: cell.kind === 'bolt',
        kind: cell.kind,
        open: false,
        flash: 0,
      })
    }
    // Glasshouse walls are authored: no random bolts on top of them.
    const bolts = vented
      ? 0
      : Math.max(0, Math.round(levelCurve(stage, BLOOM_CURVES.bolts)))
    for (let i = 0; i < bolts && this.bricks.length > 12; i++) {
      const pick = this.bricks[Math.floor(this.rng() * this.bricks.length)]!
      // Keep the top row breakable, so no wall is sealed shut.
      if (pick.row > 0 && pick.kind === 'crate') {
        pick.bolt = true
        pick.kind = 'bolt'
      }
    }
    this.miteLine =
      vented && this.tour && mitesHatch(this.tour.house, vented.id)
        ? spawnMiteLine(W / 2 + (this.rng() - 0.5) * 80)
        : null
    this.snail =
      vented && this.tour && snailsPatrol(this.tour.house, vented.id)
        ? spawnSnail(this.rng() < 0.5)
        : null
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
    this.rain = 0
    this.thorn = 0
    this.compass = 0
    this.droplets = []
    this.petals = []
    this.bumble = null
    this.chain = 0
    this.chime = false
    this.rushTicks = 0
    this.serve()
    this.banner = vented
      ? { text: vented.name.toUpperCase(), sub: house!.name, ticks: 90 }
      : { text: `STAGE ${stage}`, sub: 'BLOOM EVERY CRATE', ticks: 90 }
  }

  private serve() {
    this.balls = [this.newBall(this.paddleX, PADDLE_Y - BALL_R - 1, 0, 0, 0)]
    this.serveTimer = SERVE_TICKS
  }

  private newBall(
    x: number,
    y: number,
    vx: number,
    vy: number,
    stuck: number | null,
  ): Ball {
    return { x, y, vx, vy, stuck, curl: 0, curlDir: 0, since: 999, hitDir: 0 }
  }

  private get breakable(): Brick[] {
    return this.bricks.filter((b) => !b.bolt)
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
      if (--this.clear === 0) {
        if (this.tour) {
          this.tour = nextTourPos(this.tour, ventSide(this.lastCrackX, W))
          // Past the last house the classic walls begin again from their first.
          if (!this.tour) this.tourStages = this.level
        }
        this.startStage(this.level + 1)
      }
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
    if (this.rain > 0) this.rain--
    if (this.thorn > 0) this.thorn--
    if (this.compass > 0) this.compass--
    this.movePaddle(controls)
    this.updateHinges()
    this.updateBalls(controls)
    this.updateDrops()
    this.updatePetals()
    this.updateRain()
    this.updateRush()
    this.updatePuffs()
    this.updateMites()
    if (this.snail) stepSnail(this.snail)
    for (const b of this.bricks) if (b.flash > 0) b.flash--
    if (!this.bricks.some((b) => !b.bolt)) this.stageClear()
  }

  /** Hinge crates swing on a beat; one stays open while a ball is inside it, so none traps a ball. */
  private updateHinges() {
    const shut = this.tick % HINGE_PERIOD < HINGE_SHUT
    for (const b of this.bricks) {
      if (b.kind !== 'hinge') continue
      const r = this.brickRect(b)
      const occupied = this.balls.some(
        (ball) =>
          ball.x + BALL_R > r.x - 1 &&
          ball.x - BALL_R < r.x + r.w + 1 &&
          ball.y + BALL_R > r.y - 1 &&
          ball.y - BALL_R < r.y + r.h + 1,
      )
      b.open = !shut || (b.open && occupied)
    }
  }

  /** Cracked crates' flowers fall into the Bloom Bed and plant where they land. */
  private updatePetals() {
    for (const p of this.petals) {
      p.y += PETAL_SPEED
      if (p.y < BED_SAVE_Y) continue
      const { plot, bloomed } = plantPetal(this.bed, p.x)
      this.addScore(10, plotCenter(plot), BED_SAVE_Y - 10)
      if (bloomed) {
        this.floaters.push({
          x: plotCenter(plot),
          y: BED_SAVE_Y - 16,
          text: 'IN BLOOM!',
          life: 44,
        })
        this.fx.burst(plotCenter(plot), BED_SAVE_Y, this.fxRng, {
          count: 8,
          colours: [RAMPS.leaf[4], RAMPS.gold[4], p.color],
        })
        this.sound.play('pickup')
      }
      p.y = H + 99
    }
    this.petals = this.petals.filter((p) => p.y < H + 10)
  }

  /** Rain Spray: droplets leave the paddle and chip the first crate they meet. */
  private updateRain() {
    if (this.rain > 0 && this.rain % RAIN_EVERY === 0)
      this.droplets.push({ x: this.paddleX, y: PADDLE_Y - 3 })
    for (const d of this.droplets) {
      d.y -= DROPLET_SPEED
      const hit = this.bricks.find((b) => {
        if (b.kind === 'hinge' && b.open) return false
        const r = this.brickRect(b)
        return d.x >= r.x && d.x <= r.x + r.w && d.y <= r.y + r.h && d.y >= r.y
      })
      if (hit) {
        d.y = -99
        this.crack(hit)
      }
    }
    this.droplets = this.droplets.filter((d) => d.y > TOP)
  }

  /** Last-Crate Rush: with four or fewer crates left, Bumble the bee loops in and taps the nearest. */
  private updateRush() {
    const left = this.breakable
    if (!rushActive(left.length)) {
      this.bumble = null
      return
    }
    this.rushTicks++
    const near = (x: number, y: number) =>
      [...left].sort((a, b) => {
        const ra = this.brickRect(a)
        const rb = this.brickRect(b)
        return (
          Math.hypot(ra.x + ra.w / 2 - x, ra.y + ra.h / 2 - y) -
          Math.hypot(rb.x + rb.w / 2 - x, rb.y + rb.h / 2 - y)
        )
      })[0]!
    if (!this.bumble) {
      this.bumble = {
        x: this.paddleX,
        y: PADDLE_Y - 40,
        angle: 0,
        tap: Math.floor(BUMBLE_TAP_TICKS / 2),
      }
      this.floaters.push({ x: W / 2, y: 170, text: 'LAST CRATES!', life: 60 })
    }
    const bee = this.bumble
    const target = near(bee.x, bee.y)
    const r = this.brickRect(target)
    bee.angle += 0.14
    const gx = r.x + r.w / 2 + Math.cos(bee.angle) * 15
    const gy = r.y + r.h / 2 + Math.sin(bee.angle * 1.3) * 9
    bee.x += (gx - bee.x) * 0.12
    bee.y += (gy - bee.y) * 0.12
    if (--bee.tap <= 0) {
      bee.tap = BUMBLE_TAP_TICKS
      this.floaters.push({
        x: r.x + r.w / 2,
        y: r.y - 4,
        text: 'BZZT',
        life: 24,
      })
      this.crack(target)
    }
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
      ball.since++
      // Leaf Curl: B just after a paddle hit, while the paddle was moving, bends the ball.
      if (
        input.pressed.b &&
        ball.curl === 0 &&
        ball.hitDir !== 0 &&
        ball.since <= CURL_WINDOW
      ) {
        ball.curl = CURL_TICKS
        ball.curlDir = ball.hitDir
        this.floaters.push({ x: ball.x, y: ball.y - 8, text: 'CURL', life: 24 })
        this.sound.play('blip')
      }
      if (ball.curl > 0) {
        ball.curl--
        const bent = rotate(ball.vx, ball.vy, ball.curlDir * CURL_TURN)
        ball.vx = bent.vx
        ball.vy = bent.vy
      }
      // Last-Crate Rush: a gentle 10% steer toward the nearest crate that is left.
      if (this.bumble) {
        const near = this.breakable
          .map((b) => this.brickRect(b))
          .sort(
            (a, b) =>
              Math.hypot(a.x + a.w / 2 - ball.x, a.y + a.h / 2 - ball.y) -
              Math.hypot(b.x + b.w / 2 - ball.x, b.y + b.h / 2 - ball.y),
          )[0]
        if (near) {
          const steered = steerToward(
            ball.vx,
            ball.vy,
            near.x + near.w / 2 - ball.x,
            near.y + near.h / 2 - ball.y,
          )
          ball.vx = steered.vx
          ball.vy = steered.vy
        }
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
      // A plot in full bloom bounces a missed ball back up once, and cools it a step.
      if (ball.stuck === null && ball.vy > 0 && ball.y >= BED_SAVE_Y) {
        const plot = bedSave(this.bed, ball.x)
        if (plot !== null) {
          const speed = Math.hypot(ball.vx, ball.vy)
          const cooled = coolSpeed(speed)
          ball.vx *= cooled / speed
          ball.vy = -Math.abs(ball.vy * (cooled / speed))
          ball.y = BED_SAVE_Y - 1
          this.floaters.push({
            x: plotCenter(plot),
            y: BED_SAVE_Y - 16,
            text: 'BLOOM SAVE!',
            life: 50,
          })
          this.fx.burst(plotCenter(plot), BED_SAVE_Y, this.fxRng, {
            count: 12,
            colours: [RAMPS.leaf[4], RAMPS.gold[4], '#f9a8d4'],
          })
          this.sound.play('extra')
        }
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
      if (this.thorn > 0 && !hitX.bolt) this.pierce(hitX)
      else {
        ball.x -= dx
        ball.vx = -ball.vx
        if (hitX.kind !== 'trellis') this.crack(hitX)
      }
    }
    ball.y += dy
    if (ball.y < TOP + BALL_R) {
      ball.y = TOP + BALL_R
      ball.vy = Math.abs(ball.vy)
      this.ringRoof(ball)
    }
    const hitY = this.hitBrick(ball)
    if (hitY) {
      if (this.thorn > 0 && !hitY.bolt) this.pierce(hitY)
      else {
        ball.y -= dy
        ball.vy = -ball.vy
        // A trellis only breaks from below; the ball skips off its top and sides.
        if (hitY.kind !== 'trellis' || dy < 0) this.crack(hitY)
      }
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
    const line = this.miteLine
    if (line) {
      for (const mite of [...line.mites]) {
        if (miteHit(mite, ball.x, ball.y)) this.popPollenMite(line, mite)
      }
    }
    const snail = this.snail
    if (snail && snail.flash === 0 && snailHit(snail, ball.x, ball.y)) {
      // The shell turns the ball back up the wall.
      ball.vy = -Math.abs(ball.vy)
      ball.y = Math.min(ball.y, snail.y - 8)
      const score = crackSnail(snail, this.level)
      this.sound.play('pop')
      if (score > 0) {
        this.addScore(score, snail.x, snail.y - 10)
        this.burst(snail.x, snail.y, 10, '#86efac')
        this.snail = null
      }
    }
  }

  private updateMites() {
    const line = this.miteLine
    if (!line) return
    for (const m of line.mites) stepMite(m, this.tick)
    line.mites = line.mites.filter((m) => !miteGone(m))
    if (line.mites.length === 0) this.miteLine = null
  }

  private popPollenMite(line: MiteLine, mite: Mite) {
    const score = popMite(line, mite, this.level)
    this.addScore(score, mite.x, mite.y - 8)
    this.burst(mite.x, mite.y, 8, '#fde047')
    this.sound.play('pop')
    if (line.popped === line.total) this.miteLine = null
  }

  private renderSnail(g: CanvasRenderingContext2D, s: Snail) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    const lit = s.flash > 0 && Math.floor(s.flash / 2) % 2 === 0
    glow(g, x, y, 10, '#86efac', 0.25)
    g.fillStyle = INK
    g.fillRect(x - 8, y - 2, 16, 8)
    g.fillRect(x - 5, y - 7, 10, 6)
    g.fillStyle = lit ? '#ffffff' : '#86efac'
    g.fillRect(x - 7, y - 1, 14, 6)
    g.fillStyle = s.hp > 1 ? '#fde68a' : '#fca5a5'
    g.fillRect(x - 4, y - 6, 8, 5)
    g.fillStyle = INK
    g.fillRect(x + s.dir * 6, y - 1, 1, 1)
    g.fillRect(x + s.dir * 7, y - 6, 1, 3)
  }

  private renderMite(g: CanvasRenderingContext2D, m: Mite) {
    const x = Math.round(m.x)
    const y = Math.round(m.y)
    const flap = Math.floor(this.tick / 6) % 2
    glow(g, x, y, 8, '#fde047', 0.3)
    g.fillStyle = INK
    g.fillRect(x - 4, y - 3, 8, 7)
    g.fillStyle = '#fde047'
    g.fillRect(x - 3, y - 2, 6, 5)
    g.fillStyle = '#fef9c3'
    g.fillRect(x - 3, y - 2, 6, 1)
    g.fillStyle = INK
    g.fillRect(x - 2, y - 1, 1, 1)
    g.fillRect(x + 1, y - 1, 1, 1)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 6, y - 4 + flap * 2, 2, 2)
    g.fillRect(x + 4, y - 4 + flap * 2, 2, 2)
  }

  /** The Thorn Ball goes straight through a crate: it breaks outright and the ball flies on. */
  private pierce(b: Brick) {
    b.hp = 1
    this.crack(b)
  }

  /** The roof glass rings, and the next crate pays double. */
  private ringRoof(ball: Ball) {
    if (this.chime) return
    this.chime = true
    this.floaters.push({ x: ball.x, y: TOP + 14, text: 'CHIME x2', life: 40 })
    this.sound.play('pickup')
  }

  private hitBrick(ball: Ball): Brick | undefined {
    return this.bricks.find((b) => {
      if (b.kind === 'hinge' && b.open) return false
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
    this.cashChain(ball)
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
    ball.since = 0
    ball.hitDir = curlDirection(this.paddleV)
    ball.curl = 0
    this.sound.play('blip')
  }

  /** Touching the paddle cashes the Pollen Chain in. */
  private cashChain(ball: Ball) {
    const bonus = cashIn(this.chain)
    if (bonus > 0) {
      this.addScore(bonus, ball.x, PADDLE_Y - 14)
      this.floaters.push({
        x: ball.x,
        y: PADDLE_Y - 24,
        text: `CHAIN x${Math.min(this.chain, 8)}`,
        life: 44,
      })
    }
    this.chain = 0
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
    if (b.hp <= 0) this.lastCrackX = cx
    // The roof chime doubles the next crate's points, chip or crack.
    const chimed = this.chime ? CHIME_MULT : 1
    this.chime = false
    if (b.hp > 0) {
      this.sound.play('blip')
      this.addScore(5 * chimed, cx, cy)
      return
    }
    // Pollen Chain: every crate cracked between paddle touches pays more than the last.
    const link = chainMultiplier(this.chain)
    this.chain++
    this.bestChain = Math.max(this.bestChain, this.chain)
    this.bricks = this.bricks.filter((o) => o !== b)
    const points = (ROWS - b.row) * 10 * b.maxHp * link * chimed
    this.addScore(points, cx, cy - 4)
    if (link > 1 && !this.demo)
      this.floaters.push({ x: cx, y: cy + 6, text: `x${link}`, life: 30 })
    this.burst(cx, cy, 6, ROW_COLORS[b.row]!)
    const ramp = ROW_RAMPS[b.row]!
    this.fx.burst(cx, cy, this.fxRng, {
      count: 7,
      colours: [ramp[4], ramp[3], RAMPS.gold[4]],
      speed: 1.4,
    })
    // A flower blooms where the crate was and floats away; a petal falls to plant the Bloom Bed.
    const color = FLOWER_COLORS[Math.floor(this.rng() * FLOWER_COLORS.length)]!
    this.flowers.push({
      x: cx,
      y: cy,
      vy: -0.4 - this.rng() * 0.3,
      life: 70,
      color,
    })
    this.petals.push({ x: cx, y: cy, color })
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
    // A sprout crate always drops a seed; the rest drop one by chance.
    if (
      b.kind === 'sprout' ||
      this.rng() < levelCurve(this.level, BLOOM_CURVES.seedChance)
    )
      this.drops.push({
        x: cx,
        y: cy,
        kind: SEEDS[Math.floor(this.rng() * SEEDS.length)]!,
      })
    // A cracked vine pulls its side neighbours down a row (never into another crate or the floor).
    if (b.kind === 'vine') {
      for (const o of this.bricks) {
        if (o.row !== b.row || Math.abs(o.col - b.col) !== 1) continue
        if (o.row + 1 >= ROWS) continue
        if (this.bricks.some((x) => x.col === o.col && x.row === o.row + 1))
          continue
        o.row++
      }
    }
    // A puffball bursts: it cracks all eight neighbours, so chains can run.
    if (b.kind === 'puffball') {
      this.fx.burst(cx, cy, this.fxRng, { count: 12, speed: 2 })
      for (const o of this.bricks.slice()) {
        if (o.bolt || !this.bricks.includes(o)) continue
        if (Math.abs(o.col - b.col) <= 1 && Math.abs(o.row - b.row) <= 1)
          this.crack(o)
      }
    }
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
      R: 'RAIN SPRAY!',
      T: 'THORN BALL!',
      Q: "QUEEN'S COMPASS!",
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
    if (kind === 'R') this.rain = RAIN_TICKS
    if (kind === 'T') this.thorn = THORN_TICKS
    if (kind === 'Q') this.compass = COMPASS_TICKS
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
        this.balls.push(
          this.newBall(free.x, free.y, Math.cos(a) * s, Math.sin(a) * s, null),
        )
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
    this.rain = 0
    this.thorn = 0
    this.compass = 0
    this.droplets = []
    this.chain = 0
    this.chime = false
    this.drops = []
    this.burst(this.paddleX, PADDLE_Y, 12, '#f9a8d4')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text: 'BALL LOST', ticks: LOST_TICKS }
  }

  private stageClear() {
    // Cash in the chain, plant every petal still falling, and pay the Last-Crate Rush bonus.
    const rush = this.rushTicks > 0 ? rushBonus(this.rushTicks) : 0
    const bonus = 1000 * this.level + rush + cashIn(this.chain)
    this.addScore(bonus, W / 2, 180)
    for (const petal of this.petals) plantPetal(this.bed, petal.x)
    this.petals = []
    this.droplets = []
    this.bumble = null
    this.chain = 0
    this.balls = []
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STAGE IN BLOOM!',
      sub: rush > 0 ? `BONUS ${bonus} · RUSH ${rush}` : `BONUS ${bonus}`,
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
    this.renderBed(g)
    if (this.compass > 0) this.renderCompass(g)
    for (const f of this.flowers) this.renderFlower(g, f)
    for (const p of this.petals) this.renderPetal(g, p)
    for (const d of this.droplets) {
      g.fillStyle = INK
      g.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, 3, 5)
      g.fillStyle = SEED_COLORS.R
      g.fillRect(Math.round(d.x), Math.round(d.y), 1, 3)
    }
    if (this.bumble) this.renderBumble(g, this.bumble)
    for (const p of this.puffs) this.renderPuff(g, p)
    if (this.miteLine)
      for (const m of this.miteLine.mites) this.renderMite(g, m)
    if (this.snail) this.renderSnail(g, this.snail)
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
        : b.kind === 'sprout'
          ? SPROUT_CRATE
          : b.kind === 'hinge'
            ? HINGE_CRATE
            : b.kind === 'puffball'
              ? PUFF_CRATE
              : b.kind === 'root'
                ? ROOT_CRATE
                : b.kind === 'vine'
                  ? VINE_CRATE
                  : b.kind === 'trellis'
                    ? TRELLIS_CRATE
                    : CRATE_SPRITES[b.row]!
    // An open hinge crate is a ghost the ball flies through.
    drawSprite(g, sprite, x - 1, y - 1, {
      anchor: 'topleft',
      alpha: b.open ? 0.3 : 1,
    })
    if (b.kind === 'hinge') {
      g.fillStyle = INK
      for (const px of [x, x + CRATE_W - 2]) g.fillRect(px, y + 2, 2, 4)
    }
    if (b.bolt || b.flash) return
    if (b.kind === 'sprout')
      drawSprite(g, SPROUT_SPRITE, x + CRATE_W / 2, y + CRATE_H - 1, {
        anchor: 'feet',
      })
    if (b.kind === 'puffball') {
      const pulse = Math.floor(this.tick / 10) % 2
      g.fillStyle = RAMPS.pink[4]
      for (const [px, py] of [
        [x, y],
        [x + CRATE_W - 1, y],
        [x, y + CRATE_H - 1],
        [x + CRATE_W - 1, y + CRATE_H - 1],
      ] as const)
        g.fillRect(px - pulse, py - pulse, 1, 1)
    }
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
    const heat = ballHeat(Math.hypot(ball.vx, ball.vy))
    const colour =
      this.calm > 0
        ? SEED_COLORS.C
        : this.thorn > 0
          ? SEED_COLORS.T
          : HEAT_COLORS[heat]
    const trailColour = this.chain > 0 ? chainColor(this.chain) : RAMPS.pink[2]
    const trail = this.trails.get(ball)
    if (trail) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      trail.forEach((p, i) => {
        const t = (i + 1) / (trail.length + 1)
        const s = 1 + Math.round(t * 2)
        g.globalAlpha = t * 0.7
        g.fillStyle = mix(trailColour, colour, t)
        g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s)
      })
      g.restore()
    }
    glow(g, ball.x, ball.y, 10 + heat * 2, colour, 0.5 + heat * 0.1)
    const frame = Math.floor(this.tick / 5) % 2
    drawSprite(g, BALL_SPRITES[frame]!, ball.x, ball.y)
  }

  /** The Bloom Bed: eight plots, each a sprout, a bud or a bloom; a bloom is the safety net. */
  private renderBed(g: CanvasRenderingContext2D) {
    for (let plot = 0; plot < PLOTS; plot++) {
      const cx = Math.round(plotCenter(plot))
      const level = this.bed[plot]!
      const colour = FLOWER_COLORS[plot % FLOWER_COLORS.length]!
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(cx - 11, H - 5, 22, 5)
      g.fillStyle = RAMPS.earth[3]
      g.fillRect(cx - 11, H - 5, 22, 1)
      for (let pip = 0; pip < FULL_BLOOM; pip++) {
        g.fillStyle = pip < level ? RAMPS.gold[3] : RAMPS.earth[0]
        g.fillRect(cx - 6 + pip * 5, H - 3, 3, 2)
      }
      if (level === 0) continue
      if (level >= FULL_BLOOM) {
        const bob = Math.round(Math.sin((this.tick + plot * 9) / 14))
        glow(g, cx, BED_FEET - 12, 14, colour, 0.35)
        drawSprite(g, FLOWER_SPRITES[colour]![2]!, cx, BED_FEET - 5 + bob, {
          anchor: 'feet',
          scale: 2,
        })
      } else if (level === 2) {
        drawSprite(g, FLOWER_SPRITES[colour]![0]!, cx, BED_FEET - 5, {
          anchor: 'feet',
          scale: 2,
        })
      } else {
        drawSprite(g, SPROUT_SPRITE, cx, BED_FEET - 5, {
          anchor: 'feet',
          scale: 2,
        })
      }
    }
  }

  private renderPetal(g: CanvasRenderingContext2D, p: Petal) {
    const x = Math.round(p.x + Math.sin((p.y + p.x) / 12) * 3)
    glow(g, x, p.y, 7, p.color, 0.3)
    drawSprite(g, FLOWER_SPRITES[p.color]![0]!, x, p.y)
  }

  private renderBumble(g: CanvasRenderingContext2D, bee: Bumble) {
    const x = Math.round(bee.x)
    const y = Math.round(bee.y)
    const flap = Math.floor(this.tick / 2) % 2
    glow(g, x, y, 9, RAMPS.gold[3], 0.3)
    g.fillStyle = INK
    g.fillRect(x - 5, y - 3, 10, 7)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x - 4, y - 2, 8, 5)
    g.fillStyle = INK
    g.fillRect(x - 1, y - 2, 1, 5)
    g.fillRect(x + 2, y - 2, 1, 5)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 3, y - 6 + flap, 3, 2)
    g.fillRect(x + 1, y - 6 + flap, 3, 2)
    g.fillRect(x - 4, y - 1, 1, 1)
  }

  /** Queen's Compass: the ball's path two bounces ahead, dotted on the glass. */
  private renderCompass(g: CanvasRenderingContext2D) {
    const solids = this.bricks
      .filter((b) => !(b.kind === 'hinge' && b.open))
      .map((b) => this.brickRect(b))
    for (const ball of this.balls) {
      if (ball.stuck !== null) continue
      const path = predictPath(ball, solids)
      path.forEach((pt, i) => {
        g.globalAlpha = Math.max(0.15, 0.8 - i * 0.012)
        g.fillStyle = SEED_COLORS.Q
        g.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2)
      })
    }
    g.globalAlpha = 1
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
    const extra: [Seed, number, number][] = []
    if (this.rain > 0) extra.push(['R', this.rain, RAIN_TICKS])
    if (this.thorn > 0) extra.push(['T', this.thorn, THORN_TICKS])
    if (this.compass > 0) extra.push(['Q', this.compass, COMPASS_TICKS])
    if (extra.length) {
      hudPanel(g, 86, 22, 100, 14)
      extra.forEach(([kind, left, max], i) => {
        const px = 91 + i * 31
        drawText(g, kind, px, 26, {
          color: SEED_RAMPS[kind][3],
          outline: INK,
        })
        gauge(g, px + 8, 28, 18, 3, left / max, SEED_RAMPS[kind])
      })
    }
    if (this.chain >= 2)
      drawText(g, `POLLEN x${Math.min(8, this.chain)}`, 6, 24, {
        color: chainColor(this.chain),
        outline: INK,
      })
    if (this.bumble)
      drawText(g, `RUSH ${rushBonus(this.rushTicks)}`, W - 7, 24, {
        align: 'right',
        color: RAMPS.gold[3],
        outline: INK,
      })
    else if (this.chime)
      drawText(g, 'CHIME x2', W - 7, 24, {
        align: 'right',
        color: RAMPS.teal[3],
        outline: INK,
      })
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

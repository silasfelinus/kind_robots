// /utils/arcade/games/roverRamble.ts
//
// Rover Ramble -- the Kind Robots Arcade's Moon Patrol riff (conductor
// kr-arcade/t-009 game factory, batch 4; depth pass kr-arcade/t-098). A
// six-wheeled rover rolls the Five Moons Rally, a lettered course from A to Z
// with an end. Jump the craters, zap the boulders ahead, and shoot upward at
// the meteor sprites that swoop overhead dropping pebbles (a pebble that lands
// ahead of you digs a fresh crater). Checkpoint posts letter the route; reach
// each one for a bonus that grows the faster you got there, and the outpost at
// the end of each moon (E, J, O, T, Z) prints a time report with stamps.
//
// The route is authored data (roverRamble/course.ts): every section is a
// script of beats laid out with seeded variation. Big boulders take two zaps,
// rollers come at you, landmines must be jumped, tanks shoot back along the
// track, bomber saucers blast new craters where a target ring shows, zig
// saucers weave at bumper height, moon creepers must be zapped as buds,
// dust devils shove your speed and pursuers close in from behind (watch the
// rear-view). Ramps launch long jumps; landing on a boulder is a stunt.
//
// Right speeds up, left slows down, Up or B jumps, A zaps ahead and overhead.

import { drawText } from '../font'
import {
  COURSE,
  LETTERS,
  MOONS,
  SECTION_COUNT,
  checkpointReport,
  isOutpost,
  layoutSection,
  sectionStart,
  type CueKind,
  type PlaceKind,
  type Report,
} from '../roverRamble/course'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
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
  shadedOrb,
  starField,
  vignette,
  type Ramp,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const HUD_H = 24
const GROUND = 206
const BASE_SPEED = 1.6
const MIN_SPEED = 1
const MAX_SPEED = 2.6
const ACCEL = 0.03
const JUMP_V = 3.4
const GRAVITY = 0.16
const ROVER_HALF = 11
const SHOT_SPEED = 5
const SHOT_RANGE = 170
const MAX_UP_SHOTS = 3
const PEBBLE_SPEED = 1.4
const START_LIVES = 3
const CRASH_TICKS = 110
const EXTRA_AT = 10_000

const ROCK_POINTS = 50
const BIG_POINTS = 100
const JUMP_POINTS = 50
const SPRITE_POINTS = 150
const CHECKPOINT_POINTS = 500

const MINE_POINTS = 100
const TANK_POINTS = 300
const CREEPER_POINTS = 100
const ZIG_POINTS = 250
const PURSUER_POINTS = 150
const STOMP_POINTS = 200
const BIG_AIR_POINTS = 300
const CLOSE_SHAVE_POINTS = 100
const FINISH_POINTS = 5000
/** Tank: ticks between shells, the turret lift that warns of one, the shell's speed. */
const TANK_CYCLE = 170
const TANK_LIFT = 36
const SHELL_SPEED = 1.8
/** Creeper: the bud swells this long once the rover is near, then the vine is full grown. */
const CREEPER_GROW = 110
const VINE_H = 24
/** How much faster than the rover a pursuer closes. */
const PURSUER_CLOSE = 1.4
const BIG_AIR_SPEED = 2.4
const BOMB_FALL = 2
const ZIG_LOW = GROUND - 22
const ZIG_HIGH = GROUND - 52
/** How long a moon's time report stays up. */
const REPORT_TICKS = 330

type ObKind = PlaceKind
type Ob = {
  kind: ObKind
  x: number
  w: number
  hp: number
  passed: boolean
  gone: boolean
  /** A tank's or creeper's clock; a dust devil's push direction is `dir`. */
  t: number
  dir: number
}
type Shot = { x: number; y: number; ox: number }
type SpriteKind = 'sprite' | 'zig' | 'bomber'
type Sprite = {
  kind: SpriteKind
  x: number
  y: number
  baseY: number
  vx: number
  phase: number
  /** A bomber's target on the track and whether its bomb has dropped. */
  targetWx: number
  dropped: boolean
}
type Pebble = { x: number; y: number; vx: number }
type Shell = { x: number }
type Bomb = { wx: number; y: number }
type Pursuer = { x: number; passed: boolean; gone: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const rockR = (o: Ob) => (o.kind === 'big' ? 9 : 6)
/** Things a zap can hit on the ground (a creeper only while it is still a bud). */
const zappable = (o: Ob) =>
  o.kind === 'rock' ||
  o.kind === 'big' ||
  o.kind === 'roller' ||
  o.kind === 'tank' ||
  (o.kind === 'creeper' && o.t < CREEPER_GROW * 0.4)
const vineHeight = (o: Ob) => (o.t / CREEPER_GROW) * VINE_H
const newOb = (kind: ObKind, x: number, w: number): Ob => ({
  kind,
  x,
  w,
  hp: kind === 'big' ? 2 : kind === 'tank' ? 2 : 1,
  passed: false,
  gone: false,
  // A tank has half its cycle run by the time it rolls into view.
  t: kind === 'tank' ? TANK_CYCLE - 80 : 0,
  dir: 0,
})

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** Moon dust: cool lavender greys, lit from the upper left. */
const DUST: Ramp = ['#1e1830', '#3e3654', '#6c6482', '#a29cb4', '#ddd8ea']
/** Boulders: warm stone, so they stand off the cool dust. */
const STONE: Ramp = ['#2a2220', '#4e443e', '#7c726a', '#b0a69a', '#e8e0d4']
/** The rover's orange hull. */
const HULL: Ramp = ['#4a1a0a', '#9a3a12', '#ea6a1a', '#fb9a4b', '#ffd8a8']
/** Three ranges of moon mountains, each nearer one darker against the glowing horizon. */
const FAR_RAMP: Ramp = ['#1c1650', '#30287a', '#3e3490', '#5a4cae', '#8070d0']
const MID_RAMP: Ramp = ['#140f3a', '#221a5a', '#2e2470', '#463a94', '#6a5cbc']
const NEAR_RAMP: Ramp = ['#100c22', '#241e3a', '#383050', '#5a5272', '#8c84a8']

const SKY_BANDS = [
  '#05041a',
  RAMPS.night[1],
  RAMPS.night[2],
  '#2c2470',
  '#40308a',
  '#6a44a0',
]
const HORIZON_HAZE = '#6a44a0'

const PLANET = { x: 250, y: HUD_H + 42, r: 21 }

const STARS = starField(7, 70, W, GROUND - HUD_H - 40).map((s) => ({
  ...s,
  y: s.y + HUD_H,
}))

/** A parallax range: a wrapping ridge baked into a strip, scrolled at `rate` of the camera. */
type Range = {
  key: string
  heights: number[]
  step: number
  base: number
  top: number
  rate: number
  ramp: Ramp
  haze: number
  pits: number
}
const RANGES: readonly Range[] = [
  {
    key: 'far',
    heights: ridge(23, W, 54, 5),
    step: 5,
    base: 178,
    top: 120,
    rate: 0.08,
    ramp: FAR_RAMP,
    haze: 0.55,
    pits: 0,
  },
  {
    key: 'mid',
    heights: ridge(57, W, 30, 4),
    step: 4,
    base: 193,
    top: 158,
    rate: 0.2,
    ramp: MID_RAMP,
    haze: 0.35,
    pits: 6,
  },
  {
    key: 'near',
    heights: ridge(91, W, 16, 2),
    step: 2,
    base: 205,
    top: 186,
    rate: 0.42,
    ramp: NEAR_RAMP,
    haze: 0.2,
    pits: 8,
  },
]

/** The crater pit's colours, row by row from the lip down into the dark. */
const CRATER_ROWS = Array.from({ length: 14 }, (_, i) =>
  mix(DUST[1], INK, Math.min(1, i / 9)),
)

const ROVER_PALETTE = {
  O: HULL[4],
  Y: HULL[3],
  y: HULL[2],
  d: HULL[1],
  k: HULL[0],
  t: RAMPS.teal[3],
  H: RAMPS.steel[4],
  C: RAMPS.steel[3],
  c: RAMPS.steel[2],
  s: RAMPS.steel[2],
  g: RAMPS.steel[1],
  G: RAMPS.steel[3],
  w: RAMPS.sky[4],
  B: RAMPS.sky[2],
  b: RAMPS.sky[1],
}
const ROVER_BODY = [
  '.LRL....................',
  '.LLL....................',
  '..s.....................',
  '..s.....................',
  '..s....gG...............',
  '..s....gG...............',
  '..s...HHHHHHHHHc........',
  '..s...HCCwwBBBCc........',
  '..s...HCwBBBBBCc........',
  '..s...HCBBBBBbCc........',
  '..s...HCCCCCCCCc........',
  '..s..ccccccccccc........',
  'OOOOOOOOOOOOOOOOOOOOOy..',
  'OYYYYYYYYYYYYYYYYYYYYd..',
  'Oyttttttttttttttttttyd..',
  'Oyykkyyyykkyyyykkyyyyd..',
  'ddyyyyyyyyyyyyyyyyyyydgG',
  '.ddddddddddddddddddddd..',
]
/** The rover, its antenna beacon lit and dark: the two frames of its blink. */
const ROVER_SPRITES = [
  pixelSprite(ROVER_BODY, {
    ...ROVER_PALETTE,
    R: '#ffffff',
    L: RAMPS.ember[2],
  }),
  pixelSprite(ROVER_BODY, {
    ...ROVER_PALETTE,
    R: RAMPS.ember[1],
    L: RAMPS.ember[0],
  }),
] as const

const WHEEL_PALETTE = {
  U: RAMPS.steel[2],
  T: RAMPS.steel[1],
  d: RAMPS.steel[0],
  h: RAMPS.steel[3],
  H: RAMPS.steel[4],
  k: INK,
}
/** A wheel at two turns of its spokes (and tread), swapped as the rover rolls. */
const WHEEL_SPRITES = [
  pixelSprite(
    [
      '..UTU..',
      '.UTTTT.',
      'UThkhTT',
      'TTkHkTd',
      'UThkhTT',
      '.TTTTd.',
      '..dTd..',
    ],
    WHEEL_PALETTE,
  ),
  pixelSprite(
    [
      '..TUT..',
      '.UTTTT.',
      'TTkhkTd',
      'UThHhTT',
      'TTkhkTd',
      '.TTTTd.',
      '..TdT..',
    ],
    WHEEL_PALETTE,
  ),
] as const

const SAUCER_PALETTE = {
  W: '#ffffff',
  w: RAMPS.teal[4],
  B: RAMPS.teal[3],
  b: RAMPS.teal[1],
  p: RAMPS.purple[4],
  P: RAMPS.purple[3],
  q: RAMPS.purple[2],
  d: RAMPS.purple[1],
  L: RAMPS.gold[4],
  l: RAMPS.gold[1],
}
const SAUCER_TOP = [
  '......wWw......',
  '.....wBBBb.....',
  '....BBBBBBb....',
  '..pPPPPPPPPPq..',
  'pPPPPPPPPPPPPPq',
]
/** The meteor sprites' saucer, its rim lights chasing round in two frames. */
const SAUCER_SPRITES = [
  pixelSprite(
    [...SAUCER_TOP, 'qLqqlqqLqqlqqLq', '..qqqqqqqqqqd..', '....ddddddd....'],
    SAUCER_PALETTE,
  ),
  pixelSprite(
    [...SAUCER_TOP, 'qlqqLqqlqqLqqlq', '..qqqqqqqqqqd..', '....ddddddd....'],
    SAUCER_PALETTE,
  ),
] as const

const PEBBLE_SPRITE = pixelSprite(['.HG.', 'HGgd', 'Ggdd', '.dd.'], {
  H: STONE[4],
  G: STONE[3],
  g: STONE[2],
  d: STONE[1],
})

/** A spare rover for the lives box. */
const LIFE_SPRITE = pixelSprite(
  ['...CCC...', '...CBC...', 'OOOOOOOOO', 'yyyyyyyyd', '.kk.kk.kk'],
  {
    C: RAMPS.steel[3],
    B: RAMPS.sky[2],
    O: HULL[3],
    y: HULL[2],
    d: HULL[1],
    k: RAMPS.steel[1],
  },
)

/** A wrapped pit in the dust: shadowed far wall, lit near lip (light from the upper left). */
function paintPit(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  ramp: Ramp,
) {
  for (const ox of [x - W, x, x + W]) {
    k.fillStyle = ramp[3]
    k.fillRect(ox - rx + 1, y - ry - 1, rx * 2 - 1, 1)
    for (let r = -ry; r <= ry; r++) {
      const half = Math.max(
        1,
        Math.round(rx * Math.sqrt(1 - (r * r) / ((ry + 0.6) * (ry + 0.6)))),
      )
      // The far wall is in shadow, the floor brightens toward the near wall.
      k.fillStyle = r < 0 ? ramp[0] : r === ry ? ramp[2] : ramp[1]
      k.fillRect(ox - half, y + r, half * 2 + 1, 1)
      if (r >= 0) {
        k.fillStyle = ramp[0]
        k.fillRect(ox - half, y + r, 2, 1)
      }
    }
    k.fillStyle = ramp[4]
    k.fillRect(ox - rx + 2, y + ry + 1, rx * 2 - 2, 1)
  }
}

/** A pebble half sunk in the dust, lit on top. */
function paintStone(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  for (const ox of [x - W, x, x + W]) {
    k.fillStyle = DUST[0]
    k.fillRect(ox - 1, y - 1, size + 2, size + 1)
    k.fillStyle = STONE[1]
    k.fillRect(ox, y, size, size)
    k.fillStyle = STONE[3]
    k.fillRect(ox, y, size - 1, Math.max(1, size - 1))
    k.fillStyle = STONE[4]
    k.fillRect(ox, y, Math.max(1, size - 2), 1)
  }
}

/**
 * A range of mountains baked into a strip: each column's crest lit when it faces the light (rising
 * to the right), dim when it falls away, and the foot fading into the horizon haze.
 */
function paintRange(k: CanvasRenderingContext2D, range: Range) {
  const { heights, step, ramp } = range
  const base = range.base - range.top
  const bottom = GROUND - range.top
  const n = heights.length
  for (let i = 0; i < n; i++) {
    const h = heights[i]!
    const rise = h - heights[(i + n - 1) % n]!
    const x = i * step
    const top = base - h
    k.fillStyle = ramp[1]
    k.fillRect(x, top, step, bottom - top)
    const [rim, cap, flank] =
      rise > 0
        ? [ramp[4], ramp[3], ramp[2]]
        : rise === 0
          ? [ramp[3], ramp[2], ramp[2]]
          : [ramp[2], ramp[1], ramp[0]]
    k.fillStyle = flank
    k.fillRect(x, top, step, 7)
    k.fillStyle = cap
    k.fillRect(x, top, step, 3)
    k.fillStyle = rim
    k.fillRect(x, top, step, 1)
  }
  // Craters on the slopes, only where there is mountain to hold them.
  k.save()
  k.globalCompositeOperation = 'source-atop'
  const rand = backdropRng(range.heights.length * 13 + range.base)
  for (let i = 0; i < range.pits; i++) {
    const x = Math.floor(rand() * W)
    const h = heights[Math.floor(x / step) % n]!
    const y = base - h + 6 + Math.floor(rand() * Math.max(1, h - 4))
    paintPit(k, x, y, 2 + Math.floor(rand() * 3), 1, ramp)
  }
  // The foot of the range sinks into the haze.
  const rows = bottom
  for (let y = 0; y < rows; y += 2) {
    k.globalAlpha = range.haze * Math.max(0, (y - rows * 0.35) / (rows * 0.65))
    k.fillStyle = HORIZON_HAZE
    k.fillRect(0, y, W, 2)
  }
  k.restore()
}

/** The dust right under the wheels: it scrolls with the course, craters and all. */
function paintTrack(k: CanvasRenderingContext2D) {
  const h = 16
  bandedGradient(
    k,
    0,
    0,
    W,
    h,
    [DUST[3], DUST[2], mix(DUST[2], DUST[1], 0.5)],
    2,
  )
  k.fillStyle = DUST[4]
  k.fillRect(0, 0, W, 1)
  k.fillStyle = DUST[3]
  k.fillRect(0, 1, W, 1)
  const rand = backdropRng(71)
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(rand() * W)
    const y = 6 + Math.floor(rand() * 6)
    paintPit(k, x, y, 3 + Math.floor(rand() * 4), 1, DUST)
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(rand() * W)
    const y = 3 + Math.floor(rand() * 11)
    paintStone(k, x, y, rand() < 0.3 ? 2 : 1)
  }
  // Tyre-worn streaks along the track.
  k.fillStyle = rgba(DUST[4], 0.25)
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rand() * W)
    const y = 3 + Math.floor(rand() * 12)
    const len = 4 + Math.floor(rand() * 10)
    k.fillRect(x, y, len, 1)
    k.fillRect(x - W, y, len, 1)
  }
}

/** The foreground ledge below the track: bigger rocks, scrolling faster for depth. */
function paintForeground(k: CanvasRenderingContext2D) {
  const h = H - GROUND - 16
  bandedGradient(k, 0, 0, W, h, [DUST[2], DUST[1], DUST[0]], 3)
  k.fillStyle = INK
  k.fillRect(0, 0, W, 1)
  k.fillStyle = DUST[3]
  k.fillRect(0, 1, W, 1)
  const rand = backdropRng(83)
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rand() * W)
    const y = 7 + Math.floor(rand() * 6)
    paintPit(k, x, y, 5 + Math.floor(rand() * 5), 2, DUST)
  }
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(rand() * W)
    const y = 4 + Math.floor(rand() * 12)
    paintStone(k, x, y, 2 + Math.floor(rand() * 3))
  }
}

const strips = new Map<string, HTMLCanvasElement | null>()

/** A screen-wide strip baked once, then scrolled sideways and wrapped (a parallax layer). */
function scrollStrip(
  g: CanvasRenderingContext2D,
  key: string,
  y: number,
  h: number,
  offset: number,
  paint: (k: CanvasRenderingContext2D) => void,
) {
  let canvas = strips.get(key)
  if (canvas === undefined) {
    canvas = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('canvas')
      made.width = W
      made.height = h
      const k = made.getContext('2d')
      if (k) {
        paint(k)
        canvas = made
      }
    }
    strips.set(key, canvas)
  }
  const x = -Math.round(((offset % W) + W) % W)
  g.save()
  g.imageSmoothingEnabled = false
  for (const dx of [x, x + W]) {
    if (canvas) g.drawImage(canvas, dx, y)
    else {
      g.save()
      g.beginPath()
      g.rect(dx, y, W, h)
      g.clip()
      g.translate(dx, y)
      paint(g)
      g.restore()
    }
  }
  g.restore()
}

class RoverRamble implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private wx = 40
  private speed = BASE_SPEED
  private alt = 0
  private vy = 0
  private sectionStart = 0
  private sectionLen = 0
  private sectionTicks = 0
  private obstacles: Ob[] = []
  private cues: { kind: CueKind; x: number; done: boolean }[] = []
  private fwd: Shot | null = null
  private ups: Shot[] = []
  private sprites: Sprite[] = []
  private pebbles: Pebble[] = []
  private shells: Shell[] = []
  private bombs: Bomb[] = []
  private pursuers: Pursuer[] = []
  private crash = 0
  /** Ticks and rovers lost since the last outpost, for its report. */
  private moonTicks = 0
  private moonCrashes = 0
  /** Set when a ramp launched the rover at full speed: the landing pays. */
  private airBonus = false
  private report: { data: Report; ticks: number } | null = null
  private won = false
  private nextExtra = EXTRA_AT
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startSection(1)
  }

  private get roverX(): number {
    return 60 + (this.speed - MIN_SPEED) * 26
  }

  private get camera(): number {
    return this.wx - this.roverX
  }

  // --- the course ---------------------------------------------------------------

  /** Lays section `section` (1 is A) on the track; `rewind` puts the rover back at its start. */
  private startSection(section: number, rewind = true) {
    const def = COURSE[section - 1]!
    const start = sectionStart(section - 1)
    this.level = section
    this.sectionStart = start
    this.sectionLen = def.len
    this.sectionTicks = 0
    if (rewind) {
      this.wx = start + 40
      this.speed = BASE_SPEED
      this.alt = 0
      this.vy = 0
      this.airBonus = false
    }
    this.fwd = null
    this.ups = []
    this.sprites = []
    this.pebbles = []
    this.shells = []
    this.bombs = []
    this.pursuers = []
    const layout = layoutSection(def, start, this.rng)
    this.obstacles = layout.places.map((p) => newOb(p.kind, p.x, p.w))
    for (const o of this.obstacles)
      if (o.kind === 'devil') o.dir = o.x % 20 < 10 ? 1 : -1
    this.cues = layout.cues.map((c) => ({ ...c, done: false }))
    this.banner = {
      text: `SECTION ${def.letter}`,
      sub: `${MOONS[def.moon]} MOON  PAR ${def.par} SECONDS`,
      ticks: 100,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.crash > 0) {
      if (--this.crash === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'END OF THE ROAD',
            sub: 'GAME OVER',
            ticks: 9999,
          }
        } else this.startSection(this.level)
      }
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.sectionTicks++
    this.moonTicks++
    this.drive(controls)
    this.updateObstacles()
    this.updateCues()
    this.updateShots()
    this.updateSprites()
    this.updatePebbles()
    this.updateEnemies()
    if (this.crash === 0 && this.wx >= this.sectionStart + this.sectionLen)
      this.checkpoint()
  }

  private drive(input: InputFrame) {
    if (input.held.right) this.speed = Math.min(MAX_SPEED, this.speed + ACCEL)
    else if (input.held.left)
      this.speed = Math.max(MIN_SPEED, this.speed - ACCEL)
    else this.speed += (BASE_SPEED - this.speed) * 0.02
    this.wx += this.speed
    if (
      this.alt === 0 &&
      (input.pressed.up || input.pressed.b || input.held.up)
    ) {
      this.vy = JUMP_V
      this.alt = 0.01
      this.sound.play('blip')
    }
    if (this.alt > 0) {
      // Holding the jump button on the way up carries the rover a little higher.
      const held = input.held.up || input.held.b
      this.alt += this.vy
      this.vy -= held && this.vy > 0 ? GRAVITY * 0.88 : GRAVITY
      if (this.alt <= 0) {
        this.alt = 0
        this.vy = 0
        this.land()
      }
    }
    if (input.pressed.a) this.fire()
  }

  private land() {
    if (!this.airBonus) return
    this.airBonus = false
    this.addScore(BIG_AIR_POINTS, this.roverX, GROUND - 40)
    this.cheer(this.roverX, GROUND - 10, 14)
    this.sound.play('extra')
  }

  private fire() {
    let fired = false
    if (!this.fwd) {
      this.fwd = {
        x: this.wx + ROVER_HALF,
        y: GROUND - 8 - this.alt,
        ox: this.wx,
      }
      fired = true
    }
    if (this.ups.length < MAX_UP_SHOTS) {
      this.ups.push({ x: this.wx - 4, y: GROUND - 14 - this.alt, ox: 0 })
      fired = true
    }
    if (fired) this.sound.play('shoot')
  }

  private updateObstacles() {
    for (const o of this.obstacles) {
      if (o.gone) continue
      const dx = o.x - this.wx
      switch (o.kind) {
        case 'crater': {
          // On the ground with the rover's middle over the hole: in it goes.
          if (this.alt === 0 && this.wx > o.x + 4 && this.wx < o.x + o.w - 4) {
            this.crashRover('FELL IN A CRATER')
            return
          }
          if (!o.passed && this.wx - ROVER_HALF > o.x + o.w) {
            o.passed = true
            this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
            this.cheer(this.roverX, GROUND - 10 - this.alt, 6)
          }
          break
        }
        case 'ramp': {
          // Leaving the top of a ramp on the ground throws the rover; speed sets how far.
          const end = o.x + o.w
          if (!o.passed && this.alt === 0 && this.wx >= end - 3) {
            o.passed = true
            this.vy = JUMP_V * 0.85 + (this.speed - MIN_SPEED)
            this.alt = 0.01
            this.airBonus = this.speed >= BIG_AIR_SPEED
            this.sound.play('blip')
            this.cheer(this.roverX, GROUND - 10, 6)
          } else if (!o.passed && this.wx > end + 12) o.passed = true
          break
        }
        case 'rock':
        case 'big':
        case 'roller': {
          if (o.kind === 'roller') o.x -= 0.6
          const r = rockR(o)
          if (Math.abs(o.x - this.wx) < ROVER_HALF + r - 3) {
            // Coming down on top of a boulder is a stunt: the rover bounces off it.
            if (this.vy < 0 && this.alt >= r * 2 - 5 && this.alt < r * 2 + 3) {
              o.gone = true
              this.vy = JUMP_V * 0.8
              this.alt = r * 2 - 4
              const sx = o.x - this.camera
              this.addScore(STOMP_POINTS, sx, GROUND - 40)
              this.cheer(sx, GROUND - 14, 10)
              this.sparks(sx, GROUND - 8, '#a8a29e', 10)
              this.sound.play('pop')
              break
            }
            if (this.alt < r * 2 - 2) {
              this.crashRover(
                o.kind === 'roller'
                  ? 'A BOULDER ROLLED IN'
                  : 'BUMPED A BOULDER',
              )
              return
            }
          }
          if (!o.passed && o.x + r < this.wx - ROVER_HALF) {
            o.passed = true
            this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
            this.cheer(this.roverX, GROUND - 10 - this.alt, 6)
          }
          break
        }
        case 'mine': {
          if (Math.abs(dx) < ROVER_HALF + 1 && this.alt < 5) {
            this.crashRover('STEPPED ON A LANDMINE')
            return
          }
          if (!o.passed && o.x + 4 < this.wx - ROVER_HALF) {
            o.passed = true
            this.addScore(MINE_POINTS, this.roverX, GROUND - 30)
            this.cheer(this.roverX, GROUND - 10 - this.alt, 6)
          }
          break
        }
        case 'tank': {
          // A tank lifts its turret, then fires a slow shell along the track.
          if (dx < 240 && dx > 30 && ++o.t >= TANK_CYCLE) {
            o.t = 0
            this.shells.push({ x: o.x - 14 })
            this.sound.play('boom')
          }
          if (Math.abs(dx) < ROVER_HALF + 9 && this.alt < 14) {
            this.crashRover('ROLLED INTO A TANK')
            return
          }
          if (!o.passed && o.x + 12 < this.wx - ROVER_HALF) {
            o.passed = true
            this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
          }
          break
        }
        case 'creeper': {
          // The bud swells as the rover nears; a full vine is a wall to jump.
          if (dx < 170 && o.t < CREEPER_GROW) o.t++
          if (Math.abs(dx) < ROVER_HALF + 2 && this.alt < vineHeight(o) - 2) {
            this.crashRover('TANGLED IN A MOON CREEPER')
            return
          }
          if (!o.passed && o.x + 5 < this.wx - ROVER_HALF) {
            o.passed = true
            this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
          }
          break
        }
        case 'devil': {
          // A whirlwind crossing the track shoves the throttle, so the rover has to feather it.
          o.x -= 0.7
          o.t++
          if (Math.abs(o.x - this.wx) < 16)
            this.speed = Math.max(
              MIN_SPEED,
              Math.min(MAX_SPEED, this.speed + o.dir * 0.05),
            )
          if (o.x < this.wx - 60) o.gone = true
          break
        }
      }
    }
    this.obstacles = this.obstacles.filter(
      (o) => !o.gone && o.x + o.w > this.camera - 60,
    )
  }

  /** Scripted arrivals: sprite trios, zig and bomber saucers, pursuers. */
  private updateCues() {
    for (const c of this.cues) {
      if (c.done || this.wx < c.x) continue
      c.done = true
      if (c.kind === 'sprites') {
        const fromLeft = this.rng() < 0.5
        const baseY = HUD_H + 26 + this.rng() * 40
        for (let i = 0; i < 3; i++)
          this.sprites.push({
            kind: 'sprite',
            x: fromLeft ? -20 - i * 22 : W + 20 + i * 22,
            y: baseY,
            baseY,
            vx: fromLeft ? 1.3 : -1.3,
            phase: i * 0.9,
            targetWx: 0,
            dropped: true,
          })
        this.sound.play('warn')
      } else if (c.kind === 'zig') {
        this.sprites.push({
          kind: 'zig',
          x: W + 20,
          y: ZIG_LOW,
          baseY: ZIG_LOW,
          vx: -2.1,
          phase: this.rng() * 2,
          targetWx: 0,
          dropped: true,
        })
        this.sound.play('warn')
      } else if (c.kind === 'bomber') {
        this.sprites.push({
          kind: 'bomber',
          x: W + 24,
          y: HUD_H + 16,
          baseY: HUD_H + 16,
          vx: -2.4,
          phase: 0,
          targetWx: this.wx + 130 + this.rng() * 90,
          dropped: false,
        })
        this.sound.play('warn')
      } else {
        // A horn, and a blip on the rear-view: something is coming up behind.
        this.pursuers.push({
          x: this.camera - 40,
          passed: false,
          gone: false,
        })
        this.sound.play('warn')
        this.floaters.push({ x: 40, y: HUD_H + 26, text: 'HORN!', life: 60 })
      }
    }
  }

  private updateShots() {
    if (this.fwd) {
      const shot = this.fwd
      shot.x += SHOT_SPEED
      const target = this.obstacles.find(
        (o) =>
          !o.gone &&
          zappable(o) &&
          Math.abs(o.x - shot.x) < (o.kind === 'tank' ? 12 : rockR(o) + 2) &&
          shot.y > GROUND - (o.kind === 'tank' ? 16 : rockR(o) * 2 + 2),
      )
      const sx = shot.x - this.camera
      const zig = this.sprites.find(
        (sp) =>
          sp.kind === 'zig' &&
          Math.abs(sp.x - sx) < 9 &&
          Math.abs(sp.y - shot.y) < 9,
      )
      const chaser = this.pursuers.find(
        (p) => p.passed && !p.gone && Math.abs(p.x - shot.x) < 12,
      )
      if (target) {
        this.zapGround(target)
        this.fwd = null
      } else if (zig) {
        this.killSprite(zig)
        this.fwd = null
      } else if (chaser && shot.y > GROUND - 26) {
        chaser.gone = true
        this.addScore(PURSUER_POINTS, sx, GROUND - 24)
        this.sparks(sx, GROUND - 8, '#c4b5fd', 14)
        this.sound.play('boom')
        this.fwd = null
      } else if (shot.x - shot.ox > SHOT_RANGE) this.fwd = null
    }
    for (const s of this.ups) {
      s.y -= SHOT_SPEED
      const sx = s.x - this.camera
      const hit = this.sprites.find(
        (sp) => Math.abs(sp.x - sx) < 9 && Math.abs(sp.y - s.y) < 7,
      )
      if (hit) {
        s.y = -99
        this.killSprite(hit)
      }
      const pebble = this.pebbles.find(
        (p) => Math.abs(p.x - sx) < 5 && Math.abs(p.y - s.y) < 6,
      )
      if (pebble) {
        s.y = -99
        pebble.y = H + 99
        this.sparks(pebble.x, pebble.y, '#d6d3d1', 4)
      }
    }
    this.ups = this.ups.filter((s) => s.y > HUD_H)
    this.sprites = this.sprites.filter((sp) => sp.y > -900)
  }

  private killSprite(sp: Sprite) {
    this.cheer(sp.x, sp.y, 12)
    sp.y = -999
    this.addScore(
      sp.kind === 'zig' ? ZIG_POINTS : SPRITE_POINTS,
      sp.x,
      sp.baseY - 10,
    )
    this.sparks(sp.x, sp.baseY, '#c4b5fd', 12)
    this.sound.play('pop')
  }

  private zapGround(o: Ob) {
    const sx = o.x - this.camera
    if (o.kind === 'big' && o.hp > 1) {
      o.hp--
      o.kind = 'rock'
      this.cheer(sx, GROUND - 12, 6)
      this.addScore(BIG_POINTS, sx, GROUND - 26)
      this.sparks(sx, GROUND - 10, '#a8a29e', 10)
      this.sound.play('blip')
      return
    }
    if (o.kind === 'tank' && o.hp > 1) {
      o.hp--
      this.sparks(sx, GROUND - 10, '#fb923c', 8)
      this.sound.play('blip')
      return
    }
    o.gone = true
    this.cheer(sx, GROUND - 8, 10)
    const points =
      o.kind === 'tank'
        ? TANK_POINTS
        : o.kind === 'creeper'
          ? CREEPER_POINTS
          : o.kind === 'roller'
            ? BIG_POINTS
            : ROCK_POINTS
    this.addScore(points, sx, GROUND - 22)
    this.sparks(
      sx,
      GROUND - 6,
      o.kind === 'creeper' ? '#86efac' : '#a8a29e',
      14,
    )
    this.sound.play('boom')
  }

  private updateSprites() {
    const pebble = 0.006 + Math.min(this.level, 9) * 0.0015
    for (const sp of this.sprites) {
      if (sp.kind === 'sprite') {
        sp.x += sp.vx
        sp.y = sp.baseY + Math.sin(this.tick / 18 + sp.phase) * 14
        if (sp.x > 20 && sp.x < W - 20 && this.rng() < pebble)
          this.pebbles.push({ x: sp.x, y: sp.y + 6, vx: 0 })
      } else if (sp.kind === 'zig') {
        // Low at bumper height, then high, every second or so.
        sp.x += sp.vx
        const high = Math.floor((this.tick + sp.phase * 40) / 50) % 2 === 1
        sp.y += ((high ? ZIG_HIGH : ZIG_LOW) - sp.y) * 0.2
        sp.baseY = sp.y
        if (
          Math.abs(sp.x - this.roverX) < ROVER_HALF + 5 &&
          sp.y > GROUND - this.alt - 28 &&
          sp.y < GROUND - this.alt + 2
        ) {
          this.crashRover('SIDESWIPED BY A ZIG SAUCER')
          return
        }
      } else {
        // The bomber outruns the scenery, then lets one go over its ring on the track.
        sp.vx = -(this.speed + 1)
        sp.x += sp.vx
        if (!sp.dropped && sp.x <= sp.targetWx - this.camera + 4) {
          sp.dropped = true
          this.bombs.push({ wx: sp.targetWx, y: sp.y + 6 })
          this.sound.play('warn')
        }
      }
    }
    this.sprites = this.sprites.filter((sp) => sp.x > -90 && sp.x < W + 90)
  }

  private updateEnemies() {
    // Tank shells roll toward the rover along the ground.
    for (const s of this.shells) {
      s.x -= SHELL_SPEED
      if (Math.abs(s.x - this.wx) < ROVER_HALF + 2 && this.alt < 9) {
        this.crashRover('HIT BY A TANK SHELL')
        return
      }
    }
    this.shells = this.shells.filter((s) => s.x > this.camera - 30)
    // Bombs fall at the ring and blast a crater there.
    for (const b of this.bombs) {
      b.y += BOMB_FALL
      const sx = b.wx - this.camera
      if (
        Math.abs(sx - this.roverX) < ROVER_HALF &&
        b.y > GROUND - this.alt - 26 &&
        b.y < GROUND - this.alt
      ) {
        this.crashRover('BOMBED FROM ABOVE')
        return
      }
      if (b.y >= GROUND) {
        b.y = H + 99
        this.sparks(sx, GROUND, '#fb923c', 14)
        this.sound.play('boom')
        if (
          !this.obstacles.some(
            (o) => o.kind === 'crater' && Math.abs(o.x + o.w / 2 - b.wx) < 26,
          )
        )
          this.obstacles.push(newOb('crater', b.wx - 14, 28))
      }
    }
    this.bombs = this.bombs.filter((b) => b.y < H)
    // Pursuers close in from behind; jump as one passes under the rover.
    for (const p of this.pursuers) {
      if (p.gone) continue
      p.x += this.speed + PURSUER_CLOSE
      const dx = p.x - this.wx
      if (!p.passed && Math.abs(dx) < ROVER_HALF + 7) {
        if (this.alt < 12) {
          this.crashRover('RUN DOWN FROM BEHIND')
          return
        }
      } else if (!p.passed && dx >= ROVER_HALF + 7) {
        p.passed = true
        if (this.alt > 0)
          this.addScore(CLOSE_SHAVE_POINTS, this.roverX, GROUND - 40)
      }
      if (p.x > this.camera + W + 40) p.gone = true
    }
    this.pursuers = this.pursuers.filter((p) => !p.gone)
  }

  private updatePebbles() {
    const rx = this.roverX
    for (const p of this.pebbles) {
      p.y += PEBBLE_SPEED
      p.x -= this.speed * 0.15
      const top = GROUND - 14 - this.alt
      if (
        Math.abs(p.x - rx) < ROVER_HALF &&
        p.y > top &&
        p.y < GROUND - this.alt
      ) {
        this.crashRover('HIT BY A PEBBLE')
        return
      }
      if (p.y >= GROUND) {
        p.y = H + 99
        this.sparks(p.x, GROUND, '#a8a29e', 6)
        // A pebble landing well ahead digs a little crater.
        const wx = p.x + this.camera
        if (
          wx > this.wx + 40 &&
          !this.obstacles.some((o) => Math.abs(o.x - wx) < 50)
        )
          this.obstacles.push(newOb('crater', wx - 8, 16))
      }
    }
    this.pebbles = this.pebbles.filter((p) => p.y < H)
  }

  private checkpoint() {
    const def = COURSE[this.level - 1]!
    const index = this.level - 1
    const par = def.par * 60
    const spare = Math.max(0, Math.round((par - this.sectionTicks) / 60))
    const bonus = CHECKPOINT_POINTS * this.level + spare * 100
    this.addScore(bonus, W / 2, 120)
    this.cheer(this.roverX, GROUND - 20, 24)
    this.cheer(
      this.sectionStart + this.sectionLen - this.camera,
      GROUND - 40,
      16,
    )
    this.sound.play('level')
    const sub =
      spare > 0 ? `${spare} SECONDS UNDER PAR  +${bonus}` : `+${bonus}`
    if (isOutpost(index)) {
      const data = checkpointReport(def.moon, {
        ticks: this.moonTicks,
        crashes: this.moonCrashes,
      })
      this.addScore(data.bonus, W / 2, 140)
      this.report = { data, ticks: REPORT_TICKS }
      this.moonTicks = 0
      this.moonCrashes = 0
    }
    if (this.level >= SECTION_COUNT) {
      this.won = true
      this.over = true
      this.addScore(FINISH_POINTS, W / 2, 130)
      this.sound.play('extra')
      this.banner = {
        text: 'RALLY COMPLETE!',
        sub: `THE FIVE MOONS ARE YOURS  +${FINISH_POINTS}`,
        ticks: 9999,
      }
      return
    }
    this.startSection(this.level + 1, false)
    this.banner = {
      text: `CHECKPOINT ${def.letter}!`,
      sub,
      ticks: 110,
    }
  }

  private crashRover(why: string) {
    if (this.crash > 0) return
    this.lives--
    this.moonCrashes++
    this.crash = CRASH_TICKS
    this.sparks(this.roverX, GROUND - 8 - this.alt, '#fb923c', 20)
    this.sparks(this.roverX, GROUND - 8 - this.alt, '#e2e8f0', 10)
    this.sound.play('die')
    this.banner = {
      text: 'CRASH!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: CRASH_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_AT * 2
      this.lives++
      this.cheer(this.roverX, GROUND - 16 - this.alt, 20)
      this.sound.play('extra')
    }
  }

  private sparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.8,
        life: 22 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  /** A cosmetic sparkle burst (its own rng: never the game's). */
  private cheer(x: number, y: number, count: number) {
    this.fx.burst(x, y, this.fxRng, { count })
  }

  private updateEffects() {
    this.fx.update()
    if (this.report && --this.report.ticks <= 0) this.report = null
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Zaps ahead and overhead whenever it can, jumps craters, mines and anything it cannot zap in
   * time, floors it on the way to a ramp, jumps shells, zig saucers and pursuers as they arrive,
   * and eases off when a pebble is about to land on it.
   */
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
    const jump = () => {
      held.up = true
      frame.pressed.up = true
    }
    if (this.tick % 5 === 0) {
      held.a = true
      frame.pressed.a = true
    }
    // A pebble coming down on the rover: change pace to slip out from under it.
    const rx = this.roverX
    const danger = this.pebbles.find(
      (p) => Math.abs(p.x - rx) < 22 && p.y > GROUND - 90 && p.y < GROUND - 10,
    )
    if (danger) {
      if (danger.x >= rx) held.left = true
      else held.right = true
    }
    const front = this.wx + ROVER_HALF
    // A ramp ahead wants full speed.
    const ramp = this.obstacles.find(
      (o) => o.kind === 'ramp' && !o.passed && o.x - front < 220,
    )
    if (ramp && !danger) held.right = true
    if (this.alt > 0) return frame
    // Something coming up behind passes under the rover: jump as it arrives.
    for (const p of this.pursuers) {
      const behind = this.wx - p.x
      if (!p.passed && behind > 24 && behind < 36) return (jump(), frame)
    }
    for (const s of this.shells) {
      const dist = s.x - this.wx
      if (dist > 30 && dist < 52) return (jump(), frame)
    }
    for (const sp of this.sprites) {
      if (sp.kind !== 'zig') continue
      const dist = sp.x - rx
      if (dist > 14 && dist < 54 && sp.y > ZIG_LOW - 10) return (jump(), frame)
    }
    for (const o of this.obstacles) {
      if (o.gone || o.passed) continue
      if (o.kind === 'crater') {
        // The gap behind a ramp is cleared by the ramp's own launch.
        const launch = this.obstacles.some(
          (r) =>
            r.kind === 'ramp' && !r.passed && Math.abs(r.x + r.w + 8 - o.x) < 1,
        )
        if (launch) continue
        const lead = this.speed * 6 + 4
        if (o.x - front < lead && o.x + o.w > this.wx - 4) {
          jump()
          break
        }
      } else if (o.kind === 'mine') {
        if (o.x - front < this.speed * 6 + 4 && o.x + 4 > this.wx - 4) {
          jump()
          break
        }
      } else if (o.kind === 'creeper') {
        // A full vine is a wall; a bud gets zapped.
        const dist = o.x - front
        if (o.t > CREEPER_GROW * 0.4 && dist > 0 && dist < this.speed * 9) {
          jump()
          break
        }
      } else if (o.kind === 'tank') {
        const dist = o.x - 12 - front
        if (dist > 0 && dist < 40 + this.speed * 6) {
          jump()
          break
        }
      } else if (o.kind === 'rock' || o.kind === 'big' || o.kind === 'roller') {
        const r = rockR(o)
        const dist = o.x - r - front
        // Too close to zap away in time (a big one needs two): jump it.
        const needed = (o.kind === 'big' ? 40 : 18) + this.speed * 6
        if (dist > 0 && dist < needed && (this.fwd || o.kind === 'big')) {
          jump()
          break
        }
      }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.renderGround(g)
    for (const o of this.obstacles)
      if (!o.gone && o.kind !== 'crater') this.renderOb(g, o)
    this.renderPost(g)
    this.renderRings(g)
    for (const sh of this.shells) this.renderShell(g, sh)
    for (const p of this.pursuers) this.renderPursuer(g, p)
    for (const b of this.bombs) this.renderBomb(g, b)
    for (const sp of this.sprites) this.renderSprite(g, sp)
    for (const p of this.pebbles) {
      glow(g, p.x, p.y - 3, 7, RAMPS.ember[3], 0.45)
      g.fillStyle = rgba(RAMPS.ember[3], 0.5)
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 7, 2, 3)
      drawSprite(g, PEBBLE_SPRITE, p.x, p.y)
    }
    if (this.fwd) {
      const x = Math.round(this.fwd.x - this.camera)
      const y = Math.round(this.fwd.y)
      glow(g, x, y, 10, RAMPS.gold[3], 0.6)
      g.fillStyle = rgba(RAMPS.gold[2], 0.55)
      g.fillRect(x - 10, y - 1, 7, 2)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(x - 4, y - 1, 8, 3)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 2, y, 5, 1)
    }
    for (const s of this.ups) {
      const x = Math.round(s.x - this.camera)
      const y = Math.round(s.y)
      glow(g, x, y, 8, RAMPS.teal[3], 0.55)
      g.fillStyle = rgba(RAMPS.teal[2], 0.5)
      g.fillRect(x - 1, y + 3, 2, 5)
      g.fillStyle = RAMPS.teal[3]
      g.fillRect(x - 1, y - 4, 3, 7)
      g.fillStyle = '#ffffff'
      g.fillRect(x, y - 3, 1, 5)
    }
    if (this.crash === 0 || this.crash > CRASH_TICKS - 8) this.renderRover(g)
    if (this.crash > CRASH_TICKS - 40) {
      const t = (CRASH_TICKS - this.crash) / 40
      const y = GROUND - 8 - this.alt
      glow(g, this.roverX, y, 12 + t * 34, RAMPS.ember[3], 0.8 * (1 - t))
      glow(g, this.roverX, y, 6 + t * 12, '#ffffff', 0.6 * (1 - t))
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
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
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // The banded night, the galaxy, the horizon glow and the blue world: painted once.
    cachedLayer(g, 'rover-ramble-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND, SKY_BANDS, 6)
      for (let i = 0; i < 9; i++) {
        const t = i / 8
        glow(
          k,
          10 + t * 190,
          50 + t * 70,
          26 - Math.abs(t - 0.5) * 14,
          i % 2 ? RAMPS.pink[2] : RAMPS.purple[3],
          0.16,
        )
      }
      glow(k, 110, GROUND, 190, RAMPS.pink[2], 0.22)
      const { x, y, r } = PLANET
      glow(k, x, y, r + 16, RAMPS.sky[3], 0.4)
      k.save()
      k.beginPath()
      k.arc(x, y, r, 0, Math.PI * 2)
      k.clip()
      bandedGradient(
        k,
        x - r,
        y - r,
        r * 2,
        r * 2,
        [RAMPS.water[4], RAMPS.water[3], RAMPS.water[2], RAMPS.water[1]],
        3,
      )
      // Continents, lit along their upper edges.
      const lands: [number, number, number, number][] = [
        [-14, -10, 9, 5],
        [-10, -6, 6, 7],
        [3, -2, 10, 4],
        [6, 2, 6, 6],
        [-6, 8, 7, 4],
      ]
      for (const [dx, dy, w, h] of lands) {
        k.fillStyle = RAMPS.leaf[2]
        k.fillRect(x + dx, y + dy, w, h)
        k.fillStyle = RAMPS.leaf[3]
        k.fillRect(x + dx, y + dy, w - 1, 1)
      }
      k.fillStyle = rgba(RAMPS.cream[4], 0.7)
      k.fillRect(x - 16, y - 2, 12, 1)
      k.fillRect(x + 2, y - 12, 9, 1)
      k.fillRect(x - 4, y + 13, 14, 1)
      // The night side, in two steps.
      k.fillStyle = rgba(INK, 0.35)
      k.beginPath()
      k.arc(x + r * 0.35, y + r * 0.3, r, 0, Math.PI * 2)
      k.fill()
      k.fillStyle = rgba(INK, 0.45)
      k.beginPath()
      k.arc(x + r * 0.7, y + r * 0.6, r, 0, Math.PI * 2)
      k.fill()
      k.restore()
      k.strokeStyle = RAMPS.sky[4]
      k.lineWidth = 1
      k.beginPath()
      k.arc(x, y, r - 0.5, Math.PI * 0.95, Math.PI * 1.55)
      k.stroke()
      shadedOrb(k, 196, HUD_H + 20, 5, RAMPS.cream, { glint: false })
    })
    // The stars creep by with the course; three ranges of mountains roll past faster.
    const drift = ((this.camera * 0.04) % W) + W
    g.save()
    g.translate(-Math.round(drift % W), 0)
    drawStars(g, STARS, this.tick, RAMPS.purple)
    g.translate(W, 0)
    drawStars(g, STARS, this.tick, RAMPS.purple)
    g.restore()
    for (const range of RANGES)
      scrollStrip(
        g,
        `rover-ramble-range-${range.key}`,
        range.top,
        GROUND - range.top,
        this.camera * range.rate,
        (k) => paintRange(k, range),
      )
  }

  private renderGround(g: CanvasRenderingContext2D) {
    scrollStrip(g, 'rover-ramble-track', GROUND, 16, this.camera, paintTrack)
    scrollStrip(
      g,
      'rover-ramble-foreground',
      GROUND + 16,
      H - GROUND - 16,
      this.camera * 1.5,
      paintForeground,
    )
    for (const o of this.obstacles) {
      if (o.kind !== 'crater' || o.gone) continue
      const sx = Math.round(o.x - this.camera)
      const w = Math.round(o.w)
      // The pit: ink edge, shadowed left wall, lit right wall, dark floor.
      CRATER_ROWS.forEach((colour, row) => {
        const inset = Math.round((row * 4) / 14)
        const left = sx + inset
        const right = sx + w - inset
        g.fillStyle = INK
        g.fillRect(left - 1, GROUND + row, right - left + 2, 1)
        g.fillStyle = colour
        g.fillRect(left, GROUND + row, right - left, 1)
        g.fillStyle = row < 10 ? DUST[3] : DUST[2]
        g.fillRect(right - 2, GROUND + row, 2, 1)
        g.fillStyle = DUST[0]
        g.fillRect(left, GROUND + row, 1, 1)
      })
      g.fillStyle = INK
      g.fillRect(sx + 3, GROUND + 14, w - 6, 1)
      // Raised lips either side, lit on top.
      for (const lx of [sx - 4, sx + w]) {
        g.fillStyle = INK
        g.fillRect(lx, GROUND - 3, 5, 1)
        g.fillRect(lx - 1, GROUND - 2, 7, 2)
        g.fillStyle = DUST[3]
        g.fillRect(lx, GROUND - 2, 5, 2)
        g.fillStyle = DUST[4]
        g.fillRect(lx + 1, GROUND - 2, 3, 1)
      }
    }
  }

  private renderOb(g: CanvasRenderingContext2D, o: Ob) {
    const sx = Math.round(o.x - this.camera)
    if (sx < -70 || sx > W + 70) return
    switch (o.kind) {
      case 'mine': {
        dropShadow(g, sx + 1, GROUND, 7, 2, 0.4)
        g.fillStyle = INK
        g.fillRect(sx - 6, GROUND - 6, 12, 6)
        g.fillStyle = RAMPS.steel[2]
        g.fillRect(sx - 5, GROUND - 5, 10, 4)
        g.fillStyle = RAMPS.steel[4]
        g.fillRect(sx - 4, GROUND - 5, 6, 1)
        // The blinking sparkle on top is its tell.
        if (Math.floor(this.tick / 10) % 2 === 0) {
          glow(g, sx, GROUND - 9, 8, RAMPS.ember[3], 0.6)
          g.fillStyle = RAMPS.ember[4]
          g.fillRect(sx - 1, GROUND - 9, 2, 3)
        }
        break
      }
      case 'tank': {
        const lifting = o.t > TANK_CYCLE - TANK_LIFT && o.t < TANK_CYCLE
        dropShadow(g, sx, GROUND, 14, 2, 0.45)
        g.fillStyle = INK
        g.fillRect(sx - 14, GROUND - 11, 28, 11)
        g.fillStyle = RAMPS.steel[1]
        g.fillRect(sx - 13, GROUND - 4, 26, 4)
        g.fillStyle = RAMPS.purple[2]
        g.fillRect(sx - 12, GROUND - 10, 24, 6)
        g.fillStyle = RAMPS.purple[4]
        g.fillRect(sx - 12, GROUND - 10, 24, 1)
        for (let i = 0; i < 4; i++) {
          g.fillStyle = RAMPS.steel[3]
          g.fillRect(
            sx - 11 + i * 6 + (Math.floor(this.tick / 4) % 2),
            GROUND - 3,
            3,
            2,
          )
        }
        // The turret and its barrel, which lifts before a shell goes out.
        g.fillStyle = INK
        g.fillRect(sx - 6, GROUND - 17, 13, 7)
        g.fillStyle = RAMPS.purple[3]
        g.fillRect(sx - 5, GROUND - 16, 11, 5)
        const lift = lifting ? 5 : 0
        g.fillStyle = INK
        g.fillRect(sx - 20, GROUND - 15 - lift, 15, 4)
        g.fillStyle = RAMPS.steel[3]
        g.fillRect(sx - 19, GROUND - 14 - lift, 13, 2)
        if (lifting)
          glow(g, sx - 20, GROUND - 15 - lift, 7, RAMPS.ember[3], 0.6)
        break
      }
      case 'creeper': {
        const h = vineHeight(o)
        dropShadow(g, sx, GROUND, 6, 2, 0.35)
        if (o.t < CREEPER_GROW * 0.4) {
          // A bud swelling at the root: the moment to zap it.
          const r = 3 + Math.floor(o.t / 8)
          shadedOrb(g, sx, GROUND - r, r, RAMPS.leaf)
          if (Math.floor(this.tick / 8) % 2 === 0)
            glow(g, sx, GROUND - r, r + 5, RAMPS.pink[3], 0.4)
        } else {
          g.fillStyle = INK
          g.fillRect(sx - 3, GROUND - h - 1, 6, h + 1)
          g.fillStyle = RAMPS.leaf[2]
          g.fillRect(sx - 2, GROUND - h, 4, h)
          g.fillStyle = RAMPS.leaf[4]
          g.fillRect(sx - 2, GROUND - h, 1, h)
          for (let y = 4; y < h; y += 6) {
            const side = (y / 6) % 2 ? 1 : -1
            g.fillStyle = RAMPS.leaf[3]
            g.fillRect(sx + (side > 0 ? 2 : -5), GROUND - y - 1, 3, 2)
          }
          g.fillStyle = RAMPS.pink[3]
          g.fillRect(sx - 2, GROUND - h - 2, 4, 3)
        }
        break
      }
      case 'devil': {
        for (let i = 0; i < 8; i++) {
          const y = GROUND - 3 - i * 4
          const sway = Math.round(
            Math.sin(this.tick / 4 + i * 0.9) * (2 + i * 0.4),
          )
          const w = 4 + i * 2
          g.fillStyle = rgba(DUST[3], 0.75)
          g.fillRect(sx - Math.floor(w / 2) + sway, y, w, 2)
          g.fillStyle = rgba(DUST[4], 0.8)
          g.fillRect(sx - Math.floor(w / 2) + sway, y, Math.max(1, w >> 2), 1)
        }
        break
      }
      case 'ramp': {
        dropShadow(g, sx + o.w / 2, GROUND, o.w / 2 + 2, 2, 0.35)
        for (let c = 0; c < o.w; c++) {
          const h = Math.max(1, Math.round((c / (o.w - 1)) * 10))
          g.fillStyle = INK
          g.fillRect(sx + c, GROUND - h - 1, 1, h + 1)
          g.fillStyle = STONE[2]
          g.fillRect(sx + c, GROUND - h, 1, h)
          g.fillStyle = STONE[4]
          g.fillRect(sx + c, GROUND - h, 1, 1)
        }
        g.fillStyle = HULL[3]
        for (let c = 6; c < o.w - 4; c += 8)
          g.fillRect(sx + c, GROUND - 3, 3, 1)
        break
      }
      default:
        this.renderRock(g, o)
    }
  }

  /** The target ring a bomber's bomb will land in, on the track ahead. */
  private renderRings(g: CanvasRenderingContext2D) {
    const rings = [
      ...this.sprites
        .filter((sp) => sp.kind === 'bomber' && !sp.dropped && sp.y > 0)
        .map((sp) => sp.targetWx),
      ...this.bombs.map((b) => b.wx),
    ]
    for (const wx of rings) {
      const sx = Math.round(wx - this.camera)
      if (sx < -20 || sx > W + 20) continue
      const pulse = Math.floor(this.tick / 6) % 2
      g.fillStyle = rgba(RAMPS.ember[3], pulse ? 0.9 : 0.5)
      g.fillRect(sx - 15, GROUND + 1, 30, 1)
      g.fillRect(sx - 12, GROUND + 3, 24, 1)
      g.fillRect(sx - 15, GROUND + 2, 2, 1)
      g.fillRect(sx + 13, GROUND + 2, 2, 1)
    }
  }

  private renderBomb(g: CanvasRenderingContext2D, b: Bomb) {
    const sx = Math.round(b.wx - this.camera)
    glow(g, sx, b.y, 8, RAMPS.ember[3], 0.4)
    g.fillStyle = INK
    g.fillRect(sx - 3, Math.round(b.y) - 3, 7, 7)
    g.fillStyle = RAMPS.steel[2]
    g.fillRect(sx - 2, Math.round(b.y) - 2, 5, 5)
    g.fillStyle = RAMPS.steel[4]
    g.fillRect(sx - 2, Math.round(b.y) - 2, 2, 2)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(sx, Math.round(b.y) - 5, 1, 2)
  }

  private renderShell(g: CanvasRenderingContext2D, s: Shell) {
    const sx = Math.round(s.x - this.camera)
    glow(g, sx, GROUND - 5, 8, RAMPS.ember[3], 0.5)
    g.fillStyle = INK
    g.fillRect(sx - 4, GROUND - 7, 9, 5)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(sx - 3, GROUND - 6, 7, 3)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(sx - 3, GROUND - 6, 3, 1)
  }

  /** A buggy coming up from behind: it faces right and passes under a jump. */
  private renderPursuer(g: CanvasRenderingContext2D, p: Pursuer) {
    const sx = Math.round(p.x - this.camera)
    if (sx < -30 || sx > W + 30) return
    dropShadow(g, sx, GROUND, 11, 2, 0.4)
    g.fillStyle = INK
    g.fillRect(sx - 12, GROUND - 11, 24, 8)
    g.fillStyle = RAMPS.purple[2]
    g.fillRect(sx - 11, GROUND - 10, 22, 6)
    g.fillStyle = RAMPS.purple[4]
    g.fillRect(sx - 11, GROUND - 10, 22, 1)
    g.fillStyle = INK
    g.fillRect(sx - 3, GROUND - 16, 10, 6)
    g.fillStyle = RAMPS.sky[3]
    g.fillRect(sx - 2, GROUND - 15, 8, 4)
    glow(g, sx + 14, GROUND - 7, 7, RAMPS.gold[3], 0.6)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(sx + 11, GROUND - 8, 3, 3)
    const spin = Math.floor(this.tick / 3) % 2
    for (const wx of [sx - 8, sx + 7]) {
      g.fillStyle = INK
      g.fillRect(wx - 3, GROUND - 6, 7, 7)
      g.fillStyle = spin ? RAMPS.steel[3] : RAMPS.steel[2]
      g.fillRect(wx - 2, GROUND - 5, 5, 5)
    }
  }

  /** The rear-view strip: a blip slides in as something closes from behind. */
  private renderRearView(g: CanvasRenderingContext2D) {
    hudPanel(g, 2, HUD_H + 3, 58, 13)
    drawText(g, 'REAR', 6, HUD_H + 6, { color: RAMPS.teal[4], outline: INK })
    g.fillStyle = INK
    g.fillRect(34, HUD_H + 8, 22, 3)
    g.fillStyle = RAMPS.night[3]
    g.fillRect(35, HUD_H + 9, 20, 1)
    g.fillStyle = HULL[3]
    g.fillRect(53, HUD_H + 7, 3, 5)
    for (const p of this.pursuers) {
      const behind = this.wx - p.x
      if (p.passed || behind > 330) continue
      const bx = 53 - Math.round(Math.max(0, behind / 330) * 18)
      if (behind > 120 || Math.floor(this.tick / 4) % 2 === 0) {
        glow(g, bx, HUD_H + 9.5, 6, RAMPS.pink[3], 0.7)
        g.fillStyle = RAMPS.pink[4]
        g.fillRect(bx - 1, HUD_H + 7, 3, 5)
      }
    }
  }

  /** The time board at an outpost: split against par and the stamps earned. */
  private renderReport(g: CanvasRenderingContext2D) {
    if (!this.report) return
    const r = this.report.data
    hudPanel(g, 60, 70, 200, 78)
    drawText(g, `${r.name} MOON OUTPOST`, W / 2, 76, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, `TIME ${r.seconds} S   PAR ${r.par} S`, W / 2, 90, {
      align: 'center',
      color: r.underPar ? RAMPS.leaf[4] : RAMPS.ember[4],
      outline: INK,
    })
    const stamps: [string, boolean][] = [
      ['UNDER PAR', r.underPar],
      ['NO SCRAPE', r.noScrape],
    ]
    stamps.forEach(([label, earned], i) => {
      drawText(g, `${earned ? '*' : '-'} ${label}`, 78, 106 + i * 12, {
        color: earned ? RAMPS.gold[4] : RAMPS.night[4],
        outline: INK,
      })
    })
    drawText(g, `BONUS +${r.bonus}`, W / 2, 134, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
  }

  private renderRock(g: CanvasRenderingContext2D, o: Ob) {
    const sx = o.x - this.camera
    const r = rockR(o)
    const cy = GROUND - r
    const roller = o.kind === 'roller'
    const ramp = roller ? RAMPS.earth : STONE
    dropShadow(g, sx + 2, GROUND, r + 3, 2, 0.45)
    if (roller) {
      // Dust kicked up behind a rolling boulder.
      for (let i = 0; i < 3; i++) {
        const age = (this.tick / 3 + i) % 3
        g.fillStyle = rgba(DUST[4], 0.45 - age * 0.13)
        const s = 2 + Math.floor(age)
        g.fillRect(
          Math.round(sx + r + 2 + age * 4),
          GROUND - 2 - s - Math.round(age),
          s,
          s,
        )
      }
    }
    shadedOrb(g, sx, cy, r, ramp)
    // Pits on the stone (they turn with a roller), each with a lit lower lip.
    const spin = roller ? -this.tick * 0.1 : 0.6
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI * 2) / 3
      const d = r * (i === 0 ? 0.25 : 0.55)
      const px = Math.round(sx + Math.cos(a) * d)
      const py = Math.round(cy + Math.sin(a) * d)
      g.fillStyle = ramp[0]
      g.fillRect(px, py, 2, 1)
      g.fillStyle = ramp[3]
      g.fillRect(px, py + 1, 2, 1)
    }
    // Rim light on the lit shoulder.
    g.strokeStyle = ramp[4]
    g.lineWidth = 1
    g.beginPath()
    g.arc(sx, cy, r - 0.5, Math.PI * 1.05, Math.PI * 1.45)
    g.stroke()
  }

  private renderPost(g: CanvasRenderingContext2D) {
    const sx = Math.round(this.sectionStart + this.sectionLen - this.camera)
    if (sx < -20 || sx > W + 20) return
    const letter = LETTERS[this.level - 1]!
    dropShadow(g, sx + 3, GROUND, 8, 2, 0.4)
    bevel(g, sx - 3, GROUND - 4, 8, 4, RAMPS.steel, { depth: 1 })
    bevel(g, sx, GROUND - 40, 3, 37, RAMPS.steel, { depth: 1 })
    // The pennant ripples a column at a time.
    for (let c = 0; c < 15; c++) {
      const dy = Math.round(Math.sin(this.tick / 7 - c * 0.5) * (c / 14) * 2)
      const x = sx + 3 + c
      const top = GROUND - 40 + dy
      g.fillStyle = INK
      g.fillRect(x, top - 1, 1, 14)
      if (c === 14) continue
      g.fillStyle = RAMPS.pink[2]
      g.fillRect(x, top, 1, 12)
      g.fillStyle = RAMPS.pink[3]
      g.fillRect(x, top, 1, 2)
      g.fillStyle = RAMPS.pink[4]
      g.fillRect(x, top, 1, 1)
      g.fillStyle = RAMPS.pink[1]
      g.fillRect(x, top + 10, 1, 2)
    }
    drawText(g, letter, sx + 10, GROUND - 37, {
      align: 'center',
      color: '#ffffff',
      outline: RAMPS.pink[0],
    })
    const pulse = 0.4 + 0.3 * Math.sin(this.tick / 8)
    glow(g, sx + 1, GROUND - 43, 12, RAMPS.gold[3], pulse)
    shadedOrb(g, sx + 1, GROUND - 43, 2.5, RAMPS.gold, { glint: false })
  }

  private renderSprite(g: CanvasRenderingContext2D, sp: Sprite) {
    const frame = Math.floor((this.tick + sp.phase * 10) / 6) % 2
    const tint =
      sp.kind === 'zig'
        ? RAMPS.ember[3]
        : sp.kind === 'bomber'
          ? RAMPS.gold[3]
          : RAMPS.purple[3]
    glow(g, sp.x, sp.y + 3, 14, tint, 0.35)
    drawSprite(g, frame ? SAUCER_SPRITES[1] : SAUCER_SPRITES[0], sp.x, sp.y, {
      flipX: sp.vx < 0,
    })
  }

  private renderRover(g: CanvasRenderingContext2D) {
    const x = Math.round(this.roverX)
    const y = Math.round(GROUND - this.alt)
    const grounded = this.alt === 0
    const bounce = grounded ? Math.floor(this.tick / 5) % 2 : 0
    // Its shadow stays on the dust, shrinking as it jumps.
    const lift = Math.min(1, this.alt / 40)
    dropShadow(g, x + 1, GROUND, 13 - lift * 6, 2, 0.45 - lift * 0.2)
    if (grounded) {
      // Dust thrown up behind the back wheel.
      for (let i = 0; i < 3; i++) {
        const age = (this.tick / 4 + i) % 3
        const s = 1 + Math.floor(age)
        g.fillStyle = rgba(DUST[4], 0.5 - age * 0.15)
        g.fillRect(
          Math.round(x - 13 - age * 5),
          y - 2 - s - Math.round(age * 1.5),
          s + 1,
          s,
        )
      }
    }
    const beacon = Math.floor(this.tick / 12) % 2
    if (beacon === 0) glow(g, x - 9, y - 23 - bounce, 8, RAMPS.ember[2], 0.6)
    drawSprite(g, ROVER_SPRITES[beacon]!, x - 12, y - 25 - bounce, {
      anchor: 'topleft',
    })
    const spin = Math.floor(this.wx / 4) % 2
    for (let i = 0; i < 3; i++) {
      const wx = x - 8 + i * 8
      const hop = grounded && (i + Math.floor(this.tick / 4)) % 3 === 0 ? 1 : 0
      drawSprite(g, WHEEL_SPRITES[spin]!, wx - 4, y - 7 - hop, {
        anchor: 'topleft',
      })
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // The console strip, with four boxes on it.
    bandedGradient(g, 0, 0, W, HUD_H, [RAMPS.night[2], RAMPS.night[0]], 2)
    g.fillStyle = INK
    g.fillRect(0, HUD_H - 1, W, 1)
    g.fillStyle = RAMPS.night[4]
    g.fillRect(0, HUD_H - 2, W, 1)
    hudPanel(g, 2, 2, 80, 19)
    drawText(g, String(this.score).padStart(6, '0'), 7, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Time against par, and the course gauge from this checkpoint to the next.
    hudPanel(g, 86, 2, 104, 19)
    const secs = Math.floor(this.sectionTicks / 60)
    const par = COURSE[this.level - 1]!.par
    drawText(g, `TIME ${secs}  PAR ${par}`, 92, 4, {
      color: secs <= par ? RAMPS.leaf[4] : RAMPS.ember[4],
      outline: INK,
    })
    const letter = LETTERS[this.level - 1]!
    const next = LETTERS[this.level] ?? '*'
    const progress = Math.min(
      1,
      (this.wx - this.sectionStart) / this.sectionLen,
    )
    drawText(g, letter, 91, 13, { color: RAMPS.teal[4], outline: INK })
    gauge(g, 100, 14, 76, 4, progress, RAMPS.pink)
    const mx = 100 + Math.round(76 * progress)
    g.fillStyle = INK
    g.fillRect(mx - 2, 12, 4, 3)
    g.fillStyle = HULL[3]
    g.fillRect(mx - 1, 12, 2, 2)
    drawText(g, next, 180, 13, { color: RAMPS.pink[3], outline: INK })
    hudPanel(g, 194, 2, 56, 19)
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++)
      drawSprite(g, LIFE_SPRITE, 199 + i * 12, 8, { anchor: 'topleft' })
    hudPanel(g, 254, 2, 64, 19)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `SECTION ${letter}`, W - 6, 13, {
      align: 'right',
      color: RAMPS.teal[4],
      outline: INK,
    })
    this.renderRearView(g)
    this.renderReport(g)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, this.report ? 42 : 84, {
        scale: 2,
        align: 'center',
        color: this.won ? RAMPS.gold[4] : '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, this.report ? 58 : 104, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const roverRamble: ArcadeGameModule = {
  create: (options) => new RoverRamble(options),
}

export const create = roverRamble.create
export default roverRamble

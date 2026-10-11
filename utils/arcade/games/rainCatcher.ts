// /utils/arcade/games/rainCatcher.ts
//
// Rain Catcher -- the Kind Robots Arcade's Missile Command riff (conductor
// kr-arcade/t-009 game factory, batch 3). Storm clouds drop hailstones toward
// six seedling beds. Steer the sight and pop rainbow umbrella bursts from the
// three sprout launchers: a burst blooms where the sight was and catches any
// hail that drifts into it. Hail that gets through makes a bed droop, and a
// second hit wilts it (or it soaks a launcher until the next wave).
//
// Each wave brings more and faster hail; from wave 2 hail can split in two
// and a grumpy thunder-goose flies across dropping more; from wave 5 zippy
// lightning sprites swerve around blooms. Unused umbrellas and saved beds pay
// a bonus between waves, and every 10,000 points a wilted bed grows back. The
// game ends when every bed has wilted.
//
// Arrows move the sight (it speeds up while held); A or B fires from the
// nearest launcher that still has umbrellas.

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
  drawStars,
  dropShadow,
  glow,
  hudPanel,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND = 214
const SKY_TOP = 16
const SIGHT_MIN_Y = 26
const SIGHT_MAX_Y = 196
const AMMO = 10
const SHOT_SPEED = 5
const BLOOM_GROW = 18
const BLOOM_HOLD = 10
const BLOOM_FADE = 14
const BLOOM_RADIUS = 16
const WAVE_CLEAR_TICKS = 170
const WAVE_READY_TICKS = 80
const END_TICKS = 200
const BONUS_BED_EVERY = 10_000
/** Hits a bed takes: the first makes it droop, the second wilts it. */
const BED_HEALTH = 2

const HAIL_POINTS = 25
const GOOSE_POINTS = 100
const SPRITE_POINTS = 125
const AMMO_BONUS = 5
const BED_BONUS = 100

/** Launchers left, middle, right; beds in the two gaps between them. */
const LAUNCHERS = [22, 160, 298]
const BEDS = [54, 86, 118, 202, 234, 266]

export const RAIN_CURVES = {
  /** Hailstones per wave (not counting splits or the goose's drops). */
  hail: { start: 10, step: 3, limit: 40 },
  /** Pixels per tick a hailstone falls (along its path). */
  speed: { start: 0.3, step: 0.06, limit: 1.1 },
  /** Hail in the air at once before the clouds hold back. */
  inFlight: { start: 4, step: 1, limit: 10 },
  /** Ticks between volleys. */
  volleyEvery: { start: 120, step: -8, limit: 50 },
  splitChance: { start: 0, step: 0.06, limit: 0.35 },
  geese: { start: 0, step: 1, limit: 3 },
  sprites: { start: -3, step: 1, limit: 4 },
} as const

type Hail = {
  x0: number
  y0: number
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  /** A lightning sprite: swerves around blooms. */
  sprite: boolean
  split: boolean
}
type Shot = {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  from: number
}
type Bloom = { x: number; y: number; t: number }
type Goose = { x: number; y: number; vx: number; dropTimer: number }
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

/** Stormy dusk: deep indigo overhead, warming to a violet-rose horizon behind the hills. */
const SKY_BANDS = [
  '#0a0820',
  RAMPS.night[1],
  RAMPS.night[2],
  '#2c2866',
  '#46357a',
  '#6a3f7e',
  '#8a4c7c',
]
const STORM: Ramp = ['#100e26', '#2a284f', '#3e3e6e', '#5f6092', '#9093c2']
const STORM_FAR: Ramp = ['#0c0a20', '#1a183c', '#262452', '#36346c', '#4c4c88']
const ICE: Ramp = ['#24406e', '#4a7fb8', '#9cd0f0', '#dff4ff', '#ffffff']
const DROOP: Ramp = ['#2f3a12', '#5c6b1e', '#8f9a3a', '#c4c86a', '#eef0b8']
/** The six umbrella colours, red to violet, as shading ramps. */
const RAINBOW_RAMPS: readonly Ramp[] = [
  ['#4a0d1a', '#a3172f', '#e8383d', '#f87171', '#fecaca'],
  RAMPS.rust,
  RAMPS.gold,
  RAMPS.leaf,
  RAMPS.sky,
  RAMPS.purple,
]

function rampPalette(ramp: Ramp): Record<string, string> {
  return {
    '0': ramp[0],
    '1': ramp[1],
    '2': ramp[2],
    '3': ramp[3],
    '4': ramp[4],
  }
}

/**
 * A sphere (or the part of one inside the w x h box) as shade digits '0'..'4', lit from the upper
 * left the way 16-bit sprite artists shaded a ball.
 */
function sphereRows(
  w: number,
  h: number,
  cx: number,
  cy: number,
  r: number,
): string[] {
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - cx) / r
      const ny = (y + 0.5 - cy) / r
      const d2 = nx * nx + ny * ny
      if (d2 > 1) {
        row += '.'
        continue
      }
      const light = -0.45 * nx - 0.55 * ny + 0.7 * Math.sqrt(1 - d2)
      row +=
        light > 0.9
          ? '4'
          : light > 0.62
            ? '3'
            : light > 0.3
              ? '2'
              : light > 0
                ? '1'
                : '0'
    }
    rows.push(row)
  }
  return rows
}

/** Hailstones: an icy ball, with a frost glint that winks as it tumbles. */
const HAIL_BODY = sphereRows(5, 5, 2.5, 2.5, 2.7)
const HAIL_SPRITES = [
  pixelSprite(HAIL_BODY, rampPalette(ICE)),
  pixelSprite(
    HAIL_BODY.map((row, y) =>
      y === 3 ? row.slice(0, 3) + '4' + row.slice(4) : row,
    ),
    rampPalette(ICE),
  ),
] as const

/** A zippy lightning sprite, flickering between two charges. */
const BOLT_ROWS = [
  '...hhY.',
  '..hYYy.',
  '.hYxYx.',
  'hYYYYYy',
  '..YYYy.',
  '..hYy..',
  '.hYy...',
  '.Yy....',
  'y......',
]
const BOLT_SPRITES = [
  pixelSprite(BOLT_ROWS, {
    h: RAMPS.gold[4],
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    x: INK,
  }),
  pixelSprite(BOLT_ROWS, {
    h: '#ffffff',
    Y: RAMPS.gold[3],
    y: RAMPS.rust[3],
    x: INK,
  }),
] as const

/** The grumpy thunder-goose, facing right: wings up, wings down. */
const GOOSE_PALETTE = {
  W: RAMPS.cream[3],
  w: RAMPS.cream[2],
  g: RAMPS.steel[3],
  G: RAMPS.steel[2],
  d: RAMPS.steel[1],
  n: '#2a3048',
  N: RAMPS.steel[1],
  e: '#ffffff',
  x: INK,
  o: RAMPS.rust[3],
  O: RAMPS.rust[2],
  f: RAMPS.rust[2],
}
const GOOSE_SPRITES = [
  pixelSprite(
    [
      '.....WW...........',
      '....WWwg......nn..',
      '....Wwwg.....nxxn.',
      '.....wgG.....nNeNo',
      '..wWWWwwwwwwwnNNoO',
      'wWWWWWWWWWWwwwn...',
      '.gwwwwwwwwwwwwg...',
      '..ggGGGGGGGGGg....',
      '....GGdddddG......',
      '.....f...f........',
    ],
    GOOSE_PALETTE,
  ),
  pixelSprite(
    [
      '..................',
      '..............nn..',
      '.............nxxn.',
      '.............nNeNo',
      '..wWWWwwwwwwwnNNoO',
      'wWWWWgGGWWWwwwn...',
      '.gwwwgGGdwwwwwg...',
      '..ggGGgGdGGGGg....',
      '....GGGddddG......',
      '.....fGd.f........',
    ],
    GOOSE_PALETTE,
  ),
] as const

/** The three seedlings of a bed, composited into one sprite, the top rows nudged to sway. */
function bedRows(
  seedlings: readonly (readonly string[])[],
  shifts: readonly number[],
): string[] {
  const h = Math.max(...seedlings.map((s) => s.length))
  const grid = Array.from({ length: h }, () => new Array<string>(21).fill('.'))
  seedlings.forEach((rows, i) => {
    const pad = h - rows.length
    rows.forEach((row, r) => {
      const shift = r < 3 ? shifts[i]! : 0
      for (let c = 0; c < row.length; c++) {
        const ch = row[c]!
        if (ch !== '.') grid[r + pad]![i * 7 + 1 + c + shift] = ch
      }
    })
  })
  return grid.map((row) => row.join(''))
}

const SPROUT = ['HL.Ll', 'LlsLd', '.dsd.', '..s..', '..S..', '..S..']
const BUD_SPROUT = [
  '..P..',
  'HLpLl',
  'LlsLd',
  '.dsd.',
  '..s..',
  '..S..',
  '..S..',
]
const SPROUT_PALETTE = {
  H: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
  s: RAMPS.leaf[2],
  S: RAMPS.leaf[1],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
}
/** BED_SPRITES[sway frame]: a growing bed's seedlings. */
const BED_SPRITES = [
  pixelSprite(bedRows([SPROUT, BUD_SPROUT, SPROUT], [0, 1, 0]), SPROUT_PALETTE),
  pixelSprite(bedRows([SPROUT, BUD_SPROUT, SPROUT], [1, 0, 1]), SPROUT_PALETTE),
] as const
const WILTING = ['.....', '.sss.', 'Yy..s', 'yY..s', '.d..S', '....S']
const DROOP_SPRITE = pixelSprite(
  bedRows([WILTING, WILTING, WILTING], [0, 0, 0]),
  {
    Y: DROOP[3],
    y: DROOP[2],
    s: DROOP[2],
    S: DROOP[1],
    d: DROOP[1],
  },
)
const WILTED_SPRITE = pixelSprite(
  ['.gGGg...gGGg...gGg.', 'dddgg..ddggd..ddgd.'],
  { g: RAMPS.steel[2], G: RAMPS.steel[3], d: RAMPS.steel[1] },
)

/** A sprout launcher: a smiling terracotta pot under a leafy dome (the barrel is drawn apart). */
const LAUNCHER_ROWS = [
  ...sphereRows(18, 6, 9, 6.5, 6),
  'eddddddddddddddddc',
  'cccccccccccccccccb',
  '.dccccccccccccccb.',
  '.dcccckcccckccccb.',
  '..dccpckcckcpccb..',
  '..dccccckkcccccb..',
  '...bbbbbbbbbbbb...',
]
const LAUNCHER_SPRITE = pixelSprite(LAUNCHER_ROWS, {
  ...rampPalette(RAMPS.leaf),
  b: RAMPS.rust[1],
  c: RAMPS.rust[2],
  d: RAMPS.rust[3],
  e: RAMPS.rust[4],
  k: INK,
  p: RAMPS.pink[3],
})
const SOAKED_SPRITE = pixelSprite(LAUNCHER_ROWS, {
  ...rampPalette(RAMPS.steel),
  b: RAMPS.water[0],
  c: RAMPS.water[1],
  d: RAMPS.water[2],
  e: RAMPS.water[3],
  k: INK,
  p: RAMPS.water[3],
})

const FAR_HILLS = ridge(17, W, 26, 4)
const NEAR_HILLS = ridge(43, W, 12, 4)
const STARS = starField(97, 40, W, 140)
const DRIZZLE = (() => {
  const rand = backdropRng(83)
  return Array.from({ length: 44 }, () => ({
    x: rand() * W,
    y: rand() * GROUND,
    speed: 1.4 + rand() * 1.2,
    len: 2 + Math.floor(rand() * 3),
  }))
})()
/** Where the storm's lightning lights the cloud deck from inside, in turn. */
const FLASHES = (() => {
  const rand = backdropRng(71)
  return Array.from({ length: 7 }, () => 30 + rand() * (W - 60))
})()
const FLASH_EVERY = 260

/** Clouds for one wrapping strip of the storm deck. */
function deckClouds(
  seed: number,
  count: number,
  y: number,
  size: number,
): { x: number; y: number; size: number }[] {
  const rand = backdropRng(seed)
  return Array.from({ length: count }, (_, i) => ({
    x: (W / count) * i + rand() * 14,
    y: y + rand() * 5,
    size: size + rand() * 3,
  }))
}
const DECKS = [
  {
    key: 'rain-catcher-deck-far',
    h: 38,
    speed: 0.05,
    ramp: STORM_FAR,
    top: 8,
    clouds: deckClouds(61, 8, 10, 10),
  },
  {
    key: 'rain-catcher-deck-near',
    h: 42,
    speed: 0.13,
    ramp: STORM,
    top: 0,
    clouds: deckClouds(67, 9, 19, 7.5),
  },
] as const

/** A canvas painted once (null headless, where the caller paints straight onto the screen). */
function bakeCanvas(
  w: number,
  h: number,
  paint: (k: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const k = canvas.getContext('2d')
  if (!k) return null
  paint(k)
  return canvas
}

const strips = new Map<string, HTMLCanvasElement | null>()

/** A screen-wide strip baked once, then scrolled sideways and wrapped (a parallax layer). */
function scrollStrip(
  g: CanvasRenderingContext2D,
  key: string,
  h: number,
  offset: number,
  paint: (k: CanvasRenderingContext2D) => void,
) {
  let canvas = strips.get(key)
  if (canvas === undefined) {
    canvas = bakeCanvas(W, h, paint)
    strips.set(key, canvas)
  }
  const x = -Math.round(((offset % W) + W) % W)
  g.save()
  g.imageSmoothingEnabled = false
  for (const dx of [x, x + W]) {
    if (canvas) {
      g.drawImage(canvas, dx, 0)
    } else {
      g.save()
      g.translate(dx, 0)
      paint(g)
      g.restore()
    }
  }
  g.restore()
}

class RainCatcher implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private sightX = W / 2
  private sightY = 110
  private held = 0
  /** Each bed's health: BED_HEALTH growing, 1 drooping, 0 wilted. */
  private beds: number[] = BEDS.map(() => BED_HEALTH)
  private ammo: number[] = LAUNCHERS.map(() => AMMO)
  private soaked: boolean[] = LAUNCHERS.map(() => false)
  private hail: Hail[] = []
  private shots: Shot[] = []
  private blooms: Bloom[] = []
  private geese: Goose[] = []
  private toRelease = 0
  private geeseLeft = 0
  private spritesLeft = 0
  private volleyTimer = 0
  private ready = WAVE_READY_TICKS
  private clear = 0
  private ending = 0
  private nextBonusBed = BONUS_BED_EVERY
  private bonusBeds = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(37)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startWave(1)
  }

  /** Beds still growing (the cabinet shows these as lives). */
  get lives(): number {
    return this.beds.filter((b) => b > 0).length
  }

  private get multiplier(): number {
    return Math.min(6, 1 + Math.floor((this.level - 1) / 2))
  }

  // --- waves -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.ammo = LAUNCHERS.map(() => AMMO)
    this.soaked = LAUNCHERS.map(() => false)
    this.hail = []
    this.shots = []
    this.blooms = []
    this.geese = []
    this.toRelease = Math.round(levelCurve(wave, RAIN_CURVES.hail))
    this.geeseLeft = Math.round(levelCurve(wave, RAIN_CURVES.geese))
    this.spritesLeft = Math.max(
      0,
      Math.round(levelCurve(wave, RAIN_CURVES.sprites)),
    )
    this.volleyTimer = 30
    this.ready = WAVE_READY_TICKS
    this.banner = {
      text: `WAVE ${wave}`,
      sub:
        this.multiplier > 1 ? `${this.multiplier}X POINTS` : 'CATCH THE HAIL',
      ticks: WAVE_READY_TICKS,
    }
  }

  /** Something on the ground for a hailstone to aim at: a growing bed or a launcher. */
  private pickTarget(): { x: number; y: number } {
    const targets: number[] = []
    BEDS.forEach((x, i) => {
      if (this.beds[i]! > 0) targets.push(x)
    })
    LAUNCHERS.forEach((x, i) => {
      if (!this.soaked[i]) targets.push(x)
    })
    if (!targets.length) targets.push(...BEDS)
    const x = targets[Math.floor(this.rng() * targets.length)]!
    return { x: x + (this.rng() - 0.5) * 6, y: GROUND - 4 }
  }

  /** A hailstone (or lightning sprite) falling from (x0, y0) at something on the ground. */
  private makeHail(x0: number, y0: number, sprite = false): Hail {
    const t = this.pickTarget()
    const speed =
      levelCurve(this.level, RAIN_CURVES.speed) * (sprite ? 1.25 : 1)
    const dx = t.x - x0
    const dy = t.y - y0
    const d = Math.hypot(dx, dy) || 1
    return {
      x0,
      y0,
      x: x0,
      y: y0,
      tx: t.x,
      ty: t.y,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      sprite,
      split: false,
    }
  }

  private launchHail(x0: number, y0: number, sprite = false) {
    this.hail.push(this.makeHail(x0, y0, sprite))
  }

  private release() {
    const cap = Math.round(levelCurve(this.level, RAIN_CURVES.inFlight))
    if (--this.volleyTimer > 0) return
    this.volleyTimer = Math.round(
      levelCurve(this.level, RAIN_CURVES.volleyEvery),
    )
    let volley = 1 + Math.floor(this.rng() * 3)
    while (volley-- > 0 && this.toRelease > 0 && this.hail.length < cap) {
      this.toRelease--
      this.launchHail(8 + this.rng() * (W - 16), SKY_TOP + 2)
    }
    if (this.spritesLeft > 0 && this.rng() < 0.35) {
      this.spritesLeft--
      this.launchHail(8 + this.rng() * (W - 16), SKY_TOP + 2, true)
    }
    if (this.geeseLeft > 0 && !this.geese.length && this.rng() < 0.3) {
      this.geeseLeft--
      const fromLeft = this.rng() < 0.5
      this.geese.push({
        x: fromLeft ? -12 : W + 12,
        y: 48 + this.rng() * 40,
        vx: (fromLeft ? 1 : -1) * (0.45 + this.level * 0.04),
        dropTimer: 60,
      })
      this.sound.play('warn')
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.ending > 0) {
      if (--this.ending === 0) this.over = true
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.moveSight(controls)
    if (this.clear > 0) {
      if (--this.clear === 0) this.startWave(this.level + 1)
      return
    }
    if (this.ready > 0) {
      this.ready--
      return
    }
    if (controls.pressed.a || controls.pressed.b) this.fire()
    this.release()
    this.updateGeese()
    this.updateShots()
    this.updateBlooms()
    this.updateHail()
    if (!this.beds.some((b) => b > 0)) {
      this.ending = END_TICKS
      this.banner = {
        text: 'THE GARDEN IS SOAKED',
        sub: 'GAME OVER',
        ticks: 9999,
      }
      this.sound.play('die')
      return
    }
    const quiet =
      !this.toRelease &&
      !this.hail.length &&
      !this.geese.length &&
      !this.geeseLeft &&
      !this.spritesLeft &&
      !this.shots.length &&
      !this.blooms.length
    if (quiet) this.waveClear()
  }

  private moveSight(input: InputFrame) {
    const dx = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0)
    const dy = (input.held.down ? 1 : 0) - (input.held.up ? 1 : 0)
    if (!dx && !dy) {
      this.held = 0
      return
    }
    // Held longer, the sight glides faster.
    this.held++
    const speed = Math.min(4.5, 1.6 + this.held * 0.09)
    const len = Math.hypot(dx, dy)
    this.sightX = Math.max(6, Math.min(W - 6, this.sightX + (dx / len) * speed))
    this.sightY = Math.max(
      SIGHT_MIN_Y,
      Math.min(SIGHT_MAX_Y, this.sightY + (dy / len) * speed),
    )
  }

  private fire() {
    // The nearest launcher that still has an umbrella.
    let best = -1
    for (let i = 0; i < LAUNCHERS.length; i++) {
      if (this.soaked[i] || this.ammo[i]! <= 0) continue
      if (
        best < 0 ||
        Math.abs(LAUNCHERS[i]! - this.sightX) <
          Math.abs(LAUNCHERS[best]! - this.sightX)
      )
        best = i
    }
    if (best < 0) {
      this.sound.play('blip')
      return
    }
    this.ammo[best]!--
    const x = LAUNCHERS[best]!
    const y = GROUND - 10
    const dx = this.sightX - x
    const dy = this.sightY - y
    const d = Math.hypot(dx, dy) || 1
    const speed = SHOT_SPEED + (best === 1 ? 1.5 : 0)
    this.shots.push({
      x,
      y,
      tx: this.sightX,
      ty: this.sightY,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      from: best,
    })
    this.sound.play('shoot')
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      if ((s.tx - s.x) * s.vx + (s.ty - s.y) * s.vy <= 0) {
        this.blooms.push({ x: s.tx, y: s.ty, t: 0 })
        this.fx.burst(s.tx, s.ty, this.fxRng, { count: 5, speed: 1.2 })
        s.vx = 0
        s.vy = 0
      }
    }
    this.shots = this.shots.filter((s) => s.vx !== 0 || s.vy !== 0)
  }

  private bloomRadius(b: Bloom): number {
    if (b.t < BLOOM_GROW) return (BLOOM_RADIUS * b.t) / BLOOM_GROW
    if (b.t < BLOOM_GROW + BLOOM_HOLD) return BLOOM_RADIUS
    return (
      (BLOOM_RADIUS * (BLOOM_GROW + BLOOM_HOLD + BLOOM_FADE - b.t)) / BLOOM_FADE
    )
  }

  private updateBlooms() {
    for (const b of this.blooms) b.t++
    this.blooms = this.blooms.filter(
      (b) => b.t < BLOOM_GROW + BLOOM_HOLD + BLOOM_FADE,
    )
    for (const b of this.blooms) {
      const r = this.bloomRadius(b)
      for (const h of this.hail) {
        if (Math.hypot(h.x - b.x, h.y - b.y) > r) continue
        this.catchHail(h)
      }
      for (const goose of this.geese) {
        if (Math.hypot(goose.x - b.x, goose.y - b.y) > r + 6) continue
        goose.vx = 0
        this.addScore(GOOSE_POINTS * this.multiplier, goose.x, goose.y - 10)
        this.burst(goose.x, goose.y, 14, '#e5e7eb')
        this.fx.burst(goose.x, goose.y, this.fxRng, { count: 16, speed: 2.2 })
        this.sound.play('pop')
      }
      this.geese = this.geese.filter((goose) => goose.vx !== 0)
    }
    this.hail = this.hail.filter((h) => h.vy !== 0 || h.vx !== 0)
  }

  private catchHail(h: Hail) {
    if (h.vx === 0 && h.vy === 0) return
    h.vx = 0
    h.vy = 0
    const points = (h.sprite ? SPRITE_POINTS : HAIL_POINTS) * this.multiplier
    this.addScore(points, h.x, h.y - 8)
    this.burst(h.x, h.y, 6, h.sprite ? '#fde047' : '#e0f2fe')
    this.fx.burst(h.x, h.y, this.fxRng, {
      count: h.sprite ? 12 : 6,
      colours: h.sprite
        ? [RAMPS.gold[4], RAMPS.gold[3], '#ffffff']
        : [ICE[3], RAMPS.teal[3], RAMPS.gold[4]],
    })
    this.sound.play('pop')
  }

  private updateGeese() {
    for (const goose of this.geese) {
      goose.x += goose.vx
      if (--goose.dropTimer <= 0 && goose.x > 20 && goose.x < W - 20) {
        goose.dropTimer = 70 + Math.floor(this.rng() * 50)
        this.launchHail(goose.x, goose.y + 6)
      }
    }
    this.geese = this.geese.filter((goose) => goose.x > -20 && goose.x < W + 20)
  }

  private updateHail() {
    const splitChance = levelCurve(this.level, RAIN_CURVES.splitChance)
    const born: Hail[] = []
    for (const h of this.hail) {
      if (h.sprite) this.swerve(h)
      h.x += h.vx
      h.y += h.vy
      // Midway down, a stone may split in two (once).
      if (
        !h.split &&
        !h.sprite &&
        h.y > 70 &&
        h.y < 130 &&
        this.rng() < splitChance / 60
      ) {
        h.split = true
        const child = this.makeHail(h.x, h.y)
        child.split = true
        born.push(child)
      }
      if (h.y >= h.ty) this.land(h)
    }
    this.hail = [...this.hail, ...born].filter((h) => h.vx !== 0 || h.vy !== 0)
  }

  /** A lightning sprite sidesteps a bloom in its way. */
  private swerve(h: Hail) {
    const near = this.blooms.find(
      (b) => Math.hypot(h.x - b.x, h.y + 10 - b.y) < BLOOM_RADIUS + 14,
    )
    if (!near) return
    const away = Math.sign(h.x - near.x) || 1
    h.x += away * 1.2
    // Re-aim at the target from the new spot.
    const dx = h.tx - h.x
    const dy = h.ty - h.y
    const d = Math.hypot(dx, dy) || 1
    const speed = Math.hypot(h.vx, h.vy)
    h.vx = (dx / d) * speed
    h.vy = (dy / d) * speed
  }

  private land(h: Hail) {
    h.vx = 0
    h.vy = 0
    const bed = BEDS.findIndex((x) => Math.abs(x - h.x) < 12)
    const launcher = LAUNCHERS.findIndex((x) => Math.abs(x - h.x) < 12)
    if (bed >= 0 && this.beds[bed]! > 0) {
      this.beds[bed]!--
      this.burst(h.x, GROUND - 4, 14, '#93c5fd')
      this.sound.play(this.beds[bed] ? 'warn' : 'boom')
    } else if (launcher >= 0 && !this.soaked[launcher]) {
      this.soaked[launcher] = true
      this.ammo[launcher] = 0
      this.burst(h.x, GROUND - 6, 12, '#93c5fd')
      this.sound.play('boom')
    } else {
      this.burst(h.x, GROUND - 2, 4, '#bfdbfe')
    }
  }

  private waveClear() {
    const umbrellas = this.ammo.reduce((sum, a) => sum + a, 0)
    const beds = this.lives
    const bonus = (umbrellas * AMMO_BONUS + beds * BED_BONUS) * this.multiplier
    this.addScore(bonus, W / 2, 120)
    // A drooping bed perks up between waves; bonus beds regrow wilted ones.
    this.beds = this.beds.map((b) => (b > 0 ? BED_HEALTH : 0))
    let regrown = 0
    while (this.bonusBeds > 0) {
      const wilted = this.beds.findIndex((b) => b === 0)
      if (wilted < 0) break
      this.beds[wilted] = BED_HEALTH
      this.fx.burst(BEDS[wilted]!, GROUND - 8, this.fxRng, {
        count: 16,
        colours: [RAMPS.leaf[3], RAMPS.leaf[4], RAMPS.pink[3]],
      })
      this.bonusBeds--
      regrown++
    }
    BEDS.forEach((x, i) => {
      if (this.beds[i]! > 0)
        this.fx.burst(x, GROUND - 8, this.fxRng, {
          count: 5,
          speed: 1.1,
          colours: [RAMPS.leaf[4], RAMPS.gold[4], RAMPS.pink[3]],
        })
    })
    this.clear = WAVE_CLEAR_TICKS
    this.banner = {
      text: 'WAVE CLEAR!',
      sub: regrown ? `BONUS ${bonus}  A BED GROWS BACK` : `BONUS ${bonus}`,
      ticks: WAVE_CLEAR_TICKS,
    }
    this.sound.play(regrown ? 'extra' : 'level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    while (this.score >= this.nextBonusBed) {
      this.nextBonusBed += BONUS_BED_EVERY
      this.bonusBeds++
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.3,
        life: 16 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Aims ahead of the most urgent hailstone and fires once the sight is on it. */
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
    const covered = (x: number, y: number) =>
      this.blooms.some(
        (b) =>
          b.t < BLOOM_GROW + BLOOM_HOLD && Math.hypot(b.x - x, b.y - y) < 14,
      ) || this.shots.some((s) => Math.hypot(s.tx - x, s.ty - y) < 14)
    const threats = this.hail
      .map((h) => ({ h, eta: (h.ty - h.y) / Math.max(0.01, h.vy) }))
      .sort((a, b) => a.eta - b.eta)
    for (const { h } of threats) {
      // Lead the stone by the time a burst would take to get there and bloom.
      let px = h.x
      let py = h.y
      for (let i = 0; i < 3; i++) {
        const launcher = LAUNCHERS.reduce((a, b) =>
          Math.abs(a - px) < Math.abs(b - px) ? a : b,
        )
        const t =
          Math.hypot(px - launcher, py - (GROUND - 10)) / SHOT_SPEED +
          BLOOM_GROW * 0.6
        px = h.x + h.vx * t
        py = h.y + h.vy * t
      }
      if (py > SIGHT_MAX_Y || py < SIGHT_MIN_Y + 10 || covered(px, py)) continue
      const dx = px - this.sightX
      const dy = py - this.sightY
      if (dx < -2) held.left = true
      if (dx > 2) held.right = true
      if (dy < -2) held.up = true
      if (dy > 2) held.down = true
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && this.tick % 6 === 0)
        frame.pressed.a = true
      return frame
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.renderGround(g)
    for (const goose of this.geese) this.renderGoose(g, goose)
    this.hail.forEach((h, i) => this.renderHail(g, h, i))
    for (const s of this.shots) this.renderShot(g, s)
    for (const b of this.blooms) this.renderBloom(g, b)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
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
    if (!this.over && this.ending === 0) this.renderSight(g)
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // The banded dusk, the rosy horizon and the moon: painted once.
    cachedLayer(g, 'rain-catcher-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND, SKY_BANDS, 6)
      glow(k, W / 2, GROUND - 16, 170, RAMPS.pink[2], 0.2)
      glow(k, 262, 58, 30, RAMPS.cream[3], 0.35)
      shadedOrb(k, 262, 58, 9, RAMPS.cream, { outline: null, glint: false })
      k.fillStyle = RAMPS.cream[2]
      k.fillRect(264, 60, 2, 2)
      k.fillRect(259, 56, 1, 1)
      k.fillRect(266, 54, 1, 1)
    })
    drawStars(g, STARS, this.tick, RAMPS.purple)
    // The storm deck: a far bank of cloud, lightning flickering inside it, a nearer bank.
    const [far, near] = DECKS
    this.renderDeck(g, far)
    const phase = this.tick % FLASH_EVERY
    if (phase < 12 && phase % 6 < 3) {
      const x = FLASHES[Math.floor(this.tick / FLASH_EVERY) % FLASHES.length]!
      glow(g, x, 16, 50, RAMPS.purple[4], 0.55)
      glow(g, x, 18, 18, '#ffffff', 0.4)
    }
    this.renderDeck(g, near)
    // A soft drizzle falls everywhere the umbrellas are not.
    g.fillStyle = rgba(ICE[3], 0.22)
    for (const d of DRIZZLE) {
      const y = ((d.y + this.tick * d.speed) % (GROUND - 30)) + 26
      const x = (((d.x - this.tick * d.speed * 0.2) % W) + W) % W
      g.fillRect(Math.round(x), Math.round(y), 1, d.len)
    }
    // Hills behind the garden, the far ones drifting slower.
    drawRidge(g, FAR_HILLS, {
      base: GROUND - 22,
      bottom: GROUND,
      width: W,
      offset: this.tick * 0.03,
      fill: '#2a2458',
      rim: '#4a3f86',
    })
    drawRidge(g, NEAR_HILLS, {
      base: GROUND - 3,
      bottom: GROUND,
      width: W,
      offset: this.tick * 0.08,
      fill: '#173a3c',
      rim: '#2f6158',
    })
  }

  private renderDeck(
    g: CanvasRenderingContext2D,
    deck: (typeof DECKS)[number],
  ) {
    scrollStrip(g, deck.key, deck.h, this.tick * deck.speed, (k) => {
      if (deck.top)
        bandedGradient(k, 0, 0, W, deck.top, [deck.ramp[0], deck.ramp[1]], 2)
      for (const c of deck.clouds) {
        // Each cloud also paints a screen-width away, so the strip wraps seamlessly.
        for (const dx of [-W, 0, W])
          drawCloud(k, c.x + dx, c.y, c.size, deck.ramp)
      }
    })
  }

  private renderGround(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'rain-catcher-ground', W, H, (k) => {
      bandedGradient(
        k,
        0,
        GROUND,
        W,
        H - GROUND,
        [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
        3,
      )
      k.fillStyle = INK
      k.fillRect(0, GROUND - 1, W, 1)
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(0, GROUND, W, 4)
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(0, GROUND, W, 2)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(0, GROUND, W, 1)
      const rand = backdropRng(53)
      for (let x = 0; x < W; x += 3) {
        const tall = rand()
        k.fillStyle = RAMPS.leaf[2]
        if (tall > 0.45) k.fillRect(x, GROUND - 2, 1, 2)
        k.fillStyle = RAMPS.leaf[3]
        if (tall > 0.8) k.fillRect(x + 1, GROUND - 3, 1, 3)
        k.fillStyle = RAMPS.leaf[0]
        k.fillRect(x + 1, GROUND + 4, 1, 1)
        k.fillStyle = rand() < 0.5 ? RAMPS.earth[3] : RAMPS.earth[0]
        k.fillRect(
          x + Math.floor(rand() * 3),
          GROUND + 6 + Math.floor(rand() * 18),
          1,
          1,
        )
      }
      // Stepping stones on the paths between the beds and launchers.
      for (const x of [38, 70, 102, 134, 186, 218, 250, 282]) {
        bevel(k, x - 3, GROUND + 15, 7, 4, RAMPS.steel, { depth: 1 })
      }
    })
    BEDS.forEach((x, i) => this.renderBed(g, x, i))
    LAUNCHERS.forEach((x, i) => this.renderLauncher(g, x, i))
  }

  private renderBed(g: CanvasRenderingContext2D, x: number, i: number) {
    const health = this.beds[i]!
    // A raised planter of lit boards with dark soil on top.
    dropShadow(g, x + 2, GROUND + 3, 13, 2, 0.4)
    bevel(g, x - 11, GROUND - 4, 22, 6, RAMPS.earth, { depth: 1 })
    g.fillStyle = RAMPS.earth[0]
    g.fillRect(x - 10, GROUND - 4, 20, 2)
    g.fillStyle = RAMPS.earth[1]
    g.fillRect(x - 10, GROUND - 1, 20, 1)
    g.fillRect(x - 6, GROUND - 3, 1, 1)
    g.fillRect(x + 4, GROUND - 3, 1, 1)
    if (health === 0) {
      // Wilted: flattened grey stalks in a puddle.
      g.fillStyle = rgba(RAMPS.water[2], 0.8)
      g.fillRect(x - 12, GROUND - 5, 24, 2)
      g.fillStyle = RAMPS.water[3]
      g.fillRect(
        x - 10 + (Math.floor(this.tick / 30) % 3) * 3,
        GROUND - 5,
        6,
        1,
      )
      g.fillStyle = '#ffffff'
      g.fillRect(x + 6, GROUND - 5, 2, 1)
      drawSprite(g, WILTED_SPRITE, x, GROUND - 3, { anchor: 'feet' })
      return
    }
    // Seedlings sway (each bed on its own beat); drooping ones bow and go pale.
    const sprite =
      health < BED_HEALTH
        ? DROOP_SPRITE
        : BED_SPRITES[(Math.floor(this.tick / 24) + i) % 2]!
    drawSprite(g, sprite, x, GROUND - 2, { anchor: 'feet' })
  }

  private renderLauncher(g: CanvasRenderingContext2D, x: number, i: number) {
    const soaked = this.soaked[i]
    const ammo = this.ammo[i]!
    dropShadow(g, x + 2, GROUND + 1, 12, 2, 0.45)
    // The leafy barrel tracks the sight: a shaded vector stalk (pixel sprites never rotate).
    const px = x
    const py = GROUND - 9
    const a = Math.atan2(this.sightY - py, this.sightX - px)
    const tx = px + Math.cos(a) * 11
    const ty = py + Math.sin(a) * 11
    const ramp = soaked ? RAMPS.steel : RAMPS.leaf
    g.lineCap = 'round'
    for (const [width, colour, off] of [
      [5, INK, 0],
      [3, ramp[1], 0],
      [1, ramp[3], -0.6],
    ] as const) {
      g.lineWidth = width
      g.strokeStyle = colour
      g.beginPath()
      g.moveTo(px + off, py + off)
      g.lineTo(tx + off, ty + off)
      g.stroke()
    }
    g.lineCap = 'butt'
    g.lineWidth = 1
    if (!soaked && ammo > 0) {
      glow(g, tx, ty, 7, RAMPS.gold[3], 0.35)
      shadedOrb(g, tx, ty, 2, RAINBOW_RAMPS[(ammo - 1) % RAINBOW_RAMPS.length]!)
    }
    drawSprite(g, soaked ? SOAKED_SPRITE : LAUNCHER_SPRITE, x, GROUND + 1, {
      anchor: 'feet',
    })
    // Umbrellas left, in a recessed tray in the soil.
    g.fillStyle = INK
    g.fillRect(x - 11, GROUND + 2, 22, 11)
    g.fillStyle = RAMPS.earth[0]
    g.fillRect(x - 10, GROUND + 3, 20, 9)
    for (let k = 0; k < ammo; k++) {
      const pr = RAINBOW_RAMPS[k % RAINBOW_RAMPS.length]!
      const bx = x - 9 + (k % 5) * 4
      const by = GROUND + 4 + Math.floor(k / 5) * 4
      g.fillStyle = pr[1]
      g.fillRect(bx, by, 3, 3)
      g.fillStyle = pr[2]
      g.fillRect(bx, by, 2, 2)
      g.fillStyle = pr[4]
      g.fillRect(bx, by, 1, 1)
    }
    if (soaked) {
      // Drips run off the soaked pot.
      for (let d = 0; d < 2; d++) {
        const fall = (this.tick + d * 17 + i * 11) % 34
        g.fillStyle = RAMPS.water[3]
        g.fillRect(x - 6 + d * 11, GROUND - 6 + Math.floor(fall / 4), 1, 2)
      }
      if (Math.floor(this.tick / 20) % 2 === 0)
        drawText(g, 'SOAKED', x, GROUND - 32, {
          align: 'center',
          color: RAMPS.water[3],
          outline: INK,
        })
    }
  }

  private renderGoose(g: CanvasRenderingContext2D, goose: Goose) {
    const flap = Math.floor(this.tick / 8) % 2
    const dir = Math.sign(goose.vx) || 1
    // A little storm cloud trails it, drizzling.
    const cx = goose.x - dir * 13
    const cy = goose.y + 6
    g.fillStyle = rgba(ICE[3], 0.6)
    for (let d = 0; d < 3; d++) {
      const fall = (this.tick + d * 5) % 12
      g.fillRect(Math.round(cx - 3 + d * 3), Math.round(cy + 3 + fall), 1, 2)
    }
    drawCloud(g, cx, cy, 3.5, STORM)
    drawSprite(g, GOOSE_SPRITES[flap]!, goose.x, goose.y - 1, {
      flipX: dir < 0,
    })
  }

  private renderHail(g: CanvasRenderingContext2D, h: Hail, i: number) {
    // The streak it leaves (the classic trail), brightening toward the stone.
    const colour = h.sprite ? RAMPS.gold[3] : ICE[3]
    const trail = g.createLinearGradient(h.x0, h.y0, h.x, h.y)
    trail.addColorStop(0, rgba(colour, 0))
    trail.addColorStop(1, rgba(colour, 0.55))
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = trail
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(h.x0, h.y0)
    g.lineTo(h.x, h.y)
    g.stroke()
    g.restore()
    const frame = (Math.floor(this.tick / 5) + i) % 2
    if (h.sprite) {
      glow(g, h.x, h.y, 12, RAMPS.gold[2], 0.4)
      drawSprite(g, BOLT_SPRITES[frame]!, h.x, h.y, { flipX: h.vx < 0 })
      return
    }
    glow(g, h.x, h.y, 6, ICE[3], 0.35)
    drawSprite(g, HAIL_SPRITES[frame]!, h.x, h.y)
  }

  private renderShot(g: CanvasRenderingContext2D, s: Shot) {
    // A glowing seed arcing up from its launcher, its target winking where it will bloom.
    const fx = LAUNCHERS[s.from]!
    const fy = GROUND - 10
    const trail = g.createLinearGradient(fx, fy, s.x, s.y)
    trail.addColorStop(0, rgba(RAMPS.pink[2], 0))
    trail.addColorStop(1, rgba(RAMPS.gold[3], 0.7))
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = trail
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(fx, fy)
    g.lineTo(s.x, s.y)
    g.stroke()
    g.restore()
    if (Math.floor(this.tick / 4) % 2 === 0) {
      const mx = Math.round(s.tx)
      const my = Math.round(s.ty)
      g.fillStyle = INK
      for (let d = -2; d <= 2; d++) {
        g.fillRect(mx + d - 1, my + d - 1, 3, 3)
        g.fillRect(mx + d - 1, my - d - 1, 3, 3)
      }
      g.fillStyle = RAMPS.pink[3]
      for (let d = -2; d <= 2; d++) {
        g.fillRect(mx + d, my + d, 1, 1)
        g.fillRect(mx + d, my - d, 1, 1)
      }
    }
    glow(g, s.x, s.y, 8, RAMPS.gold[3], 0.6)
    shadedOrb(g, s.x, s.y, 2.5, RAMPS.gold)
  }

  private renderBloom(g: CanvasRenderingContext2D, b: Bloom) {
    const r = this.bloomRadius(b)
    if (r <= 0.5) return
    // A rainbow umbrella popping open, seen from below: six shaded panels around a knob,
    // spinning slowly, with a flash of colour-math light as it blooms.
    glow(g, b.x, b.y, r * 2, RAMPS.pink[3], 0.32)
    if (b.t < 8) glow(g, b.x, b.y, r * 1.4, '#ffffff', 0.6 * (1 - b.t / 8))
    const disc = (radius: number) => {
      g.beginPath()
      g.arc(b.x, b.y, radius, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = INK
    disc(r + 1)
    const spin = b.t * 0.06 + (b.x + b.y) * 0.1
    const step = (Math.PI * 2) / RAINBOW_RAMPS.length
    RAINBOW_RAMPS.forEach((ramp, i) => {
      const a0 = spin + i * step
      const mid = a0 + step / 2
      // Panels facing the light (upper left) are lit; the far side falls into shadow.
      const lit = -0.7 * Math.cos(mid) - 0.7 * Math.sin(mid)
      const shade = lit > 0.35 ? 3 : lit > -0.35 ? 2 : 1
      const bands: [number, string][] = [
        [r, ramp[shade - 1]!],
        [r - 1.5, ramp[shade]!],
        [r * 0.55, ramp[shade + 1]!],
      ]
      for (const [radius, colour] of bands) {
        if (radius <= 0) continue
        g.fillStyle = colour
        g.beginPath()
        g.moveTo(b.x, b.y)
        g.arc(b.x, b.y, radius, a0, a0 + step)
        g.closePath()
        g.fill()
      }
    })
    // Ribs between the panels.
    g.strokeStyle = rgba(INK, 0.7)
    g.lineWidth = 1
    g.beginPath()
    for (let i = 0; i < RAINBOW_RAMPS.length; i++) {
      const a = spin + i * step
      g.moveTo(b.x, b.y)
      g.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r)
    }
    g.stroke()
    if (r >= 4) shadedOrb(g, b.x, b.y, 1.5, RAMPS.cream, { glint: false })
  }

  private renderSight(g: CanvasRenderingContext2D) {
    const x = Math.round(this.sightX)
    const y = Math.round(this.sightY)
    const k = 5 + (Math.floor(this.tick / 10) % 2)
    glow(g, x, y, 10, RAMPS.gold[3], 0.2)
    // Corner brackets and cross ticks, ink-outlined.
    const marks: [number, number, number, number][] = [
      [-k, -k, 3, 1],
      [-k, -k, 1, 3],
      [k - 2, -k, 3, 1],
      [k, -k, 1, 3],
      [-k, k, 3, 1],
      [-k, k - 2, 1, 3],
      [k - 2, k, 3, 1],
      [k, k - 2, 1, 3],
      [-10, 0, 4, 1],
      [7, 0, 4, 1],
      [0, -10, 1, 4],
      [0, 7, 1, 4],
    ]
    g.fillStyle = INK
    for (const [dx, dy, w, h] of marks)
      g.fillRect(x + dx - 1, y + dy - 1, w + 2, h + 2)
    g.fillStyle = RAMPS.gold[3]
    for (const [dx, dy, w, h] of marks) g.fillRect(x + dx, y + dy, w, h)
    g.fillStyle = INK
    g.fillRect(x - 1, y - 1, 3, 3)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x, y, 1, 1)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score (and the multiplier beside it) top left; high score and wave top right.
    const score = String(this.score).padStart(6, '0')
    const scoreW = measureText(score, 2) + 10
    hudPanel(g, 4, 3, scoreW, 20)
    drawText(g, score, 9, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    if (this.multiplier > 1) {
      const mult = `${this.multiplier}X`
      hudPanel(g, scoreW + 8, 3, measureText(mult) + 10, 13, RAMPS.rust)
      drawText(g, mult, scoreW + 13, 6, {
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const wave = `WAVE ${this.level}`
    const sideW = Math.max(measureText(hi), measureText(wave)) + 12
    hudPanel(g, W - 4 - sideW, 3, sideW, 22)
    drawText(g, hi, W - 10, 6, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, wave, W - 10, 15, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 92, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 112, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const rainCatcher: ArcadeGameModule = {
  create: (options) => new RainCatcher(options),
}

export const create = rainCatcher.create
export default rainCatcher

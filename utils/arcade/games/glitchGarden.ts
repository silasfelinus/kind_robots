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
// Arrows move the sprayer around the flowerbed; A (or B) sprays. One beam at a
// time, so get close to fire faster.

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
  dropShadow,
  drawSprite,
  glow,
  hudPanel,
  mix,
  pixelSprite,
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

const HEAD_POINTS = 100
const BODY_POINTS = 10
const BLOOM_POINTS = 1
const MOTH_POINTS = 200

export const GARDEN_CURVES = {
  /** Pixels per tick the worm crawls (always divides the 8px cell). */
  speed: { start: 1, step: 0.5, limit: 2 },
  length: { start: 12, step: 0, limit: 12 },
  /** Extra one-segment heads that come with the worm. */
  looseHeads: { start: -1, step: 1, limit: 5 },
  lamps: { start: 34, step: 3, limit: 55 },
  beetleEvery: { start: 900, step: -90, limit: 360 },
} as const

type Obstacle = { hp: number; kind: 'lamp' | 'sprout' }
/** A worm: the head leads, and segment k sits k * spacing steps back along its trail. */
type Worm = {
  /** The head's past positions, newest first. */
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  /** Down until the flowerbed floor, then back up and down within the bed. */
  dy: 1 | -1
}
type Beetle = { x: number; y: number; vx: number; vy: number; turn: number }
type Moth = { x: number; y: number; hp: number }
type Flower = { col: number; row: number; color: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const FLOWER_COLORS = [
  '#f9a8d4',
  '#fde047',
  '#c4b5fd',
  '#fdba74',
  '#86efac',
  '#67e8f9',
]

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const LAWN_TOP = HUD
const BED_Y = HUD + BED_TOP * CELL

/** The glitch-lamps' magenta, and the HUD's deep hedge green. */
const FUCHSIA: Ramp = ['#3a0a48', '#7a1a8a', '#c026d3', '#e879f9', '#fdf4ff']
const HEDGE: Ramp = ['#05140b', '#0b2a17', '#15472a', '#3a8a52', '#a7f3b0']

const LAWN_BANDS = [
  mix(RAMPS.night[1], RAMPS.leaf[0], 0.35),
  mix(RAMPS.night[1], RAMPS.leaf[0], 0.7),
  RAMPS.leaf[0],
  mix(RAMPS.leaf[0], RAMPS.leaf[1], 0.3),
]
const SOIL_BANDS = [RAMPS.earth[1], mix(RAMPS.earth[1], RAMPS.earth[0], 0.7)]

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

const LAMP_PALETTE = {
  H: FUCHSIA[4],
  L: FUCHSIA[3],
  P: FUCHSIA[2],
  p: FUCHSIA[1],
  d: FUCHSIA[0],
  c: RAMPS.teal[3],
  s: RAMPS.cream[3],
  S: RAMPS.cream[1],
}
/** Flickering: the cap lights up a step and the glitch spots go white. */
const LAMP_FLICKER = {
  ...LAMP_PALETTE,
  L: FUCHSIA[4],
  P: FUCHSIA[3],
  p: FUCHSIA[2],
  c: '#ffffff',
}
/** One mushroom lamp per hp left (index 1..4): the cap is sprayed away. */
const LAMP_ROWS: readonly (readonly string[])[] = [
  [],
  ['......', '......', '..Lp..', '..dd..', '..sS..', '..sS..'],
  ['......', '..LP..', '.LcPp.', '.dppd.', '..sS..', '..sS..'],
  ['.LLP..', 'LHcPp.', 'LPPPcp', 'dpppd.', '..sS..', '..sS..'],
  ['.LLPP.', 'LHcPPp', 'LPPPcp', 'dpppdd', '..sS..', '..sS..'],
]
const LAMP_SPRITES = LAMP_ROWS.map((rows) =>
  rows.length ? pixelSprite(rows, LAMP_PALETTE) : null,
)
const LAMP_FLICKER_SPRITES = LAMP_ROWS.map((rows) =>
  rows.length ? pixelSprite(rows, LAMP_FLICKER) : null,
)

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
  pixelSprite(
    ['......', '......', '..HL..', '..ld..', '..s...', '..s...'],
    SPROUT_PALETTE,
  ),
  pixelSprite(
    ['......', '..HL..', 'Lld...', '.dsLl.', '..sd..', '..s...'],
    SPROUT_PALETTE,
  ),
  pixelSprite(
    ['..HL..', '..ld..', 'LLs.Hl', '.dsLld', '..sd..', '..s...'],
    SPROUT_PALETTE,
  ),
] as const

/** A four-petal bloom per flower colour, shaded from its own hue. */
const FLOWER_SPRITES = new Map<string, PixelSprite>(
  FLOWER_COLORS.map((c) => [
    c,
    pixelSprite(['..HP..', '..Pp..', 'HPyYPp', 'Ppoypd', '..Pp..', '..pd..'], {
      H: mix(c, '#ffffff', 0.55),
      P: c,
      p: mix(c, INK, 0.35),
      d: mix(c, INK, 0.6),
      y: RAMPS.gold[3],
      Y: RAMPS.gold[4],
      o: RAMPS.gold[2],
    }),
  ]),
)

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
const SEGMENT_SPRITES = SEGMENT_ROWS.map((rows) =>
  pixelSprite(rows, rampPalette(RAMPS.purple)),
)
/** A glitching segment flickers into teal. */
const GLITCH_SPRITES = SEGMENT_ROWS.map((rows) =>
  pixelSprite(rows, rampPalette(RAMPS.teal)),
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
  pixelSprite(rows, {
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
  pixelSprite(['.l...l....', ...BEETLE_BODY, '...l...l..'], BEETLE_PALETTE),
  pixelSprite(['...l...l..', ...BEETLE_BODY, '.l...l....'], BEETLE_PALETTE),
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
const MOTH_SPRITES = MOTH_ROWS.map((rows) => pixelSprite(rows, MOTH_PALETTE))
/** Sprayed once: it flushes hot pink. */
const MOTH_HURT_SPRITES = MOTH_ROWS.map((rows) =>
  pixelSprite(rows, {
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
  pixelSprite([...SPRAYER_BODY, 'gGgGgGgGg', '.k.k.k.k.'], SPRAYER_PALETTE),
  pixelSprite([...SPRAYER_BODY, 'GgGgGgGgG', 'k.k.k.k.k'], SPRAYER_PALETTE),
] as const
const LIFE_SPRITE = pixelSprite(
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
  private beam: { x: number; y: number } | null = null
  private beetle: Beetle | null = null
  private beetleTimer = 0
  private moth: Moth | null = null
  private speed = 1
  private dead = 0
  private clear = 0
  private nextExtra = EXTRA_EVERY
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
    this.hiScore = options.hiScore
    this.plantLamps(Math.round(levelCurve(1, GARDEN_CURVES.lamps)))
    this.startWave(1)
  }

  private get spacing(): number {
    return Math.round(CELL / this.speed)
  }

  private idx(col: number, row: number): number {
    return row * COLS + col
  }

  private at(col: number, row: number): Obstacle | null {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
    return this.grid[this.idx(col, row)]!
  }

  private plantLamps(count: number) {
    for (let tries = 0; tries < count * 6 && count > 0; tries++) {
      const col = Math.floor(this.rng() * COLS)
      // Fewer lamps in the flowerbed, none on the top row.
      const row = 1 + Math.floor(this.rng() * (ROWS - 2))
      if (row >= BED_TOP && this.rng() < 0.7) continue
      if (this.at(col, row)) continue
      this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
      count--
    }
  }

  // --- waves -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.speed = levelCurve(wave, GARDEN_CURVES.speed)
    this.worms = []
    const length = Math.round(levelCurve(wave, GARDEN_CURVES.length))
    this.spawnWorm(Math.floor(COLS / 2) * CELL, length, 1)
    const loose = Math.max(
      0,
      Math.round(levelCurve(wave, GARDEN_CURVES.looseHeads)),
    )
    for (let i = 0; i < loose; i++)
      this.spawnWorm(
        Math.floor(this.rng() * COLS) * CELL,
        1,
        this.rng() < 0.5 ? 1 : -1,
      )
    this.beetleTimer = Math.round(levelCurve(wave, GARDEN_CURVES.beetleEvery))
    this.banner = {
      text: `WAVE ${wave}`,
      sub: 'FIX THE GLITCH-WORM',
      ticks: 80,
    }
  }

  private spawnWorm(x: number, segments: number, dx: 1 | -1) {
    // A worm enters at the top, its body trailing off the screen above.
    const trail: Array<{ x: number; y: number }> = []
    for (let i = 0; i < segments * this.spacing + 1; i++)
      trail.push({ x, y: HUD - Math.floor(i / this.spacing) * CELL - CELL })
    trail[0] = { x, y: HUD }
    this.worms.push({ trail, segments, dx, dy: 1 })
  }

  private segmentPos(w: Worm, k: number): { x: number; y: number } {
    return w.trail[Math.min(w.trail.length - 1, k * this.spacing)]!
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.dead > 0) {
      if (--this.dead === 0) this.afterDeath()
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.startWave(this.level + 1)
      return
    }
    this.moveSprayer(controls)
    if ((controls.held.a || controls.held.b) && !this.beam)
      this.beam = { x: this.px, y: this.py - 6 }
    this.updateBeam()
    this.moveWorms()
    this.updateBeetle()
    this.updateMoth()
    this.checkHits()
    if (!this.worms.length && this.dead === 0) {
      this.clear = WAVE_CLEAR_TICKS
      this.banner = { text: 'WAVE FIXED!', ticks: WAVE_CLEAR_TICKS }
      this.sound.play('level')
    }
  }

  private moveSprayer(input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= SPRAYER_SPEED
    if (input.held.right) dx += SPRAYER_SPEED
    if (input.held.up) dy -= SPRAYER_SPEED
    if (input.held.down) dy += SPRAYER_SPEED
    const minY = HUD + BED_TOP * CELL + 4
    const maxY = H - 5
    const nx = Math.max(4, Math.min(W - 4, this.px + dx))
    if (!this.blocked(nx, this.py)) this.px = nx
    const ny = Math.max(minY, Math.min(maxY, this.py + dy))
    if (!this.blocked(this.px, ny)) this.py = ny
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

  private updateBeam() {
    const beam = this.beam
    if (!beam) return
    // Step in short hops so it can't skip a lamp.
    for (let s = 0; s < BEAM_SPEED; s += 4) {
      beam.y -= 4
      if (beam.y < HUD) {
        this.beam = null
        return
      }
      const col = Math.floor(beam.x / CELL)
      const row = Math.floor((beam.y - HUD) / CELL)
      if (
        this.hitWorm(beam.x, beam.y) ||
        this.hitMoth(beam.x, beam.y) ||
        this.hitBeetle(beam.x, beam.y)
      ) {
        this.beam = null
        return
      }
      const ob = this.at(col, row)
      if (ob) {
        this.beam = null
        this.water(col, row, ob)
        return
      }
    }
  }

  /** A lamp or sprout sprayed: once it's had enough, it blooms into a flower. */
  private water(col: number, row: number, ob: Obstacle) {
    ob.hp--
    this.sound.play('blip')
    if (ob.hp > 0) {
      this.fx.burst(col * CELL + 4, HUD + row * CELL + 3, this.fxRng, {
        count: 3,
        speed: 0.9,
        colours: [RAMPS.water[3], RAMPS.water[4], RAMPS.teal[3]],
      })
      return
    }
    this.grid[this.idx(col, row)] = null
    this.flowers.push({
      col,
      row,
      color: FLOWER_COLORS[Math.floor(this.rng() * FLOWER_COLORS.length)]!,
    })
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
  }

  private hitWorm(x: number, y: number): boolean {
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y < HUD) continue
        if (x < p.x || x >= p.x + CELL || y < p.y || y >= p.y + CELL) continue
        this.fixSegment(w, k)
        return true
      }
    }
    return false
  }

  /** A fixed segment drops out as a sprout; the worm splits around it. */
  private fixSegment(w: Worm, k: number) {
    const p = this.segmentPos(w, k)
    const col = Math.floor((p.x + CELL / 2) / CELL)
    const row = Math.floor((p.y - HUD + CELL / 2) / CELL)
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS && !this.at(col, row))
      this.grid[this.idx(col, row)] = { hp: SPROUT_HP, kind: 'sprout' }
    this.addScore(k === 0 ? HEAD_POINTS : BODY_POINTS, p.x + 4, p.y)
    this.burst(p.x + 4, p.y + 4, 8, k === 0 ? '#f0abfc' : '#a5f3fc')
    this.fx.burst(p.x + 4, p.y + 4, this.fxRng, {
      count: k === 0 ? 12 : 6,
      colours: [RAMPS.purple[4], RAMPS.teal[3], RAMPS.pink[3]],
    })
    this.sound.play('pop')
    this.worms = this.worms.filter((o) => o !== w)
    if (k > 0)
      this.worms.push({
        ...w,
        segments: k,
        trail: w.trail.slice(0, k * this.spacing + 1),
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
      })
    }
  }

  private moveWorms() {
    for (const w of this.worms) {
      for (let s = 0; s < this.speed; s++) this.stepWorm(w)
    }
  }

  /** One pixel along: across the row, and down a row at a lamp or the edge. */
  private stepWorm(w: Worm) {
    const head = w.trail[0]!
    let { x, y } = head
    if (x % CELL === 0 && (y - HUD) % CELL === 0) {
      const col = x / CELL
      const row = (y - HUD) / CELL
      const nextCol = col + w.dx
      const blocked =
        nextCol < 0 || nextCol >= COLS || this.at(nextCol, row) !== null
      if (blocked) {
        // Turn: down a row (or up again, once it's bouncing in the flowerbed).
        if (row + w.dy >= ROWS) w.dy = -1
        else if (w.dy < 0 && row + w.dy < BED_TOP) w.dy = 1
        w.dx = (w.dx * -1) as 1 | -1
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

  private trimTrail(w: Worm) {
    const keep = w.segments * this.spacing + 1
    if (w.trail.length > keep) w.trail.length = keep
  }

  private updateBeetle() {
    if (this.level >= 2 && !this.beetle && --this.beetleTimer <= 0) {
      this.beetleTimer = Math.round(
        levelCurve(this.level, GARDEN_CURVES.beetleEvery),
      )
      const fromLeft = this.rng() < 0.5
      this.beetle = {
        x: fromLeft ? -6 : W + 6,
        y: HUD + (BED_TOP + 1) * CELL,
        vx: (fromLeft ? 1 : -1) * (0.8 + this.level * 0.05),
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
    // It nibbles any lamp it scuttles over.
    const col = Math.floor(b.x / CELL)
    const row = Math.floor((b.y - HUD) / CELL)
    const ob = this.at(col, row)
    if (ob && this.rng() < 0.05) this.grid[this.idx(col, row)] = null
    if (b.x < -10 || b.x > W + 10) this.beetle = null
  }

  private hitBeetle(x: number, y: number): boolean {
    const b = this.beetle
    if (!b || Math.abs(b.x - x) > 7 || Math.abs(b.y - y) > 6) return false
    // Closer to the sprayer pays more.
    const gap = this.py - b.y
    const points = gap < 16 ? 900 : gap < 40 ? 600 : 300
    this.addScore(points, b.x, b.y - 8)
    this.burst(b.x, b.y, 12, '#fde047')
    this.fx.burst(b.x, b.y, this.fxRng, { count: 14, speed: 2 })
    this.sound.play('pop')
    this.beetle = null
    return true
  }

  private updateMoth() {
    if (!this.moth && this.level >= 2) {
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

  private hitMoth(x: number, y: number): boolean {
    const m = this.moth
    if (!m || Math.abs(m.x - x) > 5 || Math.abs(m.y - y) > 6) return false
    m.hp--
    this.sound.play('blip')
    if (m.hp > 0) return true
    this.addScore(MOTH_POINTS, m.x, m.y - 8)
    this.burst(m.x, m.y, 10, '#e9d5ff')
    this.fx.burst(m.x, m.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.purple[4], RAMPS.pink[3], RAMPS.gold[4]],
    })
    this.sound.play('pop')
    this.moth = null
    return true
  }

  private checkHits() {
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (
          Math.abs(p.x + 4 - this.px) < 6 &&
          Math.abs(p.y + 4 - this.py) < 6
        ) {
          this.lose()
          return
        }
      }
    }
    const b = this.beetle
    if (b && Math.abs(b.x - this.px) < 7 && Math.abs(b.y - this.py) < 6)
      this.lose()
    const m = this.moth
    if (m && Math.abs(m.x - this.px) < 6 && Math.abs(m.y - this.py) < 6)
      this.lose()
  }

  private lose() {
    this.lives--
    this.dead = DEATH_TICKS
    this.beam = null
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    this.banner = { text: 'SPRAYER DOWN', ticks: DEATH_TICKS }
  }

  /** After a lost sprayer, half-sprayed lamps perk back up (and pay a little). */
  private afterDeath() {
    if (this.lives <= 0) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
      return
    }
    for (const ob of this.grid) {
      if (ob && ob.hp < (ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP)) {
        ob.hp = ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP
        this.addScore(5, W / 2, H / 2)
      }
    }
    // The worms start the wave over from the top, the same lengths.
    const lengths = this.worms.map((w) => w.segments)
    this.worms = []
    lengths.forEach((n, i) =>
      this.spawnWorm(((i * 7 + 15) % COLS) * CELL, n, i % 2 ? -1 : 1),
    )
    this.beetle = null
    this.moth = null
    this.px = W / 2
    this.py = HUD + (ROWS - 2) * CELL
    // Clear a spot to stand in.
    for (let c = 13; c <= 16; c++)
      for (let r = ROWS - 3; r < ROWS; r++) this.grid[this.idx(c, r)] = null
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 100)
      this.floaters.push({ x, y, text: String(points), life: 36 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_EVERY
      this.lives++
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
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
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
    // Danger close: get away from it first.
    const threats: Array<{ x: number; y: number }> = []
    if (this.beetle) threats.push(this.beetle)
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
    if (target) {
      if (target.x < this.px - 2) held.left = true
      if (target.x > this.px + 2) held.right = true
    }
    // Hang near the bottom of the bed.
    if (this.py < H - 14) held.down = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGarden(g)
    for (const f of this.flowers) {
      const sprite = FLOWER_SPRITES.get(f.color)
      if (sprite)
        drawSprite(g, sprite, f.col * CELL + 4, HUD + f.row * CELL + 4)
    }
    this.renderFireflies(g)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ob = this.at(c, r)
        if (ob) this.renderObstacle(g, c, r, ob)
      }
    for (const w of this.worms) this.renderWorm(g, w)
    if (this.beetle) this.renderBeetle(g, this.beetle)
    if (this.moth) this.renderMoth(g, this.moth)
    if (this.beam) this.renderBeam(g, this.beam)
    if (this.dead === 0) this.renderSprayer(g)
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
  }

  /** The lawn and the flowerbed, painted once. */
  private renderGarden(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'glitch-garden-floor', W, H, (k) => {
      k.fillStyle = HEDGE[0]
      k.fillRect(0, 0, W, LAWN_TOP)
      // A lawn at dusk, banded darker toward the top, mowed in stripes.
      bandedGradient(k, 0, LAWN_TOP, W, BED_Y - LAWN_TOP, LAWN_BANDS, 8)
      k.fillStyle = rgba(RAMPS.leaf[2], 0.07)
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
      bandedGradient(k, 0, BED_Y, W, H - BED_Y, SOIL_BANDS, 4)
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
        bevel(k, x + 1, BED_Y - 1, 10, 3, RAMPS.rust, { depth: 1 })
    })
  }

  /** Fireflies drifting over the lawn (cosmetic; they follow the clock). */
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
    dropShadow(g, x + 5, y + 7, 3, 1, 0.45)
    if (ob.kind === 'sprout') {
      // A sprout with as many leaves as it has hp left.
      const sprite = SPROUT_SPRITES[Math.max(1, Math.min(3, ob.hp))]
      if (sprite) drawSprite(g, sprite, x, y, { anchor: 'topleft' })
      return
    }
    // A glitchy mushroom lamp: the cap shrinks as it's sprayed.
    const hp = Math.max(1, Math.min(LAMP_HP, ob.hp))
    const flicker = (c * 7 + r * 3 + Math.floor(this.tick / 6)) % 11 === 0
    const sprite = (flicker ? LAMP_FLICKER_SPRITES : LAMP_SPRITES)[hp]
    if (flicker) glow(g, x + 4, y + 3, 9, FUCHSIA[3], 0.5)
    if (sprite) drawSprite(g, sprite, x, y, { anchor: 'topleft' })
  }

  private renderWorm(g: CanvasRenderingContext2D, w: Worm) {
    const step = Math.floor(this.tick / 6)
    for (let k = w.segments - 1; k >= 0; k--) {
      const p = this.segmentPos(w, k)
      if (p.y < HUD) continue
      const x = p.x
      const y = p.y
      const frame = (k + step) % 2
      if (k === 0) {
        glow(g, x + 4, y + 4, 10, RAMPS.pink[3], 0.35)
        drawSprite(g, HEAD_SPRITES[frame]!, x, y - 1, {
          anchor: 'topleft',
          flipX: w.dx < 0,
        })
        continue
      }
      const glitch = (k + Math.floor(this.tick / 4)) % 5 === 0
      if (glitch) {
        // A chromatic tear: a ghost of the segment slips sideways.
        drawSprite(g, GLITCH_SPRITES[frame]!, x + 2, y, {
          anchor: 'topleft',
          alpha: 0.45,
        })
      }
      drawSprite(g, (glitch ? GLITCH_SPRITES : SEGMENT_SPRITES)[frame]!, x, y, {
        anchor: 'topleft',
      })
    }
  }

  private renderBeetle(g: CanvasRenderingContext2D, b: Beetle) {
    const frame = Math.floor(this.tick / 4) % 2
    dropShadow(g, b.x + 1, b.y + 5, 6, 1.5, 0.45)
    drawSprite(g, BEETLE_SPRITES[frame]!, b.x, b.y, { flipX: b.vx < 0 })
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const frame = Math.floor(this.tick / 3) % 2
    // It flies above the garden: a shadow far below and to the side.
    dropShadow(g, m.x + 4, m.y + 8, 4, 1.5, 0.3)
    glow(g, m.x, m.y, 10, RAMPS.purple[3], 0.3)
    const sprites = m.hp > 1 ? MOTH_SPRITES : MOTH_HURT_SPRITES
    drawSprite(g, sprites[frame]!, m.x, m.y)
  }

  private renderBeam(
    g: CanvasRenderingContext2D,
    beam: { x: number; y: number },
  ) {
    const x = Math.round(beam.x)
    const y = Math.round(beam.y)
    glow(g, x, y - 1, 8, RAMPS.teal[3], 0.6)
    g.fillStyle = rgba(RAMPS.teal[3], 0.35)
    g.fillRect(x - 1, y + 2, 2, 6)
    g.fillStyle = RAMPS.teal[2]
    g.fillRect(x - 1, y - 5, 3, 8)
    g.fillStyle = RAMPS.teal[4]
    g.fillRect(x, y - 5, 1, 7)
  }

  private renderSprayer(g: CanvasRenderingContext2D) {
    const x = Math.round(this.px)
    const y = Math.round(this.py)
    // A little gardening bot with a spray nozzle on top.
    dropShadow(g, x, y + 5, 6, 1.5, 0.45)
    glow(g, x, y - 5, 5, RAMPS.teal[3], 0.35)
    const frame = Math.floor(this.tick / 5) % 2
    drawSprite(g, SPRAYER_SPRITES[frame]!, x, y - 1)
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
        drawSprite(g, LIFE_SPRITE, 83 + i * 10, 4, { anchor: 'topleft' })
    }
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `WAVE ${this.level}`, W - 4, 8, {
      align: 'right',
      color: RAMPS.leaf[3],
      shadow: INK,
    })
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

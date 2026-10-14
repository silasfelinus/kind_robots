// /utils/arcade/games/lampLighterRun.ts
//
// Lamp Lighter Run -- the Kind Robots Arcade's ladder-and-roller riff (conductor kr-arcade/t-009
// game factory, approved pitch 2026-10-09-kr-cabinet-lamp-lighter-run). Wick, a lamplighter robot,
// climbs a scaffold of five sloping girders to relight ten street lamps before the lantern timer
// runs out, hopping the gloom-balls that tumble down from the chute at the top.
//
// Left and right walk, Up and Down climb a ladder, A or B hops. Touch every lamp to light it;
// lighting all ten clears the street (the lantern timer left is a bonus). A gloom-ball, or an
// empty lantern, costs a life. Each level the girders tilt more, the balls roll faster and drop
// more often, the lantern timer shrinks, and the street changes (three night backdrops in turn).
//
// The rules (girder heights, balls, hops, lamps, timer, the pilot) are small exported functions
// so the engine test can pin each one.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawSprite,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
} from '../snes'
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

export const W = 256
export const H = 288

/** Height of each girder (0 = bottom) at its middle. */
export const PLAT_BASE = [266, 220, 174, 128, 90] as const
export const TOP = PLAT_BASE.length - 1
/** Ladder k joins girder k to girder k + 1. */
export const LADDER_X = [216, 40, 216, 40] as const
/** Two lamps on every girder: ten in all. */
export const LAMP_X: ReadonlyArray<readonly [number, number]> = [
  [70, 140],
  [190, 110],
  [90, 160],
  [180, 120],
  [96, 190],
]
export const LAMP_COUNT = LAMP_X.length * 2

export const WALK = 0.9
export const CLIMB = 0.8
export const HOP_SPEED = 3.4
export const HOP_GRAVITY = 0.21
export const BALL_RADIUS = 4
export const HIT_RANGE = 7
export const START_LIVES = 3
export const LAMP_POINTS = 200
export const HOP_POINTS = 100
export const EXTRA_LIFE_AT = 10000
export const INVULN = 90

export const LANTERN_CURVES = {
  /** Total tilt of a girder across the screen, in pixels. */
  tilt: { start: 8, step: 2, limit: 18 },
  /** Ball speed in pixels per tick. */
  speed: { start: 0.8, step: 0.1, limit: 1.9 },
  /** Ticks between balls leaving the chute. */
  gap: { start: 140, step: -10, limit: 55 },
  /** The lantern timer in ticks. */
  timer: { start: 4500, step: -300, limit: 1800 },
} as const

/** Which way balls roll on girder i: even girders slope down to the right. */
export function platDir(plat: number): 1 | -1 {
  return plat % 2 === 0 ? 1 : -1
}

export function tiltFor(level: number): number {
  return levelCurve(level, LANTERN_CURVES.tilt)
}

/** Height of girder `plat` at column x for a given tilt. */
export function platformY(plat: number, x: number, tilt: number): number {
  const cx = Math.max(0, Math.min(W, x))
  return Math.round(PLAT_BASE[plat]! + platDir(plat) * tilt * (cx / W - 0.5))
}

export function ballSpeed(level: number): number {
  return levelCurve(level, LANTERN_CURVES.speed)
}

export function ballGap(level: number): number {
  return Math.round(levelCurve(level, LANTERN_CURVES.gap))
}

export function lanternTicks(level: number): number {
  return Math.round(levelCurve(level, LANTERN_CURVES.timer))
}

/** Bonus for the lantern timer left when the street is lit. */
export function timerBonus(ticksLeft: number): number {
  return Math.floor(Math.max(0, ticksLeft) / 6)
}

/** True when a ball's centre is close enough to the robot's to catch it. */
export function ballHits(
  px: number,
  pFeet: number,
  bx: number,
  bFeet: number,
): boolean {
  const dx = px - bx
  const dy = pFeet - 7 - (bFeet - BALL_RADIUS)
  return dx * dx + dy * dy < HIT_RANGE * HIT_RANGE
}

export type Ball = {
  plat: number
  x: number
  /** Feet (contact point) height. */
  y: number
  dir: 1 | -1
  falling: boolean
  vy: number
  hopped: boolean
  /** Ladder this ball has already passed, so it rolls past or takes it once. */
  passed: number
  spin: number
}

/** A ball leaving the chute, dropping onto the top girder. */
export function newBall(): Ball {
  return {
    plat: TOP,
    x: 16,
    y: 62,
    dir: 1,
    falling: true,
    vy: 0,
    hopped: false,
    passed: -1,
    spin: 0,
  }
}

/** Advance one ball a tick: it rolls downhill, drops off the ends and sometimes takes a ladder. */
export function stepBall(
  b: Ball,
  tilt: number,
  speed: number,
  rng: () => number,
): boolean {
  b.spin++
  if (b.falling) {
    b.vy += 0.25
    b.y += b.vy
    const floor = platformY(b.plat, b.x, tilt)
    if (b.y >= floor) {
      b.y = floor
      b.falling = false
      b.vy = 0
      b.dir = platDir(b.plat)
    }
    return true
  }
  b.x += b.dir * speed
  b.y = platformY(b.plat, b.x, tilt)
  if (b.plat > 0) {
    const ladder = LADDER_X[b.plat - 1]!
    if (b.passed !== ladder && Math.abs(b.x - ladder) < speed) {
      b.passed = ladder
      if (rng() < 0.3) {
        b.x = ladder
        b.plat--
        b.falling = true
        b.vy = 0
        return true
      }
    }
  }
  if (b.x > W - 3 || b.x < 3) {
    if (b.plat === 0) return b.x > -6 && b.x < W + 6
    b.x = Math.max(3, Math.min(W - 3, b.x))
    b.plat--
    b.falling = true
    b.vy = 0
    b.passed = -1
  }
  return true
}

// --- the pilot ----------------------------------------------------------------------------------

/** Where the nearest unlit lamp is: its girder and column. */
export function nearestUnlit(
  lit: ReadonlyArray<ReadonlyArray<boolean>>,
  plat: number,
  x: number,
): { plat: number; x: number } | null {
  let best: { plat: number; x: number; cost: number } | null = null
  for (let p = 0; p < LAMP_X.length; p++) {
    for (let i = 0; i < 2; i++) {
      if (lit[p]![i]) continue
      const lx = LAMP_X[p]![i]!
      const cost = Math.abs(p - plat) * 1000 + Math.abs(lx - x)
      if (!best || cost < best.cost) best = { plat: p, x: lx, cost }
    }
  }
  return best ? { plat: best.plat, x: best.x } : null
}

// --- art ----------------------------------------------------------------------------------------

const WICK_PALETTE = {
  B: RAMPS.steel[2],
  W: RAMPS.cream[3],
  E: RAMPS.night[1],
  G: RAMPS.teal[2],
  Y: RAMPS.gold[3],
  O: RAMPS.gold[1],
}

const WICK_A = pixelSprite(
  [
    '...YYYY...',
    '..YYYYYY..',
    '..BWWWWB..',
    '..BEWWEB..',
    '..BWWWWB..',
    '.GGGGGGGG.',
    '.GGGYYGGG.',
    '.GGGGGGGG.',
    '..GG..GG..',
    '..BB..BB..',
  ],
  WICK_PALETTE,
)

const WICK_B = pixelSprite(
  [
    '...YYYY...',
    '..YYYYYY..',
    '..BWWWWB..',
    '..BEWWEB..',
    '..BWWWWB..',
    '.GGGGGGGG.',
    '.GGGYYGGG.',
    '.GGGGGGGG.',
    '.GG....GG.',
    '.BB....BB.',
  ],
  WICK_PALETTE,
)

const WICK_HOP = pixelSprite(
  [
    '...YYYY...',
    '..YYYYYY..',
    '..BWWWWB..',
    '..BEWWEB..',
    '..BWWWWB..',
    'GGGGGGGGGG',
    '.GGGYYGGG.',
    '..GGGGGG..',
    '..GG..GG..',
    '..BB..BB..',
  ],
  WICK_PALETTE,
)

const WICK_CLIMB_A = pixelSprite(
  [
    '...YYYY...',
    '..YYYYYY..',
    '..BWWWWB..',
    '..BWWWWB..',
    '..BWWWWB..',
    'GGGGGGGG..',
    '.GGGYYGGGG',
    '.GGGGGGG..',
    '..GG.GG...',
    '..BB..BB..',
  ],
  WICK_PALETTE,
)

const WICK_CLIMB_B = pixelSprite(
  [
    '...YYYY...',
    '..YYYYYY..',
    '..BWWWWB..',
    '..BWWWWB..',
    '..BWWWWB..',
    '..GGGGGGGG',
    'GGGGYYGGG.',
    '..GGGGGGG.',
    '...GG.GG..',
    '..BB..BB..',
  ],
  WICK_PALETTE,
)

const GLOOM_PALETTE = {
  P: RAMPS.purple[1],
  Q: RAMPS.purple[2],
  Y: RAMPS.gold[4],
  K: RAMPS.night[0],
}

const GLOOM_A = pixelSprite(
  [
    '..PPPP..',
    '.PQQPPP.',
    'PQYPPYPP',
    'PQPPPPPP',
    'PPKKKKPP',
    'PPPPPPPP',
    '.PPPPPP.',
    '..PPPP..',
  ],
  GLOOM_PALETTE,
)

const GLOOM_B = pixelSprite(
  [
    '..PPPP..',
    '.PPPPPP.',
    'PPYPPYPP',
    'PPPPPPPP',
    'PPKPPKPP',
    'PQPKKPPP',
    '.PQPPPP.',
    '..PPPP..',
  ],
  GLOOM_PALETTE,
)

type Street = {
  sky: readonly [string, string, string]
  towers: string
  window: string
  girder: Ramp
  stars: number
}

/** Three night streets, one per level in turn. */
export const STREETS: readonly Street[] = [
  {
    sky: [RAMPS.night[2], RAMPS.purple[0], RAMPS.night[1]],
    towers: mix(RAMPS.night[2], RAMPS.purple[1], 0.5),
    window: RAMPS.gold[3],
    girder: RAMPS.steel,
    stars: 31,
  },
  {
    sky: [RAMPS.water[0], RAMPS.sky[0], RAMPS.night[1]],
    towers: mix(RAMPS.water[0], RAMPS.night[2], 0.5),
    window: RAMPS.teal[3],
    girder: RAMPS.teal,
    stars: 47,
  },
  {
    sky: [RAMPS.ember[0], RAMPS.pink[0], RAMPS.night[1]],
    towers: mix(RAMPS.ember[0], RAMPS.night[2], 0.5),
    window: RAMPS.pink[3],
    girder: RAMPS.rust,
    stars: 59,
  },
]

export function streetFor(level: number): number {
  return (Math.max(1, level) - 1) % STREETS.length
}

// --- the cabinet --------------------------------------------------------------------------------

type Floater = { x: number; y: number; text: string; life: number }
type Mode = 'play' | 'dying' | 'cleared'
type Stance = 'ground' | 'air' | 'climb'

class LampLighterRun implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number
  private tick = 0

  private mode: Mode = 'play'
  private modeTicks = 0
  private stance: Stance = 'ground'
  private x = 24
  private plat = 0
  private feet = 0
  /** Height above the girder while hopping. */
  private h = 0
  private hv = 0
  /** Ladder being climbed. */
  private ladder = 0
  private facing: 1 | -1 = 1
  private stepAnim = 0
  private invuln = 0

  private balls: Ball[] = []
  private ballTimer = 90
  private lit: boolean[][] = LAMP_X.map(() => [false, false])
  private timer = lanternTicks(1)
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; ticks: number } | null = null
  private floaters: Floater[] = []
  private sparkles = new Sparkles()
  private sparkRng = backdropRng(91)
  private pilotJump = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.placeAtStart()
    this.banner = { text: 'LEVEL 1', ticks: 70 }
  }

  private get tilt() {
    return tiltFor(this.level)
  }

  private placeAtStart() {
    this.stance = 'ground'
    this.plat = 0
    this.x = 24
    this.h = 0
    this.hv = 0
    this.facing = 1
    this.feet = platformY(0, this.x, this.tilt)
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.sparkles.update()
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return

    if (this.mode === 'dying') {
      this.h = Math.max(0, this.h)
      if (--this.modeTicks <= 0) this.afterDeath()
      return
    }
    if (this.mode === 'cleared') {
      if (--this.modeTicks <= 0) this.nextLevel()
      return
    }

    const c = this.demo ? this.pilotInput() : input
    if (this.invuln > 0) this.invuln--
    this.movePlayer(c)
    this.lightLamps()
    this.moveBalls()
    if (this.mode !== 'play') return
    this.checkHits()
    if (this.mode !== 'play') return
    if (--this.timer <= 0) this.lose('LANTERN OUT')
  }

  private movePlayer(c: InputFrame) {
    const tilt = this.tilt
    if (this.stance === 'climb') {
      const k = this.ladder
      let dy = 0
      if (c.held.up && !c.held.down) dy = -CLIMB
      else if (c.held.down && !c.held.up) dy = CLIMB
      this.feet += dy
      if (dy !== 0) this.stepAnim += 1
      const top = platformY(k + 1, LADDER_X[k]!, tilt)
      const bottom = platformY(k, LADDER_X[k]!, tilt)
      if (dy < 0 && this.feet <= top) this.land(k + 1, top)
      else if (dy > 0 && this.feet >= bottom) this.land(k, bottom)
      return
    }

    let dir = 0
    if (c.held.left && !c.held.right) dir = -1
    else if (c.held.right && !c.held.left) dir = 1
    if (dir !== 0) {
      this.facing = dir as 1 | -1
      this.x = Math.max(6, Math.min(W - 6, this.x + dir * WALK))
      if (this.stance === 'ground') this.stepAnim += 1
    }

    if (this.stance === 'ground') {
      if ((c.pressed.a || c.pressed.b) && this.mode === 'play') {
        this.stance = 'air'
        this.hv = HOP_SPEED
        this.h = 0.01
        this.sound.play('blip')
      } else if (c.held.up && this.plat < TOP && this.onLadder(this.plat)) {
        this.startClimb(
          this.plat,
          platformY(this.plat, LADDER_X[this.plat]!, tilt),
        )
        return
      } else if (c.held.down && this.plat > 0 && this.onLadder(this.plat - 1)) {
        this.startClimb(
          this.plat - 1,
          platformY(this.plat, LADDER_X[this.plat - 1]!, tilt),
        )
        return
      }
    }
    if (this.stance === 'air') {
      this.h += this.hv
      this.hv -= HOP_GRAVITY
      if (this.h <= 0) {
        this.h = 0
        this.hv = 0
        this.stance = 'ground'
      }
    }
    this.feet = platformY(this.plat, this.x, tilt) - this.h
  }

  private onLadder(k: number): boolean {
    return Math.abs(this.x - LADDER_X[k]!) <= 5
  }

  private startClimb(k: number, feet: number) {
    this.stance = 'climb'
    this.ladder = k
    this.x = LADDER_X[k]!
    this.feet = feet
    this.h = 0
  }

  private land(plat: number, feet: number) {
    this.stance = 'ground'
    this.plat = plat
    this.feet = feet
    this.h = 0
  }

  private lightLamps() {
    if (this.stance === 'climb' || this.h > 6) return
    for (let i = 0; i < 2; i++) {
      if (this.lit[this.plat]![i]) continue
      if (Math.abs(this.x - LAMP_X[this.plat]![i]!) > 6) continue
      this.lit[this.plat]![i] = true
      this.sound.play('pickup')
      const lx = LAMP_X[this.plat]![i]!
      const ly = platformY(this.plat, lx, this.tilt) - 18
      this.sparkles.burst(lx, ly, this.sparkRng, { count: 10 })
      this.addScore(LAMP_POINTS, lx, ly - 8, `${LAMP_POINTS}`)
    }
    if (this.lit.every((row) => row.every(Boolean))) this.clearStreet()
  }

  private clearStreet() {
    const bonus = timerBonus(this.timer)
    this.mode = 'cleared'
    this.modeTicks = 110
    this.balls = []
    this.sound.play('level')
    this.addScore(bonus, W / 2, 140, `BONUS ${bonus}`)
    this.banner = { text: 'STREET LIT', ticks: 110 }
    for (let i = 0; i < 4; i++) {
      this.sparkles.burst(40 + i * 60, 100 + (i % 2) * 70, this.sparkRng, {
        count: 14,
      })
    }
  }

  private nextLevel() {
    this.level++
    this.lit = LAMP_X.map(() => [false, false])
    this.balls = []
    this.ballTimer = 90
    this.timer = lanternTicks(this.level)
    this.mode = 'play'
    this.invuln = INVULN
    this.placeAtStart()
    this.banner = { text: `LEVEL ${this.level}`, ticks: 80 }
  }

  private moveBalls() {
    const speed = ballSpeed(this.level)
    if (--this.ballTimer <= 0 && this.balls.length < 10) {
      this.balls.push(newBall())
      this.ballTimer = ballGap(this.level)
    }
    this.balls = this.balls.filter((b) =>
      stepBall(b, this.tilt, speed, this.rng),
    )
    // A hop over a ball on the same girder pays.
    if (this.stance === 'air' && this.h > 5) {
      for (const b of this.balls) {
        if (b.hopped || b.falling || b.plat !== this.plat) continue
        if (Math.abs(b.x - this.x) < 6) {
          b.hopped = true
          this.addScore(HOP_POINTS, b.x, b.y - 14, `${HOP_POINTS}`)
          this.sound.play('pop')
        }
      }
    }
  }

  private checkHits() {
    if (this.invuln > 0) return
    for (const b of this.balls) {
      if (ballHits(this.x, this.feet, b.x, b.y)) {
        this.lose('OUCH')
        return
      }
    }
  }

  private lose(text: string) {
    this.lives--
    this.mode = 'dying'
    this.modeTicks = 70
    this.banner = { text, ticks: 70 }
    this.sound.play('die')
    this.sparkles.burst(this.x, this.feet - 8, this.sparkRng, {
      count: 12,
      colours: [RAMPS.pink[3], RAMPS.purple[3]],
    })
    if (this.lives <= 0) {
      this.lives = 0
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
    }
  }

  private afterDeath() {
    this.balls = []
    this.ballTimer = 90
    this.timer = Math.max(this.timer, 900)
    this.mode = 'play'
    this.invuln = INVULN
    this.placeAtStart()
  }

  private addScore(points: number, x: number, y: number, label: string) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: label, life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_LIFE_AT * 2
      this.lives++
      this.sound.play('extra')
      this.banner = { text: 'EXTRA LIFE', ticks: 70 }
    }
  }

  // --- attract-mode pilot -------------------------------------------------------

  private pilotInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const pressed = { ...held }
    if (this.pilotJump > 0) this.pilotJump--
    if (this.stance === 'air') return { held, pressed }
    if (this.stance === 'climb') {
      const goal = nearestUnlit(this.lit, this.plat, this.x)
      const k = this.ladder
      if (goal && goal.plat <= k) held.down = true
      else held.up = true
      return { held, pressed }
    }
    const goal = nearestUnlit(this.lit, this.plat, this.x)
    if (!goal) return { held, pressed }
    let target = goal.x
    let vertical: 'up' | 'down' | null = null
    if (goal.plat > this.plat) {
      target = LADDER_X[this.plat]!
      vertical = 'up'
    } else if (goal.plat < this.plat) {
      target = LADDER_X[this.plat - 1]!
      vertical = 'down'
    }
    const dx = target - this.x
    if (Math.abs(dx) > 2) {
      if (dx > 0) held.right = true
      else held.left = true
    } else if (vertical) held[vertical] = true
    // Hop a ball that is close and on this girder.
    if (this.pilotJump === 0) {
      for (const b of this.balls) {
        if (b.plat !== this.plat || b.falling) continue
        const gap = b.x - this.x
        const closing = gap * b.dir < 0 || Math.abs(gap) < 14
        if (Math.abs(gap) < 20 && closing) {
          pressed.a = true
          this.pilotJump = 40
          break
        }
      }
    }
    return { held, pressed }
  }

  // --- render ------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const street = streetFor(this.level)
    this.renderBackdrop(g, street)
    this.renderGirders(g, street)
    this.renderLamps(g)
    this.renderBalls(g)
    this.renderPlayer(g)
    this.sparkles.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, Math.round(f.x), Math.round(f.y), {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    this.renderHud(g)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 150, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
    }
  }

  private renderBackdrop(g: CanvasRenderingContext2D, streetIndex: number) {
    const s = STREETS[streetIndex]!
    cachedLayer(g, `lamp-lighter-run-bg-${streetIndex}`, W, H, (layer) => {
      bandedGradient(layer, 0, 0, W, H, s.sky, 6)
      const rand = backdropRng(s.stars)
      for (let i = 0; i < 40; i++) {
        layer.fillStyle = rgba(RAMPS.cream[3], 0.5 + rand() * 0.4)
        layer.fillRect(Math.round(rand() * W), Math.round(rand() * 120), 1, 1)
      }
      // The moon.
      layer.fillStyle = RAMPS.cream[3]
      layer.fillRect(206, 46, 12, 12)
      layer.fillStyle = s.sky[0]
      layer.fillRect(210, 44, 10, 10)
      // Far towers with lit windows.
      for (let i = 0; i < 12; i++) {
        const x = Math.round(i * 22 + rand() * 8)
        const w = 18 + Math.round(rand() * 8)
        const h = 70 + Math.round(rand() * 110)
        layer.fillStyle = s.towers
        layer.fillRect(x, H - h, w, h)
        layer.fillStyle = rgba('#ffffff', 0.08)
        layer.fillRect(x, H - h, w, 1)
        for (let wy = H - h + 6; wy < H - 8; wy += 8) {
          for (let wx = x + 3; wx < x + w - 4; wx += 6) {
            if (rand() < 0.4) {
              layer.fillStyle = rgba(s.window, 0.7)
              layer.fillRect(wx, wy, 3, 4)
            }
          }
        }
      }
    })
  }

  private renderGirders(g: CanvasRenderingContext2D, streetIndex: number) {
    const s = STREETS[streetIndex]!
    const tilt = Math.round(this.tilt)
    cachedLayer(
      g,
      `lamp-lighter-run-girders-${streetIndex}-${tilt}`,
      W,
      H,
      (layer) => {
        // Ladders first, so the girders cover their ends.
        for (let k = 0; k < LADDER_X.length; k++) {
          const lx = LADDER_X[k]!
          const top = platformY(k + 1, lx, tilt)
          const bottom = platformY(k, lx, tilt)
          layer.fillStyle = INK
          layer.fillRect(lx - 6, top, 12, bottom - top)
          layer.fillStyle = RAMPS.gold[2]
          layer.fillRect(lx - 5, top, 2, bottom - top)
          layer.fillRect(lx + 3, top, 2, bottom - top)
          layer.fillStyle = RAMPS.gold[3]
          layer.fillRect(lx - 5, top, 1, bottom - top)
          for (let y = top + 3; y < bottom; y += 5) {
            layer.fillStyle = RAMPS.gold[1]
            layer.fillRect(lx - 3, y, 6, 1)
          }
        }
        for (let p = 0; p < PLAT_BASE.length; p++) {
          for (let x = 0; x < W; x += 2) {
            const y = platformY(p, x, tilt)
            layer.fillStyle = INK
            layer.fillRect(x, y - 1, 2, 9)
            layer.fillStyle = s.girder[3]
            layer.fillRect(x, y, 2, 1)
            layer.fillStyle = s.girder[2]
            layer.fillRect(x, y + 1, 2, 3)
            layer.fillStyle = s.girder[1]
            layer.fillRect(x, y + 4, 2, 2)
            if (x % 16 === 0) {
              layer.fillStyle = s.girder[4]
              layer.fillRect(x, y + 2, 2, 1)
              layer.fillStyle = s.girder[0]
              layer.fillRect(x, y + 6, 2, 1)
            }
          }
        }
      },
    )
  }

  private renderLamps(g: CanvasRenderingContext2D) {
    const tilt = this.tilt
    for (let p = 0; p < LAMP_X.length; p++) {
      for (let i = 0; i < 2; i++) {
        const lx = LAMP_X[p]![i]!
        const base = platformY(p, lx, tilt)
        const on = this.lit[p]![i]!
        g.fillStyle = INK
        g.fillRect(lx - 2, base - 20, 4, 20)
        g.fillStyle = RAMPS.steel[2]
        g.fillRect(lx - 1, base - 19, 2, 19)
        g.fillStyle = INK
        g.fillRect(lx - 5, base - 25, 10, 7)
        g.fillStyle = on ? RAMPS.gold[4] : RAMPS.steel[1]
        g.fillRect(lx - 4, base - 24, 8, 5)
        if (on) {
          g.fillStyle = '#ffffff'
          g.fillRect(lx - 2, base - 23, 3, 2)
          const flicker = 1 + 0.08 * Math.sin((this.tick + lx) / 7)
          glow(g, lx, base - 22, 30 * flicker, RAMPS.gold[3], 0.7)
          glow(g, lx, base - 4, 18, RAMPS.gold[2], 0.3)
        }
      }
    }
  }

  private renderBalls(g: CanvasRenderingContext2D) {
    for (const b of this.balls) {
      if (!b.falling) dropShadow(g, b.x, b.y + 1, 5, 1.5, 0.25)
      const frame = Math.floor(b.spin / 5) % 2 === 0 ? GLOOM_A : GLOOM_B
      drawSprite(g, frame, b.x, b.y, {
        anchor: 'feet',
        flipX: Math.floor(b.spin / 10) % 2 === 0,
      })
    }
    // The chute at the top left.
    g.fillStyle = INK
    g.fillRect(6, 44, 22, 22)
    g.fillStyle = RAMPS.steel[1]
    g.fillRect(8, 44, 18, 20)
    g.fillStyle = RAMPS.night[0]
    g.fillRect(11, 58, 12, 6)
    glow(g, 17, 60, 16, RAMPS.purple[3], 0.35)
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    if (this.mode === 'dying' && Math.floor(this.tick / 4) % 2 === 0) return
    if (this.invuln > 0 && Math.floor(this.tick / 3) % 2 === 0) return
    let sprite = WICK_A
    if (this.stance === 'air') sprite = WICK_HOP
    else if (this.stance === 'climb') {
      sprite =
        Math.floor(this.stepAnim / 6) % 2 === 0 ? WICK_CLIMB_A : WICK_CLIMB_B
    } else if (Math.floor(this.stepAnim / 6) % 2 === 1) sprite = WICK_B
    if (this.stance !== 'air') {
      dropShadow(g, this.x, this.feet + 1, 6, 1.5)
    } else {
      dropShadow(
        g,
        this.x,
        platformY(this.plat, this.x, this.tilt) + 1,
        6 - this.h / 8,
        1.5,
        0.2,
      )
    }
    drawSprite(g, sprite, this.x, this.feet, {
      anchor: 'feet',
      flipX: this.facing < 0,
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 2, 92, 20, RAMPS.purple)
    drawText(g, 'SCORE', 9, 6, { color: RAMPS.purple[4] })
    drawText(g, String(this.score), 91, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, 100, 2, 60, 20, RAMPS.teal)
    drawText(g, 'HI', 105, 6, { color: RAMPS.teal[4] })
    drawText(g, String(Math.max(this.hiScore, this.score)), 155, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, 164, 2, 48, 20, RAMPS.pink)
    for (let i = 0; i < Math.min(this.lives, 4); i++) {
      drawSprite(g, WICK_A, 176 + i * 11, 20, { anchor: 'feet' })
    }
    drawText(g, 'LIVES', 169, 5, { color: RAMPS.pink[4] })
    hudPanel(g, 216, 2, 36, 20, RAMPS.gold)
    drawText(g, 'LEVEL', 221, 6, { color: RAMPS.gold[4] })
    drawText(g, String(this.level), 247, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, 4, 26, 248, 14, RAMPS.night)
    drawText(g, 'LANTERN', 10, 30, { color: RAMPS.night[4] })
    gauge(
      g,
      60,
      30,
      186,
      5,
      this.timer / lanternTicks(this.level),
      this.timer < 900 ? RAMPS.ember : RAMPS.gold,
    )
  }
}

const lampLighterRun: ArcadeGameModule = {
  create: (options) => new LampLighterRun(options),
}

export const create = lampLighterRun.create
export default lampLighterRun

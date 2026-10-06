// /utils/arcade/games/kindPinball.ts
//
// Kind Pinball -- the Kind Robots Arcade's pinball table (conductor
// kr-arcade/t-009 game factory, slices 1-3 of 4: table, flippers, physics,
// bumpers, targets, scoring, the ramp and the mode ladder; the AMI multiball
// is the last slice). Left and right work the flippers, A works both, hold
// Down to pull the plunger and let go to launch (A launches too), and Up
// nudges the table.
//
// Rules: roll through the N-E-T lanes at the top to raise the bonus
// multiplier (the flippers rotate the lit lanes). Hit the A-M-I targets to
// ready the saucer, then shoot the saucer to light a village. Light all five
// villages for the JACKPOT, which also steps up the level.
//
// The ramp: a fast shot into the mouth on the upper right rides a raised
// track over the table and drops into the left inlane. Ramp shots in a row
// on one ball are worth more each time, and every third one starts the next
// mode on the ladder (Net Rush, Ramp Frenzy, Lane Lights, Saucer Rescue),
// each 30 seconds long. Play all four and the next ramp shot pays the SUPER
// JACKPOT. Mode values scale with the level. Ball save shrinks with every
// ball and level, and an extra ball waits at 150,000.

import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 288
const H = 416
const R = 6
const GRAVITY = 0.13
const MAX_SPEED = 14
const SUBSTEPS = 4
const WALL_BOUNCE = 0.45
const FLIPPER_BOUNCE = 0.25
const FLIPPER_LEN = 48
const FLIPPER_RADIUS = 4
const FLIP_SPEED = 0.34
const FLIP_REST = 0.5
const FLIP_UP = -0.45
const LANE_X = 272
const PLUNGER_Y = 402
const START_BALLS = 3
const EXTRA_BALL_AT = 150_000
const VILLAGES = 5
const JACKPOT = 100_000
const SUPER_JACKPOT = 250_000
const RAMP_TICKS = 48
const RAMPS_PER_MODE = 3
const MODE_TICKS = 60 * 30

/** The ramp mouth: a ball moving up through it fast enough rides the ramp. */
const RAMP_MOUTH = { x0: 200, x1: 228, y0: 150, y1: 172, minSpeed: 4.5 }
/** The raised track, from the mouth over the top and down into the left inlane. */
const RAMP_PATH: Array<{ x: number; y: number }> = [
  { x: 214, y: 162 },
  { x: 226, y: 108 },
  { x: 200, y: 82 },
  { x: 140, y: 98 },
  { x: 70, y: 110 },
  { x: 40, y: 168 },
  { x: 41, y: 250 },
  { x: 38, y: 290 },
]

/** The mode ladder, started in order by every third ramp shot. */
export const PINBALL_MODES = [
  { key: 'net', name: 'NET RUSH', hint: 'BUMPERS 1,000' },
  { key: 'ramp', name: 'RAMP FRENZY', hint: 'RAMPS 25,000' },
  { key: 'lanes', name: 'LANE LIGHTS', hint: 'LANES 5,000' },
  { key: 'saucer', name: 'SAUCER RESCUE', hint: 'SAUCER LIGHTS VILLAGES' },
] as const
type ModeKey = (typeof PINBALL_MODES)[number]['key']

/** Where a ride is, as a point along RAMP_PATH (t from 0 to 1). */
export function rampPoint(t: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t))
  const span = (RAMP_PATH.length - 1) * clamped
  const i = Math.min(RAMP_PATH.length - 2, Math.floor(span))
  const f = span - i
  const a = RAMP_PATH[i]!
  const b = RAMP_PATH[i + 1]!
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
}

type Vec = { x: number; y: number }
type Seg = { a: Vec; b: Vec; kick?: number; target?: number }
type Bumper = { x: number; y: number; r: number; flash: number }
type Flipper = {
  pivot: Vec
  side: 1 | -1
  angle: number
  target: number
  /** Angular velocity in radians per tick, for the surface speed. */
  omega: number
}
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const CX = 136

/** The top arch, as an ellipse traced into wall segments. */
function arch(): Seg[] {
  const segs: Seg[] = []
  const cx = 144
  const cy = 130
  const rx = 136
  const ry = 104
  const steps = 24
  let prev: Vec = { x: cx - rx, y: cy }
  for (let i = 1; i <= steps; i++) {
    const t = Math.PI + (Math.PI * i) / steps
    const p = { x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry }
    segs.push({ a: prev, b: p })
    prev = p
  }
  return segs
}

function mirror(p: Vec): Vec {
  return { x: CX * 2 - p.x, y: p.y }
}

/** Every wall on the table. Targets carry an index; slingshot faces carry a kick. */
export function tableWalls(): Seg[] {
  const walls: Seg[] = [
    ...arch(),
    { a: { x: 8, y: 130 }, b: { x: 8, y: H + 20 } },
    { a: { x: 280, y: 130 }, b: { x: 280, y: H + 20 } },
    // Plunger lane wall, and the plunger tip the ball rests on.
    { a: { x: 264, y: 150 }, b: { x: 264, y: H + 20 } },
    { a: { x: 264, y: PLUNGER_Y }, b: { x: 280, y: PLUNGER_Y } },
    // Top-left guide: a ball riding the arch down the left side is turned
    // back toward the bumpers instead of falling straight into the outlane.
    { a: { x: 8, y: 132 }, b: { x: 42, y: 150 } },
    // Top lane dividers.
    { a: { x: 100, y: 46 }, b: { x: 100, y: 68 } },
    { a: { x: 124, y: 46 }, b: { x: 124, y: 68 } },
    { a: { x: 148, y: 46 }, b: { x: 148, y: 68 } },
    { a: { x: 172, y: 46 }, b: { x: 172, y: 68 } },
  ]
  // Inlane guides feed the flippers; outlanes drain past them.
  const inlane = { a: { x: 24, y: 296 }, b: { x: 80, y: 352 } }
  walls.push(inlane, { a: mirror(inlane.a), b: mirror(inlane.b) })
  // Slingshots: two plain sides and a kicking face toward the middle.
  const sa = { x: 52, y: 262 }
  const sb = { x: 52, y: 298 }
  const sc = { x: 78, y: 316 }
  walls.push(
    { a: sa, b: sb },
    { a: sb, b: sc },
    { a: sa, b: sc, kick: 4.5 },
    { a: mirror(sa), b: mirror(sb) },
    { a: mirror(sb), b: mirror(sc) },
    { a: mirror(sa), b: mirror(sc), kick: 4.5 },
  )
  // A-M-I standup targets along the left wall.
  ;[176, 204, 232].forEach((y, i) => {
    walls.push({ a: { x: 14, y: y - 9 }, b: { x: 14, y: y + 9 }, target: i })
  })
  return walls
}

const BUMPERS: Array<Omit<Bumper, 'flash'>> = [
  { x: 100, y: 140, r: 14 },
  { x: 172, y: 140, r: 14 },
  { x: 136, y: 186, r: 14 },
]
const SAUCER = { x: 236, y: 206, r: 9 }
const LANES = [112, 136, 160]
const LANE_LETTERS = ['N', 'E', 'T']
const TARGET_LETTERS = ['A', 'M', 'I']

function closestOnSegment(p: Vec, s: Seg): Vec {
  const dx = s.b.x - s.a.x
  const dy = s.b.y - s.a.y
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(
    0,
    Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / len2),
  )
  return { x: s.a.x + dx * t, y: s.a.y + dy * t }
}

class KindPinball implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_BALLS
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private walls = tableWalls()
  private bumpers: Bumper[] = BUMPERS.map((b) => ({ ...b, flash: 0 }))
  private flippers: Flipper[] = [
    {
      pivot: { x: 82, y: 356 },
      side: 1,
      angle: FLIP_REST,
      target: FLIP_REST,
      omega: 0,
    },
    {
      pivot: mirror({ x: 82, y: 356 }),
      side: -1,
      angle: FLIP_REST,
      target: FLIP_REST,
      omega: 0,
    },
  ]
  private ball = { x: LANE_X, y: PLUNGER_Y - R, vx: 0, vy: 0 }
  private inPlay = false
  private pull = 0
  private ballNumber = 0
  private ballSave = 0
  /** Each ball gets one ball save, armed on its first launch. */
  private saveArmed = false
  private saucerHold = 0
  /** Ticks after an eject before the saucer can catch the ball again. */
  private saucerCooldown = 0
  private nudgeCooldown = 0
  private still = 0
  private lanes = [false, false, false]
  private targets = [false, false, false]
  private targetFlash = [0, 0, 0]
  private saucerReady = false
  private villages = 0
  private multiplier = 1
  private bonus = 0
  private extraBallGiven = false
  private draining = 0
  /** Ticks into a ramp ride, or 0 when the ball is on the table. */
  private ramping = 0
  /** Ramp shots in a row on this ball (each one is worth more). */
  private rampStreak = 0
  /** Ramp shots toward starting the next mode. */
  private rampsTowardMode = 0
  private modeIndex = 0
  private mode: { key: ModeKey; ticks: number } | null = null
  private modesPlayed = 0
  private superReady = false
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.newBall()
  }

  // --- balls ------------------------------------------------------------------

  private newBall() {
    this.ballNumber++
    Object.assign(this.ball, { x: LANE_X, y: PLUNGER_Y - R, vx: 0, vy: 0 })
    this.inPlay = false
    this.pull = 0
    this.saveArmed = false
    this.multiplier = 1
    this.bonus = 0
    this.lanes = [false, false, false]
    this.ramping = 0
    this.rampStreak = 0
    this.mode = null
    this.banner = { text: `BALL ${this.ballNumber}`, ticks: 80 }
  }

  /** Seconds of ball save after a launch: it shrinks with every ball and level. */
  private saveTicks(): number {
    const seconds = Math.max(
      0,
      9 - 2 * (this.ballNumber - 1) - (this.level - 1),
    )
    return seconds * 60
  }

  private launch(power: number) {
    this.ball.vy = -(7 + 7 * power)
    this.ball.vx = 0
    this.inPlay = true
    if (!this.saveArmed) {
      this.saveArmed = true
      this.ballSave = this.saveTicks()
    }
    this.sound.play('start')
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.draining > 0) {
      if (--this.draining === 0) this.afterDrain()
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.moveFlippers(controls)
    for (const b of this.bumpers) if (b.flash > 0) b.flash--
    for (let i = 0; i < 3; i++)
      if (this.targetFlash[i]! > 0) this.targetFlash[i]!--
    if (this.nudgeCooldown > 0) this.nudgeCooldown--
    if (this.saucerCooldown > 0) this.saucerCooldown--
    if (this.ballSave > 0) this.ballSave--

    if (!this.inPlay) {
      for (let i = 0; i < SUBSTEPS; i++) this.swingFlippers()
      this.plunger(controls)
      return
    }
    if (this.mode && --this.mode.ticks <= 0) this.endMode()
    if (this.ramping > 0) {
      for (let i = 0; i < SUBSTEPS; i++) this.swingFlippers()
      this.rideRamp()
      return
    }
    if (this.saucerHold > 0) {
      for (let i = 0; i < SUBSTEPS; i++) this.swingFlippers()
      if (--this.saucerHold === 0) {
        // Kick the ball out clear of the saucer, down toward the left flipper.
        this.ball.x = SAUCER.x - SAUCER.r - R - 1
        this.ball.vx = -4
        this.ball.vy = 2.5
        this.saucerCooldown = 30
        this.sound.play('shoot')
      }
      return
    }
    if (controls.pressed.up && this.nudgeCooldown === 0) {
      this.ball.vx += (this.rng() - 0.5) * 2
      this.ball.vy -= 1.2
      this.nudgeCooldown = 60
      this.sound.play('blip')
    }
    this.ball.vy += GRAVITY
    for (let i = 0; i < SUBSTEPS; i++) this.step()
    this.checkLanes()
    this.checkRampMouth()
    const b = this.ball
    if (b.x > 264 && b.y > PLUNGER_Y - R - 2 && Math.abs(b.vy) < 0.5) {
      // Rolled back down the lane: plunge again.
      Object.assign(b, { x: LANE_X, y: PLUNGER_Y - R, vx: 0, vy: 0 })
      this.inPlay = false
      return
    }
    this.unstick()
    if (this.ball.y > H + 10) this.drain()
  }

  private plunger(input: InputFrame) {
    if (input.held.down) {
      this.pull = Math.min(1, this.pull + 1 / 45)
    } else if (this.pull > 0) {
      this.launch(this.pull)
      this.pull = 0
      return
    }
    if (input.pressed.a) this.launch(0.85)
  }

  private moveFlippers(input: InputFrame) {
    const both = input.held.a && this.inPlay
    const wants = [input.held.left || both, input.held.right || both]
    // Flipper buttons also rotate the lit top lanes, the classic lane change.
    if (input.pressed.left) this.lanes.push(this.lanes.shift()!)
    if (input.pressed.right) this.lanes.unshift(this.lanes.pop()!)
    this.flippers.forEach((f, i) => {
      f.target = wants[i] ? FLIP_UP : FLIP_REST
      if (wants[i] && f.angle === FLIP_REST && this.tick % 2 === 0) {
        this.sound.play('blip')
      }
    })
  }

  /** Swing each flipper one substep toward its target (fast up, slower down). */
  private swingFlippers() {
    for (const f of this.flippers) {
      const before = f.angle
      if (f.angle > f.target) {
        f.angle = Math.max(f.target, f.angle - FLIP_SPEED / SUBSTEPS)
      } else {
        f.angle = Math.min(f.target, f.angle + (FLIP_SPEED * 0.6) / SUBSTEPS)
      }
      f.omega = (f.angle - before) * SUBSTEPS
    }
  }

  private flipperTip(f: Flipper, angle = f.angle): Vec {
    // Right flipper is the left one mirrored.
    return {
      x: f.pivot.x + f.side * Math.cos(angle) * FLIPPER_LEN,
      y: f.pivot.y + Math.sin(angle) * FLIPPER_LEN,
    }
  }

  private step() {
    this.swingFlippers()
    const b = this.ball
    b.x += b.vx / SUBSTEPS
    b.y += b.vy / SUBSTEPS
    for (const s of this.walls) this.hitSegment(s)
    for (const bumper of this.bumpers) this.hitBumper(bumper)
    for (const f of this.flippers) this.hitFlipper(f)
    this.hitSaucer()
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > MAX_SPEED) {
      b.vx *= MAX_SPEED / speed
      b.vy *= MAX_SPEED / speed
    }
  }

  private hitSegment(s: Seg) {
    const b = this.ball
    const c = closestOnSegment(b, s)
    const dx = b.x - c.x
    const dy = b.y - c.y
    const d = Math.hypot(dx, dy)
    if (d >= R || d === 0) return
    const nx = dx / d
    const ny = dy / d
    b.x = c.x + nx * R
    b.y = c.y + ny * R
    const vn = b.vx * nx + b.vy * ny
    if (vn >= 0) return
    b.vx -= (1 + WALL_BOUNCE) * vn * nx
    b.vy -= (1 + WALL_BOUNCE) * vn * ny
    if (s.kick && -vn > 1) {
      b.vx += nx * s.kick
      b.vy += ny * s.kick
      this.addScore(10)
      this.bonus += 10
      this.sound.play('pop')
    }
    if (s.target !== undefined && -vn > 1.2) this.hitTarget(s.target)
  }

  private hitBumper(bumper: Bumper) {
    const b = this.ball
    const dx = b.x - bumper.x
    const dy = b.y - bumper.y
    const d = Math.hypot(dx, dy)
    if (d >= bumper.r + R || d === 0) return
    const nx = dx / d
    const ny = dy / d
    b.x = bumper.x + nx * (bumper.r + R)
    b.y = bumper.y + ny * (bumper.r + R)
    const vn = b.vx * nx + b.vy * ny
    if (vn < 0) {
      b.vx -= 2 * vn * nx
      b.vy -= 2 * vn * ny
    }
    // Pop bumpers always kick the ball away hard, with a little scatter.
    const a = Math.atan2(ny, nx) + (this.rng() - 0.5) * 0.3
    b.vx += Math.cos(a) * 4.5
    b.vy += Math.sin(a) * 4.5
    bumper.flash = 8
    const pop = this.mode?.key === 'net' ? 1000 * this.level : 100
    this.addScore(pop, bumper.x, bumper.y - 20)
    this.sound.play('pop')
  }

  private hitFlipper(f: Flipper) {
    const b = this.ball
    const tip = this.flipperTip(f)
    const c = closestOnSegment(b, { a: f.pivot, b: tip })
    const dx = b.x - c.x
    const dy = b.y - c.y
    const d = Math.hypot(dx, dy)
    const reach = R + FLIPPER_RADIUS
    if (d >= reach || d === 0) return
    const nx = dx / d
    const ny = dy / d
    b.x = c.x + nx * reach
    b.y = c.y + ny * reach
    // The flipper's surface moves: omega x r (mirrored for the right flipper).
    const rx = c.x - f.pivot.x
    const ry = c.y - f.pivot.y
    const w = f.omega * f.side
    const sx = -w * ry
    const sy = w * rx
    const rvx = b.vx - sx
    const rvy = b.vy - sy
    const vn = rvx * nx + rvy * ny
    if (vn >= 0) return
    b.vx = rvx - (1 + FLIPPER_BOUNCE) * vn * nx + sx
    b.vy = rvy - (1 + FLIPPER_BOUNCE) * vn * ny + sy
  }

  private hitSaucer() {
    const b = this.ball
    if (this.saucerCooldown > 0) return
    if (Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y) > SAUCER.r) return
    if (Math.hypot(b.vx, b.vy) > 9) return
    Object.assign(b, { x: SAUCER.x, y: SAUCER.y, vx: 0, vy: 0 })
    this.saucerHold = 50
    this.bonus += 1000
    // Saucer Rescue lights a village with every saucer shot.
    if (this.mode?.key === 'saucer') this.saucerReady = true
    if (this.saucerReady) {
      this.saucerReady = false
      this.targets = [false, false, false]
      this.villages++
      this.addScore(10_000 * this.multiplier, SAUCER.x - 30, SAUCER.y - 20)
      this.sound.play('extra')
      if (this.villages >= VILLAGES) {
        this.addScore(JACKPOT * this.level, W / 2, 200)
        this.banner = { text: 'JACKPOT!', sub: 'EVERY VILLAGE LIT', ticks: 150 }
        this.villages = 0
        this.level++
        this.sound.play('level')
      } else {
        this.banner = {
          text: 'VILLAGE LIT!',
          sub: `${VILLAGES - this.villages} TO JACKPOT`,
          ticks: 100,
        }
      }
    } else {
      this.addScore(2500, SAUCER.x - 20, SAUCER.y - 20)
      this.sound.play('pickup')
    }
  }

  private hitTarget(i: number) {
    this.targetFlash[i] = 12
    this.bonus += 500
    if (this.targets[i]) {
      this.addScore(100)
      return
    }
    this.targets[i] = true
    this.addScore(500, 40, 160 + i * 28)
    this.sound.play('pickup')
    if (this.targets.every(Boolean) && !this.saucerReady) {
      this.saucerReady = true
      this.banner = { text: 'SAUCER READY', sub: 'LIGHT A VILLAGE', ticks: 100 }
      this.sound.play('level')
    }
  }

  private checkLanes() {
    const b = this.ball
    if (b.y < 48 || b.y > 66) return
    LANES.forEach((x, i) => {
      if (Math.abs(b.x - x) < 8 && !this.lanes[i]) {
        this.lanes[i] = true
        this.addScore(
          this.mode?.key === 'lanes' ? 5000 * this.level : 250,
          x,
          80,
        )
        this.bonus += 250
        this.sound.play('blip')
      }
    })
    if (this.lanes.every(Boolean)) {
      this.lanes = [false, false, false]
      this.multiplier = Math.min(5, this.multiplier + 1)
      this.addScore(5000, W / 2, 90)
      this.banner = { text: `BONUS X${this.multiplier}`, ticks: 80 }
      this.sound.play('extra')
    }
  }

  // --- ramp and modes ----------------------------------------------------------

  private checkRampMouth() {
    const b = this.ball
    const m = RAMP_MOUTH
    if (b.x < m.x0 || b.x > m.x1 || b.y < m.y0 || b.y > m.y1) return
    if (b.vy > -m.minSpeed) return
    this.ramping = 1
    this.sound.play('shoot')
  }

  private rideRamp() {
    this.ramping++
    const at = rampPoint(this.ramping / RAMP_TICKS)
    this.ball.x = at.x
    this.ball.y = at.y
    if (this.ramping % 6 === 0) this.burst(at.x, at.y, 1, '#a78bfa')
    if (this.ramping < RAMP_TICKS) return
    // Off the end of the track into the left inlane, rolling toward the flipper.
    this.ramping = 0
    this.ball.vx = 0.6
    this.ball.vy = 1.6
    this.onRampShot()
  }

  private onRampShot() {
    this.rampStreak = Math.min(5, this.rampStreak + 1)
    this.bonus += 1000
    let points = 1000 * this.rampStreak * this.level
    if (this.mode?.key === 'ramp') points += 25_000 * this.level
    this.addScore(points, 214, 140)
    if (this.superReady) {
      this.superReady = false
      this.modesPlayed = 0
      this.addScore(SUPER_JACKPOT * this.level, W / 2, 180)
      this.banner = {
        text: 'SUPER JACKPOT!',
        sub: 'EVERY MODE PLAYED',
        ticks: 160,
      }
      this.sound.play('level')
      return
    }
    if (this.mode) return
    this.rampsTowardMode++
    if (this.rampsTowardMode >= RAMPS_PER_MODE) {
      this.rampsTowardMode = 0
      this.startMode()
    } else {
      this.sound.play('pickup')
    }
  }

  private startMode() {
    const def = PINBALL_MODES[this.modeIndex % PINBALL_MODES.length]!
    this.modeIndex++
    this.mode = { key: def.key, ticks: MODE_TICKS }
    this.banner = { text: def.name, sub: def.hint, ticks: 120 }
    this.sound.play('extra')
  }

  private endMode() {
    if (!this.mode) return
    this.mode = null
    this.modesPlayed++
    if (this.modesPlayed >= PINBALL_MODES.length) {
      this.superReady = true
      this.banner = {
        text: 'SUPER JACKPOT LIT',
        sub: 'SHOOT THE RAMP',
        ticks: 120,
      }
      this.sound.play('level')
    } else {
      this.banner = { text: 'MODE OVER', ticks: 70 }
    }
  }

  /** A ball that comes to rest somewhere odd gets a gentle shove. */
  private unstick() {
    const b = this.ball
    const onFlipper = b.y > 320 && b.x > 60 && b.x < 212
    if (Math.hypot(b.vx, b.vy) < 0.15 && !onFlipper) this.still++
    else this.still = 0
    if (this.still > 180) {
      b.vy = -3
      b.vx = (this.rng() - 0.5) * 3
      this.still = 0
    }
  }

  private drain() {
    if (this.ballSave > 0) {
      Object.assign(this.ball, { x: LANE_X, y: PLUNGER_Y - R, vx: 0, vy: 0 })
      this.inPlay = false
      this.ballSave = 0
      this.banner = { text: 'BALL SAVED!', ticks: 80 }
      this.sound.play('pickup')
      return
    }
    this.sound.play('die')
    if (this.mode) {
      this.mode = null
      this.modesPlayed++
      if (this.modesPlayed >= PINBALL_MODES.length) this.superReady = true
    }
    const bonus = this.bonus * this.multiplier
    this.addScore(bonus)
    this.banner = {
      text: 'BALL LOST',
      sub: bonus ? `BONUS ${bonus}` : undefined,
      ticks: 110,
    }
    this.draining = 110
  }

  private afterDrain() {
    this.lives--
    if (this.lives <= 0) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
      return
    }
    this.newBall()
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 45 })
    }
    if (!this.extraBallGiven && this.score >= EXTRA_BALL_AT) {
      this.extraBallGiven = true
      this.lives++
      this.banner = { text: 'EXTRA BALL!', ticks: 100 }
      this.sound.play('extra')
    }
    if (x !== undefined) this.burst(x, y ?? 0, 4, '#fde68a')
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.rng() * 15),
        color,
      })
    }
  }

  private updateEffects() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const b = this.ball
    if (!this.inPlay) {
      if (this.tick % 40 === 0) frame.pressed.a = true
      return frame
    }
    // Flip when the ball is coming down onto a flipper.
    for (const [i, f] of this.flippers.entries()) {
      const dx = (b.x - f.pivot.x) * f.side
      const near = dx > 4 && dx < FLIPPER_LEN + 4 && b.y > f.pivot.y - 30
      if (near && b.vy > -0.5 && b.y < f.pivot.y + 30) {
        if (i === 0) held.left = true
        else held.right = true
      }
    }
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderTable(g)
    this.renderFeatures(g)
    for (const f of this.flippers) this.renderFlipper(g, f)
    if (this.ramping === 0) this.renderBall(g)
    this.renderRamp(g)
    if (this.ramping > 0) this.renderBall(g)
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, s.life / 30)
      g.fillStyle = s.color
      g.fillRect(s.x - 1, s.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderTable(g: CanvasRenderingContext2D) {
    const bg = g.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1e1b4b')
    bg.addColorStop(0.55, '#4c1d95')
    bg.addColorStop(1, '#831843')
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    // A rainbow arc printed on the playfield.
    const bands = [
      '#f87171',
      '#fb923c',
      '#facc15',
      '#4ade80',
      '#38bdf8',
      '#a78bfa',
    ]
    g.lineWidth = 3
    bands.forEach((color, i) => {
      g.strokeStyle = color
      g.globalAlpha = 0.25
      g.beginPath()
      g.arc(CX, 300, 110 - i * 4, Math.PI * 1.1, Math.PI * 1.9)
      g.stroke()
    })
    g.globalAlpha = 1
    // Walls in neon.
    g.strokeStyle = '#5eead4'
    g.lineWidth = 2
    g.beginPath()
    for (const s of this.walls) {
      if (s.target !== undefined) continue
      g.moveTo(s.a.x, s.a.y)
      g.lineTo(s.b.x, s.b.y)
    }
    g.stroke()
    // Slingshot rubbers glow pink.
    g.strokeStyle = '#f472b6'
    g.lineWidth = 3
    g.beginPath()
    for (const s of this.walls) {
      if (!s.kick) continue
      g.moveTo(s.a.x, s.a.y)
      g.lineTo(s.b.x, s.b.y)
    }
    g.stroke()
    // Plunger and its spring.
    const py = PLUNGER_Y + this.pull * 12
    g.fillStyle = '#facc15'
    g.fillRect(LANE_X - 6, py, 12, 4)
    g.strokeStyle = '#a8a29e'
    g.lineWidth = 1
    g.beginPath()
    for (let y = py + 4; y < H; y += 3) {
      g.moveTo(LANE_X - 5, y)
      g.lineTo(LANE_X + 5, y + 1.5)
    }
    g.stroke()
  }

  private renderFeatures(g: CanvasRenderingContext2D) {
    // Top lanes N-E-T.
    LANES.forEach((x, i) => {
      g.fillStyle = this.lanes[i] ? '#facc15' : '#312e81'
      g.beginPath()
      g.arc(x, 74, 4, 0, Math.PI * 2)
      g.fill()
      drawText(g, LANE_LETTERS[i]!, x, 84, {
        align: 'center',
        color: this.lanes[i] ? '#fde68a' : '#818cf8',
      })
    })
    // Pop bumpers: glowing mushroom caps.
    for (const b of this.bumpers) {
      g.fillStyle = b.flash > 0 ? '#fef9c3' : '#be185d'
      g.beginPath()
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = b.flash > 0 ? '#facc15' : '#f9a8d4'
      g.beginPath()
      g.arc(b.x, b.y, b.r - 5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#5eead4'
      g.fillRect(b.x - 2, b.y - 2, 4, 4)
    }
    // A-M-I targets.
    TARGET_LETTERS.forEach((letter, i) => {
      const y = 176 + i * 28
      const lit = this.targets[i]
      g.fillStyle =
        this.targetFlash[i]! > 0 ? '#ffffff' : lit ? '#facc15' : '#7c3aed'
      g.fillRect(10, y - 9, 6, 18)
      drawText(g, letter, 24, y - 3, { color: lit ? '#fde68a' : '#c4b5fd' })
    })
    // The saucer, glowing when it is ready to light a village.
    const ready = this.saucerReady && Math.floor(this.tick / 8) % 2 === 0
    g.fillStyle = ready ? '#facc15' : '#1e1b4b'
    g.beginPath()
    g.arc(SAUCER.x, SAUCER.y, SAUCER.r + 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0b0620'
    g.beginPath()
    g.arc(SAUCER.x, SAUCER.y, SAUCER.r - 1, 0, Math.PI * 2)
    g.fill()
    // Five villages along the bottom of the arc: each hut lights up.
    for (let i = 0; i < VILLAGES; i++) {
      const x = 84 + i * 26
      const y = 250
      const lit = i < this.villages
      g.fillStyle = lit ? '#facc15' : '#3b0764'
      g.fillRect(x - 6, y - 4, 12, 8)
      g.beginPath()
      g.moveTo(x - 8, y - 4)
      g.lineTo(x, y - 11)
      g.lineTo(x + 8, y - 4)
      g.fill()
      if (lit) {
        g.fillStyle = '#1e1b4b'
        g.fillRect(x - 1, y, 3, 4)
      }
    }
    drawText(g, `X${this.multiplier}`, 136, 228, {
      align: 'center',
      color: '#fde68a',
    })
  }

  private renderRamp(g: CanvasRenderingContext2D) {
    // The raised track: a translucent band with neon rails.
    g.save()
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.globalAlpha = 0.35
    g.strokeStyle = '#7c3aed'
    g.lineWidth = 14
    g.beginPath()
    RAMP_PATH.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
    g.stroke()
    g.globalAlpha = 0.9
    g.strokeStyle = this.ramping ? '#f0abfc' : '#c084fc'
    g.lineWidth = 1.5
    for (const side of [-6, 6]) {
      g.beginPath()
      RAMP_PATH.forEach((p, i) => {
        const q = RAMP_PATH[Math.min(i + 1, RAMP_PATH.length - 1)]!
        const o = RAMP_PATH[Math.max(i - 1, 0)]!
        const dx = q.x - o.x
        const dy = q.y - o.y
        const len = Math.hypot(dx, dy) || 1
        const x = p.x - (dy / len) * side
        const y = p.y + (dx / len) * side
        if (i) g.lineTo(x, y)
        else g.moveTo(x, y)
      })
      g.stroke()
    }
    g.restore()
    // The mouth glows when a ramp shot matters most.
    const hot = this.superReady || this.mode?.key === 'ramp'
    const blink = Math.floor(this.tick / 8) % 2 === 0
    g.fillStyle = hot && blink ? '#facc15' : '#a855f7'
    g.beginPath()
    g.moveTo(RAMP_MOUTH.x0, RAMP_MOUTH.y1)
    g.lineTo((RAMP_MOUTH.x0 + RAMP_MOUTH.x1) / 2, RAMP_MOUTH.y1 - 10)
    g.lineTo(RAMP_MOUTH.x1, RAMP_MOUTH.y1)
    g.fill()
    const label = this.superReady
      ? 'SUPER'
      : this.mode
        ? 'RAMP'
        : `RAMP ${this.rampsTowardMode}/${RAMPS_PER_MODE}`
    drawText(g, label, (RAMP_MOUTH.x0 + RAMP_MOUTH.x1) / 2, RAMP_MOUTH.y1 + 4, {
      align: 'center',
      color: hot ? '#fde68a' : '#e9d5ff',
    })
  }

  private renderFlipper(g: CanvasRenderingContext2D, f: Flipper) {
    const tip = this.flipperTip(f)
    g.strokeStyle = '#facc15'
    g.lineCap = 'round'
    g.lineWidth = FLIPPER_RADIUS * 2 + 2
    g.beginPath()
    g.moveTo(f.pivot.x, f.pivot.y)
    g.lineTo(tip.x, tip.y)
    g.stroke()
    g.strokeStyle = '#f472b6'
    g.lineWidth = 2
    g.stroke()
    g.lineCap = 'butt'
  }

  private renderBall(g: CanvasRenderingContext2D) {
    if (this.draining > 0) return
    const b = this.ball
    const shine = g.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, R)
    shine.addColorStop(0, '#ffffff')
    shine.addColorStop(1, '#94a3b8')
    g.fillStyle = shine
    g.beginPath()
    g.arc(b.x, b.y, R, 0, Math.PI * 2)
    g.fill()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(7, '0'), 6, 4, {
      scale: 2,
      color: '#5eead4',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: '#fde68a',
      shadow,
    })
    drawText(g, `BALL ${this.ballNumber}`, W - 6, 13, {
      align: 'right',
      color: '#f9a8d4',
    })
    if (this.mode) {
      const def = PINBALL_MODES.find((m) => m.key === this.mode?.key)
      const seconds = Math.ceil(this.mode.ticks / 60)
      drawText(g, `${def?.name ?? ''} ${seconds}`, CX, 24, {
        align: 'center',
        color: '#f0abfc',
        shadow,
      })
    }
    if (this.ballSave > 0 && Math.floor(this.tick / 10) % 2 === 0) {
      drawText(g, 'SAVE', CX, 396, { align: 'center', color: '#86efac' })
    }
    if (!this.inPlay && this.draining === 0) {
      drawText(g, 'PULL DOWN', 236, 386, { align: 'center', color: '#fde68a' })
    }
    if (this.banner) {
      drawText(g, this.banner.text, CX, 286, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#9d174d',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, CX, 306, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const kindPinball: ArcadeGameModule = {
  create: (options) => new KindPinball(options),
}

export const create = kindPinball.create
export default kindPinball

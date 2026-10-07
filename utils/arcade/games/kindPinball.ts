// /utils/arcade/games/kindPinball.ts
//
// Kind Pinball -- AMI Village Rescue, the Kind Robots Arcade's pinball table.
// Built in four kr-arcade factory slices (table, scoring, ramp and modes, AMI
// multiball), then rebuilt as its own conductor project, kind-pinball. Style
// pass 1 (t-003) added the dot-matrix display, the lit and printed playfield,
// chrome rails and wireform ramps, a second ramp, the orbits, the skill shot
// and combos.
// Left and right work the flippers, A works both, hold Down to pull the
// plunger and let go to launch (A launches too), and Up nudges the table.
//
// Rules: roll through the N-E-T lanes at the top to raise the bonus
// multiplier (the flippers rotate the lit lanes). The blinking lane is the
// skill shot: plunge into it for a bonus, and steer it with the flippers
// before you launch. Hit the A-M-I targets to ready the saucer, then shoot
// the saucer to light a village. Light all five villages for the JACKPOT,
// which also steps up the level.
//
// Two ramps cross over the table. The right ramp drops into the left inlane
// and the left ramp drops into the right inlane. Ramp shots in a row on one
// ball are worth more each time, and every third one starts the next mode on
// the ladder (Net Rush, Ramp Frenzy, Lane Lights, Saucer Rescue), each 30
// seconds long. Play all four and the next ramp shot pays the SUPER JACKPOT.
// A fast shot up either side rides the arch around the top: an orbit. Each
// orbit lights a top lane. A ramp or orbit soon after another one is a combo
// worth more each time. Mode values scale with the level. Ball save shrinks
// with every ball and level, and an extra ball waits at 150,000.
//
// AMI multiball: lighting the third village lights MULTIBALL at the saucer.
// Shoot the saucer and two more balls kick out of the lane, three in all
// (balls lost in the first ten seconds are served again). Every ramp or
// saucer shot during multiball flies a mosquito net to a village; nets for
// all five villages pay the AMI JACKPOT. Multiball ends at one ball left.

import { drawText } from '../font'
import { Dmd, DMD_COLS, DMD_ROWS, dmdTextWidth } from '../pinball/dmd'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 288
/** Height of the playfield; the dot-matrix display sits above it. */
const H = 416
/** The display band above the playfield (128x32 dots at a 2px pitch). */
export const DMD_BAND = 72
export const PINBALL_HEIGHT = H + DMD_BAND
const DMD_PITCH = 2
const DMD_X = (W - DMD_COLS * DMD_PITCH) / 2
const DMD_Y = (DMD_BAND - DMD_ROWS * DMD_PITCH) / 2
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
/** How fast a ball rides a ramp, in pixels per tick. */
const RAMP_SPEED = 8.5
/** The village that lights multiball at the saucer. */
const MULTIBALL_AT_VILLAGE = 3
const MULTIBALL_BALLS = 3
const MULTIBALL_SAVE_TICKS = 60 * 10
const LAUNCH_GAP = 45
const NET_VALUE = 20_000
const AMI_JACKPOT = 150_000
const RAMPS_PER_MODE = 3
const MODE_TICKS = 60 * 30
const SKILL_SHOT = 25_000
const ORBIT_VALUE = 5_000
const COMBO_VALUE = 10_000
/** Ticks after a ramp or orbit in which the next one is a combo. */
const COMBO_WINDOW = 60 * 4
/** Ticks a ball may take to cross the top of the arch for an orbit. */
const ORBIT_TICKS = 70

type Vec = { x: number; y: number }

type RampKey = 'left' | 'right'
type RampDef = {
  key: RampKey
  /** A ball moving up through the mouth fast enough rides the ramp. */
  mouth: { x0: number; x1: number; y0: number; y1: number; minSpeed: number }
  /** The raised track, from the mouth over the table and into an inlane. */
  path: Vec[]
  /** The ball's velocity as it drops off the end of the track. */
  exit: Vec
}

/** The right ramp climbs over the top and drops into the left inlane. */
const RIGHT_RAMP: RampDef = {
  key: 'right',
  mouth: { x0: 200, x1: 228, y0: 150, y1: 172, minSpeed: 4.5 },
  path: [
    { x: 214, y: 162 },
    { x: 228, y: 110 },
    { x: 206, y: 90 },
    { x: 136, y: 94 },
    { x: 76, y: 104 },
    { x: 42, y: 160 },
    { x: 41, y: 250 },
    { x: 38, y: 290 },
  ],
  exit: { x: 0.6, y: 1.6 },
}

/** The left ramp crosses back over it and drops into the right inlane. */
const LEFT_RAMP: RampDef = {
  key: 'left',
  mouth: { x0: 44, x1: 72, y0: 150, y1: 172, minSpeed: 4.5 },
  path: [
    { x: 58, y: 162 },
    { x: 48, y: 126 },
    { x: 74, y: 114 },
    { x: 136, y: 116 },
    { x: 200, y: 112 },
    { x: 238, y: 124 },
    { x: 256, y: 160 },
    { x: 256, y: 244 },
    { x: 244, y: 288 },
  ],
  exit: { x: -0.6, y: 1.6 },
}

export const PINBALL_RAMPS: RampDef[] = [LEFT_RAMP, RIGHT_RAMP]

/** Kept for the original right ramp: where a ride is along it (t from 0 to 1). */
export const RAMP_MOUTH = RIGHT_RAMP.mouth

/** The mode ladder, started in order by every third ramp shot. */
export const PINBALL_MODES = [
  { key: 'net', name: 'NET RUSH', hint: 'BUMPERS 1,000' },
  { key: 'ramp', name: 'RAMP FRENZY', hint: 'RAMPS 25,000' },
  { key: 'lanes', name: 'LANE LIGHTS', hint: 'LANES 5,000' },
  { key: 'saucer', name: 'SAUCER RESCUE', hint: 'SAUCER LIGHTS VILLAGE' },
] as const
type ModeKey = (typeof PINBALL_MODES)[number]['key']

function pathLength(path: Vec[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++)
    total += Math.hypot(
      path[i]!.x - path[i - 1]!.x,
      path[i]!.y - path[i - 1]!.y,
    )
  return total
}

/** A point along a path at fraction t of its length (0 to 1). */
export function pathPoint(path: Vec[], t: number): Vec {
  const target = Math.max(0, Math.min(1, t)) * pathLength(path)
  let run = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (run + seg >= target || i === path.length - 1) {
      const f = seg ? Math.min(1, (target - run) / seg) : 0
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    run += seg
  }
  return { ...path[path.length - 1]! }
}

/** Where a ride is along the right ramp (t from 0 to 1). */
export function rampPoint(t: number): Vec {
  return pathPoint(RIGHT_RAMP.path, t)
}

function rampTicks(ramp: RampDef): number {
  return Math.max(24, Math.round(pathLength(ramp.path) / RAMP_SPEED))
}

function freshBall(): Ball {
  return {
    x: LANE_X,
    y: PLUNGER_Y - R,
    vx: 0,
    vy: 0,
    ramp: null,
    ramping: 0,
    still: 0,
    fresh: true,
    archSide: null,
    archAt: 0,
    trail: [],
  }
}

/** Where a village's hut sits, for the nets flying to it. */
function villageSpot(i: number): Vec {
  return { x: 84 + i * 26, y: 250 }
}

type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  /** The ramp the ball is riding, or null when it is on the table. */
  ramp: RampDef | null
  /** Ticks into a ramp ride. */
  ramping: number
  /** Ticks spent nearly motionless (see unstick). */
  still: number
  /** True from the plunger until the ball first touches a flipper. */
  fresh: boolean
  /** Which top corner of the arch the ball last passed, for orbits. */
  archSide: 'L' | 'R' | null
  archAt: number
  /** Recent positions, drawn as a motion trail at speed. */
  trail: Vec[]
}
/** A mosquito net flying from a shot to a village (t from 0 to 1). */
type NetFlight = { x0: number; y0: number; x1: number; y1: number; t: number }
type Seg = {
  a: Vec
  b: Vec
  kick?: number
  target?: number
  /** One-way: only solid to a ball moving down (the shooter-lane gate). */
  gate?: boolean
}
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
type Banner = { text: string; sub?: string; ticks: number; start: number }
type ShotKey = 'leftOrbit' | 'leftRamp' | 'saucer' | 'rightRamp' | 'rightOrbit'

const CX = 136

/** The top arch, as an ellipse traced into wall segments. */
const ARCH = { cx: 144, cy: 130, rx: 136, ry: 104 }
function arch(): Seg[] {
  const segs: Seg[] = []
  const steps = 24
  let prev: Vec = { x: ARCH.cx - ARCH.rx, y: ARCH.cy }
  for (let i = 1; i <= steps; i++) {
    const t = Math.PI + (Math.PI * i) / steps
    const p = {
      x: ARCH.cx + Math.cos(t) * ARCH.rx,
      y: ARCH.cy + Math.sin(t) * ARCH.ry,
    }
    segs.push({ a: prev, b: p })
    prev = p
  }
  return segs
}

function mirror(p: Vec): Vec {
  return { x: CX * 2 - p.x, y: p.y }
}

const SLING = {
  a: { x: 52, y: 262 },
  b: { x: 52, y: 298 },
  c: { x: 78, y: 316 },
}
const INLANE = { a: { x: 24, y: 296 }, b: { x: 80, y: 352 } }
const TOP_GUIDE = { a: { x: 8, y: 132 }, b: { x: 42, y: 150 } }
const LANE_DIVIDERS = [100, 124, 148, 172]
/** The one-way gate at the top of the shooter lane. */
const LANE_GATE: Seg = {
  a: { x: 264, y: 150 },
  b: { x: 280, y: 140 },
  gate: true,
}

/** Every wall on the table. Targets carry an index; slingshot faces carry a kick. */
export function tableWalls(): Seg[] {
  const walls: Seg[] = [
    ...arch(),
    { a: { x: 8, y: 130 }, b: { x: 8, y: H + 20 } },
    { a: { x: 280, y: 130 }, b: { x: 280, y: H + 20 } },
    // Plunger lane wall, the plunger tip the ball rests on, and the gate that
    // keeps a ball coming back down the arch out of the lane.
    { a: { x: 264, y: 150 }, b: { x: 264, y: H + 20 } },
    { a: { x: 264, y: PLUNGER_Y }, b: { x: 280, y: PLUNGER_Y } },
    LANE_GATE,
    // Top-left guide: a ball riding the arch down the left side is turned
    // back toward the bumpers instead of falling straight into the outlane.
    TOP_GUIDE,
    // Top lane dividers.
    ...LANE_DIVIDERS.map((x) => ({ a: { x, y: 52 }, b: { x, y: 68 } })),
  ]
  // Inlane guides feed the flippers; outlanes drain past them.
  walls.push(INLANE, { a: mirror(INLANE.a), b: mirror(INLANE.b) })
  // Slingshots: two plain sides and a kicking face toward the middle.
  const { a: sa, b: sb, c: sc } = SLING
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

/** Arrow inserts: where each shot's lamp sits and which way it points. */
const ARROWS: Array<{ key: ShotKey; x: number; y: number; angle: number }> = [
  { key: 'leftOrbit', x: 84, y: 206, angle: -2.0 },
  { key: 'leftRamp', x: 58, y: 192, angle: -1.75 },
  { key: 'saucer', x: 212, y: 230, angle: -0.75 },
  { key: 'rightRamp', x: 210, y: 194, angle: -1.45 },
  { key: 'rightOrbit', x: 236, y: 248, angle: -1.45 },
]

/** Warm general-illumination bulbs along the rails and slings. */
const GI_BULBS: Vec[] = [
  { x: 30, y: 300 },
  { x: 50, y: 320 },
  { x: 70, y: 340 },
  { x: 242, y: 300 },
  { x: 222, y: 320 },
  { x: 202, y: 340 },
  { x: 46, y: 256 },
  { x: 226, y: 256 },
  { x: 92, y: 40 },
  { x: 180, y: 40 },
  { x: 22, y: 150 },
  { x: 256, y: 180 },
]

const THEME = {
  base0: '#120a2e',
  base1: '#3b0f6b',
  base2: '#7a1450',
  rail: '#cbd5e1',
  railDark: '#1e293b',
  plastic: '#2dd4bf',
  rubber: '#f8fafc',
  gi: '#fde68a',
  insertOff: '#3b1d5e',
  ramp: { left: '#38bdf8', right: '#f472b6' },
} as const

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

/** A small, stable hash for render-only sparkle (never touches the game rng). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function formatScore(n: number): string {
  return Math.floor(n).toLocaleString('en-US')
}

type Layer = { canvas: HTMLCanvasElement; scale: number }

/** The canvas's current pixels-per-logical-pixel (1 when it cannot tell). */
function layerScale(g: CanvasRenderingContext2D): number {
  const m = typeof g.getTransform === 'function' ? g.getTransform() : null
  const a = m && typeof m.a === 'number' ? Math.abs(m.a) : 1
  return Math.max(1, Math.min(4, Math.round(a * 4) / 4))
}

function makeLayer(
  w: number,
  h: number,
  scale: number,
  draw: (c: CanvasRenderingContext2D) => void,
): Layer | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(w * scale)
  canvas.height = Math.ceil(h * scale)
  const c = canvas.getContext('2d')
  if (!c) return null
  c.setTransform(scale, 0, 0, scale, 0, 0)
  draw(c)
  return { canvas, scale }
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
  /** Every ball on the table: one, or up to three in multiball. */
  private balls: Ball[] = [freshBall()]
  /** The ball the physics helpers are working on right now. */
  private ball: Ball = this.balls[0]!
  private inPlay = false
  private pull = 0
  private ballNumber = 0
  private ballSave = 0
  /** Each ball gets one ball save, armed on its first launch. */
  private saveArmed = false
  private saucerHold = 0
  /** The ball sitting in the saucer, if any. */
  private saucerBall: Ball | null = null
  /** Ticks after an eject before the saucer can catch the ball again. */
  private saucerCooldown = 0
  private nudgeCooldown = 0
  private lanes = [false, false, false]
  /** The blinking top lane a plunged ball should roll through. */
  private skillLane = 1
  private skillLive = false
  private targets = [false, false, false]
  private targetFlash = [0, 0, 0]
  private slingFlash = [0, 0]
  private rampFlash: Record<RampKey, number> = { left: 0, right: 0 }
  private saucerReady = false
  private villages = 0
  private multiplier = 1
  private bonus = 0
  private extraBallGiven = false
  private draining = 0
  private multiballLit = false
  private multiball = false
  /** Balls still to kick out of the lane for multiball. */
  private pendingLaunches = 0
  private launchTimer = 0
  private multiballSave = 0
  /** Mosquito nets delivered this multiball. */
  private nets = 0
  private flights: NetFlight[] = []
  /** Ramp shots in a row on this ball (each one is worth more). */
  private rampStreak = 0
  /** Ramp shots toward starting the next mode. */
  private rampsTowardMode = 0
  private modeIndex = 0
  private mode: { key: ModeKey; ticks: number } | null = null
  private modesPlayed = 0
  private superReady = false
  /** Combo chain: ramps and orbits made in quick succession. */
  private combo = 0
  private lastShotAt = -COMBO_WINDOW
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private banner: Banner | null = null
  /** Ticks left on a lamp show (inserts chase) and a GI flash. */
  private lampShow = 0
  private giFlash = 0
  private shake = 0
  private dmd = new Dmd()
  private layers = new Map<string, Layer | null>()
  private dmdCache: { layer: Layer; frame: Uint8Array } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.newBall()
  }

  private say(text: string, ticks: number, sub?: string) {
    this.banner = { text, sub, ticks, start: this.tick }
  }

  /** A big moment: banner, lamp show, GI flash and a little shake. */
  private celebrate(text: string, sub?: string, ticks = 150) {
    this.say(text, ticks, sub)
    this.lampShow = 90
    this.giFlash = 24
    this.shake = 14
  }

  // --- balls ------------------------------------------------------------------

  private newBall() {
    this.ballNumber++
    this.balls = [freshBall()]
    this.ball = this.balls[0]!
    this.saucerBall = null
    this.saucerHold = 0
    this.multiball = false
    this.pendingLaunches = 0
    this.multiballSave = 0
    this.inPlay = false
    this.pull = 0
    this.saveArmed = false
    this.multiplier = 1
    this.bonus = 0
    this.lanes = [false, false, false]
    this.rampStreak = 0
    this.combo = 0
    this.mode = null
    this.skillLane = Math.floor(this.rng() * LANES.length)
    this.skillLive = true
    this.say(`BALL ${this.ballNumber}`, 80, 'SKILL SHOT IS LIT')
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
    this.ball.fresh = true
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
    for (let i = 0; i < 2; i++)
      if (this.slingFlash[i]! > 0) this.slingFlash[i]!--
    if (this.rampFlash.left > 0) this.rampFlash.left--
    if (this.rampFlash.right > 0) this.rampFlash.right--
    if (this.nudgeCooldown > 0) this.nudgeCooldown--
    if (this.saucerCooldown > 0) this.saucerCooldown--
    if (this.ballSave > 0) this.ballSave--

    if (!this.inPlay) {
      for (let i = 0; i < SUBSTEPS; i++) this.swingFlippers()
      this.ball = this.balls[0]!
      this.plunger(controls)
      return
    }
    if (this.mode && --this.mode.ticks <= 0) this.endMode()
    if (this.multiballSave > 0) this.multiballSave--
    if (this.tick - this.lastShotAt > COMBO_WINDOW) this.combo = 0
    this.feedLaunches()
    for (const b of this.balls) if (b.ramp) this.rideRamp(b)
    this.holdSaucer()
    const free = this.balls.filter((b) => !b.ramp && b !== this.saucerBall)
    if (controls.pressed.up && this.nudgeCooldown === 0) {
      for (const b of free) {
        b.vx += (this.rng() - 0.5) * 2
        b.vy -= 1.2
      }
      this.nudgeCooldown = 60
      this.shake = 8
      this.sound.play('blip')
    }
    for (const b of free) b.vy += GRAVITY
    for (let i = 0; i < SUBSTEPS; i++) {
      this.swingFlippers()
      for (const b of free) {
        // A ball the saucer caught earlier in this tick sits still.
        if (b === this.saucerBall) continue
        this.ball = b
        this.step()
      }
    }
    for (const b of free) {
      if (b === this.saucerBall) continue
      this.ball = b
      b.trail.push({ x: b.x, y: b.y })
      if (b.trail.length > 5) b.trail.shift()
      this.checkLanes()
      this.checkRampMouths()
      this.checkOrbit()
      const rolledBack =
        !b.ramp && b.x > 264 && b.y > PLUNGER_Y - R - 2 && Math.abs(b.vy) < 0.5
      if (rolledBack) {
        if (this.balls.length === 1 && this.pendingLaunches === 0) {
          // Rolled back down the lane: plunge again.
          Object.assign(b, { x: LANE_X, y: PLUNGER_Y - R, vx: 0, vy: 0 })
          b.trail = []
          this.inPlay = false
          return
        }
        // In multiball the lane kicks it straight back up.
        this.autoLaunch(b)
      }
      this.unstick()
    }
    this.collectDrains()
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
    // Flipper buttons also rotate the lit top lanes, the classic lane change;
    // before the launch they steer the skill shot.
    if (input.pressed.left) {
      this.lanes.push(this.lanes.shift()!)
      if (!this.inPlay)
        this.skillLane = (this.skillLane + LANES.length - 1) % LANES.length
    }
    if (input.pressed.right) {
      this.lanes.unshift(this.lanes.pop()!)
      if (!this.inPlay) this.skillLane = (this.skillLane + 1) % LANES.length
    }
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

  /** Move the current ball one substep (the flippers swing separately). */
  private step() {
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
    if (s.gate && b.vy < 0) return
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
      this.slingFlash[s.a.x < CX ? 0 : 1] = 8
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
    b.fresh = false
    this.skillLive = false
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
    if (this.saucerCooldown > 0 || this.saucerBall) return
    if (Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y) > SAUCER.r) return
    if (Math.hypot(b.vx, b.vy) > 9) return
    Object.assign(b, { x: SAUCER.x, y: SAUCER.y, vx: 0, vy: 0 })
    b.trail = []
    this.saucerBall = b
    this.saucerHold = this.multiball ? 30 : 50
    this.bonus += 1000
    if (this.multiball) {
      this.deliverNet(SAUCER.x, SAUCER.y)
      return
    }
    // Multiball lit by an earlier saucer shot starts on this one.
    const startMultiball = this.multiballLit
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
        this.celebrate('JACKPOT!', 'EVERY VILLAGE LIT')
        this.villages = 0
        this.level++
        this.sound.play('level')
      } else if (this.villages === MULTIBALL_AT_VILLAGE && !startMultiball) {
        this.multiballLit = true
        this.say('MULTIBALL LIT', 120, 'SHOOT THE SAUCER')
        this.lampShow = 60
      } else {
        this.say('VILLAGE LIT!', 100, `${VILLAGES - this.villages} TO JACKPOT`)
      }
    } else {
      this.addScore(2500, SAUCER.x - 20, SAUCER.y - 20)
      this.sound.play('pickup')
    }
    if (startMultiball) this.startMultiball()
  }

  /** Count down the saucer hold and kick the ball out when it ends. */
  private holdSaucer() {
    const b = this.saucerBall
    if (!b || --this.saucerHold > 0) return
    // Kick the ball out clear of the saucer, down toward the left flipper.
    this.saucerBall = null
    b.x = SAUCER.x - SAUCER.r - R - 1
    b.vx = -4
    b.vy = 2.5
    this.saucerCooldown = 30
    this.sound.play('shoot')
  }

  // --- AMI multiball -----------------------------------------------------------

  private startMultiball() {
    this.multiballLit = false
    this.multiball = true
    this.nets = 0
    this.pendingLaunches = MULTIBALL_BALLS - this.balls.length
    this.launchTimer = 30
    this.multiballSave = MULTIBALL_SAVE_TICKS
    this.celebrate('AMI MULTIBALL', 'NETS TO THE VILLAGES', 140)
    this.sound.play('level')
  }

  private endMultiball() {
    this.multiball = false
    this.multiballSave = 0
    this.say(
      'MULTIBALL OVER',
      100,
      this.nets ? `${this.nets} NETS DELIVERED` : undefined,
    )
  }

  /** Kick waiting multiball balls out of the lane, one at a time. */
  private feedLaunches() {
    if (this.pendingLaunches === 0 || --this.launchTimer > 0) return
    // Let the last ball clear the lane first.
    if (this.balls.some((b) => b.x > 264 && b.y > 300)) {
      this.launchTimer = 10
      return
    }
    const b = freshBall()
    this.balls.push(b)
    this.autoLaunch(b)
    this.pendingLaunches--
    this.launchTimer = LAUNCH_GAP
  }

  private autoLaunch(b: Ball) {
    Object.assign(b, {
      x: LANE_X,
      y: PLUNGER_Y - R,
      vx: 0,
      vy: -(12 + this.rng() * 2),
      fresh: true,
      trail: [],
    })
    this.sound.play('start')
  }

  /** Fly a mosquito net from a shot to the next village. */
  private deliverNet(x: number, y: number) {
    const to = villageSpot(this.nets % VILLAGES)
    this.nets++
    this.flights.push({ x0: x, y0: y, x1: to.x, y1: to.y - 6, t: 0 })
    this.addScore(NET_VALUE * this.level, x, y - 16)
    this.sound.play('pickup')
    if (this.nets % VILLAGES === 0) {
      this.addScore(AMI_JACKPOT * this.level, W / 2, 200)
      this.celebrate('AMI JACKPOT!', 'NETS FOR ALL VILLAGES')
      this.sound.play('level')
    }
  }

  /** Take drained balls off the table; the last one ends the ball. */
  private collectDrains() {
    const kept = this.balls.filter((b) => b.y <= H + 10)
    const lost = this.balls.length - kept.length
    if (lost === 0) return
    this.balls = kept
    if (this.multiball && this.multiballSave > 0) {
      // Multiball save: the lane serves each lost ball again.
      this.pendingLaunches += lost
      this.launchTimer = Math.min(this.launchTimer, 20)
      this.say('BALL SAVED!', 60)
      this.sound.play('pickup')
    }
    if (this.balls.length === 0 && this.pendingLaunches > 0) {
      this.pendingLaunches--
      const b = freshBall()
      this.balls.push(b)
      this.autoLaunch(b)
    }
    if (this.multiball && this.balls.length + this.pendingLaunches <= 1) {
      this.endMultiball()
    }
    if (this.balls.length === 0) {
      this.balls = [freshBall()]
      this.ball = this.balls[0]!
      this.drain()
      return
    }
    this.ball = this.balls[0]!
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
      this.say('SAUCER READY', 100, 'LIGHT A VILLAGE')
      this.sound.play('level')
    }
  }

  private checkLanes() {
    const b = this.ball
    if (b.y < 48 || b.y > 66) return
    LANES.forEach((x, i) => {
      if (Math.abs(b.x - x) >= 8) return
      if (this.skillLive && b.fresh) {
        this.skillLive = false
        if (i === this.skillLane) {
          this.addScore(SKILL_SHOT * this.level, x, 90)
          this.celebrate(
            'SKILL SHOT!',
            `${formatScore(SKILL_SHOT * this.level)}`,
            100,
          )
          this.sound.play('extra')
        }
      }
      if (this.lanes[i]) return
      this.lanes[i] = true
      this.addScore(this.mode?.key === 'lanes' ? 5000 * this.level : 250, x, 80)
      this.bonus += 250
      this.sound.play('blip')
    })
    this.checkLaneSet()
  }

  private checkLaneSet() {
    if (!this.lanes.every(Boolean)) return
    this.lanes = [false, false, false]
    this.multiplier = Math.min(5, this.multiplier + 1)
    this.addScore(5000, W / 2, 90)
    this.say(`BONUS X${this.multiplier}`, 80)
    this.sound.play('extra')
  }

  // --- ramps, orbits, combos and modes ------------------------------------------

  private checkRampMouths() {
    const b = this.ball
    for (const ramp of PINBALL_RAMPS) {
      const m = ramp.mouth
      if (b.x < m.x0 || b.x > m.x1 || b.y < m.y0 || b.y > m.y1) continue
      if (b.vy > -m.minSpeed) continue
      b.ramp = ramp
      b.ramping = 1
      b.trail = []
      this.rampFlash[ramp.key] = 20
      this.sound.play('shoot')
      return
    }
  }

  /**
   * A ball crossing the top of the arch from one corner to the other, fast,
   * is an orbit. A freshly plunged ball does the same on its way to the top
   * lanes, so it only counts once the ball has been flipped.
   */
  private checkOrbit() {
    const b = this.ball
    if (b.y > 100) return
    const side = b.x < 70 ? 'L' : b.x > 202 ? 'R' : null
    if (!side || side === b.archSide) {
      if (side) b.archAt = this.tick
      return
    }
    const crossed =
      b.archSide !== null &&
      this.tick - b.archAt < ORBIT_TICKS &&
      Math.hypot(b.vx, b.vy) > 3
    b.archSide = side
    b.archAt = this.tick
    if (!crossed || b.fresh) return
    // Up the right side and out the left is the right orbit, and vice versa.
    this.onOrbit(side === 'L' ? 'rightOrbit' : 'leftOrbit')
  }

  private onOrbit(key: 'leftOrbit' | 'rightOrbit') {
    this.bonus += 500
    this.addScore(ORBIT_VALUE * this.level, key === 'leftOrbit' ? 220 : 60, 60)
    // Each orbit lights the next unlit top lane.
    const unlit = this.lanes.indexOf(false)
    if (unlit >= 0) {
      this.lanes[unlit] = true
      this.checkLaneSet()
    }
    this.sound.play('pickup')
    this.onComboShot()
  }

  /** Ramps and orbits made one after another build a combo. */
  private onComboShot() {
    const chained = this.tick - this.lastShotAt <= COMBO_WINDOW
    this.lastShotAt = this.tick
    this.combo = chained ? this.combo + 1 : 1
    if (this.combo < 2) return
    const points = COMBO_VALUE * (this.combo - 1) * this.level
    this.addScore(points, W / 2, 150)
    if (!this.banner || this.tick - this.banner.start > 30) {
      this.say(`${this.combo} WAY COMBO`, 80, formatScore(points))
      this.lampShow = Math.max(this.lampShow, 40)
    }
    this.sound.play('extra')
  }

  private rideRamp(b: Ball) {
    const ramp = b.ramp!
    b.ramping++
    const ticks = rampTicks(ramp)
    const at = pathPoint(ramp.path, b.ramping / ticks)
    b.x = at.x
    b.y = at.y
    if (b.ramping % 5 === 0) this.burst(at.x, at.y, 1, THEME.ramp[ramp.key])
    if (b.ramping < ticks) return
    // Off the end of the track into an inlane, rolling toward a flipper.
    b.ramp = null
    b.ramping = 0
    b.vx = ramp.exit.x
    b.vy = ramp.exit.y
    this.rampFlash[ramp.key] = 20
    this.onRampShot(ramp)
  }

  private onRampShot(ramp: RampDef) {
    const at = ramp.path[0]!
    this.rampStreak = Math.min(5, this.rampStreak + 1)
    this.bonus += 1000
    let points = 1000 * this.rampStreak * this.level
    if (this.mode?.key === 'ramp') points += 25_000 * this.level
    this.addScore(points, at.x, at.y - 22)
    if (this.multiball) this.deliverNet(at.x, at.y - 40)
    this.onComboShot()
    if (this.superReady) {
      this.superReady = false
      this.modesPlayed = 0
      this.addScore(SUPER_JACKPOT * this.level, W / 2, 180)
      this.celebrate('SUPER JACKPOT!', 'EVERY MODE PLAYED', 160)
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
    this.say(def.name, 120, def.hint)
    this.lampShow = 60
    this.sound.play('extra')
  }

  private endMode() {
    if (!this.mode) return
    this.mode = null
    this.modesPlayed++
    if (this.modesPlayed >= PINBALL_MODES.length) {
      this.superReady = true
      this.say('SUPER JACKPOT LIT', 120, 'SHOOT EITHER RAMP')
      this.lampShow = 60
      this.sound.play('level')
    } else {
      this.say('MODE OVER', 70)
    }
  }

  /** A ball that comes to rest somewhere odd gets a gentle shove. */
  private unstick() {
    const b = this.ball
    const onFlipper = b.y > 320 && b.x > 60 && b.x < 212
    if (Math.hypot(b.vx, b.vy) < 0.15 && !onFlipper) b.still++
    else b.still = 0
    if (b.still > 180) {
      b.vy = -3
      b.vx = (this.rng() - 0.5) * 3
      b.still = 0
    }
  }

  private drain() {
    if (this.multiball) this.endMultiball()
    if (this.ballSave > 0) {
      Object.assign(this.ball, freshBall())
      this.inPlay = false
      this.ballSave = 0
      this.say('BALL SAVED!', 80, 'SHOOT AGAIN')
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
    this.say(
      'BONUS',
      110,
      bonus ? `${formatScore(this.bonus)} X ${this.multiplier}` : undefined,
    )
    this.draining = 110
  }

  private afterDrain() {
    this.lives--
    if (this.lives <= 0) {
      this.over = true
      this.say('GAME OVER', 9999)
      return
    }
    this.newBall()
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: formatScore(points), life: 45 })
    }
    if (!this.extraBallGiven && this.score >= EXTRA_BALL_AT) {
      this.extraBallGiven = true
      this.lives++
      this.celebrate('EXTRA BALL!', 'SHOOT AGAIN', 100)
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
    for (const n of this.flights) n.t += 1 / 40
    this.flights = this.flights.filter((n) => n.t < 1)
    if (this.lampShow > 0) this.lampShow--
    if (this.giFlash > 0) this.giFlash--
    if (this.shake > 0) this.shake--
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
    if (!this.inPlay) {
      if (this.tick % 40 === 0) frame.pressed.a = true
      return frame
    }
    // Flip when a ball is coming down onto a flipper.
    for (const b of this.balls) {
      if (b.ramp) continue
      for (const [i, f] of this.flippers.entries()) {
        const dx = (b.x - f.pivot.x) * f.side
        const near = dx > 4 && dx < FLIPPER_LEN + 4 && b.y > f.pivot.y - 30
        if (near && b.vy > -0.5 && b.y < f.pivot.y + 30) {
          if (i === 0) held.left = true
          else held.right = true
        }
      }
    }
    return frame
  }

  // --- what the lamps show ---------------------------------------------------------

  /** 0 = off, 1 = on, 2 = blinking, per shot arrow. */
  private arrowState(key: ShotKey): 0 | 1 | 2 {
    const comboLive = this.inPlay && this.tick - this.lastShotAt <= COMBO_WINDOW
    switch (key) {
      case 'leftRamp':
      case 'rightRamp':
        if (this.superReady || this.mode?.key === 'ramp' || this.multiball)
          return 2
        return comboLive ? 2 : 1
      case 'saucer':
        if (this.multiballLit || this.saucerReady) return 2
        if (this.mode?.key === 'saucer' || this.multiball) return 2
        return 0
      case 'leftOrbit':
      case 'rightOrbit':
        if (comboLive) return 2
        return this.lanes.includes(false) ? 1 : 0
    }
  }

  private lit(state: 0 | 1 | 2, index: number): boolean {
    if (this.lampShow > 0) return (Math.floor(this.tick / 4) + index) % 3 === 0
    if (state === 2) return Math.floor(this.tick / 8) % 2 === 0
    return state === 1
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#05030b'
    g.fillRect(0, 0, W, PINBALL_HEIGHT)
    this.renderDmd(g)
    g.save()
    const jolt = this.shake > 0 ? this.shake / 14 : 0
    g.translate(
      Math.round((hash(this.tick) - 0.5) * 3 * jolt),
      DMD_BAND + Math.round((hash(this.tick + 99) - 0.5) * 3 * jolt),
    )
    this.layer(g, 'art', (c) => this.renderArt(c))
    this.renderInserts(g)
    this.renderGi(g)
    this.layer(g, 'rails', (c) => {
      // Mask everything outside the arch with the cabinet black, then the rails.
      c.fillStyle = '#05030b'
      c.beginPath()
      c.rect(-4, -4, W + 8, H + 8)
      this.playfieldPath(c)
      c.fill('evenodd')
      this.renderRails(c)
    })
    this.renderSlings(g)
    this.renderTargets(g)
    this.renderSaucer(g)
    this.renderBumpers(g)
    this.renderPlunger(g)
    for (const f of this.flippers) this.renderFlipper(g, f)
    for (const b of this.balls) if (!b.ramp) this.renderBall(g, b)
    this.renderRamps(g)
    for (const b of this.balls) if (b.ramp) this.renderBall(g, b, true)
    this.renderFlights(g)
    this.layer(g, 'apron', (c) => this.renderApron(c))
    this.renderBallsLeft(g)
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, s.life / 30)
      g.fillStyle = s.color
      g.fillRect(s.x - 1, s.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      g.globalAlpha = Math.min(1, f.life / 20)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef3c7',
        shadow: '#431407',
      })
    }
    g.globalAlpha = 1
    if (this.giFlash > 0) {
      g.fillStyle = `rgba(255, 247, 214, ${(this.giFlash / 24) * 0.35})`
      g.fillRect(0, 0, W, H)
    }
    g.restore()
  }

  // --- cached layers ------------------------------------------------------------------

  /**
   * Draw a static layer through an offscreen canvas at the screen's pixel
   * scale, so the printed art, the rails and the apron cost one drawImage a
   * frame instead of hundreds of draw calls. Without a DOM (the headless
   * tests) it draws straight through.
   */
  private layer(
    g: CanvasRenderingContext2D,
    key: string,
    draw: (c: CanvasRenderingContext2D) => void,
  ) {
    const scale = layerScale(g)
    let cached = this.layers.get(key)
    if (cached === undefined || (cached && cached.scale !== scale)) {
      cached = makeLayer(W, H, scale, draw)
      this.layers.set(key, cached)
    }
    if (cached) g.drawImage(cached.canvas, 0, 0, W, H)
    else draw(g)
  }

  // --- the dot-matrix display ---------------------------------------------------------

  private renderDmd(g: CanvasRenderingContext2D) {
    // The display window: a black bezel with a faint amber glow.
    g.fillStyle = '#000000'
    g.fillRect(
      DMD_X - 6,
      DMD_Y - 3,
      DMD_COLS * DMD_PITCH + 12,
      DMD_ROWS * DMD_PITCH + 6,
    )
    g.strokeStyle = '#3f3f46'
    g.lineWidth = 1
    g.strokeRect(
      DMD_X - 5.5,
      DMD_Y - 2.5,
      DMD_COLS * DMD_PITCH + 11,
      DMD_ROWS * DMD_PITCH + 5,
    )
    this.composeDmd()
    const w = DMD_COLS * DMD_PITCH
    const h = DMD_ROWS * DMD_PITCH
    const scale = layerScale(g)
    const cache = this.dmdCache
    const fresh =
      cache &&
      cache.layer.scale === scale &&
      cache.frame.every((v, i) => v === this.dmd.buf[i])
    if (!fresh) {
      const layer = makeLayer(w, h, scale, (c) =>
        this.dmd.render(c, 0, 0, DMD_PITCH),
      )
      this.dmdCache = layer ? { layer, frame: this.dmd.buf.slice() } : null
    }
    if (this.dmdCache)
      g.drawImage(this.dmdCache.layer.canvas, DMD_X, DMD_Y, w, h)
    else this.dmd.render(g, DMD_X, DMD_Y, DMD_PITCH)
    const glow = g.createLinearGradient(
      0,
      DMD_Y,
      0,
      DMD_Y + DMD_ROWS * DMD_PITCH,
    )
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.06)')
    glow.addColorStop(1, 'rgba(251, 146, 60, 0)')
    g.fillStyle = glow
    g.fillRect(DMD_X, DMD_Y, DMD_COLS * DMD_PITCH, DMD_ROWS * DMD_PITCH)
  }

  /** Big text: two-dot scale when it fits, bold single scale when it does not. */
  private dmdBig(
    text: string,
    y: number,
    reveal?: number,
    level: 0 | 1 | 2 | 3 = 3,
  ) {
    const d = this.dmd
    if (dmdTextWidth(text, 2) <= DMD_COLS - 4) {
      d.text(text, DMD_COLS / 2, y, {
        scale: 2,
        align: 'center',
        reveal,
        level,
      })
    } else {
      d.text(text, DMD_COLS / 2, y + 4, {
        bold: true,
        align: 'center',
        reveal,
        level,
      })
    }
  }

  /** A small line, scrolled like a marquee when it is wider than the display. */
  private dmdLine(text: string, y: number, age: number) {
    const width = dmdTextWidth(text)
    if (width <= DMD_COLS - 2) {
      this.dmd.text(text, DMD_COLS / 2, y, { align: 'center', level: 2 })
      return
    }
    const x = DMD_COLS - (age % (width + DMD_COLS))
    this.dmd.text(text, x, y, { level: 2 })
  }

  private composeDmd() {
    const d = this.dmd
    d.clear()
    if (this.demo) {
      const page = Math.floor(this.tick / 150) % 3
      if (page === 0) {
        this.dmdBig('KIND', 1)
        this.dmdBig('PINBALL', 16)
      } else if (page === 1) {
        d.text('HIGH SCORE', DMD_COLS / 2, 3, { align: 'center', level: 2 })
        this.dmdBig(formatScore(this.hiScore), 14)
      } else {
        this.dmdBig('AMI VILLAGE', 2)
        d.text('RESCUE', DMD_COLS / 2, 22, { align: 'center', level: 2 })
      }
      return
    }
    const banner = this.banner
    if (banner) {
      const age = this.tick - banner.start
      const big = /JACKPOT|MULTIBALL|EXTRA|SKILL|COMBO|GAME OVER/.test(
        banner.text,
      )
      if (big) {
        d.frame(0, 0, DMD_COLS, DMD_ROWS, Math.floor(age / 4) % 2 ? 1 : 3)
        for (let i = 0; i < 14; i++) {
          const h = hash(Math.floor(age / 3) * 31 + i)
          d.dot(2 + h * (DMD_COLS - 4), 2 + hash(h * 97) * (DMD_ROWS - 4), 2)
        }
      }
      this.dmdBig(banner.text, banner.sub ? 3 : 9, Math.floor(age / 2) + 1)
      if (banner.sub && age > 10) this.dmdLine(banner.sub, 22, age - 10)
      if (banner.text === 'GAME OVER') {
        d.text(formatScore(this.score), DMD_COLS / 2, 22, {
          align: 'center',
          level: 3,
        })
      }
      if (big && age < 36 && Math.floor(age / 6) % 2 === 0) d.invert()
      return
    }
    this.dmdBig(formatScore(this.score), 2)
    let status = `BALL ${this.ballNumber}`
    if (!this.inPlay) {
      status =
        Math.floor(this.tick / 90) % 2
          ? `SKILL SHOT: LANE ${LANE_LETTERS[this.skillLane]}`
          : 'HOLD DOWN TO PLUNGE'
    } else if (this.mode) {
      const def = PINBALL_MODES.find((m) => m.key === this.mode?.key)
      status = `${def?.name ?? ''} ${Math.ceil(this.mode.ticks / 60)}`
    } else if (this.multiball) {
      status = `MULTIBALL  NETS ${this.nets % VILLAGES}/${VILLAGES}`
    } else if (this.superReady) {
      status = 'SUPER JACKPOT LIT'
    } else if (this.combo >= 1 && this.tick - this.lastShotAt <= COMBO_WINDOW) {
      status = `COMBO X${this.combo + 1} LIT`
    }
    this.dmdLine(status, 23, this.tick)
    if (status.startsWith('BALL')) {
      d.text(`X${this.multiplier}`, 2, 23, { level: 1 })
      d.text(`${this.rampsTowardMode}/${RAMPS_PER_MODE}`, DMD_COLS - 2, 23, {
        align: 'right',
        level: 1,
      })
    }
  }

  // --- the playfield ---------------------------------------------------------------------

  /** Adds the playfield outline (arch and sides) to the current path. */
  private playfieldPath(g: CanvasRenderingContext2D) {
    g.moveTo(8, H)
    g.lineTo(8, ARCH.cy)
    g.ellipse(ARCH.cx, ARCH.cy, ARCH.rx, ARCH.ry, 0, Math.PI, Math.PI * 2)
    g.lineTo(280, H)
    g.lineTo(8, H)
    g.closePath()
  }

  /** The printed playfield: colour wash, sunburst, rainbow, lane art, AMI. */
  private renderArt(g: CanvasRenderingContext2D) {
    const bg = g.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, THEME.base0)
    bg.addColorStop(0.5, THEME.base1)
    bg.addColorStop(1, THEME.base2)
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    // Sunburst rays behind the bumpers.
    g.save()
    g.translate(136, 168)
    for (let i = 0; i < 24; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(253,224,71,0.05)'
      g.beginPath()
      g.moveTo(0, 0)
      g.arc(0, 0, 220, (i * Math.PI) / 12, ((i + 1) * Math.PI) / 12)
      g.closePath()
      g.fill()
    }
    g.restore()
    // A glowing halo where the pop bumpers live.
    const halo = g.createRadialGradient(136, 160, 4, 136, 160, 90)
    halo.addColorStop(0, 'rgba(244,114,182,0.35)')
    halo.addColorStop(1, 'rgba(244,114,182,0)')
    g.fillStyle = halo
    g.fillRect(40, 70, 192, 180)
    // The rainbow over the villages.
    const bands = [
      '#f87171',
      '#fb923c',
      '#facc15',
      '#4ade80',
      '#38bdf8',
      '#a78bfa',
    ]
    g.lineWidth = 4
    bands.forEach((color, i) => {
      g.strokeStyle = color
      g.globalAlpha = 0.32
      g.beginPath()
      g.arc(CX, 300, 112 - i * 4.5, Math.PI * 1.08, Math.PI * 1.92)
      g.stroke()
    })
    g.globalAlpha = 1
    // Inlane and outlane stripes.
    for (const side of [1, -1]) {
      g.save()
      if (side < 0) {
        g.translate(CX * 2, 0)
        g.scale(-1, 1)
      }
      g.fillStyle = 'rgba(15, 23, 42, 0.45)'
      g.beginPath()
      g.moveTo(8, 250)
      g.lineTo(24, 296)
      g.lineTo(80, 352)
      g.lineTo(80, H)
      g.lineTo(8, H)
      g.closePath()
      g.fill()
      g.strokeStyle = 'rgba(94, 234, 212, 0.18)'
      g.lineWidth = 1
      for (let y = 300; y < H; y += 10) {
        g.beginPath()
        g.moveTo(10, y)
        g.lineTo(20, y - 6)
        g.stroke()
      }
      g.restore()
    }
    // AMI, the Kind Robots mascot, printed big between the slings.
    this.renderAmiPrint(g, 136, 300)
    // A soft vignette for depth.
    const vig = g.createRadialGradient(136, 230, 120, 136, 230, 300)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.55)')
    g.fillStyle = vig
    g.fillRect(0, 0, W, H)
  }

  private renderAmiPrint(g: CanvasRenderingContext2D, x: number, y: number) {
    g.save()
    g.globalAlpha = 0.5
    g.fillStyle = '#1e1b4b'
    g.strokeStyle = '#5eead4'
    g.lineWidth = 1.5
    g.beginPath()
    g.roundRect(x - 20, y - 16, 40, 30, 8)
    g.fill()
    g.stroke()
    g.beginPath()
    g.moveTo(x, y - 16)
    g.lineTo(x, y - 24)
    g.stroke()
    g.fillStyle = '#f472b6'
    g.beginPath()
    g.arc(x, y - 26, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#5eead4'
    for (const ex of [-8, 8]) {
      g.beginPath()
      g.ellipse(x + ex, y - 3, 4, 4, 0, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = '#fde68a'
    g.beginPath()
    g.arc(x, y + 3, 7, 0.2 * Math.PI, 0.8 * Math.PI)
    g.stroke()
    g.restore()
  }

  /** One lamp insert: a dark coloured lens, or a bright one with a halo. */
  private insertGlow(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    on: boolean,
    radius = 12,
  ) {
    if (!on) return
    const glow = g.createRadialGradient(x, y, 1, x, y, radius)
    glow.addColorStop(0, color)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.55
    g.fillStyle = glow
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    g.restore()
  }

  private renderInserts(g: CanvasRenderingContext2D) {
    const colors: Record<ShotKey, string> = {
      leftOrbit: '#facc15',
      leftRamp: THEME.ramp.left,
      saucer: '#4ade80',
      rightRamp: THEME.ramp.right,
      rightOrbit: '#fb923c',
    }
    ARROWS.forEach((arrow, i) => {
      const on = this.lit(this.arrowState(arrow.key), i)
      const color = colors[arrow.key]
      g.save()
      g.translate(arrow.x, arrow.y)
      g.rotate(arrow.angle + Math.PI / 2)
      g.beginPath()
      g.moveTo(0, -9)
      g.lineTo(7, 4)
      g.lineTo(0, 1)
      g.lineTo(-7, 4)
      g.closePath()
      g.fillStyle = on ? color : THEME.insertOff
      g.globalAlpha = on ? 1 : 0.8
      g.fill()
      g.globalAlpha = 1
      g.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.18)'
      g.lineWidth = 0.75
      g.stroke()
      g.restore()
      this.insertGlow(g, arrow.x, arrow.y, color, on, 16)
    })
    // Top lane rollover lamps, with the skill shot lane blinking.
    LANES.forEach((x, i) => {
      const skill =
        this.skillLive &&
        i === this.skillLane &&
        Math.floor(this.tick / 6) % 2 === 0
      const on = this.lanes[i] || skill || (this.lampShow > 0 && this.lit(1, i))
      const color = skill ? '#4ade80' : '#facc15'
      g.fillStyle = on ? color : THEME.insertOff
      g.beginPath()
      g.roundRect(x - 5, 71, 10, 12, 4)
      g.fill()
      this.insertGlow(g, x, 77, color, on, 12)
      drawText(g, LANE_LETTERS[i]!, x, 74, {
        align: 'center',
        color: on ? '#422006' : '#a5b4fc',
      })
    })
    // Bonus multiplier lamps.
    ;[2, 3, 4, 5].forEach((n, i) => {
      const x = 100 + i * 24
      const on =
        this.multiplier >= n || (this.lampShow > 0 && this.lit(1, i + 3))
      g.fillStyle = on ? '#fb923c' : THEME.insertOff
      g.beginPath()
      g.arc(x, 226, 7, 0, Math.PI * 2)
      g.fill()
      this.insertGlow(g, x, 226, '#fb923c', on, 12)
      drawText(g, `${n}X`, x, 223, {
        align: 'center',
        color: on ? '#431407' : '#7c6aa6',
      })
    })
    // Five village huts.
    for (let i = 0; i < VILLAGES; i++) {
      const { x, y } = villageSpot(i)
      const lit = i < this.villages || (this.lampShow > 0 && this.lit(1, i))
      g.fillStyle = lit ? '#facc15' : THEME.insertOff
      g.fillRect(x - 6, y - 4, 12, 8)
      g.beginPath()
      g.moveTo(x - 8, y - 4)
      g.lineTo(x, y - 11)
      g.lineTo(x + 8, y - 4)
      g.fill()
      g.fillStyle = lit ? '#7c2d12' : '#1e1033'
      g.fillRect(x - 1.5, y, 3, 4)
      this.insertGlow(g, x, y - 3, '#facc15', lit, 14)
      if (this.multiball && i < this.nets % VILLAGES)
        this.renderNet(g, x, y - 6)
    }
    // Shoot Again, between the flippers.
    const saving =
      (this.ballSave > 0 &&
        (this.ballSave > 120 || Math.floor(this.tick / 6) % 2 === 0)) ||
      this.multiballSave > 0
    g.fillStyle = saving ? '#f87171' : THEME.insertOff
    g.beginPath()
    g.roundRect(122, 362, 28, 11, 5)
    g.fill()
    this.insertGlow(g, 136, 367, '#f87171', saving, 16)
    drawText(g, 'SAVE', 136, 364, {
      align: 'center',
      color: saving ? '#450a0a' : '#7c6aa6',
    })
  }

  private renderGi(g: CanvasRenderingContext2D) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const [i, p] of GI_BULBS.entries()) {
      const flicker = 0.85 + hash(i * 13 + Math.floor(this.tick / 7)) * 0.15
      const glow = g.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, 18)
      glow.addColorStop(0, `rgba(253, 230, 138, ${0.55 * flicker})`)
      glow.addColorStop(1, 'rgba(253, 230, 138, 0)')
      g.fillStyle = glow
      g.fillRect(p.x - 18, p.y - 18, 36, 36)
    }
    g.restore()
    for (const p of GI_BULBS) {
      g.fillStyle = '#fffbeb'
      g.beginPath()
      g.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
      g.fill()
    }
  }

  /** A chrome rail: dark edge, steel body, a thin highlight. */
  private chrome(g: CanvasRenderingContext2D, draw: () => void, width = 3) {
    g.save()
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.strokeStyle = 'rgba(0,0,0,0.45)'
    g.lineWidth = width + 2
    g.translate(1.5, 2)
    g.beginPath()
    draw()
    g.stroke()
    g.translate(-1.5, -2)
    g.strokeStyle = THEME.railDark
    g.lineWidth = width + 1.5
    g.beginPath()
    draw()
    g.stroke()
    g.strokeStyle = '#94a3b8'
    g.lineWidth = width
    g.stroke()
    g.strokeStyle = '#f8fafc'
    g.lineWidth = Math.max(0.75, width * 0.3)
    g.stroke()
    g.restore()
  }

  private renderRails(g: CanvasRenderingContext2D) {
    // Outer rails: the arch and the side walls, drawn smooth.
    this.chrome(
      g,
      () => {
        g.moveTo(8, H)
        g.lineTo(8, ARCH.cy)
        g.ellipse(ARCH.cx, ARCH.cy, ARCH.rx, ARCH.ry, 0, Math.PI, Math.PI * 2)
        g.lineTo(280, H)
      },
      4,
    )
    this.chrome(g, () => {
      g.moveTo(264, H)
      g.lineTo(264, 150)
    })
    // The shooter-lane gate.
    g.strokeStyle = '#e2e8f0'
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(LANE_GATE.a.x, LANE_GATE.a.y)
    g.lineTo(LANE_GATE.b.x, LANE_GATE.b.y)
    g.stroke()
    // Guides.
    for (const s of [
      INLANE,
      { a: mirror(INLANE.a), b: mirror(INLANE.b) },
      TOP_GUIDE,
    ]) {
      this.chrome(g, () => {
        g.moveTo(s.a.x, s.a.y)
        g.lineTo(s.b.x, s.b.y)
      })
    }
    // Top lane guides: short rails capped with rubber posts.
    for (const x of LANE_DIVIDERS) {
      this.chrome(
        g,
        () => {
          g.moveTo(x, 53)
          g.lineTo(x, 67)
        },
        2,
      )
      this.post(g, x, 52)
      this.post(g, x, 68)
    }
    this.post(g, INLANE.b.x, INLANE.b.y)
    this.post(g, mirror(INLANE.b).x, INLANE.b.y)
  }

  private post(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = 'rgba(0,0,0,0.4)'
    g.beginPath()
    g.arc(x + 1.5, y + 2, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = THEME.rubber
    g.beginPath()
    g.arc(x, y, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f43f5e'
    g.beginPath()
    g.arc(x, y, 1.4, 0, Math.PI * 2)
    g.fill()
  }

  private renderSlings(g: CanvasRenderingContext2D) {
    const { a, b, c } = SLING
    for (const [i, flip] of [false, true].entries()) {
      const p = flip ? [mirror(a), mirror(b), mirror(c)] : [a, b, c]
      const [pa, pb, pc] = p as [Vec, Vec, Vec]
      // Plastic: a translucent teal shield with a bright edge.
      g.fillStyle = 'rgba(0,0,0,0.4)'
      g.beginPath()
      g.moveTo(pa.x + 2, pa.y + 3)
      g.lineTo(pb.x + 2, pb.y + 3)
      g.lineTo(pc.x + 2, pc.y + 3)
      g.closePath()
      g.fill()
      const plastic = g.createLinearGradient(pa.x, pa.y, pc.x, pc.y)
      plastic.addColorStop(0, 'rgba(45, 212, 191, 0.85)')
      plastic.addColorStop(1, 'rgba(99, 102, 241, 0.85)')
      g.fillStyle = plastic
      g.beginPath()
      g.moveTo(pa.x, pa.y)
      g.lineTo(pb.x, pb.y)
      g.lineTo(pc.x, pc.y)
      g.closePath()
      g.fill()
      g.strokeStyle = 'rgba(255,255,255,0.6)'
      g.lineWidth = 1
      g.stroke()
      // The kicking rubber flexes and glows when it fires.
      const hit = this.slingFlash[i]! > 0
      const bow = hit ? 2.5 : 0
      const mx = (pa.x + pc.x) / 2 + (flip ? -bow : bow)
      const my = (pa.y + pc.y) / 2 - bow
      g.strokeStyle = hit ? '#f472b6' : THEME.rubber
      g.lineWidth = 3
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(pa.x, pa.y)
      g.quadraticCurveTo(mx, my, pc.x, pc.y)
      g.stroke()
      if (hit) this.insertGlow(g, mx, my, '#f472b6', true, 18)
      for (const q of p) this.post(g, q.x, q.y)
    }
  }

  private renderTargets(g: CanvasRenderingContext2D) {
    TARGET_LETTERS.forEach((letter, i) => {
      const y = 176 + i * 28
      const lit = this.targets[i]!
      const flash = this.targetFlash[i]! > 0
      g.fillStyle = 'rgba(0,0,0,0.4)'
      g.fillRect(12, y - 7, 7, 18)
      g.fillStyle = flash ? '#ffffff' : lit ? '#facc15' : '#7c3aed'
      g.fillRect(10, y - 9, 6, 18)
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.fillRect(10, y - 9, 2, 18)
      const on = lit || (this.lampShow > 0 && this.lit(1, i))
      g.fillStyle = on ? '#facc15' : THEME.insertOff
      g.beginPath()
      g.arc(28, y, 6, 0, Math.PI * 2)
      g.fill()
      this.insertGlow(g, 28, y, '#facc15', on, 12)
      drawText(g, letter, 28, y - 3, {
        align: 'center',
        color: on ? '#422006' : '#c4b5fd',
      })
    })
  }

  private renderSaucer(g: CanvasRenderingContext2D) {
    const ready = this.saucerReady || this.multiballLit
    const blink = Math.floor(this.tick / 8) % 2 === 0
    const rim = g.createRadialGradient(
      SAUCER.x - 3,
      SAUCER.y - 3,
      1,
      SAUCER.x,
      SAUCER.y,
      SAUCER.r + 4,
    )
    rim.addColorStop(0, '#f8fafc')
    rim.addColorStop(1, '#475569')
    g.fillStyle = rim
    g.beginPath()
    g.arc(SAUCER.x, SAUCER.y, SAUCER.r + 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#020617'
    g.beginPath()
    g.arc(SAUCER.x, SAUCER.y, SAUCER.r, 0, Math.PI * 2)
    g.fill()
    if (ready && blink) {
      const color = this.multiballLit ? '#f472b6' : '#facc15'
      g.strokeStyle = color
      g.lineWidth = 2
      g.beginPath()
      g.arc(SAUCER.x, SAUCER.y, SAUCER.r + 6, 0, Math.PI * 2)
      g.stroke()
      this.insertGlow(g, SAUCER.x, SAUCER.y, color, true, 24)
    }
    if (this.multiballLit && blink) {
      drawText(g, 'MULTI', SAUCER.x, SAUCER.y + 15, {
        align: 'center',
        color: '#f9a8d4',
        shadow: '#1e1b4b',
      })
    }
  }

  private renderBumpers(g: CanvasRenderingContext2D) {
    for (const b of this.bumpers) {
      const hot = b.flash > 0
      g.fillStyle = 'rgba(0,0,0,0.45)'
      g.beginPath()
      g.arc(b.x + 3, b.y + 4, b.r + 2, 0, Math.PI * 2)
      g.fill()
      // Skirt and metal ring.
      g.fillStyle = '#e2e8f0'
      g.beginPath()
      g.arc(b.x, b.y, b.r + 1, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = hot ? '#fde047' : '#be185d'
      g.beginPath()
      g.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2)
      g.fill()
      // The cap: a domed top with a printed star.
      const cap = g.createRadialGradient(b.x - 3, b.y - 4, 1, b.x, b.y, b.r - 3)
      cap.addColorStop(0, hot ? '#ffffff' : '#fce7f3')
      cap.addColorStop(1, hot ? '#facc15' : '#f472b6')
      g.fillStyle = cap
      g.beginPath()
      g.arc(b.x, b.y - 1, b.r - 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = hot ? '#b45309' : '#5eead4'
      g.beginPath()
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 ? 2 : 5
        const a = -Math.PI / 2 + (k * Math.PI) / 5
        const px = b.x + Math.cos(a) * rr
        const py = b.y - 1 + Math.sin(a) * rr
        if (k) g.lineTo(px, py)
        else g.moveTo(px, py)
      }
      g.closePath()
      g.fill()
      if (hot) this.insertGlow(g, b.x, b.y, '#fde047', true, 30)
    }
  }

  private renderPlunger(g: CanvasRenderingContext2D) {
    const py = PLUNGER_Y + this.pull * 12
    g.fillStyle = '#0b0618'
    g.fillRect(265, 150, 14, H - 150)
    // Spring.
    g.strokeStyle = '#a8a29e'
    g.lineWidth = 1
    g.beginPath()
    for (let y = py + 6; y < H; y += 3) {
      g.moveTo(LANE_X - 5, y)
      g.lineTo(LANE_X + 5, y + 1.5)
    }
    g.stroke()
    // Rod and tip.
    const rod = g.createLinearGradient(LANE_X - 3, 0, LANE_X + 3, 0)
    rod.addColorStop(0, '#64748b')
    rod.addColorStop(0.5, '#f8fafc')
    rod.addColorStop(1, '#64748b')
    g.fillStyle = rod
    g.fillRect(LANE_X - 2, py + 2, 4, H - py)
    g.fillStyle = '#dc2626'
    g.beginPath()
    g.roundRect(LANE_X - 6, py, 12, 5, 2)
    g.fill()
    if (
      !this.inPlay &&
      this.draining === 0 &&
      Math.floor(this.tick / 15) % 2 === 0
    ) {
      this.insertGlow(g, LANE_X, 380, '#facc15', true, 14)
      g.fillStyle = '#facc15'
      g.beginPath()
      g.moveTo(LANE_X, 372)
      g.lineTo(LANE_X + 5, 380)
      g.lineTo(LANE_X - 5, 380)
      g.closePath()
      g.fill()
    }
  }

  private renderRamps(g: CanvasRenderingContext2D) {
    for (const ramp of PINBALL_RAMPS) {
      const color = THEME.ramp[ramp.key]
      const path = ramp.path
      const hot = this.rampFlash[ramp.key] > 0
      const offset = (side: number) =>
        path.map((p, i) => {
          const q = path[Math.min(i + 1, path.length - 1)]!
          const o = path[Math.max(i - 1, 0)]!
          const dx = q.x - o.x
          const dy = q.y - o.y
          const len = Math.hypot(dx, dy) || 1
          return { x: p.x - (dy / len) * side, y: p.y + (dx / len) * side }
        })
      const trace = (pts: Vec[]) =>
        pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
      g.save()
      g.lineCap = 'round'
      g.lineJoin = 'round'
      // Shadow on the playfield below the raised track.
      g.strokeStyle = 'rgba(0,0,0,0.35)'
      g.lineWidth = 14
      g.beginPath()
      trace(path.map((p) => ({ x: p.x + 5, y: p.y + 8 })))
      g.stroke()
      // A tinted clear-plastic bed.
      g.strokeStyle = color
      g.globalAlpha = hot ? 0.4 : 0.18
      g.lineWidth = 12
      g.beginPath()
      trace(path)
      g.stroke()
      g.globalAlpha = 1
      // Cross ties every few pixels along the wireform.
      const left = offset(-6)
      const right = offset(6)
      const total = pathLength(path)
      g.strokeStyle = '#64748b'
      g.lineWidth = 1
      g.beginPath()
      for (let s = 6; s < total; s += 9) {
        const t = s / total
        const p = pathPoint(path, t)
        const q = pathPoint(path, Math.min(1, t + 0.01))
        const dx = q.x - p.x
        const dy = q.y - p.y
        const len = Math.hypot(dx, dy) || 1
        g.moveTo(p.x - (dy / len) * 6, p.y + (dx / len) * 6)
        g.lineTo(p.x + (dy / len) * 6, p.y - (dx / len) * 6)
      }
      g.stroke()
      g.restore()
      for (const rail of [left, right]) {
        this.chrome(g, () => trace(rail), 1.6)
      }
      // The entry: a ramp flap and a flasher dome above the mouth.
      const m = ramp.mouth
      const mid = (m.x0 + m.x1) / 2
      const flap = g.createLinearGradient(0, m.y1, 0, m.y0 - 6)
      flap.addColorStop(0, 'rgba(255,255,255,0.05)')
      flap.addColorStop(1, color)
      g.fillStyle = flap
      g.globalAlpha = 0.7
      g.beginPath()
      g.moveTo(m.x0, m.y1)
      g.lineTo(m.x1, m.y1)
      g.lineTo(mid + 7, m.y0 - 4)
      g.lineTo(mid - 7, m.y0 - 4)
      g.closePath()
      g.fill()
      g.globalAlpha = 1
      const flasher =
        ramp.key === 'left'
          ? { x: m.x0 - 4, y: m.y0 - 8 }
          : { x: m.x1 + 4, y: m.y0 - 8 }
      const dome = g.createRadialGradient(
        flasher.x - 1,
        flasher.y - 1,
        0.5,
        flasher.x,
        flasher.y,
        5,
      )
      dome.addColorStop(0, hot ? '#ffffff' : '#fecaca')
      dome.addColorStop(1, hot ? color : '#7f1d1d')
      g.fillStyle = dome
      g.beginPath()
      g.arc(flasher.x, flasher.y, 4.5, 0, Math.PI * 2)
      g.fill()
      if (hot) this.insertGlow(g, flasher.x, flasher.y, color, true, 34)
    }
  }

  private renderFlipper(g: CanvasRenderingContext2D, f: Flipper) {
    const tip = this.flipperTip(f)
    const shape = (dx: number, dy: number, r0: number, r1: number) => {
      const a = Math.atan2(tip.y - f.pivot.y, tip.x - f.pivot.x)
      g.beginPath()
      g.arc(
        f.pivot.x + dx,
        f.pivot.y + dy,
        r0,
        a + Math.PI / 2,
        a + (Math.PI * 3) / 2,
      )
      g.arc(tip.x + dx, tip.y + dy, r1, a - Math.PI / 2, a + Math.PI / 2)
      g.closePath()
    }
    g.fillStyle = 'rgba(0,0,0,0.45)'
    shape(2, 4, 7, 4.5)
    g.fill()
    // Red rubber ring, white bat, chrome pivot.
    g.fillStyle = '#dc2626'
    shape(0, 0, 7, 4.5)
    g.fill()
    const bat = g.createLinearGradient(
      f.pivot.x,
      f.pivot.y - 6,
      f.pivot.x,
      f.pivot.y + 6,
    )
    bat.addColorStop(0, '#ffffff')
    bat.addColorStop(1, '#cbd5e1')
    g.fillStyle = bat
    shape(0, 0, 5.5, 3)
    g.fill()
    g.fillStyle = '#94a3b8'
    g.beginPath()
    g.arc(f.pivot.x, f.pivot.y, 2.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f8fafc'
    g.beginPath()
    g.arc(f.pivot.x - 0.7, f.pivot.y - 0.7, 1, 0, Math.PI * 2)
    g.fill()
  }

  /** A mosquito net: a little mesh square. */
  private renderNet(g: CanvasRenderingContext2D, x: number, y: number) {
    g.strokeStyle = '#e0f2fe'
    g.lineWidth = 1
    g.strokeRect(x - 5, y - 5, 10, 10)
    g.beginPath()
    for (const d of [-2, 2]) {
      g.moveTo(x + d, y - 5)
      g.lineTo(x + d, y + 5)
      g.moveTo(x - 5, y + d)
      g.lineTo(x + 5, y + d)
    }
    g.stroke()
  }

  private renderFlights(g: CanvasRenderingContext2D) {
    for (const n of this.flights) {
      // A little hop on the way, so the nets arc over the table.
      const x = n.x0 + (n.x1 - n.x0) * n.t
      const y = n.y0 + (n.y1 - n.y0) * n.t - Math.sin(Math.PI * n.t) * 40
      this.renderNet(g, x, y)
    }
  }

  private renderBall(g: CanvasRenderingContext2D, b: Ball, raised = false) {
    if (this.draining > 0) return
    const lift = raised ? 6 : 3
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > 7 && !raised) {
      b.trail.forEach((p, i) => {
        g.fillStyle = `rgba(226, 232, 240, ${0.05 + i * 0.04})`
        g.beginPath()
        g.arc(p.x, p.y, R - 1, 0, Math.PI * 2)
        g.fill()
      })
    }
    g.fillStyle = 'rgba(0,0,0,0.4)'
    g.beginPath()
    g.ellipse(b.x + lift * 0.6, b.y + lift, R, R * 0.8, 0, 0, Math.PI * 2)
    g.fill()
    const body = g.createRadialGradient(b.x - 2, b.y - 2.5, 0.5, b.x, b.y, R)
    body.addColorStop(0, '#ffffff')
    body.addColorStop(0.3, '#e2e8f0')
    body.addColorStop(0.75, '#64748b')
    body.addColorStop(1, '#1e293b')
    g.fillStyle = body
    g.beginPath()
    g.arc(b.x, b.y, R, 0, Math.PI * 2)
    g.fill()
    // The playfield's colour reflected in the lower half of the chrome.
    g.fillStyle = 'rgba(244, 114, 182, 0.35)'
    g.beginPath()
    g.ellipse(b.x + 0.5, b.y + 2.5, R * 0.7, R * 0.35, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(b.x - 2, b.y - 2.5, 1.2, 0, Math.PI * 2)
    g.fill()
  }

  /** The apron covers the drain, with the table's name stamped on it. */
  private renderApron(g: CanvasRenderingContext2D) {
    const top = 388
    const apron = g.createLinearGradient(0, top, 0, H)
    apron.addColorStop(0, '#334155')
    apron.addColorStop(1, '#0f172a')
    g.fillStyle = apron
    g.beginPath()
    g.moveTo(8, top - 4)
    g.lineTo(104, top + 6)
    g.lineTo(168, top + 6)
    g.lineTo(264, top - 4)
    g.lineTo(264, H)
    g.lineTo(8, H)
    g.closePath()
    g.fill()
    g.strokeStyle = '#94a3b8'
    g.lineWidth = 1
    g.stroke()
    drawText(g, 'AMI VILLAGE RESCUE', 136, top + 12, {
      align: 'center',
      color: '#fde68a',
      shadow: '#020617',
    })
  }

  private renderBallsLeft(g: CanvasRenderingContext2D) {
    // Balls left, as little chrome dots.
    for (let i = 0; i < Math.min(5, this.lives); i++) {
      g.fillStyle = '#cbd5e1'
      g.beginPath()
      g.arc(24 + i * 9, H - 6, 3, 0, Math.PI * 2)
      g.fill()
    }
  }
}

const kindPinball: ArcadeGameModule = {
  create: (options) => new KindPinball(options),
}

export const create = kindPinball.create
export default kindPinball

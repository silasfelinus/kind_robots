// /utils/arcade/games/hedgehogCrossing.ts
//
// Hedgehog Crossing -- the Kind Robots Arcade's Frogger riff (conductor
// kr-arcade/t-009 game factory). Walk a family of hedgehogs home, one at a
// time: across a busy road of robot traffic, onto the median, then over a
// creek of drifting logs and paddling turtles to the five burrows in the hedge
// at the top. Turtles dive now and then, a fox snoozes in a burrow from level
// two (don't wake it), and a ladybug visits the burrows for a bonus.
//
// The arrows hop one step (hold to keep hopping), A hops forward. Every new
// step forward scores, every hedgehog home scores more for the time it has
// left, and all five home starts the next level: faster lanes, shorter logs,
// more diving turtles.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const TILE = 20
const W = 280
const H = 320
const TOP = 28
/** Rows from the hedge (0) down to the start (12). */
const START_ROW = 12
const MEDIAN_ROW = 6
const HOP_TICKS = 8
const HOP_REPEAT = 4
const SPAN = W + 140
const HALF = 7
const START_LIVES = 4
const TIME_TICKS = 60 * 30
const DEATH_TICKS = 60
const LEVEL_CLEAR_TICKS = 140
const EXTRA_EVERY = 10_000
const BURROWS = 5
const BURROW_REACH = 10

const STEP_POINTS = 10
const HOME_POINTS = 50
const FAMILY_BONUS = 1000
const LADYBUG_POINTS = 200

export const HEDGEHOG_CURVES = {
  speed: { start: 1, step: 0.12, limit: 2.2 },
  /** Tiles shaved off every log, so the gaps grow. */
  logTrim: { start: 0, step: 0.5, limit: 2 },
  divingGroups: { start: 1, step: 1, limit: 4 },
  foxEvery: { start: 0, step: 520, limit: 520 },
} as const

type LaneKind = 'car' | 'tractor' | 'racer' | 'bus' | 'log' | 'turtles'
type LaneSpec = {
  row: number
  kind: LaneKind
  len: number
  count: number
  speed: number
  dir: 1 | -1
  color: string
}
type Thing = { x: number; len: number; dive: number }
type Lane = LaneSpec & { things: Thing[]; vx: number }
type Hop = {
  fromX: number
  fromRow: number
  toX: number
  toRow: number
  t: number
}
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** The lanes, from the bottom of the road to the top of the creek. */
const LANES: LaneSpec[] = [
  {
    row: 11,
    kind: 'car',
    len: 1,
    count: 3,
    speed: 0.6,
    dir: -1,
    color: '#f472b6',
  },
  {
    row: 10,
    kind: 'tractor',
    len: 1,
    count: 3,
    speed: 0.45,
    dir: 1,
    color: '#facc15',
  },
  {
    row: 9,
    kind: 'car',
    len: 1,
    count: 3,
    speed: 0.85,
    dir: -1,
    color: '#38bdf8',
  },
  {
    row: 8,
    kind: 'racer',
    len: 1,
    count: 1,
    speed: 2,
    dir: 1,
    color: '#fb7185',
  },
  {
    row: 7,
    kind: 'bus',
    len: 2,
    count: 2,
    speed: 0.7,
    dir: -1,
    color: '#2dd4bf',
  },
  {
    row: 5,
    kind: 'turtles',
    len: 3,
    count: 4,
    speed: 0.6,
    dir: -1,
    color: '#15803d',
  },
  {
    row: 4,
    kind: 'log',
    len: 3,
    count: 3,
    speed: 0.5,
    dir: 1,
    color: '#92400e',
  },
  {
    row: 3,
    kind: 'log',
    len: 5,
    count: 2,
    speed: 1.15,
    dir: 1,
    color: '#92400e',
  },
  {
    row: 2,
    kind: 'turtles',
    len: 2,
    count: 4,
    speed: 0.7,
    dir: -1,
    color: '#15803d',
  },
  {
    row: 1,
    kind: 'log',
    len: 4,
    count: 3,
    speed: 0.8,
    dir: 1,
    color: '#92400e',
  },
]

/** Turtle groups dive on this cycle: [start, end) of the submerged stretch. */
const DIVE_PERIOD = 300
const DIVE_WARN = 150
const DIVE_DOWN = 190
const DIVE_UP = 260

function rowY(row: number): number {
  return TOP + row * TILE
}

function burrowX(i: number): number {
  return Math.round(((i + 0.5) * W) / BURROWS)
}

function isCreek(row: number): boolean {
  return row >= 1 && row <= 5
}

function isRoad(row: number): boolean {
  return row >= 7 && row <= 11
}

class HedgehogCrossing implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private lanes: Lane[] = []
  private hx = 150
  private row = START_ROW
  private facing: 'up' | 'down' | 'left' | 'right' = 'up'
  private hop: Hop | null = null
  private hopWait = 0
  /** The furthest row this hedgehog has reached (forward steps score once). */
  private best = START_ROW
  private time = TIME_TICKS
  private home: boolean[] = new Array(BURROWS).fill(false)
  private fox: { burrow: number; ticks: number } | null = null
  private foxTimer = 0
  private ladybug: { burrow: number; ticks: number } | null = null
  private ladybugTimer = 600
  private dead = 0
  private deathKind: 'splash' | 'bonk' = 'bonk'
  private levelClear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup -------------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.home = new Array(BURROWS).fill(false)
    const speed = levelCurve(level, HEDGEHOG_CURVES.speed)
    const trim = Math.floor(levelCurve(level, HEDGEHOG_CURVES.logTrim))
    const diving = Math.round(levelCurve(level, HEDGEHOG_CURVES.divingGroups))
    this.lanes = LANES.map((spec) => {
      const len = spec.kind === 'log' ? Math.max(2, spec.len - trim) : spec.len
      const gap = SPAN / spec.count
      const offset = this.rng() * gap
      const things: Thing[] = []
      for (let i = 0; i < spec.count; i++) {
        things.push({ x: -70 + offset + i * gap, len, dive: -1 })
      }
      if (spec.kind === 'turtles') {
        // Some turtle groups dive, each on its own beat.
        for (let i = 0; i < Math.min(diving, things.length); i += 2) {
          things[i]!.dive = Math.floor(this.rng() * DIVE_PERIOD)
        }
      }
      return { ...spec, things, vx: spec.speed * spec.dir * speed }
    })
    this.fox = null
    this.foxTimer = Math.round(levelCurve(level, HEDGEHOG_CURVES.foxEvery))
    this.ladybug = null
    this.ladybugTimer = 600
    this.resetHedgehog()
    this.banner = { text: `LEVEL ${level}`, sub: 'WALK THEM HOME', ticks: 90 }
  }

  private resetHedgehog() {
    this.hx = 150
    this.row = START_ROW
    this.facing = 'up'
    this.hop = null
    this.hopWait = 0
    this.best = START_ROW
    this.time = TIME_TICKS
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    this.moveLanes()
    this.updateVisitors()

    if (this.levelClear > 0) {
      if (--this.levelClear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetHedgehog()
        }
      }
      return
    }

    if (--this.time <= 0) {
      this.die('bonk', 'OUT OF TIME')
      return
    }
    if (this.hop) {
      this.advanceHop()
    } else {
      // Riding a log or a turtle carries the hedgehog along.
      if (isCreek(this.row)) this.hx += this.laneAt(this.row)!.vx
      this.readHop(controls)
    }
    if (this.dead === 0) this.checkHazards()
  }

  private moveLanes() {
    for (const lane of this.lanes) {
      for (const t of lane.things) {
        t.x += lane.vx
        if (lane.vx > 0 && t.x > W + 30) t.x -= SPAN
        if (lane.vx < 0 && t.x + t.len * TILE < -30) t.x += SPAN
      }
    }
  }

  private updateVisitors() {
    if (this.fox && --this.fox.ticks <= 0) this.fox = null
    if (this.ladybug && --this.ladybug.ticks <= 0) this.ladybug = null
    const empty = this.home
      .map((done, i) => (done ? -1 : i))
      .filter((i) => i >= 0)
    if (this.foxTimer > 0 && !this.fox && --this.foxTimer === 0) {
      this.foxTimer = Math.round(
        levelCurve(this.level, HEDGEHOG_CURVES.foxEvery),
      )
      const spots = empty.filter((i) => i !== this.ladybug?.burrow)
      if (spots.length > 1) {
        const burrow = spots[Math.floor(this.rng() * spots.length)]!
        this.fox = { burrow, ticks: 240 }
      }
    }
    if (!this.ladybug && --this.ladybugTimer <= 0) {
      this.ladybugTimer = 600
      const spots = empty.filter((i) => i !== this.fox?.burrow)
      if (spots.length) {
        const burrow = spots[Math.floor(this.rng() * spots.length)]!
        this.ladybug = { burrow, ticks: 300 }
      }
    }
  }

  private readHop(input: InputFrame) {
    if (this.hopWait > 0) {
      this.hopWait--
      return
    }
    const up = input.held.up || input.pressed.up || input.pressed.a
    let dx = 0
    let drow = 0
    if (up) {
      drow = -1
      this.facing = 'up'
    } else if (input.held.down || input.pressed.down) {
      drow = 1
      this.facing = 'down'
    } else if (input.held.left || input.pressed.left) {
      dx = -TILE
      this.facing = 'left'
    } else if (input.held.right || input.pressed.right) {
      dx = TILE
      this.facing = 'right'
    } else {
      return
    }
    const toRow = Math.max(0, Math.min(START_ROW, this.row + drow))
    // Hopping off a log or a turtle keeps its drift through the hop.
    const drift = isCreek(this.row) ? this.laneAt(this.row)!.vx * HOP_TICKS : 0
    const toX = Math.max(HALF + 3, Math.min(W - HALF - 3, this.hx + dx + drift))
    if (toRow === this.row && Math.abs(toX - this.hx) < 1) return
    this.hop = { fromX: this.hx, fromRow: this.row, toX, toRow, t: 0 }
    this.sound.play('blip')
  }

  private advanceHop() {
    const hop = this.hop!
    hop.t++
    const f = hop.t / HOP_TICKS
    this.hx = hop.fromX + (hop.toX - hop.fromX) * f
    if (hop.t < HOP_TICKS) return
    this.hop = null
    this.hopWait = HOP_REPEAT
    this.row = hop.toRow
    this.hx = hop.toX
    if (this.row < this.best) {
      this.best = this.row
      this.addScore(STEP_POINTS, this.hx, rowY(this.row))
    }
    if (this.row === 0) this.arriveAtHedge()
  }

  private arriveAtHedge() {
    const burrow = this.home.findIndex(
      (_, i) => Math.abs(burrowX(i) - this.hx) < BURROW_REACH,
    )
    if (burrow < 0 || this.home[burrow]) {
      this.die('bonk', 'BONK! INTO THE HEDGE')
      return
    }
    if (this.fox?.burrow === burrow) {
      this.die('bonk', 'THE FOX WOKE UP')
      return
    }
    this.home[burrow] = true
    const timeBonus = 10 * Math.floor(this.time / 30)
    this.addScore(HOME_POINTS + timeBonus, burrowX(burrow), rowY(0) + 4)
    if (this.ladybug?.burrow === burrow) {
      this.ladybug = null
      this.addScore(LADYBUG_POINTS, burrowX(burrow), rowY(1))
      this.sound.play('pickup')
    }
    this.burst(burrowX(burrow), rowY(0) + 10, 10, '#fde68a')
    this.sound.play('extra')
    if (this.home.every(Boolean)) {
      this.addScore(FAMILY_BONUS, W / 2, rowY(6))
      this.banner = {
        text: 'FAMILY HOME!',
        sub: 'EVERY HEDGEHOG IS SAFE',
        ticks: LEVEL_CLEAR_TICKS,
      }
      this.levelClear = LEVEL_CLEAR_TICKS
      this.fox = null
      this.ladybug = null
      this.sound.play('level')
      return
    }
    this.resetHedgehog()
  }

  private laneAt(row: number): Lane | undefined {
    return this.lanes.find((lane) => lane.row === row)
  }

  /** Is this turtle group under water right now (or at tick `at`)? */
  private submerged(t: Thing, at = this.tick): boolean {
    if (t.dive < 0) return false
    const phase = (at + t.dive) % DIVE_PERIOD
    return phase >= DIVE_DOWN && phase < DIVE_UP
  }

  private checkHazards() {
    // Traffic can catch a hedgehog mid-hop; the creek only matters on landing.
    const hop = this.hop
    const roadRow = hop
      ? Math.round(
          hop.fromRow + (hop.toRow - hop.fromRow) * (hop.t / HOP_TICKS),
        )
      : this.row
    if (isRoad(roadRow)) {
      const lane = this.laneAt(roadRow)!
      const hit = lane.things.some(
        (t) =>
          this.hx + HALF - 2 > t.x + 2 &&
          this.hx - HALF + 2 < t.x + t.len * TILE - 2,
      )
      if (hit) {
        this.die('bonk', 'BEEP BEEP! TRY AGAIN')
        return
      }
    }
    if (hop || !isCreek(this.row)) return
    if (this.hx < 4 || this.hx > W - 4) {
      this.die('splash', 'SWEPT DOWNSTREAM')
      return
    }
    const lane = this.laneAt(this.row)!
    const afloat = lane.things.some(
      (t) =>
        this.hx > t.x + 2 &&
        this.hx < t.x + t.len * TILE - 2 &&
        !this.submerged(t),
    )
    if (!afloat) this.die('splash', 'SPLASH!')
  }

  private die(kind: 'splash' | 'bonk', text: string) {
    this.lives--
    this.dead = DEATH_TICKS
    this.deathKind = kind
    this.hop = null
    const y = rowY(this.row) + TILE / 2
    if (kind === 'splash') this.burst(this.hx, y, 14, '#93c5fd')
    else this.burst(this.hx, y, 12, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 70 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA HEDGEHOG!', ticks: 90 }
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
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Where a lane's things will be `dt` ticks from now (wrapped like the lane). */
  private futureSpans(lane: Lane, dt: number) {
    return lane.things.map((t) => {
      let x = t.x + lane.vx * dt
      while (lane.vx > 0 && x > W + 30) x -= SPAN
      while (lane.vx < 0 && x + t.len * TILE < -30) x += SPAN
      return {
        x0: x,
        x1: x + t.len * TILE,
        sunk: this.submerged(t, this.tick + dt),
      }
    })
  }

  private roadClear(row: number, x: number, from: number, to: number): boolean {
    const lane = this.laneAt(row)
    if (!lane || !isRoad(row)) return true
    for (let dt = from; dt <= to; dt += 2) {
      const hit = this.futureSpans(lane, dt).some(
        (s) => x + HALF + 2 > s.x0 && x - HALF - 2 < s.x1,
      )
      if (hit) return false
    }
    return true
  }

  private creekSafe(row: number, x: number, dt: number): boolean {
    const lane = this.laneAt(row)
    if (!lane) return true
    const now = this.futureSpans(lane, dt)
    // Stay off a turtle group that is about to dive.
    const soon = this.futureSpans(lane, dt + 40)
    return now.some(
      (s, i) => x > s.x0 + 5 && x < s.x1 - 5 && !s.sunk && !soon[i]!.sunk,
    )
  }

  private safeLanding(row: number, x: number): boolean {
    if (x < 14 || x > W - 14) return false
    if (row === 0) {
      const burrow = this.home.findIndex(
        (_, i) => Math.abs(burrowX(i) - x) < BURROW_REACH - 3,
      )
      return burrow >= 0 && !this.home[burrow] && this.fox?.burrow !== burrow
    }
    if (isRoad(row)) return this.roadClear(row, x, 0, HOP_TICKS + 16)
    if (isCreek(row)) return this.creekSafe(row, x, HOP_TICKS)
    return true
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
    if (this.hop || this.hopWait > 0 || this.dead > 0) return frame
    const drift = isCreek(this.row) ? this.laneAt(this.row)!.vx * HOP_TICKS : 0
    const x = this.hx + drift
    const hereSafe = isRoad(this.row)
      ? this.roadClear(this.row, this.hx, 0, HOP_TICKS + 6)
      : true
    if (this.safeLanding(this.row - 1, x)) {
      held.up = true
      return frame
    }
    // At the top of the creek, slide along toward an open burrow.
    if (this.row === 1) {
      const open = this.home
        .map((done, i) => (done || this.fox?.burrow === i ? null : burrowX(i)))
        .filter((bx): bx is number => bx !== null)
      const target = open.reduce(
        (a, b) => (Math.abs(b - this.hx) < Math.abs(a - this.hx) ? b : a),
        open[0] ?? W / 2,
      )
      const step = target < this.hx ? -TILE : TILE
      if (Math.abs(target - this.hx) > 6 && this.safeLanding(1, x + step)) {
        if (step < 0) held.left = true
        else held.right = true
        return frame
      }
    }
    // Drifting toward the edge of the creek: step back toward the middle.
    if (isCreek(this.row) && (this.hx < 70 || this.hx > W - 70)) {
      const step = this.hx < W / 2 ? TILE : -TILE
      if (this.safeLanding(this.row, x + step)) {
        if (step < 0) held.left = true
        else held.right = true
        return frame
      }
      if (this.safeLanding(this.row + 1, x)) {
        held.down = true
        return frame
      }
    }
    if (!hereSafe) {
      for (const step of [-TILE, TILE]) {
        if (this.safeLanding(this.row, this.hx + step)) {
          if (step < 0) held.left = true
          else held.right = true
          return frame
        }
      }
      if (this.safeLanding(this.row + 1, this.hx)) held.down = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGround(g)
    for (const lane of this.lanes) this.renderLane(g, lane)
    this.renderHedge(g)
    if (this.dead === 0 && !this.over && this.levelClear === 0) {
      this.renderHedgehog(g)
    } else if (this.dead > 0 && this.deathKind === 'bonk') {
      // Dizzy stars circle the spot.
      const y = rowY(this.row) + TILE / 2
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 6 + (i * Math.PI * 2) / 3
        g.fillStyle = '#fde68a'
        g.fillRect(this.hx + Math.cos(a) * 8 - 1, y - 6 + Math.sin(a) * 3, 3, 3)
      }
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderGround(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, H)
    // The creek.
    g.fillStyle = '#1e3a8a'
    g.fillRect(0, rowY(1), W, TILE * 5)
    g.fillStyle = '#3b82f6'
    for (let row = 1; row <= 5; row++) {
      for (let i = 0; i < 6; i++) {
        const x =
          (i * 53 + this.tick * 0.3 * (row % 2 ? 1 : -1) + row * 17) % (W + 20)
        g.fillRect(
          ((x + W + 20) % (W + 20)) - 10,
          rowY(row) + 6 + (i % 2) * 8,
          8,
          1,
        )
      }
    }
    // Median meadow and start lawn.
    for (const row of [MEDIAN_ROW, START_ROW]) {
      g.fillStyle = row === MEDIAN_ROW ? '#4c1d95' : '#166534'
      g.fillRect(0, rowY(row), W, TILE)
      for (let i = 0; i < 14; i++) {
        g.fillStyle = ['#f9a8d4', '#fde68a', '#a5f3fc'][i % 3]!
        g.fillRect(
          8 + i * 20 + (row % 3) * 3,
          rowY(row) + 4 + ((i * 7) % 11),
          2,
          2,
        )
      }
    }
    // The road.
    g.fillStyle = '#1f2937'
    g.fillRect(0, rowY(7), W, TILE * 5)
    g.fillStyle = '#6b7280'
    for (let row = 8; row <= 11; row++) {
      for (let x = 4; x < W; x += 24) g.fillRect(x, rowY(row) - 1, 12, 1)
    }
  }

  private renderLane(g: CanvasRenderingContext2D, lane: Lane) {
    const y = rowY(lane.row)
    for (const t of lane.things) {
      const x = t.x
      const w = t.len * TILE
      switch (lane.kind) {
        case 'log':
          g.fillStyle = '#78350f'
          g.fillRect(x, y + 3, w, TILE - 6)
          g.fillStyle = '#b45309'
          g.fillRect(x + 2, y + 4, w - 4, 3)
          g.fillStyle = '#fcd34d'
          g.beginPath()
          g.arc(x + w - 3, y + TILE / 2, 4, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#92400e'
          g.fillRect(x + w - 4, y + TILE / 2 - 1, 2, 2)
          break
        case 'turtles':
          this.renderTurtles(g, t, y, lane.dir)
          break
        default:
          this.renderVehicle(g, lane, x, y, w)
      }
    }
  }

  private renderTurtles(
    g: CanvasRenderingContext2D,
    t: Thing,
    y: number,
    dir: 1 | -1,
  ) {
    if (this.submerged(t)) {
      g.strokeStyle = '#93c5fd'
      g.lineWidth = 1
      for (let i = 0; i < t.len; i++) {
        g.beginPath()
        g.arc(
          t.x + i * TILE + TILE / 2,
          y + TILE / 2,
          5 + (this.tick % 20) / 6,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
      return
    }
    const phase = t.dive < 0 ? -1 : (this.tick + t.dive) % DIVE_PERIOD
    const warning = phase >= DIVE_WARN && phase < DIVE_DOWN
    g.globalAlpha = warning && Math.floor(this.tick / 6) % 2 === 0 ? 0.55 : 1
    for (let i = 0; i < t.len; i++) {
      const cx = t.x + i * TILE + TILE / 2
      const cy = y + TILE / 2
      g.fillStyle = '#86efac'
      g.fillRect(cx + dir * 7 - 2, cy - 2, 4, 4)
      g.fillStyle = '#15803d'
      g.beginPath()
      g.arc(cx, cy, 7, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#4ade80'
      g.fillRect(cx - 3, cy - 3, 6, 6)
      g.fillStyle = '#166534'
      g.fillRect(cx - 1, cy - 3, 2, 6)
    }
    g.globalAlpha = 1
  }

  private renderVehicle(
    g: CanvasRenderingContext2D,
    lane: Lane,
    x: number,
    y: number,
    w: number,
  ) {
    const front = lane.dir > 0 ? x + w - 4 : x + 1
    // Wheels.
    g.fillStyle = '#0f172a'
    g.fillRect(x + 2, y + 2, 5, 3)
    g.fillRect(x + w - 7, y + 2, 5, 3)
    g.fillRect(x + 2, y + TILE - 5, 5, 3)
    g.fillRect(x + w - 7, y + TILE - 5, 5, 3)
    g.fillStyle = lane.color
    if (lane.kind === 'tractor') {
      g.fillRect(x + 3, y + 5, w - 6, TILE - 10)
      g.fillStyle = '#0f172a'
      g.fillRect(lane.dir > 0 ? x + 2 : x + w - 9, y + 1, 7, TILE - 2)
    } else {
      g.fillRect(x + 1, y + 4, w - 2, TILE - 8)
    }
    if (lane.kind === 'bus') {
      g.fillStyle = '#ccfbf1'
      for (let wx = x + 6; wx < x + w - 8; wx += 8) g.fillRect(wx, y + 7, 5, 3)
    }
    if (lane.kind === 'racer') {
      g.fillStyle = '#fecdd3'
      for (let i = 1; i <= 3; i++) {
        g.fillRect(
          lane.dir > 0 ? x - i * 5 : x + w + i * 5 - 3,
          y + 6 + i * 2,
          3,
          1,
        )
      }
    }
    // A friendly robot eye on the front, and an antenna.
    g.fillStyle = '#fef9c3'
    g.fillRect(front, y + TILE / 2 - 2, 3, 3)
    g.fillStyle = '#e5e7eb'
    g.fillRect(x + w / 2, y + 2, 1, 3)
  }

  private renderHedge(g: CanvasRenderingContext2D) {
    const y = rowY(0)
    g.fillStyle = '#14532d'
    g.fillRect(0, y, W, TILE)
    g.fillStyle = '#166534'
    for (let x = 0; x < W; x += 10) {
      g.beginPath()
      g.arc(x + 5, y + 3, 6, 0, Math.PI * 2)
      g.fill()
    }
    for (let i = 0; i < BURROWS; i++) {
      const bx = burrowX(i)
      g.fillStyle = '#3f2a14'
      g.beginPath()
      g.arc(bx, y + 12, 10, Math.PI, 0)
      g.fill()
      g.fillRect(bx - 10, y + 12, 20, 8)
      if (this.home[i]) this.renderSleeper(g, bx, y + 12)
      if (this.fox?.burrow === i) this.renderFox(g, bx, y + 12)
      if (this.ladybug?.burrow === i) this.renderLadybug(g, bx, y + 12)
    }
  }

  private renderSleeper(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = '#78350f'
    g.beginPath()
    g.arc(x, y + 2, 7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fde68a'
    g.fillRect(x - 2, y + 2, 4, 3)
    if (Math.floor(this.tick / 30) % 2 === 0) {
      drawText(g, 'z', x + 8, y - 10, { color: '#e0e7ff' })
    }
  }

  private renderFox(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = '#ea580c'
    g.beginPath()
    g.moveTo(x - 8, y - 6)
    g.lineTo(x - 4, y - 1)
    g.lineTo(x + 4, y - 1)
    g.lineTo(x + 8, y - 6)
    g.lineTo(x + 7, y + 4)
    g.lineTo(x, y + 8)
    g.lineTo(x - 7, y + 4)
    g.fill()
    g.fillStyle = '#fff7ed'
    g.fillRect(x - 3, y + 4, 6, 3)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 4, y + 1, 3, 1)
    g.fillRect(x + 1, y + 1, 3, 1)
    g.fillRect(x - 1, y + 6, 2, 2)
    drawText(g, 'Z', x + 9, y - 12, { color: '#fdba74' })
  }

  private renderLadybug(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = '#dc2626'
    g.beginPath()
    g.arc(x, y + 2, 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0f172a'
    g.fillRect(x - 1, y - 3, 2, 10)
    g.fillRect(x - 3, y, 2, 2)
    g.fillRect(x + 2, y + 3, 2, 2)
    g.fillRect(x - 2, y - 5, 4, 3)
  }

  private renderHedgehog(g: CanvasRenderingContext2D) {
    const hop = this.hop
    const lift = hop ? Math.sin((hop.t / HOP_TICKS) * Math.PI) * 4 : 0
    const row = hop
      ? hop.fromRow + (hop.toRow - hop.fromRow) * (hop.t / HOP_TICKS)
      : this.row
    const x = this.hx
    const y = rowY(row) + TILE / 2 - lift
    const look = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    }[this.facing]
    // Spikes all round the back, a soft face toward where it's going.
    g.fillStyle = '#451a03'
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      g.fillRect(x + Math.cos(a) * 7 - 1.5, y + Math.sin(a) * 7 - 1.5, 3, 3)
    }
    g.fillStyle = '#92400e'
    g.beginPath()
    g.arc(x, y, 6.5, 0, Math.PI * 2)
    g.fill()
    const fx = x + look[0]! * 4
    const fy = y + look[1]! * 4
    g.fillStyle = '#fde68a'
    g.beginPath()
    g.arc(fx, fy, 3.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0f172a'
    g.fillRect(fx + look[0]! * 3 - 1, fy + look[1]! * 3 - 1, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 6, {
      scale: 2,
      color: '#86efac',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 6, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `LEVEL ${this.level}`, W - 6, 15, {
      align: 'right',
      color: '#fde68a',
    })
    const base = rowY(START_ROW + 1)
    for (let i = 0; i < Math.min(this.lives - 1, 6); i++) {
      g.fillStyle = '#92400e'
      g.beginPath()
      g.arc(10 + i * 12, base + 9, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fde68a'
      g.fillRect(12 + i * 12, base + 8, 2, 2)
    }
    // The time bar: green to red as the hedgehog dawdles.
    const frac = Math.max(0, this.time / TIME_TICKS)
    g.fillStyle = '#1f2937'
    g.fillRect(90, base + 6, W - 130, 6)
    g.fillStyle = frac > 0.33 ? '#4ade80' : frac > 0.15 ? '#facc15' : '#ef4444'
    g.fillRect(90, base + 6, (W - 130) * frac, 6)
    drawText(g, 'TIME', W - 6, base + 6, { align: 'right', color: '#bbf7d0' })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, rowY(MEDIAN_ROW) + 3, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, rowY(MEDIAN_ROW) + 22, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const hedgehogCrossing: ArcadeGameModule = {
  create: (options) => new HedgehogCrossing(options),
}

export const create = hedgehogCrossing.create
export default hedgehogCrossing

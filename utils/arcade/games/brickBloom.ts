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
    const bg = g.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1e1b4b')
    bg.addColorStop(1, '#0f172a')
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    // Garden trellis walls.
    g.fillStyle = '#3f6212'
    g.fillRect(0, TOP - 4, LEFT, H)
    g.fillRect(RIGHT, TOP - 4, W - RIGHT, H)
    g.fillRect(0, TOP - 4, W, 4)
    g.fillStyle = '#65a30d'
    for (let y = TOP; y < H; y += 12) {
      g.fillRect(2, y, 4, 2)
      g.fillRect(RIGHT + 2, y + 6, 4, 2)
    }
    for (const b of this.bricks) this.renderBrick(g, b)
    for (const f of this.flowers) this.renderFlower(g, f)
    for (const p of this.puffs) this.renderPuff(g, p)
    for (const d of this.drops) this.renderDrop(g, d)
    this.renderPaddle(g)
    for (const ball of this.balls) {
      g.fillStyle = '#fef08a'
      g.beginPath()
      g.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.fillRect(ball.x - 1, ball.y - 1.5, 1, 1)
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 26)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    this.renderHud(g)
  }

  private renderBrick(g: CanvasRenderingContext2D, b: Brick) {
    const r = this.brickRect(b)
    const x = Math.round(r.x) + 1
    const y = r.y + 1
    const w = Math.round(r.w) - 2
    const h = r.h - 2
    if (b.bolt) {
      g.fillStyle = b.flash ? '#ffffff' : '#64748b'
      g.fillRect(x, y, w, h)
      g.fillStyle = '#334155'
      g.fillRect(x + 3, y + 3, 2, 2)
      g.fillRect(x + w - 5, y + 3, 2, 2)
      return
    }
    g.fillStyle = b.flash ? '#ffffff' : ROW_COLORS[b.row]!
    g.fillRect(x, y, w, h)
    // Crate slats, and cracks as it weakens.
    g.fillStyle = 'rgba(0, 0, 0, 0.25)'
    g.fillRect(x, y + h - 2, w, 2)
    g.fillRect(x + Math.floor(w / 2), y, 1, h)
    if (b.hp < b.maxHp) {
      g.fillStyle = 'rgba(0, 0, 0, 0.5)'
      g.fillRect(x + 3, y + 2, 4, 1)
      g.fillRect(x + 6, y + 3, 1, 3)
    }
    if (b.maxHp > 1) {
      g.fillStyle = 'rgba(255, 255, 255, 0.5)'
      for (let i = 0; i < b.hp; i++) g.fillRect(x + w - 3 - i * 3, y + 1, 2, 2)
    }
  }

  private renderFlower(g: CanvasRenderingContext2D, f: Flower) {
    g.globalAlpha = Math.min(1, f.life / 30)
    g.fillStyle = f.color
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + f.life / 20
      g.fillRect(f.x + Math.cos(a) * 3 - 1, f.y + Math.sin(a) * 3 - 1, 2, 2)
    }
    g.fillStyle = '#fde047'
    g.fillRect(f.x - 1, f.y - 1, 2, 2)
    g.globalAlpha = 1
  }

  private renderPuff(g: CanvasRenderingContext2D, p: Puff) {
    g.fillStyle = p.hp > 1 ? '#475569' : '#64748b'
    g.beginPath()
    g.arc(p.x - 4, p.y, 5, 0, Math.PI * 2)
    g.arc(p.x + 4, p.y, 5, 0, Math.PI * 2)
    g.arc(p.x, p.y - 3, 6, 0, Math.PI * 2)
    g.fill()
    // A grumpy face.
    g.fillStyle = '#e2e8f0'
    g.fillRect(p.x - 3, p.y - 3, 2, 1)
    g.fillRect(p.x + 1, p.y - 3, 2, 1)
    g.fillRect(p.x - 2, p.y + 1, 4, 1)
  }

  private renderDrop(g: CanvasRenderingContext2D, d: Drop) {
    g.fillStyle = SEED_COLORS[d.kind]
    g.beginPath()
    g.ellipse(d.x, d.y, 6, 4, 0, 0, Math.PI * 2)
    g.fill()
    drawText(g, d.kind, d.x, d.y - 3, { align: 'center', color: '#1e1b4b' })
  }

  private renderPaddle(g: CanvasRenderingContext2D) {
    if (this.lost > 0 && Math.floor(this.tick / 6) % 2) return
    const w = this.paddleW
    const x = Math.round(this.paddleX - w / 2)
    // A paddle bot: a rounded tray with a cheerful visor.
    g.fillStyle = this.sticky > 0 ? '#4ade80' : '#38bdf8'
    g.fillRect(x + 2, PADDLE_Y, w - 4, PADDLE_H)
    g.fillRect(x, PADDLE_Y + 1, w, PADDLE_H - 2)
    g.fillStyle = '#e0f2fe'
    g.fillRect(x + 4, PADDLE_Y + 1, w - 8, 1)
    g.fillStyle = '#0f172a'
    g.fillRect(Math.round(this.paddleX) - 5, PADDLE_Y + 2, 10, 2)
    g.fillStyle = '#fde047'
    g.fillRect(Math.round(this.paddleX) - 3, PADDLE_Y + 2, 2, 2)
    g.fillRect(Math.round(this.paddleX) + 1, PADDLE_Y + 2, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 4, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 3, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `STAGE ${this.level}`, W - 6, 12, {
      align: 'right',
      color: '#a5f3fc',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#38bdf8'
      g.fillRect(96 + i * 12, 8, 9, 3)
    }
    const powers: string[] = []
    if (this.wide > 0) powers.push('W')
    if (this.sticky > 0) powers.push('S')
    if (this.calm > 0) powers.push('C')
    if (powers.length)
      drawText(g, powers.join(' '), 96, 14, { color: '#86efac' })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 200, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 220, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const brickBloom: ArcadeGameModule = {
  create: (options) => new BrickBloom(options),
}

export const create = brickBloom.create
export default brickBloom

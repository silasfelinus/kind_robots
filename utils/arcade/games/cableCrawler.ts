// /utils/arcade/games/cableCrawler.ts
//
// Cable Crawler -- the Kind Robots Arcade's Nibbler riff (conductor
// kr-arcade/t-009 game factory, batch 4). A charging-cable bot slithers
// through a circuit-board maze slurping up sparks, growing longer with every
// bite. Slurp every spark to clear the board before the battery runs flat.
//
// The cable never crashes into walls: it pauses until you turn, and at a
// corner with only one way on it turns by itself. What does cost a cable is
// biting your own length, or the battery running out. Now and then a golden
// spark blinks in for a big bite. CABLE_CURVES speed the crawl and drain the
// battery faster.
//
// Arrows steer.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const TILE = 10
const COLS = 24
const ROWS = 20
const HUD_H = 24
const W = COLS * TILE
const H = HUD_H + ROWS * TILE
const START_LEN = 4
const GROW = 1
const START_LIVES = 3
const DEAD_TICKS = 100
const CLEAR_TICKS = 130
const GOLD_EVERY = 900
const GOLD_LIFE = 360
const EXTRA_AT = 15_000

const SPARK_POINTS = 10
const GOLD_POINTS = 500
const BATTERY_POINTS = 5

export const CABLE_CURVES = {
  /** Ticks per step along the maze (smaller is faster). */
  step: { start: 8, step: -0.5, limit: 3 },
  /** Battery, in seconds. */
  battery: { start: 75, step: -4, limit: 40 },
  /** Chance a maze block slot is filled. */
  blocks: { start: 0.55, step: 0.05, limit: 0.85 },
} as const

type Dir = { dx: number; dy: number }
const UP: Dir = { dx: 0, dy: -1 }
const DOWN: Dir = { dx: 0, dy: 1 }
const LEFT: Dir = { dx: -1, dy: 0 }
const RIGHT: Dir = { dx: 1, dy: 0 }
const DIRS = [UP, RIGHT, DOWN, LEFT]

type Cell = { x: number; y: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const key = (x: number, y: number) => y * COLS + x
const START: Cell = { x: Math.floor(COLS / 2), y: ROWS - 2 }

class CableCrawler implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private walls: boolean[] = []
  private sparks = new Set<number>()
  private gold: { k: number; life: number } | null = null
  private goldTimer = GOLD_EVERY
  /** Head first. */
  private body: Cell[] = []
  private dir: Dir = LEFT
  private want: Dir = LEFT
  private grow = 0
  private stepTimer = 0
  private battery = 0
  private batteryMax = 0
  private dead = 0
  private clear = 0
  private nextExtra = EXTRA_AT
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.buildBoard(1)
  }

  // --- the board ----------------------------------------------------------------

  private buildBoard(board: number) {
    this.level = board
    this.walls = []
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        this.walls.push(x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1)
    // Blocks of up to 2x2 sit on a 3-cell lattice, so one-wide corridors run
    // between them and every open cell joins up. The board is mirrored.
    const fill = levelCurve(board, CABLE_CURVES.blocks)
    const half = Math.floor(COLS / 2)
    for (let by = 2; by < ROWS - 2; by += 3)
      for (let bx = 2; bx < half; bx += 3) {
        if (this.rng() >= fill) continue
        const shape = Math.floor(this.rng() * 4)
        const cells =
          shape === 0
            ? [[0, 0]]
            : shape === 1
              ? [
                  [0, 0],
                  [1, 0],
                ]
              : shape === 2
                ? [
                    [0, 0],
                    [0, 1],
                  ]
                : [
                    [0, 0],
                    [1, 0],
                    [0, 1],
                    [1, 1],
                  ]
        for (const [dx, dy] of cells) {
          const x = bx + dx!
          const y = by + dy!
          if (y >= ROWS - 1 || x >= half) continue
          this.walls[key(x, y)] = true
          this.walls[key(COLS - 1 - x, y)] = true
        }
      }
    // Keep the start row clear.
    for (let x = 1; x < COLS - 1; x++) this.walls[key(x, START.y)] = false
    this.sparks.clear()
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++)
        // Sparks on every other cell: the cable ends a board very long.
        if (!this.walls[key(x, y)] && (x + y) % 2 === 0 && y !== START.y)
          this.sparks.add(key(x, y))
    this.gold = null
    this.goldTimer = GOLD_EVERY
    this.resetCable()
    this.banner = {
      text: `BOARD ${board}`,
      sub: `${this.sparks.size} SPARKS TO SLURP`,
      ticks: 100,
    }
  }

  private resetCable() {
    this.body = []
    for (let i = 0; i < START_LEN; i++)
      this.body.push({ x: START.x + i, y: START.y })
    this.dir = LEFT
    this.want = LEFT
    this.grow = 0
    this.stepTimer = 0
    this.batteryMax = Math.round(
      levelCurve(this.level, CABLE_CURVES.battery) * 60,
    )
    this.battery = this.batteryMax
  }

  private open(x: number, y: number): boolean {
    return (
      x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && !this.walls[key(x, y)]
    )
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'UNPLUGGED', sub: 'GAME OVER', ticks: 9999 }
        } else this.resetCable()
      }
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.buildBoard(this.level + 1)
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.steer(controls)
    if (--this.battery <= 0) {
      this.unplug('THE BATTERY RAN FLAT')
      return
    }
    this.updateGold()
    if (++this.stepTimer >= levelCurve(this.level, CABLE_CURVES.step)) {
      this.stepTimer = 0
      this.crawl()
    }
  }

  private steer(input: InputFrame) {
    const pick = input.held.up
      ? UP
      : input.held.down
        ? DOWN
        : input.held.left
          ? LEFT
          : input.held.right
            ? RIGHT
            : null
    // No doubling straight back into yourself.
    if (pick && (pick.dx !== -this.dir.dx || pick.dy !== -this.dir.dy))
      this.want = pick
  }

  private crawl() {
    const head = this.body[0]!
    let dir = this.want
    if (!this.open(head.x + dir.dx, head.y + dir.dy)) dir = this.dir
    if (!this.open(head.x + dir.dx, head.y + dir.dy)) {
      // A corner with only one way on: take it.
      const ways = DIRS.filter(
        (d) =>
          (d.dx !== -this.dir.dx || d.dy !== -this.dir.dy) &&
          this.open(head.x + d.dx, head.y + d.dy),
      )
      if (ways.length !== 1) return
      dir = ways[0]!
    }
    this.dir = dir
    this.want = dir
    const next = { x: head.x + dir.dx, y: head.y + dir.dy }
    // The tail end moves out of the way this step unless the cable is growing.
    const tailMoves = this.grow === 0
    const bite = this.body.some(
      (c, i) =>
        c.x === next.x &&
        c.y === next.y &&
        !(tailMoves && i === this.body.length - 1),
    )
    if (bite) {
      this.unplug('BIT YOUR OWN CABLE')
      return
    }
    this.body.unshift(next)
    if (this.grow > 0) this.grow--
    else this.body.pop()
    this.eat(next)
  }

  private eat(at: Cell) {
    const k = key(at.x, at.y)
    const px = at.x * TILE + TILE / 2
    const py = HUD_H + at.y * TILE + TILE / 2
    if (this.sparks.delete(k)) {
      this.grow += GROW
      this.addScore(SPARK_POINTS * this.level, px, py - 8, false)
      this.sound.play('blip')
      if (this.sparks.size === 0) this.boardClear()
    }
    if (this.gold && this.gold.k === k) {
      this.gold = null
      this.addScore(GOLD_POINTS * this.level, px, py - 8, true)
      this.burst(px, py, '#fde047', 14)
      this.sound.play('extra')
    }
  }

  private updateGold() {
    if (this.gold) {
      if (--this.gold.life <= 0) this.gold = null
      return
    }
    if (--this.goldTimer > 0) return
    this.goldTimer = GOLD_EVERY
    const taken = new Set(this.body.map((c) => key(c.x, c.y)))
    const free: number[] = []
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        const k = key(x, y)
        if (!this.walls[k] && !taken.has(k) && !this.sparks.has(k)) free.push(k)
      }
    if (free.length)
      this.gold = {
        k: free[Math.floor(this.rng() * free.length)]!,
        life: GOLD_LIFE,
      }
  }

  private boardClear() {
    const bonus = Math.ceil(this.battery / 60) * BATTERY_POINTS * this.level
    this.addScore(bonus, W / 2, H / 2, true)
    this.clear = CLEAR_TICKS
    this.sound.play('level')
    this.banner = {
      text: 'BOARD CLEAR!',
      sub: `BATTERY BONUS +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  private unplug(why: string) {
    this.lives--
    this.dead = DEAD_TICKS
    const head = this.body[0]!
    this.burst(
      head.x * TILE + TILE / 2,
      HUD_H + head.y * TILE + TILE / 2,
      '#f87171',
      18,
    )
    this.sound.play('die')
    this.banner = {
      text: 'ZAP!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: DEAD_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number, show: boolean) {
    if (this.demo || points <= 0) return
    this.score += points
    if (show) this.floaters.push({ x, y, text: String(points), life: 50 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_AT
      this.lives++
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 22 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.95
      p.vy *= 0.95
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
   * Heads for the nearest spark (or the gold one) by breadth-first search
   * around its own cable, and only takes a turn that leaves room to move.
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
    const head = this.body[0]!
    const blocked = new Set(this.body.slice(0, -1).map((c) => key(c.x, c.y)))
    const options = DIRS.filter(
      (d) =>
        (d.dx !== -this.dir.dx || d.dy !== -this.dir.dy) &&
        this.open(head.x + d.dx, head.y + d.dy) &&
        !blocked.has(key(head.x + d.dx, head.y + d.dy)),
    )
    if (options.length === 0) return frame
    const room = (d: Dir) =>
      this.area(head.x + d.dx, head.y + d.dy, blocked, this.body.length + 4)
    const roomy = options.filter((d) => room(d) >= this.body.length + 4)
    const pool = roomy.length ? roomy : options
    let best: Dir | null = null
    let bestDist = Infinity
    for (const d of pool) {
      const dist = this.distToFood(head.x + d.dx, head.y + d.dy, blocked)
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    if (!best) best = pool.sort((a, b) => room(b) - room(a))[0]!
    if (best === UP) held.up = true
    else if (best === DOWN) held.down = true
    else if (best === LEFT) held.left = true
    else held.right = true
    return frame
  }

  private distToFood(x: number, y: number, blocked: Set<number>): number {
    const start = key(x, y)
    const seen = new Set([start])
    let frontier = [start]
    for (let d = 0; frontier.length && d < 80; d++) {
      const next: number[] = []
      for (const k of frontier) {
        if (this.sparks.has(k) || this.gold?.k === k) return d
        const cx = k % COLS
        const cy = Math.floor(k / COLS)
        for (const dir of DIRS) {
          const nk = key(cx + dir.dx, cy + dir.dy)
          if (
            seen.has(nk) ||
            blocked.has(nk) ||
            !this.open(cx + dir.dx, cy + dir.dy)
          )
            continue
          seen.add(nk)
          next.push(nk)
        }
      }
      frontier = next
    }
    return Infinity
  }

  /** Open cells reachable from (x, y), counted up to `cap`. */
  private area(
    x: number,
    y: number,
    blocked: Set<number>,
    cap: number,
  ): number {
    const start = key(x, y)
    const seen = new Set([start])
    const stack = [start]
    while (stack.length && seen.size < cap) {
      const k = stack.pop()!
      const cx = k % COLS
      const cy = Math.floor(k / COLS)
      for (const dir of DIRS) {
        const nk = key(cx + dir.dx, cy + dir.dy)
        if (
          seen.has(nk) ||
          blocked.has(nk) ||
          !this.open(cx + dir.dx, cy + dir.dy)
        )
          continue
        seen.add(nk)
        stack.push(nk)
      }
    }
    return seen.size
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0b1220'
    g.fillRect(0, 0, W, H)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE
        const py = HUD_H + y * TILE
        if (this.walls[key(x, y)]) {
          g.fillStyle = '#115e59'
          g.fillRect(px, py, TILE, TILE)
          g.fillStyle = '#2dd4bf'
          if (!this.walls[key(x + 1, y)] || x === COLS - 1)
            g.fillRect(px + TILE - 1, py, 1, TILE)
          if (!this.walls[key(x, y + 1)] || y === ROWS - 1)
            g.fillRect(px, py + TILE - 1, TILE, 1)
          if ((x * 7 + y * 3) % 5 === 0) {
            g.fillStyle = '#facc15'
            g.fillRect(px + 4, py + 4, 2, 2)
          }
        } else {
          g.fillStyle = '#111827'
          g.fillRect(px + 4, py + 4, 1, 1)
        }
      }
    for (const k of this.sparks) {
      const px = (k % COLS) * TILE + TILE / 2
      const py = HUD_H + Math.floor(k / COLS) * TILE + TILE / 2
      const twinkle = (this.tick + k * 7) % 40 < 20
      g.fillStyle = twinkle ? '#fde047' : '#facc15'
      g.fillRect(px - 1, py - 1, 3, 3)
      if (twinkle) {
        g.fillStyle = '#fef9c3'
        g.fillRect(px, py - 3, 1, 7)
        g.fillRect(px - 3, py, 7, 1)
      }
    }
    if (
      this.gold &&
      (this.gold.life > 90 || Math.floor(this.gold.life / 6) % 2)
    ) {
      const px = (this.gold.k % COLS) * TILE + TILE / 2
      const py = HUD_H + Math.floor(this.gold.k / COLS) * TILE + TILE / 2
      g.fillStyle = '#f59e0b'
      g.beginPath()
      g.arc(px, py, 4.5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fef3c7'
      g.fillRect(px - 1, py - 3, 2, 6)
    }
    if (this.dead === 0 || Math.floor(this.dead / 5) % 2) this.renderCable(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef9c3',
        shadow: '#0b1220',
      })
    this.renderHud(g)
  }

  private renderCable(g: CanvasRenderingContext2D) {
    const centre = (c: Cell) => ({
      x: c.x * TILE + TILE / 2,
      y: HUD_H + c.y * TILE + TILE / 2,
    })
    g.strokeStyle = '#e2e8f0'
    g.lineWidth = 5
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    this.body.forEach((c, i) => {
      const p = centre(c)
      if (i === 0) g.moveTo(p.x, p.y)
      else g.lineTo(p.x, p.y)
    })
    g.stroke()
    // A coloured stripe and cable ties.
    g.strokeStyle = '#38bdf8'
    g.lineWidth = 1
    g.stroke()
    this.body.forEach((c, i) => {
      if (i === 0 || i % 4 !== 0) return
      const p = centre(c)
      g.fillStyle = '#f472b6'
      g.fillRect(p.x - 2, p.y - 2, 4, 4)
    })
    // The plug head with its two prongs.
    const head = centre(this.body[0]!)
    g.fillStyle = '#94a3b8'
    g.fillRect(head.x - 4, head.y - 4, 8, 8)
    g.fillStyle = '#e2e8f0'
    g.fillRect(head.x - 3, head.y - 3, 6, 6)
    g.fillStyle = '#fbbf24'
    const d = this.dir
    for (const side of [-2, 2]) {
      const px = head.x + d.dx * 5 + (d.dx === 0 ? side : 0)
      const py = head.y + d.dy * 5 + (d.dy === 0 ? side : 0)
      g.fillRect(px - 1, py - 1, 2, 2)
    }
    g.fillStyle = '#0f172a'
    g.fillRect(head.x - 2, head.y - 1, 1, 1)
    g.fillRect(head.x + 1, head.y - 1, 1, 1)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0b1220'
    g.fillStyle = 'rgba(11, 18, 32, 0.95)'
    g.fillRect(0, 0, W, HUD_H)
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `BOARD ${this.level}`, W - 4, 12, {
      align: 'right',
      color: '#5eead4',
    })
    // The battery.
    const frac = this.batteryMax ? this.battery / this.batteryMax : 0
    g.fillStyle = '#e2e8f0'
    g.fillRect(88, 5, 52, 12)
    g.fillRect(140, 8, 3, 6)
    g.fillStyle = '#0b1220'
    g.fillRect(89, 6, 50, 10)
    g.fillStyle = frac > 0.3 ? '#4ade80' : frac > 0.15 ? '#facc15' : '#f87171'
    g.fillRect(90, 7, 48 * frac, 8)
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = '#e2e8f0'
      g.fillRect(150 + i * 10, 9, 6, 6)
      g.fillStyle = '#fbbf24'
      g.fillRect(156 + i * 10, 10, 2, 1)
      g.fillRect(156 + i * 10, 13, 2, 1)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 96, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow,
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 116, {
          align: 'center',
          color: '#fef9c3',
          shadow,
        })
    }
  }
}

const cableCrawler: ArcadeGameModule = {
  create: (options) => new CableCrawler(options),
}

export const create = cableCrawler.create
export default cableCrawler

// /utils/arcade/games/quiltQuest.ts
//
// Quilt Quest -- the Kind Robots Arcade's Qix riff (conductor kr-arcade/t-009
// game factory, batch 3). A needle-bot runs along the edges of a blank quilt.
// Hold A and head into the open cloth to stitch a thread; bring it back to an
// edge and the side without the tangle sprite fills with a colourful patch.
// Hold B instead for a slow stitch: half the speed, double the points.
//
// The tangle sprite roams the open cloth; if it brushes a thread mid-stitch
// the thread snaps (a life). Stop moving while stitching and a fuse starts
// unpicking the thread from where it began. From level 2 sparks run along the
// edges; meet one and you're bonked. Claim the target share of the quilt (75%
// at first, rising) to finish it, with a bonus for every point over.
//
// Arrows move. A = stitch, B = slow stitch (double points).

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const CELL = 4
const COLS = 61
const ROWS = 51
const OX = 6
const OY = 30
const W = OX * 2 + COLS * CELL
const H = OY + ROWS * CELL + 6
const START_LIVES = 3
const DEATH_TICKS = 100
const CLEAR_TICKS = 160
const FUSE_AFTER = 45
const EXTRA_EVERY = 25_000

/** Cell states. */
const OPEN = 0
const FILLED = 1
const EDGE = 2
const TRAIL = 3

export const QUILT_CURVES = {
  /** Share of the quilt to claim (percent). */
  target: { start: 75, step: 2, limit: 85 },
  /** Cells per tick the tangle sprite drifts. */
  tangleSpeed: { start: 0.35, step: 0.05, limit: 0.75 },
  tangles: { start: 1, step: 0.34, limit: 3 },
  sparks: { start: 0, step: 1, limit: 4 },
  /** Ticks per cell a spark runs. */
  sparkStep: { start: 6, step: -0.5, limit: 3 },
} as const

const PATCH_COLORS = [
  '#f9a8d4',
  '#fde047',
  '#a5f3fc',
  '#c4b5fd',
  '#86efac',
  '#fdba74',
]

type Tangle = {
  x: number
  y: number
  vx: number
  vy: number
  trail: Array<{ x: number; y: number }>
}
type Spark = {
  c: number
  r: number
  pc: number
  pr: number
  hand: 1 | -1
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

/** Right, down, left, up. */
const DIRS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
]

class QuiltQuest implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private cells = new Uint8Array(COLS * ROWS)
  /** Which patch colour each filled cell got. */
  private colors = new Uint8Array(COLS * ROWS)
  private patchCount = 0
  private c = 0
  private r = Math.floor(ROWS / 2)
  private moveTimer = 0
  private drawing = false
  private slow = false
  private trail: Array<{ c: number; r: number }> = []
  private still = 0
  private fuse = -1
  private tangles: Tangle[] = []
  private sparks: Spark[] = []
  private claimed = 0
  private dead = 0
  private clear = 0
  private nextExtra = EXTRA_EVERY
  private plan: number[] = []
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

  private idx(c: number, r: number): number {
    return r * COLS + c
  }

  private cell(c: number, r: number): number {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return FILLED
    return this.cells[this.idx(c, r)]!
  }

  private get target(): number {
    return levelCurve(this.level, QUILT_CURVES.target)
  }

  // --- levels --------------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.cells.fill(OPEN)
    this.colors.fill(0)
    for (let c = 0; c < COLS; c++) {
      this.cells[this.idx(c, 0)] = EDGE
      this.cells[this.idx(c, ROWS - 1)] = EDGE
    }
    for (let r = 0; r < ROWS; r++) {
      this.cells[this.idx(0, r)] = EDGE
      this.cells[this.idx(COLS - 1, r)] = EDGE
    }
    this.claimed = 0
    this.tangles = []
    const count = Math.round(levelCurve(level, QUILT_CURVES.tangles))
    const speed = levelCurve(level, QUILT_CURVES.tangleSpeed)
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      this.tangles.push({
        x: COLS / 2 + (this.rng() - 0.5) * 20,
        y: ROWS / 2 + (this.rng() - 0.5) * 16,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        trail: [],
      })
    }
    this.resetPlayer()
    this.banner = {
      text: `QUILT ${level}`,
      sub: `CLAIM ${Math.round(this.target)} PERCENT`,
      ticks: 100,
    }
  }

  /**
   * A new quilt starts the needle on the left edge, pointing into the cloth;
   * after a snap it goes back to where its stitch began. Either way it lands
   * on a live edge (a spot sewn into a patch would leave it stuck).
   */
  private resetPlayer(fresh = true) {
    if (fresh) {
      this.c = 0
      this.r = Math.floor(ROWS / 2)
    }
    if (this.cell(this.c, this.r) !== EDGE) {
      const to = this.nearestEdge(this.c, this.r)
      this.c = to.c
      this.r = to.r
    }
    this.drawing = false
    this.trail = []
    this.fuse = -1
    this.still = 0
    this.plan = []
    this.sparks = []
    const sparks = Math.round(levelCurve(this.level, QUILT_CURVES.sparks))
    for (let i = 0; i < sparks; i++)
      this.sparks.push({
        c: Math.floor(COLS / 2),
        r: 0,
        pc: Math.floor(COLS / 2) + (i % 2 ? 1 : -1),
        pr: 0,
        hand: i % 2 ? 1 : -1,
        t: 60 * (i + 1),
      })
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else this.resetPlayer(false)
      }
      return
    }
    this.movePlayer(controls)
    if (this.dead > 0) return
    this.updateFuse()
    this.moveTangles()
    this.moveSparks()
  }

  private movePlayer(input: InputFrame) {
    const dir = input.held.right
      ? 0
      : input.held.down
        ? 1
        : input.held.left
          ? 2
          : input.held.up
            ? 3
            : -1
    const stitch = input.held.a || input.held.b
    if (this.drawing) this.still = dir < 0 ? this.still + 1 : 0
    if (--this.moveTimer > 0 || dir < 0) return
    const [dc, dr] = DIRS[dir]!
    const nc = this.c + dc
    const nr = this.r + dr
    const next = this.cell(nc, nr)
    if (!this.drawing) {
      if (next === EDGE) {
        this.c = nc
        this.r = nr
        this.moveTimer = 2
      } else if (next === OPEN && stitch) {
        // Off the edge into open cloth: start a stitch.
        this.drawing = true
        this.slow = input.held.b && !input.held.a
        this.trail = [{ c: this.c, r: this.r }]
        this.fuse = -1
        this.stepInto(nc, nr)
      }
      return
    }
    if (next === OPEN) this.stepInto(nc, nr)
    else if (next === EDGE) this.closeStitch(nc, nr)
  }

  private stepInto(c: number, r: number) {
    this.c = c
    this.r = r
    this.cells[this.idx(c, r)] = TRAIL
    this.trail.push({ c, r })
    this.moveTimer = this.slow ? 4 : 2
    // Every stitch pays a point (two on a slow stitch).
    this.addScore(this.slow ? 2 : 1, 0, 0)
    if (this.trail.length % 4 === 0) this.sound.play('blip')
  }

  /** Back on an edge: fill the side without the tangle sprite. */
  private closeStitch(c: number, r: number) {
    this.c = c
    this.r = r
    this.drawing = false
    this.fuse = -1
    for (const t of this.trail) this.cells[this.idx(t.c, t.r)] = EDGE
    // Everything the tangle sprites can still reach stays open.
    const reach = new Uint8Array(COLS * ROWS)
    const stack: number[] = []
    for (const t of this.tangles) {
      const tc = Math.round(t.x)
      const tr = Math.round(t.y)
      if (this.cell(tc, tr) === OPEN) {
        reach[this.idx(tc, tr)] = 1
        stack.push(tc, tr)
      }
    }
    while (stack.length) {
      const y = stack.pop()!
      const x = stack.pop()!
      for (const [dc, dr] of DIRS) {
        const nx = x + dc
        const ny = y + dr
        if (this.cell(nx, ny) !== OPEN || reach[this.idx(nx, ny)]) continue
        reach[this.idx(nx, ny)] = 1
        stack.push(nx, ny)
      }
    }
    const color = 1 + (this.patchCount++ % PATCH_COLORS.length)
    let gained = 0
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === OPEN && !reach[i]) {
        this.cells[i] = FILLED
        this.colors[i] = color
        gained++
      }
    }
    // Edges with no open cloth beside them are sewn in.
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        if (this.cell(x, y) !== EDGE) continue
        let open = false
        for (let dy = -1; dy <= 1 && !open; dy++)
          for (let dx = -1; dx <= 1 && !open; dx++)
            if (this.cell(x + dx, y + dy) === OPEN) open = true
        if (!open) {
          this.cells[this.idx(x, y)] = FILLED
          this.colors[this.idx(x, y)] = color
        }
      }
    const before = this.claimed
    this.recount()
    const points = Math.round(
      gained * (this.slow ? 2 : 1) * (1 + (this.level - 1) * 0.25),
    )
    const cx = OX + this.c * CELL
    const cy = OY + this.r * CELL
    this.addScore(points, cx, cy - 8)
    this.trail = []
    this.sound.play(gained > 200 ? 'extra' : 'pickup')
    if (this.claimed >= this.target) this.quiltDone()
    else if (this.claimed - before >= 15)
      this.floaters.push({
        x: W / 2,
        y: OY + 30,
        text: `${this.claimed.toFixed(0)} PERCENT`,
        life: 50,
      })
    // Anyone left standing on a sewn-in cell goes to the nearest live edge.
    if (this.cell(this.c, this.r) !== EDGE) {
      const to = this.nearestEdge(this.c, this.r)
      this.c = to.c
      this.r = to.r
    }
    for (const s of this.sparks)
      if (this.cell(s.c, s.r) !== EDGE) this.relocateSpark(s)
  }

  private recount() {
    let filled = 0
    let interior = 0
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        interior++
        if (this.cell(x, y) !== OPEN) filled++
      }
    this.claimed = (filled / interior) * 100
  }

  private quiltDone() {
    const over = Math.max(0, Math.floor(this.claimed - this.target))
    const bonus = 1000 * this.level + over * 1000
    this.addScore(bonus, W / 2, H / 2)
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'QUILT FINISHED!',
      sub: `${this.claimed.toFixed(0)} PERCENT  BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  /** Standing still mid-stitch lights a fuse that unpicks the thread from its start. */
  private updateFuse() {
    if (!this.drawing) return
    if (this.fuse < 0 && this.still > FUSE_AFTER) this.fuse = 0
    if (this.fuse < 0) return
    if (this.tick % 3 === 0) this.fuse++
    if (this.fuse >= this.trail.length - 1) this.snap('THE FUSE CAUGHT UP')
  }

  private moveTangles() {
    for (const t of this.tangles) {
      // Wander a little.
      if (this.rng() < 0.02) {
        const a = Math.atan2(t.vy, t.vx) + (this.rng() - 0.5) * 1.2
        const s = Math.hypot(t.vx, t.vy)
        t.vx = Math.cos(a) * s
        t.vy = Math.sin(a) * s
      }
      const nx = t.x + t.vx
      const ny = t.y + t.vy
      if (
        this.cell(Math.round(nx), Math.round(t.y)) !== OPEN &&
        this.cell(Math.round(nx), Math.round(t.y)) !== TRAIL
      )
        t.vx = -t.vx
      if (
        this.cell(Math.round(t.x), Math.round(ny)) !== OPEN &&
        this.cell(Math.round(t.x), Math.round(ny)) !== TRAIL
      )
        t.vy = -t.vy
      const mx = t.x + t.vx
      const my = t.y + t.vy
      const here = this.cell(Math.round(mx), Math.round(my))
      if (here === OPEN || here === TRAIL) {
        t.x = mx
        t.y = my
      }
      t.trail.unshift({ x: t.x, y: t.y })
      if (t.trail.length > 30) t.trail.pop()
      // Brushing the thread snaps it.
      if (this.drawing) {
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (
              this.cell(Math.round(t.x) + dx, Math.round(t.y) + dy) === TRAIL
            ) {
              this.snap('THE TANGLE SNAGGED THE THREAD')
              return
            }
      }
    }
  }

  private nearestEdge(c: number, r: number): { c: number; r: number } {
    let best = { c, r, d: Infinity }
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (this.cell(x, y) === EDGE) {
          const d = Math.abs(x - c) + Math.abs(y - r)
          if (d < best.d) best = { c: x, r: y, d }
        }
    return best
  }

  private relocateSpark(s: Spark) {
    const to = this.nearestEdge(s.c, s.r)
    s.c = to.c
    s.r = to.r
    s.pc = to.c
    s.pr = to.r
  }

  private moveSparks() {
    const every = Math.round(levelCurve(this.level, QUILT_CURVES.sparkStep))
    for (const s of this.sparks) {
      if (s.t > 0) {
        s.t--
        continue
      }
      if (this.tick % every !== 0) continue
      // Follow the edge, keeping a hand on the wall: prefer turning one way.
      const heading = DIRS.findIndex(
        ([dc, dr]) => dc === s.c - s.pc && dr === s.r - s.pr,
      )
      const order =
        heading < 0
          ? [0, 1, 2, 3]
          : [heading + s.hand, heading, heading - s.hand, heading + 2].map(
              (d) => (d + 4) % 4,
            )
      for (const d of order) {
        const [dc, dr] = DIRS[d]!
        if (this.cell(s.c + dc, s.r + dr) !== EDGE) continue
        s.pc = s.c
        s.pr = s.r
        s.c += dc
        s.r += dr
        break
      }
      if (!this.drawing && s.c === this.c && s.r === this.r) {
        this.snap('BONKED BY A SPARK')
        return
      }
      // A spark also runs along a thread back to the needle.
      if (
        this.drawing &&
        this.trail[0] &&
        s.c === this.trail[0].c &&
        s.r === this.trail[0].r &&
        this.fuse < 0
      )
        this.fuse = 0
    }
  }

  private snap(why: string) {
    this.lives--
    this.dead = DEATH_TICKS
    for (const t of this.trail)
      if (this.cell(t.c, t.r) === TRAIL) this.cells[this.idx(t.c, t.r)] = OPEN
    // The needle goes back to where the stitch began.
    if (this.trail[0]) {
      this.c = this.trail[0].c
      this.r = this.trail[0].r
    }
    this.trail = []
    this.drawing = false
    this.burst(OX + this.c * CELL, OY + this.r * CELL, 16, '#f9a8d4')
    this.sound.play('die')
    this.banner = { text: 'SNAP!', sub: why, ticks: DEATH_TICKS }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (points >= 50)
      this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_EVERY
      this.lives++
      this.banner = { text: 'EXTRA NEEDLE!', ticks: 80 }
      this.sound.play('extra')
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
        vy: Math.sin(a) * s,
        life: 16 + Math.floor(this.rng() * 14),
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

  /**
   * Stitches small boxes in from the edge, well away from the tangle: in a few
   * cells, across, and back out to the nearest edge.
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
    const keys: Array<keyof typeof held> = ['right', 'down', 'left', 'up']
    const nearestTangle = Math.min(
      ...this.tangles.map((t) => Math.hypot(t.x - this.c, t.y - this.r)),
    )
    if (!this.drawing) {
      if (this.plan.length === 0) {
        // Find an inward direction from here, and plan a box if the tangle is far.
        const inward = DIRS.findIndex(
          ([dc, dr]) => this.cell(this.c + dc, this.r + dr) === OPEN,
        )
        if (inward >= 0 && nearestTangle > 20) {
          const along = (inward + (this.rng() < 0.5 ? 1 : 3)) % 4
          const deep = 6 + Math.floor(this.rng() * 10)
          const wide = 10 + Math.floor(this.rng() * 18)
          this.plan = [...Array(deep).fill(inward), ...Array(wide).fill(along)]
          held.a = true
          held[keys[inward]!] = true
          return frame
        }
        // Otherwise wander along the edge.
        const ways = DIRS.map((_, d) => d).filter(
          (d) => this.cell(this.c + DIRS[d]![0], this.r + DIRS[d]![1]) === EDGE,
        )
        const pick =
          ways[
            (Math.floor(this.tick / 40) + ways.length) %
              Math.max(1, ways.length)
          ]
        if (pick !== undefined) held[keys[pick]!] = true
        return frame
      }
    }
    held.a = true
    // The tangle's coming: give up the box and head for the nearest edge.
    if (nearestTangle < 12) this.plan = []
    if (this.plan.length) {
      const d = this.plan[0]!
      const [dc, dr] = DIRS[d]!
      const next = this.cell(this.c + dc, this.r + dr)
      if (next === OPEN || next === EDGE) {
        if (this.moveTimer <= 1) this.plan.shift()
        held[keys[d]!] = true
        return frame
      }
      this.plan = []
    }
    // Head back out to the nearest edge, breadth-first through open cloth.
    const step = this.pathToEdge()
    if (step >= 0) held[keys[step]!] = true
    return frame
  }

  private pathToEdge(): number {
    const seen = new Int8Array(COLS * ROWS).fill(-1)
    const queue: number[] = []
    for (let d = 0; d < 4; d++) {
      const [dc, dr] = DIRS[d]!
      const nc = this.c + dc
      const nr = this.r + dr
      const v = this.cell(nc, nr)
      if (v === EDGE) return d
      if (v === OPEN && seen[this.idx(nc, nr)] === -1) {
        seen[this.idx(nc, nr)] = d
        queue.push(nc, nr)
      }
    }
    while (queue.length) {
      const c = queue.shift()!
      const r = queue.shift()!
      for (const [dc, dr] of DIRS) {
        const nc = c + dc
        const nr = r + dr
        const v = this.cell(nc, nr)
        if (v === EDGE) return seen[this.idx(c, r)]!
        if (v !== OPEN || seen[this.idx(nc, nr)] !== -1) continue
        seen[this.idx(nc, nr)] = seen[this.idx(c, r)]!
        queue.push(nc, nr)
      }
    }
    return -1
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#1e1b4b'
    g.fillRect(0, 0, W, H)
    // The blank quilt: a soft cross-hatched cloth.
    g.fillStyle = '#312e81'
    g.fillRect(OX, OY, COLS * CELL, ROWS * CELL)
    g.fillStyle = '#3730a3'
    for (let y = 0; y < ROWS; y += 2)
      for (let x = (y / 2) % 2; x < COLS; x += 2)
        g.fillRect(OX + x * CELL, OY + y * CELL, CELL, CELL)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const v = this.cell(x, y)
        if (v === OPEN) continue
        const px = OX + x * CELL
        const py = OY + y * CELL
        if (v === FILLED) {
          const color =
            PATCH_COLORS[
              (this.colors[this.idx(x, y)]! + 5) % PATCH_COLORS.length
            ]!
          g.fillStyle = color
          g.fillRect(px, py, CELL, CELL)
          // A quilted stitch dot pattern.
          if ((x + y) % 4 === 0) {
            g.fillStyle = 'rgba(255, 255, 255, 0.45)'
            g.fillRect(px + 1, py + 1, 1, 1)
          }
        } else if (v === EDGE) {
          g.fillStyle = '#f5f5f4'
          g.fillRect(px + 1, py + 1, 2, 2)
        } else if (v === TRAIL) {
          g.fillStyle = this.slow ? '#fb7185' : '#fde047'
          g.fillRect(px + 1, py + 1, 2, 2)
        }
      }
    // The fuse burning along the thread.
    if (this.drawing && this.fuse >= 0) {
      const f = this.trail[Math.min(this.fuse, this.trail.length - 1)]
      if (f) {
        g.fillStyle = Math.floor(this.tick / 3) % 2 ? '#f97316' : '#fef08a'
        g.fillRect(OX + f.c * CELL - 1, OY + f.r * CELL - 1, CELL + 2, CELL + 2)
      }
    }
    for (const t of this.tangles) this.renderTangle(g, t)
    for (const s of this.sparks) {
      if (s.t > 0) continue
      g.fillStyle = Math.floor(this.tick / 2) % 2 ? '#fef08a' : '#fb923c'
      g.fillRect(OX + s.c * CELL - 1, OY + s.r * CELL - 1, CELL + 2, CELL + 2)
    }
    if (this.dead === 0) this.renderNeedle(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fde68a',
        shadow: '#1e1b4b',
      })
    this.renderHud(g)
  }

  private renderTangle(g: CanvasRenderingContext2D, t: Tangle) {
    // A scribble of yarn lines trailing the sprite.
    const colors = ['#f472b6', '#22d3ee', '#a3e635', '#facc15']
    for (let i = 0; i + 3 < t.trail.length; i += 3) {
      const a = t.trail[i]!
      const b = t.trail[i + 3]!
      const wob = Math.sin((this.tick + i) / 4) * 4
      g.strokeStyle = colors[(i / 3) % colors.length]!
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(OX + a.x * CELL + wob, OY + a.y * CELL - wob)
      g.lineTo(OX + b.x * CELL - wob, OY + b.y * CELL + wob)
      g.stroke()
    }
    g.fillStyle = Math.floor(this.tick / 4) % 2 ? '#ffffff' : '#fde047'
    g.fillRect(OX + t.x * CELL - 2, OY + t.y * CELL - 2, 5, 5)
  }

  private renderNeedle(g: CanvasRenderingContext2D) {
    const x = OX + this.c * CELL + 2
    const y = OY + this.r * CELL + 2
    g.fillStyle = this.drawing ? (this.slow ? '#fb7185' : '#fde047') : '#e0f2fe'
    g.beginPath()
    g.moveTo(x, y - 5)
    g.lineTo(x + 4, y)
    g.lineTo(x, y + 5)
    g.lineTo(x - 4, y)
    g.closePath()
    g.fill()
    g.fillStyle = '#1e1b4b'
    g.fillRect(x - 1, y - 1, 2, 2)
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
    drawText(g, `QUILT ${this.level}`, W - 6, 12, {
      align: 'right',
      color: '#a5f3fc',
    })
    // Progress toward the target share.
    const barX = 96
    const barW = 80
    g.fillStyle = '#0f172a'
    g.fillRect(barX, 6, barW, 6)
    g.fillStyle = '#86efac'
    g.fillRect(barX, 6, (barW * Math.min(100, this.claimed)) / 100, 6)
    g.fillStyle = '#fde047'
    g.fillRect(barX + (barW * this.target) / 100, 4, 1, 10)
    drawText(
      g,
      `${Math.floor(this.claimed)} OF ${Math.round(this.target)}`,
      barX,
      16,
      { color: '#e0f2fe' },
    )
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = '#e0f2fe'
      g.fillRect(W - 12 - i * 8, 22, 4, 4)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 16, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, H / 2 + 4, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const quiltQuest: ArcadeGameModule = {
  create: (options) => new QuiltQuest(options),
}

export const create = quiltQuest.create
export default quiltQuest

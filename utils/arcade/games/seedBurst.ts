// /utils/arcade/games/seedBurst.ts
//
// Seed Burst -- the Kind Robots Arcade's Bomberman riff (conductor
// kr-arcade/t-009 game factory, batch 4). Gardener bots plant seed pods in a
// hedge maze. A pod bursts after a moment into a cross of blooms that clears
// the first hedge in each direction and turns any grumpy gnat it touches into
// a butterfly. Turn every gnat to clear the round. Standing in a bloom (yours
// or a partner's) or bumping a gnat costs the team a gardener.
//
// Hedges hide seed packets (+1 pod at a time), fertiliser (longer blooms) and
// quick shoes. A burst that reaches another pod sets it off too. From round 3
// some gnats drift straight through hedges, and when the round timer runs out
// a gust of wind blows in a few more. SEED_CURVES ramp the gnats and hedges.
//
// Up to four gardeners share one screen, one score and one pool of spares.
// Arrows move, A plants a pod.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const TILE = 16
const COLS = 15
const ROWS = 13
const HUD_H = 24
const W = COLS * TILE
const H = HUD_H + ROWS * TILE
const MAX_PLAYERS = 4
const START_SPARES = 2
const FUSE = 150
const BLOOM_TICKS = 26
const SAFE_TICKS = 150
const RESPAWN_TICKS = 100
const CLEAR_TICKS = 150
const ROUND_TIME = 60 * 150
const WIND_GNATS = 3
const BASE_SPEED = 1
const SHOE_SPEED = 0.25
const MAX_SPEED = 2
const MAX_PODS = 6
const MAX_RANGE = 7
const TOUCH = 11
const POWER_CHANCE = 0.22

const GNAT_POINTS = 100
const HEDGE_POINTS = 10
const POWER_POINTS = 50
const ROUND_POINTS = 1000

export const SEED_CURVES = {
  /** Gnats in the round. */
  gnats: { start: 3, step: 1, limit: 10 },
  /** Gnat speed in pixels per tick. */
  gnatSpeed: { start: 0.5, step: 0.06, limit: 1.15 },
  /** Gnats that drift through hedges (from round 3). */
  ghosts: { start: 0, step: 0.5, limit: 4 },
  /** Share of free cells planted with hedges. */
  hedges: { start: 0.45, step: 0.03, limit: 0.66 },
} as const

const WALL = 1
const HEDGE = 2

type Dir = { dx: number; dy: number }
const DIRS: Dir[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]
type Power = 'pod' | 'bloom' | 'shoe'
type Gardener = {
  seat: number
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  facing: Dir
  pods: number
  range: number
  speed: number
  safe: number
  /** >0 counting down to a respawn; -1 out of the game; 0 in play. */
  down: number
}
type Pod = {
  x: number
  y: number
  fuse: number
  owner: number
  range: number
  standing: Set<number>
}
type Bloom = { x: number; y: number; life: number; chain: { count: number } }
type Gnat = {
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  dir: Dir
  ghost: boolean
  speed: number
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

const SEAT_COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24']
const CORNERS = [
  { x: 1, y: 1 },
  { x: COLS - 2, y: ROWS - 2 },
  { x: COLS - 2, y: 1 },
  { x: 1, y: ROWS - 2 },
]

const key = (x: number, y: number) => y * COLS + x

class SeedBurst implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private grid: number[] = []
  private powers = new Map<number, Power>()
  private hidden = new Map<number, Power>()
  private gardeners: Gardener[] = []
  private spares = START_SPARES
  private pods: Pod[] = []
  private blooms: Bloom[] = []
  private gnats: Gnat[] = []
  private timer = ROUND_TIME
  private clear = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    for (let seat = 0; seat < seats; seat++)
      this.gardeners.push({
        seat,
        tx: 0,
        ty: 0,
        nx: 0,
        ny: 0,
        p: 0,
        facing: DIRS[2]!,
        pods: 1,
        range: 2,
        speed: BASE_SPEED,
        safe: SAFE_TICKS,
        down: 0,
      })
    this.buildRound(1)
  }

  /** Gardeners in play or waiting to respawn, plus the team's spares. */
  get lives(): number {
    return this.gardeners.filter((g) => g.down >= 0).length + this.spares
  }

  // --- the maze -------------------------------------------------------------------

  private buildRound(round: number) {
    this.level = round
    this.grid = []
    this.powers.clear()
    this.hidden.clear()
    this.pods = []
    this.blooms = []
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const edge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1
        this.grid.push(edge || (x % 2 === 0 && y % 2 === 0) ? WALL : 0)
      }
    // Corners stay clear so every gardener can step out and plant.
    const clearCells = new Set<number>()
    for (const c of CORNERS)
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        clearCells.add(key(c.x + dx!, c.y + dy!))
    // A hedge two steps out from each corner, so a first pod always clears one.
    for (const c of CORNERS)
      for (const [dx, dy] of [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ]) {
        const x = c.x + dx!
        const y = c.y + dy!
        if (
          x > 0 &&
          y > 0 &&
          x < COLS - 1 &&
          y < ROWS - 1 &&
          !this.grid[key(x, y)]
        )
          this.grid[key(x, y)] = HEDGE
      }
    const density = levelCurve(round, SEED_CURVES.hedges)
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        const k = key(x, y)
        if (this.grid[k] || clearCells.has(k)) continue
        if (this.rng() < density) {
          this.grid[k] = HEDGE
          if (this.rng() < POWER_CHANCE)
            this.hidden.set(
              k,
              (['pod', 'bloom', 'shoe'] as const)[Math.floor(this.rng() * 3)]!,
            )
        }
      }
    for (const g of this.gardeners) {
      if (g.down < 0) continue
      this.placeAtCorner(g)
      g.down = 0
    }
    // Gnats start well away from every corner.
    this.gnats = []
    const count = Math.round(levelCurve(round, SEED_CURVES.gnats))
    const ghosts = Math.max(
      0,
      Math.floor(levelCurve(round, SEED_CURVES.ghosts)),
    )
    const speed = levelCurve(round, SEED_CURVES.gnatSpeed)
    const open: Array<{ x: number; y: number }> = []
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++)
        if (
          this.grid[key(x, y)] === 0 &&
          CORNERS.every((c) => Math.abs(c.x - x) + Math.abs(c.y - y) >= 6)
        )
          open.push({ x, y })
    for (let i = 0; i < count && open.length; i++) {
      const at = open.splice(Math.floor(this.rng() * open.length), 1)[0]!
      this.gnats.push(this.newGnat(at.x, at.y, i < ghosts, speed))
    }
    this.timer = ROUND_TIME
    this.banner = {
      text: `ROUND ${round}`,
      sub: `TURN ${this.gnats.length} GNATS INTO BUTTERFLIES`,
      ticks: 110,
    }
  }

  private newGnat(x: number, y: number, ghost: boolean, speed: number): Gnat {
    return {
      tx: x,
      ty: y,
      nx: x,
      ny: y,
      p: 0,
      dir: DIRS[Math.floor(this.rng() * 4)]!,
      ghost,
      speed: ghost ? speed * 0.8 : speed,
    }
  }

  private placeAtCorner(g: Gardener) {
    const c = CORNERS[g.seat]!
    g.tx = g.nx = c.x
    g.ty = g.ny = c.y
    g.p = 0
    g.safe = SAFE_TICKS
  }

  private solid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true
    return this.grid[key(x, y)] !== 0
  }

  private podAt(x: number, y: number): Pod | undefined {
    return this.pods.find((p) => p.x === x && p.y === y)
  }

  private canWalk(g: Gardener, x: number, y: number): boolean {
    if (this.solid(x, y)) return false
    const pod = this.podAt(x, y)
    return !pod || pod.standing.has(g.seat)
  }

  /** The tile a walker is mostly standing on. */
  private here(w: {
    tx: number
    ty: number
    nx: number
    ny: number
    p: number
  }) {
    return w.p < 0.5 ? { x: w.tx, y: w.ty } : { x: w.nx, y: w.ny }
  }

  private pixel(w: {
    tx: number
    ty: number
    nx: number
    ny: number
    p: number
  }) {
    return {
      x: (w.tx + (w.nx - w.tx) * w.p) * TILE + TILE / 2,
      y: HUD_H + (w.ty + (w.ny - w.ty) * w.p) * TILE + TILE / 2,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.clear > 0) {
      if (--this.clear === 0) this.buildRound(this.level + 1)
      return
    }
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])
    for (const g of this.gardeners) {
      if (g.down > 0) {
        if (--g.down === 0) this.placeAtCorner(g)
        continue
      }
      if (g.down < 0) continue
      if (g.safe > 0) g.safe--
      const controls = frames[g.seat] ?? frames[0]!
      this.walk(g, controls)
      if (controls.pressed.a) this.plant(g)
    }
    this.updatePods()
    this.updateBlooms()
    this.updateGnats()
    this.touchGnats()
    if (--this.timer === 0) this.windGust()
    if (this.gnats.length === 0) this.roundClear()
    else if (this.gardeners.every((g) => g.down < 0)) {
      this.over = true
      this.banner = { text: 'GARDEN CLOSED', sub: 'GAME OVER', ticks: 9999 }
    }
  }

  private walk(g: Gardener, input: InputFrame) {
    if (g.p === 0) {
      const wanted = DIRS.filter(
        (d) =>
          (d.dy < 0 && input.held.up) ||
          (d.dy > 0 && input.held.down) ||
          (d.dx < 0 && input.held.left) ||
          (d.dx > 0 && input.held.right),
      )
      // With two directions held, take the one that is open.
      const dir = wanted.find((d) => this.canWalk(g, g.tx + d.dx, g.ty + d.dy))
      if (wanted.length) g.facing = dir ?? wanted[0]!
      if (!dir) return
      g.nx = g.tx + dir.dx
      g.ny = g.ty + dir.dy
    }
    g.p += g.speed / TILE
    if (g.p >= 1) {
      // Leaving a pod's tile makes it solid for this gardener.
      for (const pod of this.pods)
        if (pod.x === g.tx && pod.y === g.ty) pod.standing.delete(g.seat)
      g.tx = g.nx
      g.ty = g.ny
      g.p = 0
      this.pickUp(g)
    }
  }

  private plant(g: Gardener) {
    const at = this.here(g)
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine >= g.pods || this.podAt(at.x, at.y)) return
    const standing = new Set<number>()
    for (const other of this.gardeners) {
      if (other.down !== 0) continue
      const t = this.here(other)
      if (t.x === at.x && t.y === at.y) standing.add(other.seat)
      // Mid-step off this tile counts as standing on it too.
      if (other.tx === at.x && other.ty === at.y) standing.add(other.seat)
    }
    this.pods.push({
      x: at.x,
      y: at.y,
      fuse: FUSE,
      owner: g.seat,
      range: g.range,
      standing,
    })
    this.sound.play('blip')
  }

  private pickUp(g: Gardener) {
    const k = key(g.tx, g.ty)
    const power = this.powers.get(k)
    if (!power) return
    this.powers.delete(k)
    if (power === 'pod') g.pods = Math.min(MAX_PODS, g.pods + 1)
    else if (power === 'bloom') g.range = Math.min(MAX_RANGE, g.range + 1)
    else g.speed = Math.min(MAX_SPEED, g.speed + SHOE_SPEED)
    const px = this.pixel(g)
    this.addScore(POWER_POINTS, px.x, px.y - 12)
    this.floaters.push({
      x: px.x,
      y: px.y - 20,
      text: power === 'pod' ? '+POD' : power === 'bloom' ? '+BLOOM' : '+SPEED',
      life: 50,
    })
    this.sound.play('extra')
  }

  private updatePods() {
    for (const pod of [...this.pods]) if (--pod.fuse <= 0) this.burst(pod)
  }

  /** A pod bursts into a cross of blooms, setting off any pod it reaches. */
  private burst(pod: Pod) {
    const i = this.pods.indexOf(pod)
    if (i < 0) return
    this.pods.splice(i, 1)
    const chain = { count: 0 }
    const triggered: Pod[] = []
    this.addBloom(pod.x, pod.y, chain)
    for (const d of DIRS) {
      for (let r = 1; r <= pod.range; r++) {
        const x = pod.x + d.dx * r
        const y = pod.y + d.dy * r
        const cell = this.grid[key(x, y)]
        if (cell === WALL) break
        if (cell === HEDGE) {
          this.grid[key(x, y)] = 0
          const hidden = this.hidden.get(key(x, y))
          if (hidden) {
            this.hidden.delete(key(x, y))
            this.powers.set(key(x, y), hidden)
          }
          this.addScore(HEDGE_POINTS, x * TILE + TILE / 2, HUD_H + y * TILE)
          this.leaves(x, y)
          this.addBloom(x, y, chain)
          break
        }
        this.addBloom(x, y, chain)
        const other = this.podAt(x, y)
        if (other) {
          triggered.push(other)
          break
        }
      }
    }
    this.sound.play('boom')
    for (const other of triggered) this.burst(other)
  }

  private addBloom(x: number, y: number, chain: { count: number }) {
    const old = this.blooms.find((b) => b.x === x && b.y === y)
    if (old) old.life = BLOOM_TICKS
    else this.blooms.push({ x, y, life: BLOOM_TICKS, chain })
  }

  private updateBlooms() {
    for (const b of this.blooms) {
      b.life--
      // Gardeners caught in a bloom.
      for (const g of this.gardeners) {
        if (g.down !== 0 || g.safe > 0) continue
        const t = this.here(g)
        if (t.x === b.x && t.y === b.y)
          this.catchGardener(g, 'TANGLED IN BLOOMS')
      }
      // Gnats caught in a bloom become butterflies.
      for (const gnat of this.gnats) {
        const t = this.here(gnat)
        if (t.x !== b.x || t.y !== b.y) continue
        gnat.speed = -1
        b.chain.count++
        const points = GNAT_POINTS * 2 ** Math.min(4, b.chain.count - 1)
        const px = this.pixel(gnat)
        this.addScore(points, px.x, px.y - 12)
        this.butterflies(px.x, px.y)
        this.sound.play('pop')
      }
      this.gnats = this.gnats.filter((g) => g.speed >= 0)
    }
    this.blooms = this.blooms.filter((b) => b.life > 0)
  }

  private updateGnats() {
    for (const gnat of this.gnats) {
      if (gnat.p === 0) {
        const can = (d: Dir) => {
          const x = gnat.tx + d.dx
          const y = gnat.ty + d.dy
          const cell = this.grid[key(x, y)]
          if (
            cell === WALL ||
            x <= 0 ||
            y <= 0 ||
            x >= COLS - 1 ||
            y >= ROWS - 1
          )
            return false
          if (cell === HEDGE && !gnat.ghost) return false
          return !this.podAt(x, y)
        }
        const options = DIRS.filter(can)
        if (options.length === 0) continue
        // Mostly keep going; sometimes wander off down a side path.
        if (!can(gnat.dir) || this.rng() < 0.25) {
          const turns = options.filter(
            (d) => d.dx !== -gnat.dir.dx || d.dy !== -gnat.dir.dy,
          )
          const pool = turns.length ? turns : options
          gnat.dir = pool[Math.floor(this.rng() * pool.length)]!
        }
        gnat.nx = gnat.tx + gnat.dir.dx
        gnat.ny = gnat.ty + gnat.dir.dy
      }
      gnat.p += gnat.speed / TILE
      if (gnat.p >= 1) {
        gnat.tx = gnat.nx
        gnat.ty = gnat.ny
        gnat.p = 0
      }
    }
  }

  private touchGnats() {
    for (const g of this.gardeners) {
      if (g.down !== 0 || g.safe > 0) continue
      const a = this.pixel(g)
      for (const gnat of this.gnats) {
        const b = this.pixel(gnat)
        if (Math.abs(a.x - b.x) < TOUCH && Math.abs(a.y - b.y) < TOUCH) {
          this.catchGardener(g, 'BUMPED A GNAT')
          break
        }
      }
    }
  }

  private catchGardener(g: Gardener, why: string) {
    const px = this.pixel(g)
    this.burst2(px.x, px.y, SEAT_COLORS[g.seat]!)
    this.sound.play('die')
    if (this.spares > 0) {
      this.spares--
      g.down = RESPAWN_TICKS
    } else g.down = -1
    // Their pods stay put; they still burst on time.
    g.p = 0
    g.nx = g.tx
    g.ny = g.ty
    const multi = this.gardeners.length > 1
    this.banner = {
      text: 'OOPS!',
      sub: `${multi ? `${g.seat + 1}P ` : ''}${why}`,
      ticks: 70,
    }
  }

  private windGust() {
    const speed = levelCurve(this.level, SEED_CURVES.gnatSpeed) * 1.3
    for (let i = 0; i < WIND_GNATS; i++) {
      const c = [
        { x: 7, y: 1 },
        { x: 7, y: ROWS - 2 },
        { x: 1, y: 6 },
      ][i]!
      this.gnats.push(this.newGnat(c.x, c.y, true, speed / 0.8))
    }
    this.sound.play('warn')
    this.banner = { text: 'WIND!', sub: 'MORE GNATS BLOW IN', ticks: 90 }
  }

  private roundClear() {
    const timeBonus = Math.max(0, Math.floor(this.timer / 60)) * 10
    const bonus = ROUND_POINTS * this.level + timeBonus
    this.addScore(bonus, W / 2, H / 2)
    this.clear = CLEAR_TICKS
    this.pods = []
    this.blooms = []
    this.sound.play('level')
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `BUTTERFLIES EVERYWHERE  +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
  }

  private leaves(x: number, y: number) {
    for (let i = 0; i < 6; i++)
      this.particles.push({
        x: x * TILE + TILE / 2,
        y: HUD_H + y * TILE + TILE / 2,
        vx: (this.rng() - 0.5) * 2,
        vy: -this.rng() * 1.5,
        life: 24,
        color: '#15803d',
      })
  }

  private butterflies(x: number, y: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        x,
        y,
        vx: (this.rng() - 0.5) * 1.6,
        vy: -0.4 - this.rng() * 1.2,
        life: 40,
        color: ['#f9a8d4', '#fde047', '#c4b5fd'][i % 3]!,
      })
  }

  private burst2(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 26,
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.02
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

  /** Tiles a pod at (x, y) would bloom over (hedges stop it). */
  private blastTiles(x: number, y: number, range: number): number[] {
    const out = [key(x, y)]
    for (const d of DIRS)
      for (let r = 1; r <= range; r++) {
        const tx = x + d.dx * r
        const ty = y + d.dy * r
        const cell = this.grid[key(tx, ty)]
        if (cell === WALL) break
        out.push(key(tx, ty))
        if (cell === HEDGE) break
      }
    return out
  }

  private dangerMap(): Set<number> {
    const danger = new Set<number>()
    for (const pod of this.pods)
      for (const k of this.blastTiles(pod.x, pod.y, pod.range)) danger.add(k)
    for (const b of this.blooms) danger.add(key(b.x, b.y))
    for (const gnat of this.gnats)
      for (const t of [
        { x: gnat.tx, y: gnat.ty },
        { x: gnat.nx, y: gnat.ny },
      ]) {
        danger.add(key(t.x, t.y))
        for (const d of DIRS) danger.add(key(t.x + d.dx, t.y + d.dy))
      }
    return danger
  }

  /** Breadth-first search from the gardener; returns the first step to a goal. */
  private route(
    g: Gardener,
    goal: (k: number) => boolean,
    avoid: Set<number> | null,
    maxSteps = 60,
  ): { dir: Dir; steps: number } | null {
    const start = key(g.tx, g.ty)
    const first = new Map<number, Dir | null>([[start, null]])
    const dist = new Map<number, number>([[start, 0]])
    const queue = [start]
    while (queue.length) {
      const k = queue.shift()!
      const steps = dist.get(k)!
      if (k !== start && goal(k)) return { dir: first.get(k)!, steps }
      if (steps >= maxSteps) continue
      const x = k % COLS
      const y = Math.floor(k / COLS)
      for (const d of DIRS) {
        const nx = x + d.dx
        const ny = y + d.dy
        const nk = key(nx, ny)
        if (first.has(nk) || !this.canWalk(g, nx, ny)) continue
        if (avoid?.has(nk) && !goal(nk)) continue
        first.set(nk, first.get(k) ?? d)
        dist.set(nk, steps + 1)
        queue.push(nk)
      }
    }
    return null
  }

  /**
   * Flees any tile a pod, bloom or gnat threatens; plants beside hedges and in
   * line with gnats when there is a safe way out; otherwise heads for the
   * nearest power-up or hedge.
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
    const g = this.gardeners[0]
    if (!g || g.down !== 0 || g.p !== 0) {
      // Mid-step: keep walking the same way.
      if (g && g.p !== 0)
        this.press(frame, { dx: g.nx - g.tx, dy: g.ny - g.ty })
      return frame
    }
    const danger = this.dangerMap()
    const here = key(g.tx, g.ty)
    // Never step onto a bloom or straight into a gnat while getting away.
    const bloomNow = new Set(this.blooms.map((b) => key(b.x, b.y)))
    for (const gnat of this.gnats) {
      bloomNow.add(key(gnat.tx, gnat.ty))
      bloomNow.add(key(gnat.nx, gnat.ny))
    }
    if (danger.has(here)) {
      const out = this.route(g, (k) => !danger.has(k), bloomNow, 12)
      if (out) this.press(frame, out.dir)
      return frame
    }
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine < g.pods && !this.podAt(g.tx, g.ty)) {
      const blast = this.blastTiles(g.tx, g.ty, g.range)
      const hitsHedge = blast.some((k) => this.grid[k] === HEDGE)
      const hitsGnat = this.gnats.some((gn) =>
        blast.includes(key(gn.tx, gn.ty)),
      )
      if (hitsHedge || hitsGnat) {
        const after = new Set([...danger, ...blast])
        const escape = this.route(g, (k) => !after.has(k), bloomNow, 6)
        if (escape) {
          held.a = true
          frame.pressed.a = true
          return frame
        }
      }
    }
    const target =
      this.route(g, (k) => this.powers.has(k) && !danger.has(k), danger, 30) ??
      this.route(
        g,
        (k) =>
          !danger.has(k) &&
          (DIRS.some((d) => this.grid[k + d.dx + d.dy * COLS] === HEDGE) ||
            this.gnats.some((gn) =>
              this.blastTiles(k % COLS, Math.floor(k / COLS), g.range).includes(
                key(gn.tx, gn.ty),
              ),
            )),
        danger,
        40,
      )
    if (target) this.press(frame, target.dir)
    return frame
  }

  private press(frame: InputFrame, d: Dir) {
    if (d.dy < 0) frame.held.up = true
    if (d.dy > 0) frame.held.down = true
    if (d.dx < 0) frame.held.left = true
    if (d.dx > 0) frame.held.right = true
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#14532d'
    g.fillRect(0, 0, W, H)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) this.renderCell(g, x, y)
    for (const [k, power] of this.powers) this.renderPower(g, k, power)
    for (const pod of this.pods) this.renderPod(g, pod)
    for (const b of this.blooms) this.renderBloom(g, b)
    for (const gnat of this.gnats) this.renderGnat(g, gnat)
    for (const gd of this.gardeners) this.renderGardener(g, gd)
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
        shadow: '#14532d',
      })
    this.renderHud(g)
  }

  private renderCell(g: CanvasRenderingContext2D, x: number, y: number) {
    const px = x * TILE
    const py = HUD_H + y * TILE
    const cell = this.grid[key(x, y)]
    if (cell === WALL) {
      g.fillStyle = '#78716c'
      g.fillRect(px, py, TILE, TILE)
      g.fillStyle = '#a8a29e'
      g.fillRect(px + 1, py + 1, TILE - 3, 3)
      g.fillStyle = '#57534e'
      g.fillRect(px, py + TILE - 2, TILE, 2)
      return
    }
    g.fillStyle = (x + y) % 2 ? '#4d7c0f' : '#3f6212'
    g.fillRect(px, py, TILE, TILE)
    if (cell === HEDGE) {
      g.fillStyle = '#166534'
      g.fillRect(px + 1, py + 2, TILE - 2, TILE - 3)
      g.fillStyle = '#22c55e'
      for (let i = 0; i < 4; i++)
        g.fillRect(
          px + 2 + ((i * 5 + y * 3) % 11),
          py + 3 + ((i * 7 + x) % 9),
          3,
          3,
        )
      g.fillStyle = '#052e16'
      g.fillRect(px + 1, py + TILE - 2, TILE - 2, 1)
    }
  }

  private renderPower(g: CanvasRenderingContext2D, k: number, power: Power) {
    const px = (k % COLS) * TILE
    const py = HUD_H + Math.floor(k / COLS) * TILE
    const flash = Math.floor(this.tick / 10) % 2
    g.fillStyle = flash ? '#fef3c7' : '#fde68a'
    g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
    g.fillStyle = '#78350f'
    g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6)
    if (power === 'pod') {
      g.fillStyle = '#a16207'
      g.fillRect(px + 6, py + 6, 5, 5)
      g.fillStyle = '#65a30d'
      g.fillRect(px + 7, py + 4, 3, 2)
    } else if (power === 'bloom') {
      g.fillStyle = '#f472b6'
      g.fillRect(px + 5, py + 7, 7, 3)
      g.fillRect(px + 7, py + 5, 3, 7)
      g.fillStyle = '#fde047'
      g.fillRect(px + 7, py + 7, 3, 3)
    } else {
      g.fillStyle = '#38bdf8'
      g.fillRect(px + 5, py + 5, 3, 6)
      g.fillRect(px + 5, py + 9, 7, 3)
    }
  }

  private renderPod(g: CanvasRenderingContext2D, pod: Pod) {
    const px = pod.x * TILE + TILE / 2
    const py = HUD_H + pod.y * TILE + TILE / 2
    const pulse =
      pod.fuse < 50
        ? Math.floor(this.tick / 4) % 2
        : Math.floor(this.tick / 12) % 2
    g.fillStyle = '#a16207'
    g.beginPath()
    g.ellipse(px, py + 1, 5 + pulse, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ca8a04'
    g.fillRect(px - 3, py - 2, 2, 2)
    g.fillStyle = pod.fuse < 50 && pulse ? '#f87171' : '#65a30d'
    g.fillRect(px - 1, py - 8, 2, 4)
    g.fillRect(px + 1, py - 8, 3, 2)
  }

  private renderBloom(g: CanvasRenderingContext2D, b: Bloom) {
    const px = b.x * TILE + TILE / 2
    const py = HUD_H + b.y * TILE + TILE / 2
    const grow = Math.min(1, (BLOOM_TICKS - b.life + 4) / 8)
    const colors = ['#f9a8d4', '#fde047', '#c4b5fd', '#fdba74']
    g.fillStyle = colors[(b.x + b.y) % 4]!
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.tick * 0.05
      g.beginPath()
      g.arc(
        px + Math.cos(a) * 4 * grow,
        py + Math.sin(a) * 4 * grow,
        3.2 * grow,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    g.fillStyle = '#fef9c3'
    g.fillRect(px - 2, py - 2, 4, 4)
  }

  private renderGnat(g: CanvasRenderingContext2D, gnat: Gnat) {
    const { x, y } = this.pixel(gnat)
    const flap = Math.floor(this.tick / 4) % 2
    g.globalAlpha = gnat.ghost ? 0.7 : 1
    g.fillStyle = 'rgba(226, 232, 240, 0.8)'
    g.fillRect(x - 6, y - 4 - flap, 4, 3)
    g.fillRect(x + 2, y - 4 - flap, 4, 3)
    g.fillStyle = gnat.ghost ? '#a78bfa' : '#57534e'
    g.fillRect(x - 3, y - 3, 6, 6)
    g.fillStyle = '#fef08a'
    g.fillRect(x - 2, y - 2, 2, 2)
    g.fillRect(x + 1, y - 2, 2, 2)
    g.fillStyle = '#1c1917'
    g.fillRect(x - 2, y + 1, 4, 1)
    g.globalAlpha = 1
  }

  private renderGardener(g: CanvasRenderingContext2D, gd: Gardener) {
    if (gd.down !== 0) return
    if (gd.safe > 0 && Math.floor(gd.safe / 5) % 2) return
    const { x, y } = this.pixel(gd)
    const step = gd.p > 0 ? Math.floor(this.tick / 6) % 2 : 0
    g.fillStyle = '#e2e8f0'
    g.fillRect(x - 5, y - 4, 10, 9)
    g.fillStyle = SEAT_COLORS[gd.seat]!
    g.fillRect(x - 6, y - 7, 12, 3)
    g.fillRect(x - 3, y - 9, 6, 2)
    g.fillStyle = '#0f172a'
    const look = gd.facing.dx
    g.fillRect(x - 3 + look, y - 2, 2, 2)
    g.fillRect(x + 1 + look, y - 2, 2, 2)
    g.fillStyle = '#475569'
    g.fillRect(x - 4, y + 5, 3, 2 + step)
    g.fillRect(x + 1, y + 5, 3, 3 - step)
    if (this.gardeners.length > 1)
      drawText(g, `${gd.seat + 1}`, x, y - 16, {
        align: 'center',
        color: SEAT_COLORS[gd.seat]!,
        shadow: '#052e16',
      })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#052e16'
    g.fillStyle = 'rgba(5, 46, 22, 0.92)'
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
    drawText(g, `ROUND ${this.level}`, W - 4, 10, {
      align: 'right',
      color: '#bef264',
    })
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    drawText(g, `TIME ${secs}`, 90, 3, {
      color: secs <= 20 && this.timer > 0 ? '#fca5a5' : '#e0f2fe',
    })
    drawText(g, `GNATS ${this.gnats.length}`, 90, 12, { color: '#d6d3d1' })
    for (let i = 0; i < Math.min(this.spares, 5); i++) {
      g.fillStyle = '#e2e8f0'
      g.fillRect(150 + i * 8, 13, 5, 5)
      g.fillStyle = '#38bdf8'
      g.fillRect(149 + i * 8, 12, 7, 2)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 92, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#052e16',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 112, {
          align: 'center',
          color: '#fef9c3',
          shadow: '#052e16',
        })
    }
  }
}

const seedBurst: ArcadeGameModule = {
  create: (options) => new SeedBurst(options),
}

export const create = seedBurst.create
export default seedBurst

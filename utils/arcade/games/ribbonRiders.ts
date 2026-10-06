// /utils/arcade/games/ribbonRiders.ts
//
// Ribbon Riders -- the Kind Robots Arcade's Tron light-cycles riff (conductor
// kr-arcade/t-009 game factory). Ride a light-bike that unrolls a glowing
// rainbow ribbon behind it. The rival riders unroll ribbons too; anyone who
// bumps into a ribbon or the arena wall is out of the round (and their ribbon
// fades away). Box the rivals in before you bump into something yourself.
//
// Each round brings one more rival (up to four), smarter steering and faster
// bikes, and the arena wall closes in a step at a time. Arrows steer; hold A
// for turbo, which runs down fast and refills slowly, so ration it.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const CELL = 4
const GRID = 72
const ARENA_Y = 24
const W = CELL * GRID
const H = ARENA_Y + CELL * GRID

const START_LIVES = 3
const READY_TICKS = 90
const DEATH_TICKS = 90
const ROUND_CLEAR_TICKS = 130
const FADE_TICKS = 40
const TURBO_MAX = 120
const MAX_MARGIN = 20
const FLOOD_LIMIT = 90
const EXTRA_EVERY = 20_000

const EMPTY = 0
const PLAYER = 1

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]
const RIVAL_COLORS = ['#22d3ee', '#a3e635', '#f472b6', '#fb923c']

export const RIBBON_CURVES = {
  rivals: { start: 1, step: 1, limit: 4 },
  /** Cells per tick for every bike. */
  speed: { start: 0.33, step: 0.025, limit: 0.5 },
  /** How hard rivals steer to cut the player off (0 = not at all). */
  cunning: { start: 0, step: 0.25, limit: 1 },
  /** Chance a rival takes a random free turn on any step. */
  wander: { start: 0.08, step: -0.015, limit: 0.02 },
  shrinkEvery: { start: 600, step: -40, limit: 300 },
} as const

type Dir = 0 | 1 | 2 | 3
/** Up, right, down, left. */
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

type Bike = {
  id: number
  x: number
  y: number
  dir: Dir
  want: Dir
  acc: number
  alive: boolean
  /** Ticks left on a crashed bike's fading ribbon. */
  fade: number
  color: string
  /** Cells laid so far (the player's ribbon cycles the rainbow by this). */
  laid: number
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

function turnLeft(d: Dir): Dir {
  return ((d + 3) % 4) as Dir
}
function turnRight(d: Dir): Dir {
  return ((d + 1) % 4) as Dir
}
function reverse(d: Dir): Dir {
  return ((d + 2) % 4) as Dir
}

class RibbonRiders implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  /** Who owns each cell: EMPTY, or a bike id (PLAYER is 1, rivals 2..5). */
  private cells = new Uint8Array(GRID * GRID)
  /** The order each cell was laid in, for the rainbow. */
  private order = new Uint16Array(GRID * GRID)
  private bikes: Bike[] = []
  private margin = 0
  private shrinkTimer = 0
  private turbo = TURBO_MAX
  private boosting = false
  private ready = 0
  private dead = 0
  private roundClear = 0
  private distance = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound(1)
  }

  private get player(): Bike {
    return this.bikes[0]!
  }

  // --- setup -------------------------------------------------------------------

  private startRound(round: number) {
    this.level = round
    this.cells.fill(EMPTY)
    this.order.fill(0)
    this.margin = 0
    this.shrinkTimer = Math.round(levelCurve(round, RIBBON_CURVES.shrinkEvery))
    this.turbo = TURBO_MAX
    const rivals = Math.round(levelCurve(round, RIBBON_CURVES.rivals))
    const mid = GRID / 2
    const spawns: Array<[number, number, Dir]> = [
      [mid, GRID - 8, 0],
      [mid, 7, 2],
      [7, mid, 1],
      [GRID - 8, mid, 3],
      [12, 12, 2],
    ]
    this.bikes = []
    for (let i = 0; i <= rivals; i++) {
      const [x, y, dir] = spawns[i]!
      this.bikes.push({
        id: i + 1,
        x,
        y,
        dir,
        want: dir,
        acc: 0,
        alive: true,
        fade: 0,
        color: i === 0 ? RAINBOW[0]! : RIVAL_COLORS[i - 1]!,
        laid: 0,
      })
      this.lay(this.bikes[i]!)
    }
    this.ready = READY_TICKS
    this.banner = {
      text: `ROUND ${round}`,
      sub: `${rivals} ${rivals === 1 ? 'RIVAL' : 'RIVALS'}  GET READY`,
      ticks: READY_TICKS,
    }
  }

  private idx(x: number, y: number): number {
    return y * GRID + x
  }

  private blocked(x: number, y: number, lookahead = false): boolean {
    // Riders who can see the wall flashing keep clear of the next line in.
    const m = this.margin + (lookahead && this.shrinkTimer < 90 ? 1 : 0)
    if (x < m || y < m || x >= GRID - m || y >= GRID - m) return true
    return this.cells[this.idx(x, y)] !== EMPTY
  }

  private lay(b: Bike) {
    const i = this.idx(b.x, b.y)
    this.cells[i] = b.id
    this.order[i] = b.laid++
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    this.updateFades()

    if (this.roundClear > 0) {
      if (--this.roundClear === 0) this.startRound(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.startRound(this.level)
        }
      }
      return
    }
    this.steer(controls)
    if (this.ready > 0) {
      this.ready--
      return
    }

    this.boosting = controls.held.a && this.turbo > 0
    if (this.boosting) this.turbo--
    else if (this.tick % 3 === 0)
      this.turbo = Math.min(TURBO_MAX, this.turbo + 1)

    if (--this.shrinkTimer <= 0) this.shrink()

    const speed = levelCurve(this.level, RIBBON_CURVES.speed)
    for (const b of this.bikes) {
      if (!b.alive) continue
      b.acc += b === this.player && this.boosting ? speed * 2 : speed
    }
    // Step the bikes a cell at a time, together, so head-on meetings are fair.
    while (this.bikes.some((b) => b.alive && b.acc >= 1)) {
      const moving = this.bikes.filter((b) => b.alive && b.acc >= 1)
      for (const b of moving) {
        b.acc -= 1
        if (b !== this.player) this.think(b)
        if (b.want !== reverse(b.dir)) b.dir = b.want
      }
      const targets = new Map<number, Bike[]>()
      for (const b of moving) {
        const nx = b.x + DX[b.dir]!
        const ny = b.y + DY[b.dir]!
        if (
          nx < 0 ||
          ny < 0 ||
          nx >= GRID ||
          ny >= GRID ||
          this.blocked(nx, ny)
        ) {
          this.crash(b)
          continue
        }
        const key = this.idx(nx, ny)
        targets.set(key, [...(targets.get(key) ?? []), b])
      }
      for (const [, group] of targets) {
        if (group.length > 1) {
          for (const b of group) this.crash(b)
          continue
        }
        const b = group[0]!
        b.x += DX[b.dir]!
        b.y += DY[b.dir]!
        this.lay(b)
        if (b === this.player) this.travelled()
      }
      if (!this.player.alive) break
    }
    this.checkRoundOver()
  }

  private steer(input: InputFrame) {
    const p = this.player
    let want: Dir | null = null
    if (input.pressed.up || input.held.up) want = 0
    if (input.pressed.right || input.held.right) want = 1
    if (input.pressed.down || input.held.down) want = 2
    if (input.pressed.left || input.held.left) want = 3
    if (want !== null && want !== reverse(p.dir)) p.want = want
  }

  private travelled() {
    this.distance++
    if (this.distance % 4 === 0) this.addScore(1)
  }

  private shrink() {
    this.shrinkTimer = Math.round(
      levelCurve(this.level, RIBBON_CURVES.shrinkEvery),
    )
    if (this.margin >= MAX_MARGIN) return
    this.margin++
    this.sound.play('warn')
    // A bike caught on the closing wall is out.
    for (const b of this.bikes) {
      if (!b.alive) continue
      const m = this.margin
      if (b.x < m || b.y < m || b.x >= GRID - m || b.y >= GRID - m) {
        this.crash(b)
      }
    }
  }

  private crash(b: Bike) {
    if (!b.alive) return
    b.alive = false
    b.fade = FADE_TICKS
    const px = b.x * CELL + CELL / 2
    const py = ARENA_Y + b.y * CELL + CELL / 2
    this.burst(px, py, 16, b === this.player ? '#fde68a' : b.color)
    this.sound.play('boom')
    if (b === this.player) {
      this.lives--
      this.dead = DEATH_TICKS
      this.sound.play('die')
      if (this.lives > 0) this.banner = { text: 'BUMPED!', ticks: 80 }
      return
    }
    if (this.player.alive) {
      this.addScore(500 * this.level, px, py - 6)
    }
  }

  private checkRoundOver() {
    if (!this.player.alive || this.dead > 0) return
    if (this.bikes.some((b) => b !== this.player && b.alive)) return
    this.addScore(1000 * this.level, W / 2, ARENA_Y + 100)
    this.roundClear = ROUND_CLEAR_TICKS
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `BONUS ${1000 * this.level}`,
      ticks: ROUND_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  private updateFades() {
    for (const b of this.bikes) {
      if (b.alive || b.fade <= 0) continue
      if (--b.fade === 0) {
        // The fallen rider's ribbon dissolves, opening the arena back up.
        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i] === b.id) this.cells[i] = EMPTY
        }
      }
    }
  }

  // --- rival steering --------------------------------------------------------------

  /** Free cells reachable from (x, y), counted up to FLOOD_LIMIT. */
  private room(x: number, y: number): number {
    if (this.blocked(x, y, true)) return 0
    const seen = new Set<number>([this.idx(x, y)])
    const queue = [x, y]
    let head = 0
    while (head < queue.length && seen.size < FLOOD_LIMIT) {
      const cx = queue[head++]!
      const cy = queue[head++]!
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d]!
        const ny = cy + DY[d]!
        const k = this.idx(nx, ny)
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue
        if (seen.has(k) || this.blocked(nx, ny, true)) continue
        seen.add(k)
        queue.push(nx, ny)
      }
    }
    return seen.size
  }

  private think(b: Bike) {
    const cunning = levelCurve(this.level, RIBBON_CURVES.cunning)
    const wander = levelCurve(this.level, RIBBON_CURVES.wander)
    const p = this.player
    // Aim a little ahead of the player to cut them off.
    const aimX = p.x + DX[p.dir]! * 8
    const aimY = p.y + DY[p.dir]! * 8
    const options: Dir[] = [b.dir, turnLeft(b.dir), turnRight(b.dir)]
    let best: Dir = b.dir
    let bestScore = -Infinity
    for (const d of options) {
      const nx = b.x + DX[d]!
      const ny = b.y + DY[d]!
      const space = this.room(nx, ny)
      if (space === 0) continue
      let score = Math.min(space, FLOOD_LIMIT) + (d === b.dir ? 4 : 0)
      if (p.alive && space > 30) {
        score -= cunning * Math.hypot(nx - aimX, ny - aimY) * 0.6
      }
      score += this.rng() * 3
      if (this.rng() < wander) score += 20
      if (score > bestScore) {
        bestScore = score
        best = d
      }
    }
    b.want = best
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 40 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA RIDER!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
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
    const p = this.player
    if (!p.alive) return frame
    // Ride like a careful rival: keep to the roomiest way forward.
    let best = p.dir
    let bestSpace = -1
    for (const d of [p.dir, turnLeft(p.dir), turnRight(p.dir)] as Dir[]) {
      const space =
        this.room(p.x + DX[d]!, p.y + DY[d]!) + (d === p.dir ? 3 : 0)
      if (space > bestSpace) {
        bestSpace = space
        best = d
      }
    }
    held[(['up', 'right', 'down', 'left'] as const)[best]] = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#070512'
    g.fillRect(0, 0, W, H)
    // Faint floor grid.
    g.fillStyle = '#1e1b4b'
    for (let i = 0; i <= GRID; i += 8) {
      g.fillRect(i * CELL, ARENA_Y, 1, GRID * CELL)
      g.fillRect(0, ARENA_Y + i * CELL, W, 1)
    }
    this.renderWalls(g)
    this.renderRibbons(g)
    for (const b of this.bikes) if (b.alive) this.renderBike(g, b)
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

  private renderWalls(g: CanvasRenderingContext2D) {
    const m = this.margin * CELL
    g.fillStyle = '#2e1065'
    g.fillRect(0, ARENA_Y, W, m)
    g.fillRect(0, ARENA_Y + GRID * CELL - m, W, m)
    g.fillRect(0, ARENA_Y, m, GRID * CELL)
    g.fillRect(W - m, ARENA_Y, m, GRID * CELL)
    const warn = this.shrinkTimer < 90 && Math.floor(this.tick / 8) % 2 === 0
    g.strokeStyle = warn ? '#fde047' : '#f472b6'
    g.lineWidth = 2
    g.strokeRect(m + 1, ARENA_Y + m + 1, W - 2 * m - 2, GRID * CELL - 2 * m - 2)
  }

  private renderRibbons(g: CanvasRenderingContext2D) {
    const fades = new Map<number, number>()
    for (const b of this.bikes) {
      if (!b.alive) fades.set(b.id, b.fade / FADE_TICKS)
    }
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = this.idx(x, y)
        const owner = this.cells[i]!
        if (owner === EMPTY) continue
        const bike = this.bikes[owner - 1]
        if (!bike) continue
        const fade = fades.get(owner)
        g.globalAlpha =
          fade === undefined
            ? 1
            : Math.max(0, fade) * (Math.floor(this.tick / 3) % 2 ? 1 : 0.6)
        g.fillStyle =
          owner === PLAYER
            ? RAINBOW[Math.floor(this.order[i]! / 4) % RAINBOW.length]!
            : bike.color
        g.fillRect(x * CELL, ARENA_Y + y * CELL, CELL, CELL)
      }
    }
    g.globalAlpha = 1
  }

  private renderBike(g: CanvasRenderingContext2D, b: Bike) {
    const cx = b.x * CELL + CELL / 2
    const cy = ARENA_Y + b.y * CELL + CELL / 2
    const glow = b === this.player && this.boosting ? 7 : 5
    g.fillStyle =
      b === this.player ? 'rgba(253, 230, 138, 0.35)' : `${b.color}55`
    g.fillRect(cx - glow, cy - glow, glow * 2, glow * 2)
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 3, cy - 3, 6, 6)
    g.fillStyle = b === this.player ? '#facc15' : b.color
    g.fillRect(cx - 2, cy - 2, 4, 4)
    // A nose pointing the way it rides.
    g.fillStyle = '#ffffff'
    g.fillRect(cx + DX[b.dir]! * 4 - 1, cy + DY[b.dir]! * 4 - 1, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 5, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 3, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `ROUND ${this.level}`, W - 6, 13, {
      align: 'right',
      color: '#a5f3fc',
    })
    // Turbo meter and spare riders.
    drawText(g, 'TURBO', 96, 4, { color: '#fde68a' })
    g.fillStyle = '#1f2937'
    g.fillRect(96, 13, 60, 5)
    g.fillStyle = this.boosting ? '#fde047' : '#22d3ee'
    g.fillRect(96, 13, (60 * this.turbo) / TURBO_MAX, 5)
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = RAINBOW[i * 2]!
      g.fillRect(166 + i * 8, 13, 5, 5)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, ARENA_Y + 120, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, ARENA_Y + 140, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const ribbonRiders: ArcadeGameModule = {
  create: (options) => new RibbonRiders(options),
}

export const create = ribbonRiders.create
export default ribbonRiders

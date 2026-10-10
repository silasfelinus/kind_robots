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
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  dropShadow,
  cachedLayer,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  vignette,
  type PixelSprite,
  type Ramp,
} from '../snes'
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

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A five-step ramp around one ribbon colour: inked shadows, white-hot highlights. */
function rampOf(hex: string): Ramp {
  return [
    mix(hex, INK, 0.7),
    mix(hex, INK, 0.38),
    hex,
    mix(hex, '#ffffff', 0.45),
    mix(hex, '#ffffff', 0.82),
  ]
}

const RAINBOW_RAMPS = RAINBOW.map(rampOf)
const RIVAL_RAMPS = RIVAL_COLORS.map(rampOf)

/** Each round's floor: tile faces from a dark ramp, grid light from a bright one. */
const FLOOR_THEMES: readonly { face: Ramp; line: Ramp }[] = [
  { face: RAMPS.night, line: RAMPS.teal },
  {
    face: ['#031119', '#06222e', '#0a3242', '#104a5e', '#1d6f8a'],
    line: RAMPS.pink,
  },
  {
    face: ['#10051a', '#200a30', '#321148', '#46195f', '#62287f'],
    line: RAMPS.gold,
  },
]
const TILE = 32

/** A light-bike seen from above, nose up: headlight, two treaded tyres, the rider's helmet. */
const BIKE_UP = [
  '..ww..',
  '.kTTk.',
  '.kttk.',
  '.LBBd.',
  'LBHhBd',
  'LBhhBd',
  'LBBBBd',
  '.LBBd.',
  '.kTTk.',
  '.kttk.',
  '..ee..',
]
/** The second frame: the treads roll on and the tail light blinks. */
const BIKE_UP_ROLL = BIKE_UP.map((row) =>
  row.replace(/[Tt]/g, (c) => (c === 'T' ? 't' : 'T')).replace(/e/g, 'f'),
)

/** Rows to columns: the nose-up art becomes nose-left, still lit from the top left. */
function transpose(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  return Array.from({ length: w }, (_, x) =>
    rows.map((r) => r[x] ?? '.').join(''),
  )
}

type RiderArt = {
  ramp: Ramp
  /** Nose up (flip for down), two frames. */
  up: readonly PixelSprite[]
  /** Nose left (flip for right), two frames. */
  left: readonly PixelSprite[]
}

/** The player rides gold; each rival rides its ribbon's colour. Index is bike id - 1. */
const RIDERS: readonly RiderArt[] = [RAMPS.gold, ...RIVAL_RAMPS].map((ramp) => {
  const palette = {
    w: '#ffffff',
    k: RAMPS.steel[0],
    T: RAMPS.steel[3],
    t: RAMPS.steel[1],
    L: ramp[3],
    B: ramp[2],
    d: ramp[1],
    H: RAMPS.sky[4],
    h: RAMPS.night[2],
    e: RAMPS.ember[3],
    f: RAMPS.ember[1],
  }
  const frames = [BIKE_UP, BIKE_UP_ROLL]
  return {
    ramp,
    up: frames.map((rows) => pixelSprite(rows, palette)),
    left: frames.map((rows) => pixelSprite(transpose(rows), palette)),
  }
})

/**
 * Rects queued by fill colour and drawn as one path each, so a few thousand ribbon pixels
 * cost a handful of fills a frame.
 */
class RectBatch {
  private queues = new Map<string, number[]>()

  add(colour: string, x: number, y: number, w: number, h: number) {
    let q = this.queues.get(colour)
    if (!q) {
      q = []
      this.queues.set(colour, q)
    }
    q.push(x, y, w, h)
  }

  flush(g: CanvasRenderingContext2D) {
    for (const [colour, q] of this.queues) {
      if (!q.length) continue
      g.fillStyle = colour
      g.beginPath()
      for (let i = 0; i < q.length; i += 4) {
        g.rect(q[i]!, q[i + 1]!, q[i + 2]!, q[i + 3]!)
      }
      g.fill()
      q.length = 0
    }
  }
}

/** One batch per shading pass, drawn in this order: outline, glow, body, lit, shade, core. */
const RIBBON_PASSES = {
  outline: new RectBatch(),
  glow: new RectBatch(),
  body: new RectBatch(),
  lit: new RectBatch(),
  shade: new RectBatch(),
  core: new RectBatch(),
}

/** A fixed per-cell value in 0..1, for a fading ribbon's dissolve. */
function cellNoise(i: number): number {
  return ((Math.imul(i + 1, 2654435761) >>> 8) % 1000) / 1000
}

type Ring = { x: number; y: number; life: number; colour: string }
const RING_TICKS = 22

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
  /** Cosmetic only: sparkles and shock rings, on their own rng so play stays seeded. */
  private fx = new Sparkles()
  private fxRng = backdropRng(47)
  private rings: Ring[] = []

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
    const ramp = RIDERS[b.id - 1]!.ramp
    this.fx.burst(px, py, this.fxRng, {
      count: 12,
      colours: [ramp[3], ramp[4], RAMPS.gold[4]],
      speed: 2,
    })
    this.rings.push({ x: px, y: py, life: RING_TICKS, colour: ramp[3] })
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
    const p = this.player
    for (let i = 0; i < 3; i++) {
      this.fx.burst(p.x * CELL + 2, ARENA_Y + p.y * CELL + 2, this.fxRng, {
        count: 10,
        speed: 1.4 + i * 0.6,
      })
    }
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
      this.fx.burst(184, 11, this.fxRng, { count: 12 })
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
    this.fx.update()
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
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
    this.renderFloor(g)
    this.renderWalls(g)
    this.renderRibbons(g)
    this.renderWarning(g)
    for (const b of this.bikes) if (b.alive) this.renderBike(g, b)
    // Crash debris: hot additive chips with white cores.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      if (p.life > 14) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 1, y - 1, 1, 1)
      }
    }
    g.restore()
    for (const r of this.rings) this.renderRing(g, r)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, Math.round(f.x), Math.round(f.y), {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderFloor(g: CanvasRenderingContext2D) {
    const theme = (this.level - 1) % FLOOR_THEMES.length
    const { face, line } = FLOOR_THEMES[theme]!
    // Bevelled grid tiles over glowing grout, brighter toward the arena's heart; painted once
    // per theme.
    cachedLayer(g, `ribbon-riders-floor-${theme}`, W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        ARENA_Y,
        [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
        2,
      )
      bandedGradient(
        k,
        0,
        ARENA_Y,
        W,
        GRID * CELL,
        [line[1], line[0], line[1], line[0]],
        8,
      )
      const tiles = (GRID * CELL) / TILE
      const mid = (tiles - 1) / 2
      for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
          const x = tx * TILE
          const y = ARENA_Y + ty * TILE
          // Square rings of light stepping up toward the centre: an HDMA glow in tiles.
          const ring = Math.max(Math.abs(tx - mid), Math.abs(ty - mid)) / mid
          const lift = Math.round((1 - ring) * 4) / 4
          bandedGradient(
            k,
            x + 1,
            y + 1,
            TILE - 2,
            TILE - 2,
            [
              mix(face[2], face[3], lift),
              mix(face[1], face[2], lift),
              mix(face[0], face[1], lift),
            ],
            3,
          )
          k.fillStyle = mix(face[3], face[4], lift)
          k.fillRect(x + 1, y + 1, TILE - 2, 1)
          k.fillRect(x + 1, y + 1, 1, TILE - 2)
          k.fillStyle = face[0]
          k.fillRect(x + 1, y + TILE - 2, TILE - 2, 1)
          k.fillRect(x + TILE - 2, y + 1, 1, TILE - 2)
          // The ride grid, a faint dot at every fourth cell corner.
          k.fillStyle = rgba(line[3], 0.18 + lift * 0.12)
          for (let j = 1; j < TILE / CELL; j += 2) {
            for (let i = 1; i < TILE / CELL; i += 2) {
              k.fillRect(x + i * CELL, y + j * CELL, 1, 1)
            }
          }
        }
      }
      // Grout lines lit down their middle, and a glowing stud where four tiles meet.
      k.fillStyle = rgba(line[3], 0.28)
      for (let i = 0; i <= tiles; i++) {
        k.fillRect(i * TILE - 1, ARENA_Y, 1, GRID * CELL)
        k.fillRect(0, ARENA_Y + i * TILE - 1, W, 1)
      }
      for (let ty = 1; ty < tiles; ty++) {
        for (let tx = 1; tx < tiles; tx++) {
          const x = tx * TILE - 1
          const y = ARENA_Y + ty * TILE - 1
          glow(k, x, y, 6, line[3], 0.3)
          k.fillStyle = line[3]
          k.fillRect(x - 1, y, 3, 1)
          k.fillRect(x, y - 1, 1, 3)
        }
      }
    })
  }

  /** The closing wall: a striped hazard band outside the arena, glowing along its inner edge. */
  private renderWalls(g: CanvasRenderingContext2D) {
    const m = this.margin * CELL
    const top = ARENA_Y
    const size = GRID * CELL
    const x0 = m
    const y0 = top + m
    const x1 = W - m
    const y1 = top + size - m
    const warn = this.shrinkTimer < 90 && Math.floor(this.tick / 8) % 2 === 0
    if (m > 0) {
      g.save()
      g.beginPath()
      g.rect(0, top, W, size)
      g.rect(x0, y0, x1 - x0, y1 - y0)
      g.clip('evenodd')
      g.fillStyle = warn ? RAMPS.ember[0] : mix(RAMPS.purple[0], INK, 0.4)
      g.fillRect(0, top, W, size)
      // Warning stripes crawling along the band.
      g.fillStyle = warn ? RAMPS.gold[2] : RAMPS.pink[0]
      g.beginPath()
      const shift = Math.floor(this.tick / 3) % 16
      for (let s = shift - 16; s < W + size; s += 16) {
        g.moveTo(s, top)
        g.lineTo(s + 8, top)
        g.lineTo(s + 8 - size, top + size)
        g.lineTo(s - size, top + size)
        g.closePath()
      }
      g.fill()
      // Light spilling off the wall's inner face.
      const reach = Math.min(m, 14)
      const hot = warn ? RAMPS.gold[3] : RAMPS.pink[2]
      g.globalCompositeOperation = 'lighter'
      const edges: [number, number, number, number, number, number][] = [
        [x0 - reach, y0, x0, y0, 0, 0],
        [x1, y0, x1 + reach, y0, 1, 0],
        [x0, y0 - reach, x0, y0, 0, 1],
        [x0, y1, x0, y1 + reach, 1, 1],
      ]
      for (const [ax, ay, bx, by, flip, vertical] of edges) {
        const grad = g.createLinearGradient(ax, ay, bx, by)
        grad.addColorStop(flip ? 1 : 0, rgba(hot, 0))
        grad.addColorStop(flip ? 0 : 1, rgba(hot, 0.55))
        g.fillStyle = grad
        if (vertical) g.fillRect(x0, ay, x1 - x0, reach)
        else g.fillRect(ax, y0, reach, y1 - y0)
      }
      g.restore()
    }
    this.renderRim(g, x0, y0, x1, y1, warn)
  }

  /** A steel rim, lit top-left, with a running chase of lights and a glowing inner edge. */
  private renderRim(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    warn: boolean,
  ) {
    const { line } = FLOOR_THEMES[(this.level - 1) % FLOOR_THEMES.length]!
    const frame = (inset: number, lit: string, dark: string) => {
      const ax = x0 + inset
      const ay = y0 + inset
      const w = x1 - x0 - inset * 2
      const h = y1 - y0 - inset * 2
      g.fillStyle = dark
      g.fillRect(ax, ay + h - 1, w, 1)
      g.fillRect(ax + w - 1, ay, 1, h)
      g.fillStyle = lit
      g.fillRect(ax, ay, w, 1)
      g.fillRect(ax, ay, 1, h)
    }
    frame(-3, INK, INK)
    frame(-2, RAMPS.steel[4], RAMPS.steel[1])
    frame(-1, RAMPS.steel[3], RAMPS.steel[1])
    frame(0, RAMPS.steel[2], RAMPS.steel[0])
    const edge = warn ? RAMPS.gold[3] : line[3]
    frame(1, edge, edge)
    // Chase lights riveted along the rim.
    const lights: [number, number][] = []
    for (let x = x0 + 4; x < x1 - 4; x += 12) lights.push([x, y0 - 2])
    for (let y = y0 + 4; y < y1 - 4; y += 12) lights.push([x1 - 2, y])
    for (let x = x1 - 8; x > x0 + 4; x -= 12) lights.push([x, y1 - 2])
    for (let y = y1 - 8; y > y0 + 4; y -= 12) lights.push([x0 - 2, y])
    const chase = Math.floor(this.tick / 3)
    lights.forEach(([x, y], i) => {
      const on = warn || (i + chase) % 6 === 0
      const near = (i + chase) % 6 === 1
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 4, 4)
      g.fillStyle = on
        ? warn
          ? RAMPS.gold[4]
          : line[4]
        : near
          ? line[2]
          : line[0]
      g.fillRect(x, y, 2, 2)
      if (on) glow(g, x + 1, y + 1, 6, warn ? RAMPS.gold[3] : line[3], 0.6)
    })
  }

  /** The ring of cells the wall takes next, flashing while the wall winds up. */
  private renderWarning(g: CanvasRenderingContext2D) {
    if (this.shrinkTimer >= 90 || this.margin >= MAX_MARGIN) return
    if (this.over || this.dead > 0 || this.roundClear > 0) return
    const m = this.margin * CELL
    const flash = Math.floor(this.tick / 8) % 2 === 0
    g.fillStyle = rgba(flash ? RAMPS.gold[3] : RAMPS.ember[2], 0.4)
    const top = ARENA_Y + m
    const span = (GRID - this.margin * 2) * CELL
    g.fillRect(m, top, span, CELL)
    g.fillRect(m, top + span - CELL, span, CELL)
    g.fillRect(m, top + CELL, CELL, span - CELL * 2)
    g.fillRect(m + span - CELL, top + CELL, CELL, span - CELL * 2)
  }

  /**
   * Ribbons as glowing tubes: an ink edge, an additive halo, then each cell shaded lit-side up
   * with a white-hot core running along the way the ribbon was laid.
   */
  private renderRibbons(g: CanvasRenderingContext2D) {
    for (const b of this.bikes) {
      let alpha = 1
      let dissolve = 1
      if (!b.alive) {
        if (b.fade <= 0) continue
        dissolve = b.fade / FADE_TICKS
        alpha = dissolve * (Math.floor(this.tick / 3) % 2 ? 1 : 0.6)
      }
      this.renderRibbon(g, b, alpha, dissolve)
    }
  }

  private renderRibbon(
    g: CanvasRenderingContext2D,
    b: Bike,
    alpha: number,
    dissolve: number,
  ) {
    const P = RIBBON_PASSES
    const id = b.id
    const ramps = id === PLAYER ? RAINBOW_RAMPS : [RIVAL_RAMPS[id - 2]!]
    const lo = this.margin
    const hi = GRID - this.margin
    let any = false
    for (let y = lo; y < hi; y++) {
      for (let x = lo; x < hi; x++) {
        const i = this.idx(x, y)
        if (this.cells[i] !== id) continue
        if (dissolve < 1 && cellNoise(i) > dissolve) continue
        any = true
        const o = this.order[i]!
        const ramp =
          ramps[id === PLAYER ? Math.floor(o / 4) % ramps.length : 0]!
        const linked = (j: number) =>
          this.cells[j] === id && Math.abs(this.order[j]! - o) === 1
        const up = y > 0 && linked(i - GRID)
        const down = y < GRID - 1 && linked(i + GRID)
        const left = x > 0 && linked(i - 1)
        const right = x < GRID - 1 && linked(i + 1)
        const px = x * CELL
        const py = ARENA_Y + y * CELL
        P.outline.add(INK, px - 1, py - 1, CELL + 2, CELL + 3)
        P.glow.add(ramp[2], px - 3, py - 3, CELL + 6, CELL + 6)
        P.body.add(ramp[2], px, py, CELL, CELL)
        if (!up) P.lit.add(ramp[3], px, py, CELL, 1)
        if (!left) P.lit.add(ramp[3], px, py, 1, CELL)
        if (!down) P.shade.add(ramp[1], px, py + CELL - 1, CELL, 1)
        if (!right) P.shade.add(ramp[1], px + CELL - 1, py, 1, CELL)
        P.core.add(ramp[4], px + 1, py + 1, 1, 1)
        if (left) P.core.add(ramp[4], px, py + 1, 1, 1)
        if (right) P.core.add(ramp[4], px + 2, py + 1, 2, 1)
        if (up) P.core.add(ramp[4], px + 1, py, 1, 1)
        if (down) P.core.add(ramp[4], px + 1, py + 2, 1, 2)
      }
    }
    if (!any) return
    g.save()
    g.globalAlpha = alpha
    P.outline.flush(g)
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = alpha * 0.16
    P.glow.flush(g)
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = alpha
    P.body.flush(g)
    P.lit.flush(g)
    P.shade.flush(g)
    P.core.flush(g)
    g.restore()
  }

  private renderBike(g: CanvasRenderingContext2D, b: Bike) {
    const art = RIDERS[b.id - 1]!
    const cx = b.x * CELL + CELL / 2
    const cy = ARENA_Y + b.y * CELL + CELL / 2
    const boost = b === this.player && this.boosting
    const vertical = b.dir === 0 || b.dir === 2
    // The sprite sits a little behind the head cell, so the nose leads.
    const sx = cx - DX[b.dir]! * 2
    const sy = cy - DY[b.dir]! * 2
    dropShadow(g, sx + 1, sy + 3, vertical ? 4 : 6, vertical ? 6 : 3, 0.45)
    glow(g, cx, cy, boost ? 16 : 10, art.ramp[3], boost ? 0.7 : 0.45)
    if (boost) {
      // Afterburner: a flickering flame off the tail.
      const tx = sx - DX[b.dir]! * 7
      const ty = sy - DY[b.dir]! * 7
      const flick = this.tick % 4 < 2 ? 1 : 0
      glow(g, tx, ty, 7 + flick * 2, RAMPS.ember[3], 0.8)
      g.fillStyle = RAMPS.ember[3]
      g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(tx - DX[b.dir]! * (1 + flick)),
        Math.round(ty - DY[b.dir]! * (1 + flick)),
        1,
        1,
      )
    }
    const frame = this.ready > 0 ? 0 : Math.floor(this.tick / 4) % 2
    const sprite = (vertical ? art.up : art.left)[frame]!
    drawSprite(g, sprite, sx, sy, {
      flipX: b.dir === 1,
      flipY: b.dir === 2,
    })
  }

  private renderRing(g: CanvasRenderingContext2D, r: Ring) {
    const t = 1 - r.life / RING_TICKS
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 1 - t
    g.strokeStyle = r.colour
    g.lineWidth = 2
    g.beginPath()
    g.arc(r.x, r.y, 3 + t * 16, 0, Math.PI * 2)
    g.stroke()
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score.
    hudPanel(g, 2, 2, 76, 19)
    drawText(g, String(this.score).padStart(6, '0'), 6, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Turbo: runs down while A is held, refills slowly.
    hudPanel(g, 81, 2, 76, 19, RAMPS.sky)
    const fill = this.turbo / TURBO_MAX
    drawText(g, 'TURBO', 87, 4, {
      color: this.boosting ? RAMPS.gold[4] : RAMPS.sky[4],
      outline: INK,
    })
    if (this.boosting) {
      glow(g, 87 + 64 * fill, 15, 8, RAMPS.gold[3], 0.6)
    }
    gauge(
      g,
      87,
      13,
      64,
      4,
      fill,
      this.boosting ? RAMPS.gold : fill < 0.25 ? RAMPS.ember : RAMPS.teal,
    )
    // Spare riders.
    hudPanel(g, 160, 2, 46, 19)
    const spare = RIDERS[0]!.up[0]!
    for (let i = 0; i < 4; i++) {
      const x = 167 + i * 10
      if (i < Math.min(this.lives - 1, 4)) {
        drawSprite(g, spare, x, 11)
      } else {
        g.fillStyle = INK
        g.fillRect(x - 2, 9, 4, 4)
        g.fillStyle = RAMPS.purple[1]
        g.fillRect(x - 1, 10, 2, 2)
      }
    }
    // High score and round.
    hudPanel(g, 209, 2, 77, 19)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, 281, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `ROUND ${this.level}`, 281, 12, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, ARENA_Y + 120, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, ARENA_Y + 140, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
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

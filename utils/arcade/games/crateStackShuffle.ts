// /utils/arcade/games/crateStackShuffle.ts
//
// Crate Stack Shuffle -- the Kind Robots Arcade's falling-block riff (conductor kr-arcade/t-009
// game factory, approved pitch 2026-10-12-kr-cabinet-robot-tetris-crates). Crates of seven odd
// shapes tumble into a warehouse bay; Stacker, the little warehouse robot, turns and drops them to
// finish full rows, and a finished row ships out.
//
// Left and right slide a crate, A or Up turns it, Down nudges it faster, B drops it all the way.
// Every ten rows shipped is a new level and the crates fall faster. From level 3 some crates are
// STICKY (tape-wrapped: a full row with tape only unsticks the first time, then ships on the next
// fill), and from level 5 some are HEAVY (they plummet at double speed). The bay is topped out when
// a new crate has no room to appear.
//
// The rules (shapes, turning, locking, row shipping, scoring, the pilot) are exported plain
// functions so the engine test can pin each one on a staged bay.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
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
export const COLS = 10
export const ROWS = 20
export const CELL = 12
export const WELL_X = 16
export const WELL_Y = 24

export const ROWS_PER_LEVEL = 10
export const STICKY_FROM = 3
export const HEAVY_FROM = 5
export const LOCK_DELAY = 24
export const SPAWN_DELAY = 18
export const SHIP_TICKS = 24
export const DAS_DELAY = 11
export const DAS_REPEAT = 4
/** Points for shipping 1..4 rows at once, times the level. */
export const SHIP_POINTS = [0, 100, 300, 500, 800] as const
export const UNSTICK_POINTS = 50

export const CRATE_CURVES = {
  /** Ticks per row of fall. */
  fall: { start: 46, step: -4, limit: 3 },
  /** Chance a new crate is wrapped in sticky tape. */
  sticky: { start: 0.15, step: 0.05, limit: 0.3 },
  /** Chance a new crate is heavy. */
  heavy: { start: 0.1, step: 0.04, limit: 0.2 },
} as const

export type CrateKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export const KINDS: readonly CrateKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

/** Cells of each crate in its spawn turn, inside an n x n box. */
export const SHAPES: Record<
  CrateKind,
  { size: number; cells: ReadonlyArray<readonly [number, number]> }
> = {
  I: {
    size: 4,
    cells: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  },
  O: {
    size: 2,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  T: {
    size: 3,
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  S: {
    size: 3,
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
  },
  Z: {
    size: 3,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
  J: {
    size: 3,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  L: {
    size: 3,
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
}

export const CRATE_RAMPS: Record<CrateKind, Ramp> = {
  I: RAMPS.sky,
  O: RAMPS.gold,
  T: RAMPS.purple,
  S: RAMPS.leaf,
  Z: RAMPS.ember,
  J: RAMPS.teal,
  L: RAMPS.pink,
}

/** One settled crate cell; `sticky` cells still carry their tape. */
export type Cell = { kind: CrateKind; sticky: boolean }
export type Bay = Array<Array<Cell | null>>

export type Piece = {
  kind: CrateKind
  /** Quarter turns clockwise, 0..3. */
  turn: number
  x: number
  y: number
  sticky: boolean
  heavy: boolean
}

export function emptyBay(): Bay {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  )
}

/** The cells a crate covers at a given turn, relative to its box. */
export function turnedCells(
  kind: CrateKind,
  turn: number,
): Array<[number, number]> {
  const { size, cells } = SHAPES[kind]
  let out = cells.map(([x, y]) => [x, y] as [number, number])
  for (let t = 0; t < ((turn % 4) + 4) % 4; t++) {
    out = out.map(([x, y]) => [size - 1 - y, x] as [number, number])
  }
  return out
}

export function pieceCells(p: Piece): Array<[number, number]> {
  return turnedCells(p.kind, p.turn).map(([x, y]) => [p.x + x, p.y + y])
}

export function fits(bay: Bay, p: Piece): boolean {
  for (const [x, y] of pieceCells(p)) {
    if (x < 0 || x >= COLS || y >= ROWS) return false
    if (y >= 0 && bay[y]![x]) return false
  }
  return true
}

/** Turn a crate, nudging it a little sideways when the plain turn would hit something. */
export function rotate(bay: Bay, p: Piece, dir: 1 | -1): Piece | null {
  const turned = { ...p, turn: (p.turn + dir + 4) % 4 }
  for (const kick of [0, -1, 1, -2, 2]) {
    const tried = { ...turned, x: turned.x + kick }
    if (fits(bay, tried)) return tried
  }
  return null
}

export function spawnPiece(
  kind: CrateKind,
  sticky = false,
  heavy = false,
): Piece {
  const { size } = SHAPES[kind]
  return {
    kind,
    turn: 0,
    x: Math.floor((COLS - size) / 2),
    y: kind === 'I' ? -1 : 0,
    sticky,
    heavy,
  }
}

/** Where a crate stops if dropped straight down. */
export function dropped(bay: Bay, p: Piece): Piece {
  let q = p
  while (fits(bay, { ...q, y: q.y + 1 })) q = { ...q, y: q.y + 1 }
  return q
}

/** Settle a crate into the bay (every cell of a sticky crate carries tape). */
export function lock(bay: Bay, p: Piece): void {
  for (const [x, y] of pieceCells(p)) {
    if (y >= 0 && y < ROWS) bay[y]![x] = { kind: p.kind, sticky: p.sticky }
  }
}

export function fullRows(bay: Bay): number[] {
  const out: number[] = []
  for (let y = 0; y < ROWS; y++) {
    if (bay[y]!.every((c) => c !== null)) out.push(y)
  }
  return out
}

/**
 * Settle full rows: a row with tape only loses its tape (it ships next time it is full); the
 * plain full rows ship and everything above falls. Returns what happened.
 */
export function shipRows(bay: Bay): { shipped: number[]; unstuck: number[] } {
  const shipped: number[] = []
  const unstuck: number[] = []
  for (const y of fullRows(bay)) {
    if (bay[y]!.some((c) => c?.sticky)) {
      for (const c of bay[y]!) if (c) c.sticky = false
      unstuck.push(y)
    } else shipped.push(y)
  }
  if (shipped.length) {
    const keep = bay.filter((_, y) => !shipped.includes(y))
    const fresh = Array.from({ length: shipped.length }, () =>
      Array.from({ length: COLS }, () => null as Cell | null),
    )
    bay.splice(0, ROWS, ...fresh, ...keep)
  }
  return { shipped, unstuck }
}

export function shipScore(rows: number, level: number): number {
  return (SHIP_POINTS[Math.min(4, rows)] ?? 0) * level
}

export function fallTicks(level: number, heavy: boolean): number {
  const t = Math.round(levelCurve(level, CRATE_CURVES.fall))
  return heavy ? Math.max(2, Math.floor(t / 2)) : t
}

/** A shuffled bag of the seven kinds, so no shape starves. */
export function newBag(rng: () => number): CrateKind[] {
  const bag = [...KINDS]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
  }
  return bag
}

// --- the pilot ----------------------------------------------------------------------------------

function stackShape(bay: Bay): { holes: number; height: number; bump: number } {
  let holes = 0
  let height = 0
  let bump = 0
  let last = -1
  for (let x = 0; x < COLS; x++) {
    let top = ROWS
    for (let y = 0; y < ROWS; y++) {
      if (bay[y]![x]) {
        top = y
        break
      }
    }
    for (let y = top + 1; y < ROWS; y++) if (!bay[y]![x]) holes++
    height += ROWS - top
    if (last >= 0) bump += Math.abs(top - last)
    last = top
  }
  return { holes, height, bump }
}

/** The best place to drop this crate by a simple tidy-stack score; used by the attract pilot. */
export function bestPlacement(
  bay: Bay,
  p: Piece,
): { turn: number; x: number } | null {
  let best: { turn: number; x: number; score: number } | null = null
  for (let turn = 0; turn < 4; turn++) {
    for (let x = -3; x < COLS; x++) {
      const start = { ...p, turn, x }
      if (!fits(bay, start)) continue
      const end = dropped(bay, start)
      const trial = bay.map((row) => row.map((c) => (c ? { ...c } : null)))
      lock(trial, end)
      const rows = fullRows(trial).length
      const { holes, height, bump } = stackShape(trial)
      const score = rows * 8 - holes * 6 - height * 0.5 - bump * 0.6
      if (!best || score > best.score) best = { turn, x, score }
    }
  }
  return best ? { turn: best.turn, x: best.x } : null
}

// --- art ----------------------------------------------------------------------------------------

const STACKER_PALETTE = {
  B: RAMPS.steel[2],
  W: RAMPS.cream[3],
  E: RAMPS.night[1],
  G: RAMPS.teal[2],
  Y: RAMPS.gold[3],
}

const STACKER_A = pixelSprite(
  [
    '..BBBBBB..',
    '.BWWWWWWB.',
    '.BWEWWEWB.',
    '.BWWWWWWB.',
    '..BBBBBB..',
    '.GGGGGGGG.',
    'GGYYGGYYGG',
    'GG.GGGG.GG',
    '..GG..GG..',
    '..BB..BB..',
  ],
  STACKER_PALETTE,
)

const STACKER_B = pixelSprite(
  [
    '..BBBBBB..',
    '.BWWWWWWB.',
    '.BWEWWEWB.',
    '.BWWWWWWB.',
    '..BBBBBB..',
    '.GGGGGGGG.',
    'GGYYGGYYGG',
    'G..GGGG..G',
    '..GG..GG..',
    '.BB....BB.',
  ],
  STACKER_PALETTE,
)

function drawCrate(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: CrateKind,
  options: { sticky?: boolean; heavy?: boolean } = {},
) {
  const ramp = CRATE_RAMPS[kind]
  bevel(g, x + 1, y + 1, CELL - 2, CELL - 2, ramp, { depth: 2 })
  g.fillStyle = ramp[1]
  g.fillRect(x + 3, y + CELL / 2 - 1, CELL - 6, 1)
  if (options.sticky) {
    g.fillStyle = RAMPS.cream[3]
    g.fillRect(x + 1, y + 4, CELL - 2, 3)
    g.fillStyle = RAMPS.cream[1]
    g.fillRect(x + 1, y + 6, CELL - 2, 1)
  }
  if (options.heavy) {
    g.fillStyle = INK
    g.fillRect(x + 4, y + 8, CELL - 8, 2)
    g.fillRect(x + 3, y + 3, 2, 2)
    g.fillRect(x + CELL - 5, y + 3, 2, 2)
  }
}

// --- the cabinet --------------------------------------------------------------------------------

type Floater = { x: number; y: number; text: string; life: number }
type Upcoming = { kind: CrateKind; sticky: boolean; heavy: boolean }

class CrateStackShuffle implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private bay: Bay = emptyBay()
  private piece: Piece | null = null
  private bag: CrateKind[] = []
  private next: Upcoming
  private fallTimer = 0
  private lockTimer = 0
  private spawnTimer = SPAWN_DELAY
  private rows = 0
  private shipping: { rows: number[]; ticks: number } | null = null
  private banner: { text: string; ticks: number } | null = null
  private dasDir = 0
  private dasTimer = 0
  private floaters: Floater[] = []
  private sparkles = new Sparkles()
  private sparkRng = backdropRng(77)
  private pilot: { turn: number; x: number } | null = null
  private pilotWait = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.next = this.draw()
    this.banner = { text: 'LEVEL 1', ticks: 70 }
  }

  /** The crate to come: the next kind from the bag, maybe taped or heavy. */
  private draw(): Upcoming {
    if (this.bag.length === 0) this.bag = newBag(this.rng)
    const kind = this.bag.pop()!
    const sticky =
      this.level >= STICKY_FROM &&
      this.rng() < levelCurve(this.level - STICKY_FROM + 1, CRATE_CURVES.sticky)
    const heavy =
      !sticky &&
      this.level >= HEAVY_FROM &&
      this.rng() < levelCurve(this.level - HEAVY_FROM + 1, CRATE_CURVES.heavy)
    return { kind, sticky, heavy }
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

    if (this.shipping) {
      if (--this.shipping.ticks <= 0) this.finishShipping()
      return
    }

    const controls = this.demo ? this.pilotInput() : input
    if (!this.piece) {
      if (--this.spawnTimer > 0) return
      this.spawn()
      if (this.over) return
    }
    this.steer(controls)
    if (this.piece) this.gravity(controls)
  }

  private spawn() {
    const n = this.next
    const piece = spawnPiece(n.kind, n.sticky, n.heavy)
    this.next = this.draw()
    this.fallTimer = fallTicks(this.level, piece.heavy)
    this.lockTimer = 0
    this.pilot = null
    if (!fits(this.bay, piece)) {
      this.over = true
      this.lives = 0
      this.banner = { text: 'BAY FULL', ticks: 9999 }
      this.sound.play('die')
      return
    }
    this.piece = piece
  }

  private steer(c: InputFrame) {
    let cur = this.piece!
    let dir = 0
    if (c.held.left && !c.held.right) dir = -1
    else if (c.held.right && !c.held.left) dir = 1
    let move = 0
    if (dir !== this.dasDir) {
      this.dasDir = dir
      this.dasTimer = DAS_DELAY
      move = dir
    } else if (dir !== 0 && --this.dasTimer <= 0) {
      this.dasTimer = DAS_REPEAT
      move = dir
    }
    if (move) {
      const tried = { ...cur, x: cur.x + move }
      if (fits(this.bay, tried)) {
        cur = tried
        this.sound.play('blip')
      }
    }
    if (c.pressed.a || c.pressed.up) {
      const turned = rotate(this.bay, cur, 1)
      if (turned) {
        cur = turned
        this.sound.play('blip')
      }
    }
    if (c.pressed.b) {
      const drop = dropped(this.bay, cur)
      this.addScore((drop.y - cur.y) * 2, null)
      this.piece = drop
      this.settle()
      return
    }
    this.piece = cur
  }

  private gravity(c: InputFrame) {
    const p = this.piece!
    if (!fits(this.bay, { ...p, y: p.y + 1 })) {
      if (++this.lockTimer >= LOCK_DELAY || c.held.down) this.settle()
      return
    }
    this.lockTimer = 0
    const soft = c.held.down && !p.heavy
    if (--this.fallTimer <= 0) {
      this.fallTimer = soft ? 2 : fallTicks(this.level, p.heavy)
      this.piece = { ...p, y: p.y + 1 }
      if (soft) this.addScore(1, null)
    }
  }

  /** The crate is down for good: lock it and see what ships. */
  private settle() {
    lock(this.bay, this.piece!)
    this.piece = null
    this.spawnTimer = SPAWN_DELAY
    this.sound.play('pop')
    const full = fullRows(this.bay)
    if (full.length === 0) return
    this.shipping = { rows: full, ticks: SHIP_TICKS }
    this.sound.play('pickup')
    for (const y of full) {
      this.sparkles.burst(
        WELL_X + (COLS * CELL) / 2,
        WELL_Y + y * CELL + CELL / 2,
        this.sparkRng,
        { count: 6 },
      )
    }
  }

  private finishShipping() {
    const { shipped, unstuck } = shipRows(this.bay)
    this.shipping = null
    if (unstuck.length) {
      this.addScore(unstuck.length * UNSTICK_POINTS, 'TAPE OFF')
    }
    if (shipped.length) {
      this.addScore(
        shipScore(shipped.length, this.level),
        `${shipped.length} OUT`,
      )
      this.rows += shipped.length
      const want = 1 + Math.floor(this.rows / ROWS_PER_LEVEL)
      if (want > this.level) {
        this.level = want
        this.banner = { text: `LEVEL ${want}`, ticks: 80 }
        this.sound.play('level')
      }
    }
  }

  private addScore(points: number, label: string | null) {
    if (this.demo || points <= 0) return
    this.score += points
    if (label) {
      this.floaters.push({
        x: WELL_X + (COLS * CELL) / 2,
        y: WELL_Y + ROWS * CELL * 0.5,
        text: `${label} ${points}`,
        life: 50,
      })
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
    const p = this.piece
    if (p) {
      if (!this.pilot) this.pilot = bestPlacement(this.bay, p)
      const goal = this.pilot
      if (goal && ++this.pilotWait % 3 === 0) {
        if (p.turn !== goal.turn) pressed.a = true
        else if (p.x < goal.x) held.right = true
        else if (p.x > goal.x) held.left = true
        else pressed.b = true
      }
    }
    return { held, pressed }
  }

  // --- render ------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderBackdrop(g)
    this.renderBay(g)
    this.renderPanel(g)
    this.sparkles.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, WELL_X + (COLS * CELL) / 2, Math.round(f.y), {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    if (this.banner) {
      drawText(g, this.banner.text, WELL_X + (COLS * CELL) / 2, 124, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
    }
  }

  private renderBackdrop(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'crate-stack-shuffle-bg', W, H, (layer) => {
      bandedGradient(
        layer,
        0,
        0,
        W,
        H,
        [RAMPS.night[2], RAMPS.purple[0], RAMPS.night[1]],
        6,
      )
      // Warehouse shelving silhouettes.
      const rand = backdropRng(5)
      for (let i = 0; i < 9; i++) {
        const x = Math.round(rand() * W)
        const w = 18 + Math.round(rand() * 22)
        const h = 40 + Math.round(rand() * 80)
        layer.fillStyle = mix(RAMPS.night[2], RAMPS.purple[1], 0.5)
        layer.fillRect(x, H - h, w, h)
        layer.fillStyle = RAMPS.night[3]
        layer.fillRect(x, H - h, w, 1)
        for (let y = H - h + 10; y < H; y += 12) {
          layer.fillStyle = RAMPS.night[1]
          layer.fillRect(x + 2, y, w - 4, 2)
        }
      }
      // The overhead girder with hazard studs.
      layer.fillStyle = RAMPS.steel[1]
      layer.fillRect(0, 0, W, 14)
      layer.fillStyle = RAMPS.steel[3]
      layer.fillRect(0, 0, W, 1)
      layer.fillStyle = INK
      layer.fillRect(0, 14, W, 1)
      for (let x = 6; x < W; x += 24) {
        layer.fillStyle = RAMPS.gold[2]
        layer.fillRect(x, 4, 8, 4)
      }
    })
  }

  private renderBay(g: CanvasRenderingContext2D) {
    const x0 = WELL_X
    const y0 = WELL_Y
    g.fillStyle = INK
    g.fillRect(x0 - 3, y0 - 3, COLS * CELL + 6, ROWS * CELL + 6)
    g.fillStyle = RAMPS.steel[2]
    g.fillRect(x0 - 2, y0 - 2, COLS * CELL + 4, ROWS * CELL + 4)
    g.fillStyle = RAMPS.night[0]
    g.fillRect(x0, y0, COLS * CELL, ROWS * CELL)
    g.fillStyle = rgba(RAMPS.purple[2], 0.18)
    for (let x = 1; x < COLS; x++) g.fillRect(x0 + x * CELL, y0, 1, ROWS * CELL)
    for (let y = 1; y < ROWS; y++) g.fillRect(x0, y0 + y * CELL, COLS * CELL, 1)

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = this.bay[y]![x]
        if (!c) continue
        drawCrate(g, x0 + x * CELL, y0 + y * CELL, c.kind, {
          sticky: c.sticky,
        })
      }
    }
    if (this.shipping) {
      const flash = Math.floor(this.shipping.ticks / 3) % 2 === 0
      for (const y of this.shipping.rows) {
        g.fillStyle = flash ? '#ffffff' : rgba(RAMPS.gold[3], 0.7)
        g.fillRect(x0, y0 + y * CELL, COLS * CELL, CELL)
        glow(
          g,
          x0 + (COLS * CELL) / 2,
          y0 + y * CELL + CELL / 2,
          70,
          RAMPS.gold[3],
          0.5,
        )
      }
    }
    const p = this.piece
    if (p) {
      for (const [x, y] of pieceCells(dropped(this.bay, p))) {
        if (y < 0) continue
        g.fillStyle = rgba(CRATE_RAMPS[p.kind][3], 0.22)
        g.fillRect(x0 + x * CELL + 1, y0 + y * CELL + 1, CELL - 2, CELL - 2)
      }
      for (const [x, y] of pieceCells(p)) {
        if (y < 0) continue
        dropShadow(
          g,
          x0 + x * CELL + CELL / 2,
          y0 + y * CELL + CELL - 1,
          4,
          1.5,
          0.2,
        )
        drawCrate(g, x0 + x * CELL, y0 + y * CELL, p.kind, {
          sticky: p.sticky,
          heavy: p.heavy,
        })
      }
    }
  }

  private renderPanel(g: CanvasRenderingContext2D) {
    const px = 150
    hudPanel(g, px, 24, 96, 26, RAMPS.purple)
    drawText(g, 'SCORE', px + 6, 28, { color: RAMPS.purple[4] })
    drawText(g, String(this.score), px + 90, 38, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, px, 56, 96, 20, RAMPS.teal)
    drawText(g, 'HI', px + 6, 62, { color: RAMPS.teal[4] })
    drawText(g, String(Math.max(this.hiScore, this.score)), px + 90, 62, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, px, 82, 46, 36, RAMPS.gold)
    drawText(g, 'LEVEL', px + 5, 87, { color: RAMPS.gold[4] })
    drawText(g, String(this.level), px + 5, 100, {
      scale: 2,
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, px + 50, 82, 46, 36, RAMPS.pink)
    drawText(g, 'ROWS', px + 55, 87, { color: RAMPS.pink[4] })
    drawText(g, String(this.rows), px + 55, 100, {
      scale: 2,
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, px, 124, 96, 64, RAMPS.night)
    drawText(g, 'NEXT', px + 6, 129, { color: RAMPS.night[4] })
    const size = SHAPES[this.next.kind].size
    const ox = px + 48 - (size * 10) / 2
    for (const [x, y] of turnedCells(this.next.kind, 0)) {
      bevel(
        g,
        ox + x * 10 + 1,
        146 + y * 10 + 1,
        8,
        8,
        CRATE_RAMPS[this.next.kind],
        {
          depth: 1,
        },
      )
      if (this.next.sticky) {
        g.fillStyle = RAMPS.cream[3]
        g.fillRect(ox + x * 10 + 1, 146 + y * 10 + 4, 8, 2)
      }
    }
    hudPanel(g, px, 194, 96, 26, RAMPS.steel)
    drawText(g, 'NEXT LEVEL', px + 6, 198, { color: RAMPS.steel[4] })
    gauge(
      g,
      px + 6,
      209,
      84,
      5,
      (this.rows % ROWS_PER_LEVEL) / ROWS_PER_LEVEL,
      RAMPS.gold,
    )
    const bob = Math.floor(this.tick / 20) % 2
    dropShadow(g, px + 48, 262, 12, 3)
    drawSprite(g, bob ? STACKER_B : STACKER_A, px + 48, 262, {
      anchor: 'feet',
      scale: 2,
    })
    const tag = this.piece?.sticky ? 'TAPED' : this.piece?.heavy ? 'HEAVY' : ''
    if (tag) {
      drawText(g, tag, px + 48, 270, {
        align: 'center',
        color: tag === 'TAPED' ? RAMPS.cream[3] : RAMPS.ember[3],
        outline: INK,
      })
    }
  }
}

const crateStackShuffle: ArcadeGameModule = {
  create: (options) => new CrateStackShuffle(options),
}

export const create = crateStackShuffle.create
export default crateStackShuffle

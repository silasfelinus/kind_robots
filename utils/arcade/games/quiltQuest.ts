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
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  type Ramp,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
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
/** Ticks a freshly sewn patch shimmers (cosmetic). */
const FLASH_TICKS = 26

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

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const FIELD_W = COLS * CELL
const FIELD_H = ROWS * CELL
/** Quilting blocks are this many cells square: the puffed pillows the stitching outlines. */
const BLOCK = 4

/**
 * The fabric each patch colour is cut from, in PATCH_COLORS order (pink, yellow, cyan, violet,
 * green, orange): a ramp to shade it and a print to stamp on it.
 */
const FABRICS: readonly Ramp[] = [
  RAMPS.pink,
  RAMPS.gold,
  RAMPS.teal,
  RAMPS.purple,
  RAMPS.leaf,
  RAMPS.rust,
]

/** The blank cloth, a new colour every quilt: HDMA-style bands, a weave and the glitter. */
const CLOTHS: readonly {
  bands: readonly string[]
  weave: string
  glitter: Ramp
}[] = [
  {
    bands: [RAMPS.night[4], RAMPS.night[3], RAMPS.night[2], RAMPS.night[1]],
    weave: RAMPS.purple[3],
    glitter: RAMPS.purple,
  },
  {
    bands: [
      mix(RAMPS.sky[1], RAMPS.night[3], 0.4),
      mix(RAMPS.sky[0], RAMPS.night[3], 0.3),
      RAMPS.sky[0],
      RAMPS.night[1],
    ],
    weave: RAMPS.sky[3],
    glitter: RAMPS.sky,
  },
  {
    bands: [
      mix(RAMPS.teal[1], RAMPS.night[3], 0.45),
      mix(RAMPS.teal[0], RAMPS.night[3], 0.3),
      RAMPS.teal[0],
      RAMPS.night[1],
    ],
    weave: RAMPS.teal[3],
    glitter: RAMPS.teal,
  },
]

const GLITTER = starField(41, 70, FIELD_W, FIELD_H)

const NEEDLE_ROWS = [
  '....h....',
  '...hLm...',
  '...L.m...',
  '...hLm...',
  '...hLm...',
  '..hLLLm..',
  '.hLLLLLm.',
  'hLwkLwkmd',
  'hLkkLkkmd',
  '.LLLLLLd.',
  '..LLLmd..',
  '...Lmd...',
  '....d....',
]
const needleSprites = (ramp: Ramp) => {
  const palette = {
    h: ramp[4],
    L: ramp[3],
    m: ramp[2],
    d: ramp[1],
    k: INK,
    w: '#ffffff',
  }
  return [
    pixelSprite(NEEDLE_ROWS, palette),
    // A blink: the eyes close to a lid line.
    pixelSprite(
      NEEDLE_ROWS.map((row, i) => (i === 7 ? row.replace(/[wk]/g, 'L') : row)),
      palette,
    ),
  ] as const
}
/** The needle-bot: bright steel on the edge, gold while stitching, rose on a slow stitch. */
const NEEDLE = {
  idle: needleSprites([
    RAMPS.steel[1],
    RAMPS.steel[2],
    RAMPS.steel[3],
    '#e0f2fe',
    '#ffffff',
  ]),
  stitch: needleSprites(RAMPS.gold),
  slow: needleSprites(RAMPS.pink),
}

/** A spare needle-bot for the lives row. */
const SPARE_NEEDLE = pixelSprite(
  ['..h..', '.hLm.', 'hLLLm', 'LkLkm', '.LLm.', '..m..'],
  {
    h: '#ffffff',
    L: '#e0f2fe',
    m: RAMPS.steel[3],
    k: INK,
  },
)

/**
 * The tangle sprite: a ball of yarn lit from the upper left, wound in strands that curve round a
 * tilted axis and roll as it moves, with two beady eyes looking the way it drifts (flip it to
 * face left). `frame` of `frames` sets how far the strands have rolled.
 */
function tangleSprite(frame: number, frames: number, ramp: Ramp) {
  const r = 7
  const size = r * 2 + 1
  const rows: string[][] = []
  for (let y = 0; y < size; y++) {
    const row: string[] = []
    for (let x = 0; x < size; x++) {
      const nx = (x - r) / (r + 0.4)
      const ny = (y - r) / (r + 0.4)
      const d = nx * nx + ny * ny
      if (d > 1) {
        row.push('.')
        continue
      }
      const nz = Math.sqrt(1 - d)
      const light = -0.5 * nx - 0.6 * ny + 0.62 * nz
      let step = Math.max(0, Math.min(4, Math.round(light * 3 + 1.5)))
      // Strands: rings round an axis tipped toward the viewer, so they bow over the ball.
      const ty = nx * Math.sin(0.6) + ny * Math.cos(0.6)
      const lat = ty * Math.cos(0.8) - nz * Math.sin(0.8)
      const band = (((lat * 3.2 + frame / frames) % 1) + 1) % 1
      if (band < 0.22) step = Math.max(0, step - 2)
      else if (band < 0.4) step = Math.min(4, step + 1)
      row.push(String(step))
    }
    rows.push(row)
  }
  for (const [x, y, ch] of [
    [8, 5, 'w'],
    [9, 5, 'w'],
    [8, 6, 'w'],
    [9, 6, 'k'],
    [8, 7, 'w'],
    [9, 7, 'k'],
    [11, 5, 'w'],
    [12, 5, 'w'],
    [11, 6, 'w'],
    [12, 6, 'k'],
    [11, 7, 'w'],
    [12, 7, 'k'],
    [10, 10, 'k'],
    [11, 10, 'k'],
  ] as const)
    rows[y]![x] = ch
  return pixelSprite(
    rows.map((row) => row.join('')),
    {
      '0': ramp[0],
      '1': ramp[1],
      '2': ramp[2],
      '3': ramp[3],
      '4': ramp[4],
      k: INK,
      w: '#ffffff',
    },
  )
}
const TANGLE_RAMPS: readonly Ramp[] = [RAMPS.pink, RAMPS.teal, RAMPS.gold]
const TANGLES = TANGLE_RAMPS.map((ramp) =>
  [0, 1, 2, 3, 4, 5].map((f) => tangleSprite(f, 6, ramp)),
)
const YARN = [RAMPS.pink, RAMPS.teal, RAMPS.leaf, RAMPS.gold] as const

/** A spark running the edges: a crackling ember star, two frames. */
const SPARK_PALETTE = {
  y: RAMPS.ember[4],
  o: RAMPS.ember[3],
  r: RAMPS.ember[2],
  w: '#ffffff',
}
const SPARKS = [
  pixelSprite(
    [
      '...r...',
      '...o...',
      '..oyo..',
      'roywyor',
      '..oyo..',
      '...o...',
      '...r...',
    ],
    SPARK_PALETTE,
  ),
  pixelSprite(
    [
      'r.....r',
      '.o...o.',
      '..oyo..',
      '..ywy..',
      '..oyo..',
      '.o...o.',
      'r.....r',
    ],
    SPARK_PALETTE,
  ),
] as const

/** A canvas for state that changes now and then (null headless, where callers paint direct). */
function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas.getContext('2d') ? canvas : null
}

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
  // Cosmetic only: sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(53)
  /** The sewn quilt on its own canvas, repainted only when the claimed cloth changes. */
  private quilt: HTMLCanvasElement | null | undefined = undefined
  private quiltKey = ''
  /** What the cells looked like at the last claim, to find (and flash) a fresh patch. */
  private seenKey = ''
  private seenCells = new Uint8Array(COLS * ROWS)
  private fresh = new Uint8Array(COLS * ROWS)
  private flash = 0

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
    this.updateCosmetics()
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

  /**
   * Cosmetic only (reads state, never writes it): sparkles and a flash over each freshly sewn
   * patch, fireworks over a finished quilt, embers off a burning fuse.
   */
  private updateCosmetics() {
    this.fx.update()
    if (this.flash > 0) this.flash--
    const key = `${this.level}:${this.patchCount}`
    if (key !== this.seenKey) {
      let count = 0
      for (let i = 0; i < this.cells.length; i++) {
        const sewn = this.cells[i] === FILLED && this.seenCells[i] !== FILLED
        this.fresh[i] = sewn ? 1 : 0
        if (sewn) count++
      }
      this.seenCells.set(this.cells)
      if (this.seenKey && count > 0) {
        this.flash = FLASH_TICKS
        const bursts = Math.min(7, 1 + Math.floor(count / 50))
        for (let b = 0, tries = 0; b < bursts && tries < 400; tries++) {
          const i = Math.floor(this.fxRng() * this.cells.length)
          if (!this.fresh[i]) continue
          b++
          const ramp = FABRICS[(this.colors[i]! + 5) % FABRICS.length]!
          this.fx.burst(
            OX + (i % COLS) * CELL + 2,
            OY + Math.floor(i / COLS) * CELL + 2,
            this.fxRng,
            { count: 9, colours: [ramp[4], ramp[3], RAMPS.gold[4]] },
          )
        }
      }
      this.seenKey = key
    }
    if (this.clear > 0 && this.clear % 14 === 0)
      this.fx.burst(
        OX + 20 + this.fxRng() * (FIELD_W - 40),
        OY + 20 + this.fxRng() * (FIELD_H - 40),
        this.fxRng,
        { count: 18, speed: 2.6 },
      )
    if (this.drawing && this.fuse >= 0 && this.tick % 5 === 0) {
      const f = this.trail[Math.min(this.fuse, this.trail.length - 1)]
      if (f)
        this.fx.burst(OX + f.c * CELL + 2, OY + f.r * CELL + 2, this.fxRng, {
          count: 2,
          speed: 0.9,
          colours: [RAMPS.ember[4], RAMPS.ember[3]],
        })
    }
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
    const theme = (this.level - 1) % CLOTHS.length
    this.renderBackdrop(g, theme)
    // Glitter woven into the blank cloth, twinkling; the sewn quilt covers it.
    g.save()
    g.translate(OX, OY)
    drawStars(g, GLITTER, this.tick, CLOTHS[theme]!.glitter)
    g.restore()
    this.renderQuilt(g)
    this.renderFlash(g)
    this.renderThread(g)
    this.tangles.forEach((t, i) => this.renderTangle(g, t, i))
    for (const s of this.sparks) if (s.t <= 0) this.renderSpark(g, s)
    if (this.dead === 0) this.renderNeedle(g)
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = INK
      g.fillRect(x - 2, y - 2, 4, 4)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y - 1, 1, 1)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.25)
    this.renderHud(g)
  }

  /**
   * The quilting frame and the blank cloth stretched in it, painted once per cloth colour: a
   * banded backdrop, a bevelled wooden frame with brass tacks, the cloth in HDMA-style bands
   * with a fine weave, and the quilting blocks marked out in dashed chalk.
   */
  private renderBackdrop(g: CanvasRenderingContext2D, theme: number) {
    cachedLayer(g, `quilt-quest-cloth-${theme}`, W, H, (k) => {
      const cloth = CLOTHS[theme]!
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
        4,
      )
      bevel(k, OX - 4, OY - 4, FIELD_W + 8, FIELD_H + 8, RAMPS.earth, {
        depth: 2,
      })
      // Wood grain along the frame.
      k.fillStyle = RAMPS.earth[1]
      for (let x = OX + 3; x < OX + FIELD_W - 4; x += 13) {
        k.fillRect(x, OY - 3, 6, 1)
        k.fillRect(x + 5, OY + FIELD_H + 2, 6, 1)
      }
      for (let y = OY + 5; y < OY + FIELD_H - 4; y += 15) {
        k.fillRect(OX - 3, y, 1, 7)
        k.fillRect(OX + FIELD_W + 2, y + 6, 1, 7)
      }
      for (const [tx, ty] of [
        [OX - 2, OY - 2],
        [OX + FIELD_W + 1, OY - 2],
        [OX - 2, OY + FIELD_H + 1],
        [OX + FIELD_W + 1, OY + FIELD_H + 1],
        [OX + FIELD_W / 2, OY - 2],
        [OX + FIELD_W / 2, OY + FIELD_H + 1],
      ] as const)
        shadedOrb(k, tx, ty, 1.6, RAMPS.gold, { outline: null })
      k.fillStyle = INK
      k.fillRect(OX - 1, OY - 1, FIELD_W + 2, FIELD_H + 2)
      bandedGradient(k, OX, OY, FIELD_W, FIELD_H, cloth.bands, 4)
      // The weave: faint threads both ways.
      k.fillStyle = rgba(cloth.weave, 0.07)
      for (let y = OY; y < OY + FIELD_H; y += 2) k.fillRect(OX, y, FIELD_W, 1)
      k.fillStyle = rgba(INK, 0.12)
      for (let x = OX + 1; x < OX + FIELD_W; x += 2)
        k.fillRect(x, OY, 1, FIELD_H)
      // Chalk marks where the quilting blocks will be sewn.
      k.fillStyle = rgba(RAMPS.cream[3], 0.18)
      const span = BLOCK * CELL
      for (let x = OX + span; x < OX + FIELD_W; x += span)
        for (let y = OY; y < OY + FIELD_H; y += 4) k.fillRect(x, y, 1, 2)
      for (let y = OY + span; y < OY + FIELD_H; y += span)
        for (let x = OX; x < OX + FIELD_W; x += 4) k.fillRect(x, y, 2, 1)
    })
  }

  /** The sewn quilt lives on its own canvas, repainted only when the claimed cloth changes. */
  private renderQuilt(g: CanvasRenderingContext2D) {
    if (this.quilt === undefined) this.quilt = makeCanvas(W, H)
    const canvas = this.quilt
    if (!canvas) {
      this.paintQuilt(g)
      return
    }
    const key = `${this.level}:${this.patchCount}:${this.claimed}`
    if (key !== this.quiltKey) {
      const k = canvas.getContext('2d')!
      k.clearRect(0, 0, W, H)
      this.paintQuilt(k)
      this.quiltKey = key
    }
    g.save()
    g.imageSmoothingEnabled = false
    g.drawImage(canvas, 0, 0)
    g.restore()
  }

  private paintQuilt(k: CanvasRenderingContext2D) {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const v = this.cell(x, y)
        const px = OX + x * CELL
        const py = OY + y * CELL
        if (v === FILLED) this.paintPatch(k, x, y, px, py)
        else if (v === EDGE) this.paintCord(k, x, y, px, py)
        else {
          // Open cloth: the raised patches and cord cast a shadow down and right onto it.
          const up = this.cell(x, y - 1)
          const left = this.cell(x - 1, y)
          k.fillStyle = rgba(INK, 0.45)
          if (up === FILLED || up === EDGE) k.fillRect(px, py, CELL, 2)
          if (left === FILLED || left === EDGE) k.fillRect(px, py, 2, CELL)
        }
      }
  }

  /**
   * One cell of a sewn patch: its fabric's print, the puffed pillow of its quilting block
   * (lit upper left, shadowed lower right), the stitched seams between blocks, and a lit rim
   * and shadowed hem where the patch ends.
   */
  private paintPatch(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    px: number,
    py: number,
  ) {
    const colour = this.colors[this.idx(x, y)]!
    const fabric = (colour + 5) % FABRICS.length
    const ramp = FABRICS[fabric]!
    const same = (dx: number, dy: number) => {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false
      const i = this.idx(nx, ny)
      return this.cells[i] === FILLED && this.colors[i] === colour
    }
    const bx = x % BLOCK
    const by = y % BLOCK
    // Each block puffs up like a pillow: lit along its top and left, shadowed bottom and right.
    const lit = bx === 0 || by === 0
    const dim = bx === BLOCK - 1 || by === BLOCK - 1
    const shade = lit && !dim ? 3 : dim && !lit ? 1 : 2
    k.fillStyle = ramp[shade]!
    k.fillRect(px, py, CELL, CELL)
    const print = ramp[Math.min(4, shade + 2)]!
    k.fillStyle = print
    switch (fabric) {
      case 0: // polka dots
        if (y % 2 === 0 && (x + y / 2) % 2 === 0)
          k.fillRect(px + 1, py + 1, 2, 2)
        break
      case 1: // gingham
        k.fillStyle = rgba(ramp[0], 0.2)
        if (x % 2 === 0) k.fillRect(px, py, CELL, CELL)
        if (y % 2 === 0) k.fillRect(px, py, CELL, CELL)
        break
      case 2: // diagonal stripes
        if ((x - y) % 2 === 0)
          for (let i = 0; i < CELL; i++) k.fillRect(px + i, py + i, 1, 1)
        break
      case 3: // sprigged flowers
        if (x % 3 === 1 && y % 3 === 1) {
          k.fillRect(px + 2, py + 1, 1, 3)
          k.fillRect(px + 1, py + 2, 3, 1)
          k.fillStyle = RAMPS.gold[3]
          k.fillRect(px + 2, py + 2, 1, 1)
        }
        break
      case 4: // pinstripes
        if (x % 2 === 0) k.fillRect(px + 1, py, 1, CELL)
        break
      default: // plaid
        if (y % 3 === 0) k.fillRect(px, py + 1, CELL, 1)
        k.fillStyle = rgba(ramp[0], 0.35)
        if (x % 3 === 0) k.fillRect(px + 1, py, 1, CELL)
    }
    // Quilting: thread dashes over a pressed seam round every block.
    if (bx === 0) {
      k.fillStyle = ramp[1]
      k.fillRect(px, py, 1, CELL)
      k.fillStyle = ramp[4]
      k.fillRect(px, py + 1, 1, 2)
    }
    if (by === 0) {
      k.fillStyle = ramp[1]
      k.fillRect(px, py, CELL, 1)
      k.fillStyle = ramp[4]
      k.fillRect(px + 1, py, 2, 1)
    }
    // The patch's edge: a lit rim top and left, a shadowed hem bottom and right.
    if (!same(0, -1)) {
      k.fillStyle = ramp[4]
      k.fillRect(px, py, CELL, 1)
    }
    if (!same(-1, 0)) {
      k.fillStyle = ramp[3]
      k.fillRect(px, py, 1, CELL)
    }
    if (!same(0, 1)) {
      k.fillStyle = ramp[0]
      k.fillRect(px, py + CELL - 1, CELL, 1)
    }
    if (!same(1, 0)) {
      k.fillStyle = ramp[1]
      k.fillRect(px + CELL - 1, py, 1, CELL)
    }
  }

  /** One cell of the live edge: a cream binding cord, running-stitched, inked against the cloth. */
  private paintCord(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    px: number,
    py: number,
  ) {
    const ramp = RAMPS.cream
    const cord = (dx: number, dy: number) => this.cell(x + dx, y + dy) === EDGE
    const open = (dx: number, dy: number) => {
      const v = this.cell(x + dx, y + dy)
      return v === OPEN || v === TRAIL
    }
    k.fillStyle = ramp[2]
    k.fillRect(px, py, CELL, CELL)
    k.fillStyle = ramp[4]
    if (!cord(0, -1)) k.fillRect(px, py, CELL, 1)
    k.fillStyle = ramp[3]
    if (!cord(-1, 0)) k.fillRect(px, py, 1, CELL)
    k.fillStyle = ramp[1]
    if (!cord(0, 1)) k.fillRect(px, py + CELL - 1, CELL, 1)
    if (!cord(1, 0)) k.fillRect(px + CELL - 1, py, 1, CELL)
    if ((x + y) % 2 === 0) {
      k.fillStyle = RAMPS.pink[2]
      k.fillRect(px + 1, py + 1, 2, 2)
      k.fillStyle = RAMPS.pink[4]
      k.fillRect(px + 1, py + 1, 1, 1)
    }
    k.fillStyle = INK
    if (open(0, -1)) k.fillRect(px, py, CELL, 1)
    if (open(0, 1)) k.fillRect(px, py + CELL - 1, CELL, 1)
    if (open(-1, 0)) k.fillRect(px, py, 1, CELL)
    if (open(1, 0)) k.fillRect(px + CELL - 1, py, 1, CELL)
  }

  /** A freshly sewn patch shimmers: an additive flash with a bright band sweeping across it. */
  private renderFlash(g: CanvasRenderingContext2D) {
    if (this.flash <= 0) return
    const t = this.flash / FLASH_TICKS
    const sweep = (1 - t) * (COLS + ROWS) * 1.2 - 6
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const i = this.idx(x, y)
        if (!this.fresh[i] || this.cells[i] !== FILLED) continue
        const band = Math.abs(x + y - sweep) < 4
        g.fillStyle = rgba('#ffffff', (band ? 0.75 : 0.32) * t)
        g.fillRect(OX + x * CELL, OY + y * CELL, CELL, CELL)
      }
    g.restore()
  }

  /** The thread being stitched: an inked, glowing cord with stitches marching along it. */
  private renderThread(g: CanvasRenderingContext2D) {
    if (!this.drawing || this.trail.length < 2) return
    const ramp = this.slow ? RAMPS.pink : RAMPS.gold
    const pts = this.trail.map((t) => ({
      x: OX + t.c * CELL + 2,
      y: OY + t.r * CELL + 2,
    }))
    const burnt = this.fuse >= 0 ? Math.min(this.fuse, pts.length - 1) : -1
    const seg = (i: number, pad: number, colour: string) => {
      const a = pts[i - 1]!
      const b = pts[i]!
      g.fillStyle = colour
      g.fillRect(
        Math.min(a.x, b.x) - pad,
        Math.min(a.y, b.y) - pad,
        Math.abs(a.x - b.x) + pad * 2,
        Math.abs(a.y - b.y) + pad * 2,
      )
    }
    for (let i = 1; i < pts.length; i++) seg(i, 2, INK)
    for (let i = 1; i < pts.length; i++)
      seg(i, 1, i <= burnt ? RAMPS.steel[1] : ramp[2])
    // The lit top-left side of the thread.
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!
      const b = pts[i]!
      g.fillStyle = i <= burnt ? RAMPS.steel[2] : ramp[4]
      g.fillRect(
        Math.min(a.x, b.x) - 1,
        Math.min(a.y, b.y) - 1,
        Math.abs(a.x - b.x) + 1,
        Math.abs(a.y - b.y) + 1,
      )
    }
    // Stitches marching toward the needle, and the thread's glow.
    const march = Math.floor(this.tick / 3)
    g.fillStyle = ramp[1]
    for (let i = burnt + 1; i < pts.length; i++)
      if ((i - march) % 3 === 0) {
        const p = pts[i]!
        g.fillRect(p.x, p.y, 1, 1)
      }
    for (let i = Math.max(1, burnt + 1); i < pts.length; i += 2) {
      const p = pts[i]!
      glow(g, p.x, p.y, 7, ramp[3], 0.22)
    }
    // The fuse: an ember eating the thread from where it began.
    if (burnt >= 0) {
      const f = pts[burnt]!
      const flicker = Math.floor(this.tick / 3) % 2
      glow(g, f.x, f.y, 12 + flicker * 3, RAMPS.ember[3], 0.65)
      shadedOrb(g, f.x, f.y, 2.5 + flicker * 0.5, RAMPS.ember)
    }
  }

  /** A ball of yarn with eyes, rolling, trailing a loose strand behind it. */
  private renderTangle(g: CanvasRenderingContext2D, t: Tangle, n: number) {
    const ramp = TANGLE_RAMPS[n % TANGLE_RAMPS.length]!
    const frames = TANGLES[n % TANGLES.length]!
    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i < t.trail.length; i += 3) {
      const p = t.trail[i]!
      const wob = Math.sin((this.tick + i) / 4) * 3
      pts.push({ x: OX + p.x * CELL + 2 + wob, y: OY + p.y * CELL + 2 - wob })
    }
    g.save()
    g.lineCap = 'round'
    g.lineJoin = 'round'
    for (let i = pts.length - 1; i > 0; i--) {
      const a = pts[i - 1]!
      const b = pts[i]!
      const yarn = YARN[(i + n) % YARN.length]!
      g.globalAlpha = 1 - (i / pts.length) * 0.7
      const stroke = (colour: string, width: number, off: number) => {
        g.strokeStyle = colour
        g.lineWidth = width
        g.beginPath()
        g.moveTo(a.x + off, a.y + off)
        g.lineTo(b.x + off, b.y + off)
        g.stroke()
      }
      stroke(INK, 3.5, 0)
      stroke(yarn[2], 2, 0)
      stroke(yarn[4], 0.8, -0.5)
    }
    g.restore()
    const x = OX + t.x * CELL + 2
    const y = OY + t.y * CELL + 2
    dropShadow(g, x + 2, y + 8, 6, 2, 0.4)
    glow(g, x, y, 14, ramp[3], 0.3)
    const roll = Math.floor(this.tick / 5) % frames.length
    const bob = Math.round(Math.sin(this.tick / 6 + n * 2))
    drawSprite(g, frames[roll]!, x, y + bob, { flipX: t.vx < 0 })
  }

  private renderSpark(g: CanvasRenderingContext2D, s: Spark) {
    const x = OX + s.c * CELL + 2
    const y = OY + s.r * CELL + 2
    glow(g, x, y, 11, RAMPS.ember[3], 0.6)
    drawSprite(g, SPARKS[Math.floor(this.tick / 3) % SPARKS.length]!, x, y)
  }

  private renderNeedle(g: CanvasRenderingContext2D) {
    const x = OX + this.c * CELL + 2
    const y = OY + this.r * CELL + 2
    const frames = this.drawing
      ? this.slow
        ? NEEDLE.slow
        : NEEDLE.stitch
      : NEEDLE.idle
    const blink = this.tick % 110 < 6 ? 1 : 0
    const bob = this.drawing ? 0 : Math.round(Math.sin(this.tick / 10))
    if (this.drawing)
      glow(g, x, y, 13, this.slow ? RAMPS.pink[3] : RAMPS.gold[3], 0.45)
    dropShadow(g, x + 2, y + 8, 4, 1.5, 0.4)
    drawSprite(g, frames[blink]!, x, y + bob)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 3, 2, 80, 22)
    drawText(g, String(this.score).padStart(6, '0'), 8, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Progress toward the target share: a gauge with the target notched in gold.
    hudPanel(g, 87, 2, 82, 22)
    const barX = 93
    const barW = 70
    const share = Math.min(100, this.claimed)
    gauge(
      g,
      barX,
      6,
      barW,
      5,
      share / 100,
      share >= this.target ? RAMPS.gold : RAMPS.leaf,
    )
    const mark = barX + Math.round((barW * this.target) / 100)
    g.fillStyle = INK
    g.fillRect(mark - 1, 3, 3, 11)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(mark, 4, 1, 9)
    drawText(
      g,
      `${Math.floor(this.claimed)} OF ${Math.round(this.target)}`,
      128,
      15,
      { align: 'center', color: RAMPS.teal[4], outline: INK },
    )
    hudPanel(g, 173, 2, 80, 22)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 8, 5, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `QUILT ${this.level}`, 178, 15, {
      color: RAMPS.teal[3],
      outline: INK,
    })
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++)
      drawSprite(g, SPARE_NEEDLE, W - 14 - i * 7, 14, { anchor: 'topleft' })
    if (this.banner) {
      const { text, sub } = this.banner
      const w = Math.max(measureText(text, 2), sub ? measureText(sub) : 0) + 20
      hudPanel(g, Math.round(W / 2 - w / 2), H / 2 - 22, w, sub ? 38 : 26)
      drawText(g, text, W / 2, H / 2 - 16, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (sub)
        drawText(g, sub, W / 2, H / 2 + 4, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const quiltQuest: ArcadeGameModule = {
  create: (options) => new QuiltQuest(options),
}

export const create = quiltQuest.create
export default quiltQuest

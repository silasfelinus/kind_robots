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
//
// Depth slice 1, Pressure and pictures (conductor kr-arcade/t-127): every quilt hides an
// authored picture that each claimed patch reveals; the stitch clock empties into wildfire
// sparks that run up an unfinished thread; twin tangles split apart finish the quilt at once
// with x2 on the next; small tanglets boxed under 3% are wrapped in a bow; power-up buttons
// hide in the cloth; seam combos pay for big, square and picture-perfect patches; frames come
// in shapes with pre-sewn islands; and Endless Quilting meets a new foe every two quilts, then
// keeps heating up. The content lives in quiltQuestBlocks.ts.

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
import {
  MAX_THIMBLES,
  POWER_UPS,
  type PowerUpKind,
  type QuiltBlock,
  SEAM_COMBOS,
  type Shade,
  TREADLE_SPEED,
  WRAP_POINTS,
  WRAP_SHARE,
  endlessBlock,
  insideFrame,
  islandCells,
  paintPicture,
  pickPowerUp,
  pictureInk,
} from './quiltQuestBlocks'

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
/** Outside the frame's shape: wood, never cloth. */
const VOID = 4

/** Ticks a thimble-forgiven snap holds the needle (a real snap takes DEATH_TICKS). */
const SAVED_TICKS = 50
/** Ticks before a wildfire flare joins the edges once the stitch clock runs out. */
const FLARE_DELAY = 45
/** The clock's last quarter flashes: the wildfire's tell. */
const CLOCK_WARN = 0.25

export const QUILT_CURVES = {
  /** Share of the quilt to claim (percent). */
  target: { start: 75, step: 2, limit: 85 },
  /** Cells per tick the tangle sprite drifts. */
  tangleSpeed: { start: 0.35, step: 0.05, limit: 0.75 },
  /** Cells per tick a tanglet drifts: small and slow, so it can be boxed in. */
  tangletSpeed: { start: 0.18, step: 0.01, limit: 0.3 },
  sparks: { start: 0, step: 1, limit: 4 },
  /** Ticks per cell a spark runs. */
  sparkStep: { start: 6, step: -0.5, limit: 3 },
} as const

type Tangle = {
  x: number
  y: number
  vx: number
  vy: number
  trail: Array<{ x: number; y: number }>
  /** A tanglet: small enough to wrap, snags only what it touches. */
  small?: boolean
  /** One of the twin tangles: split them apart to finish the quilt at once. */
  twin?: boolean
}
type Spark = {
  c: number
  r: number
  pc: number
  pr: number
  hand: 1 | -1
  t: number
  /** Flared gold: it runs onto an unfinished thread instead of lighting the fuse. */
  wild?: boolean
  /** Born of an empty stitch clock; burns out when the clock refills. */
  flare?: boolean
  /** The wildfire spark foe: always gold. */
  ember?: boolean
  /** How far up the thread it has run (-1 while it runs the edges). */
  onThread?: number
}
type PowerButton = { c: number; r: number; kind: PowerUpKind }
type Bow = { c: number; r: number }
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
 * The six fabrics the pictures are sewn in, in quiltQuestBlocks FABRIC_NAMES order (pink, gold,
 * teal, purple, leaf, rust): a ramp to shade each and a print to stamp on it.
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
/** A wildfire spark: the same star, flared gold and white-hot. */
const WILD_SPARKS = SPARKS.map((s, i) =>
  pixelSprite(
    i === 0
      ? [
          '...o...',
          '..oyo..',
          '.oywyo.',
          'oywwwyo',
          '.oywyo.',
          '..oyo..',
          '...o...',
        ]
      : [
          'o..y..o',
          '.oyyyo.',
          '.ywwwy.',
          'yywwwyy',
          '.ywwwy.',
          '.oyyyo.',
          'o..y..o',
        ],
    {
      y: '#ffffff',
      o: RAMPS.gold[3],
      w: RAMPS.gold[4],
    },
  ),
)

/** A bow of golden thread, tied round a wrapped tanglet. */
const BOW = pixelSprite(
  ['pp...pp', 'pLp.pLp', 'pLLgLLp', 'pLp.pLp', 'pp.L.pp', '...L...'],
  { p: RAMPS.pink[2], L: RAMPS.pink[4], g: RAMPS.gold[3] },
)

/** Each power-up button's colour, and the letter stitched on it. */
const BUTTON_LOOK: Readonly<Record<PowerUpKind, { ramp: Ramp; mark: string }>> =
  {
    thimble: { ramp: RAMPS.steel, mark: 'T' },
    treadle: { ramp: RAMPS.gold, mark: 'R' },
    spool: { ramp: RAMPS.pink, mark: 'S' },
    pause: { ramp: RAMPS.teal, mark: 'P' },
    magnet: { ramp: RAMPS.ember, mark: 'M' },
  }

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
  /** Which patch each filled cell was sewn in (its rim and hem follow the patch). */
  private colors = new Uint8Array(COLS * ROWS)
  private patchCount = 0
  /** This quilt's content: picture, frame and foe mix (quiltQuestBlocks.ts). */
  private block: QuiltBlock = endlessBlock(1)
  /** The picture under the cloth, cell by cell. */
  private picture: Uint8Array = paintPicture(this.block.picture)
  /** Cells that count toward the claimed share (open cloth at the start). */
  private cloth = new Uint8Array(COLS * ROWS)
  private clothTotal = 1
  /** Cells covered by a pre-sewn island. */
  private island = new Uint8Array(COLS * ROWS)
  /** The picture's marked feature: the cloth cells inside it. */
  private featureCells: number[] = []
  private tanglets: Tangle[] = []
  private buttons: PowerButton[] = []
  private bows: Bow[] = []
  /** The stitch clock: refilled by every claim; empty, and the sparks flare. */
  private clock = 0
  private clockMax = 1
  private wildfire = false
  private thimbles = 0
  private treadle = 0
  private pausePin = 0
  private magnet = 0
  /** This quilt's score multiplier, and the next one's (a split doubles it). */
  private mult = 1
  private nextMult = 1
  /** What happened this run, for the medal boards to come and the tests. */
  private tally = { wraps: 0, splits: 0, powerUps: 0, combos: [] as string[] }
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
  /** Ticks the attract pilot has waited on an edge for a safe box. */
  private demoWait = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: {
    text: string
    sub?: string
    sub2?: string
    ticks: number
  } | null = null
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
  /** The whole picture on a canvas, faded in over the cloth when a quilt is finished. */
  private reveal: HTMLCanvasElement | null | undefined = undefined
  private revealKey = ''

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
    this.block = endlessBlock(level)
    this.picture = paintPicture(this.block.picture)
    this.layCloth()
    this.claimed = 0
    this.mult = this.nextMult
    this.nextMult = 1
    this.clockMax = this.block.clockTicks
    this.clock = this.clockMax
    this.wildfire = false
    this.treadle = 0
    this.pausePin = 0
    this.magnet = 0
    this.bows = []
    this.tangles = []
    const speed = levelCurve(level, QUILT_CURVES.tangleSpeed)
    for (let i = 0; i < this.block.tangles; i++) {
      const at = this.spawnPoint(20, 16)
      const a = this.rng() * Math.PI * 2
      this.tangles.push({
        ...at,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        trail: [],
        twin: this.block.twins && i < 2,
      })
    }
    this.tanglets = []
    const small = levelCurve(level, QUILT_CURVES.tangletSpeed)
    for (let i = 0; i < this.block.tanglets; i++) {
      const at = this.spawnPoint(44, 34)
      const a = this.rng() * Math.PI * 2
      this.tanglets.push({
        ...at,
        vx: Math.cos(a) * small,
        vy: Math.sin(a) * small,
        trail: [],
        small: true,
      })
    }
    this.hideButtons()
    this.resetPlayer()
    const unlock = this.block.unlock
    this.banner = {
      text: `QUILT ${level}`,
      sub: `CLAIM ${Math.round(this.target)} PERCENT${this.mult > 1 ? `  X${this.mult}` : ''}`,
      sub2: unlock
        ? `NEW ${unlock.name}: ${unlock.tip}`
        : this.block.frame.name,
      ticks: unlock ? 160 : 100,
    }
  }

  /**
   * Stretch the cloth in this quilt's frame: wood outside the shape, a live edge round it, and
   * the pre-sewn islands with an edge of their own to sew up against.
   */
  private layCloth() {
    const { frame, picture } = this.block
    this.colors.fill(0)
    this.island.fill(0)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        this.cells[this.idx(c, r)] = insideFrame(frame.shape, c, r)
          ? OPEN
          : VOID
    const raw = (c: number, r: number) =>
      c < 0 || r < 0 || c >= COLS || r >= ROWS
        ? VOID
        : this.cells[this.idx(c, r)]!
    const rim: number[] = []
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (raw(c, r) !== OPEN) continue
        let out = false
        for (let dr = -1; dr <= 1 && !out; dr++)
          for (let dc = -1; dc <= 1 && !out; dc++)
            if (raw(c + dc, r + dr) === VOID) out = true
        if (out) rim.push(this.idx(c, r))
      }
    for (const i of rim) this.cells[i] = EDGE
    for (const isle of frame.islands)
      for (const [c, r] of islandCells(isle)) {
        if (raw(c, r) !== OPEN) continue
        this.cells[this.idx(c, r)] = EDGE
        this.island[this.idx(c, r)] = 1
      }
    // An edge with no open cloth beside it is no edge: frame corners become wood, island
    // middles are sewn in.
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = this.idx(c, r)
        if (this.cells[i] !== EDGE) continue
        let open = false
        for (let dr = -1; dr <= 1 && !open; dr++)
          for (let dc = -1; dc <= 1 && !open; dc++)
            if (raw(c + dc, r + dr) === OPEN) open = true
        if (!open) this.cells[i] = this.island[i] ? FILLED : VOID
      }
    this.clothTotal = 0
    for (let i = 0; i < this.cells.length; i++) {
      this.cloth[i] = this.cells[i] === OPEN ? 1 : 0
      this.clothTotal += this.cloth[i]!
    }
    this.clothTotal = Math.max(1, this.clothTotal)
    const f = picture.feature
    const inside: number[] = []
    for (let r = f.y; r < f.y + f.h; r++)
      for (let c = f.x; c < f.x + f.w; c++)
        if (this.cloth[this.idx(c, r)]) inside.push(this.idx(c, r))
    // A feature mostly off this frame's cloth can't be revealed whole.
    this.featureCells = inside.length >= f.w * f.h * 0.6 ? inside : []
  }

  /** An open spot near the middle (within ±w/2, ±h/2), clear of edges, for a foe to start. */
  private spawnPoint(w: number, h: number): { x: number; y: number } {
    for (let tries = 0; tries < 60; tries++) {
      const x = COLS / 2 + (this.rng() - 0.5) * w
      const y = ROWS / 2 + (this.rng() - 0.5) * h
      if (this.clearAround(Math.round(x), Math.round(y), 3)) return { x, y }
    }
    for (let d = 0; d < COLS; d++)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (
            Math.abs(c - (COLS >> 1)) + Math.abs(r - (ROWS >> 1)) === d &&
            this.clearAround(c, r, 1)
          )
            return { x: c, y: r }
    return { x: COLS / 2, y: ROWS / 2 }
  }

  private clearAround(c: number, r: number, k: number): boolean {
    for (let dr = -k; dr <= k; dr++)
      for (let dc = -k; dc <= k; dc++)
        if (this.cell(c + dc, r + dr) !== OPEN) return false
    return true
  }

  /** Sew this quilt's power-up buttons into the open cloth, away from the edges. */
  private hideButtons() {
    this.buttons = []
    for (let i = 0, tries = 0; i < this.block.buttons && tries < 200; tries++) {
      const c = 4 + Math.floor(this.rng() * (COLS - 8))
      const r = 4 + Math.floor(this.rng() * (ROWS - 8))
      if (!this.clearAround(c, r, 3)) continue
      if (this.buttons.some((b) => Math.abs(b.c - c) + Math.abs(b.r - r) < 10))
        continue
      this.buttons.push({ c, r, kind: pickPowerUp(this.rng()) })
      i++
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
    // A fresh needle gets a full stitch clock, and the flares burn out.
    this.clock = Math.max(this.clock, this.clockMax)
    this.wildfire = false
    this.sparks = []
    const sparks = Math.round(levelCurve(this.level, QUILT_CURVES.sparks))
    for (let i = 0; i < sparks + this.block.wildSparks; i++) {
      const ember = i >= sparks
      this.sparks.push(this.newSpark(i, ember ? 150 + 60 * i : 60 * (i + 1)))
      if (ember) this.sparks[i]!.ember = this.sparks[i]!.wild = true
    }
  }

  /** A spark entering at the top of the frame, its hand on the wall set by `i`. */
  private newSpark(i: number, delay: number): Spark {
    const at = this.nearestEdge(Math.floor(COLS / 2), 0)
    return {
      c: at.c,
      r: at.r,
      pc: at.c + (i % 2 ? 1 : -1),
      pr: at.r,
      hand: i % 2 ? 1 : -1,
      t: delay,
      onThread: -1,
    }
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
    this.tickPowers()
    this.movePlayer(controls)
    if (this.dead > 0 || this.clear > 0) return
    this.updateFuse()
    if (this.dead > 0) return
    this.updateClock()
    // A Pause Pin holds every foe still.
    if (this.pausePin > 0) return
    this.moveTangles()
    if (this.dead > 0) return
    this.moveSparks()
  }

  /** Power-ups run down; a magnet's pull ends with the sparks drifting back. */
  private tickPowers() {
    if (this.treadle > 0) this.treadle--
    if (this.pausePin > 0) this.pausePin--
    if (this.magnet > 0) this.magnet--
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
    // The treadle winds the needle half as fast again; leftover time carries to the next cell.
    this.moveTimer -= this.treadle > 0 ? TREADLE_SPEED : 1
    if (this.moveTimer > 0 || dir < 0) return
    const [dc, dr] = DIRS[dir]!
    const nc = this.c + dc
    const nr = this.r + dr
    const next = this.cell(nc, nr)
    if (!this.drawing) {
      if (next === EDGE) {
        this.c = nc
        this.r = nr
        this.windTimer(2)
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

  private windTimer(ticks: number) {
    this.moveTimer =
      (this.treadle > 0 ? Math.max(-1, this.moveTimer) : 0) + ticks
  }

  private stepInto(c: number, r: number) {
    this.c = c
    this.r = r
    this.cells[this.idx(c, r)] = TRAIL
    this.trail.push({ c, r })
    this.windTimer(this.slow ? 4 : 2)
    // Every stitch pays a point (two on a slow stitch).
    this.addScore(this.slow ? 2 : 1, 0, 0)
    if (this.trail.length % 4 === 0) this.sound.play('blip')
  }

  /** Flood the open cloth from the given cells; `block` cells are walls. */
  private flood(seeds: number[], block?: Uint8Array): Uint8Array {
    const seen = new Uint8Array(COLS * ROWS)
    const stack: number[] = []
    for (const i of seeds) {
      if (this.cells[i] !== OPEN || seen[i] || block?.[i]) continue
      seen[i] = 1
      stack.push(i)
    }
    while (stack.length) {
      const i = stack.pop()!
      const x = i % COLS
      const y = (i - x) / COLS
      for (const [dc, dr] of DIRS) {
        const nx = x + dc
        const ny = y + dr
        if (this.cell(nx, ny) !== OPEN) continue
        const n = this.idx(nx, ny)
        if (seen[n] || block?.[n]) continue
        seen[n] = 1
        stack.push(n)
      }
    }
    return seen
  }

  /** The open cells a foe holds: where it is, or beside it if it sits on a fresh seam. */
  private foeSeeds(t: Tangle): number[] {
    const tc = Math.round(t.x)
    const tr = Math.round(t.y)
    if (this.cell(tc, tr) === OPEN) return [this.idx(tc, tr)]
    const seeds: number[] = []
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++)
        if (this.cell(tc + dc, tr + dr) === OPEN)
          seeds.push(this.idx(tc + dc, tr + dr))
    return seeds
  }

  /**
   * Back on an edge: fill the side without the tangle sprites. Twins split apart finish the
   * quilt; a tanglet boxed in small is wrapped in a bow; buttons sewn in are claimed; and the
   * patch is checked for seam combos.
   */
  private closeStitch(c: number, r: number) {
    this.c = c
    this.r = r
    this.drawing = false
    this.fuse = -1
    const unrevealed = (i: number) =>
      this.cells[i] === OPEN || this.cells[i] === TRAIL
    const featureHidden = this.featureCells.every(unrevealed)
    for (const t of this.trail) this.cells[this.idx(t.c, t.r)] = EDGE
    // Everything the big tangles can still reach stays open.
    const reach = this.flood(this.tangles.flatMap((t) => this.foeSeeds(t)))
    const twins = this.tangles.filter((t) => t.twin)
    let split = false
    if (twins.length === 2) {
      const a = this.flood(this.foeSeeds(twins[0]!))
      const b = this.foeSeeds(twins[1]!)
      split = b.length > 0 && a.some((v) => v) && !b.some((i) => a[i])
    }
    // A tanglet's pocket: under WRAP_SHARE of the cloth it's wrapped, otherwise it holds it open.
    const wrapped: Tangle[] = []
    for (const t of this.tanglets) {
      const seeds = this.foeSeeds(t)
      if (seeds.some((i) => reach[i])) continue
      const pocket = this.flood(seeds, reach)
      let size = 0
      for (let i = 0; i < pocket.length; i++) size += pocket[i]!
      if (size * 100 < WRAP_SHARE * this.clothTotal) wrapped.push(t)
      else for (let i = 0; i < pocket.length; i++) if (pocket[i]) reach[i] = 1
    }
    const patch = 1 + (this.patchCount++ % 254)
    let gained = 0
    let x0 = COLS
    let y0 = ROWS
    let x1 = -1
    let y1 = -1
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === OPEN && !reach[i]) {
        this.cells[i] = FILLED
        this.colors[i] = patch
        gained++
        const x = i % COLS
        const y = (i - x) / COLS
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
    }
    const side = x1 - x0 + 1
    const squared =
      side >= SEAM_COMBOS.squareSeam.minSide &&
      side === y1 - y0 + 1 &&
      side * side === gained
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
          this.colors[this.idx(x, y)] = patch
        }
      }
    const before = this.claimed
    this.recount()
    const cx = OX + this.c * CELL
    const cy = OY + this.r * CELL
    this.addScore(
      Math.round(gained * (this.slow ? 2 : 1) * this.levelFactor),
      cx,
      cy - 8,
    )
    this.trail = []
    this.sound.play(gained > 200 ? 'extra' : 'pickup')
    for (const t of wrapped) this.wrap(t)
    this.claimButtons()
    const combos: string[] = []
    if (this.claimed - before >= SEAM_COMBOS.bigBlock.minShare)
      combos.push('bigBlock')
    if (squared) combos.push('squareSeam')
    if (
      featureHidden &&
      this.featureCells.length > 0 &&
      !this.featureCells.some((i) => this.cells[i] === OPEN)
    )
      combos.push('picturePerfect')
    combos.forEach((key, n) => this.combo(key as keyof typeof SEAM_COMBOS, n))
    // A claim refills the stitch clock, and the flares burn out.
    this.calmWildfire()
    if (split) this.quiltDone(true)
    else if (this.claimed >= this.target) this.quiltDone(false)
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
    for (const s of this.sparks) {
      s.onThread = -1
      if (this.cell(s.c, s.r) !== EDGE) this.relocateSpark(s)
    }
  }

  /** Points for kindness and cleverness grow a quarter per quilt, and with the multiplier. */
  private get levelFactor(): number {
    return 1 + (this.level - 1) * 0.25
  }

  /** A tanglet boxed in small: tied up in a bow, it's out of the quilt. */
  private wrap(t: Tangle) {
    this.tanglets = this.tanglets.filter((o) => o !== t)
    const c = Math.round(t.x)
    const r = Math.round(t.y)
    this.bows.push({ c, r })
    this.tally.wraps++
    const x = OX + c * CELL + 2
    const y = OY + r * CELL + 2
    this.addScore(Math.round(WRAP_POINTS * this.levelFactor), x, y - 10)
    this.floaters.push({ x, y: y - 18, text: 'BOW!', life: 60 })
    this.burst(x, y, 12, RAMPS.pink[3])
    this.sound.play('extra')
  }

  /** Every power-up button now sewn into a patch is the needle's. */
  private claimButtons() {
    const keep: PowerButton[] = []
    let n = 0
    for (const b of this.buttons) {
      if (this.cell(b.c, b.r) === OPEN) {
        keep.push(b)
        continue
      }
      this.collect(b, n++)
    }
    this.buttons = keep
  }

  private collect(b: PowerButton, n: number) {
    const power = POWER_UPS[b.kind]
    this.tally.powerUps++
    if (b.kind === 'thimble')
      this.thimbles = Math.min(MAX_THIMBLES, this.thimbles + 1)
    else if (b.kind === 'treadle') this.treadle = power.ticks
    else if (b.kind === 'pause') this.pausePin = power.ticks
    else if (b.kind === 'magnet') {
      this.magnet = power.ticks
      // The sparks are pulled off the edge, and drift back in at the top when it lets go.
      this.sparks = this.sparks.filter((s) => !s.flare)
      this.sparks.forEach((s, i) => {
        const back = this.newSpark(i, power.ticks + 30 * i)
        Object.assign(s, { ...back, wild: s.wild, ember: s.ember })
      })
    }
    // The spool winds on twice the clock (a claim refills it to full on top of that).
    if (b.kind === 'spool') this.clock = this.clockMax * 2
    const x = OX + b.c * CELL + 2
    const y = OY + b.r * CELL + 2
    this.addScore(Math.round(250 * this.levelFactor), x, y)
    this.floaters.push({
      x: W / 2,
      y: OY + 48 + n * 22,
      text: power.name,
      life: 70,
    })
    this.floaters.push({
      x: W / 2,
      y: OY + 58 + n * 22,
      text: power.tip,
      life: 70,
    })
    this.burst(x, y, 10, BUTTON_LOOK[b.kind].ramp[3])
    this.sound.play('pickup')
  }

  private combo(key: keyof typeof SEAM_COMBOS, n: number) {
    const combo = SEAM_COMBOS[key]
    this.tally.combos.push(key)
    const y = OY + FIELD_H - 34 - n * 12
    this.addScore(Math.round(combo.points * this.levelFactor), W / 2, y + 10)
    this.floaters.push({ x: W / 2, y, text: `${combo.name}!`, life: 80 })
    this.fx.burst(W / 2, y, this.fxRng, {
      count: 14,
      colours: [RAMPS.gold[4], RAMPS.pink[3], RAMPS.teal[3]],
    })
  }

  private recount() {
    let filled = 0
    for (let i = 0; i < this.cells.length; i++)
      if (this.cloth[i] && this.cells[i] !== OPEN) filled++
    this.claimed = (filled / this.clothTotal) * 100
  }

  /** The quilt is done: by reaching the target, or at once by splitting the twins apart. */
  private quiltDone(split: boolean) {
    const over = Math.max(0, Math.floor(this.claimed - this.target))
    const bonus = Math.round((1000 * this.level + over * 1000) * this.mult)
    this.addScore(bonus / this.mult, W / 2, H / 2)
    this.clear = CLEAR_TICKS
    if (split) {
      this.nextMult = 2
      this.tally.splits++
    }
    this.banner = {
      text: split ? 'SPLIT THE TWINS!' : 'QUILT FINISHED!',
      sub: split
        ? `BONUS ${bonus}  NEXT QUILT X2`
        : `${this.claimed.toFixed(0)} PERCENT  BONUS ${bonus}`,
      sub2: this.block.picture.name,
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

  /** The stitch clock runs down; empty, every spark flares gold and a wildfire flare joins. */
  private updateClock() {
    if (this.clock <= 0) return
    this.clock--
    if (this.clock === Math.floor(this.clockMax * CLOCK_WARN))
      this.sound.play('warn')
    if (this.clock > 0) return
    this.wildfire = true
    for (const s of this.sparks) s.wild = true
    const flare = this.newSpark(
      this.sparks.length,
      Math.max(FLARE_DELAY, this.magnet),
    )
    flare.wild = flare.flare = true
    this.sparks.push(flare)
    this.floaters.push({ x: W / 2, y: OY + 20, text: 'WILDFIRE!', life: 70 })
    this.sound.play('warn')
  }

  private calmWildfire() {
    this.clock = Math.max(this.clock, this.clockMax)
    if (!this.wildfire) return
    this.wildfire = false
    for (const s of this.sparks.filter((s) => s.flare && s.t <= 0))
      this.fx.burst(OX + s.c * CELL + 2, OY + s.r * CELL + 2, this.fxRng, {
        count: 6,
        colours: [RAMPS.gold[4], RAMPS.steel[3]],
      })
    this.sparks = this.sparks.filter((s) => !s.flare)
    for (const s of this.sparks) s.wild = !!s.ember
  }

  private moveTangles() {
    for (const t of [...this.tangles, ...this.tanglets]) {
      // Wander a little (tanglets fidget more).
      if (this.rng() < (t.small ? 0.04 : 0.02)) {
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
      if (t.trail.length > (t.small ? 12 : 30)) t.trail.pop()
      // Brushing the thread snaps it (a tanglet has to touch it).
      if (this.drawing) {
        const k = t.small ? 1 : 2
        for (let dy = -k; dy <= k; dy++)
          for (let dx = -k; dx <= k; dx++)
            if (
              this.cell(Math.round(t.x) + dx, Math.round(t.y) + dy) === TRAIL
            ) {
              this.snap(
                t.small
                  ? 'A TANGLET NIBBLED THE THREAD'
                  : 'THE TANGLE SNAGGED THE THREAD',
              )
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
    const base = Math.round(levelCurve(this.level, QUILT_CURVES.sparkStep))
    for (const s of this.sparks) {
      if (s.t > 0) {
        s.t--
        continue
      }
      // Wildfire runs faster.
      const every = s.wild ? Math.max(2, base - 2) : base
      if (this.tick % every !== 0) continue
      if ((s.onThread ?? -1) >= 0) {
        // Up the unfinished thread toward the needle.
        if (!this.drawing) {
          s.onThread = -1
          this.relocateSpark(s)
          continue
        }
        s.onThread = s.onThread! + 1
        const at = this.trail[s.onThread]
        if (!at || s.onThread >= this.trail.length - 1) {
          this.snap('WILDFIRE RAN UP THE THREAD')
          return
        }
        s.c = at.c
        s.r = at.r
        continue
      }
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
      // Reaching where the thread began: a spark lights the fuse, wildfire climbs on.
      const start = this.trail[0]
      if (this.drawing && start && s.c === start.c && s.r === start.r) {
        if (s.wild) s.onThread = 0
        else if (this.fuse < 0) this.fuse = 0
      }
    }
  }

  private snap(why: string) {
    // A thimble forgives the snap: the thread is lost, the needle isn't.
    const saved = this.thimbles > 0
    if (saved) this.thimbles--
    else this.lives--
    this.dead = saved ? SAVED_TICKS : DEATH_TICKS
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
    this.sound.play(saved ? 'pop' : 'die')
    this.banner = saved
      ? { text: 'THIMBLE!', sub: 'THAT SNAP IS FORGIVEN', ticks: SAVED_TICKS }
      : { text: 'SNAP!', sub: why, ticks: DEATH_TICKS }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    points = Math.round(points * this.mult)
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
          const ramp =
            FABRICS[pictureInk(this.picture[i]!)?.fabric ?? 1] ?? RAMPS.gold
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
    const away = (ts: Tangle[]) =>
      Math.min(
        Infinity,
        ...ts.map((t) => Math.hypot(t.x - this.c, t.y - this.r)),
      )
    const nearestTangle = away(this.tangles)
    const nearestSmall = away(this.tanglets)
    // With the stitch clock low, box small and get home before the wildfire.
    const hurry = this.wildfire || this.clock < this.clockMax * CLOCK_WARN
    if (!this.drawing) {
      if (this.plan.length === 0) {
        // Find an inward direction from here, and plan a box if the tangles are far.
        const inward = DIRS.findIndex(
          ([dc, dr]) => this.cell(this.c + dc, this.r + dr) === OPEN,
        )
        // Kept waiting on an edge too long (an island ring, say), it dares a closer box.
        const nerve = this.demoWait > 600 ? 8 : 20
        this.demoWait++
        if (inward >= 0 && nearestTangle > nerve && nearestSmall > 8) {
          this.demoWait = 0
          const along = (inward + (this.rng() < 0.5 ? 1 : 3)) % 4
          const deep = (hurry ? 3 : 6) + Math.floor(this.rng() * 10)
          const wide = (hurry ? 4 : 10) + Math.floor(this.rng() * 18)
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
    // A tangle's coming, or the wildfire is out: give up the box and head for the nearest edge.
    if (
      nearestTangle < 12 ||
      nearestSmall < 5 ||
      (this.wildfire && this.trail.length > 6)
    )
      this.plan = []
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
    this.renderReveal(g)
    this.renderFlash(g)
    this.renderButtons(g)
    this.renderBows(g)
    this.renderThread(g)
    this.renderTwinLink(g)
    this.tanglets.forEach((t, i) => this.renderTanglet(g, t, i))
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

  /** As a quilt is finished, its whole picture fades in over the cloth still open. */
  private renderReveal(g: CanvasRenderingContext2D) {
    if (this.clear <= 0) return
    const amount = Math.min(1, (CLEAR_TICKS - this.clear) / 60)
    if (this.reveal === undefined) this.reveal = makeCanvas(W, H)
    g.save()
    g.globalAlpha = amount * 0.9
    if (this.reveal) {
      const key = `${this.level}:${this.block.picture.id}`
      if (key !== this.revealKey) {
        const k = this.reveal.getContext('2d')!
        k.clearRect(0, 0, W, H)
        this.paintOpenPicture(k)
        this.revealKey = key
      }
      g.imageSmoothingEnabled = false
      g.drawImage(this.reveal, 0, 0)
    } else this.paintOpenPicture(g)
    g.restore()
  }

  /** The block's picture on every cloth cell not yet sewn into a patch. */
  private paintOpenPicture(k: CanvasRenderingContext2D) {
    for (let i = 0; i < this.cells.length; i++) {
      if (!this.cloth[i] || this.cells[i] === FILLED) continue
      const ink = pictureInk(this.picture[i]!)
      k.fillStyle = ink ? FABRICS[ink.fabric]![ink.shade] : INK
      k.fillRect(
        OX + (i % COLS) * CELL,
        OY + Math.floor(i / COLS) * CELL,
        CELL,
        CELL,
      )
    }
  }

  /** The power-up buttons sewn on the open cloth, each with its letter, twinkling now and then. */
  private renderButtons(g: CanvasRenderingContext2D) {
    for (const b of this.buttons) {
      const look = BUTTON_LOOK[b.kind]
      const x = OX + b.c * CELL + 2
      const y = OY + b.r * CELL + 2
      const pulse = Math.sin((this.tick + b.c * 7) / 9)
      glow(g, x, y, 9 + pulse * 2, look.ramp[3], 0.35)
      dropShadow(g, x + 1, y + 5, 4, 1.5, 0.4)
      shadedOrb(g, x, y, 5, look.ramp, { glint: false })
      drawText(g, look.mark, x, y - 3, {
        align: 'center',
        color: look.ramp[4],
        outline: INK,
      })
      if ((this.tick + b.r * 11) % 90 < 8) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 4, y - 5, 1, 1)
        g.fillRect(x - 5, y - 4, 3, 1)
      }
    }
  }

  /** Bows where tanglets were wrapped. */
  private renderBows(g: CanvasRenderingContext2D) {
    for (const b of this.bows) {
      const bob = Math.round(Math.sin((this.tick + b.c * 5) / 14))
      drawSprite(g, BOW, OX + b.c * CELL + 2, OY + b.r * CELL + 2 + bob)
    }
  }

  /** The twins share a strand of yarn: the tell that splitting them pays. */
  private renderTwinLink(g: CanvasRenderingContext2D) {
    const twins = this.tangles.filter((t) => t.twin)
    if (twins.length !== 2) return
    const [a, b] = twins as [Tangle, Tangle]
    const ax = OX + a.x * CELL + 2
    const ay = OY + a.y * CELL + 2
    const bx = OX + b.x * CELL + 2
    const by = OY + b.y * CELL + 2
    const len = Math.hypot(bx - ax, by - ay)
    const steps = Math.floor(len / 5)
    const shift = (this.tick / 4) % 1
    for (let i = 1; i < steps; i++) {
      const t = (i + shift) / steps
      const x = Math.round(ax + (bx - ax) * t)
      const y = Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * 6)
      g.fillStyle = rgba(INK, 0.5)
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = rgba(RAMPS.pink[3], 0.7)
      g.fillRect(x, y, 1, 1)
    }
  }

  /** A tanglet: a little ball of yarn with two dot eyes and a short loose end. */
  private renderTanglet(g: CanvasRenderingContext2D, t: Tangle, n: number) {
    const ramp = YARN[(n + 2) % YARN.length]!
    const x = OX + t.x * CELL + 2
    const y = OY + t.y * CELL + 2
    g.save()
    g.lineCap = 'round'
    g.strokeStyle = ramp[2]
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(x, y)
    for (let i = 3; i < t.trail.length; i += 3) {
      const p = t.trail[i]!
      g.lineTo(
        OX + p.x * CELL + 2 + Math.sin((this.tick + i) / 3),
        OY + p.y * CELL + 2,
      )
    }
    g.stroke()
    g.restore()
    dropShadow(g, x + 1, y + 4, 3, 1, 0.4)
    shadedOrb(g, x, y + Math.round(Math.sin(this.tick / 5 + n)), 3.5, ramp)
    g.fillStyle = INK
    const look = t.vx < 0 ? -1 : 1
    g.fillRect(Math.round(x + look), Math.round(y - 1), 1, 1)
    g.fillRect(
      Math.round(x + look * 2 + (look > 0 ? 1 : -1)),
      Math.round(y - 1),
      1,
      1,
    )
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
        if (v === VOID) this.paintWood(k, x, y, px, py)
        else if (v === FILLED) this.paintPatch(k, x, y, px, py)
        else if (v === EDGE) this.paintCord(k, x, y, px, py)
        else {
          // Open cloth: the raised patches and cord cast a shadow down and right onto it.
          const up = this.cell(x, y - 1)
          const left = this.cell(x - 1, y)
          k.fillStyle = rgba(INK, 0.45)
          if (up !== OPEN && up !== TRAIL) k.fillRect(px, py, CELL, 2)
          if (left !== OPEN && left !== TRAIL) k.fillRect(px, py, 2, CELL)
        }
      }
    for (const isle of this.block.frame.islands) this.paintIsland(k, isle)
  }

  /** Outside a shaped frame: the frame's wood, grained, inked where it meets the cloth. */
  private paintWood(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    px: number,
    py: number,
  ) {
    const ramp = RAMPS.earth
    k.fillStyle = ramp[(x * 7 + y * 3) % 11 === 0 ? 1 : 2]
    k.fillRect(px, py, CELL, CELL)
    if ((y + (x >> 2)) % 3 === 0) {
      k.fillStyle = ramp[3]
      k.fillRect(px, py + 1, CELL - 1, 1)
    }
    const cloth = (dx: number, dy: number) => {
      const v = this.cell(x + dx, y + dy)
      return (
        v !== VOID &&
        !(x + dx < 0 || y + dy < 0 || x + dx >= COLS || y + dy >= ROWS)
      )
    }
    k.fillStyle = INK
    if (cloth(0, -1)) k.fillRect(px, py, CELL, 1)
    if (cloth(0, 1)) k.fillRect(px, py + CELL - 1, CELL, 1)
    if (cloth(-1, 0)) k.fillRect(px, py, 1, CELL)
    if (cloth(1, 0)) k.fillRect(px + CELL - 1, py, 1, CELL)
  }

  /** A pre-sewn island: a big button, a pin, or an appliqué heart with running stitches. */
  private paintIsland(
    k: CanvasRenderingContext2D,
    isle: QuiltBlock['frame']['islands'][number],
  ) {
    const x = OX + isle.c * CELL + 2
    const y = OY + isle.r * CELL + 2
    if (isle.kind === 'button') {
      const r = isle.size * CELL - 1
      shadedOrb(k, x, y, r, RAMPS.purple)
      k.fillStyle = rgba(INK, 0.35)
      k.beginPath()
      k.arc(x, y, r * 0.72, 0, Math.PI * 2)
      k.fill()
      shadedOrb(k, x, y, r * 0.66, RAMPS.purple, { outline: null })
      k.fillStyle = INK
      for (const [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        k.fillRect(x + dx * 3 - 1, y + dy * 3 - 1, 2, 2)
      return
    }
    if (isle.kind === 'pin') {
      k.fillStyle = INK
      k.fillRect(x - 1, y - 1, 3, 9)
      k.fillStyle = RAMPS.steel[3]
      k.fillRect(x, y, 1, 7)
      shadedOrb(k, x, y - 1, 3, RAMPS.ember)
      return
    }
    for (const [c, r] of islandCells(isle)) {
      if (this.cell(c, r) !== FILLED) continue
      const px = OX + c * CELL
      const py = OY + r * CELL
      const ny = (r - isle.r + isle.size) / (isle.size * 2 + 1)
      k.fillStyle = RAMPS.pink[ny < 0.3 ? 3 : ny < 0.7 ? 2 : 1]
      k.fillRect(px, py, CELL, CELL)
      if ((c + r) % 2 === 0) {
        k.fillStyle = RAMPS.pink[4]
        k.fillRect(px + 1, py + 1, 2, 1)
      }
    }
  }

  /**
   * One cell of a sewn patch: the hidden picture's colour in its fabric, that fabric's print
   * stamped faintly over it, the quilting seams between blocks, and a lit rim and shadowed hem
   * where the patch ends, so the patchwork still reads over the picture.
   */
  private paintPatch(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    px: number,
    py: number,
  ) {
    const i = this.idx(x, y)
    if (this.island[i]) {
      k.fillStyle = RAMPS.cream[1]
      k.fillRect(px, py, CELL, CELL)
      return
    }
    const patch = this.colors[i]!
    const ink = pictureInk(this.picture[i]!)
    const same = (dx: number, dy: number) => {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false
      const n = this.idx(nx, ny)
      return this.cells[n] === FILLED && this.colors[n] === patch
    }
    if (!ink) {
      k.fillStyle = INK
      k.fillRect(px, py, CELL, CELL)
    } else {
      const ramp = FABRICS[ink.fabric]!
      k.fillStyle = ramp[ink.shade]
      k.fillRect(px, py, CELL, CELL)
      k.fillStyle = rgba(ramp[Math.min(4, ink.shade + 1) as Shade], 0.6)
      switch (ink.fabric) {
        case 0: // polka dots
          if (y % 2 === 0 && (x + y / 2) % 2 === 0)
            k.fillRect(px + 1, py + 1, 2, 2)
          break
        case 1: // gingham
          k.fillStyle = rgba(ramp[0], 0.12)
          if (x % 2 === 0) k.fillRect(px, py, CELL, CELL)
          if (y % 2 === 0) k.fillRect(px, py, CELL, CELL)
          break
        case 2: // diagonal stripes
          if ((x - y) % 2 === 0)
            for (let n = 0; n < CELL; n++) k.fillRect(px + n, py + n, 1, 1)
          break
        case 3: // sprigged flowers
          if (x % 3 === 1 && y % 3 === 1) {
            k.fillRect(px + 2, py + 1, 1, 3)
            k.fillRect(px + 1, py + 2, 3, 1)
          }
          break
        case 4: // pinstripes
          if (x % 2 === 0) k.fillRect(px + 1, py, 1, CELL)
          break
        default: // plaid
          if (y % 3 === 0) k.fillRect(px, py + 1, CELL, 1)
          k.fillStyle = rgba(ramp[0], 0.2)
          if (x % 3 === 0) k.fillRect(px + 1, py, 1, CELL)
      }
    }
    // Quilting: thread dashes over a pressed seam round every block.
    if (x % BLOCK === 0) {
      k.fillStyle = rgba(INK, 0.2)
      k.fillRect(px, py, 1, CELL)
      k.fillStyle = rgba('#ffffff', 0.35)
      k.fillRect(px, py + 1, 1, 2)
    }
    if (y % BLOCK === 0) {
      k.fillStyle = rgba(INK, 0.2)
      k.fillRect(px, py, CELL, 1)
      k.fillStyle = rgba('#ffffff', 0.35)
      k.fillRect(px + 1, py, 2, 1)
    }
    // The patch's edge: a lit rim top and left, a shadowed hem bottom and right.
    if (!same(0, -1)) {
      k.fillStyle = rgba('#ffffff', 0.5)
      k.fillRect(px, py, CELL, 1)
    }
    if (!same(-1, 0)) {
      k.fillStyle = rgba('#ffffff', 0.32)
      k.fillRect(px, py, 1, CELL)
    }
    if (!same(0, 1)) {
      k.fillStyle = rgba(INK, 0.55)
      k.fillRect(px, py + CELL - 1, CELL, 1)
    }
    if (!same(1, 0)) {
      k.fillStyle = rgba(INK, 0.4)
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
    const frame = Math.floor(this.tick / 3) % SPARKS.length
    if (s.wild) {
      glow(g, x, y, 14 + frame * 2, RAMPS.gold[3], 0.75)
      drawSprite(g, WILD_SPARKS[frame]!, x, y)
      return
    }
    glow(g, x, y, 11, RAMPS.ember[3], 0.6)
    drawSprite(g, SPARKS[frame]!, x, y)
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
    if (this.treadle > 0) glow(g, x, y, 10, RAMPS.gold[4], 0.3)
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
      5,
      barW,
      4,
      share / 100,
      share >= this.target ? RAMPS.gold : RAMPS.leaf,
    )
    const mark = barX + Math.round((barW * this.target) / 100)
    g.fillStyle = INK
    g.fillRect(mark - 1, 3, 3, 8)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(mark, 4, 1, 6)
    // The stitch clock: teal, then flashing ember in its last quarter, then the wildfire.
    const left = this.clock / this.clockMax
    const flashing = this.tick % 16 < 8
    const clockRamp = this.wildfire
      ? flashing
        ? RAMPS.gold
        : RAMPS.ember
      : left < CLOCK_WARN
        ? flashing
          ? RAMPS.ember
          : RAMPS.rust
        : left > 1
          ? RAMPS.pink
          : RAMPS.teal
    gauge(
      g,
      barX,
      11,
      barW,
      2,
      this.wildfire ? 1 : Math.min(1, left),
      clockRamp,
    )
    drawText(
      g,
      this.wildfire && flashing
        ? 'WILDFIRE'
        : `${Math.floor(this.claimed)} OF ${Math.round(this.target)}`,
      128,
      15,
      {
        align: 'center',
        color: this.wildfire ? RAMPS.gold[4] : RAMPS.teal[4],
        outline: INK,
      },
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
    this.renderStatus(g)
    if (this.banner) {
      const { text, sub, sub2 } = this.banner
      const w =
        Math.max(
          measureText(text, 2),
          sub ? measureText(sub) : 0,
          sub2 ? measureText(sub2) : 0,
        ) + 20
      const h = sub2 ? 50 : sub ? 38 : 26
      hudPanel(g, Math.round(W / 2 - w / 2), H / 2 - 22, w, h)
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
      if (sub2)
        drawText(g, sub2, W / 2, H / 2 + 16, {
          align: 'center',
          color: RAMPS.teal[3],
          outline: INK,
        })
    }
  }

  /** Chips along the bottom of the cloth: the multiplier, thimbles and running power-ups. */
  private renderStatus(g: CanvasRenderingContext2D) {
    const chips: Array<{ text: string; ramp: Ramp }> = []
    if (this.mult > 1) chips.push({ text: `X${this.mult}`, ramp: RAMPS.gold })
    if (this.thimbles > 0)
      chips.push({
        text: `THIMBLE${this.thimbles > 1 ? ` X${this.thimbles}` : ''}`,
        ramp: RAMPS.steel,
      })
    const timed: Array<[number, PowerUpKind]> = [
      [this.treadle, 'treadle'],
      [this.pausePin, 'pause'],
      [this.magnet, 'magnet'],
    ]
    for (const [ticks, kind] of timed)
      if (ticks > 0)
        chips.push({
          text: `${POWER_UPS[kind].name} ${Math.ceil(ticks / 60)}`,
          ramp: BUTTON_LOOK[kind].ramp,
        })
    let x = OX + 3
    const y = OY + FIELD_H - 12
    for (const chip of chips) {
      const w = measureText(chip.text) + 8
      hudPanel(g, x, y, w, 10, chip.ramp)
      drawText(g, chip.text, x + 4, y + 2, { color: '#ffffff', outline: INK })
      x += w + 4
    }
  }
}
const quiltQuest: ArcadeGameModule = {
  create: (options) => new QuiltQuest(options),
}

export const create = quiltQuest.create
export default quiltQuest

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
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  type PixelSprite,
  type Ramp,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  vignette,
} from '../snes'
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

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/**
 * Each board's circuit: the wall slabs' ramp, the banded board under them, and the etched
 * traces. Boards cycle through these, so a new board reads as a new circuit.
 */
type BoardTheme = {
  wall: Ramp
  floor: readonly string[]
  trace: string
  pad: string
}

function boardTheme(wall: Ramp): BoardTheme {
  const base = mix(wall[0], RAMPS.night[0], 0.55)
  return {
    wall,
    floor: [
      mix(wall[0], RAMPS.night[1], 0.2),
      base,
      mix(base, RAMPS.night[0], 0.5),
      RAMPS.night[0],
    ],
    trace: mix(wall[1], base, 0.45),
    pad: mix(wall[2], base, 0.45),
  }
}

const THEMES: readonly BoardTheme[] = [
  boardTheme(RAMPS.teal),
  boardTheme(RAMPS.purple),
  boardTheme(RAMPS.sky),
  boardTheme(RAMPS.leaf),
]

/** The cable's insulation, top (lit) row to bottom (shadow) row across its 6px width. */
const TUBE = [
  RAMPS.steel[3],
  RAMPS.steel[4],
  RAMPS.steel[3],
  RAMPS.sky[3],
  RAMPS.steel[2],
  RAMPS.steel[1],
] as const
/** The same rows while an energy pulse runs through: the core lights up. */
const TUBE_LIT = [
  RAMPS.steel[3],
  RAMPS.steel[4],
  RAMPS.sky[4],
  '#ffffff',
  RAMPS.sky[3],
  RAMPS.steel[1],
] as const

const PLUG_PALETTE = {
  H: RAMPS.steel[4],
  L: RAMPS.steel[3],
  B: RAMPS.steel[2],
  S: RAMPS.steel[1],
  k: INK,
  w: '#ffffff',
  p: RAMPS.pink[3],
  r: RAMPS.pink[2],
  G: RAMPS.gold[2],
  y: RAMPS.gold[4],
  d: RAMPS.gold[1],
  c: RAMPS.teal[4],
}

/** The plug's 8x8 housing: a little face that chomps (mouth open on the second frame). */
function plugHousing(open: boolean): string[] {
  return [
    '.HHHHHH.',
    'HLLLLLLB',
    'HLwkLwkB',
    'HLkkLkkB',
    open ? 'HpLkkLpB' : 'HpLLLLpB',
    open ? 'HLLrrLLB' : 'HLLkkLLB',
    'BBBBBBBS',
    '.SSSSSS.',
  ]
}

type Facing = 'side' | 'up' | 'down'

/**
 * The plug head for a facing, its gold prongs pointing the way it crawls. On the chomp frame a
 * spark jumps between the prong tips. Left is the side art mirrored; nothing is rotated.
 */
function plugRows(facing: Facing, open: boolean): string[] {
  const housing = plugHousing(open)
  if (facing === 'side') {
    const prongs = [
      '...',
      'Gyy',
      'Gdd',
      open ? '..c' : '...',
      open ? '..c' : '...',
      'Gyy',
      'Gdd',
      '...',
    ]
    return housing.map((row, i) => row + prongs[i]!)
  }
  const tip = open ? '.ydccyd.' : '.yd..yd.'
  if (facing === 'up') return [tip, '.yd..yd.', '.GG..GG.', ...housing]
  return [...housing, '.GG..GG.', '.yd..yd.', tip]
}

const PLUG: Record<Facing, readonly [PixelSprite, PixelSprite]> = {
  side: [
    pixelSprite(plugRows('side', false), PLUG_PALETTE),
    pixelSprite(plugRows('side', true), PLUG_PALETTE),
  ],
  up: [
    pixelSprite(plugRows('up', false), PLUG_PALETTE),
    pixelSprite(plugRows('up', true), PLUG_PALETTE),
  ],
  down: [
    pixelSprite(plugRows('down', false), PLUG_PALETTE),
    pixelSprite(plugRows('down', true), PLUG_PALETTE),
  ],
}

/**
 * The cable's elbow at a bend, for each pair of directions it bends between (`hx` the side its
 * horizontal run leaves by, `vy` the vertical one). Each pixel takes the shading of the run it
 * sits nearer, so the lit edge carries round the bend in a mitre, and the outer corner is inked
 * off to round it.
 */
function elbowRows(hx: number, vy: number): string[] {
  const rows: string[] = []
  for (let r = 0; r < 6; r++) {
    let row = ''
    for (let c = 0; c < 6; c++) {
      const outer = c === (hx > 0 ? 0 : 5) && r === (vy > 0 ? 0 : 5)
      const toSide = hx > 0 ? 5 - c : c
      const toEnd = vy > 0 ? 5 - r : r
      row += outer ? 'k' : String(toSide < toEnd ? r : c)
    }
    rows.push(row)
  }
  return rows
}

function elbowSprites(tube: readonly string[]) {
  const palette: Record<string, string> = { k: INK }
  tube.forEach((colour, i) => (palette[String(i)] = colour))
  const make = (hx: number, vy: number) =>
    pixelSprite(elbowRows(hx, vy), palette, { outline: null })
  return {
    '1,1': make(1, 1),
    '1,-1': make(1, -1),
    '-1,1': make(-1, 1),
    '-1,-1': make(-1, -1),
  } as Record<string, PixelSprite>
}

const ELBOWS = elbowSprites(TUBE)
const ELBOWS_LIT = elbowSprites(TUBE_LIT)

/** A spare cable for the HUD: a tiny plug. */
const LIFE_SPRITE = pixelSprite(
  ['.HHH...', 'HLLLBGy', 'HkLkB..', 'HLLLBGy', '.SSS...'],
  PLUG_PALETTE,
)

const SPARK_PALETTE = {
  w: '#ffffff',
  H: RAMPS.gold[4],
  Y: RAMPS.gold[3],
  G: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
/** A spark: a shaded little energy bead, and its twinkle with a white-hot centre. */
const SPARK_SPRITES = [
  pixelSprite(['.HY.', 'HwYG', 'YYGd', '.Gd.'], SPARK_PALETTE),
  pixelSprite(['.HH.', 'HwwY', 'HwYG', '.YG.'], SPARK_PALETTE),
] as const

const COIN_PALETTE = {
  ...SPARK_PALETTE,
  D: RAMPS.gold[0],
  b: RAMPS.rust[2],
}
/** The golden spark: a bolt coin that spins (full face, then edge-on). */
const GOLD_SPRITES = [
  pixelSprite(
    [
      '..HHYG..',
      '.HYYwYG.',
      'HYYwwYGd',
      'HYwwwwGd',
      'YGGwwGGd',
      'YGGwGGdD',
      '.GGGGdD.',
      '..dddD..',
    ],
    COIN_PALETTE,
  ),
  pixelSprite(
    [
      '...HY...',
      '..HYwG..',
      '..HwwG..',
      '..YwwG..',
      '..YwwG..',
      '..YwGd..',
      '..GGdD..',
      '...dD...',
    ],
    COIN_PALETTE,
  ),
] as const

const glowStamps = new Map<string, HTMLCanvasElement | null>()

/**
 * A soft additive glow baked once to an offscreen canvas, for lights drawn by the hundred (every
 * spark, every lit cable segment). Null headless, where the glow is simply skipped.
 */
function glowStamp(
  colour: string,
  r: number,
  alpha: number,
): HTMLCanvasElement | null {
  const id = `${colour}:${r}:${alpha}`
  let stamp = glowStamps.get(id)
  if (stamp === undefined) {
    stamp = null
    if (typeof document !== 'undefined') {
      const size = Math.ceil(r * 8)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const sg = canvas.getContext('2d')
      if (sg) {
        const grad = sg.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2,
        )
        grad.addColorStop(0, rgba(colour, alpha))
        grad.addColorStop(1, rgba(colour, 0))
        sg.fillStyle = grad
        sg.fillRect(0, 0, size, size)
        stamp = canvas
      }
    }
    glowStamps.set(id, stamp)
  }
  return stamp
}

/** An offscreen canvas for the board, or null headless. */
function boardCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  return canvas
}

/**
 * The static circuit board, painted once per layout: a banded board etched with faint traces
 * down the middle of every corridor and a solder pad under every spark, shadows the walls cast
 * down and right, and the walls as raised slabs, lit on their top and left edges and shadowed on
 * their bottom and right, outlined in ink, with gold pin-one dots like chips on a board.
 */
function paintBoard(
  k: CanvasRenderingContext2D,
  walls: readonly boolean[],
  theme: BoardTheme,
) {
  const { wall: ramp } = theme
  const isWall = (x: number, y: number) =>
    x < 0 || y < 0 || x >= COLS || y >= ROWS || walls[key(x, y)] === true
  bandedGradient(k, 0, 0, W, HUD_H, [RAMPS.night[2], RAMPS.night[0]], 2)
  bandedGradient(k, 0, HUD_H, W, ROWS * TILE, theme.floor, 4)

  // Etched traces through every corridor, and a pad on every spark socket.
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (isWall(x, y)) continue
      const cx = x * TILE + TILE / 2
      const cy = HUD_H + y * TILE + TILE / 2
      k.fillStyle = theme.trace
      if (!isWall(x + 1, y)) k.fillRect(cx, cy, TILE, 1)
      if (!isWall(x, y + 1)) k.fillRect(cx, cy, 1, TILE)
      if ((x + y) % 2 === 0) {
        k.fillStyle = theme.pad
        k.fillRect(cx - 2, cy - 2, 4, 4)
        k.fillStyle = RAMPS.night[0]
        k.fillRect(cx - 1, cy - 1, 2, 2)
      }
    }

  // Walls cast their shadow down and to the right onto the board.
  k.fillStyle = rgba(INK, 0.45)
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (isWall(x, y)) continue
      const px = x * TILE
      const py = HUD_H + y * TILE
      if (isWall(x, y - 1)) k.fillRect(px, py, TILE, 2)
      if (isWall(x - 1, y))
        k.fillRect(
          px,
          py + (isWall(x, y - 1) ? 2 : 0),
          2,
          TILE - (isWall(x, y - 1) ? 2 : 0),
        )
    }

  const face = ramp[2]
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (!isWall(x, y)) continue
      const px = x * TILE
      const py = HUD_H + y * TILE
      const up = !isWall(x, y - 1)
      const down = !isWall(x, y + 1)
      const left = !isWall(x - 1, y)
      const right = !isWall(x + 1, y)
      k.fillStyle = face
      k.fillRect(px, py, TILE, TILE)
      // The slab's sides: shadowed below and to the right, lit above and to the left.
      k.fillStyle = ramp[0]
      if (down) k.fillRect(px, py + TILE - 3, TILE, 2)
      k.fillStyle = ramp[1]
      if (right) k.fillRect(px + TILE - 3, py, 2, TILE - (down ? 3 : 0))
      if (up) {
        k.fillStyle = ramp[4]
        k.fillRect(px, py + 1, TILE, 1)
        k.fillStyle = ramp[3]
        k.fillRect(px, py + 2, TILE, 1)
      }
      if (left) {
        k.fillStyle = ramp[3]
        k.fillRect(
          px + 1,
          py + (up ? 1 : 0),
          1,
          TILE - (up ? 1 : 0) - (down ? 3 : 0),
        )
      }
      // Concave corners carry the lit edge and the shadow round the bend.
      if (!up && !left && !isWall(x - 1, y - 1)) {
        k.fillStyle = ramp[4]
        k.fillRect(px, py, 2, 1)
        k.fillRect(px, py, 1, 2)
      }
      if (!down && !right && !isWall(x + 1, y + 1)) {
        k.fillStyle = ramp[0]
        k.fillRect(px + TILE - 3, py + TILE - 3, 3, 3)
      }
      k.fillStyle = INK
      if (up) k.fillRect(px, py, TILE, 1)
      if (down) k.fillRect(px, py + TILE - 1, TILE, 1)
      if (left) k.fillRect(px, py, 1, TILE)
      if (right) k.fillRect(px + TILE - 1, py, 1, TILE)
      if (!up && !left && !isWall(x - 1, y - 1)) k.fillRect(px, py, 1, 1)
      if (!up && !right && !isWall(x + 1, y - 1))
        k.fillRect(px + TILE - 1, py, 1, 1)
      if (!down && !left && !isWall(x - 1, y + 1))
        k.fillRect(px, py + TILE - 1, 1, 1)
      if (!down && !right && !isWall(x + 1, y + 1))
        k.fillRect(px + TILE - 1, py + TILE - 1, 1, 1)
      // Chips stand on silver legs along their left and right sides.
      const frameCell = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1
      if (!frameCell)
        for (const ly of [3, 6]) {
          if (left) {
            k.fillStyle = RAMPS.steel[3]
            k.fillRect(px - 1, py + ly, 1, 1)
            k.fillStyle = RAMPS.steel[1]
            k.fillRect(px - 1, py + ly + 1, 1, 1)
          }
          if (right) {
            k.fillStyle = RAMPS.steel[2]
            k.fillRect(px + TILE, py + ly, 1, 1)
            k.fillStyle = RAMPS.steel[0]
            k.fillRect(px + TILE, py + ly + 1, 1, 1)
          }
        }
      // Rounded outer corners: a pixel of board shows through.
      const corner = (cx: number, cy: number) => {
        k.fillStyle = theme.floor[1]!
        k.fillRect(cx, cy, 1, 1)
      }
      if (up && left) corner(px, py)
      if (up && right) corner(px + TILE - 1, py)
      if (down && left) corner(px, py + TILE - 1)
      if (down && right) corner(px + TILE - 1, py + TILE - 1)
      // A gold pin-one dot on each chip's top-left cell, and contact pads along the frame.
      const pinOne = !frameCell && up && left
      const contact = frameCell && (x * 7 + y * 3) % 5 === 0
      if (pinOne || contact) {
        const ox = px + (pinOne ? 3 : 4)
        const oy = py + (pinOne ? 4 : 4)
        k.fillStyle = INK
        k.fillRect(ox, oy, 3, 3)
        k.fillStyle = RAMPS.gold[2]
        k.fillRect(ox, oy, 2, 2)
        k.fillStyle = RAMPS.gold[4]
        k.fillRect(ox, oy, 1, 1)
      }
    }
}

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
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  /** Small eat sparkles, drawn under the cable so they never wash out the plug's face. */
  private crumbs = new Sparkles()
  private fxRng = backdropRng(53)
  /**
   * This instance's board, painted once per layout onto one canvas that is reused for every
   * new board (headless there is no canvas, and the board paints straight onto the frame).
   */
  private boardArt: {
    walls: boolean[]
    canvas: HTMLCanvasElement | null
  } | null = null

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
      this.crumbs.burst(px, py, this.fxRng, {
        count: 3,
        speed: 0.9,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.sky[4]],
      })
      if (this.sparks.size === 0) this.boardClear()
    }
    if (this.gold && this.gold.k === k) {
      this.gold = null
      this.addScore(GOLD_POINTS * this.level, px, py - 8, true)
      this.burst(px, py, '#fde047', 14)
      this.fx.burst(px, py, this.fxRng, { count: 16, speed: 2.2 })
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
    for (let i = 0; i < 6; i++)
      this.fx.burst(
        TILE * 2 + this.fxRng() * (W - TILE * 4),
        HUD_H + TILE * 2 + this.fxRng() * (ROWS - 4) * TILE,
        this.fxRng,
        { count: 10, speed: 2 },
      )
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
    this.fx.burst(
      head.x * TILE + TILE / 2,
      HUD_H + head.y * TILE + TILE / 2,
      this.fxRng,
      {
        count: 10,
        speed: 2.4,
        colours: [RAMPS.teal[4], RAMPS.sky[4], '#ffffff'],
      },
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
    this.fx.update()
    this.crumbs.update()
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
    const theme = THEMES[(this.level - 1) % THEMES.length]!
    if (!this.boardArt || this.boardArt.walls !== this.walls) {
      const canvas = boardCanvas()
      const board = canvas?.getContext('2d')
      if (canvas && board) paintBoard(board, this.walls, theme)
      this.boardArt = { walls: this.walls, canvas: board ? canvas : null }
    }
    if (this.boardArt.canvas) {
      g.save()
      g.imageSmoothingEnabled = false
      g.drawImage(this.boardArt.canvas, 0, 0)
      g.restore()
    } else {
      paintBoard(g, this.walls, theme)
    }
    this.renderSparks(g)
    if (
      this.gold &&
      (this.gold.life > 90 || Math.floor(this.gold.life / 6) % 2)
    )
      this.renderGold(g, this.gold.k)
    this.crumbs.render(g)
    if (this.dead === 0 || Math.floor(this.dead / 5) % 2) this.renderCable(g)
    // The game's own bursts: hot little sparks drawn as light.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 1)
    }
    g.restore()
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private centre(k: number) {
    return {
      x: (k % COLS) * TILE + TILE / 2,
      y: HUD_H + Math.floor(k / COLS) * TILE + TILE / 2,
    }
  }

  /** Every spark: a baked glow under it, and a twinkle running across the board. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const stamp = glowStamp(RAMPS.gold[3], 3, 0.45)
    if (stamp) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (const k of this.sparks) {
        const { x, y } = this.centre(k)
        g.drawImage(stamp, x - 6, y - 6, 12, 12)
      }
      g.restore()
    }
    for (const k of this.sparks) {
      const { x, y } = this.centre(k)
      const twinkle = (this.tick + k * 7) % 40 < 8
      drawSprite(g, SPARK_SPRITES[twinkle ? 1 : 0], x, y)
      if (twinkle) {
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.fillStyle = rgba(RAMPS.gold[4], 0.8)
        g.fillRect(x - 4, y, 2, 1)
        g.fillRect(x + 2, y - 1, 2, 1)
        g.fillRect(x - 1, y - 4, 1, 2)
        g.fillRect(x, y + 2, 1, 2)
        g.restore()
      }
    }
  }

  /** The golden spark: a spinning bolt coin bobbing over its own shadow, in a pulsing glow. */
  private renderGold(g: CanvasRenderingContext2D, k: number) {
    const { x, y } = this.centre(k)
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 5)
    const bob = Math.round(Math.sin(this.tick / 9) * 1.5)
    glow(g, x, y, 11 + pulse * 4, RAMPS.gold[3], 0.45 + pulse * 0.25)
    g.fillStyle = rgba(INK, 0.45)
    g.fillRect(x - 3, y + 4, 6, 2)
    const frame = Math.floor(this.tick / 10) % 4 === 3 ? 1 : 0
    drawSprite(g, GOLD_SPRITES[frame], x, y - 1 + bob)
  }

  /**
   * The cable as a shaded tube built from crisp runs: a drop shadow on the board, an ink
   * outline, insulation lit along its top and left, an energy pulse lighting the core as it runs
   * from tail to plug, pink cable ties every few cells, and the plug head sprite for its facing.
   */
  private renderCable(g: CanvasRenderingContext2D) {
    const pts = this.body.map((c) => ({
      x: c.x * TILE + TILE / 2,
      y: HUD_H + c.y * TILE + TILE / 2,
    }))
    const n = pts.length
    const run = (i: number, hw: number, dx = 0, dy = 0) => {
      const a = pts[i]!
      const b = pts[Math.min(n - 1, i + 1)]!
      g.fillRect(
        Math.min(a.x, b.x) - hw + dx,
        Math.min(a.y, b.y) - hw + dy,
        Math.abs(a.x - b.x) + hw * 2,
        Math.abs(a.y - b.y) + hw * 2,
      )
    }
    // A pulse of light runs down the cable from the tail to the plug.
    const pulseAt = n - 1 - (Math.floor(this.tick / 2) % (n + 10))
    const lit = (i: number) => i >= pulseAt - 1 && i <= pulseAt + 1

    g.fillStyle = rgba(INK, 0.4)
    for (let i = 0; i < n; i++) run(i, 3, 2, 2)
    // A soft glow off the insulation (colour math), stronger where the pulse is.
    const soft = glowStamp(RAMPS.sky[3], 4, 0.18)
    const hot = glowStamp(RAMPS.sky[4], 5, 0.5)
    if (soft && hot) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (let i = 0; i < n; i += 2) {
        const p = pts[i]!
        g.drawImage(soft, p.x - 12, p.y - 12, 24, 24)
      }
      for (let i = 0; i < n; i++) {
        if (i !== pulseAt) continue
        const p = pts[i]!
        g.drawImage(hot, p.x - 16, p.y - 16, 32, 32)
      }
      g.restore()
    }
    g.fillStyle = INK
    for (let i = 0; i < n; i++) run(i, 4)
    // Insulation, row by row: vertical runs first so bends take the lit top edge.
    const shade = (vertical: boolean) => {
      for (let i = 0; i < n; i++) {
        const a = pts[i]!
        const b = pts[Math.min(n - 1, i + 1)]!
        if ((a.x === b.x) !== vertical) continue
        const rows = lit(i) ? TUBE_LIT : TUBE
        for (let r = 0; r < 6; r++) {
          g.fillStyle = rows[r]!
          if (vertical)
            g.fillRect(
              a.x - 3 + r,
              Math.min(a.y, b.y) - 3,
              1,
              Math.abs(a.y - b.y) + 6,
            )
          else
            g.fillRect(
              Math.min(a.x, b.x) - 3,
              a.y - 3 + r,
              Math.abs(a.x - b.x) + 6,
              1,
            )
        }
      }
    }
    shade(true)
    shade(false)
    // Elbows at the bends, so the shading carries round where two runs meet.
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i]!
      const prev = pts[i - 1]!
      const next = pts[i + 1]!
      if (prev.x === next.x || prev.y === next.y) continue
      const side = prev.y === p.y ? prev : next
      const end = prev.x === p.x ? prev : next
      const elbows = lit(i) || lit(i - 1) ? ELBOWS_LIT : ELBOWS
      const sprite =
        elbows[`${Math.sign(side.x - p.x)},${Math.sign(end.y - p.y)}`]
      if (sprite) drawSprite(g, sprite, p.x - 3, p.y - 3, { anchor: 'topleft' })
    }
    // Cable ties: pink bands, wrapped round a straight stretch every four cells.
    for (let i = 4; i < n - 1; i += 4) {
      const prev = pts[i - 1]!
      const p = pts[i]!
      const next = pts[i + 1]!
      const horizontal = prev.y === p.y && next.y === p.y
      const vertical = prev.x === p.x && next.x === p.x
      if (!horizontal && !vertical) continue
      if (horizontal) {
        g.fillStyle = INK
        g.fillRect(p.x - 2, p.y - 4, 4, 8)
        g.fillStyle = RAMPS.pink[3]
        g.fillRect(p.x - 1, p.y - 3, 1, 6)
        g.fillStyle = RAMPS.pink[1]
        g.fillRect(p.x, p.y - 3, 1, 6)
        g.fillStyle = RAMPS.pink[4]
        g.fillRect(p.x - 1, p.y - 2, 1, 1)
      } else {
        g.fillStyle = INK
        g.fillRect(p.x - 4, p.y - 2, 8, 4)
        g.fillStyle = RAMPS.pink[3]
        g.fillRect(p.x - 3, p.y - 1, 6, 1)
        g.fillStyle = RAMPS.pink[1]
        g.fillRect(p.x - 3, p.y, 6, 1)
        g.fillStyle = RAMPS.pink[4]
        g.fillRect(p.x - 2, p.y - 1, 1, 1)
      }
    }
    // The plug head, prongs leading, chomping as it crawls.
    const head = pts[0]!
    const d = this.dir
    const facing: Facing = d.dy < 0 ? 'up' : d.dy > 0 ? 'down' : 'side'
    const step = levelCurve(this.level, CABLE_CURVES.step)
    const chomp = this.dead === 0 && this.stepTimer < step / 2 ? 1 : 0
    const sprite = PLUG[facing][chomp]
    // Line the 8x8 housing (plus its outline) up on the cell; the prongs stick out ahead.
    const left =
      facing === 'side' && d.dx < 0 ? head.x + 5 - sprite.width : head.x - 5
    const top = facing === 'up' ? head.y + 5 - sprite.height : head.y - 5
    glow(
      g,
      head.x + d.dx * 6,
      head.y + d.dy * 6,
      9,
      RAMPS.teal[3],
      chomp ? 0.5 : 0.25,
    )
    drawSprite(g, sprite, left, top, {
      anchor: 'topleft',
      flipX: facing === 'side' && d.dx < 0,
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score on the left, high score and board on the right, the battery and spares between.
    const score = String(this.score).padStart(6, '0')
    const scoreW = measureText(score, 2) + 12
    hudPanel(g, 2, 2, scoreW, 20)
    drawText(g, score, 8, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const board = `BOARD ${this.level}`
    const rightW = Math.max(measureText(hi), measureText(board)) + 10
    const rightX = W - 2 - rightW
    hudPanel(g, rightX, 2, rightW, 20)
    drawText(g, hi, W - 7, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, board, W - 7, 13, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    // The battery: a gauge with a terminal nub, running green to gold to red, blinking when low.
    const midX = scoreW + 5
    const midW = rightX - 3 - midX
    hudPanel(g, midX, 2, midW, 20, RAMPS.night)
    const frac = this.batteryMax ? this.battery / this.batteryMax : 0
    const ramp =
      frac > 0.3 ? RAMPS.leaf : frac > 0.15 ? RAMPS.gold : RAMPS.ember
    const low = frac <= 0.15 && Math.floor(this.tick / 10) % 2 === 0
    const gaugeX = midX + 6
    const gaugeW = 36
    gauge(g, gaugeX, 8, gaugeW, 8, frac, ramp)
    bevel(g, gaugeX + gaugeW + 1, 10, 3, 4, RAMPS.steel, { depth: 1 })
    if (low) glow(g, gaugeX + gaugeW / 2, 12, 16, RAMPS.ember[2], 0.45)
    // Battery segment marks, so the drain reads as cells going flat.
    g.fillStyle = rgba(INK, 0.55)
    for (let i = 1; i < 4; i++)
      g.fillRect(gaugeX + Math.round((gaugeW * i) / 4), 8, 1, 8)
    const spares = Math.min(this.lives - 1, 4)
    for (let i = 0; i < spares; i++)
      drawSprite(g, LIFE_SPRITE, gaugeX + gaugeW + 13 + i * 9, 12)
    if (this.banner) {
      const bannerW =
        Math.max(
          measureText(this.banner.text, 2),
          this.banner.sub ? measureText(this.banner.sub) : 0,
        ) + 16
      hudPanel(
        g,
        Math.round(W / 2 - bannerW / 2),
        90,
        bannerW,
        this.banner.sub ? 38 : 26,
      )
      drawText(g, this.banner.text, W / 2, 96, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.teal[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 116, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
    }
  }
}

const cableCrawler: ArcadeGameModule = {
  create: (options) => new CableCrawler(options),
}

export const create = cableCrawler.create
export default cableCrawler

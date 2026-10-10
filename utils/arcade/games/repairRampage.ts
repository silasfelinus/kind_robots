// /utils/arcade/games/repairRampage.ts
//
// Repair Rampage -- the Kind Robots Arcade's Rampage riff, turned around
// (conductor kr-arcade/t-009 game factory). A storm has wrecked the city's
// towers. Bolt, a giant friendly robot, climbs their faces and fixes them
// window by window, rescues kittens stranded on the ledges, and shoos the news
// drones whose flashbulbs dazzle it right off the wall.
//
// Each city has taller, more broken towers and busier drones, and a tower
// with broken windows slowly loses its footing: it wobbles when it's close and
// falls if you dawdle. Walk with left/right, press Up at a tower to grab on,
// climb with the arrows, A fixes the window you're on (or shoos a drone right
// beside you). Dazzles and long falls cost charge; run out and it's game over.

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
  drawCloud,
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
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND = 222
const CELL = 16
const TOWER_COLS = 3
const TOWER_W = TOWER_COLS * CELL + 8
const WALK_SPEED = 1.5
const CLIMB_TICKS = 8
const FIX_COOLDOWN = 8
const MAX_CHARGE = 100
const DAZZLE_COST = 15
const FALL_COST = 10
const COLLAPSE_COST = 20
const WOBBLE_AT = 60 * 10
const FIX_STEADY = 30
const HOLD_GRACE = 60 * 10
/** A fallen tower costs the charge Bolt spends shoring up the rubble. */
const TOWER_DOWN_COST = 25
/** Bolt's charge runs down a point at a time while it works. */
const DRAIN_TICKS = 120
const CLEAR_TICKS = 150

const FIX_POINTS = 100
const SHOO_POINTS = 150
const KITTEN_POINTS = 500

export const RAMPAGE_CURVES = {
  towers: { start: 2, step: 0.5, limit: 4 },
  rows: { start: 6, step: 1, limit: 11 },
  broken: { start: 0.45, step: 0.08, limit: 0.9 },
  /** Seconds a tower holds for each broken window (plus a grace period). */
  holdPerWindow: { start: 2.6, step: -0.15, limit: 1.1 },
  droneEvery: { start: 360, step: -40, limit: 90 },
  droneSpeed: { start: 0.8, step: 0.15, limit: 2.2 },
  maxDrones: { start: 2, step: 0.5, limit: 5 },
} as const

type Tower = {
  x: number
  rows: number
  /** windows[row * TOWER_COLS + col]: true when fixed. Row 0 is the bottom. */
  windows: boolean[]
  stability: number
  maxStability: number
  standing: boolean
  dust: number
}
type Drone = {
  x: number
  y: number
  dir: 1 | -1
  speed: number
  warn: number
  flashed: boolean
  leaving: boolean
}
type Kitten = { tower: number; index: number; ticks: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function windowY(row: number): number {
  return GROUND - (row + 1) * CELL - 4
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A sprite sheet painted with rectangles, boxes and lines of palette letters. */
class PixelGrid {
  private cells: string[][]

  constructor(
    private w: number,
    private h: number,
    /** Added to every x, so art can be drawn in body-centred coordinates. */
    private ox = 0,
  ) {
    this.cells = Array.from({ length: h }, () => new Array<string>(w).fill('.'))
  }

  put(x: number, y: number, c: string) {
    const cx = x + this.ox
    if (cx < 0 || cx >= this.w || y < 0 || y >= this.h) return
    this.cells[y]![cx] = c
  }

  fill(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.put(x + i, y + j, c)
  }

  /** A lit block: `set` is [highlight, lit edge, face, shade edge, deep shade]. */
  box(x: number, y: number, w: number, h: number, set = 'hHTtd') {
    this.fill(x, y, w, h, set[2]!)
    this.fill(x + w - 1, y, 1, h, set[3]!)
    this.fill(x, y + h - 1, w, 1, set[4]!)
    this.fill(x, y, 1, h - 1, set[1]!)
    this.fill(x, y, w - 1, 1, set[0]!)
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= steps; i++) {
      this.put(
        Math.round(x0 + ((x1 - x0) * i) / steps),
        Math.round(y0 + ((y1 - y0) * i) / steps),
        c,
      )
    }
  }

  rows(): string[] {
    return this.cells.map((r) => r.join(''))
  }
}

const SKY_STOPS = [
  RAMPS.night[1],
  RAMPS.night[2],
  RAMPS.purple[0],
  RAMPS.purple[1],
  '#7a2a8a',
  RAMPS.pink[1],
  RAMPS.pink[2],
  RAMPS.rust[3],
  RAMPS.gold[3],
]
const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]
const SUN = { x: W / 2, y: 122, r: 26 }
const DUSK_CLOUD: Ramp = ['#1f1a52', '#4c2a80', '#6a3a92', '#a8549c', '#e07aa6']
const STARS = starField(83, 46, W, 92)
const CLOUDS = (() => {
  const rand = backdropRng(61)
  return Array.from({ length: 4 }, (_, i) => ({
    x: i * 96 + rand() * 40,
    y: 64 + rand() * 46,
    size: 6 + rand() * 5,
    speed: 0.04 + rand() * 0.05,
  }))
})()

type Building = { x: number; w: number; h: number; seed: number }
function skyline(
  seed: number,
  minW: number,
  maxW: number,
  minH: number,
  maxH: number,
): Building[] {
  const rand = backdropRng(seed)
  const out: Building[] = []
  for (let x = -6; x < W;) {
    const w = Math.round(minW + rand() * (maxW - minW))
    out.push({
      x,
      w,
      h: Math.round(minH + rand() * (maxH - minH)),
      seed: Math.floor(rand() * 1e6),
    })
    x += w + Math.floor(rand() * 3)
  }
  return out
}
const FAR_SKYLINE = skyline(17, 12, 26, 44, 96)
const NEAR_SKYLINE = skyline(29, 18, 34, 22, 62)
/** Aviation lights on the far skyline's tallest roofs. */
const BEACONS = [...FAR_SKYLINE]
  .sort((a, b) => b.h - a.h)
  .slice(0, 4)
  .map((b, i) => ({
    x: b.x + Math.floor(b.w / 2),
    y: GROUND - b.h - 4,
    phase: i * 17,
  }))

/** The towers' masonry: cool steel, dusk violet and terracotta. */
const TOWER_RAMPS: readonly Ramp[] = [
  RAMPS.steel,
  ['#1a1440', '#2f2866', '#4f4594', '#8a7cc8', '#d4ccff'],
  ['#2a1418', '#52262a', '#83403c', '#b8705e', '#f0b89a'],
]

/** Window glass, 12x12 to fit the frame: lit and mended, or dark and cracked. */
const GLASS = CELL - 4
const LIT_PALETTE = {
  Y: mix(RAMPS.gold[3], RAMPS.gold[4], 0.5),
  y: RAMPS.gold[3],
  o: RAMPS.gold[2],
  d: RAMPS.rust[3],
  m: RAMPS.earth[1],
  W: '#ffffff',
  P: RAMPS.pink[2],
  p: RAMPS.pink[1],
  Q: RAMPS.pink[3],
  L: RAMPS.leaf[2],
  l: RAMPS.leaf[1],
  r: RAMPS.rust[1],
}
function litGlassRows(variant: 0 | 1 | 2): string[] {
  const gr = new PixelGrid(GLASS, GLASS)
  for (let y = 0; y < GLASS; y++) {
    gr.fill(0, y, GLASS, 1, y < 3 ? 'Y' : y < 6 ? 'y' : y < 9 ? 'o' : 'd')
  }
  if (variant === 1) {
    // Pink curtains, tied back.
    for (const x of [0, GLASS - 1]) {
      gr.fill(x, 0, 1, GLASS, 'P')
      for (let y = 1; y < GLASS; y += 2) gr.put(x, y, 'p')
      gr.put(x, 0, 'Q')
      gr.put(x ? x - 1 : 1, 6, 'P')
    }
  }
  if (variant === 2) {
    // A pot plant on the sill.
    gr.fill(1, 9, 3, 3, 'r')
    gr.fill(1, 6, 3, 3, 'L')
    gr.put(0, 7, 'L')
    gr.put(4, 6, 'l')
    gr.put(2, 5, 'L')
  }
  gr.fill(5, 0, 2, GLASS, 'm')
  gr.fill(0, 5, GLASS, 1, 'm')
  for (const px of [1, 8]) {
    gr.put(px, 1, 'W')
    gr.put(px + 1, 2, 'W')
    gr.put(px + 1, 1, 'W')
  }
  return gr.rows()
}
const LIT_GLASS = ([0, 1, 2] as const).map((v) =>
  pixelSprite(litGlassRows(v), LIT_PALETTE, { outline: null }),
)

const BROKEN_PALETTE = {
  N: RAMPS.night[2],
  n: RAMPS.night[1],
  r: RAMPS.night[3],
  c: RAMPS.steel[2],
  C: RAMPS.steel[4],
  h: '#05040f',
  m: RAMPS.earth[0],
}
function brokenGlassRows(
  ix: number,
  iy: number,
  ends: readonly (readonly [number, number])[],
): string[] {
  const gr = new PixelGrid(GLASS, GLASS)
  for (let y = 0; y < GLASS; y++) {
    for (let x = 0; x < GLASS; x++) {
      const streak = (x + y) % 11
      gr.put(x, y, streak === 8 || streak === 9 ? 'r' : y < 5 ? 'N' : 'n')
    }
  }
  gr.fill(5, 0, 2, GLASS, 'm')
  gr.fill(0, 5, GLASS, 1, 'm')
  for (const [ex, ey] of ends) gr.line(ix, iy, ex, ey, 'c')
  gr.fill(ix - 1, iy - 1, 3, 3, 'h')
  gr.put(ix + 1, iy + 1, 'h')
  for (const [sx, sy] of [
    [ix - 2, iy],
    [ix + 2, iy - 1],
    [ix, iy + 2],
    [ix + 1, iy - 2],
  ] as const)
    gr.put(sx, sy, 'C')
  return gr.rows()
}
const BROKEN_GLASS = [
  brokenGlassRows(3, 3, [
    [0, 9],
    [11, 1],
    [9, 11],
    [0, 0],
  ]),
  brokenGlassRows(8, 7, [
    [0, 4],
    [11, 11],
    [5, 0],
    [2, 11],
    [11, 2],
  ]),
  brokenGlassRows(6, 4, [
    [0, 2],
    [11, 6],
    [3, 11],
    [10, 11],
  ]),
].map((rows) => pixelSprite(rows, BROKEN_PALETTE, { outline: null }))

// Bolt: a 3/4 front view facing right (flipped to face left), a back view for climbing
// the facade, and wrench swings. Drawn in body-centred columns, 41 wide.
const BOLT_PALETTE = {
  h: RAMPS.teal[4],
  H: RAMPS.teal[3],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  j: RAMPS.steel[4],
  S: RAMPS.steel[3],
  s: RAMPS.steel[2],
  z: RAMPS.steel[1],
  v: RAMPS.night[0],
  n: RAMPS.night[4],
  Y: RAMPS.gold[3],
  W: '#ffffff',
  P: RAMPS.pink[2],
  Q: RAMPS.pink[4],
  p: RAMPS.pink[1],
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[1],
}
const STEEL_SET = 'jSssz'
type BoltPose = {
  view: 'front' | 'back'
  /** Hand height for each arm: 'down' at the side, or the arm's top row when raised. */
  left: 'down' | number
  right: 'down' | number | 'wind' | 'strike'
  /** Which leg is lifted mid-stride, if any. */
  lift: 'none' | 'left' | 'right'
}
function boltRows(pose: BoltPose): string[] {
  const gr = new PixelGrid(41, 36, 5)
  const arm = (x: number, hand: number, top: 'down' | number) => {
    if (top === 'down') {
      gr.box(x, 13, 3, 9)
      gr.box(hand, 22, 4, 3, STEEL_SET)
    } else {
      gr.box(x, top + 3, 3, 11 - top)
      gr.box(hand, top, 4, 3, STEEL_SET)
    }
  }
  const leg = (x: number, lifted: boolean) => {
    const drop = lifted ? 2 : 0
    gr.box(x, 24, 4, 8 - drop)
    gr.box(x - (x < 15 ? 1 : 0), 32 - drop, 5, 4, STEEL_SET)
  }
  arm(6, 5, pose.left)
  if (pose.right === 'wind') {
    gr.box(22, 6, 3, 9)
    gr.box(22, 3, 4, 3, STEEL_SET)
    gr.line(25, 3, 28, 0, 'S')
    gr.line(26, 3, 29, 0, 'z')
    gr.fill(28, 0, 3, 1, 'j')
    gr.put(30, 1, 'S')
  } else if (pose.right === 'strike') {
    gr.box(22, 13, 6, 3)
    gr.box(27, 12, 3, 5, STEEL_SET)
    gr.fill(30, 13, 3, 1, 'j')
    gr.fill(30, 14, 3, 1, 'z')
    gr.box(32, 10, 3, 3, STEEL_SET)
    gr.box(32, 15, 3, 3, STEEL_SET)
  } else {
    arm(22, 22, pose.right)
  }
  leg(10, pose.lift === 'left')
  leg(17, pose.lift === 'right')
  // Shoulder pads, torso and belt.
  gr.box(6, 12, 4, 3)
  gr.box(21, 12, 4, 3)
  gr.box(9, 12, 13, 12)
  gr.fill(9, 22, 13, 1, 'S')
  gr.fill(10, 23, 11, 1, 'z')
  // Head and antenna.
  gr.fill(15, 0, 2, 1, 'Y')
  gr.put(15, 0, 'W')
  gr.put(15, 1, 'S')
  gr.box(10, 2, 11, 9)
  gr.fill(13, 11, 5, 1, 'z')
  if (pose.view === 'front') {
    gr.put(15, 22, 'Y')
    // The chest heart.
    gr.fill(13, 15, 2, 1, 'P')
    gr.fill(16, 15, 2, 1, 'P')
    gr.fill(13, 16, 5, 1, 'P')
    gr.fill(14, 17, 3, 1, 'P')
    gr.put(15, 18, 'p')
    gr.put(13, 15, 'Q')
    // Visor with a sheen, and the glowing eye looking ahead.
    gr.fill(9, 5, 1, 3, 'S')
    gr.fill(21, 5, 1, 3, 's')
    gr.fill(11, 4, 9, 4, 'v')
    gr.fill(12, 4, 2, 1, 'n')
    gr.put(12, 5, 'n')
    gr.fill(16, 5, 2, 2, 'Y')
    gr.put(16, 5, 'W')
    for (const x of [13, 15, 17]) gr.put(x, 9, 'd')
  } else {
    // The back: cooling vents, and the battery pack with its charge lights.
    for (const y of [4, 6, 8]) gr.fill(12, y, 7, 1, 'd')
    gr.box(11, 13, 9, 8, STEEL_SET)
    gr.fill(12, 14, 7, 1, 'z')
    for (const x of [13, 15, 17]) gr.put(x, 16, 'L')
    for (const x of [13, 15, 17]) gr.put(x, 18, 'l')
  }
  return gr.rows()
}
const boltSprite = (pose: BoltPose) => pixelSprite(boltRows(pose), BOLT_PALETTE)
const BOLT = {
  stand: boltSprite({
    view: 'front',
    left: 'down',
    right: 'down',
    lift: 'none',
  }),
  walk: [
    boltSprite({ view: 'front', left: 'down', right: 'down', lift: 'left' }),
    boltSprite({ view: 'front', left: 'down', right: 'down', lift: 'right' }),
  ],
  climb: [
    boltSprite({ view: 'back', left: 0, right: 4, lift: 'right' }),
    boltSprite({ view: 'back', left: 4, right: 0, lift: 'left' }),
  ],
  fall: [
    boltSprite({ view: 'front', left: 1, right: 4, lift: 'left' }),
    boltSprite({ view: 'front', left: 4, right: 1, lift: 'right' }),
  ],
  wind: boltSprite({
    view: 'front',
    left: 'down',
    right: 'wind',
    lift: 'none',
  }),
  strike: boltSprite({
    view: 'front',
    left: 'down',
    right: 'strike',
    lift: 'left',
  }),
} as const

const KITTEN_PALETTE = {
  O: RAMPS.rust[3],
  o: RAMPS.rust[2],
  r: RAMPS.rust[1],
  w: RAMPS.cream[3],
  k: INK,
  p: RAMPS.pink[3],
}
const KITTEN_TOP = ['.o....o...', '.op..po...', '.OOOOOOo..']
const KITTEN_SPRITES = [
  pixelSprite(
    [
      ...KITTEN_TOP,
      'OOkOOkOOo.',
      'OOOwpwOOo.',
      '.oOOOOOo..',
      '.oOwwwOo.r',
      '.oOwwwOoor',
      '..ooooooo.',
    ],
    KITTEN_PALETTE,
  ),
  pixelSprite(
    [
      ...KITTEN_TOP,
      'OkkOkkOOo.',
      'OOOwpwOOo.',
      '.oOOOOOo..',
      '.oOwwwOo..',
      '.oOwwwOoo.',
      '..oooooorr',
    ],
    KITTEN_PALETTE,
  ),
] as const

const DRONE_PALETTE = {
  j: RAMPS.steel[4],
  h: RAMPS.steel[4],
  S: RAMPS.steel[3],
  s: RAMPS.steel[2],
  z: RAMPS.steel[1],
  d: RAMPS.steel[0],
  R: RAMPS.ember[2],
  k: INK,
  G: RAMPS.teal[3],
  W: '#ffffff',
  Y: RAMPS.gold[3],
}
const DRONE_BODY = [
  '..s.......s.....',
  '.hhSSSSSSSSz.YY.',
  'hSSSSSSSSSSSzkkk',
  'SSRSSSSSSSSSkGWk',
  'sSSSSSSSSSSskGGk',
  '.ssssssssssdkkk.',
  '..dd.....dd.....',
]
const DRONE_SPRITES = [
  pixelSprite(['jjjjj....jjjjj..', ...DRONE_BODY], DRONE_PALETTE),
  pixelSprite(['.zjz......zjz...', ...DRONE_BODY], DRONE_PALETTE),
] as const

const HAZARD_SPRITE = pixelSprite(
  [
    '....y....',
    '...yYy...',
    '..yYkYy..',
    '.yYYkYYy.',
    'yYYYkYYYy',
    '.yYYYYYy.',
    '..yYkYy..',
    '...yYy...',
    '....y....',
  ],
  { y: RAMPS.gold[2], Y: RAMPS.gold[3], k: INK },
)

const BOLT_ICON = pixelSprite(
  ['...Yy', '..Yy.', '.Yy..', 'YYYYy', '..Yy.', '.Yy..', 'Yy...'],
  { Y: RAMPS.gold[3], y: RAMPS.gold[2] },
)

/** Rubble left where a tower stood: chunks relative to its left edge and the street. */
const RUBBLE = (() => {
  const rand = backdropRng(71)
  return Array.from({ length: 9 }, (_, i) => {
    const w = 8 + Math.floor(rand() * 10)
    const h = 4 + Math.floor(rand() * 5)
    return {
      dx: 2 + Math.floor((i / 9) * (TOWER_W - 14) + rand() * 6),
      dy: -h - (i % 3 === 1 ? 4 : 0),
      w,
      h,
    }
  })
})()

/** Cracks that open in a tower's masonry as it wobbles: pixel polylines, 0..1 of its size. */
const CRACKS = (() => {
  const rand = backdropRng(97)
  return Array.from({ length: 6 }, () => {
    let x = rand()
    let y = 0.15 + rand() * 0.75
    const pts = [{ x, y }]
    for (let i = 0; i < 4; i++) {
      x = Math.max(0.02, Math.min(0.98, x + (rand() - 0.5) * 0.3))
      y += 0.03 + rand() * 0.05
      pts.push({ x, y })
    }
    return pts
  })
})()

class RepairRampage implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private towers: Tower[] = []
  private charge = MAX_CHARGE
  /** Bolt on the street, on a tower's face, or falling. */
  private mode: 'ground' | 'climb' | 'fall' = 'ground'
  private x = 24
  private y = GROUND
  private vy = 0
  private fallFrom = GROUND
  private tower = -1
  private col = 0
  private row = 0
  private climbWait = 0
  private fixCooldown = 0
  private punch = 0
  private facing: 1 | -1 = 1
  private drones: Drone[] = []
  private droneTimer = 240
  private kitten: Kitten | null = null
  private kittenTimer = 400
  private rescued = 0
  private clear = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(47)
  private prevX = this.x
  private glints: Array<{ x: number; y: number; life: number }> = []
  private flashes: Array<{ x: number; y: number; life: number }> = []

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startCity(1)
  }

  // --- setup -------------------------------------------------------------------

  private startCity(city: number) {
    this.level = city
    const count = Math.floor(levelCurve(city, RAMPAGE_CURVES.towers))
    const tallest = Math.round(levelCurve(city, RAMPAGE_CURVES.rows))
    const broken = levelCurve(city, RAMPAGE_CURVES.broken)
    const perWindow = levelCurve(city, RAMPAGE_CURVES.holdPerWindow) * 60
    const gap = (W - count * TOWER_W) / (count + 1)
    this.towers = []
    for (let i = 0; i < count; i++) {
      const rows = Math.max(4, tallest - Math.floor(this.rng() * 3))
      const windows: boolean[] = []
      for (let w = 0; w < rows * TOWER_COLS; w++) {
        windows.push(this.rng() >= broken)
      }
      // Every tower needs at least a couple of repairs.
      windows[Math.floor(this.rng() * windows.length)] = false
      windows[Math.floor(this.rng() * windows.length)] = false
      const brokenCount = windows.filter((fixed) => !fixed).length
      const stability = Math.round(HOLD_GRACE + brokenCount * perWindow)
      this.towers.push({
        x: Math.round(gap + i * (TOWER_W + gap)),
        rows,
        windows,
        stability,
        maxStability: stability,
        standing: true,
        dust: 0,
      })
    }
    this.mode = 'ground'
    this.x = 12
    this.y = GROUND
    this.tower = -1
    this.drones = []
    this.droneTimer = 240
    this.kitten = null
    this.kittenTimer = 360
    this.banner = { text: `CITY ${city}`, sub: 'FIX EVERY WINDOW', ticks: 100 }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.clear > 0) {
      if (--this.clear === 0) this.startCity(this.level + 1)
      return
    }
    if (this.fixCooldown > 0) this.fixCooldown--
    if (this.punch > 0) this.punch--
    if (this.tick % DRAIN_TICKS === 0) this.charge--

    if (this.mode === 'ground') this.walk(controls)
    else if (this.mode === 'climb') this.climb(controls)
    else this.fall()

    this.updateTowers()
    this.updateDrones()
    this.updateKitten()
    this.checkClear()
    if (this.charge <= 0 && !this.over) {
      this.over = true
      this.banner = { text: 'OUT OF CHARGE', sub: 'GAME OVER', ticks: 9999 }
      this.sound.play('die')
    }
  }

  private walk(input: InputFrame) {
    if (input.held.left) {
      this.x -= WALK_SPEED
      this.facing = -1
    }
    if (input.held.right) {
      this.x += WALK_SPEED
      this.facing = 1
    }
    this.x = Math.max(10, Math.min(W - 10, this.x))
    if (input.held.up || input.pressed.up) {
      const i = this.towers.findIndex(
        (t) => t.standing && this.x > t.x + 2 && this.x < t.x + TOWER_W - 2,
      )
      if (i >= 0) this.grab(i)
    }
    if (input.pressed.a) this.swing()
  }

  private grab(i: number) {
    const t = this.towers[i]!
    this.mode = 'climb'
    this.tower = i
    this.col = Math.max(
      0,
      Math.min(TOWER_COLS - 1, Math.floor((this.x - t.x - 4) / CELL)),
    )
    this.row = 0
    this.climbWait = CLIMB_TICKS
    this.placeOnTower()
    this.sound.play('blip')
  }

  private placeOnTower() {
    const t = this.towers[this.tower]!
    this.x = t.x + 4 + this.col * CELL + CELL / 2
    this.y = windowY(this.row) + CELL
  }

  private climb(input: InputFrame) {
    const t = this.towers[this.tower]
    if (!t || !t.standing) {
      this.letGo()
      return
    }
    if (this.climbWait > 0) {
      this.climbWait--
    } else {
      let moved = true
      if (input.held.up && this.row < t.rows - 1) this.row++
      else if (input.held.down) {
        if (this.row === 0) {
          this.mode = 'ground'
          this.y = GROUND
          return
        }
        this.row--
      } else if (input.held.left) {
        this.facing = -1
        if (this.col === 0) {
          this.letGo()
          this.x -= 10
          return
        }
        this.col--
      } else if (input.held.right) {
        this.facing = 1
        if (this.col === TOWER_COLS - 1) {
          this.letGo()
          this.x += 10
          return
        }
        this.col++
      } else {
        moved = false
      }
      if (moved) this.climbWait = CLIMB_TICKS
    }
    this.placeOnTower()
    if (input.pressed.a || (input.held.a && this.fixCooldown === 0)) {
      this.swing()
    }
  }

  private letGo() {
    this.mode = 'fall'
    this.vy = 0
    this.fallFrom = this.y
    this.tower = -1
  }

  private fall() {
    this.vy = Math.min(5, this.vy + 0.3)
    this.y += this.vy
    if (this.y < GROUND) return
    this.y = GROUND
    this.mode = 'ground'
    // A long drop rattles Bolt's circuits.
    if (GROUND - this.fallFrom > CELL * 3) {
      this.charge -= FALL_COST
      this.burst(this.x, GROUND, 8, '#94a3b8')
      this.sound.play('boom')
    }
  }

  /** A swing of the wrench: shoo a drone right beside Bolt, or fix a window. */
  private swing() {
    if (this.fixCooldown > 0) return
    this.fixCooldown = FIX_COOLDOWN
    this.punch = 8
    const drone = this.drones.find(
      (d) =>
        !d.leaving &&
        Math.abs(d.x - this.x) < 26 &&
        Math.abs(d.y - (this.y - 14)) < 18,
    )
    if (drone) {
      drone.leaving = true
      drone.dir = drone.x < this.x ? -1 : 1
      drone.warn = 0
      this.addScore(SHOO_POINTS, drone.x, drone.y - 8)
      this.fx.burst(drone.x, drone.y, this.fxRng, {
        count: 6,
        colours: [RAMPS.teal[3], RAMPS.teal[4], '#ffffff'],
      })
      this.sound.play('pop')
      return
    }
    if (this.mode !== 'climb') return
    const t = this.towers[this.tower]!
    const index = this.row * TOWER_COLS + this.col
    if (t.windows[index]) return
    t.windows[index] = true
    t.stability = Math.min(t.maxStability, t.stability + FIX_STEADY)
    const wx = t.x + 4 + this.col * CELL + CELL / 2
    const wy = windowY(this.row) + CELL / 2
    this.addScore(FIX_POINTS, wx, wy - 8)
    this.burst(wx, wy, 6, '#fde68a')
    this.fx.burst(wx, wy, this.fxRng, { count: 8 })
    this.glints.push({ x: wx, y: wy, life: 16 })
    this.sound.play('pickup')
    if (this.kitten?.tower === this.tower && this.kitten.index === index) {
      this.kitten = null
      this.rescued++
      this.addScore(KITTEN_POINTS * this.level, wx, wy - 18)
      this.banner = { text: 'KITTEN RESCUED!', ticks: 70 }
      this.fx.burst(wx, wy - 4, this.fxRng, {
        count: 18,
        speed: 2.2,
        colours: [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
      })
      this.sound.play('extra')
    } else if (this.rng() < 0.03) {
      this.charge = Math.min(MAX_CHARGE, this.charge + 12)
      this.floaters.push({ x: wx, y: wy - 18, text: 'CHARGE!', life: 40 })
      this.fx.burst(this.x, this.y - 30, this.fxRng, {
        count: 10,
        colours: [RAMPS.leaf[3], RAMPS.leaf[4], RAMPS.gold[4]],
      })
    }
  }

  // --- towers -------------------------------------------------------------------

  private updateTowers() {
    for (const [i, t] of this.towers.entries()) {
      if (t.dust > 0) t.dust--
      if (!t.standing) continue
      if (t.windows.every(Boolean)) continue
      if (--t.stability > 0) {
        if (t.stability === WOBBLE_AT) {
          this.sound.play('warn')
          this.banner = { text: 'A TOWER IS WOBBLING!', ticks: 80 }
        }
        continue
      }
      // Too long left broken: the tower comes down.
      t.standing = false
      t.dust = 90
      this.burst(t.x + TOWER_W / 2, GROUND - 20, 24, '#cbd5e1')
      this.sound.play('boom')
      this.banner = { text: 'TOWER DOWN!', sub: 'NOBODY HURT', ticks: 90 }
      this.charge -= TOWER_DOWN_COST
      if (this.kitten?.tower === i) this.kitten = null
      if (this.mode === 'climb' && this.tower === i) {
        this.charge -= COLLAPSE_COST
        this.letGo()
      }
    }
  }

  private wobble(t: Tower): number {
    if (!t.standing || t.stability > WOBBLE_AT) return 0
    const strength = 1 - t.stability / WOBBLE_AT
    return Math.sin(this.tick / 3) * (1 + strength * 2)
  }

  private checkClear() {
    if (this.clear > 0) return
    const standing = this.towers.filter((t) => t.standing)
    if (standing.some((t) => !t.windows.every(Boolean))) return
    const bonus = 1000 * standing.length * this.level
    if (bonus) this.addScore(bonus, W / 2, 90)
    // A grateful city tops Bolt up for the next one.
    this.charge = Math.min(MAX_CHARGE, this.charge + 10)
    this.clear = CLEAR_TICKS
    for (const t of standing) {
      this.fx.burst(t.x + TOWER_W / 2, windowY(t.rows - 1), this.fxRng, {
        count: 14,
        speed: 2.4,
      })
    }
    this.drones = []
    this.kitten = null
    this.banner = {
      text: 'CITY REPAIRED!',
      sub: standing.length
        ? `${standing.length} TOWERS STANDING`
        : 'ON TO THE NEXT',
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- drones and kittens ---------------------------------------------------------

  private updateDrones() {
    if (--this.droneTimer <= 0) {
      this.droneTimer = Math.round(
        levelCurve(this.level, RAMPAGE_CURVES.droneEvery),
      )
      if (
        this.drones.length <
        Math.floor(levelCurve(this.level, RAMPAGE_CURVES.maxDrones))
      ) {
        const dir = this.rng() < 0.5 ? 1 : -1
        const row = Math.floor(this.rng() * 8)
        this.drones.push({
          x: dir === 1 ? -12 : W + 12,
          y: Math.max(30, windowY(row) + 4),
          dir,
          speed:
            levelCurve(this.level, RAMPAGE_CURVES.droneSpeed) *
            (0.8 + this.rng() * 0.4),
          warn: 0,
          flashed: false,
          leaving: false,
        })
      }
    }
    for (const d of this.drones) {
      if (d.warn > 0) {
        // Hovering, lining up the shot.
        if (--d.warn === 0) this.flash(d)
        continue
      }
      d.x += d.dir * (d.leaving ? d.speed * 2.5 : d.speed)
      if (d.leaving) d.y -= 0.6
      const sameHeight = Math.abs(d.y - (this.y - 14)) < 14
      const ahead = (this.x - d.x) * d.dir
      if (!d.flashed && !d.leaving && sameHeight && ahead > 20 && ahead < 90) {
        d.warn = 40
        this.sound.play('warn')
      }
    }
    this.drones = this.drones.filter(
      (d) => d.x > -30 && d.x < W + 30 && d.y > -20,
    )
  }

  private flash(d: Drone) {
    d.flashed = true
    this.burst(d.x, d.y, 10, '#ffffff')
    this.flashes.push({ x: d.x + d.dir * 6, y: d.y, life: 14 })
    this.sound.play('shoot')
    const sameHeight = Math.abs(d.y - (this.y - 14)) < 16
    const ahead = (this.x - d.x) * d.dir
    if (sameHeight && ahead > 0 && ahead < 110) {
      this.charge -= DAZZLE_COST
      this.floaters.push({
        x: this.x,
        y: this.y - 36,
        text: 'DAZZLED!',
        life: 40,
      })
      if (this.mode === 'climb') this.letGo()
    }
  }

  private updateKitten() {
    if (this.kitten) {
      if (--this.kitten.ticks <= 0) this.kitten = null
      return
    }
    if (--this.kittenTimer > 0) return
    this.kittenTimer = 500 + Math.floor(this.rng() * 300)
    const spots: Array<{ tower: number; index: number }> = []
    this.towers.forEach((t, tower) => {
      if (!t.standing) return
      t.windows.forEach((fixed, index) => {
        if (!fixed && Math.floor(index / TOWER_COLS) >= 2)
          spots.push({ tower, index })
      })
    })
    if (!spots.length) return
    const spot = spots[Math.floor(this.rng() * spots.length)]!
    this.kitten = { ...spot, ticks: 60 * 9 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 18 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    this.prevX = this.x
    for (const e of this.glints) e.life--
    this.glints = this.glints.filter((e) => e.life > 0)
    for (const e of this.flashes) e.life--
    this.flashes = this.flashes.filter((e) => e.life > 0)
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
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
    // Shoo a drone that's lining up a shot nearby.
    const threat = this.drones.find(
      (d) =>
        !d.leaving &&
        !d.flashed &&
        Math.abs(d.x - this.x) < 26 &&
        Math.abs(d.y - (this.y - 14)) < 18,
    )
    if (threat && this.fixCooldown === 0) {
      frame.pressed.a = true
      return frame
    }
    const warned = this.drones.find(
      (d) => d.warn > 0 && Math.abs(d.y - (this.y - 14)) < 16,
    )
    if (this.mode === 'climb') {
      const t = this.towers[this.tower]!
      if (warned) {
        // Climb out of the flash's line.
        if (this.row < t.rows - 1) held.up = true
        else held.down = true
        return frame
      }
      const here = this.row * TOWER_COLS + this.col
      if (!t.windows[here]) {
        if (this.fixCooldown === 0) frame.pressed.a = true
        return frame
      }
      // Head for the nearest broken window on this tower.
      let best = -1
      let bestDist = Infinity
      t.windows.forEach((fixed, index) => {
        if (fixed) return
        const r = Math.floor(index / TOWER_COLS)
        const c = index % TOWER_COLS
        const dist = Math.abs(r - this.row) * 1.2 + Math.abs(c - this.col)
        if (dist < bestDist) {
          bestDist = dist
          best = index
        }
      })
      if (best < 0) {
        held.down = true
        return frame
      }
      const r = Math.floor(best / TOWER_COLS)
      const c = best % TOWER_COLS
      if (r > this.row) held.up = true
      else if (r < this.row) held.down = true
      else if (c > this.col) held.right = true
      else if (c < this.col) held.left = true
      return frame
    }
    if (this.mode === 'ground') {
      // Walk to the shakiest tower that still needs work and climb it.
      const target = this.towers
        .filter((t) => t.standing && !t.windows.every(Boolean))
        .sort((a, b) => a.stability - b.stability)[0]
      if (!target) return frame
      const mid = target.x + TOWER_W / 2
      if (Math.abs(mid - this.x) > 6) {
        if (mid > this.x) held.right = true
        else held.left = true
      } else {
        held.up = true
      }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.towers.forEach((t, i) => this.renderTower(g, t, i))
    this.renderStreet(g)
    for (const gl of this.glints) {
      const k = gl.life / 16
      glow(g, gl.x, gl.y, 10 + (1 - k) * 12, RAMPS.gold[3], 0.7 * k)
    }
    for (const d of this.drones) this.renderDrone(g, d)
    for (const f of this.flashes) {
      const k = f.life / 14
      glow(g, f.x, f.y, 14 + (1 - k) * 46, '#ffffff', 0.9 * k)
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = k
      g.fillStyle = RAMPS.gold[4]
      const arm = Math.round(6 + (1 - k) * 14)
      g.fillRect(Math.round(f.x) - arm, Math.round(f.y), arm * 2 + 1, 1)
      g.fillRect(Math.round(f.x), Math.round(f.y) - arm, 1, arm * 2 + 1)
      g.restore()
    }
    this.renderBolt(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      const px = Math.round(p.x) - 1
      const py = Math.round(p.y) - 1
      g.fillStyle = INK
      g.fillRect(px, py, 3, 3)
      g.fillStyle = p.color
      g.fillRect(px, py, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color:
          f.text === 'DAZZLED!'
            ? '#ffffff'
            : f.text === 'CHARGE!'
              ? RAMPS.leaf[3]
              : RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // Dusk after the storm, banded the HDMA way, with the sun going down behind a
    // rainbow; painted once.
    cachedLayer(g, 'repair-rampage-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND, SKY_STOPS, 4)
      glow(k, SUN.x, SUN.y, SUN.r * 2.6, RAMPS.gold[3], 0.45)
      k.save()
      k.globalAlpha = 0.2
      k.lineWidth = 3
      RAINBOW.forEach((c, i) => {
        k.strokeStyle = c
        k.beginPath()
        k.arc(W / 2, GROUND + 40, 190 - i * 3, Math.PI, 0)
        k.stroke()
      })
      k.restore()
      // A striped setting sun: solid on top, slatted toward the horizon.
      for (let dy = -SUN.r; dy <= SUN.r; dy++) {
        const lower = dy > 4
        if (lower && (dy + 40) % 7 < Math.min(4, 1 + Math.floor(dy / 7))) {
          continue
        }
        const half = Math.round(Math.sqrt(SUN.r * SUN.r - dy * dy))
        const t = (dy + SUN.r) / (SUN.r * 2)
        k.fillStyle =
          t < 0.2
            ? RAMPS.gold[4]
            : t < 0.45
              ? RAMPS.gold[3]
              : t < 0.7
                ? RAMPS.rust[3]
                : RAMPS.pink[2]
        k.fillRect(SUN.x - half, SUN.y + dy, half * 2, 1)
      }
    })
    drawStars(g, STARS, this.tick)
    for (const c of CLOUDS) {
      const span = W + 80
      const x = ((((c.x + this.tick * c.speed) % span) + span) % span) - 40
      drawCloud(g, Math.round(x), c.y, c.size, DUSK_CLOUD)
    }
    cachedLayer(g, 'repair-rampage-skyline', W, H, (k) => {
      // Far skyline: hazy violet blocks with the odd lit window.
      for (const b of FAR_SKYLINE) {
        const rand = backdropRng(b.seed)
        const top = GROUND - b.h
        k.fillStyle = '#5a2c7c'
        k.fillRect(b.x, top, b.w, b.h)
        k.fillStyle = '#7a3e94'
        k.fillRect(b.x, top, 2, b.h)
        k.fillRect(b.x, top, b.w, 1)
        for (let y = top + 4; y < GROUND - 4; y += 4) {
          for (let x = b.x + 3; x < b.x + b.w - 2; x += 3) {
            if (rand() < 0.16) {
              k.fillStyle = rand() < 0.5 ? RAMPS.gold[2] : RAMPS.rust[3]
              k.fillRect(x, y, 1, 2)
            }
          }
        }
      }
      // A band of haze between the layers.
      for (let i = 0; i < 4; i++) {
        k.fillStyle = rgba(RAMPS.pink[2], 0.07)
        k.fillRect(0, GROUND - 40 + i * 10, W, 40 - i * 10)
      }
      // Near skyline: darker, rim-lit, with rows of lit flats and rooftop kit.
      for (const b of NEAR_SKYLINE) {
        const rand = backdropRng(b.seed)
        const top = GROUND - b.h
        k.fillStyle = RAMPS.night[2]
        k.fillRect(b.x, top, b.w, b.h)
        k.fillStyle = RAMPS.night[3]
        k.fillRect(b.x, top, 2, b.h)
        k.fillStyle = RAMPS.purple[1]
        k.fillRect(b.x, top, b.w, 1)
        k.fillStyle = RAMPS.night[1]
        k.fillRect(b.x + b.w - 2, top, 2, b.h)
        if (rand() < 0.4) {
          // A water tower on the roof.
          const wx = b.x + 4 + Math.floor(rand() * Math.max(1, b.w - 12))
          k.fillStyle = RAMPS.night[2]
          k.fillRect(wx, top - 7, 6, 5)
          k.fillRect(wx + 1, top - 2, 1, 2)
          k.fillRect(wx + 4, top - 2, 1, 2)
          k.fillStyle = RAMPS.night[3]
          k.fillRect(wx, top - 8, 6, 1)
        }
        for (let y = top + 4; y < GROUND - 3; y += 5) {
          for (let x = b.x + 4; x < b.x + b.w - 4; x += 4) {
            const lit = rand() < 0.3
            k.fillStyle = lit ? RAMPS.gold[3] : RAMPS.night[1]
            k.fillRect(x, y, 2, 2)
            if (lit) {
              k.fillStyle = RAMPS.gold[2]
              k.fillRect(x, y + 1, 2, 1)
            }
          }
        }
      }
    })
    for (const b of BEACONS) {
      if (Math.floor((this.tick + b.phase) / 30) % 2) continue
      glow(g, b.x, b.y, 5, RAMPS.ember[2], 0.8)
      g.fillStyle = RAMPS.ember[3]
      g.fillRect(b.x, b.y, 1, 1)
    }
  }

  private renderTower(g: CanvasRenderingContext2D, t: Tower, i: number) {
    const ramp = TOWER_RAMPS[i % TOWER_RAMPS.length]!
    if (!t.standing) {
      // Shored-up rubble, and the dust cloud of the fall settling over it.
      for (const r of RUBBLE) {
        bevel(g, t.x + r.dx, GROUND + r.dy, r.w, r.h, ramp, {
          depth: 1,
        })
      }
      g.fillStyle = BROKEN_PALETTE.c
      for (const r of RUBBLE)
        g.fillRect(t.x + r.dx + 2, GROUND + r.dy + 1, 2, 1)
      if (t.dust > 0) {
        const k = t.dust / 90
        g.save()
        g.globalAlpha = k * 0.85
        const grow = (1 - k) * 14
        drawCloud(
          g,
          t.x + TOWER_W / 2,
          GROUND - 14 - grow,
          12 + grow / 2,
          RAMPS.steel,
        )
        drawCloud(g, t.x + 8, GROUND - 6 - grow / 2, 7 + grow / 3, RAMPS.steel)
        drawCloud(
          g,
          t.x + TOWER_W - 8,
          GROUND - 6 - grow / 2,
          7 + grow / 3,
          RAMPS.steel,
        )
        g.restore()
      }
      return
    }
    const sway = Math.round(this.wobble(t))
    const top = windowY(t.rows - 1) - 6
    const height = GROUND - top
    g.save()
    g.translate(sway, 0)
    // The facade: a lit block with a cornice, a dark plinth and floor ledges.
    bevel(g, t.x, top, TOWER_W, height, ramp, { depth: 3 })
    bevel(g, t.x - 2, top - 4, TOWER_W + 4, 5, ramp, { depth: 1 })
    g.fillStyle = ramp[0]
    g.fillRect(t.x + 1, GROUND - 4, TOWER_W - 2, 4)
    g.fillStyle = ramp[1]
    g.fillRect(t.x + 1, GROUND - 5, TOWER_W - 2, 1)
    for (let row = 0; row < t.rows; row++) {
      const ly = windowY(row) - 2
      g.fillStyle = ramp[3]
      g.fillRect(t.x + 3, ly, TOWER_W - 6, 1)
      g.fillStyle = ramp[1]
      g.fillRect(t.x + 3, ly + 1, TOWER_W - 6, 1)
    }
    // The rooftop mast and its blinking beacon.
    const mx = t.x + TOWER_W / 2 - 1
    g.fillStyle = INK
    g.fillRect(mx - 1, top - 13, 4, 10)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(mx, top - 12, 1, 9)
    g.fillStyle = RAMPS.steel[1]
    g.fillRect(mx + 1, top - 12, 1, 9)
    const beacon = Math.floor(this.tick / 20) % 2
    if (beacon) glow(g, mx + 1, top - 14, 9, RAMPS.ember[2], 0.8)
    shadedOrb(g, mx + 1, top - 14, 2, beacon ? RAMPS.ember : RAMPS.rust, {
      glint: false,
    })
    const wobbling = t.stability <= WOBBLE_AT && !t.windows.every(Boolean)
    for (let row = 0; row < t.rows; row++) {
      for (let col = 0; col < TOWER_COLS; col++) {
        const index = row * TOWER_COLS + col
        const wx = t.x + 4 + col * CELL + 2
        const wy = windowY(row) + 2
        // A recessed frame: ink edge, shadowed lintel, lit sill.
        g.fillStyle = INK
        g.fillRect(wx - 1, wy - 1, GLASS + 2, GLASS + 2)
        g.fillStyle = ramp[4]
        g.fillRect(wx - 1, wy + GLASS + 1, GLASS + 2, 1)
        const variant = (index * 7 + i * 3 + (index >> 2)) % 3
        drawSprite(
          g,
          t.windows[index] ? LIT_GLASS[variant]! : BROKEN_GLASS[variant]!,
          wx,
          wy,
          { anchor: 'topleft' },
        )
        if (this.kitten?.tower === i && this.kitten.index === index) {
          this.renderKitten(g, wx + GLASS / 2, wy + GLASS + 1)
        }
      }
    }
    // Masonry cracks open up as the tower loses its footing.
    if (wobbling) {
      const strength = 1 - t.stability / WOBBLE_AT
      const shown = Math.ceil(strength * CRACKS.length)
      for (const crack of CRACKS.slice(0, shown)) {
        for (let s = 1; s < crack.length; s++) {
          const a = crack[s - 1]!
          const b = crack[s]!
          const x0 = t.x + a.x * TOWER_W
          const y0 = top + a.y * height
          const x1 = t.x + b.x * TOWER_W
          const y1 = top + b.y * height
          const steps = Math.ceil(
            Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)),
          )
          for (let k = 0; k <= steps; k++) {
            const px = Math.round(x0 + ((x1 - x0) * k) / steps)
            const py = Math.round(y0 + ((y1 - y0) * k) / steps)
            g.fillStyle = ramp[4]
            g.fillRect(px + 1, py, 1, 1)
            g.fillStyle = INK
            g.fillRect(px, py, 1, 2)
          }
        }
      }
    }
    if (wobbling && Math.floor(this.tick / 8) % 2 === 0) {
      // A hazard sign flashing on the roof.
      const sx = t.x + TOWER_W / 2 + 13
      const sy = Math.max(top - 3, 35)
      glow(g, sx, sy - 6, 12, RAMPS.gold[3], 0.6)
      drawSprite(g, HAZARD_SPRITE, sx, sy, { anchor: 'feet' })
    }
    g.restore()
  }

  private renderKitten(g: CanvasRenderingContext2D, x: number, y: number) {
    const frame = Math.floor(this.tick / 30) % 2
    glow(g, x, y - 5, 12 + frame * 2, RAMPS.pink[3], 0.45)
    drawSprite(g, KITTEN_SPRITES[frame]!, x, y, { anchor: 'feet' })
    if (frame === 0) {
      drawText(g, 'MEW', x, y - 22, {
        align: 'center',
        color: RAMPS.cream[3],
        outline: INK,
      })
    }
  }

  private renderStreet(g: CanvasRenderingContext2D) {
    // Sidewalk slabs, a lit kerb and banded asphalt with lane dashes; painted once.
    cachedLayer(g, 'repair-rampage-street', W, H, (k) => {
      for (let x = 0; x < W; x += 12) {
        bevel(k, x, GROUND, 12, 6, RAMPS.cream, { depth: 1, outline: null })
        k.fillStyle = RAMPS.cream[0]
        k.fillRect(x + 11, GROUND, 1, 6)
      }
      k.fillStyle = RAMPS.steel[4]
      k.fillRect(0, GROUND + 6, W, 1)
      k.fillStyle = RAMPS.steel[2]
      k.fillRect(0, GROUND + 7, W, 1)
      k.fillStyle = INK
      k.fillRect(0, GROUND + 8, W, 1)
      bandedGradient(
        k,
        0,
        GROUND + 9,
        W,
        H - GROUND - 9,
        [RAMPS.night[3], RAMPS.night[2], RAMPS.night[1]],
        2,
      )
      for (let x = 6; x < W; x += 28) {
        k.fillStyle = RAMPS.gold[1]
        k.fillRect(x, GROUND + 14, 14, 1)
        k.fillStyle = RAMPS.gold[3]
        k.fillRect(x, GROUND + 13, 14, 1)
      }
    })
    // Each tower's shadow pooling on the slabs.
    g.fillStyle = rgba(INK, 0.35)
    for (const t of this.towers) {
      if (t.standing) g.fillRect(t.x - 1, GROUND, TOWER_W + 6, 3)
    }
  }

  private renderDrone(g: CanvasRenderingContext2D, d: Drone) {
    const lx = d.x + d.dir * 6
    if (d.warn > 0) {
      // Lining up the shot: a widening cone of light, the bulb charging.
      const charge = 1 - d.warn / 40
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (const [spread, alpha] of [
        [6, 0.1],
        [4, 0.12],
        [2, 0.16],
      ] as const) {
        g.fillStyle = rgba(RAMPS.gold[4], alpha * (0.6 + charge))
        g.beginPath()
        g.moveTo(lx, d.y - 1)
        g.lineTo(lx + d.dir * 90, d.y - spread)
        g.lineTo(lx + d.dir * 90, d.y + spread)
        g.lineTo(lx, d.y + 1)
        g.fill()
      }
      g.restore()
      const blink = Math.floor(this.tick / 4) % 2 === 0
      glow(g, lx, d.y, 6 + charge * 8 + (blink ? 3 : 0), RAMPS.gold[4], 0.9)
    }
    drawSprite(g, DRONE_SPRITES[Math.floor(this.tick / 3) % 2]!, d.x, d.y, {
      flipX: d.dir < 0,
    })
    if (Math.floor(this.tick / 16) % 2 === 0) {
      glow(g, d.x - d.dir * 6, d.y, 4, RAMPS.ember[2], 0.6)
    }
  }

  private renderBolt(g: CanvasRenderingContext2D) {
    const x = this.x
    const feet = this.y
    if (this.mode !== 'climb') {
      const lift = Math.max(0, GROUND - feet)
      const k = Math.max(0.3, 1 - lift / 120)
      dropShadow(g, x, GROUND + 1, 11 * k, 2.5 * k, 0.4)
    }
    let sprite: PixelSprite = BOLT.stand
    if (this.punch > 0) {
      sprite = this.punch > 4 ? BOLT.wind : BOLT.strike
    } else if (this.mode === 'climb') {
      sprite = BOLT.climb[(this.row + this.col) % 2]!
    } else if (this.mode === 'fall') {
      sprite = BOLT.fall[Math.floor(this.tick / 4) % 2]!
    } else if (this.x !== this.prevX) {
      sprite = BOLT.walk[Math.floor(this.x / 6) % 2]!
    }
    const flip = this.facing < 0
    // The antenna glows teal while there's charge to spare, red when it's low.
    const low = this.charge / MAX_CHARGE <= 0.2
    glow(g, x, feet - 36, 6, low ? RAMPS.ember[2] : RAMPS.teal[3], 0.7)
    drawSprite(g, sprite, x, feet + 1, { anchor: 'feet', flipX: flip })
    if (this.punch > 0 && this.punch <= 4) {
      // The swoosh of the swing.
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.fillStyle = rgba(RAMPS.teal[4], 0.6)
      const sx = Math.round(x + this.facing * 15)
      for (let j = 0; j < 4; j++) {
        g.fillRect(sx + this.facing * j, feet - 28 + j * 3, 1, 3)
      }
      g.restore()
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score in its own box on the left.
    hudPanel(g, 3, 2, 88, 20)
    drawText(g, String(this.score).padStart(7, '0'), 6, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // The charge gauge, flashing red as it runs dry.
    const frac = Math.max(0, this.charge) / MAX_CHARGE
    const alarm = frac <= 0.2 && Math.floor(this.tick / 15) % 2 === 0
    hudPanel(g, 95, 2, 84, 20, alarm ? RAMPS.ember : RAMPS.purple)
    drawSprite(g, BOLT_ICON, 103, 12)
    drawText(g, 'CHARGE', 110, 4, { color: RAMPS.leaf[4], outline: INK })
    gauge(
      g,
      110,
      13,
      64,
      5,
      frac,
      frac > 0.4 ? RAMPS.leaf : frac > 0.2 ? RAMPS.gold : RAMPS.ember,
    )
    if (this.rescued) {
      hudPanel(g, 182, 2, 60, 20, RAMPS.purple)
      drawSprite(g, KITTEN_SPRITES[0], 191, 20, { anchor: 'feet' })
      drawText(g, 'KITTENS', 199, 4, { color: RAMPS.rust[4], outline: INK })
      drawText(g, String(this.rescued), 199, 13, {
        color: RAMPS.cream[3],
        outline: INK,
      })
    }
    hudPanel(g, W - 74, 2, 71, 20)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 7, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `CITY ${this.level}`, W - 7, 13, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 48, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 68, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const repairRampage: ArcadeGameModule = {
  create: (options) => new RepairRampage(options),
}

export const create = repairRampage.create
export default repairRampage

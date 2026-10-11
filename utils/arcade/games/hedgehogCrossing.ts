// /utils/arcade/games/hedgehogCrossing.ts
//
// Hedgehog Crossing -- the Kind Robots Arcade's Frogger riff (conductor
// kr-arcade/t-009 game factory). Walk a family of hedgehogs home, one at a
// time: across a busy road of robot traffic, onto the median, then over a
// creek of drifting logs and paddling turtles to the five burrows in the hedge
// at the top. Turtles dive now and then, a fox snoozes in a burrow from level
// two (don't wake it), and a ladybug visits the burrows for a bonus.
//
// The arrows hop one step (hold to keep hopping), A hops forward. Every new
// step forward scores, every hedgehog home scores more for the time it has
// left, and all five home starts the next level: faster lanes, shorter logs,
// more diving turtles.

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
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
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

const TILE = 20
const W = 280
const H = 320
const TOP = 28
/** Rows from the hedge (0) down to the start (12). */
const START_ROW = 12
const MEDIAN_ROW = 6
const HOP_TICKS = 8
const HOP_REPEAT = 4
const SPAN = W + 140
const HALF = 7
const START_LIVES = 4
const TIME_TICKS = 60 * 30
const DEATH_TICKS = 60
const LEVEL_CLEAR_TICKS = 140
const EXTRA_EVERY = 10_000
const BURROWS = 5
const BURROW_REACH = 10

const STEP_POINTS = 10
const HOME_POINTS = 50
const FAMILY_BONUS = 1000
const LADYBUG_POINTS = 200

export const HEDGEHOG_CURVES = {
  speed: { start: 1, step: 0.12, limit: 2.2 },
  /** Tiles shaved off every log, so the gaps grow. */
  logTrim: { start: 0, step: 0.5, limit: 2 },
  divingGroups: { start: 1, step: 1, limit: 4 },
  foxEvery: { start: 0, step: 520, limit: 520 },
} as const

type LaneKind = 'car' | 'tractor' | 'racer' | 'bus' | 'log' | 'turtles'
type LaneSpec = {
  row: number
  kind: LaneKind
  len: number
  count: number
  speed: number
  dir: 1 | -1
  color: string
}
type Thing = { x: number; len: number; dive: number }
type Lane = LaneSpec & { things: Thing[]; vx: number }
type Hop = {
  fromX: number
  fromRow: number
  toX: number
  toRow: number
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

/** The lanes, from the bottom of the road to the top of the creek. */
const LANES: LaneSpec[] = [
  {
    row: 11,
    kind: 'car',
    len: 1,
    count: 3,
    speed: 0.6,
    dir: -1,
    color: '#f472b6',
  },
  {
    row: 10,
    kind: 'tractor',
    len: 1,
    count: 3,
    speed: 0.45,
    dir: 1,
    color: '#facc15',
  },
  {
    row: 9,
    kind: 'car',
    len: 1,
    count: 3,
    speed: 0.85,
    dir: -1,
    color: '#38bdf8',
  },
  {
    row: 8,
    kind: 'racer',
    len: 1,
    count: 1,
    speed: 2,
    dir: 1,
    color: '#fb7185',
  },
  {
    row: 7,
    kind: 'bus',
    len: 2,
    count: 2,
    speed: 0.7,
    dir: -1,
    color: '#2dd4bf',
  },
  {
    row: 5,
    kind: 'turtles',
    len: 3,
    count: 4,
    speed: 0.6,
    dir: -1,
    color: '#15803d',
  },
  {
    row: 4,
    kind: 'log',
    len: 3,
    count: 3,
    speed: 0.5,
    dir: 1,
    color: '#92400e',
  },
  {
    row: 3,
    kind: 'log',
    len: 5,
    count: 2,
    speed: 1.15,
    dir: 1,
    color: '#92400e',
  },
  {
    row: 2,
    kind: 'turtles',
    len: 2,
    count: 4,
    speed: 0.7,
    dir: -1,
    color: '#15803d',
  },
  {
    row: 1,
    kind: 'log',
    len: 4,
    count: 3,
    speed: 0.8,
    dir: 1,
    color: '#92400e',
  },
]

/** Turtle groups dive on this cycle: [start, end) of the submerged stretch. */
const DIVE_PERIOD = 300
const DIVE_WARN = 150
const DIVE_DOWN = 190
const DIVE_UP = 260

function rowY(row: number): number {
  return TOP + row * TILE
}

function burrowX(i: number): number {
  return Math.round(((i + 0.5) * W) / BURROWS)
}

function isCreek(row: number): boolean {
  return row >= 1 && row <= 5
}

function isRoad(row: number): boolean {
  return row >= 7 && row <= 11
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

type Facing = 'up' | 'down' | 'left' | 'right'

/** A ramp as the palette digits '0' (deep shadow) to '4' (highlight), plus extra letters. */
function rampPalette(
  ramp: Ramp,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    '0': ramp[0],
    '1': ramp[1],
    '2': ramp[2],
    '3': ramp[3],
    '4': ramp[4],
    ...extra,
  }
}

/** The ramp step (0..4) a surface facing (nx, ny) catches, lit from the upper left. */
function litStep(nx: number, ny: number, base: number, spread = 1.6): number {
  const light = -(nx * 0.6 + ny * 0.8)
  return Math.max(0, Math.min(4, Math.round(base + light * spread)))
}

/** Sprite rows painted by a function of each pixel: the procedural sprites below. */
function paintRows(
  w: number,
  h: number,
  paint: (x: number, y: number) => string | null,
): string[] {
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) row += paint(x, y) ?? '.'
    rows.push(row)
  }
  return rows
}

const FACING_DIRS: Record<Facing, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

const HOG_PALETTE = rampPalette(RAMPS.earth, {
  b: RAMPS.cream[1],
  c: RAMPS.cream[2],
  C: RAMPS.cream[3],
  W: RAMPS.cream[4],
  p: RAMPS.pink[3],
  k: INK,
})

/**
 * A hedgehog seen from above, built per heading so the light stays on the upper left (a
 * baked frame per facing, never a rotated sprite): quilled back, cream face, little feet.
 */
function hedgehogRows(facing: Facing, pose: 'stand' | 'hop' | 'sleep') {
  const [dx, dy] = FACING_DIRS[facing]
  const c = 7
  const reach = pose === 'hop' ? 6.6 : 6
  const front = pose === 'hop' ? 3 : 2
  const back = pose === 'hop' ? -5 : -4
  return paintRows(15, 15, (x, y) => {
    const ox = x - c
    const oy = y - c
    // f runs along the heading, s across it.
    const f = dx * ox + dy * oy
    const s = -dy * ox + dx * oy
    const head = ((f - 4) / 3.1) ** 2 + (s / 3) ** 2
    if (head <= 1 && f >= 2) {
      if (f === 7 && s === 0) return 'k'
      if (f === 5 && Math.abs(s) === 1) return pose === 'sleep' ? 'b' : 'k'
      if (f === 4 && Math.abs(s) === 2) return 'p'
      const step = litStep((x - (c + dx * 4)) / 3, (y - (c + dy * 4)) / 3, 2.4)
      return step <= 1 ? 'b' : step === 2 ? 'c' : step === 3 ? 'C' : 'W'
    }
    const body = ((f + 1) / reach) ** 2 + (s / 6) ** 2
    if (body <= 1) {
      // Quills laid back in chevrons: pale tips, dark roots.
      const base = Math.min(
        3,
        litStep((x - c + dx) / 6, (y - c + dy) / 6, 1.7, 1.4),
      )
      const quill = (((f + Math.abs(s)) % 3) + 3) % 3
      if (quill === 0) return String(Math.min(4, base + 2))
      if (quill === 1) return String(Math.max(0, base - 1))
      return String(base)
    }
    if (
      pose !== 'sleep' &&
      Math.abs(s) === 6 &&
      (f === front || f === front - 1 || f === back || f === back + 1)
    )
      return 'b'
    if (body <= 1.3 && f <= 0 && (f + Math.abs(s)) % 3 === 0) return '0'
    return null
  })
}

const HOG_SPRITES = Object.fromEntries(
  (['up', 'down', 'left', 'right'] as const).map((facing) => [
    facing,
    [
      pixelSprite(hedgehogRows(facing, 'stand'), HOG_PALETTE),
      pixelSprite(hedgehogRows(facing, 'hop'), HOG_PALETTE),
    ] as const,
  ]),
) as Record<Facing, readonly [PixelSprite, PixelSprite]>

const HOG_SLEEP = pixelSprite(hedgehogRows('down', 'sleep'), HOG_PALETTE)

const TURTLE_PALETTE = rampPalette(RAMPS.leaf, {
  s: RAMPS.teal[2],
  S: RAMPS.teal[3],
  k: INK,
  a: mix(RAMPS.leaf[1], RAMPS.water[1], 0.6),
  A: mix(RAMPS.leaf[2], RAMPS.water[2], 0.6),
})

/** A paddling turtle facing right: a shaded, plated shell, head, tail and four flippers. */
function turtleRows(pose: 0 | 1 | 'sink') {
  const cx = 7
  const cy = 6
  const sink = pose === 'sink'
  return paintRows(17, 13, (x, y) => {
    const nx = (x - cx) / 5.6
    const ny = (y - cy) / 5.2
    const d = nx * nx + ny * ny
    if (d <= 1) {
      const step = litStep(nx, ny, 2.2, 1.8)
      if (d > 0.7) return sink ? 'a' : step >= 3 ? '2' : '1'
      if (d < 0.16) return sink ? 'A' : step >= 3 ? '4' : '3'
      const frac = (((Math.atan2(ny, nx) / (Math.PI / 3)) % 1) + 1) % 1
      if (d < 0.28 || frac < 0.14 || frac > 0.86) return sink ? 'a' : '1'
      return sink ? (step >= 3 ? 'A' : 'a') : step >= 3 ? '3' : '2'
    }
    if (sink) return null
    if (((x - 13.6) / 2.4) ** 2 + ((y - cy) / 2) ** 2 <= 1)
      return x === 14 && y === cy - 1 ? 'k' : y < cy ? 'S' : 's'
    if (x === 0 && y === cy) return 's'
    const fore = pose === 0 ? [10, 11] : [8, 9]
    const hind = pose === 0 ? [2, 3] : [3, 4]
    if ((y <= 1 || y >= 11) && fore.includes(x)) return y <= 1 ? 'S' : 's'
    if ((y === 1 || y === 2 || y === 10 || y === 11) && hind.includes(x))
      return y <= 2 ? 'S' : 's'
    return null
  })
}

const TURTLE_SPRITES = [
  pixelSprite(turtleRows(0), TURTLE_PALETTE),
  pixelSprite(turtleRows(1), TURTLE_PALETTE),
] as const
const TURTLE_SINKING = pixelSprite(turtleRows('sink'), TURTLE_PALETTE, {
  outline: RAMPS.water[0],
})

const LOG_PALETTE = rampPalette(RAMPS.earth, {
  r: RAMPS.gold[1],
  y: RAMPS.gold[2],
  Y: RAMPS.gold[3],
  m: RAMPS.leaf[2],
  M: RAMPS.leaf[3],
})

/** A floating log `len` tiles long: bark lit along its top, grooves, knots, moss, a ringed cut end. */
function logRows(len: number) {
  const w = len * TILE - 2
  const rand = backdropRng(70 + len)
  const grooves = Array.from({ length: len * 3 }, () => ({
    x: 2 + Math.floor(rand() * (w - 14)),
    y: 3 + Math.floor(rand() * 6),
    l: 4 + Math.floor(rand() * 9),
  }))
  const knots = Array.from({ length: len }, () => ({
    x: 5 + Math.floor(rand() * (w - 16)),
    y: 3 + Math.floor(rand() * 5),
  }))
  const moss = Array.from({ length: len * 2 }, () =>
    Math.floor(2 + rand() * (w - 10)),
  )
  return paintRows(w, 12, (x, y) => {
    if (x >= w - 4) {
      const ex = (x - (w - 4)) / 3.5
      const ey = (y - 5.5) / 6
      const r = Math.sqrt(ex * ex + ey * ey)
      if (r > 1) return null
      return r < 0.25
        ? 'r'
        : r < 0.5
          ? 'Y'
          : r < 0.65
            ? 'y'
            : r < 0.85
              ? 'Y'
              : 'r'
    }
    if (x === 0 && (y < 2 || y > 9)) return null
    if (x === 1 && (y === 0 || y === 11)) return null
    if (
      y <= 1 &&
      moss.some((m) => x === m || x === m + 1 || (y === 1 && x === m + 2))
    )
      return y === 0 ? 'M' : 'm'
    let step = y <= 2 ? 3 : y <= 6 ? 2 : y <= 9 ? 1 : 0
    if (y === 1 && x % 7 === 3) step = 4
    if (x < 2) step--
    for (const gr of grooves) {
      if (x < gr.x || x >= gr.x + gr.l) continue
      if (y === gr.y) step--
      else if (y === gr.y + 1) step++
    }
    for (const k of knots) {
      if (Math.abs(x - k.x) > 1) continue
      if (y === k.y) return x === k.x ? '0' : '1'
      if (y === k.y + 1 && x === k.x) return '3'
    }
    return String(Math.max(0, Math.min(4, step)))
  })
}

const LOG_SPRITES = [1, 2, 3, 4, 5, 6].map((len) =>
  pixelSprite(logRows(len), LOG_PALETTE),
)

function vehiclePalette(ramp: Ramp) {
  return rampPalette(ramp, {
    G: RAMPS.sky[4],
    g: RAMPS.sky[3],
    q: RAMPS.sky[1],
    e: RAMPS.teal[4],
    y: RAMPS.gold[4],
    Y: RAMPS.gold[3],
    t: RAMPS.steel[0],
    T: RAMPS.steel[3],
    k: INK,
    a: RAMPS.steel[3],
    p: RAMPS.pink[3],
    W: RAMPS.cream[4],
  })
}

/** Robot traffic, side on and facing right: a bubble-top car with a robot at the wheel. */
const CAR_ROWS = [
  '.......p..........',
  '.......a..........',
  '.....3444443......',
  '....3GGgq3gq3.....',
  '...43Geq33gqq3....',
  '.444444444444443..',
  '43333333333333332y',
  '43222222222222221y',
  '3222222222222222Y.',
  '.21tTt11111tTt11..',
  '...TkT.....TkT....',
  '...ttt.....ttt....',
]

const RACER_ROWS = [
  '.43...............',
  '.433......443.....',
  '.4333....4GGq3....',
  '.444444444444444..',
  '4YYYYYYYYYYYYYY43y',
  '322222222222222221',
  '.21tTt1111111tTt1.',
  '...TkT.......TkT..',
  '...ttt.......ttt..',
]

const TRACTOR_ROWS = [
  '..........T.......',
  '...33333..a.......',
  '...4GGq3..a.......',
  '...4Geq3..2.......',
  '...4ggq3444443....',
  '..44444444444443..',
  '..43333333333e332.',
  '..432222222222yy2.',
  'tttt22222222222221',
  'tTTTt11111111ttt1.',
  'TTkTT........TkT..',
  'tTTTt........ttt..',
  '.ttt..............',
]

/** A two-tile robot bus: passenger windows (some with robots aboard), a door, a striped side. */
function busRows() {
  const w = 38
  return paintRows(w, 13, (x, y) => {
    for (const cx of [7, 29]) {
      const dx = Math.abs(x - cx)
      if (y >= 10 && dx <= 2) {
        if (y === 11 && dx === 0) return 'k'
        return dx <= 1 && y === 11 ? 'T' : y === 12 && dx === 2 ? null : 't'
      }
    }
    if (y >= 10) return null
    if ((x === 0 || x === w - 1) && (y === 0 || y === 9)) return null
    if (x === w - 1) return y === 7 || y === 8 ? 'y' : '2'
    if (y === 0) return '4'
    if (y >= 2 && y <= 5) {
      if (x >= 34) return y === 2 || x === 34 ? 'G' : 'g'
      if (x >= 30 && x <= 32) return y === 2 && x === 30 ? 'G' : 'q'
      const seg = (x - 3) % 6
      if (x >= 3 && x < 29 && seg < 4) {
        if (y === 5) return 'q'
        if (y === 3 && seg === 2 && (x - 3) % 12 < 6) return 'e'
        return seg === 0 || y === 2 ? 'G' : 'g'
      }
    }
    if (x >= 30 && x <= 32 && y >= 6) return x === 30 ? '2' : '1'
    if (x === 0) return '1'
    if (y === 1 || y === 6) return '3'
    if (y === 7) return 'W'
    if (y === 8) return '2'
    return '1'
  })
}

const LANE_RAMPS: Record<number, Ramp> = {
  11: RAMPS.pink,
  10: RAMPS.gold,
  9: RAMPS.sky,
  8: RAMPS.ember,
  7: RAMPS.teal,
}

const VEHICLE_ROWS: Record<LaneKind, readonly string[]> = {
  car: CAR_ROWS,
  racer: RACER_ROWS,
  tractor: TRACTOR_ROWS,
  bus: busRows(),
  log: [],
  turtles: [],
}

/** One vehicle sprite per road lane, painted in that lane's ramp. */
const VEHICLE_SPRITES: Record<number, PixelSprite> = Object.fromEntries(
  LANES.filter((l) => isRoad(l.row)).map((l) => [
    l.row,
    pixelSprite(
      VEHICLE_ROWS[l.kind],
      vehiclePalette(LANE_RAMPS[l.row] ?? RAMPS.steel),
    ),
  ]),
)

const FOX_PALETTE = rampPalette(RAMPS.rust, {
  n: RAMPS.pink[2],
  w: RAMPS.cream[3],
  W: '#ffffff',
  k: INK,
})

/** The fox, snoozing face-out of a burrow; frame 1 flicks an ear. */
function foxRows(frame: 0 | 1) {
  return paintRows(15, 12, (x, y) => {
    for (const [ex, side] of [
      [2.5, -1],
      [11.5, 1],
    ] as const) {
      const yy = y - (frame === 1 && side > 0 ? 1 : 0)
      const reach = yy * 0.55 + 0.5
      if (yy >= 0 && yy <= 4 && Math.abs(x - ex) <= reach) {
        if (yy >= 2 && Math.abs(x - ex) <= reach - 1.1) return 'n'
        return x < ex ? '3' : '2'
      }
    }
    const hx = (x - 7) / 7.4
    const hy = (y - 6.8) / 4.6
    if (hx * hx + hy * hy > 1) return null
    if (y === 6 && (x === 3 || x === 4 || x === 10 || x === 11)) return 'k'
    const mx = (x - 7) / 3.6
    const my = (y - 9.2) / 2.4
    if (mx * mx + my * my <= 1) {
      if (y === 8 && x >= 6 && x <= 8) return 'k'
      return my < 0 && mx < 0.3 ? 'W' : 'w'
    }
    if (y >= 9 && Math.abs(x - 7) >= 5) return 'w'
    return String(litStep(hx, hy, 2.2, 1.6))
  })
}

const FOX_SPRITES = [
  pixelSprite(foxRows(0), FOX_PALETTE),
  pixelSprite(foxRows(1), FOX_PALETTE),
] as const

const LADYBUG_PALETTE = {
  h: RAMPS.steel[0],
  w: '#ffffff',
  r: RAMPS.ember[1],
  R: RAMPS.ember[2],
  L: RAMPS.ember[3],
  X: RAMPS.ember[4],
  q: rgba(RAMPS.sky[4], 0.7),
}
const LADYBUG_SPRITES = [
  pixelSprite(
    [
      '...hwhwh...',
      '..rLLhRRr..',
      '.rLXLhRhRr.',
      '.rLhLhRRRr.',
      '.rRRRhRhRr.',
      '.rRhRhRRrr.',
      '..rRRhRrr..',
      '...rrhrr...',
    ],
    LADYBUG_PALETTE,
  ),
  pixelSprite(
    [
      '...hwhwh...',
      'qrLLqhqRRrq',
      'rLXLqhqRhRr',
      'rLhLqhqRRRr',
      'rRRRqhqRhRr',
      'qrRhqhqRrrq',
      '.qrr.h.rrq.',
      '.....h.....',
    ],
    LADYBUG_PALETTE,
  ),
] as const

const DIZZY_STAR = pixelSprite(['..y..', '.yYy.', 'yYWYy', '.yYy.', '..y..'], {
  y: RAMPS.gold[2],
  Y: RAMPS.gold[3],
  W: RAMPS.gold[4],
})

const WATER_BANDS = [
  RAMPS.water[0],
  RAMPS.water[1],
  mix(RAMPS.water[1], RAMPS.water[2], 0.6),
  RAMPS.water[1],
  mix(RAMPS.water[1], RAMPS.water[2], 0.4),
  RAMPS.water[1],
]
const ASPHALT_BANDS = [
  mix(RAMPS.steel[1], RAMPS.night[2], 0.35),
  mix(RAMPS.steel[0], RAMPS.steel[1], 0.45),
  RAMPS.steel[0],
  mix(RAMPS.steel[0], RAMPS.night[0], 0.4),
]
const SKY_BANDS = [
  RAMPS.night[0],
  RAMPS.night[2],
  RAMPS.purple[1],
  mix(RAMPS.purple[1], RAMPS.pink[1], 0.6),
  RAMPS.pink[1],
]
const FLOWER_COLOURS = [
  RAMPS.pink[3],
  RAMPS.gold[3],
  RAMPS.teal[3],
  RAMPS.cream[4],
]
const FAR_HILLS = ridge(5, W, 9, 4)
const NEAR_HILLS = ridge(9, W, 6, 2)
const SKY_STARS = starField(23, 18, W, 12)
/** Moving glints on the creek: one row of them per creek lane. */
const SHIMMER = (() => {
  const rand = backdropRng(31)
  return Array.from({ length: 30 }, (_, i) => ({
    row: 1 + (i % 5),
    x: rand() * (W + 40),
    y: 3 + Math.floor(rand() * 14),
    w: 3 + Math.floor(rand() * 6),
    speed: 0.15 + rand() * 0.25,
    phase: rand() * Math.PI * 2,
  }))
})()

class HedgehogCrossing implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private lanes: Lane[] = []
  private hx = 150
  private row = START_ROW
  private facing: 'up' | 'down' | 'left' | 'right' = 'up'
  private hop: Hop | null = null
  private hopWait = 0
  /** The furthest row this hedgehog has reached (forward steps score once). */
  private best = START_ROW
  private time = TIME_TICKS
  private home: boolean[] = new Array(BURROWS).fill(false)
  private fox: { burrow: number; ticks: number } | null = null
  private foxTimer = 0
  private ladybug: { burrow: number; ticks: number } | null = null
  private ladybugTimer = 600
  private dead = 0
  private deathKind: 'splash' | 'bonk' = 'bonk'
  private levelClear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  /** Cosmetic sparkles, on their own rng so the game's stays seeded. */
  private fx = new Sparkles()
  private fxRng = backdropRng(37)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup -------------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.home = new Array(BURROWS).fill(false)
    const speed = levelCurve(level, HEDGEHOG_CURVES.speed)
    const trim = Math.floor(levelCurve(level, HEDGEHOG_CURVES.logTrim))
    const diving = Math.round(levelCurve(level, HEDGEHOG_CURVES.divingGroups))
    this.lanes = LANES.map((spec) => {
      const len = spec.kind === 'log' ? Math.max(2, spec.len - trim) : spec.len
      const gap = SPAN / spec.count
      const offset = this.rng() * gap
      const things: Thing[] = []
      for (let i = 0; i < spec.count; i++) {
        things.push({ x: -70 + offset + i * gap, len, dive: -1 })
      }
      if (spec.kind === 'turtles') {
        // Some turtle groups dive, each on its own beat.
        for (let i = 0; i < Math.min(diving, things.length); i += 2) {
          things[i]!.dive = Math.floor(this.rng() * DIVE_PERIOD)
        }
      }
      return { ...spec, things, vx: spec.speed * spec.dir * speed }
    })
    this.fox = null
    this.foxTimer = Math.round(levelCurve(level, HEDGEHOG_CURVES.foxEvery))
    this.ladybug = null
    this.ladybugTimer = 600
    this.resetHedgehog()
    this.banner = { text: `LEVEL ${level}`, sub: 'WALK THEM HOME', ticks: 90 }
  }

  private resetHedgehog() {
    this.hx = 150
    this.row = START_ROW
    this.facing = 'up'
    this.hop = null
    this.hopWait = 0
    this.best = START_ROW
    this.time = TIME_TICKS
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    this.moveLanes()
    this.updateVisitors()

    if (this.levelClear > 0) {
      if (--this.levelClear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetHedgehog()
        }
      }
      return
    }

    if (--this.time <= 0) {
      this.die('bonk', 'OUT OF TIME')
      return
    }
    if (this.hop) {
      this.advanceHop()
    } else {
      // Riding a log or a turtle carries the hedgehog along.
      if (isCreek(this.row)) this.hx += this.laneAt(this.row)!.vx
      this.readHop(controls)
    }
    if (this.dead === 0) this.checkHazards()
  }

  private moveLanes() {
    for (const lane of this.lanes) {
      for (const t of lane.things) {
        t.x += lane.vx
        if (lane.vx > 0 && t.x > W + 30) t.x -= SPAN
        if (lane.vx < 0 && t.x + t.len * TILE < -30) t.x += SPAN
      }
    }
  }

  private updateVisitors() {
    if (this.fox && --this.fox.ticks <= 0) this.fox = null
    if (this.ladybug && --this.ladybug.ticks <= 0) this.ladybug = null
    const empty = this.home
      .map((done, i) => (done ? -1 : i))
      .filter((i) => i >= 0)
    if (this.foxTimer > 0 && !this.fox && --this.foxTimer === 0) {
      this.foxTimer = Math.round(
        levelCurve(this.level, HEDGEHOG_CURVES.foxEvery),
      )
      const spots = empty.filter((i) => i !== this.ladybug?.burrow)
      if (spots.length > 1) {
        const burrow = spots[Math.floor(this.rng() * spots.length)]!
        this.fox = { burrow, ticks: 240 }
      }
    }
    if (!this.ladybug && --this.ladybugTimer <= 0) {
      this.ladybugTimer = 600
      const spots = empty.filter((i) => i !== this.fox?.burrow)
      if (spots.length) {
        const burrow = spots[Math.floor(this.rng() * spots.length)]!
        this.ladybug = { burrow, ticks: 300 }
      }
    }
  }

  private readHop(input: InputFrame) {
    if (this.hopWait > 0) {
      this.hopWait--
      return
    }
    const up = input.held.up || input.pressed.up || input.pressed.a
    let dx = 0
    let drow = 0
    if (up) {
      drow = -1
      this.facing = 'up'
    } else if (input.held.down || input.pressed.down) {
      drow = 1
      this.facing = 'down'
    } else if (input.held.left || input.pressed.left) {
      dx = -TILE
      this.facing = 'left'
    } else if (input.held.right || input.pressed.right) {
      dx = TILE
      this.facing = 'right'
    } else {
      return
    }
    const toRow = Math.max(0, Math.min(START_ROW, this.row + drow))
    // Hopping off a log or a turtle keeps its drift through the hop.
    const drift = isCreek(this.row) ? this.laneAt(this.row)!.vx * HOP_TICKS : 0
    const toX = Math.max(HALF + 3, Math.min(W - HALF - 3, this.hx + dx + drift))
    if (toRow === this.row && Math.abs(toX - this.hx) < 1) return
    this.hop = { fromX: this.hx, fromRow: this.row, toX, toRow, t: 0 }
    this.sound.play('blip')
  }

  private advanceHop() {
    const hop = this.hop!
    hop.t++
    const f = hop.t / HOP_TICKS
    this.hx = hop.fromX + (hop.toX - hop.fromX) * f
    if (hop.t < HOP_TICKS) return
    this.hop = null
    this.hopWait = HOP_REPEAT
    this.row = hop.toRow
    this.hx = hop.toX
    if (this.row < this.best) {
      this.best = this.row
      this.addScore(STEP_POINTS, this.hx, rowY(this.row))
    }
    if (this.row === 0) this.arriveAtHedge()
  }

  private arriveAtHedge() {
    const burrow = this.home.findIndex(
      (_, i) => Math.abs(burrowX(i) - this.hx) < BURROW_REACH,
    )
    if (burrow < 0 || this.home[burrow]) {
      this.die('bonk', 'BONK! INTO THE HEDGE')
      return
    }
    if (this.fox?.burrow === burrow) {
      this.die('bonk', 'THE FOX WOKE UP')
      return
    }
    this.home[burrow] = true
    const timeBonus = 10 * Math.floor(this.time / 30)
    this.addScore(HOME_POINTS + timeBonus, burrowX(burrow), rowY(0) + 4)
    if (this.ladybug?.burrow === burrow) {
      this.ladybug = null
      this.addScore(LADYBUG_POINTS, burrowX(burrow), rowY(1))
      this.fx.burst(burrowX(burrow), rowY(0) + 12, this.fxRng, {
        count: 14,
        colours: [RAMPS.pink[3], RAMPS.ember[3], RAMPS.gold[4]],
        speed: 2.2,
      })
      this.sound.play('pickup')
    }
    this.burst(burrowX(burrow), rowY(0) + 10, 10, '#fde68a')
    this.fx.burst(burrowX(burrow), rowY(0) + 10, this.fxRng, { count: 12 })
    this.sound.play('extra')
    if (this.home.every(Boolean)) {
      this.addScore(FAMILY_BONUS, W / 2, rowY(6))
      for (let i = 0; i < BURROWS; i++) {
        this.fx.burst(burrowX(i), rowY(0) + 10, this.fxRng, { count: 10 })
      }
      this.banner = {
        text: 'FAMILY HOME!',
        sub: 'EVERY HEDGEHOG IS SAFE',
        ticks: LEVEL_CLEAR_TICKS,
      }
      this.levelClear = LEVEL_CLEAR_TICKS
      this.fox = null
      this.ladybug = null
      this.sound.play('level')
      return
    }
    this.resetHedgehog()
  }

  private laneAt(row: number): Lane | undefined {
    return this.lanes.find((lane) => lane.row === row)
  }

  /** Is this turtle group under water right now (or at tick `at`)? */
  private submerged(t: Thing, at = this.tick): boolean {
    if (t.dive < 0) return false
    const phase = (at + t.dive) % DIVE_PERIOD
    return phase >= DIVE_DOWN && phase < DIVE_UP
  }

  private checkHazards() {
    // Traffic can catch a hedgehog mid-hop; the creek only matters on landing.
    const hop = this.hop
    const roadRow = hop
      ? Math.round(
          hop.fromRow + (hop.toRow - hop.fromRow) * (hop.t / HOP_TICKS),
        )
      : this.row
    if (isRoad(roadRow)) {
      const lane = this.laneAt(roadRow)!
      const hit = lane.things.some(
        (t) =>
          this.hx + HALF - 2 > t.x + 2 &&
          this.hx - HALF + 2 < t.x + t.len * TILE - 2,
      )
      if (hit) {
        this.die('bonk', 'BEEP BEEP! TRY AGAIN')
        return
      }
    }
    if (hop || !isCreek(this.row)) return
    if (this.hx < 4 || this.hx > W - 4) {
      this.die('splash', 'SWEPT DOWNSTREAM')
      return
    }
    const lane = this.laneAt(this.row)!
    const afloat = lane.things.some(
      (t) =>
        this.hx > t.x + 2 &&
        this.hx < t.x + t.len * TILE - 2 &&
        !this.submerged(t),
    )
    if (!afloat) this.die('splash', 'SPLASH!')
  }

  private die(kind: 'splash' | 'bonk', text: string) {
    this.lives--
    this.dead = DEATH_TICKS
    this.deathKind = kind
    this.hop = null
    const y = rowY(this.row) + TILE / 2
    if (kind === 'splash') this.burst(this.hx, y, 14, '#93c5fd')
    else this.burst(this.hx, y, 12, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 70 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA HEDGEHOG!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
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

  /** Where a lane's things will be `dt` ticks from now (wrapped like the lane). */
  private futureSpans(lane: Lane, dt: number) {
    return lane.things.map((t) => {
      let x = t.x + lane.vx * dt
      while (lane.vx > 0 && x > W + 30) x -= SPAN
      while (lane.vx < 0 && x + t.len * TILE < -30) x += SPAN
      return {
        x0: x,
        x1: x + t.len * TILE,
        sunk: this.submerged(t, this.tick + dt),
      }
    })
  }

  private roadClear(row: number, x: number, from: number, to: number): boolean {
    const lane = this.laneAt(row)
    if (!lane || !isRoad(row)) return true
    for (let dt = from; dt <= to; dt += 2) {
      const hit = this.futureSpans(lane, dt).some(
        (s) => x + HALF + 2 > s.x0 && x - HALF - 2 < s.x1,
      )
      if (hit) return false
    }
    return true
  }

  private creekSafe(row: number, x: number, dt: number): boolean {
    const lane = this.laneAt(row)
    if (!lane) return true
    const now = this.futureSpans(lane, dt)
    // Stay off a turtle group that is about to dive.
    const soon = this.futureSpans(lane, dt + 40)
    return now.some(
      (s, i) => x > s.x0 + 5 && x < s.x1 - 5 && !s.sunk && !soon[i]!.sunk,
    )
  }

  private safeLanding(row: number, x: number): boolean {
    if (x < 14 || x > W - 14) return false
    if (row === 0) {
      const burrow = this.home.findIndex(
        (_, i) => Math.abs(burrowX(i) - x) < BURROW_REACH - 3,
      )
      return burrow >= 0 && !this.home[burrow] && this.fox?.burrow !== burrow
    }
    if (isRoad(row)) return this.roadClear(row, x, 0, HOP_TICKS + 16)
    if (isCreek(row)) return this.creekSafe(row, x, HOP_TICKS)
    return true
  }

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
    if (this.hop || this.hopWait > 0 || this.dead > 0) return frame
    const drift = isCreek(this.row) ? this.laneAt(this.row)!.vx * HOP_TICKS : 0
    const x = this.hx + drift
    const hereSafe = isRoad(this.row)
      ? this.roadClear(this.row, this.hx, 0, HOP_TICKS + 6)
      : true
    if (this.safeLanding(this.row - 1, x)) {
      held.up = true
      return frame
    }
    // At the top of the creek, slide along toward an open burrow.
    if (this.row === 1) {
      const open = this.home
        .map((done, i) => (done || this.fox?.burrow === i ? null : burrowX(i)))
        .filter((bx): bx is number => bx !== null)
      const target = open.reduce(
        (a, b) => (Math.abs(b - this.hx) < Math.abs(a - this.hx) ? b : a),
        open[0] ?? W / 2,
      )
      const step = target < this.hx ? -TILE : TILE
      if (Math.abs(target - this.hx) > 6 && this.safeLanding(1, x + step)) {
        if (step < 0) held.left = true
        else held.right = true
        return frame
      }
    }
    // Drifting toward the edge of the creek: step back toward the middle.
    if (isCreek(this.row) && (this.hx < 70 || this.hx > W - 70)) {
      const step = this.hx < W / 2 ? TILE : -TILE
      if (this.safeLanding(this.row, x + step)) {
        if (step < 0) held.left = true
        else held.right = true
        return frame
      }
      if (this.safeLanding(this.row + 1, x)) {
        held.down = true
        return frame
      }
    }
    if (!hereSafe) {
      for (const step of [-TILE, TILE]) {
        if (this.safeLanding(this.row, this.hx + step)) {
          if (step < 0) held.left = true
          else held.right = true
          return frame
        }
      }
      if (this.safeLanding(this.row + 1, this.hx)) held.down = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGround(g)
    this.renderCreek(g)
    for (const lane of this.lanes) this.renderLane(g, lane)
    this.renderBurrows(g)
    if (this.dead === 0 && !this.over && this.levelClear === 0) {
      this.renderHedgehog(g)
    } else if (this.dead > 0) {
      this.renderMishap(g)
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderGround(g: CanvasRenderingContext2D) {
    // Everything that never moves, painted once: dusk sky and hills, the hedge and its
    // burrows, the creek bed, the meadow verges, the kerbs and the asphalt.
    cachedLayer(g, 'hedgehog-crossing-ground', W, H, (k) => {
      const rand = backdropRng(17)
      // Dusk sky over two ranges of hills, a moon between the HUD boxes.
      bandedGradient(k, 0, 0, W, TOP, SKY_BANDS, 2)
      glow(k, 150, 11, 16, RAMPS.cream[3], 0.35)
      shadedOrb(k, 150, 11, 5, RAMPS.cream, { outline: null })
      drawRidge(k, FAR_HILLS, {
        base: TOP,
        bottom: TOP,
        width: W,
        fill: mix(RAMPS.night[3], RAMPS.leaf[0], 0.5),
        rim: RAMPS.night[4],
      })
      drawRidge(k, NEAR_HILLS, {
        base: TOP + 1,
        bottom: TOP,
        width: W,
        step: 2,
        fill: RAMPS.leaf[0],
        rim: RAMPS.leaf[1],
      })
      // The hedge: two rows of shaded leafy bumps.
      const hedgeY = rowY(0)
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(0, hedgeY, W, TILE)
      for (const [row, top, ramp] of [
        [0, hedgeY + 1, RAMPS.leaf],
        [1, hedgeY + 12, RAMPS.leaf],
      ] as const) {
        for (let x = -4 - row * 4; x < W + 8; x += 9) {
          const bx = x + Math.floor(rand() * 3)
          const by = top + Math.floor(rand() * 3)
          const r = 6 - row
          k.fillStyle = INK
          k.beginPath()
          k.arc(bx, by, r + 1, 0, Math.PI * 2)
          k.fill()
          for (const [dx, dy, kk, step] of [
            [0, 0, 1, 1],
            [-1, -1, 0.75, 2],
            [-2, -2, 0.4, 3 - row],
          ] as const) {
            k.fillStyle = ramp[step]!
            k.beginPath()
            k.arc(bx + dx, by + dy, r * kk, 0, Math.PI * 2)
            k.fill()
          }
        }
      }
      for (let i = 0; i < 70; i++) {
        k.fillStyle = rand() < 0.5 ? RAMPS.leaf[4] : RAMPS.leaf[3]
        k.fillRect(
          Math.floor(rand() * W),
          hedgeY - 4 + Math.floor(rand() * 20),
          1,
          1,
        )
      }
      // Burrows: an earthen arch, lit on the upper left, round a dark hole.
      for (let i = 0; i < BURROWS; i++) {
        const bx = burrowX(i)
        const by = hedgeY + 12
        const arch = (dx: number, dy: number, r: number, depth: number) => {
          k.beginPath()
          k.arc(bx + dx, by + dy, r, Math.PI, 0)
          k.fill()
          k.fillRect(bx + dx - r, by + dy, r * 2, depth)
        }
        k.fillStyle = INK
        arch(0, 0, 11.5, 8)
        k.fillStyle = RAMPS.earth[1]
        arch(0, 0, 10.5, 8)
        k.fillStyle = RAMPS.earth[3]
        arch(-1, -1, 9.5, 2)
        k.fillStyle = RAMPS.earth[2]
        arch(0, 0, 9, 8)
        k.fillStyle = INK
        arch(0, 1, 7.5, 7)
        k.fillStyle = RAMPS.night[0]
        arch(0, 2, 6.5, 6)
        k.fillStyle = RAMPS.earth[1]
        k.fillRect(bx - 7, hedgeY + TILE - 2, 14, 2)
      }
      // The creek bed in HDMA bands, ripples, and the hedge's shadow on the water.
      bandedGradient(k, 0, rowY(1), W, TILE * 5, WATER_BANDS, 4)
      for (let i = 0; i < 46; i++) {
        k.fillStyle = rand() < 0.6 ? RAMPS.water[0] : RAMPS.water[2]
        k.fillRect(
          Math.floor(rand() * W),
          rowY(1) + 3 + Math.floor(rand() * (TILE * 5 - 6)),
          3 + Math.floor(rand() * 6),
          1,
        )
      }
      k.fillStyle = rgba(INK, 0.45)
      k.fillRect(0, rowY(1), W, 2)
      k.fillStyle = rgba(INK, 0.2)
      k.fillRect(0, rowY(1) + 2, W, 2)
      // Meadow verges: the median between road and creek, and the start lawn.
      this.paintVerge(k, MEDIAN_ROW, rand)
      this.paintVerge(k, START_ROW, rand)
      // The road: asphalt lanes, shaded, speckled, with tyre-worn tracks.
      for (let row = 7; row <= 11; row++) {
        const y = rowY(row)
        bandedGradient(k, 0, y, W, TILE, ASPHALT_BANDS, 2)
        k.fillStyle = rgba(INK, 0.22)
        k.fillRect(0, y + 5, W, 2)
        k.fillRect(0, y + 14, W, 2)
        for (let i = 0; i < 40; i++) {
          k.fillStyle = rand() < 0.5 ? RAMPS.steel[1] : RAMPS.night[0]
          k.fillRect(
            Math.floor(rand() * W),
            y + Math.floor(rand() * TILE),
            1,
            1,
          )
        }
      }
      // Dashed lane markings, raised paint with a lit top edge.
      for (let row = 8; row <= 11; row++) {
        for (let x = 4; x < W; x += 24) {
          k.fillStyle = INK
          k.fillRect(x - 1, rowY(row) - 2, 14, 4)
          k.fillStyle = RAMPS.cream[4]
          k.fillRect(x, rowY(row) - 1, 12, 1)
          k.fillStyle = RAMPS.cream[1]
          k.fillRect(x, rowY(row), 12, 1)
        }
      }
      // Kerbstones along both edges of the road.
      for (const ky of [rowY(7) - 4, rowY(START_ROW)]) {
        for (let x = 0, i = 0; x < W; x += 12, i++) {
          bevel(k, x, ky, 11, 3, i % 2 ? RAMPS.cream : RAMPS.steel, {
            depth: 1,
          })
        }
      }
      // Rich soil under the start lawn, where the HUD sits.
      bandedGradient(
        k,
        0,
        rowY(START_ROW + 1),
        W,
        H - rowY(START_ROW + 1),
        [RAMPS.earth[1], RAMPS.earth[0], RAMPS.night[0]],
        2,
      )
    })
  }

  /** A grass verge: banded turf, a sandy lip by the creek, tufts and little flowers. */
  private paintVerge(
    k: CanvasRenderingContext2D,
    row: number,
    rand: () => number,
  ) {
    const y = rowY(row)
    bandedGradient(
      k,
      0,
      y,
      W,
      TILE,
      [RAMPS.leaf[3], RAMPS.leaf[2], RAMPS.leaf[2], RAMPS.leaf[1]],
      2,
    )
    if (row === MEDIAN_ROW) {
      k.fillStyle = INK
      k.fillRect(0, y, W, 1)
      k.fillStyle = RAMPS.earth[3]
      k.fillRect(0, y + 1, W, 1)
      k.fillStyle = RAMPS.earth[2]
      k.fillRect(0, y + 2, W, 1)
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(rand() * W)
      const ty = y + 4 + Math.floor(rand() * (TILE - 7))
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(x, ty + 1, 1, 2)
      k.fillStyle = rand() < 0.3 ? RAMPS.leaf[4] : RAMPS.leaf[3]
      k.fillRect(x + 1, ty, 1, 2)
    }
    for (let i = 0; i < 14; i++) {
      const x = 8 + i * 20 + (row % 3) * 3
      const fy = y + 5 + ((i * 7) % 9)
      k.fillStyle = INK
      k.fillRect(x - 1, fy - 2, 3, 5)
      k.fillRect(x - 2, fy - 1, 5, 3)
      k.fillStyle = FLOWER_COLOURS[i % FLOWER_COLOURS.length]!
      k.fillRect(x, fy - 1, 1, 3)
      k.fillRect(x - 1, fy, 3, 1)
      k.fillStyle = RAMPS.gold[4]
      k.fillRect(x, fy, 1, 1)
    }
  }

  private renderCreek(g: CanvasRenderingContext2D) {
    // Light dancing on the water, drifting with each lane's current.
    for (const s of SHIMMER) {
      const lane = this.laneAt(s.row)
      const drift =
        (lane?.vx ?? 0) * 0.5 + (lane && lane.vx < 0 ? -s.speed : s.speed)
      const span = W + 40
      const x = ((((s.x + this.tick * drift) % span) + span) % span) - 20
      const flash = Math.sin(this.tick / 14 + s.phase)
      if (flash < -0.4) continue
      g.fillStyle = flash > 0.7 ? RAMPS.water[4] : RAMPS.water[3]
      g.fillRect(Math.round(x), rowY(s.row) + s.y, s.w, 1)
    }
    drawStars(g, SKY_STARS, this.tick, RAMPS.purple)
  }

  private renderLane(g: CanvasRenderingContext2D, lane: Lane) {
    const y = rowY(lane.row)
    for (const t of lane.things) {
      const w = t.len * TILE
      switch (lane.kind) {
        case 'log':
          this.renderLog(g, lane, t, y, w)
          break
        case 'turtles':
          this.renderTurtles(g, t, y, lane.dir)
          break
        default:
          this.renderVehicle(g, lane, t.x, y, w)
      }
    }
  }

  private renderLog(
    g: CanvasRenderingContext2D,
    lane: Lane,
    t: Thing,
    y: number,
    w: number,
  ) {
    const x = Math.round(t.x)
    // A dark wake under the log, foam curling off its leading end.
    g.fillStyle = rgba(INK, 0.32)
    g.fillRect(x + 3, y + 15, w - 4, 3)
    const sprite = LOG_SPRITES[t.len - 1] ?? LOG_SPRITES[2]!
    drawSprite(g, sprite, x, y + 3, {
      anchor: 'topleft',
      flipX: lane.dir < 0,
    })
    const nose = lane.dir > 0 ? x + w + 1 : x - 3
    const f = Math.floor(this.tick / 8) % 2
    g.fillStyle = RAMPS.water[4]
    g.fillRect(nose, y + 5 + f * 2, 2, 1)
    g.fillRect(nose + lane.dir, y + 12 - f * 2, 2, 1)
    g.fillStyle = RAMPS.water[3]
    g.fillRect(nose + lane.dir * 2, y + 8 + f, 1, 1)
  }

  private renderTurtles(
    g: CanvasRenderingContext2D,
    t: Thing,
    y: number,
    dir: 1 | -1,
  ) {
    const cy = y + TILE / 2
    if (this.submerged(t)) {
      // Rings and bubbles where the turtles went down.
      g.save()
      g.lineWidth = 1
      for (let i = 0; i < t.len; i++) {
        const cx = Math.round(t.x + i * TILE + TILE / 2)
        const grow = ((this.tick + i * 7) % 24) / 24
        g.strokeStyle = rgba(RAMPS.water[4], 0.7 * (1 - grow))
        g.beginPath()
        g.ellipse(cx, cy, 4 + grow * 5, 2 + grow * 3, 0, 0, Math.PI * 2)
        g.stroke()
        g.fillStyle = RAMPS.water[4]
        const b = Math.floor(this.tick / 10 + i) % 3
        g.fillRect(cx - 2 + b * 2, cy - 2 - b, 1, 1)
      }
      g.restore()
      return
    }
    const phase = t.dive < 0 ? -1 : (this.tick + t.dive) % DIVE_PERIOD
    const warning = phase >= DIVE_WARN && phase < DIVE_DOWN
    const surfacing = phase >= DIVE_UP && phase < DIVE_UP + 14
    const sinking =
      surfacing || (warning && Math.floor(this.tick / 6) % 2 === 0)
    for (let i = 0; i < t.len; i++) {
      const cx = t.x + i * TILE + TILE / 2
      g.fillStyle = rgba(RAMPS.water[0], 0.45)
      g.beginPath()
      g.ellipse(cx + 1, cy + 3, 7, 3, 0, 0, Math.PI * 2)
      g.fill()
      const paddle = Math.floor((this.tick + i * 5) / 10) % 2
      const sprite = sinking
        ? TURTLE_SINKING
        : paddle
          ? TURTLE_SPRITES[1]
          : TURTLE_SPRITES[0]
      drawSprite(g, sprite, cx, cy, { flipX: dir < 0 })
    }
  }

  private renderVehicle(
    g: CanvasRenderingContext2D,
    lane: Lane,
    x: number,
    y: number,
    w: number,
  ) {
    const sprite = VEHICLE_SPRITES[lane.row]
    if (!sprite) return
    const cx = x + w / 2
    dropShadow(g, cx + 1, y + TILE - 4, w / 2 - 1, 2.5, 0.45)
    if (lane.kind === 'racer') {
      // Speed streaks trailing the racer.
      g.fillStyle = rgba(RAMPS.pink[4], 0.7)
      for (let i = 1; i <= 3; i++) {
        g.fillRect(
          Math.round(lane.dir > 0 ? x - i * 6 : x + w + i * 6 - 4),
          y + 7 + i * 3,
          4,
          1,
        )
      }
    }
    drawSprite(g, sprite, cx, y + TILE - 3, {
      anchor: 'feet',
      flipX: lane.dir < 0,
    })
    // Headlamps: the robots' eyes light the road ahead.
    const front = lane.dir > 0 ? x + w + 2 : x - 2
    glow(g, front, y + 10, 7, RAMPS.gold[3], 0.3)
  }

  private renderBurrows(g: CanvasRenderingContext2D) {
    const y = rowY(0) + 12
    for (let i = 0; i < BURROWS; i++) {
      const bx = burrowX(i)
      if (this.home[i]) {
        glow(g, bx, y + 2, 14, RAMPS.gold[3], 0.35)
        drawSprite(g, HOG_SLEEP, bx, y + 3)
        if (Math.floor(this.tick / 30) % 2 === 0) {
          drawText(g, 'z', bx + 8, y - 10, {
            color: '#e0e7ff',
            outline: INK,
          })
        }
      }
      if (this.fox?.burrow === i) {
        const frame = Math.floor(this.tick / 40) % 4 === 3 ? 1 : 0
        drawSprite(g, FOX_SPRITES[frame], bx, y + 1)
        drawText(g, 'Z', bx + 9, y - 12, {
          color: RAMPS.rust[3],
          outline: INK,
        })
      }
      if (this.ladybug?.burrow === i) {
        glow(
          g,
          bx,
          y + 2,
          13,
          RAMPS.pink[3],
          0.4 + 0.2 * Math.sin(this.tick / 8),
        )
        const frame = Math.floor(this.tick / 12) % 3 === 2 ? 1 : 0
        drawSprite(g, LADYBUG_SPRITES[frame], bx, y + 2)
      }
    }
  }

  private renderMishap(g: CanvasRenderingContext2D) {
    const y = rowY(this.row) + TILE / 2
    const t = DEATH_TICKS - this.dead
    if (this.deathKind === 'bonk') {
      // Dizzy stars circle the spot.
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 6 + (i * Math.PI * 2) / 3
        drawSprite(
          g,
          DIZZY_STAR,
          this.hx + Math.cos(a) * 9,
          y - 5 + Math.sin(a) * 3,
        )
      }
      return
    }
    // Splash rings spreading where the hedgehog went in.
    g.save()
    g.lineWidth = 1
    for (const lag of [0, 10]) {
      const r = Math.max(0, t - lag) * 0.35
      if (r <= 0) continue
      g.strokeStyle = rgba(RAMPS.water[4], Math.max(0, 0.8 - r / 20))
      g.beginPath()
      g.ellipse(Math.round(this.hx), y, r + 2, (r + 2) * 0.5, 0, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }

  private renderHedgehog(g: CanvasRenderingContext2D) {
    const hop = this.hop
    const f = hop ? hop.t / HOP_TICKS : 0
    const lift = hop ? Math.sin(f * Math.PI) * 4 : 0
    const row = hop ? hop.fromRow + (hop.toRow - hop.fromRow) * f : this.row
    const x = this.hx
    const ground = rowY(row) + TILE / 2
    dropShadow(g, x + 1, ground + 6, 6 - lift * 0.4, 2, 0.45 - lift * 0.04)
    const frames = HOG_SPRITES[this.facing]
    drawSprite(g, hop ? frames[1] : frames[0], x, ground - lift)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score on the left, high score and level on the right; the moon shows between.
    hudPanel(g, 3, 3, 84, 22, RAMPS.leaf)
    drawText(g, String(this.score).padStart(6, '0'), 9, 7, {
      scale: 2,
      color: RAMPS.leaf[4],
      shadow: INK,
    })
    hudPanel(g, W - 79, 3, 76, 22)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 8, 6, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `LEVEL ${this.level}`, W - 8, 15, {
      align: 'right',
      color: RAMPS.gold[3],
      outline: INK,
    })
    // Spare hedgehogs waiting on the lawn.
    const base = rowY(START_ROW + 1)
    hudPanel(g, 3, base + 4, 102, 24, RAMPS.earth)
    for (let i = 0; i < Math.min(this.lives - 1, 6); i++) {
      drawSprite(g, HOG_SPRITES.right[0], 13 + i * 16, base + 16)
    }
    // The time bar, a gauge that runs green to gold to red as the hedgehog dawdles.
    const frac = Math.max(0, this.time / TIME_TICKS)
    hudPanel(g, 110, base + 4, W - 113, 24, RAMPS.leaf)
    drawText(g, 'TIME', 117, base + 12, {
      color: RAMPS.leaf[4],
      outline: INK,
    })
    const gx = 146
    const gw = W - 10 - gx
    const ramp =
      frac > 0.33 ? RAMPS.leaf : frac > 0.15 ? RAMPS.gold : RAMPS.ember
    if (frac <= 0.15) {
      glow(
        g,
        gx + gw * frac,
        base + 16,
        12,
        RAMPS.ember[3],
        0.3 + 0.3 * Math.sin(this.tick / 4),
      )
    }
    gauge(g, gx, base + 12, gw, 8, frac, ramp)
    g.fillStyle = rgba(INK, 0.5)
    for (let i = 1; i < 6; i++) {
      g.fillRect(gx + Math.round((gw * i) / 6), base + 12, 1, 8)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, rowY(MEDIAN_ROW) + 3, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, rowY(MEDIAN_ROW) + 22, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const hedgehogCrossing: ArcadeGameModule = {
  create: (options) => new HedgehogCrossing(options),
}

export const create = hedgehogCrossing.create
export default hedgehogCrossing

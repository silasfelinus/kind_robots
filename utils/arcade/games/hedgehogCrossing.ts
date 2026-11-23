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
//
// Depth pass slice 1 (kr-arcade/t-102): lanes are data (../hedgehogCrossing/
// lanes.ts) and each lane kind brings its own spawn, step, touch and draw
// (LANE_BEHAVIOURS below). The board remixes as the levels climb: snapping
// logs from level 3, delivery bots weaving across rows 9-10 from level 4, a
// heron fishing the creek from level 6, and new mixes every level past 11.

import { drawText } from '../font'
import {
  BOT_MERGE,
  LANE_KINDS,
  SNAP_PERIOD,
  SNAP_YAWN,
  SPAN,
  boardLanes,
  legOneCrossing,
  botRows,
  newArrivals,
  newBot,
  snapPhase,
  snapperTouch,
  stepBot,
} from '../hedgehogCrossing/lanes'
import type { Bot, LaneKind, LaneSpec, Touch } from '../hedgehogCrossing/lanes'
import {
  DASH_COOLDOWN,
  DASH_ROWS,
  DASH_TICKS,
  HALF,
  HEDGEHOG_CURVES,
  HERON_FROM,
  HERON_REACH,
  HERON_STAB,
  HERON_SWEEP,
  HOP_TICKS,
  MAX_PARADE,
  MEDIAN_ROW,
  SNAKE_FLICK,
  SNAKE_LEN,
  START_ROW,
  TILE,
  W,
  canDash,
  escalation,
  heronStrikes,
  landing,
  newHeron,
  newSnake,
  paradeBonus,
  paradeMultiplier,
  snakeBites,
  stepHeron,
  stepSnake,
} from '../hedgehogCrossing/rules'
import type { Delta, Escalation, Heron, Snake } from '../hedgehogCrossing/rules'
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

const H = 320
const TOP = 28
const START_LIVES = 4
const HOP_REPEAT = 4
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

export { HEDGEHOG_CURVES }

type Thing = {
  x: number
  len: number
  /** A turtle group's dive beat, or a snapping log's yawn beat (-1: never). */
  dive: number
  /** A delivery bot's road sense: which row it is in, and its blinker. */
  bot?: Bot
}
type Lane = LaneSpec & { things: Thing[]; vx: number }
type Hop = {
  fromX: number
  fromRow: number
  toX: number
  toRow: number
  t: number
  ticks: number
  dash: boolean
}
/** A hoglet in the Family Parade: it copies each hop the one ahead made, one hop behind. */
type Hoglet = {
  x: number
  row: number
  hop: Hop | null
  wait: number
  queue: Delta[]
  /** Where it scurries back to (on the median) when bumped. */
  home: number
}
type Lost = { row: number; thing: number; off: number }
type Hazard = { kind: 'splash' | 'bonk'; text: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
type Banner = { text: string; sub?: string; ticks: number }

/** How long a newcomer's introduction stays up. */
const INTRO_TICKS = 150

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

/** A hoglet: half a hedgehog's size, face up, big eyes. */
const HOGLET = pixelSprite(
  [
    '...bcb...',
    '..bcCcb..',
    '..bkCkb..',
    '.2323232.',
    '232323232',
    '323232323',
    '.3232323.',
    '..32323..',
  ],
  HOG_PALETTE,
)

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

/** Snapping logs: the same bark, gone mossy green, so they read apart from plain logs. */
const SNAP_RAMP = RAMPS.earth.map((c, i) =>
  mix(c, RAMPS.leaf[i]!, 0.42),
) as unknown as Ramp
const SNAPPER_SPRITES = [1, 2, 3, 4, 5, 6].map((len) =>
  pixelSprite(logRows(len), { ...LOG_PALETTE, ...rampPalette(SNAP_RAMP) }),
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

/** A delivery bot, side on and facing right: a parcel strapped on top, a face screen, wheels. */
const BOT_ROWS = [
  '..nnnnnnnn........',
  '..nBBBBBBn........',
  '..nbbbybbn....a...',
  '..nbbbybbn....a...',
  '.3444444444444443.',
  '.4333333333GGGG3..',
  '.4322222222GkGk3y.',
  '.432222222GGGGG3y.',
  '.3222222222222221.',
  '.21tTt111111tTt1..',
  '...TkT......TkT...',
  '...ttt......ttt...',
]

const VEHICLE_ROWS: Partial<Record<LaneKind, readonly string[]>> = {
  car: CAR_ROWS,
  racer: RACER_ROWS,
  tractor: TRACTOR_ROWS,
  bus: busRows(),
  bot: BOT_ROWS,
}

/** Vehicle sprites, painted once per kind and lane ramp the first time a lane needs them. */
const VEHICLE_SPRITES = new Map<string, PixelSprite>()

function vehicleSprite(lane: Lane): PixelSprite | null {
  const key = `${lane.kind}:${lane.ramp}`
  const cached = VEHICLE_SPRITES.get(key)
  if (cached) return cached
  const rows = VEHICLE_ROWS[lane.kind]
  if (!rows) return null
  const sprite = pixelSprite(rows, {
    ...vehiclePalette(RAMPS[lane.ramp]),
    n: RAMPS.earth[1],
    b: RAMPS.earth[2],
    B: RAMPS.earth[3],
  })
  VEHICLE_SPRITES.set(key, sprite)
  return sprite
}

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

// --- lane behaviours: each lane kind's spawn, step, touch and draw ---------------------

/** What the lanes need from the game while they step. */
type LaneWorld = {
  rng: () => number
  laneAt(row: number): Lane | undefined
  /** Everything on the road in this row right now (cars, and bots in or merging into it). */
  occupants(row: number): Thing[]
}

type LaneBehaviour = {
  spawn(spec: LaneSpec, esc: Escalation, rng: () => number): Thing[]
  step(lane: Lane, world: LaneWorld): void
  /** A thing as it will be `dt` ticks from now (for the pilot's look-ahead). */
  project(lane: Lane, t: Thing, dt: number): Thing
  /** What a body at x on `row` meets on this thing at tick `at`; `pad` is a cautious margin. */
  touch(
    lane: Lane,
    t: Thing,
    x: number,
    row: number,
    at: number,
    pad: number,
  ): Touch | null
  draw(g: CanvasRenderingContext2D, lane: Lane, t: Thing, tick: number): void
}

function submergedAt(t: Thing, at: number): boolean {
  if (t.dive < 0) return false
  const phase = (at + t.dive) % DIVE_PERIOD
  return phase >= DIVE_DOWN && phase < DIVE_UP
}

/** A lane's things spaced evenly round the wrap, from one seeded offset. */
function spread(spec: LaneSpec, len: number, rng: () => number): Thing[] {
  const gap = SPAN / spec.count
  const offset = rng() * gap
  return Array.from({ length: spec.count }, (_, i) => ({
    x: -70 + offset + i * gap,
    len,
    dive: -1,
  }))
}

function wrapX(lane: Lane, x: number, len: number): number {
  while (lane.vx > 0 && x > W + 30) x -= SPAN
  while (lane.vx < 0 && x + len * TILE < -30) x += SPAN
  return x
}

function drift(lane: Lane) {
  for (const t of lane.things) t.x = wrapX(lane, t.x + lane.vx, t.len)
}

function shift(lane: Lane, t: Thing, dt: number): Thing {
  return { ...t, x: wrapX(lane, t.x + lane.vx * dt, t.len) }
}

/** Does a body at x overlap this thing (traffic)? */
function hits(t: Thing, x: number, pad: number): boolean {
  return x + HALF - 4 + pad > t.x && x - HALF + 4 - pad < t.x + t.len * TILE
}

/** Is a body at x standing on this thing (a platform)? */
function rides(t: Thing, x: number, pad: number): boolean {
  return x > t.x + 2 + pad && x < t.x + t.len * TILE - 2 - pad
}

/** Where a delivery bot is drawn: in its row, or partway across while it merges. */
function botY(lane: Lane, t: Thing): number {
  const b = t.bot
  if (!b) return rowY(lane.row)
  if (b.merge <= 0) return rowY(b.at)
  const f = 1 - b.merge / BOT_MERGE
  return rowY(b.at) + (rowY(b.to) - rowY(b.at)) * f
}

function drawVehicle(
  g: CanvasRenderingContext2D,
  lane: Lane,
  x: number,
  y: number,
  w: number,
) {
  const sprite = vehicleSprite(lane)
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

function drawBot(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const w = t.len * TILE
  const y = botY(lane, t)
  drawVehicle(g, lane, t.x, y, w)
  const b = t.bot
  if (!b || b.blink <= 0 || Math.floor(tick / 8) % 2 === 1) return
  // The tell: an amber blinker on the side it is about to move to, and an arrow.
  const up = b.to < b.at
  const lx = Math.round(lane.dir > 0 ? t.x + w - 4 : t.x + 2)
  const ly = Math.round(up ? y + 2 : y + TILE - 5)
  glow(g, lx + 1, ly + 1, 8, RAMPS.gold[3], 0.6)
  g.fillStyle = INK
  g.fillRect(lx - 1, ly - 1, 4, 4)
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(lx, ly, 2, 2)
  drawText(g, up ? '↑' : '↓', t.x + w / 2, up ? y - 7 : y + TILE - 2, {
    align: 'center',
    color: RAMPS.gold[3],
    outline: INK,
  })
}

function drawLog(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const y = rowY(lane.row)
  const w = t.len * TILE
  const x = Math.round(t.x)
  // A dark wake under the log, foam curling off its leading end.
  g.fillStyle = rgba(INK, 0.32)
  g.fillRect(x + 3, y + 15, w - 4, 3)
  const sprites = lane.kind === 'snapper' ? SNAPPER_SPRITES : LOG_SPRITES
  const sprite = sprites[t.len - 1] ?? sprites[2]!
  drawSprite(g, sprite, x, y + 3, {
    anchor: 'topleft',
    flipX: lane.dir < 0,
  })
  const nose = lane.dir > 0 ? x + w + 1 : x - 3
  const f = Math.floor(tick / 8) % 2
  g.fillStyle = RAMPS.water[4]
  g.fillRect(nose, y + 5 + f * 2, 2, 1)
  g.fillRect(nose + lane.dir, y + 12 - f * 2, 2, 1)
  g.fillStyle = RAMPS.water[3]
  g.fillRect(nose + lane.dir * 2, y + 8 + f, 1, 1)
}

/** A snapping log: a mossy log whose leading end has eyes, and, when it yawns, jaws. */
function drawSnapper(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  drawLog(g, lane, t, tick)
  const y = rowY(lane.row)
  const w = t.len * TILE
  const dir = lane.dir
  const head = Math.round(dir > 0 ? t.x + w : t.x)
  const phase = snapPhase(t.dive, tick)
  if (phase === 'yawn') {
    // The jaws open across the head half: a wedge of pink mouth and little cream teeth.
    const into = ((tick + t.dive) % SNAP_PERIOD) - (SNAP_PERIOD - SNAP_YAWN)
    const open = Math.min(1, into / 8) * (into > SNAP_YAWN - 8 ? 0.6 : 1)
    const tip = head - dir * (w / 2)
    const mid = y + 10
    const top = mid - 7 * open
    const bottom = mid + 6 * open
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(tip, mid)
    g.lineTo(head + dir, top - 1)
    g.lineTo(head + dir, bottom + 1)
    g.closePath()
    g.fill()
    g.fillStyle = RAMPS.pink[1]
    g.beginPath()
    g.moveTo(tip + dir * 3, mid)
    g.lineTo(head - dir, top + 1)
    g.lineTo(head - dir, bottom - 1)
    g.closePath()
    g.fill()
    g.fillStyle = RAMPS.cream[4]
    for (let i = 1; i <= 3; i++) {
      const tx = Math.round(head - dir * i * (w / 8))
      const f = 1 - (i * (w / 8)) / (w / 2)
      g.fillRect(tx, Math.round(mid - 7 * open * f) + 1, 1, 2)
      g.fillRect(tx, Math.round(mid + 6 * open * f) - 3, 1, 2)
    }
  }
  // Eyes on top of the head end: shut while it dozes; open, and glowing, before it yawns.
  for (const back of [9, 15]) {
    const ex = Math.round(head - dir * back)
    if (phase === 'doze') {
      g.fillStyle = INK
      g.fillRect(ex - 1, y + 4, 3, 1)
      continue
    }
    if (phase === 'eyes') glow(g, ex, y + 4, 6, RAMPS.gold[3], 0.45)
    g.fillStyle = INK
    g.fillRect(ex - 2, y + 2, 5, 5)
    g.fillStyle = phase === 'yawn' ? RAMPS.ember[4] : RAMPS.gold[4]
    g.fillRect(ex - 1, y + 3, 3, 3)
    g.fillStyle = INK
    g.fillRect(ex + (dir > 0 ? 1 : -1), y + 4, 1, 1)
  }
}

function drawTurtles(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const dir = lane.dir
  const cy = rowY(lane.row) + TILE / 2
  if (submergedAt(t, tick)) {
    // Rings and bubbles where the turtles went down.
    g.save()
    g.lineWidth = 1
    for (let i = 0; i < t.len; i++) {
      const cx = Math.round(t.x + i * TILE + TILE / 2)
      const grow = ((tick + i * 7) % 24) / 24
      g.strokeStyle = rgba(RAMPS.water[4], 0.7 * (1 - grow))
      g.beginPath()
      g.ellipse(cx, cy, 4 + grow * 5, 2 + grow * 3, 0, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = RAMPS.water[4]
      const b = Math.floor(tick / 10 + i) % 3
      g.fillRect(cx - 2 + b * 2, cy - 2 - b, 1, 1)
    }
    g.restore()
    return
  }
  const phase = t.dive < 0 ? -1 : (tick + t.dive) % DIVE_PERIOD
  const warning = phase >= DIVE_WARN && phase < DIVE_DOWN
  const surfacing = phase >= DIVE_UP && phase < DIVE_UP + 14
  const sinking = surfacing || (warning && Math.floor(tick / 6) % 2 === 0)
  for (let i = 0; i < t.len; i++) {
    const cx = t.x + i * TILE + TILE / 2
    g.fillStyle = rgba(RAMPS.water[0], 0.45)
    g.beginPath()
    g.ellipse(cx + 1, cy + 3, 7, 3, 0, 0, Math.PI * 2)
    g.fill()
    const paddle = Math.floor((tick + i * 5) / 10) % 2
    const sprite = sinking
      ? TURTLE_SINKING
      : paddle
        ? TURTLE_SPRITES[1]
        : TURTLE_SPRITES[0]
    drawSprite(g, sprite, cx, cy, { flipX: dir < 0 })
  }
}

function drawShopper(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const x = Math.round(t.x + TILE / 2)
  const y = rowY(lane.row) + 10
  const step = Math.floor(tick / 12) % 2
  dropShadow(g, x, y + 8, 6, 2, 0.4)
  g.fillStyle = RAMPS.steel[2]
  g.fillRect(x - 4, y - 4, 8, 10)
  g.fillStyle = RAMPS.cream[3]
  g.fillRect(x - 5, y - 9, 10, 6)
  g.fillStyle = INK
  g.fillRect(x + (lane.dir > 0 ? 1 : -3), y - 7, 2, 2)
  g.fillStyle = RAMPS.teal[4]
  g.fillRect(x - 5, y + 6, 3, 3 + step)
  g.fillRect(x + 2, y + 6, 3, 4 - step)
}

function drawBarrel(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const x = Math.round(t.x + TILE / 2)
  const y = rowY(lane.row) + 10
  g.save()
  g.translate(x, y)
  g.rotate(tick * lane.vx * 0.08)
  shadedOrb(g, 0, 0, 8, RAMPS.rust)
  g.strokeStyle = RAMPS.gold[3]
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(-6, -2)
  g.lineTo(6, -2)
  g.moveTo(-6, 3)
  g.lineTo(6, 3)
  g.stroke()
  g.restore()
}

function drawCrate(
  g: CanvasRenderingContext2D,
  lane: Lane,
  t: Thing,
  tick: number,
) {
  const x = Math.round(t.x)
  const y = rowY(lane.row) + 3 + Math.sin(tick / 16) * 1.5
  const w = t.len * TILE - 3
  g.fillStyle = RAMPS.earth[2]
  g.fillRect(x + 1, y, w, 12)
  g.fillStyle = RAMPS.gold[2]
  g.fillRect(x + 3, y + 2, w - 4, 7)
  g.strokeStyle = RAMPS.earth[4]
  g.lineWidth = 2
  g.strokeRect(x + 1, y, w, 12)
}

const VEHICLE: LaneBehaviour = {
  spawn: (spec, _esc, rng) => spread(spec, spec.len, rng),
  step: drift,
  project: shift,
  touch: (lane, t, x, row, _at, pad) =>
    row === lane.row && hits(t, x, pad) ? 'hit' : null,
  draw: (g, lane, t) => drawVehicle(g, lane, t.x, rowY(lane.row), t.len * TILE),
}

export const LANE_BEHAVIOURS: Record<LaneKind, LaneBehaviour> = {
  car: VEHICLE,
  tractor: VEHICLE,
  racer: VEHICLE,
  bus: VEHICLE,
  shopper: { ...VEHICLE, draw: drawShopper },
  barrel: { ...VEHICLE, draw: drawBarrel },
  crate: {
    spawn: (spec, esc, rng) =>
      spread(spec, Math.max(2, spec.len - esc.logTrim), rng),
    step: drift,
    project: shift,
    touch: (_lane, t, x, _row, _at, pad) =>
      rides(t, x, pad) ? 'ride' : null,
    draw: drawCrate,
  },
  log: {
    spawn: (spec, esc, rng) =>
      spread(spec, Math.max(2, spec.len - esc.logTrim), rng),
    step: drift,
    project: shift,
    touch: (_lane, t, x, _row, _at, pad) => (rides(t, x, pad) ? 'ride' : null),
    draw: drawLog,
  },
  turtles: {
    spawn: (spec, esc, rng) => {
      const things = spread(spec, spec.len, rng)
      // Some turtle groups dive, each on its own beat.
      const groups = Math.min(esc.divingGroups, things.length)
      for (let i = 0; i < groups; i += esc.diveStride) {
        things[i]!.dive = Math.floor(rng() * DIVE_PERIOD)
      }
      return things
    },
    step: drift,
    project: shift,
    touch: (_lane, t, x, _row, at, pad) =>
      rides(t, x, pad) && !submergedAt(t, at) ? 'ride' : null,
    draw: drawTurtles,
  },
  snapper: {
    spawn: (spec, esc, rng) => {
      // Long enough for a head half and a tail half; each wakes on its own beat.
      const things = spread(spec, Math.max(3, spec.len - esc.logTrim), rng)
      for (const t of things) t.dive = Math.floor(rng() * SNAP_PERIOD)
      return things
    },
    step: drift,
    project: shift,
    touch: (lane, t, x, _row, at, pad) =>
      snapperTouch(t.x, t.len, lane.dir, x, snapPhase(t.dive, at), pad),
    draw: drawSnapper,
  },
  bot: {
    spawn: (spec, _esc, rng) =>
      spread(spec, spec.len, rng).map((t) => ({
        ...t,
        bot: newBot(spec.row, 60 + Math.floor(rng() * 120)),
      })),
    step: (lane, world) => {
      drift(lane)
      const pair = lane.pair
      if (pair === undefined) return
      const pairVx = world.laneAt(pair)?.vx ?? 0
      for (const t of lane.things) {
        if (!t.bot) continue
        stepBot(
          t.bot,
          t,
          lane.vx,
          pairVx,
          lane.row,
          pair,
          world.occupants,
          world.rng,
        )
      }
    },
    project: (lane, t, dt) => {
      const moved = shift(lane, t, dt)
      if (!t.bot) return moved
      const bot = { ...t.bot }
      // Assume the worst: a blinker about to finish merges, covering both rows.
      if (bot.merge > 0 && bot.merge <= dt) {
        bot.at = bot.to
        bot.merge = 0
      } else if (bot.blink > 0 && bot.blink <= dt + BOT_MERGE) {
        bot.merge = BOT_MERGE
      }
      return { ...moved, bot }
    },
    touch: (lane, t, x, row, _at, pad) =>
      (t.bot ? botRows(t.bot) : [lane.row]).includes(row) && hits(t, x, pad)
        ? 'hit'
        : null,
    draw: drawBot,
  },
}

/** Lanes whose things can be in this row (a lane's own row, or the row its bots weave into). */
function covers(lane: Lane, row: number): boolean {
  return lane.row === row || lane.pair === row
}

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
  private snakes: Snake[] = []
  private snakeSpeed = 0.5
  /** Hoglets standing on the median, waiting for a hedgehog to lead them (x of each). */
  private waiting: number[] = []
  /** A lost hoglet riding a log, until a hedgehog on that log picks it up. */
  private lost: Lost | null = null
  private parade: Hoglet[] = []
  /** Hoglets already walked home this level (they do not come back). */
  private saved = 0
  private dashCool = 0
  private dead = 0
  private deathKind: 'splash' | 'bonk' = 'bonk'
  private levelClear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: Banner | null = null
  /** Banners waiting their turn (new lane kinds and creatures introducing themselves). */
  private bannerQueue: Banner[] = []
  private heron: Heron | null = null
  private heronTimer = 0
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
    const esc = escalation(level)
    // The board is data: Park Lane with this level's remixes, built lane by lane by its kind.
    this.lanes = boardLanes(level).map((base, index) => {
      const flip = esc.flipParity !== null && index % 2 === esc.flipParity
      const spec: LaneSpec = flip
        ? { ...base, dir: base.dir > 0 ? -1 : 1 }
        : base
      const things = LANE_BEHAVIOURS[spec.kind].spawn(spec, esc, this.rng)
      return { ...spec, things, vx: spec.speed * spec.dir * esc.speed }
    })
    // A lane that weaves into another keeps to that lane's direction of travel.
    for (const lane of this.lanes) {
      const pair = lane.pair === undefined ? undefined : this.laneAt(lane.pair)
      if (!pair) continue
      lane.dir = pair.vx >= 0 ? 1 : -1
      lane.vx = Math.abs(lane.vx) * lane.dir
    }
    this.heron = null
    this.heronTimer = Math.floor(esc.heronEvery / 2)
    this.fox = null
    this.foxTimer = esc.foxEvery
    this.ladybug = null
    this.ladybugTimer = 600
    this.snakeSpeed = esc.snakeSpeed
    this.snakes = Array.from({ length: esc.snakes }, () =>
      newSnake(
        30 + Math.floor(this.rng() * (W - 60)),
        this.rng() < 0.5 ? 1 : -1,
        60 + Math.floor(this.rng() * 100),
      ),
    )
    this.saved = 0
    this.waiting = []
    this.parade = []
    this.lost = null
    const logs = this.lanes.filter((lane) => lane.kind === 'log')
    if (esc.lostHoglet && logs.length > 0) {
      const lane = logs[Math.floor(this.rng() * logs.length)]!
      const thing = Math.floor(this.rng() * lane.things.length)
      this.lost = {
        row: lane.row,
        thing,
        off: (lane.things[thing]!.len * TILE) / 2,
      }
    }
    this.resetHedgehog()
    const crossing = legOneCrossing(level)
    this.banner = {
      text: crossing
        ? `${crossing.region} ${crossing.crossing}/5`
        : `LEVEL ${level}`,
      sub: 'WALK THEM HOME',
      ticks: 90,
    }
    this.bannerQueue = this.introsFor(level)
  }

  /** Banners for whatever turns up for the first time on this level. */
  private introsFor(level: number): Banner[] {
    const intros: Banner[] = []
    for (const kind of newArrivals(level)) {
      const intro = LANE_KINDS[kind].intro
      if (intro) intros.push({ ...intro, ticks: INTRO_TICKS })
    }
    if (level === 2) {
      intros.push({
        text: 'GRASS SNAKE',
        sub: 'ITS TONGUE FLICKS BEFORE IT TURNS',
        ticks: INTRO_TICKS,
      })
    }
    if (level === HERON_FROM) {
      intros.push({
        text: 'HERON!',
        sub: 'ITS SHADOW PICKS A COLUMN: LEAVE IT',
        ticks: INTRO_TICKS,
      })
    }
    return intros
  }

  private resetHedgehog() {
    this.hx = 150
    this.row = START_ROW
    this.facing = 'up'
    this.hop = null
    this.hopWait = 0
    this.best = START_ROW
    this.time = TIME_TICKS
    this.dashCool = 0
    this.bumpParade()
    this.fillWaiting()
  }

  /** Top the median up so every hoglet this level is either waiting, in line, riding or home. */
  private fillWaiting() {
    const esc = escalation(this.level)
    const total = esc.hoglets + (esc.lostHoglet ? 1 : 0)
    let have =
      this.waiting.length +
      this.parade.length +
      this.saved +
      (this.lost ? 1 : 0)
    while (have < total) {
      this.waiting.push(10 + TILE * Math.floor(this.rng() * 14))
      have++
    }
  }

  /** Everyone in line scurries back to the median, none the worse (the multiplier drops). */
  private bumpParade() {
    for (const h of this.parade) this.waiting.push(h.home)
    this.parade = []
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0)
      this.banner = this.bannerQueue.shift() ?? null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    this.stepLanes()
    this.updateSnakes()
    this.updateVisitors()
    this.updateHeron()

    if (this.levelClear > 0) {
      if (--this.levelClear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.bannerQueue = []
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
    if (this.dashCool > 0) this.dashCool--
    if (this.hop) {
      this.advanceHop()
    } else {
      // Riding a log or a turtle carries the hedgehog along.
      if (isCreek(this.row)) this.hx += this.laneAt(this.row)!.vx
      this.readHop(controls)
      if (!this.hop) this.pickUp()
    }
    if (this.dead === 0) this.checkHazards()
    if (this.dead === 0 && this.levelClear === 0) this.updateParade()
  }

  private updateSnakes() {
    for (const snake of this.snakes) stepSnake(snake, this.snakeSpeed, this.rng)
  }

  /** The x of the lost hoglet riding its log, or null once it has been picked up. */
  private lostX(): number | null {
    if (!this.lost) return null
    const lane = this.laneAt(this.lost.row)
    const thing = lane?.things[this.lost.thing]
    return thing ? thing.x + this.lost.off : null
  }

  /** Waiting hoglets on the median and the lost hoglet on its log join the line when reached. */
  private pickUp() {
    if (this.parade.length >= MAX_PARADE) return
    if (this.row === MEDIAN_ROW) {
      const i = this.waiting.findIndex((x) => Math.abs(x - this.hx) < 14)
      if (i >= 0) {
        const [x] = this.waiting.splice(i, 1)
        this.joinParade(x!, MEDIAN_ROW, x!)
        return
      }
    }
    const lostX = this.lostX()
    if (
      this.lost &&
      lostX !== null &&
      this.row === this.lost.row &&
      Math.abs(lostX - this.hx) < 14
    ) {
      const home = Math.max(30, Math.min(W - 30, Math.round(lostX)))
      this.lost = null
      this.joinParade(lostX, this.row, home)
    }
  }

  private joinParade(x: number, row: number, home: number) {
    this.parade.push({ x, row, hop: null, wait: 0, queue: [], home })
    this.sound.play('pickup')
    this.fx.burst(x, rowY(row) + TILE / 2, this.fxRng, {
      count: 8,
      colours: [RAMPS.gold[3], RAMPS.cream[4]],
      speed: 1.6,
    })
    this.floaters.push({
      x,
      y: rowY(row),
      text: `PARADE x${paradeMultiplier(this.parade.length)}`,
      life: 40,
    })
  }

  /** Each hoglet makes the hop the one ahead made, a hop behind, and is bumped by hazards. */
  private updateParade() {
    for (const h of [...this.parade]) {
      if (h.hop) {
        const hop = h.hop
        hop.t++
        h.x = hop.fromX + (hop.toX - hop.fromX) * (hop.t / hop.ticks)
        if (hop.t >= hop.ticks) {
          h.hop = null
          h.row = hop.toRow
          h.x = hop.toX
          h.wait = HOP_REPEAT
        }
      } else {
        if (isCreek(h.row)) h.x += this.laneAt(h.row)!.vx
        if (h.wait > 0) h.wait--
        // Always one hop behind: only move once a newer hop is waiting in the queue.
        else if (h.queue.length >= 2) {
          const delta = h.queue.shift()!
          const at = this.parade.indexOf(h)
          this.parade[at + 1]?.queue.push(delta)
          h.hop = this.planHop(h, delta)
        }
      }
      const hazard = this.hazardAt(
        h.x,
        h.hop ? this.hopRow(h.hop) : h.row,
        h.hop !== null,
      )
      if (hazard) this.bumpHoglet(h)
    }
  }

  private bumpHoglet(h: Hoglet) {
    const at = this.parade.indexOf(h)
    if (at < 0) return
    this.parade.splice(at, 1)
    this.waiting.push(h.home)
    this.burst(h.x, rowY(h.row) + TILE / 2, 6, '#fde68a')
    this.floaters.push({ x: h.x, y: rowY(h.row), text: 'BUMP!', life: 40 })
    this.sound.play('pop')
  }

  /** The hop a body at (x, row) makes for a delta: drift carried through the leap, edges clamped. */
  private planHop(body: { x: number; row: number }, delta: Delta): Hop | null {
    const ticks = delta.dash ? DASH_TICKS : HOP_TICKS
    const drift = isCreek(body.row) ? this.laneAt(body.row)!.vx * ticks : 0
    const { toX, toRow } = landing(body.x, body.row, delta, drift)
    if (toRow === body.row && Math.abs(toX - body.x) < 1) return null
    return {
      fromX: body.x,
      fromRow: body.row,
      toX,
      toRow,
      t: 0,
      ticks,
      dash: delta.dash === true,
    }
  }

  /** The row a hop is over right now, or -1 while a dash is in the air between its two rows. */
  private hopRow(hop: Hop): number {
    const f = hop.t / hop.ticks
    if (hop.dash) return f < 0.34 ? hop.fromRow : f > 0.66 ? hop.toRow : -1
    return Math.round(hop.fromRow + (hop.toRow - hop.fromRow) * f)
  }

  private stepLanes() {
    const world: LaneWorld = {
      rng: this.rng,
      laneAt: (row) => this.laneAt(row),
      occupants: (row) => this.occupants(row),
    }
    for (const lane of this.lanes) LANE_BEHAVIOURS[lane.kind].step(lane, world)
  }

  /** Everything that can be in a road row right now: its own traffic and bots weaving into it. */
  private occupants(row: number): Thing[] {
    const out: Thing[] = []
    for (const lane of this.lanes) {
      if (!covers(lane, row)) continue
      for (const t of lane.things) {
        const rows = t.bot ? botRows(t.bot) : [lane.row]
        if (rows.includes(row)) out.push(t)
      }
    }
    return out
  }

  /**
   * The heron: every so often its shadow sweeps the creek, closing on the hedgehog's column,
   * holds there (the tell), then the beak stabs. Leave the column.
   */
  private updateHeron() {
    const every = escalation(this.level).heronEvery
    if (this.heron) {
      if (!stepHeron(this.heron, this.hx)) this.heron = null
      else if (this.heron.phase === 'stab' && this.heron.t === 0) {
        this.sound.play('pop')
        this.fx.burst(this.heron.x, rowY(3) + TILE / 2, this.fxRng, {
          count: 10,
          colours: [RAMPS.water[4], RAMPS.water[3]],
          speed: 1.6,
        })
      }
      return
    }
    if (every <= 0 || this.levelClear > 0) return
    if (--this.heronTimer <= 0) {
      this.heronTimer = every
      this.heron = newHeron(this.rng() < 0.5)
    }
  }

  private updateVisitors() {
    if (this.fox && --this.fox.ticks <= 0) this.fox = null
    if (this.ladybug && --this.ladybug.ticks <= 0) this.ladybug = null
    const empty = this.home
      .map((done, i) => (done ? -1 : i))
      .filter((i) => i >= 0)
    if (this.foxTimer > 0 && !this.fox && --this.foxTimer === 0) {
      this.foxTimer = escalation(this.level).foxEvery
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
    let delta: Delta
    if (input.pressed.b && canDash(this.row, this.dashCool)) {
      // Bristle Dash: two rows in one leap, over the lane between.
      delta = { dx: 0, drow: -DASH_ROWS, dash: true }
      this.facing = 'up'
    } else if (up) {
      delta = { dx: 0, drow: -1 }
      this.facing = 'up'
    } else if (input.held.down || input.pressed.down) {
      delta = { dx: 0, drow: 1 }
      this.facing = 'down'
    } else if (input.held.left || input.pressed.left) {
      delta = { dx: -TILE, drow: 0 }
      this.facing = 'left'
    } else if (input.held.right || input.pressed.right) {
      delta = { dx: TILE, drow: 0 }
      this.facing = 'right'
    } else {
      return
    }
    const hop = this.planHop({ x: this.hx, row: this.row }, delta)
    if (!hop) return
    this.hop = hop
    if (delta.dash) {
      this.dashCool = DASH_COOLDOWN
      this.sound.play('shoot')
      this.fx.burst(this.hx, rowY(this.row) + TILE / 2, this.fxRng, {
        count: 6,
        colours: [RAMPS.cream[4], RAMPS.gold[3]],
        speed: 1.4,
      })
    } else {
      this.sound.play('blip')
    }
    this.parade[0]?.queue.push(delta)
  }

  private advanceHop() {
    const hop = this.hop!
    hop.t++
    const f = hop.t / hop.ticks
    this.hx = hop.fromX + (hop.toX - hop.fromX) * f
    if (hop.t < hop.ticks) return
    this.hop = null
    this.hopWait = HOP_REPEAT
    this.row = hop.toRow
    this.hx = hop.toX
    if (this.row < this.best) {
      const rows = this.best - this.row
      this.best = this.row
      this.addScore(
        STEP_POINTS * rows,
        this.hx,
        rowY(this.row),
        paradeMultiplier(this.parade.length),
      )
    }
    if (this.row === 0) this.arriveAtHedge()
    else this.pickUp()
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
    const line = this.parade.length
    this.addScore(
      HOME_POINTS + timeBonus,
      burrowX(burrow),
      rowY(0) + 4,
      paradeMultiplier(line),
    )
    if (line > 0) {
      // The whole line files into the burrow behind the leader.
      this.addScore(paradeBonus(line), burrowX(burrow), rowY(2))
      this.saved += line
      this.parade = []
      this.banner = {
        text: 'PARADE BONUS!',
        sub: `${line} HOGLET${line > 1 ? 'S' : ''} HOME SAFE`,
        ticks: 80,
      }
      this.fx.burst(burrowX(burrow), rowY(0) + 12, this.fxRng, {
        count: 8 + line * 6,
        colours: [RAMPS.gold[3], RAMPS.cream[4], RAMPS.pink[3]],
        speed: 2,
      })
    }
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

  /**
   * What every lane covering `row` does to a body at x, at tick `at`, each through its kind's
   * own `touch`. `dt` looks ahead (the pilot); `pad` is a cautious margin.
   */
  private touches(
    x: number,
    row: number,
    at = this.tick,
    pad = 0,
    dt = 0,
  ): Array<{ touch: Touch; kind: LaneKind }> {
    const out: Array<{ touch: Touch; kind: LaneKind }> = []
    for (const lane of this.lanes) {
      if (!covers(lane, row)) continue
      const behaviour = LANE_BEHAVIOURS[lane.kind]
      for (const thing of lane.things) {
        const t = dt > 0 ? behaviour.project(lane, thing, dt) : thing
        const touch = behaviour.touch(lane, t, x, row, at, pad)
        if (touch) out.push({ touch, kind: lane.kind })
      }
    }
    return out
  }

  /**
   * What would catch a body (the leader or a hoglet) at x on this row, or null. `row` is -1 while
   * a dash is in the air between its rows; the creek only matters once a body has landed, but
   * the heron's beak finds a body hopping through its column.
   */
  private hazardAt(x: number, row: number, hopping: boolean): Hazard | null {
    if (isRoad(row)) {
      const hit = this.touches(x, row).find((t) => t.touch === 'hit')
      if (hit) return { kind: 'bonk', text: LANE_KINDS[hit.kind].bonk }
    }
    if (row === MEDIAN_ROW && this.snakes.some((snake) => snakeBites(snake, x)))
      return { kind: 'bonk', text: 'HISS! A SNAKE' }
    if (isCreek(row) && this.heron && heronStrikes(this.heron, x))
      return { kind: 'bonk', text: 'PECK! LEAVE THE SHADOW' }
    if (hopping || !isCreek(row)) return null
    if (x < 4 || x > W - 4) return { kind: 'splash', text: 'SWEPT DOWNSTREAM' }
    const met = this.touches(x, row)
    const bite = met.find((t) => t.touch === 'bite')
    if (bite) return { kind: 'bonk', text: LANE_KINDS[bite.kind].bonk }
    return met.some((t) => t.touch === 'ride')
      ? null
      : { kind: 'splash', text: 'SPLASH!' }
  }

  private checkHazards() {
    // Traffic can catch a hedgehog mid-hop; the creek only matters on landing.
    const hop = this.hop
    const hazard = this.hazardAt(
      this.hx,
      hop ? this.hopRow(hop) : this.row,
      hop !== null,
    )
    if (hazard) this.die(hazard.kind, hazard.text)
  }

  private die(kind: 'splash' | 'bonk', text: string) {
    this.lives--
    this.dead = DEATH_TICKS
    this.deathKind = kind
    this.hop = null
    this.bumpParade()
    const y = rowY(this.row) + TILE / 2
    if (kind === 'splash') this.burst(this.hx, y, 14, '#93c5fd')
    else this.burst(this.hx, y, 12, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 70 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number, multiplier = 1) {
    if (this.demo) return
    points *= multiplier
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

  /** Will a road row stay clear of traffic at x from `from` to `to` ticks ahead? */
  private roadClear(row: number, x: number, from: number, to: number): boolean {
    if (!isRoad(row)) return true
    for (let dt = from; dt <= to; dt += 2) {
      const met = this.touches(x, row, this.tick + dt, 6, dt)
      if (met.some((t) => t.touch === 'hit')) return false
    }
    return true
  }

  /** Is a ride under x on this creek row `dt` ticks ahead -- and still there 40 ticks later? */
  private safeRide(row: number, x: number, dt: number): boolean {
    const lane = this.laneAt(row)
    if (!lane) return true
    // Stay off a turtle group about to dive, and off a snapping log's head as its eyes open.
    for (const [ahead, at] of [
      [dt, x],
      [dt + 40, x + lane.vx * 40],
    ] as const) {
      const met = this.touches(at, row, this.tick + ahead, 3, ahead)
      if (met.some((t) => t.touch === 'bite')) return false
      if (!met.some((t) => t.touch === 'ride')) return false
    }
    return true
  }

  private creekSafe(row: number, x: number, dt: number): boolean {
    return this.safeRide(row, x, dt) && !this.heronNear(x)
  }

  /** Is the heron's shadow settling on (or holding over) this column? */
  private heronNear(x: number): boolean {
    const h = this.heron
    if (!h) return false
    if (h.phase === 'sweep' && h.t < HERON_SWEEP - 24) return false
    return Math.abs(h.x - x) < HERON_REACH + HALF + 6
  }

  /** Is staying put in the creek about to go wrong (a dive, a yawn, a beak)? */
  private creekDanger(): boolean {
    const lane = this.laneAt(this.row)
    if (!lane || !isCreek(this.row)) return false
    if (this.heronNear(this.hx)) return true
    for (let dt = 0; dt <= 30; dt += 6) {
      const x = this.hx + lane.vx * dt
      const met = this.touches(x, this.row, this.tick + dt, 0, dt)
      if (met.some((t) => t.touch === 'bite')) return true
      if (!met.some((t) => t.touch === 'ride')) return true
    }
    return false
  }

  /** Is a snake close enough to reach x within a hop or two? */
  private snakeNear(x: number): boolean {
    const reach =
      SNAKE_LEN / 2 + HALF + this.snakeSpeed * (HOP_TICKS + SNAKE_FLICK) + 6
    return this.snakes.some((snake) => Math.abs(snake.x - x) < reach)
  }

  private safeLanding(row: number, x: number): boolean {
    if (x < 14 || x > W - 14) return false
    if (row === 0) {
      const burrow = this.home.findIndex(
        (_, i) => Math.abs(burrowX(i) - x) < BURROW_REACH - 3,
      )
      return burrow >= 0 && !this.home[burrow] && this.fox?.burrow !== burrow
    }
    if (row === MEDIAN_ROW) return !this.snakeNear(x)
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
      : this.row === MEDIAN_ROW
        ? !this.snakeNear(this.hx)
        : !this.creekDanger()
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
      // Toward the tail of a log first (a snapping log's head is the dangerous end).
      const tail = isCreek(this.row) && this.laneAt(this.row)!.vx < 0 ? -1 : 1
      for (const step of [-TILE * tail, TILE * tail]) {
        if (this.safeLanding(this.row, x + step)) {
          if (step < 0) held.left = true
          else held.right = true
          return frame
        }
      }
      if (this.safeLanding(this.row + 1, x)) held.down = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGround(g)
    this.renderCreek(g)
    for (const lane of this.lanes) {
      const behaviour = LANE_BEHAVIOURS[lane.kind]
      for (const t of lane.things) behaviour.draw(g, lane, t, this.tick)
    }
    this.renderHeronShadow(g)
    this.renderBurrows(g)
    this.renderSnakes(g)
    this.renderHoglets(g)
    if (this.dead === 0 && !this.over && this.levelClear === 0) {
      this.renderHedgehog(g)
    } else if (this.dead > 0) {
      this.renderMishap(g)
    }
    this.renderHeronBeak(g)
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
    const market = legOneCrossing(this.level)?.region === 'MARKET DAY'
    cachedLayer(
      g,
      market ? 'hedgehog-crossing-market' : 'hedgehog-crossing-ground',
      W,
      H,
      (k) => {
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
      if (market) {
        // Market bunting, fruit-stall awnings and the canal's cream stone banks.
        for (let x = 0; x < W; x += 28) {
          k.fillStyle = x % 56 === 0 ? RAMPS.pink[3] : RAMPS.gold[3]
          k.beginPath()
          k.moveTo(x + 2, rowY(6) + 2)
          k.lineTo(x + 24, rowY(6) + 2)
          k.lineTo(x + 13, rowY(6) + 11)
          k.closePath()
          k.fill()
          k.fillStyle = RAMPS.cream[3]
          k.fillRect(x + 12, rowY(6) + 3, 2, 3)
        }
        for (const x of [14, 92, 170, 248]) {
          k.fillStyle = RAMPS.earth[1]
          k.fillRect(x, rowY(START_ROW) + 3, 18, 11)
          k.fillStyle = RAMPS.pink[2]
          k.fillRect(x - 2, rowY(START_ROW) + 1, 22, 4)
          k.fillStyle = RAMPS.gold[3]
          k.fillRect(x + 3, rowY(START_ROW) + 9, 4, 4)
          k.fillStyle = RAMPS.leaf[4]
          k.fillRect(x + 10, rowY(START_ROW) + 9, 4, 4)
        }
        for (const bank of [rowY(1), rowY(6) - 2]) {
          k.fillStyle = RAMPS.cream[2]
          k.fillRect(0, bank, W, 2)
          k.fillStyle = RAMPS.cream[4]
          for (let x = 0; x < W; x += 20) k.fillRect(x, bank, 10, 1)
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
      },
    )
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

  /** The heron's shadow on the creek: it glides in, settles on a column, and darkens. */
  private renderHeronShadow(g: CanvasRenderingContext2D) {
    const h = this.heron
    if (!h || h.phase === 'stab') return
    const top = rowY(1)
    const height = TILE * 5
    const x = Math.round(h.x)
    const settle = h.phase === 'sweep' ? h.t / HERON_SWEEP : 1
    g.fillStyle = rgba(INK, 0.1 + 0.18 * settle)
    g.fillRect(x - HERON_REACH, top, HERON_REACH * 2, height)
    // The bird itself, a glide-shaped shadow drifting up and down the column.
    const cy = top + height / 2 + Math.sin(this.tick / 12) * 18
    const span = h.phase === 'sweep' ? 18 : 12
    g.fillStyle = rgba(INK, 0.38)
    g.beginPath()
    g.ellipse(x, cy, span, 3, 0, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.ellipse(x, cy + 2, 4, 9, 0, 0, Math.PI * 2)
    g.fill()
    if (h.phase === 'hold' && Math.floor(this.tick / 6) % 2 === 0) {
      // The column is chosen: its edges flash.
      g.fillStyle = rgba(RAMPS.ember[3], 0.7)
      g.fillRect(x - HERON_REACH, top, 1, height)
      g.fillRect(x + HERON_REACH - 1, top, 1, height)
      drawText(g, '!', x, top + 2, {
        align: 'center',
        color: RAMPS.ember[4],
        outline: INK,
      })
    }
  }

  /** The stab: a long grey neck and a gold beak plunging into the chosen column. */
  private renderHeronBeak(g: CanvasRenderingContext2D) {
    const h = this.heron
    if (!h || h.phase !== 'stab') return
    const x = Math.round(h.x)
    const hit =
      isCreek(this.row) && Math.abs(this.hx - h.x) < HERON_REACH + HALF
    const targetY = rowY(hit ? this.row : 3) + TILE / 2
    const down = Math.min(1, (h.t + 1) / 4)
    const up = h.t > HERON_STAB - 6 ? (HERON_STAB - h.t) / 6 : 1
    const startY = rowY(0) - 6
    const tip = Math.round(startY + (targetY - startY) * down * up)
    const neckEnd = tip - 12
    if (neckEnd > startY) {
      g.fillStyle = INK
      g.fillRect(x - 3, startY, 6, neckEnd - startY)
      g.fillStyle = RAMPS.steel[3]
      g.fillRect(x - 2, startY, 4, neckEnd - startY)
      g.fillStyle = RAMPS.steel[4]
      g.fillRect(x - 2, startY, 1, neckEnd - startY)
    }
    shadedOrb(g, x, neckEnd, 4, RAMPS.steel)
    g.fillStyle = INK
    g.fillRect(x + 1, neckEnd - 1, 1, 1)
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(x - 3, neckEnd + 2)
    g.lineTo(x + 3, neckEnd + 2)
    g.lineTo(x, tip + 1)
    g.closePath()
    g.fill()
    g.fillStyle = RAMPS.gold[3]
    g.beginPath()
    g.moveTo(x - 2, neckEnd + 2)
    g.lineTo(x + 2, neckEnd + 2)
    g.lineTo(x, tip)
    g.closePath()
    g.fill()
    g.save()
    g.strokeStyle = rgba(RAMPS.water[4], 0.8)
    g.lineWidth = 1
    g.beginPath()
    g.ellipse(x, targetY + 2, 6 + h.t * 0.6, 2 + h.t * 0.2, 0, 0, Math.PI * 2)
    g.stroke()
    g.restore()
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

  /** Grass snakes on the median: a rippling body, and a tongue that flicks before the turn. */
  private renderSnakes(g: CanvasRenderingContext2D) {
    const cy = rowY(MEDIAN_ROW) + TILE / 2 + 1
    const segs = 9
    for (const snake of this.snakes) {
      const slither = snake.phase === 'slither'
      const points: Array<{ x: number; y: number; r: number }> = []
      for (let i = 0; i < segs; i++) {
        const u = i / (segs - 1)
        const wave = slither
          ? Math.sin(this.tick / 5 + i * 0.9) * 2.2 * (0.4 + u * 0.6)
          : Math.sin(i * 0.9) * 2
        points.push({
          x: snake.x + snake.dir * (-SNAKE_LEN / 2 + u * SNAKE_LEN),
          y: cy + wave,
          r: 2 + u * 1.6,
        })
      }
      dropShadow(g, snake.x, cy + 5, SNAKE_LEN / 2, 2, 0.35)
      for (const p of points) {
        g.fillStyle = INK
        g.beginPath()
        g.arc(Math.round(p.x), Math.round(p.y), p.r + 1, 0, Math.PI * 2)
        g.fill()
      }
      points.forEach((p, i) => {
        g.fillStyle =
          i === segs - 1
            ? RAMPS.gold[3]
            : i % 3 === 1
              ? RAMPS.gold[2]
              : RAMPS.leaf[4]
        g.beginPath()
        g.arc(Math.round(p.x), Math.round(p.y), p.r, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = rgba(RAMPS.cream[4], 0.5)
        g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - p.r + 1, 2, 1)
      })
      const head = points[segs - 1]!
      g.fillStyle = INK
      g.fillRect(
        Math.round(head.x + snake.dir * 1),
        Math.round(head.y) - 2,
        2,
        2,
      )
      g.fillStyle = '#ffffff'
      g.fillRect(
        Math.round(head.x + snake.dir * 1),
        Math.round(head.y) - 2,
        1,
        1,
      )
      if (snake.phase === 'flick' && Math.floor(this.tick / 4) % 2 === 0) {
        // The tell: a forked tongue, flicking.
        const tx = head.x + snake.dir * (head.r + 1)
        g.fillStyle = RAMPS.ember[3]
        g.fillRect(
          Math.round(snake.dir > 0 ? tx : tx - 5),
          Math.round(head.y),
          5,
          1,
        )
        g.fillRect(
          Math.round(snake.dir > 0 ? tx + 4 : tx - 5),
          Math.round(head.y) - 1,
          1,
          3,
        )
      }
    }
  }

  /** Hoglets waiting on the median, the lost one riding its log, and the line behind the leader. */
  private renderHoglets(g: CanvasRenderingContext2D) {
    const hop = (phase: number) => Math.max(0, Math.sin(this.tick / 6 + phase))
    const medianY = rowY(MEDIAN_ROW) + TILE / 2
    this.waiting.forEach((x, i) => {
      dropShadow(g, x + 1, medianY + 5, 4, 1.5, 0.4)
      drawSprite(g, HOGLET, x, medianY - hop(i * 2) * 2)
    })
    const lostX = this.lostX()
    if (this.lost && lostX !== null) {
      const y = rowY(this.lost.row) + TILE / 2
      drawSprite(g, HOGLET, lostX, y - 2 - hop(1) * 2)
      if (Math.floor(this.tick / 20) % 2 === 0) {
        drawText(g, '?', lostX + 6, y - 14, {
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
    for (const h of this.parade) {
      const f = h.hop ? h.hop.t / h.hop.ticks : 0
      const row = h.hop
        ? h.hop.fromRow + (h.hop.toRow - h.hop.fromRow) * f
        : h.row
      const lift = h.hop ? Math.sin(f * Math.PI) * 3 : 0
      const y = rowY(row) + TILE / 2
      dropShadow(g, h.x + 1, y + 5, 4, 1.5, 0.4)
      drawSprite(g, HOGLET, h.x, y - lift)
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
    const f = hop ? hop.t / hop.ticks : 0
    const lift = hop ? Math.sin(f * Math.PI) * 4 : 0
    const row = hop ? hop.fromRow + (hop.toRow - hop.fromRow) * f : this.row
    const x = this.hx
    const ground = rowY(row) + TILE / 2
    dropShadow(g, x + 1, ground + 6, 6 - lift * 0.4, 2, 0.45 - lift * 0.04)
    const frames = HOG_SPRITES[this.facing]
    drawSprite(g, hop ? frames[1] : frames[0], x, ground - lift)
    if (this.parade.length > 0) {
      drawText(
        g,
        `x${paradeMultiplier(this.parade.length)}`,
        x,
        ground - lift - 17,
        {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        },
      )
    }
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
    const gw = W - 10 - gx - 40
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
    // Bristle Dash: B, and a gauge that fills over the cooldown.
    const dashReady = this.dashCool <= 0
    const dx = gx + gw + 7
    drawText(g, 'B', dx, base + 12, {
      color: dashReady ? RAMPS.gold[3] : RAMPS.steel[3],
      outline: INK,
    })
    if (dashReady) glow(g, dx + 20, base + 16, 14, RAMPS.gold[3], 0.25)
    gauge(
      g,
      dx + 9,
      base + 12,
      22,
      8,
      1 - this.dashCool / DASH_COOLDOWN,
      RAMPS.gold,
    )
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

// /utils/arcade/games/batteryMaze.ts
//
// Battery Maze -- the Kind Robots Arcade's maze-chase riff (conductor
// kr-arcade/t-006). A little cat-eared robot gathers energy sparks through an
// original maze while four glitch gremlins, each with its own way of hunting,
// chase it. The gremlins are drawn after the title art (bat ears, spiky tuft,
// cream belly, walking feet), not as the classic's ghosts. A power cell makes
// them sleepy and blue for a while; bumping one then reboots it and sends its
// eyes home to the charging dock.

import { everyNthLevel, levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  drawRidge,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
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

// '#' wall, '.' spark, 'o' power cell, '-' dock door (gremlins only),
// 'G' charging dock, 'P' robot start, ' ' empty (row 9 wraps as a tunnel).
export const BATTERY_MAZE = [
  '#######################',
  '#..........#..........#',
  '#o###.####.#.####.###o#',
  '#.....................#',
  '#.###.#.#######.#.###.#',
  '#.....#....#....#.....#',
  '#####.####.#.####.#####',
  '#####.#.........#.#####',
  '#####.#.###-###.#.#####',
  '     ...#GGGGG#...     ',
  '#####.#.#######.#.#####',
  '#####.#....P....#.#####',
  '#####.#.#######.#.#####',
  '#..........#..........#',
  '#.###.####.#.####.###.#',
  '#o..#.............#..o#',
  '###.#.#.#######.#.#.###',
  '#.....#....#....#.....#',
  '#.########.#.########.#',
  '#.....................#',
  '#######################',
]

const COLS = BATTERY_MAZE[0]!.length
const ROWS = BATTERY_MAZE.length
const TILE = 14
const TOP = 24
const W = COLS * TILE
const H = TOP + ROWS * TILE + 22

const DOOR = { x: 11, y: 8 }
const DOCK_EXIT = { x: 11, y: 7 }
const DOCK_HOME = { x: 11, y: 9 }
const START = { x: 11, y: 11 }
const BONUS_SPOT = { x: 11, y: 11 }
const TUNNEL_ROW = 9

const START_LIVES = 3
const EXTRA_LIFE_AT = 10_000

type Dir = { x: number; y: number }
const NONE: Dir = { x: 0, y: 0 }
const UP: Dir = { x: 0, y: -1 }
const DOWN: Dir = { x: 0, y: 1 }
const LEFT: Dir = { x: -1, y: 0 }
const RIGHT: Dir = { x: 1, y: 0 }
// Tie-break order when two turns score the same (classic: up, left, down, right).
const DIRS: Dir[] = [UP, LEFT, DOWN, RIGHT]

export const MAZE_CURVES = {
  robotSpeed: { start: 0.105, step: 0.006, limit: 0.135 },
  gremlinSpeed: { start: 0.095, step: 0.007, limit: 0.13 },
  sleepyTicks: { start: 420, step: -45, limit: 60 },
  releaseEvery: { start: 240, step: -20, limit: 90 },
} as const

const BONUSES = [
  { name: 'GEAR', points: 100, color: '#cbd5e1' },
  { name: 'OIL CAN', points: 300, color: '#fbbf24' },
  { name: 'FLOWER', points: 500, color: '#f472b6' },
  { name: 'BOLT', points: 700, color: '#facc15' },
  { name: 'STAR', points: 1000, color: '#fde68a' },
  { name: 'HEART', points: 2000, color: '#fb7185' },
  { name: 'RAINBOW', points: 3000, color: '#a78bfa' },
  { name: 'CROWN', points: 5000, color: '#fcd34d' },
]

// Scatter / chase schedule in ticks; after the last entry, chase forever.
const MODE_SCHEDULE = [420, 1200, 420, 1200, 300, 1200, 300]

type Personality = 'chaser' | 'ambusher' | 'flanker' | 'wanderer'
type GremlinState = 'docked' | 'leaving' | 'roaming' | 'eyes'

type Gremlin = {
  name: Personality
  color: string
  x: number
  y: number
  dir: Dir
  state: GremlinState
  sleepy: boolean
  corner: { x: number; y: number }
  releaseAt: number
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

type Pt = readonly [number, number]
type Face = 'side' | 'up' | 'down'

/** Rows of palette letters from a per-pixel painter ('.' is clear). */
function raster(
  w: number,
  h: number,
  paint: (x: number, y: number) => string,
): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => paint(x, y)).join(''),
  )
}

function inTriangle(px: number, py: number, a: Pt, b: Pt, c: Pt): boolean {
  const side = (p: Pt, q: Pt) =>
    (px - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (py - q[1])
  const d1 = side(a, b)
  const d2 = side(b, c)
  const d3 = side(c, a)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

function inPolygon(px: number, py: number, pts: readonly Pt[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!
    const [xj, yj] = pts[j]!
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function nearSegment(px: number, py: number, a: Pt, b: Pt, r: number) {
  const vx = b[0] - a[0]
  const vy = b[1] - a[1]
  const t = Math.max(
    0,
    Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy)),
  )
  return Math.hypot(px - a[0] - vx * t, py - a[1] - vy * t) <= r
}

/** The ramp as palette letters '0' (deep shadow) to '4' (highlight). */
function rampPalette(ramp: Ramp): Record<string, string> {
  return { 0: ramp[0], 1: ramp[1], 2: ramp[2], 3: ramp[3], 4: ramp[4] }
}

/** A sphere lit from the upper left, as a ramp letter, for normal (nx, ny). */
function sphereShade(nx: number, ny: number): string {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
  const l = nx * -0.45 + ny * -0.6 + nz * 0.66
  return l > 0.95 ? '4' : l > 0.76 ? '3' : l > 0.42 ? '2' : l > 0.06 ? '1' : '0'
}

/**
 * A flat shape shaded across from the upper-left light, with a lit rim on its top and left
 * edges and a shadowed rim on its bottom and right; `extra` paints details over it.
 */
function litRows(
  w: number,
  h: number,
  inside: (x: number, y: number) => boolean,
  extra?: (x: number, y: number) => string | null,
): string[] {
  const cx = (w - 1) / 2
  const cy = (h - 1) / 2
  const reach = Math.max(w, h) / 2
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && inside(x, y)
  return raster(w, h, (x, y) => {
    if (!at(x, y)) return '.'
    const detail = extra?.(x, y)
    if (detail) return detail
    const u = ((x - cx) * 0.6 + (y - cy) * 0.8) / reach
    let s = u < -0.45 ? 3 : u < 0.35 ? 2 : 1
    if (!at(x, y - 1) || !at(x - 1, y)) s = Math.min(4, s + 1)
    else if (!at(x, y + 1) || !at(x + 1, y)) s = Math.max(0, s - 1)
    return String(s)
  })
}

const FACE_ANGLE: Record<Face, number> = {
  side: 0,
  up: -Math.PI / 2,
  down: Math.PI / 2,
}

/**
 * The robot from the title art: a round teal bot with cat ears, its chomping mouth a wedge
 * `open` radians either side of where it faces. Rendered per facing, never rotated, so the
 * ears stay upright. `k` scales it down for the lives icon.
 */
function robotRows(face: Face, open: number, k = 1): string[] {
  const w = Math.round(15 * k)
  const r = 6.4 * k
  const cx = Math.floor(w / 2)
  const cy = Math.round(9 * k)
  const h = cy + Math.floor(r) + 1
  const ear: [Pt, Pt, Pt] = [
    [-5.6 * k, -2.4 * k],
    [-4.6 * k, -9.4 * k],
    [-0.6 * k, -5.2 * k],
  ]
  const inner: [Pt, Pt, Pt] = [
    [-4.6 * k, -3.8 * k],
    [-4.3 * k, -7.6 * k],
    [-2 * k, -5 * k],
  ]
  const eyes: Pt[] =
    k < 0.8
      ? [[1, -2]]
      : face === 'side'
        ? [[0, -4]]
        : face === 'up'
          ? [
              [-4, -1],
              [3, -1],
            ]
          : [
              [-4, -4],
              [3, -4],
            ]
  const eyeSize = k < 0.8 ? 1 : 2
  return raster(w, h, (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const d = Math.hypot(dx, dy)
    if (d <= r) {
      if (open > 0 && d > 0.4) {
        const a = Math.atan2(dy, dx) - FACE_ANGLE[face]
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < open) return '.'
      }
      for (const [ex, ey] of eyes) {
        if (dx >= ex && dx < ex + eyeSize && dy >= ey && dy < ey + eyeSize)
          return eyeSize > 1 && dx === ex && dy === ey ? 'w' : 'k'
      }
      return sphereShade(dx / r, dy / r)
    }
    for (const side of [1, -1] as const) {
      const ex = dx * side
      if (inTriangle(ex, dy, ...inner)) return 'p'
      if (inTriangle(ex, dy, ...ear)) return side === 1 ? '3' : '2'
    }
    return '.'
  })
}

const ROBOT_PALETTE = {
  ...rampPalette(RAMPS.teal),
  k: INK,
  w: '#ffffff',
  p: RAMPS.pink[3],
}

/** Mouth frames per facing: shut, half, wide (the left-facing ones are flips of 'side'). */
const ROBOT_FRAMES: Record<Face, readonly PixelSprite[]> = {
  side: [0.08, 0.38, 0.72].map((o) =>
    pixelSprite(robotRows('side', o), ROBOT_PALETTE),
  ),
  up: [0.08, 0.38, 0.72].map((o) =>
    pixelSprite(robotRows('up', o), ROBOT_PALETTE),
  ),
  down: [0.08, 0.38, 0.72].map((o) =>
    pixelSprite(robotRows('down', o), ROBOT_PALETTE),
  ),
}

/** Losing a life: the mouth opens all the way round until only the ears are left. */
const ROBOT_DEATH = Array.from({ length: 8 }, (_, i) =>
  pixelSprite(robotRows('up', 0.9 + (i / 7) * 2.3), ROBOT_PALETTE),
)

const LIFE_SPRITE = pixelSprite(robotRows('side', 0.38, 0.6), ROBOT_PALETTE)

type GremlinPose = {
  eyes: Face | 'shut'
  step: 0 | 1
  droop: boolean
  /** Just the eyes (a rebooting gremlin). */
  only?: boolean
}

/**
 * A glitch gremlin, after the title art: big pointed bat ears, a round furry body with a cream
 * belly, stubby stepping feet and a flicking tail trailing to the left (flip to face left). Each
 * personality wears its own crest: the chaser a spiky tuft, the ambusher a swept forelock and a
 * bandit mask, the flanker an antenna, the wanderer a little flower. Eyes look where it heads;
 * 'shut' is the sleepy face; `only` keeps just the eyes of a rebooting gremlin heading home.
 */
function gremlinRows(kind: Personality, pose: GremlinPose): string[] {
  const cx = 8
  const cy = 9
  const r = 6.5
  const tip: Pt = pose.droop ? [-8.6, -3.2] : [-8.2, -8.4]
  const ear: [Pt, Pt, Pt] = [[-2.4, -4.6], tip, [-5.6, -0.6]]
  const inner: [Pt, Pt, Pt] = [
    [-3.2, -3.9],
    [tip[0] + 1.6, tip[1] + (pose.droop ? 0.6 : 1.8)],
    [-5.2, -1.6],
  ]
  const tail: [Pt, Pt] = [
    [-5.5, 2],
    [-8, pose.step ? -1.5 : 0.8],
  ]
  const eyeCols = [-4, -3, -2, 2, 3, 4]
  const pupilCols = pose.eyes === 'side' ? [-3, -2, 3, 4] : [-3, -2, 2, 3]
  const pupilRows = pose.eyes === 'up' ? [-3, -2] : [-2, -1]
  const brows: Pt[] = [
    [-4, -5],
    [-3, -4],
    [-2, -4],
    [4, -5],
    [3, -4],
    [2, -4],
  ]
  const crest = (dx: number, dy: number): string | null => {
    switch (kind) {
      case 'chaser':
        if (inTriangle(dx, dy, [-2.8, -5], [-1.4, -9.6], [0.2, -5])) return '3'
        if (inTriangle(dx, dy, [-0.2, -5], [1.6, -9.6], [2.8, -5])) return '2'
        return null
      case 'ambusher':
        return inTriangle(dx, dy, [-2.6, -5.4], [4.6, -9.4], [2.6, -4.6])
          ? '3'
          : null
      case 'flanker':
        if (dx === 0 && (dy === -6 || dy === -7)) return '1'
        if ((dy === -8 && Math.abs(dx) <= 1) || (dx === 0 && dy === -9))
          return dx === -1 || dy === -9 ? 'y' : 'x'
        return null
      case 'wanderer':
        if (dx === 0 && (dy === -6 || dy === -7)) return '1'
        if (dx === 0 && dy === -8) return 'y'
        if ((dy === -8 && Math.abs(dx) === 1) || (dx === 0 && dy === -9))
          return 'x'
        return null
    }
  }
  return raster(17, 17, (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const inEye = eyeCols.includes(dx) && dy >= -3 && dy <= -1
    if (pose.only) {
      if (!inEye) return '.'
      return pupilCols.includes(dx) && pupilRows.includes(dy) ? 'k' : 'w'
    }
    // Stubby feet, one lifted in turn.
    const leftUp = pose.step === 1
    const footRows = (up: boolean) => (up ? [5, 6] : [6, 7])
    if (dx >= -4 && dx <= -2 && footRows(leftUp).includes(dy))
      return dy === footRows(leftUp)[0] ? '1' : '0'
    if (dx >= 2 && dx <= 4 && footRows(!leftUp).includes(dy))
      return dy === footRows(!leftUp)[0] ? '1' : '0'
    const d = Math.hypot(dx, dy)
    if (d <= r) {
      if (inEye) {
        if (pose.eyes === 'shut')
          return dy === -2 ? 'z' : sphereShade(dx / r, dy / r)
        return pupilCols.includes(dx) && pupilRows.includes(dy) ? 'k' : 'w'
      }
      if (
        pose.eyes !== 'shut' &&
        brows.some(([bx, by]) => bx === dx && by === dy)
      )
        return 'k'
      if ((dx / 3.4) ** 2 + ((dy - 2.6) / 2.5) ** 2 <= 1)
        return dy <= 3 ? 'c' : 'd'
      if (kind === 'ambusher' && dy >= -3 && dy <= -1) return '0'
      return sphereShade(dx / r, dy / r)
    }
    const c = crest(dx, dy)
    if (c) return c
    for (const side of [1, -1] as const) {
      const ex = dx * side
      if (inTriangle(ex, dy, ...inner)) return 'i'
      if (inTriangle(ex, dy, ...ear)) return side === 1 ? '3' : '2'
    }
    if (nearSegment(dx, dy, tail[0], tail[1], 0.75))
      return Math.hypot(dx - tail[1][0], dy - tail[1][1]) < 1 ? '2' : '1'
    return '.'
  })
}

const GREMLIN_LOOKS: Record<Personality, { ramp: Ramp; accent: string }> = {
  chaser: { ramp: RAMPS.pink, accent: RAMPS.pink[4] },
  ambusher: { ramp: RAMPS.rust, accent: RAMPS.gold[3] },
  flanker: { ramp: RAMPS.water, accent: RAMPS.gold[3] },
  wanderer: { ramp: RAMPS.leaf, accent: RAMPS.pink[3] },
}

function gremlinPalette(
  ramp: Ramp,
  belly: readonly [string, string],
  inner: string,
  accent: string,
  lid: string,
) {
  return {
    ...rampPalette(ramp),
    c: belly[0],
    d: belly[1],
    i: inner,
    w: '#ffffff',
    k: INK,
    x: accent,
    y: RAMPS.gold[4],
    z: lid,
  }
}

type GremlinArt = {
  normal: Record<Face, readonly [PixelSprite, PixelSprite]>
  sleepy: readonly [PixelSprite, PixelSprite]
  flash: readonly [PixelSprite, PixelSprite]
}

function gremlinArt(kind: Personality): GremlinArt {
  const { ramp, accent } = GREMLIN_LOOKS[kind]
  const awake = gremlinPalette(
    ramp,
    [RAMPS.cream[3], RAMPS.cream[2]],
    RAMPS.gold[3],
    accent,
    INK,
  )
  const sleepy = gremlinPalette(
    RAMPS.sky,
    [RAMPS.sky[4], RAMPS.sky[3]],
    RAMPS.sky[3],
    RAMPS.sky[4],
    INK,
  )
  const flash = gremlinPalette(
    RAMPS.steel,
    [RAMPS.cream[4], RAMPS.cream[3]],
    RAMPS.pink[3],
    RAMPS.pink[3],
    RAMPS.ember[2],
  )
  const pair = (
    eyes: GremlinPose['eyes'],
    droop: boolean,
    palette: Record<string, string>,
  ) =>
    [0, 1].map((step) =>
      pixelSprite(
        gremlinRows(kind, { eyes, step: step as 0 | 1, droop }),
        palette,
      ),
    ) as unknown as readonly [PixelSprite, PixelSprite]
  return {
    normal: {
      side: pair('side', false, awake),
      up: pair('up', false, awake),
      down: pair('down', false, awake),
    },
    sleepy: pair('shut', true, sleepy),
    flash: pair('shut', true, flash),
  }
}

const GREMLIN_ART: Record<Personality, GremlinArt> = {
  chaser: gremlinArt('chaser'),
  ambusher: gremlinArt('ambusher'),
  flanker: gremlinArt('flanker'),
  wanderer: gremlinArt('wanderer'),
}

/** A rebooting gremlin is only its eyes, heading home. */
const EYES_ONLY: Record<Face, PixelSprite> = {
  side: pixelSprite(
    gremlinRows('chaser', { eyes: 'side', step: 0, droop: false, only: true }),
    { w: '#ffffff', k: INK },
  ),
  up: pixelSprite(
    gremlinRows('chaser', { eyes: 'up', step: 0, droop: false, only: true }),
    { w: '#ffffff', k: INK },
  ),
  down: pixelSprite(
    gremlinRows('chaser', { eyes: 'down', step: 0, droop: false, only: true }),
    { w: '#ffffff', k: INK },
  ),
}

const SLEEP_Z = pixelSprite(['zzzz', '..z.', '.z..', 'zzzz'], {
  z: RAMPS.sky[4],
})

const SPARK_SPRITE = pixelSprite(
  ['.y.', 'yWy', '.y.'],
  { y: RAMPS.gold[3], W: RAMPS.gold[4] },
  { outline: RAMPS.gold[0] },
)
const SPARK_TWINKLE = pixelSprite(
  ['..y..', '.yWy.', 'yWWWy', '.yWy.', '..y..'],
  { y: RAMPS.gold[3], W: '#ffffff' },
  { outline: RAMPS.gold[1] },
)

const CELL_ROWS = [
  '..tTs..',
  '.HLLLB.',
  'HLLLyBD',
  'HLLyLBD',
  'HLyyyBD',
  'HLLyLBD',
  'HLyLLBD',
  'HLLLLBD',
  'HBBBBBD',
  '.DDDDD.',
]
const CELL_TERMINAL = {
  t: RAMPS.steel[4],
  T: RAMPS.steel[3],
  s: RAMPS.steel[2],
}
/** The power cell, charged (bright bolt) and between blinks (dim bolt). */
const CELL_SPRITES = [
  pixelSprite(CELL_ROWS, {
    ...CELL_TERMINAL,
    H: RAMPS.leaf[4],
    L: RAMPS.leaf[3],
    B: RAMPS.leaf[2],
    D: RAMPS.leaf[1],
    y: RAMPS.gold[4],
  }),
  pixelSprite(CELL_ROWS, {
    ...CELL_TERMINAL,
    H: RAMPS.leaf[3],
    L: RAMPS.leaf[2],
    B: RAMPS.leaf[1],
    D: RAMPS.leaf[0],
    y: RAMPS.gold[1],
  }),
] as const

const centred = (w: number, h: number, x: number, y: number): Pt => [
  x + 0.5 - w / 2,
  y + 0.5 - h / 2,
]

const STAR_POINTS: Pt[] = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2
  const radius = i % 2 ? 2.4 : 5.6
  return [5.5 + Math.cos(a) * radius, 5.8 + Math.sin(a) * radius]
})

/** One sprite per prize in BONUSES order. */
const BONUS_SPRITES: readonly PixelSprite[] = [
  // GEAR
  pixelSprite(
    litRows(11, 11, (x, y) => {
      const [dx, dy] = centred(11, 11, x, y)
      const d = Math.hypot(dx, dy)
      const a = Math.atan2(dy, dx)
      return d >= 1.4 && (d <= 3.6 || (d <= 5.4 && Math.cos(a * 8) > 0.3))
    }),
    rampPalette(RAMPS.steel),
  ),
  // OIL CAN
  pixelSprite(
    litRows(
      11,
      10,
      (x, y) =>
        (x >= 1 && x <= 7 && y >= 4) ||
        (x >= 3 && x <= 5 && y >= 2 && y <= 3) ||
        (x >= 8 && y >= 12 - x && y <= 13 - x),
      (x, y) => (x >= 2 && x <= 6 && (y === 6 || y === 7) ? 'x' : null),
    ),
    { ...rampPalette(RAMPS.gold), x: RAMPS.ember[2] },
  ),
  // FLOWER
  pixelSprite(
    litRows(
      11,
      11,
      (x, y) => {
        const [dx, dy] = centred(11, 11, x, y)
        if (Math.hypot(dx, dy) <= 1.8) return true
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2
          if (Math.hypot(dx - Math.cos(a) * 2.9, dy - Math.sin(a) * 2.9) <= 2.1)
            return true
        }
        return false
      },
      (x, y) => {
        const [dx, dy] = centred(11, 11, x, y)
        const d = Math.hypot(dx, dy)
        return d <= 1.8 ? (dx + dy < -0.5 ? 'Y' : 'y') : null
      },
    ),
    { ...rampPalette(RAMPS.pink), y: RAMPS.gold[3], Y: RAMPS.gold[4] },
  ),
  // BOLT
  pixelSprite(
    litRows(11, 11, (x, y) =>
      inPolygon(x + 0.5, y + 0.5, [
        [5.5, 0],
        [10.5, 0],
        [6.5, 4.5],
        [9.8, 4.5],
        [2, 11],
        [4.5, 6],
        [1.2, 6],
      ]),
    ),
    rampPalette(RAMPS.gold),
  ),
  // STAR
  pixelSprite(
    litRows(11, 11, (x, y) => inPolygon(x + 0.5, y + 0.5, STAR_POINTS)),
    rampPalette(RAMPS.gold),
  ),
  // HEART
  pixelSprite(
    litRows(11, 10, (x, y) => {
      const X = (x + 0.5 - 5.5) / 4.8
      const Y = -(y + 0.5 - 4.6) / 4.6
      return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0
    }),
    rampPalette(RAMPS.ember),
  ),
  // RAINBOW
  pixelSprite(
    litRows(
      13,
      7,
      (x, y) => {
        const d = Math.hypot(x + 0.5 - 6.5, y + 0.5 - 7.2)
        return d >= 2.2 && d <= 6.7
      },
      (x, y) => {
        const d = Math.hypot(x + 0.5 - 6.5, y + 0.5 - 7.2)
        return 'abcde'[Math.min(4, Math.floor((6.7 - d) / 0.9))] ?? null
      },
    ),
    {
      a: RAMPS.ember[2],
      b: RAMPS.gold[3],
      c: RAMPS.leaf[3],
      d: RAMPS.sky[3],
      e: RAMPS.purple[3],
    },
  ),
  // CROWN
  pixelSprite(
    litRows(
      11,
      9,
      (x, y) =>
        inPolygon(x + 0.5, y + 0.5, [
          [0.2, 1.5],
          [3, 4.6],
          [5.5, 0],
          [8, 4.6],
          [10.8, 1.5],
          [10, 9],
          [1, 9],
        ]),
      (x, y) =>
        y === 6 && x === 5 ? 'x' : y === 6 && (x === 2 || x === 8) ? 't' : null,
    ),
    { ...rampPalette(RAMPS.gold), x: RAMPS.pink[2], t: RAMPS.teal[3] },
  ),
]

type WallTheme = { ramp: Ramp; neon: string; trace: string; face?: string }

/** The maze's colours change every level, so a long run doesn't look like one screen. */
const WALL_THEMES: readonly WallTheme[] = [
  {
    ramp: RAMPS.purple,
    neon: RAMPS.teal[3],
    trace: mix(RAMPS.night[2], RAMPS.purple[1], 0.35),
  },
  {
    ramp: RAMPS.sky,
    neon: RAMPS.pink[3],
    trace: mix(RAMPS.night[2], RAMPS.sky[1], 0.35),
  },
  {
    ramp: RAMPS.pink,
    neon: RAMPS.gold[3],
    trace: mix(RAMPS.night[2], RAMPS.pink[1], 0.35),
  },
]
/** The maze flashing white and gold when it's charged. */
const FLASH_THEME: WallTheme = {
  ramp: RAMPS.steel,
  face: RAMPS.steel[3],
  neon: RAMPS.gold[3],
  trace: mix(RAMPS.night[2], RAMPS.gold[1], 0.35),
}

const FLOOR_BANDS = [
  RAMPS.night[0],
  RAMPS.night[1],
  mix(RAMPS.night[1], RAMPS.night[2], 0.6),
  RAMPS.night[1],
  RAMPS.night[0],
]

const BREAK_STARS = starField(17, 60, W, TOP + 9 * TILE - 50)
const BREAK_FAR = ridge(23, W, 46)
const BREAK_NEAR = ridge(31, W, 24, 6)

const glowStamps = new Map<string, HTMLCanvasElement | null>()

/**
 * A soft additive glow baked once to an offscreen canvas (4x supersampled, so it stays smooth
 * in HD), for lights drawn by the hundred, like the sparks. Null headless.
 */
function glowStamp(
  colour: string,
  r: number,
  alpha: number,
): HTMLCanvasElement | null {
  const key = `${colour}:${r}:${alpha}`
  let stamp = glowStamps.get(key)
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
    glowStamps.set(key, stamp)
  }
  return stamp
}

function isFloor(x: number, y: number) {
  const cell = BATTERY_MAZE[y]?.[x]
  return cell !== undefined && cell !== '#'
}

function isTrace(x: number, y: number) {
  const cell = BATTERY_MAZE[y]?.[x]
  return cell === '.' || cell === 'o' || cell === ' ' || cell === 'P'
}

/**
 * The whole static maze, painted once per theme: a banded floor etched with faint circuit
 * traces between the spark sockets, neon light spilling off the walls, and the walls as raised
 * slabs, lit on their top and left edges and shadowed on their bottom and right, outlined in
 * ink. Then the charging dock with its pads, the pink dock door, and the tunnel mouths.
 */
function paintBoard(k: CanvasRenderingContext2D, theme: WallTheme) {
  const { ramp, neon } = theme
  const mazeBottom = TOP + ROWS * TILE
  bandedGradient(k, 0, TOP, W, ROWS * TILE, FLOOR_BANDS, 2)
  bandedGradient(k, 0, 0, W, TOP, [RAMPS.night[2], RAMPS.night[0]], 2)
  bandedGradient(
    k,
    0,
    mazeBottom,
    W,
    H - mazeBottom,
    [RAMPS.night[0], RAMPS.night[2]],
    2,
  )

  const pad = mix(theme.trace, ramp[2], 0.25)
  const face = theme.face ?? mix(ramp[1], RAMPS.night[1], 0.4)
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!isTrace(x, y)) continue
      const cx = x * TILE + TILE / 2
      const cy = TOP + y * TILE + TILE / 2
      k.fillStyle = theme.trace
      if (isTrace(x + 1, y)) k.fillRect(cx, cy, TILE, 1)
      if (isTrace(x, y + 1)) k.fillRect(cx, cy, 1, TILE)
      k.fillStyle = pad
      k.fillRect(cx - 1, cy - 1, 3, 3)
      k.fillStyle = RAMPS.night[0]
      k.fillRect(cx, cy, 1, 1)
    }
  }

  // Neon spill on the floor along every wall edge (colour math: it adds light).
  k.save()
  k.globalCompositeOperation = 'lighter'
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (isFloor(x, y)) continue
      const px = x * TILE
      const py = TOP + y * TILE
      const spill = (sx: number, sy: number, horizontal: boolean) => {
        k.fillStyle = rgba(neon, 0.3)
        if (horizontal) k.fillRect(px, sy, TILE, 1)
        else k.fillRect(sx, py, 1, TILE)
        k.fillStyle = rgba(neon, 0.12)
        if (horizontal) k.fillRect(px, sy + (sy < py ? -2 : 1), TILE, 2)
        else k.fillRect(sx + (sx < px ? -2 : 1), py, 2, TILE)
      }
      if (isFloor(x, y - 1)) spill(0, py - 1, true)
      if (isFloor(x, y + 1)) spill(0, py + TILE, true)
      if (x > 0 && isFloor(x - 1, y)) spill(px - 1, 0, false)
      if (x < COLS - 1 && isFloor(x + 1, y)) spill(px + TILE, 0, false)
    }
  }
  k.restore()

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (isFloor(x, y)) continue
      const px = x * TILE
      const py = TOP + y * TILE
      const up = isFloor(x, y - 1)
      const down = isFloor(x, y + 1)
      const left = x > 0 && isFloor(x - 1, y)
      const right = x < COLS - 1 && isFloor(x + 1, y)
      k.fillStyle = face
      k.fillRect(px, py, TILE, TILE)
      // A rivet on the face of each solid block's tile, every other tile.
      if (!up && !down && !left && !right && (x + y) % 2 === 0) {
        k.fillStyle = ramp[0]
        k.fillRect(px + 7, py + 7, 2, 2)
        k.fillStyle = ramp[2]
        k.fillRect(px + 6, py + 6, 2, 2)
      }
      k.fillStyle = ramp[0]
      if (down) k.fillRect(px, py + TILE - 3, TILE, 2)
      if (right) k.fillRect(px + TILE - 3, py, 2, TILE)
      if (up) {
        k.fillStyle = ramp[4]
        k.fillRect(px, py + 1, TILE, 1)
        k.fillStyle = ramp[3]
        k.fillRect(px, py + 2, TILE, 1)
      }
      if (left) {
        k.fillStyle = ramp[3]
        k.fillRect(px + 1, py + (up ? 2 : 0), 1, TILE - (up ? 2 : 0))
        k.fillStyle = ramp[2]
        k.fillRect(px + 2, py + (up ? 3 : 0), 1, TILE - (up ? 3 : 0))
      }
      // Concave corners: carry the lit bevel round the inside bend.
      if (!up && !left && isFloor(x - 1, y - 1) && x > 0) {
        k.fillStyle = ramp[3]
        k.fillRect(px, py, 2, 2)
      }
      if (!down && !right && isFloor(x + 1, y + 1) && x < COLS - 1) {
        k.fillStyle = ramp[0]
        k.fillRect(px + TILE - 3, py + TILE - 3, 3, 3)
        k.fillStyle = INK
        k.fillRect(px + TILE - 1, py + TILE - 1, 1, 1)
      }
      k.fillStyle = INK
      if (up) k.fillRect(px, py, TILE, 1)
      if (down) k.fillRect(px, py + TILE - 1, TILE, 1)
      if (left) k.fillRect(px, py, 1, TILE)
      if (right) k.fillRect(px + TILE - 1, py, 1, TILE)
      if (!up && !left && isFloor(x - 1, y - 1) && x > 0)
        k.fillRect(px, py, 1, 1)
      if (!up && !right && isFloor(x + 1, y - 1) && x < COLS - 1)
        k.fillRect(px + TILE - 1, py, 1, 1)
      if (!down && !left && isFloor(x - 1, y + 1) && x > 0)
        k.fillRect(px, py + TILE - 1, 1, 1)
      // Rounded outer corners.
      const corner = (cx: number, cy: number, ix: number, iy: number) => {
        k.fillStyle = FLOOR_BANDS[2]!
        k.fillRect(cx, cy, 1, 1)
        k.fillStyle = INK
        k.fillRect(ix, iy, 1, 1)
      }
      if (up && left) corner(px, py, px + 1, py + 1)
      if (up && right) corner(px + TILE - 1, py, px + TILE - 2, py + 1)
      if (down && left) corner(px, py + TILE - 1, px + 1, py + TILE - 2)
      if (down && right)
        corner(px + TILE - 1, py + TILE - 1, px + TILE - 2, py + TILE - 2)
    }
  }

  // The charging dock: a recessed bay with a gold charging pad under each gremlin.
  const bayY = TOP + DOCK_HOME.y * TILE
  bevel(k, 9 * TILE + 1, bayY + 1, 5 * TILE - 2, TILE - 2, RAMPS.night, {
    depth: 1,
  })
  for (let x = 10; x <= 12; x++) {
    bevel(k, x * TILE + 3, bayY + TILE - 5, TILE - 6, 3, RAMPS.gold, {
      depth: 1,
    })
  }
  bevel(
    k,
    DOOR.x * TILE,
    TOP + DOOR.y * TILE + TILE / 2 - 2,
    TILE,
    4,
    RAMPS.pink,
    { depth: 1 },
  )

  // Tunnel mouths fade into the dark.
  const ty = TOP + TUNNEL_ROW * TILE
  for (const [from, to] of [
    [0, TILE * 2.5],
    [W, W - TILE * 2.5],
  ] as const) {
    const grad = k.createLinearGradient(from, 0, to, 0)
    grad.addColorStop(0, rgba(INK, 0.95))
    grad.addColorStop(1, rgba(INK, 0))
    k.fillStyle = grad
    k.fillRect(Math.min(from, to), ty, TILE * 2.5, TILE)
  }
}

/** The coffee-break stage: a banded night sky over a bevelled tile floor. */
function paintBreak(k: CanvasRenderingContext2D) {
  bandedGradient(
    k,
    0,
    0,
    W,
    H,
    [RAMPS.night[0], RAMPS.night[2], RAMPS.purple[1], RAMPS.night[1]],
    4,
  )
  const floorY = TOP + 10 * TILE - 4
  // Far-off charging towers, then nearer hills, in front of the sky.
  drawRidge(k, BREAK_FAR, {
    base: floorY,
    bottom: floorY,
    width: W,
    fill: mix(RAMPS.night[3], RAMPS.purple[1], 0.3),
    rim: RAMPS.purple[2],
  })
  drawRidge(k, BREAK_NEAR, {
    base: floorY,
    bottom: floorY,
    width: W,
    step: 6,
    fill: RAMPS.night[2],
    rim: RAMPS.purple[1],
  })
  for (let x = 0; x < W; x += TILE) {
    bevel(k, x + 1, floorY + 1, TILE - 2, TILE - 2, RAMPS.purple, {
      outline: null,
    })
  }
  bandedGradient(
    k,
    0,
    floorY + TILE,
    W,
    H - floorY - TILE,
    [RAMPS.night[2], RAMPS.night[0]],
    3,
  )
}

const SPARK_COLOURS = [RAMPS.gold[4], RAMPS.gold[3], '#ffffff']
const CELL_COLOURS = [RAMPS.leaf[3], RAMPS.leaf[4], RAMPS.gold[4]]
const ROBOT_SPARKS = [RAMPS.teal[3], RAMPS.teal[4], RAMPS.pink[3]]

function isWall(x: number, y: number): boolean {
  const row = BATTERY_MAZE[y]
  if (!row) return true
  const cell = row[((x % COLS) + COLS) % COLS]
  return cell === '#'
}

function sameDir(a: Dir, b: Dir) {
  return a.x === b.x && a.y === b.y
}

function opposite(d: Dir): Dir {
  return { x: -d.x, y: -d.y }
}

class BatteryMaze implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private sparks = new Set<string>()
  private cells = new Set<string>()
  private totalSparks = 0
  private eaten = 0
  private robot = {
    x: START.x,
    y: START.y,
    dir: LEFT as Dir,
    want: LEFT as Dir,
    mouth: 0,
  }
  private gremlins: Gremlin[] = []
  private modeIndex = 0
  private modeTimer = MODE_SCHEDULE[0]!
  private chasing = false
  private sleepyTimer = 0
  private chain = 0
  private bonus: { kind: number; ticks: number } | null = null
  private bonusesShown = 0
  private floaters: Array<{
    x: number
    y: number
    text: string
    life: number
  }> = []
  private pause = 0
  private dying = 0
  private clearing = 0
  private intermission = 0
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ---------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.sparks.clear()
    this.cells.clear()
    BATTERY_MAZE.forEach((row, y) => {
      for (let x = 0; x < COLS; x++) {
        if (row[x] === '.') this.sparks.add(`${x},${y}`)
        if (row[x] === 'o') this.cells.add(`${x},${y}`)
      }
    })
    this.totalSparks = this.sparks.size + this.cells.size
    this.eaten = 0
    this.bonusesShown = 0
    this.bonus = null
    this.resetActors()
    this.banner = { text: `LEVEL ${level}`, ticks: 120 }
  }

  private resetActors() {
    this.robot = { x: START.x, y: START.y, dir: LEFT, want: LEFT, mouth: 0 }
    const release = levelCurve(this.level, MAZE_CURVES.releaseEvery)
    const specs: Array<[Personality, string, { x: number; y: number }]> = [
      ['chaser', '#f472b6', { x: COLS - 2, y: -2 }],
      ['ambusher', '#fb923c', { x: 1, y: -2 }],
      ['flanker', '#22d3ee', { x: COLS - 1, y: ROWS + 1 }],
      ['wanderer', '#4ade80', { x: 0, y: ROWS + 1 }],
    ]
    this.gremlins = specs.map(([name, color, corner], i) => ({
      name,
      color,
      corner,
      x: i === 0 ? DOCK_EXIT.x : 9 + i,
      y: i === 0 ? DOCK_EXIT.y : DOCK_HOME.y,
      dir: LEFT,
      state: i === 0 ? 'roaming' : 'docked',
      sleepy: false,
      releaseAt: this.tick + Math.round(release * i),
    }))
    this.modeIndex = 0
    this.modeTimer = MODE_SCHEDULE[0]!
    this.chasing = false
    this.sleepyTimer = 0
    this.pause = 90
  }

  // --- update ----------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.fx.update()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    for (const f of this.floaters) {
      f.y -= 0.03
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)

    if (this.over) return
    if (this.intermission > 0) {
      if (--this.intermission === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.clearing > 0) {
      if (this.clearing % 16 === 0) {
        this.fx.burst(
          TILE + this.fxRng() * (W - TILE * 2),
          TOP + TILE + this.fxRng() * (ROWS - 2) * TILE,
          this.fxRng,
          { count: 12, speed: 2 },
        )
      }
      if (--this.clearing === 0) {
        if (everyNthLevel(this.level, 3)) this.intermission = 300
        else this.startLevel(this.level + 1)
      }
      return
    }
    if (this.dying > 0) {
      if (--this.dying === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetActors()
        }
      }
      if (this.dying === 30) {
        this.sparkle(this.robot.x, this.robot.y, 16, ROBOT_SPARKS, 2)
      }
      return
    }
    if (this.pause > 0) {
      this.pause--
      return
    }

    const controls = this.demo ? this.demoInput() : input
    if (controls.held.up) this.robot.want = UP
    else if (controls.held.down) this.robot.want = DOWN
    else if (controls.held.left) this.robot.want = LEFT
    else if (controls.held.right) this.robot.want = RIGHT

    this.updateModes()
    this.moveRobot()
    this.eat()
    for (const gremlin of this.gremlins) this.moveGremlin(gremlin)
    this.collide()
    if (this.bonus && --this.bonus.ticks <= 0) this.bonus = null

    if (this.sparks.size === 0 && this.cells.size === 0) {
      this.clearing = 120
      this.sound.play('level')
      this.banner = { text: 'MAZE CHARGED!', ticks: 120 }
    }
  }

  private updateModes() {
    if (this.sleepyTimer > 0) {
      this.sleepyTimer--
      if (this.sleepyTimer === 0) {
        for (const g of this.gremlins) g.sleepy = false
      }
      return
    }
    if (this.modeIndex >= MODE_SCHEDULE.length) return
    if (--this.modeTimer <= 0) {
      this.modeIndex++
      this.chasing = !this.chasing
      this.modeTimer = MODE_SCHEDULE[this.modeIndex] ?? Infinity
      for (const g of this.gremlins) {
        if (g.state === 'roaming') g.dir = opposite(g.dir)
      }
    }
  }

  private canMove(x: number, y: number, dir: Dir, allowDoor = false): boolean {
    const nx = Math.round(x) + dir.x
    const ny = Math.round(y) + dir.y
    if (!allowDoor && nx === DOOR.x && ny === DOOR.y) return false
    return !isWall(nx, ny)
  }

  /** Advance an actor along `dir` by `speed` tiles; returns true when it reached a tile centre. */
  private step(
    actor: { x: number; y: number },
    dir: Dir,
    speed: number,
  ): boolean {
    const cx = Math.round(actor.x)
    const cy = Math.round(actor.y)
    const before = dir.x ? actor.x - cx : actor.y - cy
    actor.x += dir.x * speed
    actor.y += dir.y * speed
    // Tunnel wrap.
    if (actor.x < -0.5) actor.x += COLS
    if (actor.x > COLS - 0.5) actor.x -= COLS
    const after = dir.x
      ? actor.x - Math.round(actor.x)
      : actor.y - Math.round(actor.y)
    const crossed =
      (before < 0 && after >= 0) ||
      (before > 0 && after <= 0) ||
      Math.abs(after) < 1e-6
    return crossed && Math.abs(after) < speed + 1e-6
  }

  private snap(actor: { x: number; y: number }) {
    actor.x = Math.round(actor.x)
    actor.y = Math.round(actor.y)
    if (actor.x >= COLS) actor.x -= COLS
  }

  private atCentre(actor: { x: number; y: number }) {
    return (
      Math.abs(actor.x - Math.round(actor.x)) < 1e-6 &&
      Math.abs(actor.y - Math.round(actor.y)) < 1e-6
    )
  }

  private moveRobot() {
    const robot = this.robot
    const speed = levelCurve(this.level, MAZE_CURVES.robotSpeed)
    // Reversing is allowed any time, like the classic.
    if (sameDir(robot.want, opposite(robot.dir))) robot.dir = robot.want
    if (this.atCentre(robot)) {
      if (this.canMove(robot.x, robot.y, robot.want)) robot.dir = robot.want
      if (!this.canMove(robot.x, robot.y, robot.dir)) {
        robot.mouth = 0.6
        return
      }
    }
    if (this.step(robot, robot.dir, speed)) {
      this.snap(robot)
    }
    robot.mouth = (robot.mouth + 0.12) % (Math.PI * 2)
  }

  private eat() {
    const key = `${Math.round(this.robot.x) % COLS},${Math.round(this.robot.y)}`
    if (this.sparks.delete(key)) {
      this.addScore(10)
      this.eaten++
      this.sparkle(this.robot.x, this.robot.y, 3, SPARK_COLOURS, 0.8)
      if (this.tick % 2 === 0) this.sound.play('blip')
    } else if (this.cells.delete(key)) {
      this.addScore(50)
      this.eaten++
      this.sound.play('pickup')
      this.sparkle(this.robot.x, this.robot.y, 14, CELL_COLOURS, 1.8)
      this.chain = 0
      this.sleepyTimer = Math.round(
        levelCurve(this.level, MAZE_CURVES.sleepyTicks),
      )
      for (const g of this.gremlins) {
        if (g.state === 'roaming') {
          g.sleepy = true
          g.dir = opposite(g.dir)
        }
      }
    }
    if (
      this.bonusesShown < 2 &&
      this.eaten >= (this.bonusesShown === 0 ? 70 : 150)
    ) {
      this.bonusesShown++
      this.bonus = {
        kind: Math.min(this.level - 1, BONUSES.length - 1),
        ticks: 560,
      }
    }
    if (
      this.bonus &&
      Math.round(this.robot.x) === BONUS_SPOT.x &&
      Math.round(this.robot.y) === BONUS_SPOT.y
    ) {
      const prize = BONUSES[this.bonus.kind]!
      this.addScore(prize.points, BONUS_SPOT.x, BONUS_SPOT.y)
      this.sparkle(BONUS_SPOT.x, BONUS_SPOT.y, 18, undefined, 2)
      this.sound.play('extra')
      this.bonus = null
    }
  }

  private target(g: Gremlin): { x: number; y: number } {
    if (g.state === 'eyes') return DOCK_EXIT
    if (!this.chasing) return g.corner
    const r = this.robot
    switch (g.name) {
      case 'chaser':
        return { x: r.x, y: r.y }
      case 'ambusher':
        return { x: r.x + r.dir.x * 4, y: r.y + r.dir.y * 4 }
      case 'flanker': {
        const chaser = this.gremlins[0]!
        const pivot = { x: r.x + r.dir.x * 2, y: r.y + r.dir.y * 2 }
        return { x: pivot.x * 2 - chaser.x, y: pivot.y * 2 - chaser.y }
      }
      case 'wanderer': {
        const d = Math.hypot(g.x - r.x, g.y - r.y)
        return d > 8 ? { x: r.x, y: r.y } : g.corner
      }
    }
  }

  private gremlinSpeed(g: Gremlin): number {
    const base = levelCurve(this.level, MAZE_CURVES.gremlinSpeed)
    if (g.state === 'eyes') return 0.25
    if (Math.round(g.y) === TUNNEL_ROW && (g.x < 5 || g.x > COLS - 6))
      return base * 0.5
    if (g.sleepy) return base * 0.6
    return base
  }

  private moveGremlin(g: Gremlin) {
    if (g.state === 'docked') {
      // Bob in the dock until released.
      g.y = DOCK_HOME.y + Math.sin((this.tick + g.x * 20) / 10) * 0.15
      if (this.tick >= g.releaseAt) {
        g.state = 'leaving'
        g.y = DOCK_HOME.y
      }
      return
    }
    if (g.state === 'leaving') {
      const speed = 0.06
      if (Math.abs(g.x - DOCK_HOME.x) > speed) {
        g.x += Math.sign(DOCK_HOME.x - g.x) * speed
      } else {
        g.x = DOCK_HOME.x
        g.y -= speed
        if (g.y <= DOCK_EXIT.y) {
          g.y = DOCK_EXIT.y
          g.state = 'roaming'
          g.dir = this.rng() < 0.5 ? LEFT : RIGHT
          g.sleepy = false
        }
      }
      return
    }

    const speed = this.gremlinSpeed(g)
    if (this.atCentre(g)) this.chooseTurn(g)
    if (this.step(g, g.dir, speed)) {
      this.snap(g)
      if (g.state === 'eyes' && g.x === DOCK_EXIT.x && g.y === DOCK_EXIT.y) {
        g.state = 'leaving'
        g.x = DOCK_HOME.x
        g.y = DOCK_HOME.y
        g.sleepy = false
      }
    }
  }

  private chooseTurn(g: Gremlin) {
    const options = DIRS.filter(
      (d) =>
        !sameDir(d, opposite(g.dir)) &&
        this.canMove(g.x, g.y, d, g.state === 'eyes'),
    )
    if (!options.length) {
      g.dir = opposite(g.dir)
      return
    }
    if (g.sleepy && g.state === 'roaming') {
      g.dir = options[Math.floor(this.rng() * options.length)]!
      return
    }
    const target = this.target(g)
    let best = options[0]!
    let bestDistance = Infinity
    for (const d of options) {
      const distance = Math.hypot(g.x + d.x - target.x, g.y + d.y - target.y)
      if (distance < bestDistance - 1e-9) {
        bestDistance = distance
        best = d
      }
    }
    g.dir = best
  }

  private collide() {
    const r = this.robot
    for (const g of this.gremlins) {
      if (g.state !== 'roaming') continue
      const dx = Math.abs(g.x - r.x)
      const wrapDx = Math.min(dx, COLS - dx)
      if (wrapDx < 0.6 && Math.abs(g.y - r.y) < 0.6) {
        if (g.sleepy) {
          this.chain++
          const points = 100 * 2 ** this.chain
          this.addScore(points, g.x, g.y)
          g.state = 'eyes'
          g.sleepy = false
          this.sparkle(g.x, g.y, 16, [
            GREMLIN_LOOKS[g.name].ramp[3],
            RAMPS.sky[4],
            '#ffffff',
          ])
          this.sound.play('pop')
          this.pause = 30
        } else {
          this.lives--
          this.dying = 110
          this.sound.play('die')
          return
        }
      }
    }
  }

  /** A cosmetic sparkle burst at tile (tx, ty). */
  private sparkle(
    tx: number,
    ty: number,
    count: number,
    colours?: readonly string[],
    speed = 1.6,
  ) {
    const x = tx * TILE + TILE / 2
    const y = TOP + ty * TILE + TILE / 2
    this.fx.burst(
      x,
      y,
      this.fxRng,
      colours ? { count, colours, speed } : { count, speed },
    )
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 70 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_AT * 2
      this.sound.play('extra')
      this.sparkle(this.robot.x, this.robot.y, 20, ROBOT_SPARKS, 2.2)
      this.banner = { text: 'EXTRA ROBOT!', ticks: 90 }
    }
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const r = this.robot
    const sx = Math.round(r.x) % COLS
    const sy = Math.round(r.y)
    const danger = new Set<string>()
    for (const g of this.gremlins) {
      if (g.state !== 'roaming' || g.sleepy) continue
      const gx = Math.round(g.x)
      const gy = Math.round(g.y)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            danger.add(`${(gx + dx + COLS) % COLS},${gy + dy}`)
          }
        }
      }
    }
    const isGoal = (key: string) =>
      this.sparks.has(key) ||
      this.cells.has(key) ||
      this.gremlins.some(
        (g) =>
          g.sleepy &&
          g.state === 'roaming' &&
          `${Math.round(g.x) % COLS},${Math.round(g.y)}` === key,
      )
    // Breadth-first search to the nearest goal that avoids danger.
    const startKey = `${sx},${sy}`
    const firstStep = new Map<string, Dir>([[startKey, NONE]])
    const queue: Array<[number, number]> = [[sx, sy]]
    let chosen: Dir | null = null
    while (queue.length && !chosen) {
      const [x, y] = queue.shift()!
      for (const d of DIRS) {
        const nx = (x + d.x + COLS) % COLS
        const ny = y + d.y
        const key = `${nx},${ny}`
        if (
          firstStep.has(key) ||
          isWall(nx, ny) ||
          (nx === DOOR.x && ny === DOOR.y)
        )
          continue
        if (danger.has(key)) continue
        const first = firstStep.get(`${x},${y}`)!
        const step = sameDir(first, NONE) ? d : first
        firstStep.set(key, step)
        if (isGoal(key)) {
          chosen = step
          break
        }
        queue.push([nx, ny])
      }
    }
    const dir = chosen ?? this.fleeDir()
    if (sameDir(dir, UP)) held.up = true
    else if (sameDir(dir, DOWN)) held.down = true
    else if (sameDir(dir, LEFT)) held.left = true
    else if (sameDir(dir, RIGHT)) held.right = true
    return frame
  }

  private fleeDir(): Dir {
    const r = this.robot
    let best = r.dir
    let bestScore = -Infinity
    for (const d of DIRS) {
      if (!this.canMove(r.x, r.y, d)) continue
      const nx = Math.round(r.x) + d.x
      const ny = Math.round(r.y) + d.y
      const nearest = Math.min(
        ...this.gremlins.map((g) => Math.hypot(g.x - nx, g.y - ny)),
      )
      if (nearest > bestScore) {
        bestScore = nearest
        best = d
      }
    }
    return best
  }

  // --- render ----------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.intermission > 0) {
      this.renderIntermission(g)
      this.fx.render(g)
      vignette(g, W, H, 0.3)
      this.renderHud(g)
      return
    }
    const flash = this.clearing > 0 && Math.floor(this.clearing / 12) % 2 === 0
    const themeIndex = (this.level - 1) % WALL_THEMES.length
    cachedLayer(
      g,
      flash ? 'battery-maze-board-flash' : `battery-maze-board-${themeIndex}`,
      W,
      H,
      (k) => paintBoard(k, flash ? FLASH_THEME : WALL_THEMES[themeIndex]!),
    )
    this.renderSparks(g)
    this.renderCells(g)
    if (this.bonus) this.renderBonus(g, this.bonus.kind)
    if (!(this.dying > 0 && this.dying < 70)) {
      for (const gremlin of this.gremlins) this.renderGremlin(g, gremlin)
    }
    this.renderRobot(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x * TILE + TILE / 2, TOP + f.y * TILE, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  /** The sparks are live (they get eaten): a baked glow under each, and a twinkle now and then. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const spots: Array<[number, number, boolean]> = []
    for (const key of this.sparks) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const twinkle = (x * 7 + y * 13 + Math.floor(this.tick / 5)) % 29 === 0
      spots.push([x * TILE + TILE / 2, TOP + y * TILE + TILE / 2, twinkle])
    }
    const stamp = glowStamp(RAMPS.gold[3], 5, 0.3)
    if (stamp) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (const [x, y] of spots) g.drawImage(stamp, x - 5, y - 5, 10, 10)
      g.restore()
    }
    for (const [x, y, twinkle] of spots) {
      drawSprite(g, twinkle ? SPARK_TWINKLE : SPARK_SPRITE, x, y)
    }
  }

  /** Power cells pulse with a green glow; the bolt blinks between charged and dim. */
  private renderCells(g: CanvasRenderingContext2D) {
    const lit = Math.floor(this.tick / 15) % 2 === 0 || this.pause > 0
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 7)
    for (const key of this.cells) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const cx = x * TILE + TILE / 2
      const cy = TOP + y * TILE + TILE / 2
      glow(g, cx, cy, 9 + pulse * 5, RAMPS.leaf[3], 0.3 + 0.35 * pulse)
      drawSprite(g, CELL_SPRITES[lit ? 0 : 1], cx, cy)
    }
  }

  private renderBonus(g: CanvasRenderingContext2D, kind: number) {
    const sprite = BONUS_SPRITES[kind]!
    const cx = BONUS_SPOT.x * TILE + TILE / 2
    const cy = TOP + BONUS_SPOT.y * TILE + TILE / 2
    const bob = Math.round(Math.sin(this.tick / 8) * 1.5)
    glow(g, cx, cy, 12 + Math.sin(this.tick / 6) * 2, BONUSES[kind]!.color, 0.5)
    dropShadow(g, cx, cy + 7, 5, 1.5, 0.4)
    drawSprite(g, sprite, cx, cy - 1 + bob)
  }

  /** The robot sprite for a facing and mouth phase, centred on its body at (cx, cy). */
  private drawRobot(
    g: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: Dir,
    mouth: number,
    scale = 1,
  ) {
    const open = 0.15 + Math.abs(Math.sin(mouth)) * 0.55
    const frame = open < 0.3 ? 0 : open < 0.52 ? 1 : 2
    const face: Face = dir.y < 0 ? 'up' : dir.y > 0 ? 'down' : 'side'
    drawSprite(g, ROBOT_FRAMES[face][frame]!, cx, cy - 1.5 * scale, {
      flipX: dir.x < 0,
      scale,
    })
  }

  private renderRobot(g: CanvasRenderingContext2D) {
    const r = this.robot
    const cx = r.x * TILE + TILE / 2
    const cy = TOP + r.y * TILE + TILE / 2
    if (this.dying > 0) {
      if (this.dying <= 30) return
      const p = 1 - (this.dying - 30) / 80
      if (p < 0.15) {
        this.drawRobot(g, cx, cy, r.dir, 0)
        return
      }
      const i = Math.min(
        ROBOT_DEATH.length - 1,
        Math.floor(((p - 0.15) / 0.85) * ROBOT_DEATH.length),
      )
      glow(g, cx, cy, 10 + p * 8, RAMPS.teal[3], 0.5 * (1 - p))
      drawSprite(g, ROBOT_DEATH[i]!, cx, cy - 1.5)
      return
    }
    glow(g, cx, cy, 11, RAMPS.teal[3], 0.22)
    dropShadow(g, cx + 1, cy + 7, 5, 1.6, 0.4)
    this.drawRobot(g, cx, cy, r.dir, r.mouth)
  }

  /**
   * A glitch gremlin sprite: its personality's colours and crest, eyes looking where it
   * heads, feet stepping. Sleepy gremlins go blue with droopy ears, shut eyes and a drifting z
   * (flashing white near the end); a rebooting gremlin is just its eyes over a faint ghost.
   */
  private renderGremlin(
    g: CanvasRenderingContext2D,
    gremlin: Gremlin,
    scale = 1,
  ) {
    const cx = gremlin.x * TILE + TILE / 2
    const cy = TOP + gremlin.y * TILE + TILE / 2
    const art = GREMLIN_ART[gremlin.name]
    const look = gremlin.dir
    const face: Face = look.y < 0 ? 'up' : look.y > 0 ? 'down' : 'side'
    const flipX = look.x < 0
    const step = Math.floor(this.tick / 6) % 2
    const y = cy - scale

    if (gremlin.state === 'eyes') {
      glow(g, cx, cy - 2, 8, RAMPS.sky[3], 0.35)
      drawSprite(g, art.normal.side[0], cx, y, { flipX, scale, alpha: 0.18 })
      drawSprite(g, EYES_ONLY[face], cx, y, {
        flipX: flipX && face === 'side',
        scale,
      })
      return
    }
    const flashing =
      gremlin.sleepy &&
      this.sleepyTimer < 120 &&
      Math.floor(this.sleepyTimer / 12) % 2 === 0
    const sprite = gremlin.sleepy
      ? (flashing ? art.flash : art.sleepy)[step]!
      : art.normal[face][step]!
    dropShadow(g, cx, cy + 8 * scale, 6 * scale, 1.8 * scale, 0.4)
    drawSprite(g, sprite, cx, y, { flipX, scale })
    if (gremlin.sleepy) {
      const drift = (this.tick % 40) / 40
      drawSprite(
        g,
        SLEEP_Z,
        cx + (7 + drift * 3) * scale,
        cy - (10 + drift * 5) * scale,
        { scale, alpha: 1 - drift * 0.7 },
      )
    }
  }

  private renderIntermission(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'battery-maze-break', W, H, paintBreak)
    drawStars(g, BREAK_STARS, this.tick)
    const t = 300 - this.intermission
    const half = t < 150
    const laneY = TOP + 9 * TILE + TILE / 2
    hudPanel(g, W / 2 - 84, TOP + 32, 168, 26, RAMPS.purple)
    drawText(g, 'COFFEE BREAK', W / 2, TOP + 38, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    const chaser = this.gremlins[0]!
    if (half) {
      const x = W + 20 - t * 2.4
      dropShadow(g, x + 1, laneY + 7, 5, 1.6, 0.4)
      this.drawRobot(g, x, laneY, LEFT, t / 4)
      this.renderGremlin(g, {
        ...chaser,
        x: (x + 30 - TILE / 2) / TILE,
        y: 9,
        dir: LEFT,
        sleepy: false,
        state: 'roaming',
      })
    } else {
      const x = -20 + (t - 150) * 2.4
      this.renderGremlin(g, {
        ...chaser,
        x: (x - TILE / 2) / TILE,
        y: 9,
        dir: RIGHT,
        sleepy: true,
        state: 'roaming',
      })
      const bigY = laneY + TILE / 2 - 13
      glow(g, x - 34, bigY, 30, RAMPS.teal[3], 0.3)
      dropShadow(g, x - 34, laneY + 8, 18, 3, 0.4)
      this.drawRobot(g, x - 34, bigY, RIGHT, t / 4, 3)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score and high score in framed boxes along the top.
    const score = String(this.score).padStart(6, '0')
    hudPanel(g, 3, 2, measureText(score, 2) + 12, 20)
    drawText(g, score, 9, 5, {
      scale: 2,
      color: RAMPS.teal[3],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 12
    hudPanel(g, W - 3 - hiW, 2, hiW, 20)
    drawText(g, hi, W - 9, 5, {
      scale: 2,
      align: 'right',
      color: RAMPS.gold[3],
      outline: INK,
    })

    // Along the bottom: spare robots, the maze's charge (or the sleepy timer), and the level.
    const panelY = TOP + ROWS * TILE + 4
    const textY = panelY + 4
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, 3, panelY, lives * 12 + 6, 15)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, LIFE_SPRITE, 12 + i * 12, panelY + 7)
      }
    }
    const level = `LEVEL ${this.level}`
    const levelW = measureText(level) + 12
    hudPanel(g, W - 3 - levelW, panelY, levelW, 15)
    drawText(g, level, W - 9, textY, {
      align: 'right',
      color: RAMPS.purple[3],
      outline: INK,
    })
    const left = 76
    const right = W - 3 - levelW - 6
    if (right - left > 80) {
      hudPanel(g, left, panelY, right - left, 15)
      const sleepy = this.sleepyTimer > 0
      const total = this.totalSparks || 1
      const amount = sleepy
        ? this.sleepyTimer /
          Math.max(
            1,
            Math.round(levelCurve(this.level, MAZE_CURVES.sleepyTicks)),
          )
        : (total - this.sparks.size - this.cells.size) / total
      drawText(g, sleepy ? 'SLEEPY' : 'CHARGE', left + 6, textY, {
        color: sleepy ? RAMPS.sky[4] : RAMPS.gold[4],
        outline: INK,
      })
      gauge(
        g,
        left + 48,
        textY,
        right - left - 54,
        7,
        amount,
        sleepy ? RAMPS.sky : RAMPS.gold,
      )
    }

    if (this.banner) {
      drawText(g, this.banner.text, W / 2, TOP + 12.5 * TILE, {
        scale: 2,
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
        shadow: RAMPS.pink[1],
      })
    }
  }
}

const batteryMaze: ArcadeGameModule = {
  create: (options) => new BatteryMaze(options),
}

export const MAZE_SIZE = { width: W, height: H }
export const create = batteryMaze.create
export default batteryMaze

// /utils/arcade/batteryMaze/art.ts
//
// Battery Maze's 16-bit art (conductor kr-arcade/t-039, built on utils/arcade/snes.ts): the
// cat-eared robot, the glitch gremlins and their friendly rebooted selves, the sparks, cells and
// roaming prizes, and each maze's board, painted once from its parsed layout.

import {
  INK,
  RAMPS,
  bandedGradient,
  bevel,
  drawRidge,
  drawSprite,
  dropShadow,
  glow,
  mix,
  pixelSprite,
  rgba,
  ridge,
  starField,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import { MAZE_COLS, MAZE_ROWS } from './mazes'
import type { Maze, Tile } from './mazes'
import type { GremlinKind } from './roster'
import type { PowerUpKind } from './tables'

export const COLS = MAZE_COLS
export const ROWS = MAZE_ROWS
export const TILE = 14
export const TOP = 24
export const W = COLS * TILE
export const H = TOP + ROWS * TILE + 22
// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

type Pt = readonly [number, number]
export type Face = 'side' | 'up' | 'down'

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
export const ROBOT_FRAMES: Record<Face, readonly PixelSprite[]> = {
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
export const ROBOT_DEATH = Array.from({ length: 8 }, (_, i) =>
  pixelSprite(robotRows('up', 0.9 + (i / 7) * 2.3), ROBOT_PALETTE),
)

export const LIFE_SPRITE = pixelSprite(
  robotRows('side', 0.38, 0.6),
  ROBOT_PALETTE,
)

type GremlinPose = {
  /** Where it looks; 'shut' is the sleepy face, 'happy' a rebooted friend's smile. */
  eyes: Face | 'shut' | 'happy'
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
function gremlinRows(kind: GremlinKind | 'mama', pose: GremlinPose): string[] {
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
      case 'sprinter':
        // A racing fin swept back over its head.
        if (inTriangle(dx, dy, [-3.4, -5], [-6.4, -9.2], [1.4, -5.2]))
          return dy < -7 ? 'x' : '3'
        return null
      case 'snacker':
        // A slice of toast balanced on its head.
        if (dx >= -2 && dx <= 2 && dy >= -10 && dy <= -6) {
          const crust = Math.abs(dx) === 2 || dy === -10 || dy === -6
          if (crust && Math.abs(dx) === 2 && (dy === -10 || dy === -6))
            return null
          return crust ? 'x' : 'y'
        }
        return null
      case 'baby':
        if (dx === 0 && dy === -6) return '1'
        if ((dx === 0 || dx === 1) && dy === -7) return 'x'
        return null
      case 'copycat':
        // Little cat ears, just like the robot's.
        if (inTriangle(dx, dy, [-4.4, -4.6], [-3.4, -9], [-0.8, -5.4]))
          return 'x'
        if (inTriangle(dx, dy, [4.4, -4.6], [3.4, -9], [0.8, -5.4])) return 'x'
        return null
      case 'bramble':
        // A crown of thorns.
        if (dy === -6 && Math.abs(dx) <= 3) return '1'
        if ((dy === -7 || dy === -8) && (dx === -3 || dx === 0 || dx === 3))
          return dy === -8 ? 'y' : 'x'
        return null
      case 'blinker':
        // An eye on a stalk.
        if (dx === 0 && (dy === -6 || dy === -7)) return '1'
        if (Math.abs(dx) <= 1 && dy >= -10 && dy <= -8)
          return dx === 0 && dy === -9 ? 'k' : 'w'
        return null
      case 'snowball':
        // A snowflake tuft.
        if (
          (dx === 0 && dy >= -9 && dy <= -6) ||
          (dy === -8 && Math.abs(dx) <= 2)
        )
          return 'x'
        return null
      case 'static':
        // A zigzag of crackle.
        if (
          (dy === -6 && dx === -2) ||
          (dy === -7 && dx === -1) ||
          (dy === -6 && dx === 0) ||
          (dy === -7 && dx === 1) ||
          (dy === -6 && dx === 2) ||
          (dy === -8 && dx === 1)
        )
          return 'y'
        return null
      case 'gatekeeper':
        // A key on its head.
        if (dx === 0 && dy >= -9 && dy <= -6) return 'y'
        if (dy === -9 && Math.abs(dx) === 1) return 'y'
        if (dy === -7 && dx === 1) return 'y'
        return null
      case 'twin':
        // A sprout curl.
        if (dx === 0 && (dy === -6 || dy === -7)) return '1'
        if ((dx === 1 && dy === -8) || (dx === 2 && dy === -8)) return 'x'
        return null
      case 'mama':
        // A big hair bow.
        if (dx === 0 && dy === -6) return 'y'
        if (inTriangle(dx, dy, [0, -6.5], [-4.6, -9.4], [-4.6, -4.4]))
          return 'x'
        if (inTriangle(dx, dy, [0, -6.5], [4.6, -9.4], [4.6, -4.4])) return 'x'
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
        if (pose.eyes === 'happy')
          return (Math.abs(dx) === 3 && dy === -3) ||
            (Math.abs(dx) !== 3 && dy === -2)
            ? 'k'
            : sphereShade(dx / r, dy / r)
        return pupilCols.includes(dx) && pupilRows.includes(dy) ? 'k' : 'w'
      }
      if (
        pose.eyes !== 'shut' &&
        pose.eyes !== 'happy' &&
        brows.some(([bx, by]) => bx === dx && by === dy)
      )
        return 'k'
      if ((dx / 3.4) ** 2 + ((dy - 2.6) / 2.5) ** 2 <= 1)
        return dy <= 3 ? 'c' : 'd'
      if (kind === 'ambusher' && dy >= -3 && dy <= -1) return '0'
      if (kind === 'sprinter' && dy === 0 && Math.abs(dx) >= 4) return 'x'
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

/** The twins' own minty green. */
const TWIN_RAMP: Ramp = [
  mix(RAMPS.leaf[0], RAMPS.teal[0], 0.5),
  mix(RAMPS.leaf[1], RAMPS.teal[1], 0.5),
  mix(RAMPS.leaf[2], RAMPS.teal[2], 0.5),
  mix(RAMPS.leaf[3], RAMPS.teal[3], 0.5),
  mix(RAMPS.leaf[4], RAMPS.teal[4], 0.5),
]

export const GREMLIN_LOOKS: Record<
  GremlinKind | 'mama',
  { ramp: Ramp; accent: string }
> = {
  chaser: { ramp: RAMPS.pink, accent: RAMPS.pink[4] },
  ambusher: { ramp: RAMPS.rust, accent: RAMPS.gold[3] },
  flanker: { ramp: RAMPS.water, accent: RAMPS.gold[3] },
  wanderer: { ramp: RAMPS.leaf, accent: RAMPS.pink[3] },
  sprinter: { ramp: RAMPS.gold, accent: RAMPS.ember[2] },
  snacker: { ramp: RAMPS.earth, accent: RAMPS.rust[2] },
  baby: { ramp: RAMPS.purple, accent: RAMPS.pink[3] },
  mama: { ramp: RAMPS.purple, accent: RAMPS.pink[3] },
  copycat: { ramp: RAMPS.teal, accent: RAMPS.pink[3] },
  bramble: { ramp: RAMPS.earth, accent: RAMPS.leaf[3] },
  blinker: { ramp: RAMPS.steel, accent: RAMPS.gold[3] },
  snowball: { ramp: RAMPS.cream, accent: RAMPS.sky[3] },
  static: { ramp: RAMPS.night, accent: RAMPS.gold[3] },
  gatekeeper: { ramp: RAMPS.ember, accent: RAMPS.gold[3] },
  twin: { ramp: TWIN_RAMP, accent: RAMPS.pink[3] },
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

export type GremlinArt = {
  normal: Record<Face, readonly [PixelSprite, PixelSprite]>
  sleepy: readonly [PixelSprite, PixelSprite]
  flash: readonly [PixelSprite, PixelSprite]
  /** Rebooted into a friendly bot riding the Friend Train. */
  friend: readonly [PixelSprite, PixelSprite]
  /** Overclocked red (a crumb snacker that has eaten its fill). */
  hot: Record<Face, readonly [PixelSprite, PixelSprite]>
}

function gremlinArt(kind: GremlinKind | 'mama'): GremlinArt {
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
  const friend = gremlinPalette(
    ramp,
    [RAMPS.cream[4], RAMPS.cream[3]],
    RAMPS.teal[3],
    RAMPS.teal[3],
    INK,
  )
  const hot = gremlinPalette(
    RAMPS.ember,
    [RAMPS.gold[3], RAMPS.gold[2]],
    RAMPS.gold[4],
    RAMPS.gold[3],
    INK,
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
    friend: pair('happy', false, friend),
    hot: {
      side: pair('side', false, hot),
      up: pair('up', false, hot),
      down: pair('down', false, hot),
    },
  }
}

export const GREMLIN_ART: Record<GremlinKind, GremlinArt> = {
  chaser: gremlinArt('chaser'),
  ambusher: gremlinArt('ambusher'),
  flanker: gremlinArt('flanker'),
  wanderer: gremlinArt('wanderer'),
  sprinter: gremlinArt('sprinter'),
  snacker: gremlinArt('snacker'),
  baby: gremlinArt('baby'),
  copycat: gremlinArt('copycat'),
  bramble: gremlinArt('bramble'),
  blinker: gremlinArt('blinker'),
  snowball: gremlinArt('snowball'),
  static: gremlinArt('static'),
  gatekeeper: gremlinArt('gatekeeper'),
  twin: gremlinArt('twin'),
}

/** Gremlin Mama, drawn at twice the size: she is two tiles across. */
export const MAMA_ART: GremlinArt = gremlinArt('mama')

/** A rebooting gremlin is only its eyes, heading home. */
export const EYES_ONLY: Record<Face, PixelSprite> = {
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

export const SLEEP_Z = pixelSprite(['zzzz', '..z.', '.z..', 'zzzz'], {
  z: RAMPS.sky[4],
})

export const SPARK_SPRITE = pixelSprite(
  ['.y.', 'yWy', '.y.'],
  { y: RAMPS.gold[3], W: RAMPS.gold[4] },
  { outline: RAMPS.gold[0] },
)
export const SPARK_TWINKLE = pixelSprite(
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
export const CELL_SPRITES = [
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

/** One sprite per prize in PRIZES order (tables.ts). */
export const PRIZE_SPRITES: readonly PixelSprite[] = [
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
  // GOLDEN PLUG: two steel prongs, a rounded gold body and a curl of cord.
  pixelSprite(
    litRows(
      11,
      12,
      (x, y) =>
        ((x === 3 || x === 4 || x === 6 || x === 7) && y <= 2) ||
        (y >= 3 &&
          y <= 8 &&
          x >= 1 &&
          x <= 9 &&
          !((x === 1 || x === 9) && (y === 3 || y === 8))) ||
        (y >= 9 && x >= 4 && x <= 6),
      (x, y) =>
        y <= 2
          ? x === 3 || x === 6
            ? 't'
            : 'u'
          : y >= 9
            ? y === 11
              ? 'k'
              : 'c'
            : y === 5 && x >= 3 && x <= 7
              ? 'x'
              : null,
    ),
    {
      ...rampPalette(RAMPS.gold),
      t: RAMPS.steel[4],
      u: RAMPS.steel[2],
      c: RAMPS.ember[2],
      k: RAMPS.ember[1],
      x: RAMPS.gold[4],
    },
  ),
  // RAINBOW BATTERY: a battery on its side, banded in rainbow charge.
  pixelSprite(
    litRows(
      13,
      9,
      (x, y) => (x <= 10 && y >= 1 && y <= 7) || (x >= 11 && y >= 3 && y <= 5),
      (x, y) =>
        x >= 11
          ? null
          : y === 1 || y === 7 || x === 0 || x === 10
            ? null
            : ('abcde'[Math.min(4, Math.floor((x - 1) / 2))] ?? null),
    ),
    {
      ...rampPalette(RAMPS.steel),
      a: RAMPS.ember[2],
      b: RAMPS.gold[3],
      c: RAMPS.leaf[3],
      d: RAMPS.sky[3],
      e: RAMPS.purple[3],
    },
  ),
]

export type WallTheme = {
  ramp: Ramp
  neon: string
  trace: string
  face?: string
  /** The floor's bands (the night floor when absent). */
  floor?: readonly string[]
  /** What is etched on the walls' faces. */
  pattern?: 'rivets' | 'coils' | 'leaves' | 'frost' | 'tiles' | 'panels'
}

/** A board's look as a wall theme (boards.ts BoardLook). */
export function boardTheme(look: {
  wall: keyof typeof RAMPS
  neon: keyof typeof RAMPS
  floor?: keyof typeof RAMPS
  pattern: 'rivets' | 'coils' | 'leaves' | 'frost' | 'tiles' | 'panels'
}): WallTheme {
  const ramp = RAMPS[look.wall]
  const floor = look.floor ? RAMPS[look.floor] : null
  return {
    ramp,
    neon: RAMPS[look.neon][3],
    trace: mix(RAMPS.night[2], ramp[1], 0.35),
    floor: floor
      ? [
          mix(RAMPS.night[0], floor[0], 0.5),
          mix(RAMPS.night[1], floor[0], 0.6),
          mix(RAMPS.night[1], floor[1], 0.45),
          mix(RAMPS.night[1], floor[0], 0.6),
          mix(RAMPS.night[0], floor[0], 0.5),
        ]
      : undefined,
    pattern: look.pattern,
  }
}

/** The maze's colours change every level, so a long run doesn't look like one screen. */
export const WALL_THEMES: readonly WallTheme[] = [
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
export const FLASH_THEME: WallTheme = {
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

export const BREAK_STARS = starField(17, 60, W, TOP + 9 * TILE - 50)
const BREAK_FAR = ridge(23, W, 46)
const BREAK_NEAR = ridge(31, W, 24, 6)

const glowStamps = new Map<string, HTMLCanvasElement | null>()

/**
 * A soft additive glow baked once to an offscreen canvas (4x supersampled, so it stays smooth
 * in HD), for lights drawn by the hundred, like the sparks. Null headless.
 */
export function glowStamp(
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

const TRACE = new Set([
  'V',
  'e',
  'f',
  'i',
  'L',
  'k',
  'p',
  'M',
  '.',
  'o',
  ' ',
  'P',
  's',
  'a',
  'b',
  't',
  'T',
  '<',
  '>',
  '^',
  'v',
])

/**
 * The whole static maze, painted once per theme: a banded floor etched with faint circuit
 * traces between the spark sockets, neon light spilling off the walls, and the walls as raised
 * slabs, lit on their top and left edges and shadowed on their bottom and right, outlined in
 * ink. Then the charging dock with its pads, the pink dock door, and the tunnel mouths.
 */
export function paintBoard(
  k: CanvasRenderingContext2D,
  theme: WallTheme,
  maze: Maze,
) {
  const { ramp, neon } = theme
  // Gates are floor here: shut ones are drawn over the board as they swing (drawGate).
  const isFloor = (x: number, y: number) => {
    const cell = maze.rows[y]?.[x]
    return cell !== undefined && cell !== '#'
  }
  const isTrace = (x: number, y: number) => TRACE.has(maze.rows[y]?.[x] ?? '#')
  const mazeBottom = TOP + ROWS * TILE
  const floorBands = theme.floor ?? FLOOR_BANDS
  bandedGradient(k, 0, TOP, W, ROWS * TILE, floorBands, 2)
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
        if (theme.pattern === 'leaves') {
          k.fillStyle = RAMPS.leaf[2]
          k.fillRect(px + 3, py + 6, 3, 2)
          k.fillRect(px + 8, py + 4, 3, 2)
          k.fillStyle = RAMPS.leaf[1]
          k.fillRect(px + 6, py + 7, 3, 1)
        } else if (theme.pattern === 'frost') {
          k.fillStyle = RAMPS.sky[4]
          k.fillRect(px + 6, py + 3, 1, 7)
          k.fillRect(px + 3, py + 6, 7, 1)
          k.fillStyle = RAMPS.sky[3]
          k.fillRect(px + 4, py + 4, 1, 1)
          k.fillRect(px + 8, py + 8, 1, 1)
        } else if (theme.pattern === 'tiles') {
          k.fillStyle = (x + y) % 4 === 0 ? RAMPS.pink[2] : RAMPS.teal[2]
          k.fillRect(px + 5, py + 5, 4, 4)
        } else if (theme.pattern === 'panels') {
          k.fillStyle = RAMPS.sky[1]
          k.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
          k.fillStyle = RAMPS.sky[2]
          k.fillRect(px + 2, py + 6, TILE - 4, 1)
          k.fillRect(px + 6, py + 2, 1, TILE - 4)
        } else if (theme.pattern === 'coils') {
          // A glowing heating coil across the block.
          k.fillStyle = ramp[0]
          k.fillRect(px, py + 6, TILE, 3)
          k.fillStyle = RAMPS.ember[3]
          for (let i = 0; i < TILE; i += 4) k.fillRect(px + i, py + 7, 2, 1)
        } else {
          k.fillStyle = ramp[0]
          k.fillRect(px + 7, py + 7, 2, 2)
          k.fillStyle = ramp[2]
          k.fillRect(px + 6, py + 6, 2, 2)
        }
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
        k.fillStyle = floorBands[2]!
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
  const pads = maze.dockPads
  const bayY = TOP + maze.dockHome.y * TILE
  const bayX = pads[0]!.x * TILE
  bevel(k, bayX + 1, bayY + 1, pads.length * TILE - 2, TILE - 2, RAMPS.night, {
    depth: 1,
  })
  for (let x = pads[0]!.x + 1; x < pads[0]!.x + pads.length - 1; x++) {
    bevel(k, x * TILE + 3, bayY + TILE - 5, TILE - 6, 3, RAMPS.gold, {
      depth: 1,
    })
  }
  bevel(
    k,
    maze.door.x * TILE,
    TOP + maze.door.y * TILE + TILE / 2 - 2,
    TILE,
    4,
    RAMPS.pink,
    { depth: 1 },
  )

  // Tunnel mouths fade into the dark.
  for (const row of maze.tunnelRows) {
    const ty = TOP + row * TILE
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
}

/** The coffee-break stage: a banded night sky over a bevelled tile floor. */
export function paintBreak(k: CanvasRenderingContext2D) {
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

export const SPARK_COLOURS = [RAMPS.gold[4], RAMPS.gold[3], '#ffffff']
export const CELL_COLOURS = [RAMPS.leaf[3], RAMPS.leaf[4], RAMPS.gold[4]]
export const ROBOT_SPARKS = [RAMPS.teal[3], RAMPS.teal[4], RAMPS.pink[3]]

/** Whether a gate tile sits in a corridor running up and down (walls either side of it). */
function upright(maze: Maze, t: Tile): boolean {
  return maze.rows[t.y]?.[t.x - 1] === '#' && maze.rows[t.y]?.[t.x + 1] === '#'
}

/**
 * A Rewire gate. Shut, it is a striped barrier slab across the corridor, humming with the
 * theme's neon; open, it is two little posts at the corridor's sides.
 */
export function drawGate(
  g: CanvasRenderingContext2D,
  maze: Maze,
  gate: Tile,
  shut: boolean,
  tick: number,
  neon: string,
) {
  const px = gate.x * TILE
  const py = TOP + gate.y * TILE
  const across = upright(maze, gate)
  if (!shut) {
    g.fillStyle = RAMPS.steel[1]
    if (across) {
      g.fillRect(px + 1, py + 5, 2, 4)
      g.fillRect(px + TILE - 3, py + 5, 2, 4)
    } else {
      g.fillRect(px + 5, py + 1, 4, 2)
      g.fillRect(px + 5, py + TILE - 3, 4, 2)
    }
    return
  }
  const hum = 0.35 + 0.15 * Math.sin(tick / 5 + gate.x)
  glow(g, px + TILE / 2, py + TILE / 2, 12, neon, hum)
  const [x, y, w, h] = across
    ? [px, py + 3, TILE, TILE - 6]
    : [px + 3, py, TILE - 6, TILE]
  bevel(g, x, y, w, h, RAMPS.steel, { depth: 1 })
  // Hazard stripes along the slab.
  g.fillStyle = RAMPS.gold[3]
  for (let i = 0; i < (across ? w : h); i += 4) {
    if (across) g.fillRect(x + i + 1, y + 2, 2, h - 4)
    else g.fillRect(x + 2, y + i + 1, w - 4, 2)
  }
}

/**
 * A Rewire switch: a round steel plate with a lever thrown towards the side it last opened, its
 * knob lit gold while a flip is left (dim when none are).
 */
export function drawSwitch(
  g: CanvasRenderingContext2D,
  at: Tile,
  state: 0 | 1,
  armed: boolean,
  tick: number,
  auto = false,
) {
  const cx = at.x * TILE + TILE / 2
  const cy = TOP + at.y * TILE + TILE / 2
  if (auto) {
    // A mirror junction: a silver diamond that turns with the clock.
    glow(g, cx, cy, 9, RAMPS.sky[3], 0.25)
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(cx, cy - 6)
    g.lineTo(cx + 6, cy)
    g.lineTo(cx, cy + 6)
    g.lineTo(cx - 6, cy)
    g.fill()
    g.fillStyle = RAMPS.steel[3]
    g.beginPath()
    g.moveTo(cx, cy - 5)
    g.lineTo(cx + 5, cy)
    g.lineTo(cx, cy + 5)
    g.lineTo(cx - 5, cy)
    g.fill()
    g.fillStyle = '#ffffff'
    if (state === 0) g.fillRect(cx - 3, cy - 1, 6, 2)
    else g.fillRect(cx - 1, cy - 3, 2, 6)
    return
  }
  if (armed) glow(g, cx, cy, 10, RAMPS.gold[3], 0.25 + 0.1 * Math.sin(tick / 8))
  g.fillStyle = INK
  g.fillRect(cx - 5, cy - 4, 10, 8)
  g.fillRect(cx - 4, cy - 5, 8, 10)
  g.fillStyle = RAMPS.steel[2]
  g.fillRect(cx - 4, cy - 3, 8, 6)
  g.fillRect(cx - 3, cy - 4, 6, 8)
  g.fillStyle = RAMPS.steel[3]
  g.fillRect(cx - 3, cy - 3, 4, 2)
  const lean = state === 0 ? -1 : 1
  g.fillStyle = RAMPS.steel[4]
  g.fillRect(cx, cy - 1, 1, 2)
  g.fillRect(cx + lean, cy - 3, 1, 2)
  g.fillStyle = armed ? RAMPS.gold[4] : RAMPS.steel[1]
  g.fillRect(cx + lean * 2 - (lean < 0 ? 1 : 0), cy - 5, 2, 2)
}

// --- slice 2: the Toaster Works, power-ups, bolts --------------------------------------------

/** A conveyor's chevrons, scrolling the way it carries. */
export function drawConveyor(
  g: CanvasRenderingContext2D,
  at: Tile,
  dir: Tile,
  tick: number,
) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  g.fillStyle = rgba(RAMPS.steel[1], 0.55)
  if (dir.x) g.fillRect(px, py + 3, TILE, TILE - 6)
  else g.fillRect(px + 3, py, TILE - 6, TILE)
  const shift = Math.floor(tick / 4) % 7
  g.fillStyle = rgba(RAMPS.gold[3], 0.6)
  for (let i = -1; i < 2; i++) {
    const o = i * 7 + shift
    if (o < 0 || o > TILE - 3) continue
    // A little chevron pointing along `dir`.
    for (let k = 0; k < 3; k++) {
      const along = dir.x > 0 || dir.y > 0 ? o + k : TILE - 1 - o - k
      const spread = 2 - k
      if (dir.x) {
        g.fillRect(px + along, py + TILE / 2 - 1 - spread, 1, 1)
        g.fillRect(px + along, py + TILE / 2 + spread, 1, 1)
      } else {
        g.fillRect(px + TILE / 2 - 1 - spread, py + along, 1, 1)
        g.fillRect(px + TILE / 2 + spread, py + along, 1, 1)
      }
    }
  }
}

const TOAST_ROWS = [
  '.cccccc.',
  'cbbbbbbc',
  'cbtttbbc',
  'cbbbbtbc',
  'cbbbbbbc',
  'cbbbbbbc',
  '.cccccc.',
]
const TOAST = pixelSprite(TOAST_ROWS, {
  c: RAMPS.rust[1],
  b: RAMPS.gold[3],
  t: RAMPS.gold[4],
})
/** A golden "big prize" toast for Breakfast Rush. */
const PRIZE_TOAST = pixelSprite(TOAST_ROWS, {
  c: RAMPS.gold[2],
  b: RAMPS.gold[4],
  t: '#ffffff',
})

/**
 * A toaster slot: a dark slit in the floor that glows before its toast pops up, and the toast
 * itself, standing up and blocking the corridor.
 */
export function drawToastSlot(
  g: CanvasRenderingContext2D,
  at: Tile,
  state: 'down' | 'tell' | 'up',
  tick: number,
  prize = false,
) {
  const cx = at.x * TILE + TILE / 2
  const cy = TOP + at.y * TILE + TILE / 2
  if (state === 'up') {
    glow(
      g,
      cx,
      cy,
      12,
      prize ? RAMPS.gold[4] : RAMPS.ember[3],
      prize ? 0.7 : 0.35,
    )
    drawSprite(g, prize ? PRIZE_TOAST : TOAST, cx, cy - 1)
    return
  }
  g.fillStyle = INK
  g.fillRect(cx - 5, cy - 1, 10, 3)
  g.fillStyle =
    state === 'tell' && Math.floor(tick / 5) % 2 === 0
      ? RAMPS.ember[3]
      : RAMPS.rust[1]
  g.fillRect(cx - 4, cy, 8, 1)
  if (state === 'tell') glow(g, cx, cy, 10, RAMPS.ember[3], 0.45)
}

export const POWER_UP_SPRITES: Record<PowerUpKind, PixelSprite> = {
  can: pixelSprite(
    [
      '......w',
      '.ggg.w.',
      'gGGGgw.',
      'gGGGg..',
      'gGGGg..',
      'gGGGg..',
      '.ggg...',
    ],
    { g: RAMPS.leaf[2], G: RAMPS.leaf[3], w: RAMPS.sky[4] },
  ),
  lamp: pixelSprite(
    [
      '..yyy..',
      '.yYYYy.',
      '.yYYYy.',
      '..yyy..',
      '..sss..',
      '...s...',
      '..sss..',
    ],
    { y: RAMPS.gold[3], Y: RAMPS.gold[4], s: RAMPS.steel[3] },
  ),
  magnet: pixelSprite(
    [
      'rr...rr',
      'rr...rr',
      'rr...rr',
      'rr...rr',
      'rrr.rrr',
      '.rrrrr.',
      '..rrr..',
    ].map((r, y) => (y < 2 ? r.replace(/r/g, 's') : r)),
    { r: RAMPS.ember[2], s: RAMPS.steel[4] },
  ),
  turbo: pixelSprite(
    [
      '..yyy..',
      '.y...y.',
      'y..k..y',
      'y.kkk.y',
      'y..k..y',
      '.y...y.',
      '..yyy..',
    ],
    { y: RAMPS.sky[3], k: RAMPS.steel[4] },
  ),
  decoy: pixelSprite(
    [
      '.b...b.',
      '.bb.bb.',
      'bbbbbbb',
      'bkbbbkb',
      'bbbbbbb',
      'bbmmmbb',
      '.bbbbb.',
    ],
    { b: RAMPS.earth[3], k: INK, m: RAMPS.earth[1] },
  ),
  freeze: pixelSprite(
    ['.iii.', 'iwiii', 'iwiii', 'iiiii', 'iiiii', '.iii.', '..s..', '..s..'],
    { i: RAMPS.sky[3], w: '#ffffff', s: RAMPS.cream[2] },
  ),
}

/** The cardboard robot the Decoy Bot leaves behind. */
export const DECOY_SPRITE = pixelSprite(robotRows('side', 0.08), {
  ...rampPalette(RAMPS.earth),
  k: INK,
  w: RAMPS.cream[3],
  p: RAMPS.earth[2],
})

/** A golden bolt, the secret of each board. */
export const GOLDEN_BOLT = pixelSprite(
  litRows(
    13,
    17,
    (x, y) =>
      inPolygon(x + 0.5, y + 0.5, [
        [6.5, 0],
        [12.5, 0],
        [7.6, 6.8],
        [11.6, 6.8],
        [2.4, 17],
        [5.2, 9],
        [1, 9],
      ]),
    (x, y) => ((x + y) % 7 === 0 && y > 1 && y < 15 ? 'w' : null),
  ),
  {
    ...rampPalette(RAMPS.gold),
    0: RAMPS.gold[2],
    1: RAMPS.gold[3],
    w: '#ffffff',
  },
  { outline: RAMPS.ember[1] },
)

/** The little bolt the Charging Bay takes in trade. */
export const BOLT_ICON = pixelSprite(['..yy', '.yy.', 'yyyy', '.yy.', 'yy..'], {
  y: RAMPS.gold[3],
})

// --- slice 3: greenhouse, cold storage, the arcade, the solar farm, bosses ---------------------

/** A vine: a leafy bud first (`grown` 0), then a tangle across the corridor (1). */
export function drawVine(
  g: CanvasRenderingContext2D,
  at: Tile,
  grown: number,
  tick: number,
) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  if (grown <= 0) {
    // A bud, nodding.
    const nod = Math.round(Math.sin(tick / 9 + at.x) * 1)
    g.fillStyle = RAMPS.leaf[1]
    g.fillRect(px + 6, py + 8, 2, 4)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(px + 4 + nod, py + 6, 3, 2)
    g.fillRect(px + 7 + nod, py + 5, 3, 2)
    return
  }
  glow(g, px + TILE / 2, py + TILE / 2, 9, RAMPS.leaf[3], 0.25)
  g.fillStyle = INK
  g.fillRect(px, py + 2, TILE, TILE - 4)
  g.fillStyle = RAMPS.leaf[1]
  g.fillRect(px, py + 3, TILE, TILE - 6)
  g.fillStyle = RAMPS.leaf[2]
  for (let i = 0; i < TILE; i += 3)
    g.fillRect(px + i, py + 4 + ((i / 3) % 2) * 3, 2, 3)
  g.fillStyle = RAMPS.leaf[4]
  g.fillRect(px + 3, py + 5, 1, 1)
  g.fillRect(px + 9, py + 8, 1, 1)
  g.fillStyle = RAMPS.pink[3]
  g.fillRect(px + 6, py + 6, 2, 2)
}

/** A flower gate: a closed bud barring the way, or an open bloom at the corridor's edge. */
export function drawFlowerGate(
  g: CanvasRenderingContext2D,
  at: Tile,
  open: boolean,
  tick: number,
) {
  const cx = at.x * TILE + TILE / 2
  const cy = TOP + at.y * TILE + TILE / 2
  if (open) {
    glow(g, cx, cy, 8, RAMPS.pink[3], 0.3)
    drawSprite(g, PRIZE_SPRITES[2]!, cx, cy, { alpha: 0.85 })
    return
  }
  const sway = Math.sin(tick / 12 + at.y) * 0.5
  bevel(g, cx - 6, cy - 6, 12, 12, RAMPS.leaf, { depth: 1 })
  g.fillStyle = RAMPS.pink[2]
  g.fillRect(cx - 2 + sway, cy - 4, 4, 6)
  g.fillStyle = RAMPS.pink[3]
  g.fillRect(cx - 1 + sway, cy - 4, 2, 2)
}

/** A bed spark's soil patch, under the spark. */
export function drawBed(g: CanvasRenderingContext2D, at: Tile) {
  g.fillStyle = rgba(RAMPS.earth[2], 0.55)
  g.fillRect(at.x * TILE + 2, TOP + at.y * TILE + 2, TILE - 4, TILE - 4)
}

/** An ice tile's sheen. */
export function drawIce(g: CanvasRenderingContext2D, at: Tile, tick: number) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  g.fillStyle = rgba(RAMPS.sky[3], 0.28)
  g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
  const glint = (tick / 3 + at.x * 5 + at.y * 3) % 40
  if (glint < 6) {
    g.fillStyle = rgba('#ffffff', 0.6)
    g.fillRect(px + 2 + glint, py + 3, 2, 1)
  }
}

/** A fan in the wall at a row's end, and the wind streaking along the row while it blows. */
export function drawFan(
  g: CanvasRenderingContext2D,
  row: number,
  dir: 1 | -1,
  on: boolean,
  tick: number,
) {
  const x = dir > 0 ? 0 : W - TILE
  const y = TOP + row * TILE
  bevel(g, x + 1, y + 1, TILE - 2, TILE - 2, RAMPS.steel, { depth: 1 })
  const spin = on ? Math.floor(tick / 3) % 2 : 0
  g.fillStyle = RAMPS.steel[4]
  if (spin) {
    g.fillRect(x + 6, y + 3, 2, 8)
  } else {
    g.fillRect(x + 3, y + 6, 8, 2)
  }
  if (!on) return
  g.fillStyle = rgba('#ffffff', 0.35)
  for (let i = 0; i < 5; i++) {
    const t = ((tick * 2 + i * 61) % (W - TILE * 2)) + TILE
    const sx = dir > 0 ? t : W - t
    g.fillRect(sx, y + 3 + ((i * 3) % 8), 6, 1)
  }
}

/** A cabinet lamp: a tiny arcade cabinet, its marquee lit (blinking) or dark. */
export function drawLamp(
  g: CanvasRenderingContext2D,
  at: Tile,
  lit: boolean,
  tick: number,
) {
  const cx = at.x * TILE + TILE / 2
  const cy = TOP + at.y * TILE + TILE / 2
  if (lit)
    glow(
      g,
      cx,
      cy - 3,
      14,
      RAMPS.pink[3],
      0.35 + 0.15 * Math.sin(tick / 6 + at.x),
    )
  bevel(g, cx - 4, cy - 7, 8, 11, RAMPS.purple, { depth: 1 })
  g.fillStyle = lit
    ? Math.floor(tick / 20 + at.x) % 3
      ? RAMPS.pink[3]
      : RAMPS.gold[4]
    : RAMPS.night[2]
  g.fillRect(cx - 3, cy - 6, 6, 2)
  g.fillStyle = lit ? RAMPS.teal[3] : RAMPS.night[1]
  g.fillRect(cx - 3, cy - 3, 6, 3)
}

/** A locked shortcut: a padlocked grate, or nothing once it opens. */
export function drawLock(g: CanvasRenderingContext2D, at: Tile) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  bevel(g, px + 1, py + 1, TILE - 2, TILE - 2, RAMPS.steel, { depth: 1 })
  g.fillStyle = RAMPS.steel[1]
  for (let i = 3; i < TILE - 2; i += 3) g.fillRect(px + i, py + 2, 1, TILE - 4)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(px + 5, py + 6, 4, 4)
  g.fillStyle = INK
  g.fillRect(px + 6, py + 8, 2, 1)
}

/** A solar panel under its spark. */
export function drawPanel(
  g: CanvasRenderingContext2D,
  at: Tile,
  sunny: boolean,
) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  g.fillStyle = sunny ? RAMPS.sky[1] : RAMPS.night[2]
  g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
  g.fillStyle = sunny ? RAMPS.sky[2] : RAMPS.night[3]
  g.fillRect(px + 1, py + 6, TILE - 2, 1)
  g.fillRect(px + 6, py + 1, 1, TILE - 2)
}

/** Thorns a bramble left behind, fading. */
export function drawThorns(
  g: CanvasRenderingContext2D,
  at: Tile,
  life: number,
) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  g.save()
  g.globalAlpha *= Math.min(1, life / 40)
  g.fillStyle = RAMPS.earth[1]
  g.fillRect(px + 1, py + 5, TILE - 2, 4)
  g.fillStyle = RAMPS.leaf[2]
  for (let i = 1; i < TILE - 1; i += 3) {
    g.fillRect(px + i, py + 3, 1, 2)
    g.fillRect(px + i + 1, py + 9, 1, 2)
  }
  g.restore()
}

/** Static's crackle on a tile it crossed. */
export function drawCrackle(
  g: CanvasRenderingContext2D,
  at: Tile,
  life: number,
  tick: number,
) {
  const px = at.x * TILE
  const py = TOP + at.y * TILE
  const a = Math.min(1, life / 60)
  g.fillStyle = rgba(RAMPS.gold[4], 0.7 * a)
  for (let i = 0; i < 3; i++) {
    const o = (tick + i * 7 + at.x * 3) % 11
    g.fillRect(px + 2 + o, py + 3 + ((o * 3 + i) % 8), 1, 2)
  }
}

/**
 * Lights out: a dark veil over the maze with holes of light around the robot and every lit
 * lamp. Drawn through an offscreen layer (no light when headless).
 */
let veil: HTMLCanvasElement | null = null
export function drawDarkness(
  g: CanvasRenderingContext2D,
  lights: ReadonlyArray<{ x: number; y: number; r: number }>,
  depth: number,
) {
  if (typeof document === 'undefined') return
  if (!veil) {
    veil = document.createElement('canvas')
    veil.width = W
    veil.height = H
  }
  const k = veil.getContext('2d')
  if (!k) return
  k.globalCompositeOperation = 'source-over'
  k.clearRect(0, 0, W, H)
  k.fillStyle = rgba(INK, depth)
  k.fillRect(0, TOP, W, ROWS * TILE)
  k.globalCompositeOperation = 'destination-out'
  for (const l of lights) {
    const cx = l.x * TILE + TILE / 2
    const cy = TOP + l.y * TILE + TILE / 2
    const r = l.r * TILE
    const grad = k.createRadialGradient(cx, cy, r * 0.35, cx, cy, r)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    k.fillStyle = grad
    k.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  g.drawImage(veil, 0, 0)
}

/** A car of the Glitch Train: a boxy gremlin wagon in its sleepy blue or its glitchy pink. */
export function drawTrainCar(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  sleepy: boolean,
  caboose: boolean,
  tick: number,
) {
  const cx = x * TILE + TILE / 2
  const cy = TOP + y * TILE + TILE / 2
  const ramp = sleepy ? RAMPS.sky : caboose ? RAMPS.gold : RAMPS.pink
  dropShadow(g, cx, cy + 7, 6, 1.6, 0.4)
  bevel(g, cx - 6, cy - 5, 12, 10, ramp, { depth: 1 })
  g.fillStyle = INK
  g.fillRect(cx - 5, cy + 4, 3, 2)
  g.fillRect(cx + 2, cy + 4, 3, 2)
  g.fillStyle = sleepy ? RAMPS.sky[4] : RAMPS.gold[4]
  g.fillRect(cx - 4, cy - 3, 3, 2)
  g.fillRect(cx + 1, cy - 3, 3, 2)
  if (caboose && sleepy && Math.floor(tick / 10) % 2 === 0) {
    g.strokeStyle = RAMPS.gold[4]
    g.strokeRect(cx - 7.5, cy - 6.5, 15, 13)
  }
}

/** The Overload: a great face, its four plugs trailing, eyes flaring as it surges. */
export function drawOverload(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  plugs: number,
  mood: 'angry' | 'sleepy' | 'dazed' | 'calm',
  tick: number,
) {
  const cx = x * TILE + TILE / 2
  const cy = TOP + y * TILE + TILE / 2
  const ramp =
    mood === 'sleepy' ? RAMPS.sky : mood === 'calm' ? RAMPS.teal : RAMPS.purple
  // Plugs on their cables, one to each corner.
  for (let i = 0; i < 4; i++) {
    const ax = cx + (i % 2 ? 22 : -22)
    const ay = cy + (i < 2 ? -18 : 18)
    if (i >= plugs) continue
    g.strokeStyle = RAMPS.steel[2]
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(cx + (i % 2 ? 12 : -12), cy + (i < 2 ? -8 : 8))
    g.quadraticCurveTo(ax, cy, ax, ay)
    g.stroke()
    bevel(g, ax - 3, ay - 3, 6, 6, RAMPS.gold, { depth: 1 })
  }
  glow(g, cx, cy, 34, mood === 'angry' ? RAMPS.ember[2] : ramp[3], 0.35)
  bevel(g, cx - 20, cy - 16, 40, 32, ramp, { depth: 2 })
  // Ears.
  g.fillStyle = ramp[2]
  for (const s of [-1, 1]) {
    g.beginPath()
    g.moveTo(cx + s * 12, cy - 16)
    g.lineTo(cx + s * 22, cy - 30)
    g.lineTo(cx + s * 20, cy - 12)
    g.fill()
  }
  // Eyes and mouth.
  const flare = mood === 'angry' ? 0.6 + 0.4 * Math.sin(tick / 3) : 0
  for (const s of [-1, 1]) {
    const ex = cx + s * 9
    if (mood === 'sleepy' || mood === 'dazed') {
      g.fillStyle = INK
      g.fillRect(ex - 4, cy - 6, 8, 2)
    } else {
      g.fillStyle = '#ffffff'
      g.fillRect(ex - 4, cy - 9, 8, 7)
      g.fillStyle = mood === 'angry' ? RAMPS.ember[2] : INK
      g.fillRect(ex - 1, cy - 7, 3, 4)
      if (flare) glow(g, ex, cy - 6, 8, RAMPS.ember[3], flare * 0.6)
    }
  }
  g.fillStyle = INK
  g.fillRect(cx - 8, cy + 6, 16, 3)
  if (mood === 'calm') {
    g.fillStyle = ramp[1]
    g.fillRect(cx - 8, cy + 6, 16, 1)
  }
}

/** A surge's line: lit up first, then live. */
export function drawSurge(
  g: CanvasRenderingContext2D,
  axis: 'row' | 'col',
  at: number,
  live: boolean,
  tick: number,
) {
  const alpha = live ? 0.75 : 0.18 + 0.12 * Math.sin(tick / 2)
  g.save()
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = rgba(live ? RAMPS.gold[4] : RAMPS.ember[3], alpha)
  if (axis === 'row') g.fillRect(0, TOP + at * TILE + 2, W, TILE - 4)
  else g.fillRect(at * TILE + 2, TOP, TILE - 4, ROWS * TILE)
  g.restore()
}

/** A story prop: a cake, falling snow, the dark, the sun, or the garden's glowing flowers. */
export function drawProp(
  g: CanvasRenderingContext2D,
  cast: 'cake' | 'snow' | 'dark' | 'sun' | 'flowers',
  x: number,
  y: number,
  scale: number,
  tick: number,
) {
  switch (cast) {
    case 'cake': {
      bevel(g, x - 16, y - 8, 32, 12, RAMPS.pink, { depth: 2 })
      bevel(g, x - 11, y - 18, 22, 10, RAMPS.cream, { depth: 2 })
      for (let i = -1; i <= 1; i++) {
        g.fillStyle = RAMPS.sky[3]
        g.fillRect(x + i * 6, y - 24, 2, 6)
        glow(g, x + i * 6 + 1, y - 26, 4, RAMPS.gold[4], 0.7)
      }
      return
    }
    case 'snow':
      for (let i = 0; i < 40; i++) {
        const fx = (i * 53 + Math.sin(tick / 30 + i) * 10 + W * 4) % W
        const fy = (i * 37 + tick * (0.4 + (i % 3) * 0.2)) % H
        g.fillStyle = rgba('#ffffff', 0.7)
        g.fillRect(fx, fy, i % 3 ? 1 : 2, i % 3 ? 1 : 2)
      }
      return
    case 'dark':
      g.fillStyle = rgba(INK, 0.86)
      g.fillRect(0, TOP + 62, W, H - TOP - 62)
      for (let i = 0; i < 4; i++) {
        const ex = 60 + i * 60
        if (Math.floor(tick / 40 + i) % 3 === 0) continue
        g.fillStyle = '#ffffff'
        g.fillRect(ex, y - 3, 2, 2)
        g.fillRect(ex + 5, y - 3, 2, 2)
      }
      return
    case 'sun':
      glow(g, x, y, 60, RAMPS.gold[3], 0.5)
      g.fillStyle = RAMPS.gold[3]
      g.beginPath()
      g.arc(x, y, 18, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = RAMPS.gold[4]
      g.beginPath()
      g.arc(x - 5, y - 5, 7, 0, Math.PI * 2)
      g.fill()
      return
    case 'flowers': {
      const n = Math.max(0, Math.min(16, Math.round(scale * 2)))
      for (let i = 0; i < n; i++) {
        const fx = 14 + i * 19
        const sway = Math.sin(tick / 15 + i) * 1.5
        glow(g, fx, y - 6, 9, i % 2 ? RAMPS.pink[3] : RAMPS.teal[3], 0.5)
        g.fillStyle = RAMPS.leaf[2]
        g.fillRect(fx, y - 6, 1, 8)
        drawSprite(g, PRIZE_SPRITES[2]!, fx + sway, y - 9)
      }
    }
  }
}

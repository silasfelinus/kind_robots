// /utils/arcade/sinkSuds/basins.ts
//
// Sink Suds' basins as data (conductor kr-arcade/t-043, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3). A basin is a union of
// simple shapes (ellipses and rounded rectangles), measured with signed
// distances so one containment rule serves every shape, plus a water-physics
// hook: still water, a faucet current, a spinning drum, a side-view tank's
// buoyancy, or a conveyor's lanes. The game reads these; nothing
// basin-specific lives in its update loop.

export const W = 420
export const H = 360

export type Point = { x: number; y: number }

/** One piece of a basin's floor. */
export type Prim =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | {
      kind: 'rect'
      x: number
      y: number
      w: number
      h: number
      r: number
      /** A hidden joining piece (an overflow gap): water, but no floor shading of its own. */
      joint?: boolean
    }

/** The water physics a basin runs (its hook). */
export type Physics =
  | { kind: 'still' }
  /** A faucet current: a steady push along the basin (px/tick^2). */
  | { kind: 'current'; ax: number; ay: number }
  /**
   * A drum turning about (cx, cy): its speed steps through `dial` (in turns of
   * SPIN_PUSH), `every` ticks a setting, with the dial showing the next one
   * DIAL_TELL ticks early.
   */
  | {
      kind: 'spin'
      cx: number
      cy: number
      r: number
      dial: readonly number[]
      every: number
    }
  /** Side view: the bubble floats up by itself and steering down costs effort. */
  | { kind: 'buoyancy'; lift: number; downEffort: number; floor: number }
  /**
   * A birdbath's ripples: the bubble is pushed out from (cx, cy) in waves, as
   * strong as the game's wave phase (it passes that as `spin`, 0..1).
   */
  | {
      kind: 'ripple'
      cx: number
      cy: number
      r: number
      strength: number
      period: number
    }
  /** Horizontal belts between `top` and `bottom`, alternating direction. */
  | {
      kind: 'conveyor'
      top: number
      bottom: number
      lanes: number
      speed: number
    }

export type BasinShape =
  'oval' | 'double' | 'tub' | 'drum' | 'tank' | 'conveyor' | 'bowl'
export type BasinLook =
  'steel' | 'enamel' | 'drum' | 'glass' | 'bay' | 'stone' | 'palace'

export type BasinDef = {
  id: string
  name: string
  shape: BasinShape
  look: BasinLook
  prims: readonly Prim[]
  drain: Point
  /** Where the bubble starts and respawns. */
  start: Point
  physics: Physics
  /** Velocity kept each tick (lower is grippier water). */
  friction: number
  /** Steering acceleration multiplier (lower is more slippery). */
  grip: number
  /** Where the tap pours in, on the rim at the top or the left end. */
  faucet?: Point & { side: 'top' | 'left' }
  /** Narrow ways through (the double sink's overflow gap), for the attract pilot's route. */
  gaps?: readonly Point[]
  /** Where one bowl opens into another, drawn over the rims between them. */
  openings?: readonly { x: number; y: number; w: number; h: number }[]
}

/** Ticks the drum's dial shows its next setting before the drum changes speed. */
export const DIAL_TELL = 90
/** Tangential push at the rim for a dial setting of 1. */
export const SPIN_PUSH = 0.034

// --- distances --------------------------------------------------------------------------------

/** Signed distance from (x, y) to a shape's edge: negative inside. */
export function primSdf(p: Prim, x: number, y: number): number {
  if (p.kind === 'ellipse') {
    const dx = x - p.cx
    const dy = y - p.cy
    const f = Math.hypot(dx / p.rx, dy / p.ry)
    if (f < 1e-6) return -Math.min(p.rx, p.ry)
    // Radial distance to the rim along the ray from the centre.
    return (Math.hypot(dx, dy) * (f - 1)) / f
  }
  const hw = p.w / 2
  const hh = p.h / 2
  const qx = Math.abs(x - (p.x + hw)) - (hw - p.r)
  const qy = Math.abs(y - (p.y + hh)) - (hh - p.r)
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    p.r
  )
}

/** Signed distance to the basin's wall: negative inside the water. */
export function basinSdf(b: BasinDef, x: number, y: number): number {
  let best = Infinity
  for (const p of b.prims) best = Math.min(best, primSdf(p, x, y))
  return best
}

/** Is (x, y) in the basin with at least `margin` pixels to spare? */
export function insideBasin(b: BasinDef, x: number, y: number, margin = 0) {
  return basinSdf(b, x, y) <= -margin
}

/** Can a body of radius r travel straight from a to b without leaving the water? */
export function clearPath(b: BasinDef, a: Point, c: Point, r: number) {
  const steps = Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 8)
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    if (!insideBasin(b, a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, r * 0.6))
      return false
  }
  return true
}

/** The wall's outward normal near (x, y). */
export function wallNormal(b: BasinDef, x: number, y: number): Point {
  const e = 1
  const nx = basinSdf(b, x + e, y) - basinSdf(b, x - e, y)
  const ny = basinSdf(b, x, y + e) - basinSdf(b, x, y - e)
  const len = Math.hypot(nx, ny)
  if (len < 1e-9) return { x: 0, y: -1 }
  return { x: nx / len, y: ny / len }
}

/**
 * Keep a body of radius `r` inside the basin: step it back along the wall's
 * normal and reflect its outward velocity by `bounce` (1 stops it, 2 mirrors).
 * Returns whether it touched the wall.
 */
export function keepInside(
  b: BasinDef,
  body: { x: number; y: number; vx?: number; vy?: number },
  r: number,
  bounce = 1.6,
): boolean {
  if (insideBasin(b, body.x, body.y, r)) return false
  const n = wallNormal(b, body.x, body.y)
  if (body.vx !== undefined && body.vy !== undefined) {
    const dot = body.vx * n.x + body.vy * n.y
    if (dot > 0) {
      body.vx -= bounce * dot * n.x
      body.vy -= bounce * dot * n.y
    }
  }
  for (let i = 0; i < 40 && !insideBasin(b, body.x, body.y, r); i++) {
    const m = wallNormal(b, body.x, body.y)
    body.x -= m.x
    body.y -= m.y
  }
  if (!insideBasin(b, body.x, body.y, r)) {
    body.x = b.start.x
    body.y = b.start.y
  }
  return true
}

/** The box around every shape of the basin. */
export function basinBounds(b: BasinDef) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of b.prims) {
    const [a, c, d, e] =
      p.kind === 'ellipse'
        ? [p.cx - p.rx, p.cy - p.ry, p.cx + p.rx, p.cy + p.ry]
        : [p.x, p.y, p.x + p.w, p.y + p.h]
    x0 = Math.min(x0, a)
    y0 = Math.min(y0, c)
    x1 = Math.max(x1, d)
    y1 = Math.max(y1, e)
  }
  return { x0, y0, x1, y1 }
}

// --- the physics hook ---------------------------------------------------------------------------

/** The drum's dial setting at `tick`, and the one it will turn to next. */
export function dialAt(p: Extract<Physics, { kind: 'spin' }>, tick: number) {
  const slot = Math.floor(tick / p.every)
  const now = p.dial[slot % p.dial.length]!
  const next = p.dial[(slot + 1) % p.dial.length]!
  const telling = tick % p.every >= p.every - DIAL_TELL
  return { now, next, telling }
}

/** Which way the conveyor lane under y runs (1 right, -1 left, 0 off the belts). */
export function laneDir(p: Extract<Physics, { kind: 'conveyor' }>, y: number) {
  if (y < p.top || y >= p.bottom) return 0
  const lane = Math.floor(((y - p.top) / (p.bottom - p.top)) * p.lanes)
  return lane % 2 === 0 ? 1 : -1
}

/**
 * The water's push on a floating body at (x, y), in px/tick^2. `spin` is the
 * drum's current speed (the game eases it toward the dial). `stage` (1..5)
 * makes bigger bubbles float harder in the tank.
 */
export function flowAt(
  b: BasinDef,
  x: number,
  y: number,
  spin: number,
  stage = 3,
): Point {
  const p = b.physics
  switch (p.kind) {
    case 'current':
      return { x: p.ax, y: p.ay }
    case 'spin': {
      const dx = x - p.cx
      const dy = y - p.cy
      const d = Math.hypot(dx, dy) || 1
      const k = (d / p.r) * SPIN_PUSH * spin
      // Round the rim, and a little outward the faster it turns.
      const out = 0.004 * spin * spin * (d / p.r)
      return {
        x: (-dy / d) * k + (dx / d) * out,
        y: (dx / d) * k + (dy / d) * out,
      }
    }
    case 'ripple': {
      const dx = x - p.cx
      const dy = y - p.cy
      const d = Math.hypot(dx, dy) || 1
      const k = p.strength * spin * (0.3 + 0.7 * Math.min(1, d / p.r))
      return { x: (dx / d) * k, y: (dy / d) * k }
    }
    case 'buoyancy':
      return { x: 0, y: -p.lift * (0.7 + stage * 0.1) }
    case 'conveyor':
      return { x: laneDir(p, y) * p.speed, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

/**
 * Where a resting thing (a crumb, a grease spot) is carried this tick: round
 * the drum, or along a belt (wrapping to the lane's start, as a belt loops).
 */
export function carry(b: BasinDef, at: Point, spin: number): Point {
  const p = b.physics
  if (p.kind === 'spin') {
    const a = spin * 0.0035
    const dx = at.x - p.cx
    const dy = at.y - p.cy
    return {
      x: p.cx + dx * Math.cos(a) - dy * Math.sin(a),
      y: p.cy + dx * Math.sin(a) + dy * Math.cos(a),
    }
  }
  if (p.kind === 'conveyor') {
    const dir = laneDir(p, at.y)
    if (!dir) return at
    const x = at.x + dir * p.speed * 6
    if (insideBasin(b, x, at.y, 10)) return { x, y: at.y }
    // Off the end of the belt: back round to the other end of the lane.
    const { x0, x1 } = basinBounds(b)
    return { x: dir > 0 ? x0 + 14 : x1 - 14, y: at.y }
  }
  return at
}

// --- the catalogue ------------------------------------------------------------------------------

const KITCHEN_OVAL: BasinDef = {
  id: 'oval',
  name: 'THE OVAL SINK',
  shape: 'oval',
  look: 'steel',
  prims: [{ kind: 'ellipse', cx: 210, cy: 188, rx: 186, ry: 146 }],
  drain: { x: 210, y: 188 },
  start: { x: 210, y: 258 },
  physics: { kind: 'still' },
  friction: 0.965,
  grip: 1,
  faucet: { x: 210, y: 42, side: 'top' },
}

const DOUBLE_SINK: BasinDef = {
  id: 'double',
  name: 'THE DOUBLE SINK',
  shape: 'double',
  look: 'steel',
  prims: [
    // The overflow gap first, so the two bowls draw over its ends.
    { kind: 'rect', x: 150, y: 160, w: 120, h: 48, r: 4, joint: true },
    { kind: 'rect', x: 22, y: 56, w: 180, h: 268, r: 44 },
    { kind: 'rect', x: 218, y: 56, w: 180, h: 268, r: 44 },
  ],
  drain: { x: 308, y: 232 },
  start: { x: 112, y: 250 },
  physics: { kind: 'still' },
  friction: 0.965,
  grip: 1,
  faucet: { x: 112, y: 56, side: 'top' },
  gaps: [{ x: 210, y: 184 }],
  openings: [{ x: 194, y: 161, w: 32, h: 46 }],
}

const BATHTUB: BasinDef = {
  id: 'tub',
  name: 'THE LONG TUB',
  shape: 'tub',
  look: 'enamel',
  prims: [{ kind: 'rect', x: 36, y: 92, w: 366, h: 200, r: 96 }],
  drain: { x: 352, y: 192 },
  start: { x: 104, y: 192 },
  physics: { kind: 'current', ax: 0.022, ay: 0 },
  friction: 0.968,
  grip: 1,
  faucet: { x: 34, y: 192, side: 'left' },
}

const DRUM: BasinDef = {
  id: 'drum',
  name: 'THE SPIN DRUM',
  shape: 'drum',
  look: 'drum',
  prims: [{ kind: 'ellipse', cx: 210, cy: 192, rx: 152, ry: 152 }],
  drain: { x: 210, y: 192 },
  start: { x: 210, y: 270 },
  physics: {
    kind: 'spin',
    cx: 210,
    cy: 192,
    r: 152,
    dial: [0.6, 1.1, -0.7, 1.5, 0.2, -1.2],
    every: 60 * 8,
  },
  friction: 0.965,
  grip: 1,
}

const TANK: BasinDef = {
  id: 'tank',
  name: 'THE FISH TANK',
  shape: 'tank',
  look: 'glass',
  prims: [{ kind: 'rect', x: 28, y: 52, w: 364, h: 276, r: 6 }],
  drain: { x: 210, y: 306 },
  start: { x: 210, y: 120 },
  physics: { kind: 'buoyancy', lift: 0.022, downEffort: 0.7, floor: 312 },
  friction: 0.958,
  grip: 1.05,
}

const CONVEYOR: BasinDef = {
  id: 'conveyor',
  name: 'THE WASH BAY',
  shape: 'conveyor',
  look: 'bay',
  prims: [{ kind: 'rect', x: 22, y: 58, w: 376, h: 268, r: 14 }],
  drain: { x: 210, y: 192 },
  start: { x: 210, y: 300 },
  physics: { kind: 'conveyor', top: 58, bottom: 326, lanes: 4, speed: 0.024 },
  friction: 0.962,
  grip: 1,
}

const BIRDBATH: BasinDef = {
  id: 'birdbath',
  name: 'THE BIRDBATH',
  shape: 'bowl',
  look: 'stone',
  prims: [{ kind: 'ellipse', cx: 210, cy: 196, rx: 178, ry: 132 }],
  drain: { x: 210, y: 196 },
  start: { x: 210, y: 290 },
  physics: {
    kind: 'ripple',
    cx: 210,
    cy: 196,
    r: 178,
    strength: 0.045,
    period: 170,
  },
  friction: 0.966,
  grip: 1,
}

const FOUNTAIN: BasinDef = {
  id: 'fountain',
  name: 'THE TOWN FOUNTAIN',
  shape: 'bowl',
  look: 'stone',
  prims: [{ kind: 'ellipse', cx: 210, cy: 196, rx: 184, ry: 138 }],
  drain: { x: 210, y: 196 },
  start: { x: 210, y: 300 },
  physics: { kind: 'still' },
  friction: 0.965,
  grip: 1,
}

const PALACE: BasinDef = {
  id: 'palace',
  name: 'THE BUBBLE BATH PALACE',
  shape: 'tub',
  look: 'palace',
  prims: [{ kind: 'rect', x: 26, y: 56, w: 368, h: 272, r: 70 }],
  drain: { x: 210, y: 192 },
  start: { x: 210, y: 290 },
  physics: { kind: 'still' },
  friction: 0.968,
  grip: 1,
}

export const BASINS = {
  oval: KITCHEN_OVAL,
  double: DOUBLE_SINK,
  tub: BATHTUB,
  drum: DRUM,
  tank: TANK,
  conveyor: CONVEYOR,
  birdbath: BIRDBATH,
  fountain: FOUNTAIN,
  palace: PALACE,
} as const satisfies Record<string, BasinDef>

export type BasinId = keyof typeof BASINS

/** The endless sink's playlist: every shape in turn, then round again dirtier and faster. */
export const BASIN_PLAYLIST: readonly BasinId[] = [
  'oval',
  'double',
  'tub',
  'drum',
  'tank',
  'conveyor',
]

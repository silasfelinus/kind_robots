// /utils/arcade/rescueRally/arena.ts
//
// Rescue Rally's floor plan (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1): the
// playfield, the bevelled arena inside it, the four wall vents foes can arrive through, and the
// small geometry helpers every other Rescue Rally module shares.

export const W = 480
export const H = 360
export const ARENA = { left: 12, top: 28, right: W - 12, bottom: H - 16 }
export const ARENA_W = ARENA.right - ARENA.left
export const ARENA_H = ARENA.bottom - ARENA.top
export const CX = ARENA.left + ARENA_W / 2
export const CY = ARENA.top + ARENA_H / 2

export type Point = { x: number; y: number }

/** The four wall vents, clockwise from the top: late arrivals come through these. */
export const VENTS: readonly Point[] = [
  { x: CX, y: ARENA.top + 10 },
  { x: ARENA.right - 10, y: CY },
  { x: CX, y: ARENA.bottom - 10 },
  { x: ARENA.left + 10, y: CY },
]

export function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function clampToArena(o: Point, r: number) {
  o.x = Math.min(ARENA.right - r, Math.max(ARENA.left + r, o.x))
  o.y = Math.min(ARENA.bottom - r, Math.max(ARENA.top + r, o.y))
}

/** True once a point is within `r` of a wall. */
export function nearWall(p: Point, r: number) {
  return (
    p.x <= ARENA.left + r ||
    p.x >= ARENA.right - r ||
    p.y <= ARENA.top + r ||
    p.y >= ARENA.bottom - r
  )
}

/** The nearest spot just inside a wall: where a dizzy rescuee wanders off to. */
export function nearestExit(p: Point): Point {
  const gaps = [
    { d: p.y - ARENA.top, x: p.x, y: ARENA.top + 2 },
    { d: ARENA.right - p.x, x: ARENA.right - 2, y: p.y },
    { d: ARENA.bottom - p.y, x: p.x, y: ARENA.bottom - 2 },
    { d: p.x - ARENA.left, x: ARENA.left + 2, y: p.y },
  ]
  gaps.sort((a, b) => a.d - b.d)
  return { x: gaps[0]!.x, y: gaps[0]!.y }
}

/** A unit vector from `a` toward `b` (straight up when they meet). */
export function toward(a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  return len > 1e-6 ? { x: dx / len, y: dy / len } : { x: 0, y: -1 }
}

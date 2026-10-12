// /utils/arcade/butterflyBlaster/sky.ts
//
// Butterfly Blaster's playfield (conductor kr-arcade/t-055, depth-pass CABINETS.md section 6): a
// wrapping night sky over a village. Everything that flies wraps at the sides, and between the top
// of the sky and the ground line (the ground strip under it is the village's and is never flown
// through), so distances and headings are measured the short way round.

export const W = 480
export const H = 360
/** The village stands on this line; the HUD's bottom boxes sit on the ground below it. */
export const GROUND = H - 22
/** The flying sky's height: it wraps from the ground line back to the top. */
export const SKY = GROUND

export type Point = { x: number; y: number }
export type Body = Point & { vx: number; vy: number }

export function wrap(v: Point) {
  if (v.x < 0) v.x += W
  else if (v.x >= W) v.x -= W
  if (v.y < 0) v.y += SKY
  else if (v.y >= SKY) v.y -= SKY
}

/** Shortest delta from a to b on the wrapping playfield. */
export function wrapDelta(from: number, to: number, span: number): number {
  let d = to - from
  if (d > span / 2) d -= span
  else if (d < -span / 2) d += span
  return d
}

/** The wrapped vector from a to b. */
export function toward(a: Point, b: Point): Point {
  return { x: wrapDelta(a.x, b.x, W), y: wrapDelta(a.y, b.y, SKY) }
}

/** Distance the short way round. */
export function wrapDist(a: Point, b: Point): number {
  const d = toward(a, b)
  return Math.hypot(d.x, d.y)
}

export function angleDiff(a: number, b: number): number {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** Cap a body's speed. */
export function limitSpeed(b: Body, max: number) {
  const s = Math.hypot(b.vx, b.vy)
  if (s > max) {
    b.vx *= max / s
    b.vy *= max / s
  }
}

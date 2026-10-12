// /utils/arcade/butterflyBlaster/lasso.ts
//
// The Rainbow Lasso (conductor kr-arcade/t-055, CABINETS.md section 6 "Systems"): while the
// butterfly flutters it trails a rainbow ribbon about a second and a half long. Cross your own
// ribbon and the loop closes: every mosquito inside is netted at once.
//
// The ribbon is laid in unwrapped coordinates (the butterfly's position before the sky wraps it),
// so a loop flown across an edge is still one closed shape. Whether a pest is inside is asked of
// every wrapped copy of its position that falls within the loop's bounds.

import { SKY, W } from './sky'
import type { Point } from './sky'

/** How long a laid piece of ribbon lasts, in ticks. */
export const RIBBON_TICKS = 90
/** A ribbon point is laid every this many ticks of flutter. */
export const RIBBON_STEP = 2
/** Loops smaller than this (px²) are a wobble, not a lasso. */
export const MIN_LOOP_AREA = 260
/** Points per mosquito netted, before the loop's multiplier. */
export const LASSO_POINTS = 100

export type RibbonPoint = {
  x: number
  y: number
  /** The tick it was laid. */
  t: number
  /** No ribbon joins it to the point before (the flutter paused). */
  gap: boolean
}

export type Loop = {
  points: Point[]
  minX: number
  maxX: number
  minY: number
  maxY: number
  area: number
}

/** The multiplier a loop pays at for this many mosquitoes. */
export function lassoMultiplier(count: number): number {
  if (count >= 20) return 5
  if (count >= 12) return 4
  if (count >= 7) return 3
  if (count >= 3) return 2
  return 1
}

/** Where segments ab and cd cross (not at a shared end), or null. */
export function crossing(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x
  const ry = b.y - a.y
  const sx = d.x - c.x
  const sy = d.y - c.y
  const den = rx * sy - ry * sx
  if (Math.abs(den) < 1e-9) return null
  const qx = c.x - a.x
  const qy = c.y - a.y
  const t = (qx * sy - qy * sx) / den
  const u = (qx * ry - qy * rx) / den
  if (t <= 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a.x + rx * t, y: a.y + ry * t }
}

export function polygonArea(points: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export function makeLoop(points: Point[]): Loop {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return { points, minX, maxX, minY, maxY, area: polygonArea(points) }
}

function insidePolygon(points: readonly Point[], x: number, y: number) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i]!
    const b = points[j]!
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside
  }
  return inside
}

/** Is a point of the wrapping sky inside the loop (any of its wrapped copies)? */
export function insideLoop(loop: Loop, x: number, y: number): boolean {
  const kx0 = Math.ceil((loop.minX - x) / W)
  const kx1 = Math.floor((loop.maxX - x) / W)
  const ky0 = Math.ceil((loop.minY - y) / SKY)
  const ky1 = Math.floor((loop.maxY - y) / SKY)
  for (let i = kx0; i <= kx1; i++) {
    for (let j = ky0; j <= ky1; j++) {
      if (insidePolygon(loop.points, x + i * W, y + j * SKY)) return true
    }
  }
  return false
}

export class Ribbon {
  points: RibbonPoint[] = []
  /** Ticks a piece of ribbon lasts (the Clinic sells a longer one). */
  life = RIBBON_TICKS

  clear() {
    this.points = []
  }

  /** Forget ribbon older than its life. */
  age(tick: number) {
    let drop = 0
    while (drop < this.points.length && tick - this.points[drop]!.t > this.life)
      drop++
    if (drop) {
      this.points.splice(0, drop)
      if (this.points.length) this.points[0]!.gap = true
    }
  }

  /** The last point laid, if any. */
  get head(): RibbonPoint | undefined {
    return this.points.at(-1)
  }

  /**
   * Lay the next point (`joined`: ribbon runs to it from the last one). When the new piece
   * crosses older ribbon the loop closes: it is returned, and the ribbon starts again from the
   * crossing.
   */
  lay(x: number, y: number, tick: number, joined: boolean): Loop | null {
    const b: RibbonPoint = { x, y, t: tick, gap: !joined || !this.points.length }
    const a = this.points.at(-1)
    this.points.push(b)
    if (b.gap || !a) return null
    const n = this.points.length - 1
    for (let i = n - 3; i >= 0; i--) {
      const c = this.points[i]!
      const d = this.points[i + 1]!
      if (d.gap) continue
      const at = crossing(a, b, c, d)
      if (!at) continue
      const ring: Point[] = [at]
      for (let k = i + 1; k < n; k++) ring.push(this.points[k]!)
      const loop = makeLoop(ring)
      if (loop.area < MIN_LOOP_AREA) return null
      this.points = [
        { x: at.x, y: at.y, t: tick, gap: true },
        { ...b, gap: false },
      ]
      return loop
    }
    return null
  }
}

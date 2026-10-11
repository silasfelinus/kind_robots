// /utils/arcade/sinkSuds/grime.ts
//
// Sink Suds' grime layer (conductor kr-arcade/t-043): every basin starts under
// a film of grime laid on a grid of small cells, and whatever rolls over a cell
// scrubs it. The bubble's scrubbing feeds it suds; the brushes and sponges
// scrub too, racing it for them. The grid is plain data (tests read it); the
// game draws it as a cached mask that only erases the cells cleaned since the
// last frame.

import { basinBounds, insideBasin, W, H } from './basins'
import type { BasinDef, Point } from './basins'

/** Grime cell size in logical pixels. */
export const CELL = 6
/** A Squeaky Clean basin is at least this percent clean. */
export const SQUEAKY = 95

export class Grime {
  readonly cols = Math.ceil(W / CELL)
  readonly rows = Math.ceil(H / CELL)
  /** Scrub ticks each cell still needs (0 is clean, or outside the basin). */
  readonly hp: Uint8Array
  /** 1 where the cell lies in the water. */
  readonly inside: Uint8Array
  readonly total: number
  clean = 0
  /** Cells cleaned since the renderer last took them. */
  fresh: number[] = []
  /** Cells grimed over again since the renderer last took them. */
  dirtied: number[] = []

  /** `dirt` is how many scrub passes a cell needs (dirtier basins take more). */
  constructor(basin: BasinDef, dirt = 1) {
    this.hp = new Uint8Array(this.cols * this.rows)
    this.inside = new Uint8Array(this.cols * this.rows)
    const { x0, y0, x1, y1 } = basinBounds(basin)
    let total = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * CELL + CELL / 2
        const y = r * CELL + CELL / 2
        if (x < x0 || x > x1 || y < y0 || y > y1) continue
        if (!insideBasin(basin, x, y, 2)) continue
        const i = r * this.cols + c
        this.inside[i] = 1
        this.hp[i] = Math.max(1, Math.min(9, dirt))
        total++
      }
    }
    this.total = Math.max(1, total)
  }

  /** Whole percent clean, 0..100. */
  get percent(): number {
    return Math.floor((this.clean * 100) / this.total)
  }

  /** Fraction clean, 0..1. */
  get fraction(): number {
    return this.clean / this.total
  }

  /** Scrub every cell whose centre is within r of (x, y): returns the cells it finished. */
  scrub(x: number, y: number, r: number): number {
    const c0 = Math.max(0, Math.floor((x - r) / CELL))
    const c1 = Math.min(this.cols - 1, Math.floor((x + r) / CELL))
    const r0 = Math.max(0, Math.floor((y - r) / CELL))
    const r1 = Math.min(this.rows - 1, Math.floor((y + r) / CELL))
    const rr = r * r
    let done = 0
    for (let row = r0; row <= r1; row++) {
      const cy = row * CELL + CELL / 2 - y
      for (let col = c0; col <= c1; col++) {
        const i = row * this.cols + col
        if (!this.hp[i]) continue
        const cx = col * CELL + CELL / 2 - x
        if (cx * cx + cy * cy > rr) continue
        if (--this.hp[i]! === 0) {
          this.clean++
          this.fresh.push(i)
          done++
        }
      }
    }
    return done
  }

  /** Lay grime back on a clean cell near (x, y) (a dirty drip or a smear). Returns success. */
  soil(x: number, y: number, r: number): number {
    const c0 = Math.max(0, Math.floor((x - r) / CELL))
    const c1 = Math.min(this.cols - 1, Math.floor((x + r) / CELL))
    const r0 = Math.max(0, Math.floor((y - r) / CELL))
    const r1 = Math.min(this.rows - 1, Math.floor((y + r) / CELL))
    let made = 0
    for (let row = r0; row <= r1; row++)
      for (let col = c0; col <= c1; col++) {
        const i = row * this.cols + col
        if (!this.inside[i] || this.hp[i]) continue
        const dx = col * CELL + CELL / 2 - x
        const dy = row * CELL + CELL / 2 - y
        if (dx * dx + dy * dy > r * r) continue
        this.hp[i] = 1
        this.clean--
        this.dirtied.push(i)
        made++
      }
    return made
  }

  isDirty(x: number, y: number): boolean {
    const col = Math.floor(x / CELL)
    const row = Math.floor(y / CELL)
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false
    return this.hp[row * this.cols + col]! > 0
  }

  /** The centre of the nearest dirty cell to (x, y), or null when it is all clean. */
  nearestDirty(x: number, y: number, maxRing = 40): Point | null {
    const col = Math.floor(x / CELL)
    const row = Math.floor(y / CELL)
    for (let ring = 0; ring <= maxRing; ring++) {
      let best: Point | null = null
      let bestD = Infinity
      for (let dr = -ring; dr <= ring; dr++) {
        for (let dc = -ring; dc <= ring; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue
          const r = row + dr
          const c = col + dc
          if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) continue
          if (!this.hp[r * this.cols + c]) continue
          const px = c * CELL + CELL / 2
          const py = r * CELL + CELL / 2
          const d = (px - x) ** 2 + (py - y) ** 2
          if (d < bestD) {
            bestD = d
            best = { x: px, y: py }
          }
        }
      }
      if (best) return best
    }
    return null
  }

  /** The cell's top-left corner in logical pixels. */
  cellAt(i: number): Point {
    return { x: (i % this.cols) * CELL, y: Math.floor(i / this.cols) * CELL }
  }
}

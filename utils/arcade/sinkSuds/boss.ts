// /utils/arcade/sinkSuds/boss.ts
//
// What every Sink Suds boss shares (conductor kr-arcade/t-045): the bubble as a boss sees it, the
// game's side of the bargain (BossHost), and the shape of a boss the game can run (SudsBoss).
// Bristleton, Mossback and the Grime King each keep their own phases in their own module.

import type { Point } from './basins'
import type { PestKind, Touch } from './pests'

export type BossBody = {
  x: number
  y: number
  vx: number
  vy: number
  stage: number
  alive: boolean
  invuln: number
}

export type BossSound =
  'warn' | 'boom' | 'pop' | 'blip' | 'level' | 'pickup' | 'extra'

/** What a boss needs from the game. */
export interface BossHost {
  rng(): number
  radiusOf(b: BossBody): number
  /** The boss (or something it threw) touched the bubble. */
  hurt(b: BossBody, from: Point, touch: Touch): void
  /** A blow landed on the boss: the game scores it and knocks the suds out of the bubble. */
  bumped(b: BossBody, at: Point): void
  score(points: number, at: Point): void
  spawn(kind: PestKind, at: Point): void
  /** Where the live (untrapped) pests of a kind are. */
  living(kind: PestKind): Point[]
  dropCrumbs(at: Point, count: number): void
  /** Grime splashed back on the basin. */
  soil(at: Point, r: number): void
  /** Take every live pest of a kind off the board (the Grime King's drops re-forming). */
  clear(kind: PestKind): void
  /** Keep a body of radius r in the basin, bouncing it off the wall; true if it touched. */
  keepIn(
    body: { x: number; y: number; vx?: number; vy?: number },
    r: number,
  ): boolean
  /** The finale's giant bubble, on or off. */
  giant(b: BossBody, on: boolean): void
  sound(name: BossSound): void
  readonly drain: Point
}

export interface SudsBoss {
  readonly name: string
  /** Pips left on the HUD, of maxHp. */
  readonly hp: number
  readonly maxHp: number
  /** A line under the boss bar (what to do now). */
  readonly hint: string
  /** Beaten (it may still be playing its exit). */
  readonly defeated: boolean
  /** Gone: the game moves on. */
  readonly done: boolean
  update(host: BossHost, bubbles: BossBody[]): void
  render(g: CanvasRenderingContext2D, tick: number): void
  /** Points the attract pilot keeps clear of. */
  threats(): Point[]
  /** Where the attract pilot should head now, if the boss has a job for it. */
  goal(b: BossBody, r: number, host: BossHost): Point | null
}

/** Distance from p to the segment ab, and how far along it (0..1). */
export function segDist(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2),
  )
  return { d: Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t), t }
}

export function nearest(from: Point, points: readonly Point[]): Point | null {
  let best: Point | null = null
  let bestD = Infinity
  for (const p of points) {
    const d = Math.hypot(p.x - from.x, p.y - from.y)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

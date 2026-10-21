// /utils/arcade/cableCrawler/tangle.ts
//
// Cable Crawler's Tangle (conductor kr-arcade/t-068): 2-4 cables through the cabinet's `players`
// frames. Team Tangle shares one battery and one score; Tangle Race crowns the most sparks.
// Bodies are walls, and plug against plug is a playful pause, never a knockout. Everything here is
// data and pure arithmetic over cell keys (`y * COLS + x`); the game reads it.

import { COLS, ROWS } from './mazes'

export type TangleKind = 'team' | 'race'

export const TANGLE_KINDS: readonly TangleKind[] = ['team', 'race']

export const TANGLE_NAMES: Record<TangleKind, string> = {
  team: 'TEAM TANGLE',
  race: 'TANGLE RACE',
}

export const TANGLE_BLURBS: Record<TangleKind, string> = {
  team: 'ONE BATTERY, ONE SCORE',
  race: 'MOST SPARKS WINS',
}

export const TANGLE_MIN = 2
export const TANGLE_MAX = 4

/** Ticks two plugs stay frozen after meeting nose to nose. */
export const BUMP_PAUSE = 24

/** Seated players clamped to what a Tangle can hold. */
export function tangleSeats(players: number): number {
  if (!Number.isFinite(players)) return TANGLE_MIN
  return Math.min(TANGLE_MAX, Math.max(TANGLE_MIN, Math.floor(players)))
}

const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

/**
 * Where each of `seats` plugs starts: the maze's own start first, then the open cells farthest
 * apart from the ones already seated (walking distance), ties broken by the lower cell key.
 */
export function tangleSpawns(
  walls: readonly boolean[],
  start: number,
  seats: number,
): number[] {
  const n = tangleSeats(seats)
  const chosen = [start]
  const dist = new Array<number>(COLS * ROWS).fill(Infinity)
  const flood = (from: number) => {
    const queue = [from]
    const d = new Map<number, number>([[from, 0]])
    for (let i = 0; i < queue.length; i++) {
      const k = queue[i]!
      const x = k % COLS
      const y = Math.floor(k / COLS)
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue
        const nk = ny * COLS + nx
        if (walls[nk] || d.has(nk)) continue
        d.set(nk, d.get(k)! + 1)
        queue.push(nk)
      }
    }
    for (const [k, steps] of d) dist[k] = Math.min(dist[k]!, steps)
    return d
  }
  const reach = flood(start)
  while (chosen.length < n) {
    let best = -1
    let bestDist = -1
    for (const k of [...reach.keys()].sort((a, b) => a - b)) {
      if (chosen.includes(k)) continue
      const far = dist[k]!
      if (far > bestDist) {
        bestDist = far
        best = k
      }
    }
    if (best < 0) break
    chosen.push(best)
    flood(best)
  }
  return chosen
}

export type Bump = 'move' | 'blocked' | 'bump'

/**
 * One tick of plug-meets-plug and plug-meets-body. `heads[i]` is plug i's cell now, `next[i]` the
 * cell it wants (or -1 if it is paused or has no cable), and `bodies[i]` every cell of cable i
 * including its plug. A cell inside another cable, or a wall, blocks; two plugs wanting one cell,
 * or swapping cells, bump and both stay put. Nobody is ever knocked out.
 */
export function resolveTangle(
  walls: readonly boolean[],
  heads: readonly number[],
  next: readonly number[],
  bodies: ReadonlyArray<ReadonlySet<number>>,
): Bump[] {
  return heads.map((_, i) => {
    const to = next[i]!
    if (to < 0) return 'blocked'
    if (walls[to]) return 'blocked'
    for (let j = 0; j < heads.length; j++) {
      if (j === i) continue
      const other = next[j]!
      if (other === to) return 'bump'
      if (other === heads[i] && to === heads[j]) return 'bump'
      if (bodies[j]!.has(to)) return 'blocked'
    }
    return 'move'
  })
}

/** Race: the indexes of the plugs holding the most sparks (several on a tie, none if no one ate). */
export function raceWinners(sparks: readonly number[]): number[] {
  const top = Math.max(0, ...sparks)
  if (top === 0) return []
  return sparks.flatMap((s, i) => (s === top ? [i] : []))
}

/** Race's banner for the winners of a finished maze. */
export function raceBanner(sparks: readonly number[]): string {
  const win = raceWinners(sparks)
  if (win.length === 0) return 'NO SPARKS EATEN'
  if (win.length > 1) return `TIE  ${win.map((i) => `P${i + 1}`).join(' ')}`
  return `P${win[0]! + 1} WINS  ${sparks[win[0]!]} SPARKS`
}

/** Team: a shared battery's charge after one plug eats, capped at the battery's size. */
export function teamCharge(charge: number, gain: number, max: number): number {
  return Math.min(max, Math.max(0, charge + gain))
}

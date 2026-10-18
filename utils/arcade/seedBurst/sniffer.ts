// /utils/arcade/seedBurst/sniffer.ts
//
// Seed Burst's sniffer gnat (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24, slice 1):
// the first grump that follows a gardener instead of wandering. At each junction it mostly steps
// toward the nearest gardener on the board. Pure functions; the cabinet owns the state and drawing.

export type Step = { dx: number; dy: number }
export type Tile = { x: number; y: number }

/** Share of junctions where a sniffer follows the scent rather than wandering. */
export const SNIFF_CHANCE = 0.6
/** Sniffers wait for round 2 and never outnumber this. */
export const SNIFFER_FIRST_ROUND = 2
export const SNIFFER_MAX = 3
export const SNIFFER_SPEED_SCALE = 0.9

/** How many of a round's gnats are sniffers: one from round 2, a second from 5, a third from 8. */
export function snifferCount(round: number, gnats: number): number {
  if (round < SNIFFER_FIRST_ROUND) return 0
  const wanted = 1 + Math.floor((round - SNIFFER_FIRST_ROUND) / 3)
  return Math.max(0, Math.min(SNIFFER_MAX, wanted, gnats - 1))
}

export function tileDistance(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/** The gardener tile closest to the gnat, or null when nobody is in play. */
export function nearestScent(from: Tile, gardeners: Tile[]): Tile | null {
  let best: Tile | null = null
  for (const g of gardeners)
    if (!best || tileDistance(from, g) < tileDistance(from, best)) best = g
  return best
}

/**
 * Pick the sniffer's next step from the open ones. `roll` is a 0..1 random number: below
 * SNIFF_CHANCE it takes the option that closes the most distance (ties keep the option order),
 * otherwise it returns null so the caller wanders as an ordinary gnat does.
 */
export function sniffStep(
  from: Tile,
  options: Step[],
  gardeners: Tile[],
  roll: number,
): Step | null {
  if (roll >= SNIFF_CHANCE || options.length === 0) return null
  const scent = nearestScent(from, gardeners)
  if (!scent) return null
  let best = options[0]!
  let bestDistance = Infinity
  for (const o of options) {
    const d = tileDistance({ x: from.x + o.dx, y: from.y + o.dy }, scent)
    if (d < bestDistance) {
      best = o
      bestDistance = d
    }
  }
  return best
}

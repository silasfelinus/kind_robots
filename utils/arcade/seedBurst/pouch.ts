// /utils/arcade/seedBurst/pouch.ts
//
// Seed Burst's Seed Pouch (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24, slice 1).
// Every gardener carries a pouch of seed varieties, swapped with B, and each one bursts in its own
// shape. Pure functions: the cabinet owns the board and asks here which tiles a pod blooms over.
//
//   Sunflower  the classic cross: each arm clears the first hedge it meets.
//   Clover     a diagonal X: low clover pollen hops over stone pillars (never the garden wall).
//   Dandelion  one long line of fluff downwind, floating over hedges (and the grumps inside them)
//              without clearing them.
//   Pumpkin    a squash of the eight tiles around it; walk into one and it rolls.
//   Bramble    plants a line of up to four pods ahead of the gardener; each bursts as a cross.
//   Puffcap    bursts as a cross when its gardener presses A again.

export type Variety =
  'sunflower' | 'clover' | 'dandelion' | 'pumpkin' | 'bramble' | 'puffcap'

export const VARIETIES: readonly Variety[] = [
  'sunflower',
  'clover',
  'dandelion',
  'pumpkin',
  'bramble',
  'puffcap',
]

export const VARIETY_INFO: Record<Variety, { name: string; hint: string }> = {
  sunflower: { name: 'SUNFLOWER', hint: 'BURSTS IN A +' },
  clover: { name: 'CLOVER', hint: 'BURSTS IN AN X' },
  dandelion: { name: 'DANDELION', hint: 'FLUFF FLOATS OVER HEDGES' },
  pumpkin: { name: 'PUMPKIN', hint: 'WALK INTO IT TO ROLL IT' },
  bramble: { name: 'BRAMBLE', hint: 'PLANTS A LINE OF PODS' },
  puffcap: { name: 'PUFFCAP', hint: 'PRESS A AGAIN TO BURST' },
}

/** The most pods one Bramble planting lays. */
export const BRAMBLE_LINE = 4
/** Dandelion fluff carries this many tiles further than the gardener's bloom reach. */
export const DANDELION_EXTRA = 2

export type Step = { dx: number; dy: number }

/** What the pouch needs to know about a tile. */
export type TileLook = {
  kind: 'stone' | 'hedge' | 'open'
  /** The garden's outer wall (stone that even clover cannot hop). */
  border: boolean
  /** A pod waiting on the tile: a bloom that reaches it sets it off. */
  pod: boolean
}

/**
 * One tile a burst blooms over. `open` blooms; `hedge` clears the hedge and blooms; `pod` blooms
 * and sets off the pod there; `over` is fluff above a hedge: grumps inside are caught, the hedge
 * stays.
 */
export type BurstTile = {
  x: number
  y: number
  hit: 'open' | 'hedge' | 'pod' | 'over'
}

const CROSS: readonly Step[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]
const DIAGONALS: readonly Step[] = [
  { dx: 1, dy: -1 },
  { dx: 1, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
]

function ray(
  out: BurstTile[],
  x: number,
  y: number,
  d: Step,
  reach: number,
  look: (x: number, y: number) => TileLook,
  mode: 'cross' | 'clover' | 'fluff',
) {
  for (let r = 1; r <= reach; r++) {
    const tx = x + d.dx * r
    const ty = y + d.dy * r
    const t = look(tx, ty)
    if (t.kind === 'stone') {
      if (mode === 'clover' && !t.border) continue
      break
    }
    if (t.kind === 'hedge') {
      if (mode === 'fluff') {
        out.push({ x: tx, y: ty, hit: 'over' })
        continue
      }
      out.push({ x: tx, y: ty, hit: 'hedge' })
      break
    }
    out.push({ x: tx, y: ty, hit: t.pod ? 'pod' : 'open' })
    if (t.pod && mode !== 'fluff') break
  }
}

/**
 * The tiles a pod of `variety` at (x, y) blooms over, its own tile first. `dir` is the way a
 * Dandelion's fluff drifts; `reach` is the planting gardener's bloom reach, or a reach per
 * direction (a watering can's soaked row doubles it along the row).
 */
export function burstTiles(
  variety: Variety,
  x: number,
  y: number,
  dir: Step,
  reach: number | ((d: Step) => number),
  look: (x: number, y: number) => TileLook,
): BurstTile[] {
  const out: BurstTile[] = [{ x, y, hit: 'open' }]
  const along = (d: Step) => (typeof reach === 'number' ? reach : reach(d))
  if (variety === 'clover')
    for (const d of DIAGONALS) ray(out, x, y, d, along(d), look, 'clover')
  else if (variety === 'dandelion')
    ray(out, x, y, dir, along(dir) + DANDELION_EXTRA, look, 'fluff')
  else if (variety === 'pumpkin') {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const t = look(x + dx, y + dy)
        if (t.kind === 'stone') continue
        out.push({
          x: x + dx,
          y: y + dy,
          hit: t.kind === 'hedge' ? 'hedge' : t.pod ? 'pod' : 'open',
        })
      }
  } else for (const d of CROSS) ray(out, x, y, d, along(d), look, 'cross')
  return out
}

/**
 * The tiles a Bramble planting at (x, y) facing `dir` lays pods on: its own tile, then on ahead
 * while the way is clear, up to `free` pods (the gardener's spare pods) and BRAMBLE_LINE.
 */
export function brambleLine(
  x: number,
  y: number,
  dir: Step,
  free: number,
  clear: (x: number, y: number) => boolean,
): { x: number; y: number }[] {
  const out = [{ x, y }]
  const most = Math.min(BRAMBLE_LINE, free)
  for (let i = 1; out.length < most; i++) {
    const tx = x + dir.dx * i
    const ty = y + dir.dy * i
    if (!clear(tx, ty)) break
    out.push({ x: tx, y: ty })
  }
  return out
}

/** The next variety in a pouch after `current` (B swaps). */
export function nextSeed(pouch: readonly Variety[], current: number): number {
  return pouch.length ? (current + 1) % pouch.length : 0
}

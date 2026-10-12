// /utils/arcade/ribbonRiders/grid.ts
//
// Ribbon Riders' playfield (conductor kr-arcade m8, The Lantern Festival Circuit): a 48 x 48 grid
// of 6 px cells under a 24 px HUD, the four headings, and the terrain codes an arena is built from.

export const CELL = 6
export const GRID = 48
export const ARENA_Y = 24
export const W = CELL * GRID
export const H = ARENA_Y + CELL * GRID

export type Dir = 0 | 1 | 2 | 3
/** Up, right, down, left. */
export const DX = [0, 1, 0, -1] as const
export const DY = [-1, 0, 1, 0] as const

export function turnLeft(d: Dir): Dir {
  return ((d + 3) % 4) as Dir
}
export function turnRight(d: Dir): Dir {
  return ((d + 1) % 4) as Dir
}
export function reverse(d: Dir): Dir {
  return ((d + 2) % 4) as Dir
}

export function idx(x: number, y: number): number {
  return y * GRID + x
}

/** What the floor of a cell is (ribbons are kept apart, in the owner grid). */
export const T = {
  FLOOR: 0,
  /** A lamp post, a carousel horse, a booth: solid for good. */
  PILLAR: 1,
  /** A gate: solid while shut, open floor while open (the beat decides). */
  GATE: 2,
  /** A turn pad: entering it turns a bike to the pad's heading (PAD + dir). */
  PAD: 3,
  /** Ice: a turn queued on ice takes one extra cell. */
  ICE: 7,
  /** A snowbank: solid until a ribbon brushes it, then it melts. */
  SNOW: 8,
  /** A conveyor lane: shifts a bike a cell sideways every few cells (CONVEYOR + dir). */
  CONVEYOR: 9,
  /** A bell pad: every ribbon flares while it rings. */
  BELL: 13,
  /** A portal swirl: entering one comes out of its partner. */
  PORTAL: 14,
} as const

export function isPad(t: number): boolean {
  return t >= T.PAD && t < T.PAD + 4
}
export function isConveyor(t: number): boolean {
  return t >= T.CONVEYOR && t < T.CONVEYOR + 4
}

/** A heading mirrored across the arena's horizontal centre line (up and down swap). */
export function mirrorY(d: Dir): Dir {
  return d === 0 ? 2 : d === 2 ? 0 : d
}

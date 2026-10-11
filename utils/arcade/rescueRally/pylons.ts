// /utils/arcade/rescueRally/pylons.ts
//
// Rescue Rally's pylon shapes (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "pylons in
// shapes (hearts, stars, the letters K-I-N-D)"). A pylon is a static neon post: touching one bonks
// the hero, a beam pops it for small points. Wave scripts lay them out as whole shapes, drawn here as
// little grids where every X is a post, so a wave's pylon garden reads as one picture.

import type { Point } from './arena'

export type PylonShape =
  | 'heart'
  | 'star'
  | 'diamond'
  | 'ring'
  | 'k'
  | 'i'
  | 'n'
  | 'd'
  | 'row'
  | 'column'

/** Posts sit this far apart, too close for the hero to slip between two neighbours. */
export const PYLON_SPACING = 14

export const PYLON_SHAPES: Record<PylonShape, readonly string[]> = {
  heart: ['.XX.XX.', 'X..X..X', 'X.....X', '.X...X.', '..X.X..', '...X...'],
  star: [
    '...X...',
    '...X...',
    '..X.X..',
    'XX...XX',
    '..X.X..',
    '...X...',
    '...X...',
  ],
  diamond: [
    '...X...',
    '..X.X..',
    '.X...X.',
    'X.....X',
    '.X...X.',
    '..X.X..',
    '...X...',
  ],
  ring: [
    '..XXX..',
    '.X...X.',
    'X.....X',
    'X.....X',
    'X.....X',
    '.X...X.',
    '..XXX..',
  ],
  k: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
  i: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'],
  n: ['X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X'],
  d: ['XXX..', 'X..X.', 'X...X', 'X...X', 'X...X', 'X..X.', 'XXX..'],
  row: ['XXXXXXX'],
  column: ['X', 'X', 'X', 'X', 'X', 'X', 'X'],
}

/** Where a wave puts a shape: its centre, and an optional spacing (letters pack a little tighter). */
export type PylonPlacement = {
  shape: PylonShape
  x: number
  y: number
  spacing?: number
}

/** Every post of a placed shape, centred on its spot. */
export function pylonSpots(place: PylonPlacement): Point[] {
  const rows = PYLON_SHAPES[place.shape]
  const step = place.spacing ?? PYLON_SPACING
  const cols = Math.max(...rows.map((r) => r.length))
  const spots: Point[] = []
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== 'X') continue
      spots.push({
        x: place.x + (i - (cols - 1) / 2) * step,
        y: place.y + (j - (rows.length - 1) / 2) * step,
      })
    }
  })
  return spots
}

/** The four letters across a row, centred on (x, y). */
export function kindWord(x: number, y: number, spacing = 12): PylonPlacement[] {
  const letters: PylonShape[] = ['k', 'i', 'n', 'd']
  const widths = letters.map(
    (l) => Math.max(...PYLON_SHAPES[l].map((r) => r.length)) * spacing,
  )
  const gap = spacing * 2
  const total = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)
  let left = x - (total - spacing) / 2
  return letters.map((shape, n) => {
    const w = widths[n]!
    const place = { shape, x: left + w / 2 - spacing / 2, y, spacing }
    left += w + gap
    return place
  })
}

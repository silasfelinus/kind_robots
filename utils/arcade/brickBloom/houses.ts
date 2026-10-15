// /utils/arcade/brickBloom/houses.ts
//
// Brick Bloom's first two glasshouses as authored data (conductor kr-arcade/t-079, depth-pass
// CABINETS.md section 11, slice 2): Seedling House and Vine Hall, nine walls each, joined by a
// branching vent map. Clear a wall and pick the left or right vent to choose the next one; every
// path through a house meets the house's boss. The root, vine and trellis crates live here.

import { LEGEND, ROWS, parseWall, wallProblems } from './walls'
import type { CrateKind, Wall } from './walls'

/** The glasshouse legend: the classic characters plus root, vine and trellis crates. */
export const HOUSE_LEGEND: Readonly<Record<string, CrateKind>> = {
  ...LEGEND,
  r: 'root',
  v: 'vine',
  t: 'trellis',
}

/** What the new crates do, for the cabinet to read: hits to crack, and the quirk. */
export const HOUSE_CRATES = {
  root: { hits: 2, note: 'Tough: two cracks to clear' },
  vine: {
    hits: 1,
    note: 'Cracks in one; a cracked vine pulls its neighbours down a row',
  },
  trellis: {
    hits: 1,
    note: 'Only breaks from below; the ball skips off its top',
  },
} as const

export type VentWall = Wall & { vents: readonly [string, string] | 'boss' }
export type House = {
  id: string
  name: string
  boss: { id: string; name: string }
  start: string
  walls: readonly VentWall[]
}

const EMPTY = '............'

function vw(
  id: string,
  name: string,
  rows: string[],
  vents: readonly [string, string] | 'boss',
): VentWall {
  const padded = [...rows]
  while (padded.length < ROWS) padded.push(EMPTY)
  return { id, name, rows: padded, vents }
}

export const SEEDLING_HOUSE: House = {
  id: 'seedling',
  name: 'Seedling House',
  boss: { id: 'mister-mulch', name: 'Mister Mulch' },
  start: 'seed-1',
  walls: [
    vw(
      'seed-1',
      'Potting Shelf',
      [EMPTY, '############', '#s########s#', '############', '..r......r..'],
      ['seed-2a', 'seed-2b'],
    ),
    vw(
      'seed-2a',
      'Root Cellar',
      [EMPTY, 'rr##rr##rr##', '############', '##rr##rr##rr', '############'],
      ['seed-3a', 'seed-3b'],
    ),
    vw(
      'seed-2b',
      'Sunny Sill',
      [
        '.##.##.##.##',
        '############',
        '.s........s.',
        '############',
        '.##.##.##.##',
      ],
      ['seed-3a', 'seed-3b'],
    ),
    vw(
      'seed-3a',
      'Watering Can',
      [
        '....####....',
        '...######...',
        '..##rrrr##..',
        '..########..',
        '...##ss##...',
        '....####....',
      ],
      ['seed-4a', 'seed-4b'],
    ),
    vw(
      'seed-3b',
      'Trowel Row',
      [
        'tttttttttttt',
        '############',
        'r##########r',
        '############',
        '.s........s.',
      ],
      ['seed-4a', 'seed-4b'],
    ),
    vw(
      'seed-4a',
      'Cold Frame',
      [
        'tt########tt',
        '#r########r#',
        '############',
        '#p########p#',
        '############',
        'tt........tt',
      ],
      ['seed-5a', 'seed-5b'],
    ),
    vw(
      'seed-4b',
      'Sprout Stairs',
      [
        '..........##',
        '........####',
        '......##rr##',
        '....##rrrr##',
        '..##rrrrrr##',
        '############',
      ],
      ['seed-5a', 'seed-5b'],
    ),
    vw(
      'seed-5a',
      'Hanging Baskets',
      ['#.#.#.#.#.#.', 'tttttttttttt', '.#.#.#.#.#.#', '#.#.s.s.#.#.'],
      'boss',
    ),
    vw(
      'seed-5b',
      'Seed Tray',
      [
        '############',
        '#rr#rr#rr#rr',
        '############',
        '#h########h#',
        '############',
        'rrrrrrrrrrrr',
      ],
      'boss',
    ),
  ],
}

export const VINE_HALL: House = {
  id: 'vine-hall',
  name: 'Vine Hall',
  boss: { id: 'tangle-rose', name: 'The Tangle Rose' },
  start: 'vine-1',
  walls: [
    vw(
      'vine-1',
      'Creeper Gate',
      [
        'v.v.v.v.v.v.',
        'vvvvvvvvvvvv',
        '.v.v.v.v.v.v',
        'vvvvvvvvvvvv',
        '..s......s..',
      ],
      ['vine-2a', 'vine-2b'],
    ),
    vw(
      'vine-2a',
      'Trellis Arch',
      ['..tttttttt..', '.t########t.', 't##vvvvvv##t', 't##########t'],
      ['vine-3a', 'vine-3b'],
    ),
    vw(
      'vine-2b',
      'Tangle Column',
      [
        'vv........vv',
        'vv########vv',
        'vv#rrrrrr#vv',
        'vv########vv',
        'vv........vv',
      ],
      ['vine-3a', 'vine-3b'],
    ),
    vw(
      'vine-3a',
      'Ladder Wall',
      [
        'v##########v',
        't##########t',
        'v##########v',
        't####ss####t',
        'v##########v',
        't##########t',
      ],
      ['vine-4a', 'vine-4b'],
    ),
    vw(
      'vine-3b',
      'Hanging Garden',
      ['rrrrrrrrrrrr', '.v.v.v.v.v.v', 'v.v.v.v.v.v.', '.pp......pp.'],
      ['vine-4a', 'vine-4b'],
    ),
    vw(
      'vine-4a',
      'Strangle Knot',
      [
        'vvvv....vvvv',
        'v##v.hh.v##v',
        'v#rv.hh.vr#v',
        'v##v.hh.v##v',
        'vvvv....vvvv',
      ],
      ['vine-5a', 'vine-5b'],
    ),
    vw(
      'vine-4b',
      'Rose Window',
      [
        '....tttt....',
        '..tt####tt..',
        '.t##rrrr##t.',
        't###ssss###t',
        '.t##rrrr##t.',
        '..tt####tt..',
        '....tttt....',
      ],
      ['vine-5a', 'vine-5b'],
    ),
    vw(
      'vine-5a',
      'Thorn Gauntlet',
      ['=v=v=v=v=v=v', '############', 'v=v=v=v=v=v=', 'rrrrrrrrrrrr'],
      'boss',
    ),
    vw(
      'vine-5b',
      'Wild Hedge',
      [
        '############',
        'vrvrvrvrvrvr',
        'rvrvrvrvrvrv',
        'tt..ssss..tt',
        'tttttttttttt',
      ],
      'boss',
    ),
  ],
}

export const HOUSES: readonly House[] = [SEEDLING_HOUSE, VINE_HALL]

export function houseWall(house: House, id: string): VentWall | undefined {
  return house.walls.find((w) => w.id === id)
}

/** Soundness: sound walls, vents that resolve, every wall reachable, a vent that reaches the boss. */
export function houseProblems(h: House): string[] {
  const problems: string[] = []
  if (h.walls.length !== 9) problems.push(`${h.id}: ${h.walls.length} walls`)
  for (const w of h.walls) problems.push(...wallProblems(w, HOUSE_LEGEND))
  if (!houseWall(h, h.start)) return [...problems, `${h.id}: no start wall`]
  const seen = new Set<string>()
  const stack = [h.start]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    const w = houseWall(h, id)
    if (!w) {
      problems.push(`${h.id}: vent leads to missing wall ${id}`)
      continue
    }
    if (w.vents !== 'boss') {
      if (w.vents[0] === w.vents[1])
        problems.push(`${id}: both vents lead to ${w.vents[0]}`)
      stack.push(...w.vents)
    }
  }
  for (const w of h.walls)
    if (!seen.has(w.id)) problems.push(`${h.id}: ${w.id} is unreachable`)
  if (!h.walls.some((w) => w.vents === 'boss'))
    problems.push(`${h.id}: no vent reaches the boss`)
  return problems
}

/** Where the Grand Tour stands: which house, and which wall of it. */
export type TourPos = { house: number; wall: string }

export const TOUR_START: TourPos = { house: 0, wall: SEEDLING_HOUSE.start }

/** The left half of the screen takes the left vent, the right half the right one. */
export function ventSide(x: number, width: number): 0 | 1 {
  return x < width / 2 ? 0 : 1
}

/**
 * The wall after a clear: a vent wall leads to the vent the last crate's side picked; a house's
 * final wall leads to the next house's first wall; past the last house the tour is over (null).
 */
export function nextTourPos(pos: TourPos, side: 0 | 1): TourPos | null {
  const house = HOUSES[pos.house]
  const w = house && houseWall(house, pos.wall)
  if (!house || !w) return null
  if (w.vents !== 'boss') return { house: pos.house, wall: w.vents[side] }
  const next = HOUSES[pos.house + 1]
  return next ? { house: pos.house + 1, wall: next.start } : null
}

/** The crate kinds a house's walls use. */
export function houseKinds(h: House): Set<CrateKind> {
  const kinds = new Set<CrateKind>()
  for (const w of h.walls)
    for (const c of parseWall(w, HOUSE_LEGEND)) kinds.add(c.kind)
  return kinds
}

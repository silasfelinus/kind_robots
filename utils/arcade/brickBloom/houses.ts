// /utils/arcade/brickBloom/houses.ts
//
// Brick Bloom's first two glasshouses as authored data (conductor kr-arcade/t-079, depth-pass
// CABINETS.md section 11, slice 2): Seedling House and Vine Hall, nine walls each, joined by a
// branching vent map. Clear a wall and pick the left or right vent to choose the next one; every
// path through a house meets the house's boss. The root, vine and trellis crates live here.
//
// Slice 3 (conductor kr-arcade/t-080) adds glasshouses 3 and 4: the Cactus Dome (noon, prickle
// and sand-timer crates) and the Lily Pond House (lily pads drifting on the water that fills the
// lower wall, bubble crates). Rows with lily pads hold nothing else, so a row drifts as one.

import { LEGEND, ROWS, parseWall, wallProblems } from './walls'
import type { CrateKind, Wall } from './walls'

/** The glasshouse legend: the classic characters plus the houses' own crates. */
export const HOUSE_LEGEND: Readonly<Record<string, CrateKind>> = {
  ...LEGEND,
  r: 'root',
  v: 'vine',
  t: 'trellis',
  k: 'prickle',
  z: 'sand',
  l: 'lily',
  b: 'bubble',
  a: 'lantern',
  g: 'glow',
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
  prickle: { hits: 1, note: 'Pricks the ball: every ball speeds up' },
  sand: {
    hits: 1,
    note: 'Unbreakable while its sand runs; cracks while flipped',
  },
  lily: { hits: 1, note: 'Drifts on the pond current with its row' },
  bubble: { hits: 1, note: 'Pops into a bouncy bumper for a few seconds' },
  lantern: { hits: 1, note: 'Lights nearby crates while intact' },
  glow: { hits: 1, note: 'Lights its row for four seconds when cracked' },
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

export const CACTUS_DOME: House = {
  id: 'cactus-dome',
  name: 'Cactus Dome',
  boss: { id: 'sunny-saguaro', name: 'Sunny Saguaro' },
  start: 'cactus-1',
  walls: [
    vw(
      'cactus-1',
      'Sunny Doorway',
      [
        EMPTY,
        '..kk####kk..',
        '.##########.',
        '.#pp#zz#pp#.',
        '.##########.',
        '..##....##..',
      ],
      ['cactus-2a', 'cactus-2b'],
    ),
    vw(
      'cactus-2a',
      'Sand Steps',
      ['############', '##zz####zz##', '.##########.', '...######...'],
      ['cactus-3a', 'cactus-3b'],
    ),
    vw(
      'cactus-2b',
      'Prickle Patch',
      [
        'k.k.k.k.k.k.',
        '.##########.',
        '#k##p##p##k#',
        '.##########.',
        '..s......s..',
      ],
      ['cactus-3a', 'cactus-3b'],
    ),
    vw(
      'cactus-3a',
      'Hourglass',
      [
        '############',
        '.##########.',
        '..##zzzz##..',
        '...######...',
        '..##zzzz##..',
        '.##########.',
        '############',
      ],
      ['cactus-4a', 'cactus-4b'],
    ),
    vw(
      'cactus-3b',
      'Barrel Row',
      [
        'pp########pp',
        '############',
        '#kk#kk#kk#kk',
        '############',
        '..ss....ss..',
      ],
      ['cactus-4a', 'cactus-4b'],
    ),
    vw(
      'cactus-4a',
      'Dune Ridge',
      [
        '.....##.....',
        '....####....',
        '...##zz##...',
        '..###pp###..',
        '.####kk####.',
        '############',
      ],
      ['cactus-5a', 'cactus-5b'],
    ),
    vw(
      'cactus-4b',
      'Mirage Wall',
      [
        '##########k#',
        '#zz#zz#zz#=#',
        '############',
        '#p###kk###p#',
        '############',
        '.s........s.',
      ],
      ['cactus-5a', 'cactus-5b'],
    ),
    vw(
      'cactus-5a',
      'Cactus Garden',
      [
        '#.k.#.k.#.k.',
        '############',
        'z##z##z##z##',
        '############',
        'pp.pp..pp.pp',
      ],
      'boss',
    ),
    vw(
      'cactus-5b',
      'High Noon',
      [
        'kkkkkkkkkkkk',
        '############',
        '#zzzz##zzzz#',
        '############',
        '###pp##pp###',
        '############',
      ],
      'boss',
    ),
  ],
}

export const LILY_POND: House = {
  id: 'lily-pond',
  name: 'Lily Pond House',
  boss: { id: 'queen-koi', name: 'Queen Koi' },
  start: 'lily-1',
  walls: [
    vw(
      'lily-1',
      'Pond Edge',
      [
        EMPTY,
        '.##########.',
        '.#b######b#.',
        '.##########.',
        EMPTY,
        EMPTY,
        '.ll..ll..ll.',
      ],
      ['lily-2a', 'lily-2b'],
    ),
    vw(
      'lily-2a',
      'Reed Bank',
      [
        '############',
        '#b########b#',
        '############',
        EMPTY,
        EMPTY,
        EMPTY,
        'llll....llll',
      ],
      ['lily-3a', 'lily-3b'],
    ),
    vw(
      'lily-2b',
      'Bubble Run',
      [
        '.b.b.b.b.b.b',
        '############',
        '#s##b##b##s#',
        '############',
        EMPTY,
        EMPTY,
        '.lll....lll.',
      ],
      ['lily-3a', 'lily-3b'],
    ),
    vw(
      'lily-3a',
      'Stepping Stones',
      [
        '##..##..##..',
        '..##..##..##',
        '##..##..##..',
        '..##bb##..##',
        EMPTY,
        EMPTY,
        'll..ll..ll..',
        '...ll...ll..',
      ],
      ['lily-4a', 'lily-4b'],
    ),
    vw(
      'lily-3b',
      'Lotus Ring',
      [
        '....####....',
        '..##bbbb##..',
        '.##s####s##.',
        '..##bbbb##..',
        '....####....',
        EMPTY,
        '.llllllllll.',
      ],
      ['lily-4a', 'lily-4b'],
    ),
    vw(
      'lily-4a',
      'Rain Barrel',
      [
        '############',
        '#pp######pp#',
        '############',
        '#b#b#b#b#b#b',
        EMPTY,
        EMPTY,
        'lll......lll',
        '...lll..lll.',
      ],
      ['lily-5a', 'lily-5b'],
    ),
    vw(
      'lily-4b',
      'Willow Shade',
      [
        '#b########b#',
        '############',
        '.##########.',
        '..###ss###..',
        EMPTY,
        EMPTY,
        '.ll.ll.ll.ll',
      ],
      ['lily-5a', 'lily-5b'],
    ),
    vw(
      'lily-5a',
      'Frog Chorus',
      [
        'bbbbbbbbbbbb',
        '############',
        '#s########s#',
        '############',
        EMPTY,
        EMPTY,
        'llll....llll',
        '....llll....',
      ],
      'boss',
    ),
    vw(
      'lily-5b',
      'Moon Pool',
      [
        '.##########.',
        '#bb######bb#',
        '#b#pp##pp#b#',
        '#bb######bb#',
        '.##########.',
        EMPTY,
        '..llllllll..',
      ],
      'boss',
    ),
  ],
}

export const NIGHT_BLOOM: House = {
  id: 'night-bloom',
  name: 'Night Bloom House',
  boss: { id: 'gloom-bloom', name: 'The Gloom Bloom' },
  start: 'night-1',
  walls: [
    vw(
      'night-1',
      'Lantern Walk',
      ['a##########a', '.g##....##g.', '############', '..a......a..'],
      ['night-2a', 'night-2b'],
    ),
    vw(
      'night-2a',
      'Firefly Steps',
      [
        '##a.........',
        '####g.......',
        '######a.....',
        '########g...',
        '##########a.',
      ],
      ['night-3a', 'night-3b'],
    ),
    vw(
      'night-2b',
      'Midnight Arcade',
      ['a..####..a..', '##g####g####', '.##....##...', 'a###..###..a'],
      ['night-3a', 'night-3b'],
    ),
    vw(
      'night-3a',
      'Moth Window',
      ['a#.#.#.#.#.a', '.g#.#.#.#g#.', 'a#.#.#.#.#.a', '.#.#.#.#.#.#'],
      ['night-4a', 'night-4b'],
    ),
    vw(
      'night-3b',
      'Starlit Canopy',
      [
        '...aaaaaa...',
        '..########..',
        '.#g######g#.',
        '##p######p##',
        '..########..',
      ],
      ['night-4a', 'night-4b'],
    ),
    vw(
      'night-4a',
      'Twilight Bridge',
      ['a##..##..##a', '.gg######gg.', '##h######h##', 'a##......##a'],
      ['night-5a', 'night-5b'],
    ),
    vw(
      'night-4b',
      'Moon Seed Vault',
      ['a##########a', '.##gggggg##.', '###p####p###', '..a######a..'],
      ['night-5a', 'night-5b'],
    ),
    vw(
      'night-5a',
      'Gloaming Bells',
      ['a###....###a', '##g##..##g##', '############', '...a####a...'],
      'boss',
    ),
    vw(
      'night-5b',
      'Last Light',
      [
        'a##g####g##a',
        '############',
        '##p######p##',
        '..a##gg##a..',
        '############',
      ],
      'boss',
    ),
  ],
}

export const HOUSES: readonly House[] = [
  SEEDLING_HOUSE,
  VINE_HALL,
  CACTUS_DOME,
  LILY_POND,
  NIGHT_BLOOM,
]

/** The secret house uses its own index without changing the five-house legacy tour. */
export const CONSERVATORY_INDEX = HOUSES.length
export const CONSERVATORY: House = {
  id: 'moonflower',
  name: 'Moonflower Conservatory',
  boss: { id: 'thorn', name: 'Thorn' },
  start: 'moon-1',
  walls: [
    vw(
      'moon-1',
      'Silver Seed Gate',
      ['a#s######s#a', '.g##....##g.', 'rr##vvvv##rr', '...pp##pp...'],
      ['moon-2a', 'moon-2b'],
    ),
    vw(
      'moon-2a',
      'Reversed Roots',
      ['..r######r..', '..vv####vv..', '##t######t##', '...s####s...'],
      ['moon-3a', 'moon-3b'],
    ),
    vw(
      'moon-2b',
      'Prickle Moon',
      ['z#k######k#z', '#p########p#', '..a######a..', '....gggg....'],
      ['moon-3a', 'moon-3b'],
    ),
    vw(
      'moon-3a',
      'Mirror Pool',
      ['b##g####g##b', '############', EMPTY, '..llllllll..', 'llll....llll'],
      ['moon-4a', 'moon-4b'],
    ),
    vw(
      'moon-3b',
      'Lantern Orchard',
      ['a..######..a', '.g#h####h#g.', '####pppp####', 'a##......##a'],
      ['moon-4a', 'moon-4b'],
    ),
    vw(
      'moon-4a',
      'Moonlit Trellis',
      ['tttt....tttt', '#s########s#', '##r##vv##r##', '####pppp####'],
      ['moon-5a', 'moon-5b'],
    ),
    vw(
      'moon-4b',
      'Celestial Seeds',
      ['z#k##ss##k#z', '#g########g#', 'a##pp##pp##a', '..bbbbbbbb..'],
      ['moon-5a', 'moon-5b'],
    ),
    vw(
      'moon-5a',
      'Thorn Gate',
      ['a##g####g##a', '##r######r##', '##p######p##', '....ssss....'],
      'boss',
    ),
    vw(
      'moon-5b',
      'Full Moon',
      [
        '..a######a..',
        '.g##kkkk##g.',
        '####pppp####',
        '##b######b##',
        '..llllllll..',
      ],
      'boss',
    ),
  ],
}

export function houseAt(index: number): House | undefined {
  return index === CONSERVATORY_INDEX ? CONSERVATORY : HOUSES[index]
}

export function mirrorWall<T extends Wall>(wall: T): T {
  return { ...wall, rows: wall.rows.map((row) => [...row].reverse().join('')) }
}

/** Lily pads must ride a row of their own, so the whole row drifts on the current together. */
export function lilyRowProblems(w: Wall): string[] {
  return w.rows.flatMap((row, i) =>
    row.includes('l') && /[^l.]/.test(row)
      ? [`${w.id}: row ${i} mixes lily pads with other crates`]
      : [],
  )
}

export function houseWall(house: House, id: string): VentWall | undefined {
  return house.walls.find((w) => w.id === id)
}

/** Soundness: sound walls, vents that resolve, every wall reachable, a vent that reaches the boss. */
export function houseProblems(h: House): string[] {
  const problems: string[] = []
  if (h.walls.length !== 9) problems.push(`${h.id}: ${h.walls.length} walls`)
  for (const w of h.walls)
    problems.push(...wallProblems(w, HOUSE_LEGEND), ...lilyRowProblems(w))
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
  const house = houseAt(pos.house)
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

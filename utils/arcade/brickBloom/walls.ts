// /utils/arcade/brickBloom/walls.ts
//
// Brick Bloom's walls as authored data (conductor kr-arcade/t-078, depth-pass CABINETS.md section 11):
// string layouts and a legend of crate kinds, replacing the six pattern lambdas. Every wall is
// COLS x ROWS; `wallProblems` is the soundness check the cabinet test runs over all of them.

export const COLS = 12
export const ROWS = 9

export type CrateKind =
  | 'crate'
  | 'bolt'
  | 'sprout'
  | 'hinge'
  | 'puffball'
  | 'root'
  | 'vine'
  | 'trellis'

/** The legend: one character per crate kind; `.` is empty air. */
export const LEGEND: Readonly<Record<string, CrateKind>> = {
  '#': 'crate',
  '=': 'bolt',
  s: 'sprout',
  h: 'hinge',
  p: 'puffball',
}

export type Wall = {
  id: string
  name: string
  rows: readonly string[]
}

const EMPTY = '............'

function wall(id: string, name: string, rows: string[]): Wall {
  const padded = [...rows]
  while (padded.length < ROWS) padded.push(EMPTY)
  return { id, name, rows: padded }
}

/** Twelve authored walls. Stage N plays wall N, cycling; the first few are the gentlest. */
export const WALLS: readonly Wall[] = [
  wall('rows', 'Seedling Rows', [
    EMPTY,
    '############',
    '#s########s#',
    '############',
    '############',
    '############',
    '############',
  ]),
  wall('pyramid', 'Little Pyramid', [
    EMPTY,
    '.....##.....',
    '....#ss#....',
    '...######...',
    '..########..',
    '.##########.',
    '############',
  ]),
  wall('checker', 'Checker Garden', [
    '#.#.#.#.#.#.',
    '.#.#.#.#.#.#',
    '#.#.#.s.#.#.',
    '.#.#.#.#.#.#',
    '#.#.#.#.#.#.',
    '.#.#.#.#.#.#',
    '#.#.#.#.#.#.',
    '.#.#.#.#.#.#',
  ]),
  wall('diamond', 'Diamond Bed', [
    '.....##.....',
    '....####....',
    '...##ss##...',
    '..########..',
    '.##########.',
    '..########..',
    '...######...',
    '....####....',
    '.....##.....',
  ]),
  wall('puffs', 'Puffball Patch', [
    EMPTY,
    '#####pp#####',
    '############',
    '#p########p#',
    '############',
    '####p##p####',
    '############',
  ]),
  wall('towers', 'Two Towers', [
    '###......###',
    '############',
    '############',
    '###......###',
    '###..ss..###',
    '###......###',
    '###......###',
    '###......###',
  ]),
  wall('gates', 'Hinged Gates', [
    EMPTY,
    '############',
    '#hh######hh#',
    '#hh######hh#',
    '############',
    '..hh.##.hh..',
    '..##....##..',
  ]),
  wall('stripes', 'Gapped Stripes', [
    '###.###.###.',
    EMPTY,
    '###.###.###.',
    EMPTY,
    '###.###.###.',
    EMPTY,
    '###.###.###.',
    EMPTY,
  ]),
  wall('cages', 'Bolted Cages', [
    '=.==....==.=',
    '=##=....=##=',
    '=ss=.pp.=ss=',
    '=##=....=##=',
    '====....====',
    '..##########',
    '##########..',
  ]),
  wall('zigzag', 'Bolt Zigzag', [
    EMPTY,
    '#####=######',
    '######=#####',
    '#######=####',
    '######=#####',
    '#####=######',
    '####=#######',
    '#####=######',
  ]),
  wall('smile', 'Sprout Smile', [
    EMPTY,
    '.##......##.',
    '.#s......s#.',
    '.##......##.',
    EMPTY,
    '#..........#',
    '.#........#.',
    '..########..',
  ]),
  wall('bloom', 'Grand Bloom', [
    '...######...',
    '.##hhhhhh##.',
    '##pp####pp##',
    '#hh##ss##hh#',
    '##pp####pp##',
    '.##hhhhhh##.',
    '...######...',
  ]),
]

export type Cell = { col: number; row: number; kind: CrateKind }

export function parseWall(
  w: Wall,
  legend: Readonly<Record<string, CrateKind>> = LEGEND,
): Cell[] {
  const out: Cell[] = []
  w.rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const kind = legend[line[col]!]
      if (kind) out.push({ col, row, kind })
    }
  })
  return out
}

export function wallFor(stage: number): Wall {
  return WALLS[(Math.max(1, stage) - 1) % WALLS.length]!
}

/**
 * Soundness: right shape, only legend characters, something to break, and every breakable crate
 * can be reached -- connected through non-bolt cells to open air, the roof gap or the floor gap.
 */
export function wallProblems(
  w: Wall,
  legend: Readonly<Record<string, CrateKind>> = LEGEND,
): string[] {
  const problems: string[] = []
  if (w.rows.length !== ROWS) problems.push(`${w.id}: ${w.rows.length} rows`)
  w.rows.forEach((line, i) => {
    if (line.length !== COLS)
      problems.push(`${w.id}: row ${i} is ${line.length} wide`)
    for (const ch of line)
      if (ch !== '.' && !legend[ch]) problems.push(`${w.id}: unknown "${ch}"`)
  })
  if (problems.length) return problems
  const cells = parseWall(w, legend)
  const at = new Map(cells.map((c) => [`${c.col},${c.row}`, c.kind]))
  const breakable = cells.filter((c) => c.kind !== 'bolt')
  if (!breakable.length) problems.push(`${w.id}: nothing to break`)
  const seen = new Set<string>()
  const queue: Array<[number, number]> = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!at.has(`${c},${r}`)) {
        seen.add(`${c},${r}`)
        queue.push([c, r])
      }
  for (let c = 0; c < COLS; c++) {
    for (const r of [0, ROWS - 1]) {
      const k = `${c},${r}`
      if (at.get(k) && at.get(k) !== 'bolt' && !seen.has(k)) {
        seen.add(k)
        queue.push([c, r])
      }
    }
  }
  while (queue.length) {
    const [c, r] = queue.pop()!
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc
      const nr = r + dr
      const k = `${nc},${nr}`
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || seen.has(k)) continue
      if (at.get(k) === 'bolt') continue
      seen.add(k)
      queue.push([nc, nr])
    }
  }
  for (const c of breakable)
    if (!seen.has(`${c.col},${c.row}`))
      problems.push(`${w.id}: crate ${c.col},${c.row} is sealed in bolts`)
  return problems
}

// /utils/arcade/cableCrawler/mazes.ts
//
// Cable Crawler's mazes as data (conductor kr-arcade/t-064, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 8, "The Mainframe Odyssey"). Every maze is
// 23 x 19 cells inside the Mainframe's chassis, drawn as ASCII in the classic style: one-wide
// corridors on a lattice, long runs, hairpins and pinch points. A maze may be written as its left
// half (12 columns, the last being the middle column) and mirrored.
//
// Legend:
//   '#' wall              '.' spark              ' ' bare floor
//   'P' where the plug starts (its cable unspools from a reel there)
//   'S' a socket: drive the plug in for a Plug-In Surge
//   'o' a spare socket slot (a boss may move the sockets onto these)
//   '$' the maze's golden byte (it blinks in once half the sparks are slurped)
//   'b' a static bug's home     'd' a dust bunny     'm' a mimic spark
//   'B' where a boss starts
// Mirrored, the right half copies the left with 'P', '$' and 'B' left out (they stay unique).

export const COLS = 23
export const ROWS = 19

export type MazeLayout = {
  id: string
  name: string
  rows: readonly string[]
  /** The rows are the left half and the middle column; the right half mirrors them. */
  mirror?: boolean
  /** An open board (a Screensaver): no corridor rules. */
  open?: boolean
}

/** A parsed maze. Cells are keys, `y * COLS + x`. */
export type Maze = {
  id: string
  name: string
  rows: readonly string[]
  walls: readonly boolean[]
  floor: readonly number[]
  sparks: readonly number[]
  sockets: readonly number[]
  slots: readonly number[]
  start: number
  byte: number | null
  bugs: readonly number[]
  bunnies: readonly number[]
  mimics: readonly number[]
  boss: number | null
  /** The way the plug faces at the start: the first open way of up, left, right, down. */
  face: { dx: number; dy: number }
}

export const cellKey = (x: number, y: number) => y * COLS + x
export const cellX = (k: number) => k % COLS
export const cellY = (k: number) => Math.floor(k / COLS)

const MIRROR_OUT: Record<string, string> = { P: ' ', $: ' ', B: ' ' }

/** A layout's full rows, mirrored out if it is written as a half. */
export function fullRows(layout: MazeLayout): string[] {
  if (!layout.mirror) return [...layout.rows]
  return layout.rows.map(
    (row) =>
      row +
      [...row.slice(0, COLS >> 1)]
        .reverse()
        .map((c) => MIRROR_OUT[c] ?? c)
        .join(''),
  )
}

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
] as const

export function parseMaze(layout: MazeLayout): Maze {
  const rows = fullRows(layout)
  const walls: boolean[] = []
  const floor: number[] = []
  const found: Record<string, number[]> = {}
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const ch = rows[y]?.[x] ?? '#'
      const wall = ch === '#'
      walls.push(wall)
      if (wall) continue
      const k = cellKey(x, y)
      floor.push(k)
      ;(found[ch] ??= []).push(k)
    }
  const all = (ch: string) => found[ch] ?? []
  const start = all('P')[0] ?? cellKey(COLS >> 1, ROWS - 2)
  const isOpen = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < COLS && y < ROWS && !walls[cellKey(x, y)]
  const face = DIRS.find((d) =>
    isOpen(cellX(start) + d.dx, cellY(start) + d.dy),
  ) ?? { dx: 0, dy: -1 }
  return {
    id: layout.id,
    name: layout.name,
    rows,
    walls,
    floor,
    sparks: all('.'),
    sockets: all('S'),
    slots: all('o'),
    start,
    byte: all('$')[0] ?? null,
    bugs: all('b'),
    bunnies: all('d'),
    mimics: all('m'),
    boss: all('B')[0] ?? null,
    face: { dx: face.dx, dy: face.dy },
  }
}

/** How many open neighbours a cell has. */
export function degree(maze: Maze, k: number): number {
  const x = cellX(k)
  const y = cellY(k)
  let n = 0
  for (const d of DIRS) {
    const nx = x + d.dx
    const ny = y + d.dy
    if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS)
      n += maze.walls[cellKey(nx, ny)] ? 0 : 1
  }
  return n
}

/**
 * The cells on a loop: what is left once every dead-end branch is pruned away, leaf by leaf. A
 * cable can crawl through any of them and out again.
 */
export function loopCells(maze: Maze): Set<number> {
  const alive = new Set(maze.floor)
  const live = (k: number) => {
    let n = 0
    for (const d of DIRS)
      if (alive.has(cellKey(cellX(k) + d.dx, cellY(k) + d.dy))) n++
    return n
  }
  let pruned = true
  while (pruned) {
    pruned = false
    for (const k of [...alive])
      if (live(k) < 2) {
        alive.delete(k)
        pruned = true
      }
  }
  return alive
}

/**
 * What is wrong with a maze, if anything: its size, a gap in the frame, a corridor wider than one
 * cell, a part the plug can't reach, a spark, socket or golden byte the cable could only reach by
 * crawling down a dead-end branch it can never back out of, or the wrong number of sockets.
 */
export function mazeProblems(
  layout: MazeLayout,
  kind: 'maze' | 'boss' | 'open' = 'maze',
): string[] {
  const out: string[] = []
  const rows = fullRows(layout)
  if (rows.length !== ROWS) out.push(`${rows.length} rows`)
  rows.forEach((r, y) => {
    if (r.length !== COLS) out.push(`row ${y} is ${r.length} wide`)
  })
  if (out.length) return out
  const maze = parseMaze(layout)
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (
        (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) &&
        !maze.walls[cellKey(x, y)]
      )
        out.push(`gap in the frame at ${x},${y}`)
  const starts = rows.join('').split('P').length - 1
  if (starts !== 1) out.push(`${starts} starts`)
  const seen = new Set([maze.start])
  const stack = [maze.start]
  while (stack.length) {
    const k = stack.pop()!
    for (const d of DIRS) {
      const n = cellKey(cellX(k) + d.dx, cellY(k) + d.dy)
      if (!maze.walls[n] && !seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  const lost = maze.floor.filter((k) => !seen.has(k))
  if (lost.length) out.push(`${lost.length} cells out of reach`)
  if (kind !== 'open')
    for (const k of maze.floor) {
      const x = cellX(k)
      const y = cellY(k)
      if (
        !maze.walls[cellKey(x + 1, y)] &&
        !maze.walls[cellKey(x, y + 1)] &&
        !maze.walls[cellKey(x + 1, y + 1)]
      )
        out.push(`a 2x2 open patch at ${x},${y}`)
    }
  // The cable can never back out of a dead-end branch, so anything worth having sits on a loop
  // (a spark may sit one cell off one, in a surge's reach).
  const loop = loopCells(maze)
  const offLoop = (k: number) => !loop.has(k)
  const nearLoop = (k: number) =>
    DIRS.some((d) => loop.has(cellKey(cellX(k) + d.dx, cellY(k) + d.dy)))
  const trapped = [
    ...maze.sockets,
    ...maze.slots,
    ...maze.mimics,
    ...(maze.byte === null ? [] : [maze.byte]),
  ].filter(offLoop)
  if (kind !== 'open') {
    for (const k of trapped)
      out.push(`something off the loops at ${cellX(k)},${cellY(k)}`)
    for (const k of maze.sparks.filter((k) => offLoop(k) && !nearLoop(k)))
      out.push(`a spark out of reach at ${cellX(k)},${cellY(k)}`)
  }
  // A dust bunny starts where the plug can push it along one way or the other.
  const open = (x: number, y: number) => !maze.walls[cellKey(x, y)]
  for (const k of maze.bunnies) {
    const x = cellX(k)
    const y = cellY(k)
    if (
      !(open(x - 1, y) && open(x + 1, y)) &&
      !(open(x, y - 1) && open(x, y + 1))
    )
      out.push(`a dust bunny stuck fast at ${x},${y}`)
  }
  const sockets = maze.sockets.length
  if (kind !== 'open' && (sockets < 2 || sockets > 4))
    out.push(`${sockets} sockets`)
  if (kind === 'maze' && maze.byte === null) out.push('no golden byte')
  if (kind === 'boss' && maze.boss === null) out.push('no boss lair')
  return out
}

/** A Screensaver's open board: just the chassis frame, the plug starting at the bottom middle. */
export function openBoard(id: string, name: string): MazeLayout {
  const rows: string[] = []
  for (let y = 0; y < ROWS; y++) {
    if (y === 0 || y === ROWS - 1) rows.push('#'.repeat(COLS))
    else if (y === ROWS - 2)
      rows.push(
        `#${' '.repeat((COLS >> 1) - 1)}P${' '.repeat((COLS >> 1) - 1)}#`,
      )
    else rows.push(`#${' '.repeat(COLS - 2)}#`)
  }
  return { id, name, rows, open: true }
}

// --- 1. The Power Strip ---------------------------------------------------------------------------

export const POWER_STRIP_MAZES: readonly MazeLayout[] = [
  {
    id: 'ps-1',
    name: 'WALL OUTLET',
    mirror: true,
    rows: [
      '############',
      '#. . .#. . .',
      '# ### # # ##',
      '#.#S .#.#. .',
      '# # ### ### ',
      '#. .#. . . .',
      '### # ##### ',
      '#   #. .#. .',
      '# ##### # # ',
      '#     #. .#.',
      '##### ### # ',
      '#. . . .#. .',
      '# ##### ### ',
      '#. .$.#. . .',
      '### # ##### ',
      '#   #. . .#.',
      '# ####### # ',
      '#. .       P',
      '############',
    ],
  },
  {
    id: 'ps-2',
    name: 'DUST CORNER',
    rows: [
      '#######################',
      '#. . . . .#. . . . . .#',
      '# ####### # ######### #',
      '#.#. . .#. .#. . . .#.#',
      '# # # # ##### ##### # #',
      '#. .#S#. . . .#   #. .#',
      '### # ####### # # ### #',
      '#. .#. . .d. .#.#. . .#',
      '# ####### ##### ##### #',
      '#. . . .#. . .#. . . .#',
      '####### ##### # #######',
      '#. . .#.#. .#.#.#$ . .#',
      '# # # # # # # # # # # #',
      '#.#S#. .#.#. .#. .#S#.#',
      '# # ##### ######### # #',
      '#.#. . . .d. . . . .#.#',
      '# ########### ####### #',
      '#. . . . . .P. . . . .#',
      '#######################',
    ],
  },
  {
    id: 'ps-3',
    name: 'STATIC ROW',
    mirror: true,
    rows: [
      '############',
      '#. . . . . .',
      '# ######### ',
      '#.#. . . .#.',
      '# # ##### # ',
      '#. .#.S.#. .',
      '### # # ####',
      '#. . .#. . .',
      '# ####### ##',
      '#.#b . .#. .',
      '# # ### ### ',
      '#. .#.S.#. .',
      '### # # # # ',
      '#. .#.#. .#.',
      '# ### ##### ',
      '#.#. .$. . .',
      '# # ##### # ',
      '#. . . . . P',
      '############',
    ],
  },
  {
    id: 'ps-4',
    name: 'SPARK OR SHORT',
    rows: [
      '#######################',
      '#. . .#. . . . .#. . .#',
      '# ### # ####### # ### #',
      '#.#. . .#. S .#. . .#.#',
      '# # ##### ### ##### # #',
      '#.#. . .#.#b#.#. . .#.#',
      '# ##### # # # # ##### #',
      '#. . .#. .# #. .#. . .#',
      '##### ##### ##### #####',
      '#m . .#. . $ . .#. . m#',
      '# ### # ####### # ### #',
      '#. .#. .#. . .#. .#. .#',
      '### ##### # # ##### ###',
      '#.S.#. . .#.#. . .#.S.#',
      '# # # ##### ##### # # #',
      '#.#. .#. .b. . .#. .#.#',
      '# ##### ####### ##### #',
      '#. . . . . P . . . . .#',
      '#######################',
    ],
  },
  {
    id: 'ps-5',
    name: 'THE POWER BAR',
    mirror: true,
    rows: [
      '############',
      '#. . .#. . .',
      '# # # # ### ',
      '#.#S#. .#b .',
      '# # ##### # ',
      '#. .#. . .#.',
      '### # ### # ',
      '#. .#.#m .#.',
      '# ### # ### ',
      '#.#. .#. . .',
      '# # ##### # ',
      '#.#.# d. .#.',
      '# # # # # # ',
      '#. .#.#S#. .',
      '##### # # # ',
      '#. . .#. .#.',
      '# ##### ### ',
      '#. $ . . . P',
      '############',
    ],
  },
]

/** The Surge Protector's fuse box: a ring corridor round the frame, sockets just inside it. */
export const FUSE_BOX: MazeLayout = {
  id: 'ps-boss',
  name: 'THE FUSE BOX',
  mirror: true,
  rows: [
    '############',
    '#. . . . . B',
    '# ### ### # ',
    '#.#. .#. .#.',
    '# # # # #S# ',
    '#. .#. .#. .',
    '# ### ### ##',
    '#.#o .#. . .',
    '# # # # ### ',
    '#. .#o#. .#.',
    '# ### ### # ',
    '#.#. . .#. .',
    '# # ### # # ',
    '#. .#o .#.#.',
    '# ### ### # ',
    '#.#S . . .#.',
    '# # ##### # ',
    '#. . . . . P',
    '############',
  ],
}

export const STARFIELD = openBoard('ps-saver', 'STARFIELD')

/**
 * The ring a boss walks: every open cell just inside the frame, in order clockwise from the top
 * left corner. Empty when the maze has no such ring.
 */
export function ringOf(maze: Maze): number[] {
  const ring: number[] = []
  for (let x = 1; x < COLS - 1; x++) ring.push(cellKey(x, 1))
  for (let y = 2; y < ROWS - 1; y++) ring.push(cellKey(COLS - 2, y))
  for (let x = COLS - 3; x >= 1; x--) ring.push(cellKey(x, ROWS - 2))
  for (let y = ROWS - 3; y >= 2; y--) ring.push(cellKey(1, y))
  return ring.every((k) => !maze.walls[k]) ? ring : []
}

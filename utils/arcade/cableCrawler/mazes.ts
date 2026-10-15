// /utils/arcade/cableCrawler/mazes.ts
//
// Cable Crawler's mazes as data (conductor kr-arcade/t-064 and on, spec: conductor
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
// RAM Rows (t-065):
//   '<' '>' '^' 'v' a diode: crawl through it only the way its arrow points
//   'c' a cache crab's row      'f' a bit flipper's home
//   '_' a Defrag slot           'x' a loose Defrag block
//   A layout with `refresh` swaps the sparks of each pair of rows on a beat.
// The Cooling Fan (t-065):
//   '(' ')' 'A' 'V' an airflow lane blowing left, right, up or down: it carries the cable along
//       twice as fast, and nothing crawls against it
//   'h' a heat tile (the battery drains twice as fast on it)
//   'F' a fan hub: the 5 x 5 sector round it turns a quarter at a time
//   't' a hot spot              'l' a leak drip's home
// The Sound Card (t-066):
//   'g' 'G' a beat gate: a doorway that shuts and opens on the music. 'g' starts shut, 'G' starts
//       open, and they swap on every beat, so one set is always open
//   'O' a speaker cone: on its beat it shoves a plug beside it one cell away
//   'e' marks an echo: a ghost cable retracing the plug's path four seconds behind
//   'n' a trio of noise gnats' home
// The Graphics Card (t-066):
//   'z' a z-fighter wall: a doorway that flickers between solid and passable on its own beat
//   's' a glitch sprite's home: it teleports onto the spark you are heading for
//   A layout with `scan` sweeps a scanline down the board; one with `picture` hides an image
//   under its sparks, which each slurped spark reveals.
// Mirrored, the right half copies the left with 'P', '$' and 'B' left out (they stay unique) and
// the left-right arrows turned round.

export const COLS = 23
export const ROWS = 19

export type MazeLayout = {
  id: string
  name: string
  rows: readonly string[]
  /** The rows are the left half and the middle column; the right half mirrors them. */
  mirror?: boolean
  /** An open board (a Screensaver or a boss room): no corridor rules. */
  open?: boolean
  /** RAM Rows: the rows swap their sparks on a beat. */
  refresh?: boolean
  /** The Graphics Card: ticks per row the scanline sweeps (none when absent). */
  scan?: number
  /** The Graphics Card: the picture the sparks are the pixels of. */
  picture?: string
}

export type Way = { dx: number; dy: number }

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
  crabs: readonly number[]
  flippers: readonly number[]
  hotspots: readonly number[]
  drips: readonly number[]
  /** The Sound Card: beat gates (with the ones that start shut), speaker cones, echoes, gnats. */
  gates: readonly number[]
  shutGates: readonly number[]
  cones: readonly number[]
  echoes: readonly number[]
  gnats: readonly number[]
  /** The Graphics Card: z-fighter walls and glitch sprites' homes. */
  zfighters: readonly number[]
  sprites: readonly number[]
  scan: number
  picture: string | null
  boss: number | null
  /** One-way diodes, by cell. */
  diodes: ReadonlyMap<number, Way>
  /** Airflow lanes, by cell. */
  air: ReadonlyMap<number, Way>
  heat: readonly number[]
  /** Fan hubs; each turns the 5 x 5 sector round it. */
  fans: readonly number[]
  /** Defrag's slots and blocks. */
  bays: readonly number[]
  blocks: readonly number[]
  refresh: boolean
  /** The way the plug faces at the start: the first open way of up, left, right, down. */
  face: Way
}

export const cellKey = (x: number, y: number) => y * COLS + x
export const cellX = (k: number) => k % COLS
export const cellY = (k: number) => Math.floor(k / COLS)

const MIRROR_OUT: Record<string, string> = {
  P: ' ',
  $: ' ',
  B: ' ',
  '<': '>',
  '>': '<',
  '(': ')',
  ')': '(',
}

export const DIODE_WAYS: Record<string, Way> = {
  '<': { dx: -1, dy: 0 },
  '>': { dx: 1, dy: 0 },
  '^': { dx: 0, dy: -1 },
  v: { dx: 0, dy: 1 },
}
export const AIR_WAYS: Record<string, Way> = {
  '(': { dx: -1, dy: 0 },
  ')': { dx: 1, dy: 0 },
  A: { dx: 0, dy: -1 },
  V: { dx: 0, dy: 1 },
}

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

const SOLID = new Set(['#', 'F'])

export function parseMaze(layout: MazeLayout): Maze {
  const rows = fullRows(layout)
  const walls: boolean[] = []
  const floor: number[] = []
  const found: Record<string, number[]> = {}
  const diodes = new Map<number, Way>()
  const air = new Map<number, Way>()
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const ch = rows[y]?.[x] ?? '#'
      const wall = SOLID.has(ch)
      const k = cellKey(x, y)
      walls.push(wall)
      ;(found[ch] ??= []).push(k)
      if (wall) continue
      floor.push(k)
      if (DIODE_WAYS[ch]) diodes.set(k, DIODE_WAYS[ch]!)
      if (AIR_WAYS[ch]) air.set(k, AIR_WAYS[ch]!)
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
    crabs: all('c'),
    flippers: all('f'),
    hotspots: all('t'),
    drips: all('l'),
    gates: [...all('g'), ...all('G')],
    shutGates: all('g'),
    cones: all('O'),
    echoes: all('e'),
    gnats: all('n'),
    zfighters: all('z'),
    sprites: all('s'),
    scan: layout.scan ?? 0,
    picture: layout.picture ?? null,
    boss: all('B')[0] ?? null,
    diodes,
    air,
    heat: all('h'),
    fans: all('F'),
    bays: all('_'),
    blocks: all('x'),
    refresh: layout.refresh === true,
    face: { dx: face.dx, dy: face.dy },
  }
}

/**
 * Whether a move the way `w` from a cell with diode or airflow `from` onto one with `to` is
 * allowed: a diode is crawled only the way it points, and nothing goes against the air.
 */
export function oneWayOk(
  w: Way,
  from: { diode?: Way; air?: Way },
  to: { diode?: Way; air?: Way },
): boolean {
  const same = (a: Way | undefined) => !a || (a.dx === w.dx && a.dy === w.dy)
  const against = (a: Way | undefined) =>
    !!a && a.dx === -w.dx && a.dy === -w.dy
  return (
    same(from.diode) && same(to.diode) && !against(from.air) && !against(to.air)
  )
}

/** The 25 cells of the fan sector round `hub`. */
export function sectorCells(hub: number): number[] {
  const out: number[] = []
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++)
      out.push(cellKey(cellX(hub) + dx, cellY(hub) + dy))
  return out
}

/** Where a cell of a fan sector goes when the sector turns a quarter clockwise. */
export function turnCell(hub: number, k: number): number {
  const dx = cellX(k) - cellX(hub)
  const dy = cellY(k) - cellY(hub)
  return cellKey(cellX(hub) - dy, cellY(hub) + dx)
}

/** The walls with the sector round `hub` turned a quarter clockwise. */
export function turnSector(walls: readonly boolean[], hub: number): boolean[] {
  const out = [...walls]
  for (const k of sectorCells(hub)) out[turnCell(hub, k)] = walls[k]!
  return out
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
export function loopCells(
  maze: Maze,
  walls: readonly boolean[] = maze.walls,
): Set<number> {
  const alive = new Set(maze.floor.filter((k) => !walls[k]))
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

/** Cells reachable from `from` by legal crawls (diodes and airflow obeyed), or backwards. */
function reach(
  maze: Maze,
  walls: readonly boolean[],
  from: number,
  backwards: boolean,
  diodes: ReadonlyMap<number, Way> = maze.diodes,
): Set<number> {
  const seen = new Set([from])
  const stack = [from]
  const at = (k: number) => ({ diode: diodes.get(k), air: maze.air.get(k) })
  while (stack.length) {
    const k = stack.pop()!
    for (const d of DIRS) {
      const x = cellX(k) + d.dx
      const y = cellY(k) + d.dy
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue
      const n = cellKey(x, y)
      if (walls[n] || seen.has(n)) continue
      const ok = backwards
        ? oneWayOk({ dx: -d.dx, dy: -d.dy }, at(n), at(k))
        : oneWayOk(d, at(k), at(n))
      if (!ok) continue
      seen.add(n)
      stack.push(n)
    }
  }
  return seen
}

/**
 * What is wrong with a maze, if anything: its size, a gap in the frame, a corridor wider than one
 * cell, a part the plug can't reach and come back from (diodes and airflow obeyed, in every
 * turn of every fan, and with every diode closed), a spark, socket or golden byte the cable could
 * only reach by crawling down a dead-end branch it can never back out of, a dust bunny stuck
 * fast, or the wrong number of sockets.
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
  // Every turn of every fan.
  let states: boolean[][] = [[...maze.walls]]
  for (const hub of maze.fans) {
    const next: boolean[][] = []
    for (const s of states) {
      let w = s
      for (let i = 0; i < 4; i++) {
        next.push(w)
        w = turnSector(w, hub)
      }
    }
    states = next
  }
  states.forEach((walls, i) => {
    const tag = i ? ` (fan turn ${i})` : ''
    const floor = maze.floor.filter((k) => !walls[k])
    const ahead = reach(maze, walls, maze.start, false)
    const back = reach(maze, walls, maze.start, true)
    const lost = floor.filter((k) => !ahead.has(k) || !back.has(k))
    if (lost.length) out.push(`${lost.length} cells out of reach${tag}`)
    if (maze.diodes.size) {
      // With every diode shut, the maze still hangs together: a flipped diode never traps you.
      const shut = walls.map((w, k) => w || maze.diodes.has(k))
      const plain = reach(maze, shut, maze.start, false, new Map())
      if (floor.some((k) => !shut[k] && !plain.has(k)))
        out.push(`the maze needs its diodes${tag}`)
    }
    if (kind !== 'open' && !layout.open)
      for (const k of floor) {
        const x = cellX(k)
        const y = cellY(k)
        if (
          !walls[cellKey(x + 1, y)] &&
          !walls[cellKey(x, y + 1)] &&
          !walls[cellKey(x + 1, y + 1)]
        )
          out.push(`a 2x2 open patch at ${x},${y}${tag}`)
      }
    // The cable can never back out of a dead-end branch, so anything worth having sits on a
    // loop (a spark may sit one cell off one, in a surge's reach).
    const loop = loopCells(maze, walls)
    const offLoop = (k: number) => !loop.has(k)
    const nearLoop = (k: number) =>
      DIRS.some((d) => loop.has(cellKey(cellX(k) + d.dx, cellY(k) + d.dy)))
    if (kind !== 'open') {
      const trapped = [
        ...maze.sockets,
        ...maze.slots,
        ...maze.mimics,
        ...(maze.byte === null ? [] : [maze.byte]),
      ].filter((k) => !walls[k] && offLoop(k))
      for (const k of trapped)
        out.push(`something off the loops at ${cellX(k)},${cellY(k)}${tag}`)
      for (const k of maze.sparks.filter(
        (k) => !walls[k] && offLoop(k) && !nearLoop(k),
      ))
        out.push(`a spark out of reach at ${cellX(k)},${cellY(k)}${tag}`)
    }
  })
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
  // A fan sector holds nothing but walls, floor and sparks, and its hub sits on a pillar.
  for (const hub of maze.fans) {
    if (cellX(hub) % 2 || cellY(hub) % 2) out.push('a fan hub off a pillar')
    for (const k of sectorCells(hub)) {
      const ch = rows[cellY(k)]?.[cellX(k)] ?? '#'
      if (!'#F. '.includes(ch)) out.push(`a '${ch}' in a fan sector`)
    }
  }
  // A beat gate is a doorway: walls on two opposite sides, floor on the other two.
  for (const k of [...maze.gates, ...maze.zfighters]) {
    const x = cellX(k)
    const y = cellY(k)
    const w = (dx: number, dy: number) => maze.walls[cellKey(x + dx, y + dy)]
    const across = w(-1, 0) && w(1, 0) && !w(0, -1) && !w(0, 1)
    const down = w(0, -1) && w(0, 1) && !w(-1, 0) && !w(1, 0)
    if (!across && !down)
      out.push(
        `a beat gate or z-fighter wall that is not a doorway at ${x},${y}`,
      )
  }
  if (maze.gates.length === 1) out.push('a lone beat gate')
  for (const k of maze.cones) {
    if (maze.walls[k]) out.push('a speaker cone in a wall')
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

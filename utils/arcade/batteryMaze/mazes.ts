// /utils/arcade/batteryMaze/mazes.ts
//
// Battery Maze's mazes as data (conductor kr-arcade/t-039, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 2). Every layout is 23 x 21
// tiles around the same charging dock, so the cabinet keeps one size; the game
// parses a layout once and reads everything from the parsed maze.
//
// Legend:
//   '#' wall               '.' spark              'o' power cell
//   '-' dock door          'G' charging dock      'P' robot start
//   ' ' empty floor (a row whose two edges are floor wraps as a tunnel)
//   's' Rewire switch (a spark on it too)
//   'a' a gate that is open while its switch is up (shut when flipped)
//   'b' a gate that is shut while its switch is up (open when flipped)
// Each gate belongs to the switch nearest it (within three tiles).

export type Tile = { x: number; y: number }

export type MazeLayout = {
  id: string
  name: string
  rows: readonly string[]
}

export type MazeGate = Tile & {
  /** The switch state (0 up, 1 flipped) in which this gate is open. */
  openIn: 0 | 1
}

export type MazeSwitch = Tile & { gates: readonly MazeGate[] }

export type Maze = {
  id: string
  name: string
  rows: readonly string[]
  cols: number
  height: number
  start: Tile
  door: Tile
  /** The tile above the door, where gremlins step out into the maze. */
  dockExit: Tile
  /** The middle of the dock, where rebooted gremlins land. */
  dockHome: Tile
  /** The dock's tiles, left to right (one gremlin waits on each). */
  dockPads: readonly Tile[]
  sparks: readonly Tile[]
  cells: readonly Tile[]
  switches: readonly MazeSwitch[]
  /** Rows that wrap from one edge to the other. */
  tunnelRows: readonly number[]
}

export const MAZE_COLS = 23
export const MAZE_ROWS = 21

/** Today's maze, kept as Classic Maze and as the first maze of the Cozy Charger. */
export const CLASSIC_LAYOUT: MazeLayout = {
  id: 'classic',
  name: 'THE FIRST CHARGER',
  rows: [
    '#######################',
    '#..........#..........#',
    '#o###.####.#.####.###o#',
    '#.....................#',
    '#.###.#.#######.#.###.#',
    '#.....#....#....#.....#',
    '#####.####.#.####.#####',
    '#####.#.........#.#####',
    '#####.#.###-###.#.#####',
    '     ...#GGGGG#...     ',
    '#####.#.#######.#.#####',
    '#####.#....P....#.#####',
    '#####.#.#######.#.#####',
    '#..........#..........#',
    '#.###.####.#.####.###.#',
    '#o..#.............#..o#',
    '###.#.#.#######.#.#.###',
    '#.....#....#....#.....#',
    '#.########.#.########.#',
    '#.....................#',
    '#######################',
  ],
}

/** Two tunnels, top and bottom, and long socket rows between them. */
export const OUTLET_LOOPS: MazeLayout = {
  id: 'outlet-loops',
  name: 'OUTLET LOOPS',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '###.###.###.###.###.###',
    '   .###.........###.   ',
    '###.###.###.###.###.###',
    '###.................###',
    '###.###.###-###.###.###',
    '###.....#GGGGG#.....###',
    '###.###.#######.###.###',
    '###........P........###',
    '#####.#####.#####.#####',
    '#.....................#',
    '#.#####.#######.#####.#',
    '   .###.........###.   ',
    '###.#####.###.#####.###',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#######################',
  ],
}

/** Three Rewire switches: one over the dock, two guarding the lower halls. */
export const SWITCHYARD: MazeLayout = {
  id: 'switchyard',
  name: 'THE SWITCHYARD',
  rows: [
    '#######################',
    '#.....###.....###.....#',
    '#o###.###.#b#.###.###o#',
    '#..........s..........#',
    '#.#####.###a###.#####.#',
    '#.........#.#.........#',
    '#.###.###.#.#.###.###.#',
    '#.....................#',
    '#####.#####-#####.#####',
    '   .....#GGGGG#.....   ',
    '#####.#.#######.#.#####',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#.....as.......sa.....#',
    '###.###b#######b###.###',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#.#####.###.###.#####.#',
    '#.....................#',
    '#######################',
  ],
}

export const LAYOUTS: readonly MazeLayout[] = [
  CLASSIC_LAYOUT,
  OUTLET_LOOPS,
  SWITCHYARD,
]

const BLOCKED = new Set(['#', '-', 'G'])

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

function find(rows: readonly string[], char: string): Tile[] {
  const out: Tile[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === char) out.push({ x, y })
  })
  return out
}

/** A layout read into the tiles the game needs. Throws on a malformed layout. */
export function parseMaze(layout: MazeLayout): Maze {
  const { rows } = layout
  const cols = rows[0]!.length
  if (cols !== MAZE_COLS || rows.length !== MAZE_ROWS)
    throw new Error(`${layout.id}: a maze is ${MAZE_COLS} x ${MAZE_ROWS}`)
  if (rows.some((r) => r.length !== cols))
    throw new Error(`${layout.id}: ragged rows`)
  const [start] = find(rows, 'P')
  const [door] = find(rows, '-')
  const dockPads = find(rows, 'G')
  if (!start || !door || dockPads.length < 3)
    throw new Error(`${layout.id}: needs a start, a door and a dock`)
  const switchTiles = find(rows, 's')
  const gates = [...find(rows, 'a'), ...find(rows, 'b')]
  const owned: MazeGate[][] = switchTiles.map(() => [])
  for (const gate of gates) {
    const ranked = switchTiles
      .map((s, i) => ({
        i,
        d: Math.abs(s.x - gate.x) + Math.abs(s.y - gate.y),
      }))
      .sort((p, q) => p.d - q.d)
    const best = ranked[0]
    if (!best || best.d > 3 || ranked[1]?.d === best.d)
      throw new Error(`${layout.id}: gate ${gate.x},${gate.y} has no switch`)
    owned[best.i]!.push({
      ...gate,
      openIn: rows[gate.y]![gate.x] === 'a' ? 0 : 1,
    })
  }
  const tunnelRows: number[] = []
  rows.forEach((row, y) => {
    if (!BLOCKED.has(row[0]!) && !BLOCKED.has(row[cols - 1]!))
      tunnelRows.push(y)
  })
  return {
    id: layout.id,
    name: layout.name,
    rows,
    cols,
    height: rows.length,
    start,
    door,
    dockExit: { x: door.x, y: door.y - 1 },
    dockHome: dockPads[Math.floor(dockPads.length / 2)]!,
    dockPads,
    sparks: [...find(rows, '.'), ...switchTiles],
    cells: find(rows, 'o'),
    switches: switchTiles.map((s, i) => ({ ...s, gates: owned[i]! })),
    tunnelRows,
  }
}

/** Whether a gate is open with its switch in `state`. */
export function gateOpen(gate: MazeGate, state: 0 | 1): boolean {
  return gate.openIn === state
}

/**
 * Everything wrong with a maze, checked in every combination of its switches: every spark and
 * cell reachable from the start, and no dead ends except beside a shut gate (a shut gate makes
 * dead ends on purpose: that is how gremlins get bowled into them). Empty when the maze is good.
 */
export function mazeProblems(maze: Maze): string[] {
  const problems: string[] = []
  const { rows, cols } = maze
  const gateAt = new Map<string, { sw: number; gate: MazeGate }>()
  maze.switches.forEach((s, sw) => {
    for (const gate of s.gates) gateAt.set(`${gate.x},${gate.y}`, { sw, gate })
  })
  const combos = 2 ** maze.switches.length
  for (let combo = 0; combo < combos; combo++) {
    const state = (sw: number) => ((combo >> sw) & 1) as 0 | 1
    const open = (x: number, y: number) => {
      const wx = ((x % cols) + cols) % cols
      const cell = rows[y]?.[wx]
      if (cell === undefined || BLOCKED.has(cell)) return false
      const g = gateAt.get(`${wx},${y}`)
      return !g || gateOpen(g.gate, state(g.sw))
    }
    const shutGate = (x: number, y: number) => {
      const wx = ((x % cols) + cols) % cols
      const g = gateAt.get(`${wx},${y}`)
      return !!g && !gateOpen(g.gate, state(g.sw))
    }
    const startKey = `${maze.start.x},${maze.start.y}`
    const seen = new Set([startKey])
    const queue = [maze.start]
    while (queue.length) {
      const { x, y } = queue.pop()!
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = (x + dx + cols) % cols
        const key = `${nx},${y + dy}`
        if (!seen.has(key) && open(nx, y + dy)) {
          seen.add(key)
          queue.push({ x: nx, y: y + dy })
        }
      }
    }
    for (const t of [...maze.sparks, ...maze.cells])
      if (!seen.has(`${t.x},${t.y}`))
        problems.push(`${maze.id}[${combo}]: ${t.x},${t.y} is unreachable`)
    if (!seen.has(`${maze.dockExit.x},${maze.dockExit.y}`))
      problems.push(`${maze.id}[${combo}]: the dock exit is unreachable`)
    for (const key of seen) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const exits = NEIGHBOURS.filter(([dx, dy]) => open(x + dx, y + dy)).length
      const besideGate = NEIGHBOURS.some(([dx, dy]) => shutGate(x + dx, y + dy))
      if (exits < 2 && !besideGate)
        problems.push(`${maze.id}[${combo}]: dead end at ${key}`)
    }
  }
  return problems
}

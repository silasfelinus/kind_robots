/**
 * Pixel Hop board and rule data (The Painted Planets, slice 1). Pure and
 * deterministic: boards are data-defined cell sets, rules are table-driven,
 * and nothing here touches rng or the clock. The cabinet consumes this in
 * later slices; the legacy 7-row pyramid is `pyramidBoard(7)`.
 */
export type HopCell = { r: number; c: number }
export type SpecialTile = 'spring' | 'ice' | 'conveyor' | 'bucket' | 'star'
export type HopBoard = {
  id: string
  cells: HopCell[]
  /** Special tiles by "r,c". */
  special: Record<string, SpecialTile>
  /** Escape-disc slots: the row they hang beside and the side they sit on. */
  discSlots: Array<{ row: number; side: -1 | 1 }>
  /**
   * An authored board's escape discs, as the off-board cells they hover in: a
   * hop into one rides it home. Pyramids leave this out and pick from `discSlots`.
   */
  discCells?: HopCell[]
  /** Picture boards: each cube's target colour (a 1-based palette index), by "r,c". */
  target?: Record<string, number>
  /** Picture boards: paint pots that dip Pip's brush in their colour, by "r,c". */
  pots?: Record<string, number>
}

export const cellKey = (r: number, c: number) => `${r},${c}`

/**
 * A board drawn as staggered text, the way it looks on screen: row i holds a
 * cube at every other column (column k with k + i even), so each row sits half
 * a cube along from the one above and the four diagonal hops are the four
 * diagonal neighbours. '#' is a cube, 'S' a spring, '1'-'4' a picture cube and
 * its target colour, 'A'-'D' a paint pot of colour 1-4, 'o' an escape disc
 * hovering off the board; '.' and spaces are open sky.
 */
export function boardFromArt(id: string, rows: readonly string[]): HopBoard {
  const cells: HopCell[] = []
  const special: Record<string, SpecialTile> = {}
  const target: Record<string, number> = {}
  const pots: Record<string, number> = {}
  const discCells: HopCell[] = []
  rows.forEach((line, r) => {
    for (let k = 0; k < line.length; k++) {
      const ch = line[k]!
      if (ch === '.' || ch === ' ') continue
      if ((k + r) % 2) {
        throw new Error(
          `board ${id}: '${ch}' at row ${r} column ${k} is off the grid`,
        )
      }
      const cell = { r, c: (k + r) / 2 }
      const key = cellKey(cell.r, cell.c)
      if (ch === 'o') {
        discCells.push(cell)
        continue
      }
      cells.push(cell)
      if (ch === 'S') special[key] = 'spring'
      else if (ch >= '1' && ch <= '4') target[key] = Number(ch)
      else if (ch >= 'A' && ch <= 'D') pots[key] = ch.charCodeAt(0) - 64
      else if (ch !== '#') throw new Error(`board ${id}: unknown tile '${ch}'`)
    }
  })
  const board: HopBoard = { id, cells, special, discSlots: [], discCells }
  if (Object.keys(target).length) {
    board.target = target
    board.pots = pots
  }
  return board
}

/**
 * A square ring of cubes, `size` a side and `thick` cubes deep, standing on
 * its corner like a diamond: an outside edge and an inside edge to fall off.
 * Lattice (u, v) is (down-right hops, down-left hops) from the top corner.
 */
export function ringBoard(size: number, thick: number): HopBoard {
  const n = Math.max(3, Math.min(6, Math.trunc(size)))
  const t = Math.max(1, Math.min(Math.floor(n / 2), Math.trunc(thick)))
  const cells: HopCell[] = []
  for (let r = 0; r <= (n - 1) * 2; r++)
    for (let u = 0; u < n; u++) {
      const v = r - u
      if (v < 0 || v >= n) continue
      if (u < t || v < t || u >= n - t || v >= n - t) cells.push({ r, c: u })
    }
  return { id: `ring-${n}-${t}`, cells, special: {}, discSlots: [] }
}

/**
 * The ring's outside edge as a loop, clockwise on screen from the top corner:
 * the circuit Ringmaster Rattle spins round.
 */
export function ringLoop(size: number): HopCell[] {
  const n = Math.max(3, Math.min(6, Math.trunc(size)))
  const uv: Array<[number, number]> = []
  for (let u = 0; u < n - 1; u++) uv.push([u, 0])
  for (let v = 0; v < n - 1; v++) uv.push([n - 1, v])
  for (let u = n - 1; u > 0; u--) uv.push([u, n - 1])
  for (let v = n - 1; v > 0; v--) uv.push([0, v])
  return uv.map(([u, v]) => ({ r: u + v, c: u }))
}

/** Two snowy summits joined by a broad, hop-connected saddle. */
export function twinPeaksBoard(): HopBoard {
  const bands = [
    [1, 6],
    [1, 2, 6, 7],
    [0, 1, 2, 3, 6, 7, 8],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3, 4, 5, 6, 7],
    [2, 3, 4, 5, 6],
    [3, 4, 5],
  ]
  const cells = bands.flatMap((columns, r) =>
    columns.map((c) => ({ r, c })),
  )
  return {
    id: 'twin-peaks',
    cells,
    special: {},
    discSlots: [],
    discCells: [
      { r: 2, c: -1 },
      { r: 3, c: 9 },
    ],
  }
}

/** The board with escape discs fixed at these off-board cells, each beside a cube. */
export function withDiscs(
  board: HopBoard,
  discs: readonly HopCell[],
): HopBoard {
  const known = new Set(board.cells.map((x) => cellKey(x.r, x.c)))
  for (const d of discs) {
    if (known.has(cellKey(d.r, d.c))) {
      throw new Error(`disc at ${d.r},${d.c} sits on a cube`)
    }
    const beside = HOP_DIRS.some(([dr, dc]) =>
      known.has(cellKey(d.r - dr, d.c - dc)),
    )
    if (!beside) throw new Error(`disc at ${d.r},${d.c} is out of reach`)
  }
  return { ...board, discCells: [...(board.discCells ?? []), ...discs] }
}

/** Every cube reachable by hops from the first one (springs aside): a board must be one piece. */
export function boardConnected(board: HopBoard): boolean {
  if (!board.cells.length) return false
  const known = new Set(board.cells.map((x) => cellKey(x.r, x.c)))
  const seen = new Set<string>([cellKey(board.cells[0]!.r, board.cells[0]!.c)])
  const queue = [board.cells[0]!]
  while (queue.length) {
    const at = queue.shift()!
    for (const [dr, dc] of HOP_DIRS) {
      const key = cellKey(at.r + dr, at.c + dc)
      if (!known.has(key) || seen.has(key)) continue
      seen.add(key)
      queue.push({ r: at.r + dr, c: at.c + dc })
    }
  }
  return seen.size === known.size
}

export function pyramidBoard(rows: number): HopBoard {
  const n = Math.max(2, Math.min(10, Math.trunc(rows)))
  const cells: HopCell[] = []
  for (let r = 0; r < n; r++) for (let c = 0; c <= r; c++) cells.push({ r, c })
  const discSlots: HopBoard['discSlots'] = []
  for (let row = 2; row < Math.min(n, 6); row++) {
    discSlots.push({ row, side: -1 }, { row, side: 1 })
  }
  return { id: `pyramid-${n}`, cells, special: {}, discSlots }
}

/** A single row of cubes with a spring in the middle: the "bridge" board. */
export function bridgeBoard(length: number): HopBoard {
  const n = Math.max(3, Math.min(12, Math.trunc(length)))
  const cells: HopCell[] = []
  for (let c = 0; c < n; c++) cells.push({ r: 3, c })
  return {
    id: `bridge-${n}`,
    cells,
    special: { [cellKey(3, Math.floor(n / 2))]: 'spring' },
    discSlots: [
      { row: 3, side: -1 },
      { row: 3, side: 1 },
    ],
  }
}

export function withSpecial(
  board: HopBoard,
  placements: Array<[number, number, SpecialTile]>,
): HopBoard {
  const known = new Set(board.cells.map((x) => cellKey(x.r, x.c)))
  const special = { ...board.special }
  for (const [r, c, kind] of placements) {
    if (!known.has(cellKey(r, c))) {
      throw new Error(`special tile ${kind} is off the board at ${r},${c}`)
    }
    special[cellKey(r, c)] = kind
  }
  return { ...board, special }
}

// --- rules ------------------------------------------------------------------

export type RuleId = 'one' | 'two' | 'flip' | 'both' | 'cycle' | 'picture'
export type HopRule = {
  id: RuleId
  /** Colour steps to finish a tile (1 = one hop paints). */
  steps: number
  /** A finished tile hopped on again returns to unpainted. */
  flips: boolean
  /** Each tile has its own target colour from the picture palette. */
  picture: boolean
  /** Hops past the last step wrap round to step 0 (the cycle rule). */
  wraps: boolean
}

export const RULES: Record<RuleId, HopRule> = {
  one: { id: 'one', steps: 1, flips: false, picture: false, wraps: false },
  two: { id: 'two', steps: 2, flips: false, picture: false, wraps: false },
  flip: { id: 'flip', steps: 1, flips: true, picture: false, wraps: false },
  both: { id: 'both', steps: 2, flips: true, picture: false, wraps: false },
  cycle: { id: 'cycle', steps: 3, flips: false, picture: false, wraps: true },
  picture: {
    id: 'picture',
    steps: 1,
    flips: false,
    picture: true,
    wraps: false,
  },
}

/** A tile's paint level is 0..steps. Returns the level after one landing. */
export function hopTile(rule: HopRule, level: number): number {
  if (rule.wraps) return (level + 1) % (rule.steps + 1)
  if (level >= rule.steps) return rule.flips ? 0 : rule.steps
  return level + 1
}

export const tileDone = (rule: HopRule, level: number) =>
  !rule.wraps && level >= rule.steps

/** Picture rule: landing sets the tile to the colour the player carries. */
export function paintPicture(
  target: readonly number[],
  painted: number[],
  index: number,
  colour: number,
): boolean {
  painted[index] = colour
  return painted[index] === target[index]
}

export function pictureProgress(
  target: readonly number[],
  painted: readonly number[],
): { right: number; total: number; done: boolean } {
  let right = 0
  for (let i = 0; i < target.length; i++) if (painted[i] === target[i]) right++
  return { right, total: target.length, done: right === target.length }
}

/** Mini-map rows for the HUD: one string per board row, '.' unpainted. */
export function miniMap(board: HopBoard, painted: readonly number[]): string[] {
  const rows = new Map<number, string>()
  board.cells.forEach((cell, i) => {
    const mark = painted[i] ? String.fromCharCode(96 + painted[i]!) : '.'
    rows.set(cell.r, (rows.get(cell.r) ?? '') + mark)
  })
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s)
}

// --- tile effects -----------------------------------------------------------

/** Hop directions: up-right, down-right, down-left, up-left (as the cabinet). */
export const HOP_DIRS: Array<[number, number]> = [
  [-1, 0],
  [1, 1],
  [1, 0],
  [-1, -1],
]

/**
 * Where a hop in direction `dir` from `from` finally lands, after the landing
 * tile's effect: spring = two more cubes along the line, ice = one more,
 * conveyor = one cube down-right. Null means the hopper falls off the board.
 */
export function resolveTile(
  board: HopBoard,
  from: HopCell,
  dir: number,
): HopCell | null {
  const [dr, dc] = HOP_DIRS[dir]!
  const known = new Set(board.cells.map((x) => cellKey(x.r, x.c)))
  let at: HopCell = { r: from.r + dr, c: from.c + dc }
  if (!known.has(cellKey(at.r, at.c))) return null
  const kind = board.special[cellKey(at.r, at.c)]
  const push = (steps: number, d: [number, number]): HopCell | null => {
    for (let i = 0; i < steps; i++) {
      at = { r: at.r + d[0], c: at.c + d[1] }
      if (!known.has(cellKey(at.r, at.c))) return null
    }
    return at
  }
  if (kind === 'spring') return push(2, [dr, dc])
  if (kind === 'ice') return push(1, [dr, dc])
  if (kind === 'conveyor') return push(1, [1, 1])
  return at
}

// --- endless unlock ---------------------------------------------------------

export const ENDLESS_FOES = [
  'gumball',
  'boing',
  'mint',
  'gremlin',
  'skitter',
  'snowball',
  'frost',
  'ticktock',
  'bubble',
  'smudge',
] as const

/** Endless Pyramid: a new foe joins every 4 rounds, replacing the round-12 plateau. */
export function endlessFoes(round: number): string[] {
  const n = Math.min(
    ENDLESS_FOES.length,
    4 + Math.floor((Math.max(1, round) - 1) / 4),
  )
  return ENDLESS_FOES.slice(0, n)
}

/**
 * Endless Pyramid pressure past the old round-12 plateau: the board holds more
 * foes, they hop and drop faster, and the gremlin chance keeps growing.
 */
export function endlessPressure(round: number): {
  maxEnemies: number
  hopTrim: number
  dropTrim: number
  gremlinBonus: number
} {
  const extra = Math.max(0, Math.trunc(round) - 12)
  const tier = Math.floor(extra / 4)
  return {
    maxEnemies: Math.min(6, 4 + Math.floor((extra + 3) / 8)),
    hopTrim: Math.min(6, tier * 2),
    dropTrim: Math.min(50, tier * 10),
    gremlinBonus: Math.min(0.15, tier * 0.03),
  }
}

/** Pyramid height per round: the wide 8-row board remixes every 4th round. */
export function boardRows(round: number): number {
  return Math.trunc(round) % 4 === 0 ? 8 : 7
}

// --- hop combos -------------------------------------------------------------

export type HopCombo = 'stripe' | 'prism'

/**
 * Stripe: the landing cell completes a whole board row. `done` is per cell, in
 * `board.cells` order, and must already include the landing.
 */
export function stripeComplete(
  board: HopBoard,
  done: readonly boolean[],
  landed: HopCell,
): boolean {
  let any = false
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i]!
    if (cell.r !== landed.r) continue
    any = true
    if (!done[i]) return false
  }
  return any
}

/**
 * Prism: the landing cell finishes a 3-cube triangle, a cell with the two
 * neighbours it shares a face with (down-left pair, down-right pair, or the
 * pair above), all finished.
 */
export function prismComplete(
  board: HopBoard,
  done: readonly boolean[],
  landed: HopCell,
): boolean {
  const index = new Map<string, number>()
  board.cells.forEach((x, i) => index.set(cellKey(x.r, x.c), i))
  const ok = (r: number, c: number) => {
    const i = index.get(cellKey(r, c))
    return i !== undefined && !!done[i]
  }
  const { r, c } = landed
  if (!ok(r, c)) return false
  return (
    (ok(r + 1, c) && ok(r + 1, c + 1)) ||
    (ok(r - 1, c) && ok(r - 1, c - 1)) ||
    (ok(r, c - 1) && ok(r + 1, c)) ||
    (ok(r, c + 1) && ok(r + 1, c + 1))
  )
}

/** Speed Paint par in frames: a fixed budget per cube, so bigger boards allow longer. */
export function speedPaintPar(board: HopBoard, rule: HopRule): number {
  return board.cells.length * rule.steps * 22
}

export const speedPaintBonus = (frames: number, par: number): number =>
  frames > par ? 0 : Math.min(5000, Math.round(((par - frames) / par) * 5000))

// --- Skitter & Scoot sideways movement ---------------------------------------

/**
 * Skitter & Scoot slide along a row instead of hopping down the pyramid:
 * `side` -1 moves to the cube on the left of the same row, +1 to the right.
 * Null means the slide runs off the row's end.
 */
export function sidewaysStep(
  board: HopBoard,
  from: HopCell,
  side: -1 | 1,
): HopCell | null {
  const next = { r: from.r, c: from.c + side }
  return board.cells.some((x) => x.r === next.r && x.c === next.c) ? next : null
}

// --- rule demonstration intermission -----------------------------------------

/**
 * The intermission before a new rule: a scripted pair of hops on a 3-row
 * pyramid whose painted levels show what the rule does. Pure data; the
 * cabinet plays the hops back and draws the levels.
 */
export function ruleDemo(rule: HopRule): {
  board: HopBoard
  hops: HopCell[]
  levels: number[]
} {
  const board = pyramidBoard(3)
  const hops: HopCell[] = [
    { r: 1, c: 0 },
    { r: 1, c: 0 },
    { r: 1, c: 0 },
  ]
  const levels: number[] = []
  let level = 0
  for (let i = 0; i < hops.length; i++)
    levels.push((level = hopTile(rule, level)))
  return { board, hops, levels }
}

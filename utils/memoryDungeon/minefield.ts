/**
 * Memory Dungeon Minefield Archives (conductor memory-dungeon t-016;
 * projects/memory-dungeon/COMBAT-PATTERNS.md, "Minesweeper-style danger rooms").
 *
 * A rare challenge floor: clue numbers, flags, a safe route to the far door and
 * a limited number of exact-footprint disarms. Every floor is generated from a
 * seed and only kept when a deduction solver can clear it from the opening
 * reveal without one mandatory guess, so a careful player is never forced to
 * gamble. A wrong step costs a heart and shows the hazard; the floor stays
 * solvable from what the player now knows, so failure is recoverable.
 */

export type Cell = { row: number; col: number }

export type Tile = {
  hazard: boolean
  /** Hazards among the eight neighbours (shown once revealed). */
  clue: number
  revealed: boolean
  flagged: boolean
  /** A hazard stepped on (it cost a heart and is now visible). */
  sprung: boolean
  /** A hazard removed by a disarm; its neighbours' clues stay truthful. */
  disarmed: boolean
}

export type MinefieldEvent =
  | { type: 'reveal'; cells: Cell[] }
  | { type: 'flag'; cell: Cell; flagged: boolean }
  | { type: 'sprung'; cell: Cell; hearts: number }
  | { type: 'disarm'; cell: Cell; hazard: boolean; charges: number }
  | { type: 'exit' }
  | { type: 'defeat' }

export type MinefieldState = {
  version: 1
  seed: number
  rows: number
  cols: number
  hazards: number
  tiles: Tile[]
  entrance: Cell
  exit: Cell
  hearts: number
  disarms: number
  log: MinefieldEvent[]
  outcome: 'exploring' | 'escaped' | 'defeated'
}

/** Mulberry32, matching the combat engine's seeded draws. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const at = (cols: number, c: Cell) => c.row * cols + c.col
const cellOf = (cols: number, i: number): Cell => ({
  row: Math.floor(i / cols),
  col: i % cols,
})

export function neighbours(rows: number, cols: number, i: number): number[] {
  const { row, col } = cellOf(cols, i)
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && c >= 0 && r < rows && c < cols) out.push(r * cols + c)
    }
  return out
}

function layTiles(
  rows: number,
  cols: number,
  hazardCells: Set<number>,
): Tile[] {
  return Array.from({ length: rows * cols }, (_, i) => ({
    hazard: hazardCells.has(i),
    clue: neighbours(rows, cols, i).filter((n) => hazardCells.has(n)).length,
    revealed: false,
    flagged: false,
    sprung: false,
    disarmed: false,
  }))
}

/** Reveal from `start`, opening every zero-clue region it touches. */
function flood(state: MinefieldState, start: number): number[] {
  const opened: number[] = []
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const tile = state.tiles[i]!
    if (tile.revealed || tile.hazard) continue
    tile.revealed = true
    tile.flagged = false
    opened.push(i)
    if (tile.clue === 0)
      for (const n of neighbours(state.rows, state.cols, i)) stack.push(n)
  }
  return opened
}

type Board = {
  rows: number
  cols: number
  hazards: number
  /** 0 = unknown, 1 = known safe (revealed), 2 = known hazard. */
  known: Uint8Array
  /** Clue of a known-safe cell; never read for any other cell. */
  clueOf: (i: number) => number
}

/**
 * One round of the deductions a careful player can make from what is known:
 * single-clue counting, subset comparison between two clues, and exhaustive
 * enumeration of the frontier with the remaining hazard total. Reads clues of
 * known-safe cells only, so it never sees what a hidden cell holds.
 */
function deduce(board: Board): { safe: Set<number>; mines: Set<number> } {
  const { rows, cols, known, clueOf } = board
  const n = rows * cols
  const safe = new Set<number>()
  const mines = new Set<number>()
  type Rule = { cells: number[]; need: number }
  const rules: Rule[] = []
  for (let i = 0; i < n; i++) {
    if (known[i] !== 1) continue
    const ns = neighbours(rows, cols, i)
    const unknown = ns.filter((j) => known[j] === 0)
    if (!unknown.length) continue
    const need = clueOf(i) - ns.filter((j) => known[j] === 2).length
    rules.push({ cells: unknown, need })
    if (need === 0) unknown.forEach((j) => safe.add(j))
    if (need === unknown.length) unknown.forEach((j) => mines.add(j))
  }
  if (safe.size || mines.size) return { safe, mines }
  for (const a of rules)
    for (const b of rules) {
      if (a === b || a.cells.length >= b.cells.length) continue
      if (!a.cells.every((c) => b.cells.includes(c))) continue
      const rest = b.cells.filter((c) => !a.cells.includes(c))
      const need = b.need - a.need
      if (need === 0) rest.forEach((j) => safe.add(j))
      if (need === rest.length) rest.forEach((j) => mines.add(j))
    }
  if (safe.size || mines.size) return { safe, mines }

  // Every consistent hazard layout of the frontier, weighted by the ways to
  // place the remaining hazards among the hidden cells no clue touches.
  const frontier = [...new Set(rules.flatMap((r) => r.cells))]
  // Past this the enumeration is too slow for a page; such floors are rejected.
  if (frontier.length > 24) return { safe, mines }
  const onFrontier = new Set(frontier)
  const interior: number[] = []
  for (let i = 0; i < n; i++)
    if (known[i] === 0 && !onFrontier.has(i)) interior.push(i)
  const left = board.hazards - [...known].filter((k) => k === 2).length
  const pos = new Map(frontier.map((c, k) => [c, k]))
  const byCell = frontier.map((c) => rules.filter((r) => r.cells.includes(c)))
  const assign = new Int8Array(frontier.length).fill(-1)
  const mineWeight = new Array<number>(frontier.length).fill(0)
  let interiorWeight = 0
  let total = 0
  const binom = (a: number, b: number) => {
    if (b < 0 || b > a) return 0
    let r = 1
    for (let k = 1; k <= b; k++) r = (r * (a - b + k)) / k
    return r
  }
  const consistent = (k: number) => {
    for (const r of byCell[k]!) {
      let set = 0
      let open = 0
      for (const c of r.cells) {
        const v = assign[pos.get(c)!]!
        if (v === 1) set++
        else if (v === -1) open++
      }
      if (set > r.need || set + open < r.need) return false
    }
    return true
  }
  const walk = (k: number, placed: number) => {
    if (placed > left) return
    if (k === frontier.length) {
      const rest = left - placed
      const ways = binom(interior.length, rest)
      if (!ways) return
      total += ways
      for (let j = 0; j < frontier.length; j++)
        if (assign[j] === 1) mineWeight[j] = (mineWeight[j] ?? 0) + ways
      if (interior.length) interiorWeight += (ways * rest) / interior.length
      return
    }
    for (const v of [0, 1]) {
      assign[k] = v
      if (consistent(k)) walk(k + 1, placed + v)
    }
    assign[k] = -1
  }
  walk(0, 0)
  if (!total) return { safe, mines }
  frontier.forEach((c, j) => {
    if (mineWeight[j] === 0) safe.add(c)
    if (mineWeight[j] === total) mines.add(c)
  })
  if (interior.length && interiorWeight === 0)
    interior.forEach((c) => safe.add(c))
  if (interior.length && Math.abs(interiorWeight - total) < 1e-9)
    interior.forEach((c) => mines.add(c))
  return { safe, mines }
}

/** What the player can see: revealed cells are safe, sprung or disarmed ones are hazards. Flags are not trusted. */
function visibleBoard(state: MinefieldState): Board {
  const known = new Uint8Array(state.rows * state.cols)
  state.tiles.forEach((t, i) => {
    if (t.revealed) known[i] = 1
    else if (t.sprung || t.disarmed) known[i] = 2
  })
  return {
    rows: state.rows,
    cols: state.cols,
    hazards: state.hazards,
    known,
    clueOf: (i) => state.tiles[i]!.clue,
  }
}

/**
 * Cells the player can prove from what is on screen: safe cells to step on and
 * hazards to flag or disarm. Powers the hint button and the careful-player tests.
 */
export function provenCells(state: MinefieldState): {
  safe: Cell[]
  hazards: Cell[]
} {
  const board = visibleBoard(state)
  const hazards = new Set<number>()
  for (;;) {
    const { safe, mines } = deduce(board)
    for (const m of mines) {
      board.known[m] = 2
      hazards.add(m)
    }
    if (safe.size || !mines.size)
      return {
        safe: [...safe].map((i) => cellOf(state.cols, i)),
        hazards: [...hazards].map((i) => cellOf(state.cols, i)),
      }
  }
}

/**
 * The no-guess check: from what is revealed, apply `deduce` round after round,
 * revealing every proven-safe cell (zero clues open their neighbours, as in
 * play), until the floor is clear or nothing more can be proven. `rounds` is a
 * rough difficulty measure.
 */
export function solveWithoutGuessing(state: MinefieldState): {
  solved: boolean
  rounds: number
  safeLeft: number
} {
  const board = visibleBoard(state)
  const { rows, cols, known } = board
  const safeTotal = rows * cols - state.hazards
  const reveal = (i: number) => {
    const stack = [i]
    while (stack.length) {
      const j = stack.pop()!
      if (known[j] === 1) continue
      if (state.tiles[j]!.hazard)
        throw new Error('solver proved a hazard safe: deduction bug')
      known[j] = 1
      if (state.tiles[j]!.clue === 0)
        for (const m of neighbours(rows, cols, j)) stack.push(m)
    }
  }
  let rounds = 0
  for (;;) {
    rounds++
    const { safe, mines } = deduce(board)
    for (const m of mines) known[m] = 2
    for (const s of safe) reveal(s)
    const safeLeft = safeTotal - [...known].filter((k) => k === 1).length
    if (!safeLeft) return { solved: true, rounds, safeLeft }
    if (!safe.size && !mines.size) return { solved: false, rounds, safeLeft }
  }
}

function blank(
  seed: number,
  rows: number,
  cols: number,
  hazards: number,
  hazardCells: Set<number>,
  entrance: Cell,
  exit: Cell,
  options: { hearts: number; disarms: number },
): MinefieldState {
  return {
    version: 1,
    seed,
    rows,
    cols,
    hazards,
    tiles: layTiles(rows, cols, hazardCells),
    entrance,
    exit,
    hearts: options.hearts,
    disarms: options.disarms,
    log: [],
    outcome: 'exploring',
  }
}

/**
 * A no-guess floor. The entrance (top-left) and its neighbours are always
 * clear so the opening reveal gives real information, and the exit door
 * (bottom-right) is clear. Draws are retried from the seed until the solver
 * clears the floor; the attempt that worked is recorded in `seed`.
 */
export function createMinefield(options: {
  seed: number
  rows: number
  cols: number
  hazards: number
  hearts?: number
  disarms?: number
  maxAttempts?: number
}): MinefieldState {
  const { rows, cols, hazards } = options
  const entrance = { row: 0, col: 0 }
  const exit = { row: rows - 1, col: cols - 1 }
  const keepClear = new Set([
    at(cols, entrance),
    ...neighbours(rows, cols, at(cols, entrance)),
    at(cols, exit),
  ])
  const extra = { hearts: options.hearts ?? 3, disarms: options.disarms ?? 2 }
  for (let attempt = 0; attempt < (options.maxAttempts ?? 500); attempt++) {
    const seed = options.seed * 1009 + attempt
    const rand = seededRandom(seed)
    const pool: number[] = []
    for (let i = 0; i < rows * cols; i++) if (!keepClear.has(i)) pool.push(i)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
    }
    const state = blank(
      seed,
      rows,
      cols,
      hazards,
      new Set(pool.slice(0, hazards)),
      entrance,
      exit,
      extra,
    )
    state.log.push({
      type: 'reveal',
      cells: flood(state, at(cols, entrance)).map((i) => cellOf(cols, i)),
    })
    if (solveWithoutGuessing(state).solved) return state
  }
  throw new Error(
    `no guess-free ${rows}x${cols} floor with ${hazards} hazards in the attempt budget`,
  )
}

function clone(state: MinefieldState): MinefieldState {
  return {
    ...state,
    tiles: state.tiles.map((t) => ({ ...t })),
    log: [...state.log],
  }
}

function checkExit(next: MinefieldState) {
  if (next.tiles[at(next.cols, next.exit)]!.revealed) {
    next.outcome = 'escaped'
    next.log.push({ type: 'exit' })
  }
}

/** Step onto a cell. A hazard costs a heart and stays visible; play goes on. */
export function step(state: MinefieldState, cell: Cell): MinefieldState {
  if (state.outcome !== 'exploring') return state
  const i = at(state.cols, cell)
  const tile = state.tiles[i]
  if (!tile || tile.revealed || tile.flagged || tile.sprung || tile.disarmed)
    return state
  const next = clone(state)
  if (tile.hazard) {
    next.tiles[i]!.sprung = true
    next.hearts--
    next.log.push({ type: 'sprung', cell, hearts: next.hearts })
    if (next.hearts <= 0) {
      next.outcome = 'defeated'
      next.log.push({ type: 'defeat' })
    }
    return next
  }
  next.log.push({
    type: 'reveal',
    cells: flood(next, i).map((j) => cellOf(next.cols, j)),
  })
  checkExit(next)
  return next
}

/** Toggle a flag on a hidden cell (a note to self; it never checks the answer). */
export function toggleFlag(state: MinefieldState, cell: Cell): MinefieldState {
  const tile = state.tiles[at(state.cols, cell)]
  if (state.outcome !== 'exploring' || !tile || tile.revealed || tile.sprung)
    return state
  const next = clone(state)
  const t = next.tiles[at(next.cols, cell)]!
  t.flagged = !t.flagged
  next.log.push({ type: 'flag', cell, flagged: t.flagged })
  return next
}

/**
 * Disarm exactly one hidden cell. A hazard there is removed for good; a safe
 * cell is revealed instead. Either way the charge is spent, so disarming is for
 * a cell the player has proven, not a free probe.
 */
export function disarm(state: MinefieldState, cell: Cell): MinefieldState {
  const i = at(state.cols, cell)
  const tile = state.tiles[i]
  if (
    state.outcome !== 'exploring' ||
    state.disarms <= 0 ||
    !tile ||
    tile.revealed ||
    tile.sprung ||
    tile.disarmed
  )
    return state
  const next = clone(state)
  next.disarms--
  next.log.push({
    type: 'disarm',
    cell,
    hazard: tile.hazard,
    charges: next.disarms,
  })
  if (tile.hazard) {
    next.tiles[i]!.disarmed = true
    next.tiles[i]!.flagged = false
  } else {
    next.log.push({
      type: 'reveal',
      cells: flood(next, i).map((j) => cellOf(next.cols, j)),
    })
    checkExit(next)
  }
  return next
}

const COLUMN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Spoken coordinate, "C4": columns are letters, rows count from 1. */
export function coordinate(cell: Cell): string {
  return `${COLUMN[cell.col]}${cell.row + 1}`
}

/**
 * What a screen reader announces for a cell, from player-visible state only:
 * a hidden cell never leaks whether it holds a hazard.
 */
export function describeCell(state: MinefieldState, cell: Cell): string {
  const tile = state.tiles[at(state.cols, cell)]
  if (!tile) return `${coordinate(cell)}: off the floor`
  const where = coordinate(cell)
  const door =
    cell.row === state.exit.row && cell.col === state.exit.col
      ? ', the far door'
      : ''
  if (tile.sprung) return `${where}: sprung hazard${door}`
  if (tile.disarmed) return `${where}: disarmed hazard${door}`
  if (tile.revealed)
    return `${where}: ${tile.clue ? `${tile.clue} hazard${tile.clue === 1 ? '' : 's'} nearby` : 'clear, nothing nearby'}${door}`
  return `${where}: hidden${tile.flagged ? ', flagged' : ''}${door}`
}

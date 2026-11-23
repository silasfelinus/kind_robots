/** Hex bubble topology and deterministic cascade rules for Superkate's Spectrum. */
export const COLS = 10
export const ROWS = 15
export const COLORS = ['pink', 'teal', 'gold', 'violet', 'blue', 'lime'] as const
export type Hue = (typeof COLORS)[number]
export type Cell = Hue | null
export type Board = Cell[][]
export type Position = { row: number; col: number }
export const inBounds = (row: number, col: number) =>
  row >= 0 && row < ROWS && col >= 0 && col < COLS
export const center = ({ row, col }: Position) => ({
  x: 22 + col * 28 + (row % 2) * 14,
  y: 40 + row * 24,
})
export function neighbors({ row, col }: Position): Position[] {
  const shift = row % 2 === 0 ? -1 : 1
  return [
    { row, col: col - 1 },
    { row, col: col + 1 },
    { row: row - 1, col },
    { row: row - 1, col: col + shift },
    { row: row + 1, col },
    { row: row + 1, col: col + shift },
  ].filter((p) => inBounds(p.row, p.col))
}
export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}
export function makeBoard(stage: number, rng: () => number): Board {
  const board = emptyBoard()
  const rows = Math.min(5 + Math.floor((stage - 1) / 4), 9)
  const palette = Math.min(3 + Math.floor((stage - 1) / 5), COLORS.length)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      if ((row + col * 7 + stage) % 17 === 0) continue
      board[row]![col] = COLORS[Math.floor(rng() * palette)]!
    }
  }
  return board
}
function flood(
  board: Board,
  starts: Position[],
  predicate: (p: Position) => boolean,
): Position[] {
  const visited = new Set<string>()
  const found: Position[] = []
  const queue = [...starts]
  while (queue.length) {
    const p = queue.shift()!
    const key = `${p.row}:${p.col}`
    if (visited.has(key) || !predicate(p)) continue
    visited.add(key)
    found.push(p)
    queue.push(...neighbors(p))
  }
  return found
}
export function activeHues(board: Board): Hue[] {
  return COLORS.filter((color) => board.some((row) => row.includes(color)))
}
export function chooseHue(board: Board, rng: () => number): Hue {
  const hues = activeHues(board)
  return hues[Math.floor(rng() * hues.length)] ?? COLORS[0]
}
export function nearestSnap(
  board: Board,
  point: { x: number; y: number },
): Position | null {
  let best: Position | null = null
  let distance = Infinity
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row]![col] !== null) continue
      const p = { row, col }
      if (row !== 0 && !neighbors(p).some((n) => board[n.row]![n.col]))
        continue
      const c = center(p)
      const d = (c.x - point.x) ** 2 + (c.y - point.y) ** 2
      if (d < distance) {
        best = p
        distance = d
      }
    }
  }
  return best
}
export type PopResult = {
  matched: number
  dropped: number
  cleared: boolean
}
export function attachAndPop(
  board: Board,
  position: Position,
  hue: Hue,
): PopResult {
  if (!inBounds(position.row, position.col) || board[position.row]![position.col])
    return { matched: 0, dropped: 0, cleared: false }
  board[position.row]![position.col] = hue
  const cluster = flood(
    board,
    [position],
    (p) => board[p.row]![p.col] === hue,
  )
  if (cluster.length < 3) return { matched: 0, dropped: 0, cleared: false }
  for (const p of cluster) board[p.row]![p.col] = null
  const anchored = new Set(
    flood(
      board,
      Array.from({ length: COLS }, (_, col) => ({ row: 0, col })),
      (p) => board[p.row]![p.col] !== null,
    ).map((p) => `${p.row}:${p.col}`),
  )
  let dropped = 0
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row]![col] && !anchored.has(`${row}:${col}`)) {
        board[row]![col] = null
        dropped++
      }
    }
  }
  return { matched: cluster.length, dropped, cleared: !activeHues(board).length }
}
export function pushCeiling(board: Board, rng: () => number): boolean {
  const overflow = board[ROWS - 1]!.some(Boolean)
  const hues = activeHues(board)
  for (let row = ROWS - 1; row > 0; row--) board[row] = [...board[row - 1]!]
  board[0] = Array.from(
    { length: COLS },
    () => hues[Math.floor(rng() * hues.length)] ?? COLORS[0],
  )
  return overflow
}

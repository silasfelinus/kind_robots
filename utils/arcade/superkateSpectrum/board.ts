/** Hex bubble topology and deterministic cascade rules for Superkate's Spectrum. */
export const COLS = 10
export const ROWS = 15
export const COLORS = [
  'pink',
  'teal',
  'gold',
  'violet',
  'blue',
  'lime',
] as const
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
/** All thirty Story boards are authored, with five distinct puzzles per district. */
export const STORY_LAYOUTS: readonly (readonly string[])[] = [
  // Rainbow Salon: three-color matching lessons.
  ['ppppttttgg', 'pp..tt..gg', 'p...t...g.'],
  ['ppptttgggp', '.p.t.g.p..', 'pp..tt..gg', '..g...p...'],
  ['ppttggpptt', 'pp..tt..gg', '.pggp..tt.', 'g..t..p..g'],
  ['ptgptgptgp', 'ptgptgptgp', 'ppptttgggp', '..p..t..g.', '..gg..pp..'],
  [
    'ppggttppgg',
    'pp..gg..tt',
    'tpg..ptg..',
    '.ggttggtt.',
    'pp..tt..gg',
    '...p..t...',
  ],
  // Botanic Dome
  ['llppttggvv', 'llppttggvv', '.llpttgvv.', '..llttvv..', '...llvv...'],
  [
    'ppggvvttll',
    'ppggvvttll',
    '.pggvvttl.',
    '..gg..ll..',
    '..gg..ll..',
    '...g..l...',
  ],
  [
    'llttppggvv',
    'llttppggvv',
    '..ttppgg..',
    '..vvppgg..',
    '...vppg...',
    '....pp....',
    '....pp....',
  ],
  [
    'vvllggttpp',
    'vvllggttpp',
    'vv..gg..pp',
    '.v..gg..p.',
    '..llggtt..',
    '..llggtt..',
    '...lgt....',
  ],
  [
    'llppvvggtt',
    'llppvvggtt',
    'llpp..ggtt',
    '.lpp..ggt.',
    '..ppvvgg..',
    '..ppvvgg..',
    '...pvv....',
    '....vv....',
  ],
  // Night Market
  [
    'bbppvvggtt',
    'bbppvvggtt',
    '..ppvvgg..',
    '...pvg....',
    '..ttvvbb..',
    '..ttvvbb..',
  ],
  [
    'ttbbppvvgg',
    'ttbbppvvgg',
    'tt..pp..gg',
    'tt..pp..gg',
    '.tbbppvvg.',
    '..bb..vv..',
    '..bb..vv..',
  ],
  [
    'ggvvbbpptt',
    'ggvvbbpptt',
    '.gvvbbppt.',
    '..vv..pp..',
    '..vv..pp..',
    '.tbb..ggv.',
    'ttbb..ggvv',
  ],
  [
    'bbttvvggpp',
    'bbttvvggpp',
    'bbtt..ggpp',
    '.btt..ggp.',
    '..ttvvgg..',
    '..ppvvbb..',
    '..ppvvbb..',
    '...pvvb...',
  ],
  [
    'vvggbbttpp',
    'vvggbbttpp',
    'vvggbbttpp',
    '.vggbbttp.',
    '..ggbbtt..',
    '..vvbbpp..',
    '...vbbp...',
    '....bb....',
  ],
  // Cloud Library
  [
    'llbbppttgg',
    'llbbppttgg',
    'llbb..ttgg',
    '..bbvvtt..',
    '..bbvvtt..',
    '...bvv....',
    '....vv....',
  ],
  [
    'ppvvllbbgg',
    'ppvvllbbgg',
    'pp..ll..gg',
    '.p..ll..g.',
    '..ttllbb..',
    '..ttllbb..',
    '...t..b...',
  ],
  [
    'bbggttllvv',
    'bbggttllvv',
    'bbggttllvv',
    '.bgg..llv.',
    '..ggppvv..',
    '..ggppvv..',
    '...gppv...',
    '....pp....',
  ],
  [
    'ttllbbvvpp',
    'ttllbbvvpp',
    'ttllbbvvpp',
    '..ll..vv..',
    '..llggvv..',
    '..bbggpp..',
    '...bggp...',
    '....gg....',
  ],
  [
    'ggppvvllbb',
    'ggppvvllbb',
    'ggppvvllbb',
    'gg..vv..bb',
    '.gttvvttb.',
    '..ttvvtt..',
    '...tvvt...',
    '....vv....',
  ],
  // Prism Workshop
  [
    'ppggbbvvll',
    'ppggbbvvll',
    'ppggbbvvll',
    '.pggbbvvl.',
    '..ttbbtt..',
    '..ttbbtt..',
    '...tbbt...',
  ],
  [
    'vvbbllpptt',
    'vvbbllpptt',
    'vvbb..pptt',
    '..bbggpp..',
    '..bbggpp..',
    '..llggvv..',
    '...lggv...',
  ],
  [
    'llttvvbbgg',
    'llttvvbbgg',
    'llttvvbbgg',
    '.ltt..bbg.',
    '..ttppbb..',
    '..ggppvv..',
    '..ggppvv..',
    '...gpv....',
  ],
  [
    'bbllggpptt',
    'bbllggpptt',
    'bbllggpptt',
    '.bllggppt.',
    '..llvvpp..',
    '..llvvpp..',
    '...lvvp...',
    '....vv....',
  ],
  [
    'ppvvttggbb',
    'ppvvttggbb',
    'ppvvttggbb',
    'ppvv..ggbb',
    '.pvvllggb.',
    '..vvllgg..',
    '..bbllpp..',
    '...bllp...',
    '....ll....',
  ],
  // Heart of the Hue
  [
    'llggppttbb',
    'llggppttbb',
    'llggppttbb',
    '.lgg..ttb.',
    '..ggvvtt..',
    '..ppvvbb..',
    '..ppvvbb..',
    '...pvvb...',
  ],
  [
    'vvttbbllpp',
    'vvttbbllpp',
    'vvttbbllpp',
    'vvtt..llpp',
    '.vttggllp.',
    '..ttggll..',
    '..bbggpp..',
    '...bggp...',
  ],
  [
    'ggbbllvvtt',
    'ggbbllvvtt',
    'ggbbllvvtt',
    'ggbb..vvtt',
    '.gbbppvvt.',
    '..bbppvv..',
    '..llpptt..',
    '..llpptt..',
    '...lpt....',
  ],
  [
    'ttppggbbvv',
    'ttppggbbvv',
    'ttppggbbvv',
    'ttppggbbvv',
    '.tpp..bbv.',
    '..ppllbb..',
    '..ggllvv..',
    '...gllv...',
    '....ll....',
  ],
  [
    'ppttggvvbb',
    'ppttggvvbb',
    'ppttggvvbb',
    'ppttggvvbb',
    '.pttllvvb.',
    '..ttllvv..',
    '..ggllbb..',
    '...gllb...',
    '....ll....',
  ],
]
const STORY_HUES: Record<string, Hue> = {
  p: 'pink',
  t: 'teal',
  g: 'gold',
  v: 'violet',
  b: 'blue',
  l: 'lime',
}

/** A board drawn from text rows (p t g v b l for the six hues, '.' empty), as the Story layouts are. */
export function layoutBoard(rows: readonly string[]): Board {
  const board = emptyBoard()
  rows.forEach((line, row) => {
    for (let col = 0; col < COLS; col++)
      board[row]![col] = STORY_HUES[line[col] ?? '.'] ?? null
  })
  return board
}

export function makeBoard(
  stage: number,
  rng: () => number,
  mode: 'story' | 'classic' = 'story',
): Board {
  const board = emptyBoard()
  const layout = mode === 'story' ? STORY_LAYOUTS[stage - 1] : null
  if (layout) {
    layout.forEach((line, row) => {
      for (let col = 0; col < COLS; col++) {
        board[row]![col] = STORY_HUES[line[col] ?? '.'] ?? null
      }
    })
    return board
  }
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
      if (row !== 0 && !neighbors(p).some((n) => board[n.row]![n.col])) continue
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
  if (
    !inBounds(position.row, position.col) ||
    board[position.row]![position.col]
  )
    return { matched: 0, dropped: 0, cleared: false }
  board[position.row]![position.col] = hue
  const cluster = flood(board, [position], (p) => board[p.row]![p.col] === hue)
  if (cluster.length < 3) return { matched: 0, dropped: 0, cleared: false }
  for (const p of cluster) board[p.row]![p.col] = null
  const dropped = detachUnanchored(board)
  return {
    matched: cluster.length,
    dropped,
    cleared: !activeHues(board).length,
  }
}

/** Special spheres are earned, never purchased; Classic keeps ordinary matching. */
export type SpectrumPower = 'prism' | 'burst' | 'ribbon'
export function detachUnanchored(board: Board): number {
  const anchored = new Set(
    flood(
      board,
      Array.from({ length: COLS }, (_, col) => ({ row: 0, col })),
      (p) => board[p.row]![p.col] !== null,
    ).map((p) => `${p.row}:${p.col}`),
  )
  let removed = 0
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row]![col] && !anchored.has(`${row}:${col}`)) {
        board[row]![col] = null
        removed++
      }
    }
  }
  return removed
}
export function fireSpecial(
  board: Board,
  position: Position,
  hue: Hue,
  power: SpectrumPower,
): PopResult {
  if (
    !inBounds(position.row, position.col) ||
    board[position.row]![position.col]
  )
    return { matched: 0, dropped: 0, cleared: false }
  if (power === 'prism') {
    const options = neighbors(position)
      .map((p) => board[p.row]![p.col])
      .filter((color): color is Hue => color !== null)
    const preferred =
      options
        .map((color) => ({
          color,
          size: flood(
            board,
            neighbors(position),
            (p) => board[p.row]![p.col] === color,
          ).length,
        }))
        .sort((a, b) => b.size - a.size)[0]?.color ?? hue
    return attachAndPop(board, position, preferred)
  }
  board[position.row]![position.col] = hue
  const hit =
    power === 'burst'
      ? [position, ...neighbors(position)]
      : Array.from({ length: COLS }, (_, col) => ({
          row: position.row,
          col,
        }))
  let matched = 0
  for (const p of hit) {
    if (!board[p.row]![p.col]) continue
    board[p.row]![p.col] = null
    matched++
  }
  const dropped = detachUnanchored(board)
  return { matched, dropped, cleared: !activeHues(board).length }
}
export const CHAPTER_RULES = [
  { label: 'MATCH THREE', limit: 9, charge: 22 },
  { label: 'MATCHES HOLD THE CEILING', limit: 6, charge: 22 },
  { label: 'BANK MATCHES BONUS +400', limit: 7, charge: 22 },
  { label: 'DROP THREE TO RELIEVE PRESSURE', limit: 6, charge: 22 },
  { label: 'RAPID PRISM BURST RIBBON', limit: 6, charge: 12 },
  { label: 'BIG CHAINS HOLD THE CEILING', limit: 5, charge: 22 },
] as const

export function chapterIndex(stage: number): number {
  return Math.max(0, Math.min(5, Math.floor((stage - 1) / 5)))
}

export function pressureLimit(
  stage: number,
  mode: 'story' | 'classic',
): number {
  return mode === 'classic'
    ? Math.max(4, 9 - Math.floor(stage / 5))
    : CHAPTER_RULES[chapterIndex(stage)]!.limit
}

export function pressureAfterShot(
  current: number,
  stage: number,
  mode: 'story' | 'classic',
  result: PopResult,
  banked: boolean,
): number {
  if (mode === 'classic') return current + 1
  switch (chapterIndex(stage)) {
    case 1:
      return current + (result.matched > 0 ? 0 : 1)
    case 2:
      return current + (banked && result.matched > 0 ? 0 : 1)
    case 3:
      return result.dropped >= 3 ? Math.max(0, current - 1) : current + 1
    case 5:
      return current + (result.matched >= 6 || result.dropped >= 3 ? 0 : 1)
    default:
      return current + 1
  }
}

export function specialForStage(
  stage: number,
  rank: number,
  count: number,
): SpectrumPower {
  if (chapterIndex(stage) === 4)
    return (['prism', 'burst', 'ribbon'] as const)[count % 3]!
  return rank >= 15 ? 'ribbon' : rank >= 9 ? 'burst' : 'prism'
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

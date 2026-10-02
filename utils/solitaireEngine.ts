// /utils/solitaireEngine.ts
//
// Pure, DB-free, seedable Klondike engine (kr-solitaire/t-004). No UI, no
// network, no randomness other than the seed: the same seed + draw mode always
// deals the same game, which is what the daily deal (t-009) relies on.
//
// Cards are integers 0..51: suit = floor(id / 13), rank = id % 13 + 1 (A=1..K=13).
// Suits 0/3 are black (spades, clubs), 1/2 red (hearts, diamonds).

export type DrawCount = 1 | 3
export interface TableauCard {
  id: number
  up: boolean
}
export interface SolitaireState {
  seed: string
  drawCount: DrawCount
  stock: number[] // top of stock is the END of the array
  waste: number[] // top of waste is the END of the array
  foundations: number[][] // index = suit; each pile is ranks ascending
  tableau: TableauCard[][] // 7 columns; last card is the playable one
  moves: number
}

export type SolitaireMove =
  | { type: 'draw' }
  | { type: 'waste-to-tableau'; to: number }
  | { type: 'waste-to-foundation' }
  | { type: 'tableau-to-tableau'; from: number; index: number; to: number }
  | { type: 'tableau-to-foundation'; from: number }
  | { type: 'foundation-to-tableau'; suit: number; to: number }

export const SUIT_COUNT = 4
export const RANKS_PER_SUIT = 13
export const DECK_SIZE = 52
export const TABLEAU_COLUMNS = 7

export const suitOf = (id: number): number => Math.floor(id / RANKS_PER_SUIT)
export const rankOf = (id: number): number => (id % RANKS_PER_SUIT) + 1
export const isRed = (id: number): boolean => {
  const s = suitOf(id)
  return s === 1 || s === 2
}

// ---- seeded shuffle --------------------------------------------------------

function hashSeed(seed: string): number {
  // FNV-1a, 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffledDeck(seed: string): number[] {
  const deck = Array.from({ length: DECK_SIZE }, (_, i) => i)
  const rand = mulberry32(hashSeed(seed))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// ---- setup -----------------------------------------------------------------

export function newGame(
  seed: string,
  drawCount: DrawCount = 1,
): SolitaireState {
  const deck = shuffledDeck(seed)
  const tableau: TableauCard[][] = []
  let at = 0
  for (let col = 0; col < TABLEAU_COLUMNS; col++) {
    const pile: TableauCard[] = []
    for (let row = 0; row <= col; row++) {
      pile.push({ id: deck[at++], up: row === col })
    }
    tableau.push(pile)
  }
  return {
    seed,
    drawCount,
    stock: deck.slice(at).reverse(),
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    moves: 0,
  }
}

export function cloneState(s: SolitaireState): SolitaireState {
  return {
    ...s,
    stock: s.stock.slice(),
    waste: s.waste.slice(),
    foundations: s.foundations.map((p) => p.slice()),
    tableau: s.tableau.map((p) => p.map((c) => ({ ...c }))),
  }
}

// ---- legality --------------------------------------------------------------

function canPlaceOnTableau(id: number, col: TableauCard[]): boolean {
  if (col.length === 0) return rankOf(id) === 13
  const top = col[col.length - 1]
  if (!top.up) return false
  return rankOf(top.id) === rankOf(id) + 1 && isRed(top.id) !== isRed(id)
}

function canPlaceOnFoundation(id: number, s: SolitaireState): boolean {
  return s.foundations[suitOf(id)].length === rankOf(id) - 1
}

export function isLegal(s: SolitaireState, m: SolitaireMove): boolean {
  switch (m.type) {
    case 'draw':
      return s.stock.length > 0 || s.waste.length > 0
    case 'waste-to-tableau': {
      const col = s.tableau[m.to]
      const id = s.waste[s.waste.length - 1]
      return !!col && id !== undefined && canPlaceOnTableau(id, col)
    }
    case 'waste-to-foundation': {
      const id = s.waste[s.waste.length - 1]
      return id !== undefined && canPlaceOnFoundation(id, s)
    }
    case 'tableau-to-tableau': {
      const from = s.tableau[m.from]
      const to = s.tableau[m.to]
      if (!from || !to || m.from === m.to) return false
      const card = from[m.index]
      if (!card || !card.up) return false
      return canPlaceOnTableau(card.id, to)
    }
    case 'tableau-to-foundation': {
      const from = s.tableau[m.from]
      const card = from?.[from.length - 1]
      return !!card && card.up && canPlaceOnFoundation(card.id, s)
    }
    case 'foundation-to-tableau': {
      const pile = s.foundations[m.suit]
      const col = s.tableau[m.to]
      if (!pile || !col || pile.length === 0) return false
      return canPlaceOnTableau(m.suit * RANKS_PER_SUIT + pile.length - 1, col)
    }
  }
}

function flipTop(col: TableauCard[]): void {
  const top = col[col.length - 1]
  if (top && !top.up) top.up = true
}

/** Applies a move to a copy of the state. Returns null when the move is illegal. */
export function applyMove(
  s: SolitaireState,
  m: SolitaireMove,
): SolitaireState | null {
  if (!isLegal(s, m)) return null
  const n = cloneState(s)
  n.moves++
  switch (m.type) {
    case 'draw': {
      if (n.stock.length === 0) {
        n.stock = n.waste.reverse()
        n.waste = []
      } else {
        for (let i = 0; i < n.drawCount && n.stock.length > 0; i++) {
          n.waste.push(n.stock.pop() as number)
        }
      }
      break
    }
    case 'waste-to-tableau':
      n.tableau[m.to].push({ id: n.waste.pop() as number, up: true })
      break
    case 'waste-to-foundation': {
      const id = n.waste.pop() as number
      n.foundations[suitOf(id)].push(id)
      break
    }
    case 'tableau-to-tableau': {
      const moved = n.tableau[m.from].splice(m.index)
      n.tableau[m.to].push(...moved)
      flipTop(n.tableau[m.from])
      break
    }
    case 'tableau-to-foundation': {
      const card = n.tableau[m.from].pop() as TableauCard
      n.foundations[suitOf(card.id)].push(card.id)
      flipTop(n.tableau[m.from])
      break
    }
    case 'foundation-to-tableau': {
      const id = n.foundations[m.suit].pop() as number
      n.tableau[m.to].push({ id, up: true })
      break
    }
  }
  return n
}

/** Every legal move, minus no-op shuffles of a whole king column between empty columns. */
export function legalMoves(s: SolitaireState): SolitaireMove[] {
  const out: SolitaireMove[] = []
  if (isLegal(s, { type: 'draw' })) out.push({ type: 'draw' })
  if (isLegal(s, { type: 'waste-to-foundation' }))
    out.push({ type: 'waste-to-foundation' })
  for (let to = 0; to < TABLEAU_COLUMNS; to++) {
    const m: SolitaireMove = { type: 'waste-to-tableau', to }
    if (isLegal(s, m)) out.push(m)
  }
  for (let from = 0; from < TABLEAU_COLUMNS; from++) {
    const col = s.tableau[from]
    const t: SolitaireMove = { type: 'tableau-to-foundation', from }
    if (isLegal(s, t)) out.push(t)
    for (let index = 0; index < col.length; index++) {
      if (!col[index].up) continue
      for (let to = 0; to < TABLEAU_COLUMNS; to++) {
        if (to === from) continue
        const m: SolitaireMove = { type: 'tableau-to-tableau', from, index, to }
        if (!isLegal(s, m)) continue
        if (index === 0 && s.tableau[to].length === 0) continue
        out.push(m)
      }
    }
  }
  for (let suit = 0; suit < SUIT_COUNT; suit++) {
    for (let to = 0; to < TABLEAU_COLUMNS; to++) {
      const m: SolitaireMove = { type: 'foundation-to-tableau', suit, to }
      if (isLegal(s, m)) out.push(m)
    }
  }
  return out
}

// ---- win / auto-complete ---------------------------------------------------

export function isWon(s: SolitaireState): boolean {
  return s.foundations.every((p) => p.length === RANKS_PER_SUIT)
}

/** True once every remaining card is face-up and reachable without drawing. */
export function canAutoComplete(s: SolitaireState): boolean {
  if (isWon(s)) return false
  return (
    s.stock.length === 0 &&
    s.waste.length === 0 &&
    s.tableau.every((col) => col.every((c) => c.up))
  )
}

/** One foundation move that auto-complete would make next, or null. */
export function nextAutoCompleteMove(s: SolitaireState): SolitaireMove | null {
  for (let from = 0; from < TABLEAU_COLUMNS; from++) {
    const m: SolitaireMove = { type: 'tableau-to-foundation', from }
    if (isLegal(s, m)) return m
  }
  return null
}

// ---- undo log --------------------------------------------------------------

export interface SolitaireGame {
  state: SolitaireState
  history: SolitaireState[]
}

export function startGame(
  seed: string,
  drawCount: DrawCount = 1,
): SolitaireGame {
  return { state: newGame(seed, drawCount), history: [] }
}

/** Plays a move, recording it for undo. Returns false (and changes nothing) if illegal. */
export function play(g: SolitaireGame, m: SolitaireMove): boolean {
  const next = applyMove(g.state, m)
  if (!next) return false
  g.history.push(g.state)
  g.state = next
  return true
}

export function undo(g: SolitaireGame): boolean {
  const prev = g.history.pop()
  if (!prev) return false
  g.state = prev
  return true
}

// ---- bounded solver (tests and the daily-deal picker) ----------------------

function stateKey(s: SolitaireState): string {
  return (
    s.stock.join(',') +
    '|' +
    s.waste.join(',') +
    '|' +
    s.foundations.map((p) => p.length).join(',') +
    '|' +
    s.tableau
      .map((c) => c.map((x) => (x.up ? x.id : -1 - x.id)).join('.'))
      .join('/')
  )
}

/**
 * Depth-first search with a visited set and a node budget. `true` means a win
 * was found; `false` means none was found within the budget (NOT a proof of
 * unsolvability).
 */
export function solveWithin(start: SolitaireState, maxNodes = 20000): boolean {
  const seen = new Set<string>()
  let nodes = 0
  const stack: SolitaireState[] = [start]
  while (stack.length && nodes < maxNodes) {
    const s = stack.pop() as SolitaireState
    const key = stateKey(s)
    if (seen.has(key)) continue
    seen.add(key)
    nodes++
    if (isWon(s)) return true
    // foundation-to-tableau is never needed to find a win quickly; skipping it
    // keeps the search small.
    const moves = legalMoves(s).filter(
      (m) => m.type !== 'foundation-to-tableau',
    )
    // Push least-promising first so promising moves (foundation) pop first.
    const weight = (m: SolitaireMove): number =>
      m.type === 'draw' ? 0 : m.type === 'tableau-to-tableau' ? 1 : 2
    moves.sort((a, b) => weight(a) - weight(b))
    for (const m of moves) {
      const n = applyMove(s, m)
      if (n) stack.push(n)
    }
  }
  return false
}

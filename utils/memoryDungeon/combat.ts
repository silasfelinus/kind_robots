/**
 * Memory Dungeon spatial weapon combat (conductor memory-dungeon t-006;
 * projects/memory-dungeon/COMBAT-PATTERNS.md, "Scout, Commit, Resolve").
 *
 * Pure, seeded and serializable: the board, the player's tools and the
 * enemy's telegraphed intent live in one state object, every action appends
 * to an event log, and the same seed and actions replay exactly. No identity
 * is ever exposed by a preview; a strike reveals only the cells of a mask the
 * player could see before committing.
 *
 * Two ways to attack on the same board:
 * - Scout: flip one card, then a second chosen after seeing the first (the
 *   Classic match move). A pair matches and hits.
 * - Strike: preview a weapon's shape at an anchor and rotation, commit, and
 *   reveal every cell in it at once. Pairs wholly inside the footprint match.
 *   A pair that covers a bullseye cell lands a stronger hit.
 * Damage comes from pairs the player found, never from how many cells were
 * revealed; big shapes cost Focus or cool down, small ones carry their own
 * edge (Guard, precision), so no tool dominates every board.
 */

export type Cell = { row: number; col: number }

export type CombatCard = {
  /** Pair id: two cards share it. Null marks an obstacle (no card). */
  pair: number | null
  matched: boolean
}

export type WeaponId =
  'twinblade' | 'hammer' | 'spear' | 'staff' | 'lantern' | 'rapier'

export type Weapon = {
  id: WeaponId
  name: string
  /** Footprint offsets from the anchor, before rotation. */
  cells: readonly Cell[]
  /** Offsets (a subset of cells) that land the stronger, deliberate hit. */
  bullseye: readonly Cell[]
  /** Quarter turns this weapon may use (0 = as drawn). */
  rotations: readonly number[]
  focusCost: number
  /** Turns before it can strike again. */
  cooldown: number
  /** Whether pairs in its footprint resolve at all (the Lantern only scouts). */
  matches: boolean
  /**
   * Guard gained when the strike resolves a pair (the Twinblade's edge). The spec's
   * tentative "Guard even without a pair" let memoryless Twinblade spam halve every
   * hit and win 4x4 fights in simulation, so Guard is earned by a hit.
   */
  guard: number
  /** Delays the enemy's next attack by a beat when it matches (the Hammer's stagger). */
  stagger: boolean
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  twinblade: {
    id: 'twinblade',
    name: 'Twinblade Sword',
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ],
    bullseye: [{ row: 0, col: 0 }],
    rotations: [0, 1],
    focusCost: 0,
    cooldown: 0,
    matches: true,
    guard: 1,
    stagger: false,
  },
  hammer: {
    id: 'hammer',
    name: 'Rune Hammer',
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ],
    bullseye: [{ row: 1, col: 1 }],
    rotations: [0, 1],
    focusCost: 1,
    cooldown: 1,
    matches: true,
    guard: 0,
    stagger: true,
  },
  spear: {
    id: 'spear',
    name: 'Hooked Spear',
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    bullseye: [{ row: 1, col: 1 }],
    rotations: [0, 1, 2, 3],
    focusCost: 1,
    cooldown: 1,
    matches: true,
    guard: 0,
    stagger: false,
  },
  staff: {
    id: 'staff',
    name: "Seer's Staff",
    cells: [
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 1, col: 0 },
    ],
    bullseye: [{ row: 1, col: 1 }],
    rotations: [0],
    focusCost: 2,
    cooldown: 2,
    matches: true,
    guard: 0,
    stagger: false,
  },
  lantern: {
    id: 'lantern',
    name: 'Memory Lantern',
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    bullseye: [],
    rotations: [0],
    focusCost: 1,
    cooldown: 2,
    matches: false,
    guard: 0,
    stagger: false,
  },
  rapier: {
    id: 'rapier',
    name: 'Needle Rapier',
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    bullseye: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    rotations: [0, 1],
    focusCost: 0,
    cooldown: 1,
    matches: true,
    guard: 0,
    stagger: false,
  },
}

export const PAIR_DAMAGE = 2
export const BULLSEYE_DAMAGE = 2
/** Guard banked at most; it softens one telegraphed attack. */
const MAX_GUARD = 1
/** Bonus for resolving two pairs in one strike. */
export const MULTI_MATCH_BONUS = 1
/** At most this many pairs resolve from one strike; the rest stay face down. */
export const PAIRS_PER_STRIKE = 2

export type Enemy = {
  name: string
  hp: number
  maxHp: number
  /** Damage of its telegraphed attack. */
  attack: number
  /** Beats (player actions) between its attacks. */
  every: number
  /** Beats left before it strikes: the visible intent ("attacks in 2"). */
  beatsLeft: number
}

export type CombatEvent =
  | { type: 'reveal'; cells: Cell[] }
  | { type: 'match'; pair: number; cells: Cell[]; bullseye: boolean }
  | { type: 'miss'; cells: Cell[] }
  | { type: 'capped'; pairs: number }
  | { type: 'damage'; amount: number; enemyHp: number; overkill: number }
  | { type: 'guard'; amount: number }
  | { type: 'stagger' }
  | { type: 'tempo'; beatsLeft: number }
  | { type: 'redeal' }
  | { type: 'enemy-attack'; amount: number; blocked: number; playerHp: number }
  | { type: 'victory' }
  | { type: 'defeat' }

export type CombatState = {
  version: 1
  seed: number
  rows: number
  cols: number
  cards: CombatCard[]
  playerHp: number
  focus: number
  guard: number
  cooldowns: Partial<Record<WeaponId, number>>
  enemy: Enemy
  turn: number
  log: CombatEvent[]
  outcome: 'fighting' | 'victory' | 'defeat'
}

/** Mulberry32: a small, fast, seedable generator. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const index = (cols: number, cell: Cell) => cell.row * cols + cell.col

/** Prevent off-board coordinates from aliasing valid flattened card indices. */
function isBoardCell(
  state: Pick<CombatState, 'rows' | 'cols'>,
  cell: Cell,
): boolean {
  return (
    Number.isInteger(cell.row) &&
    Number.isInteger(cell.col) &&
    cell.row >= 0 &&
    cell.col >= 0 &&
    cell.row < state.rows &&
    cell.col < state.cols
  )
}

/**
 * A seeded board: rows x cols cells holding pairs, with one obstacle when the
 * cell count is odd (a 5x5 keeps 12 pairs and one empty slot).
 */
export function createBoard(
  seed: number,
  rows: number,
  cols: number,
): CombatCard[] {
  const total = rows * cols
  const pairs = Math.floor(total / 2)
  const cards: CombatCard[] = []
  for (let p = 0; p < pairs; p++)
    cards.push({ pair: p, matched: false }, { pair: p, matched: false })
  if (total % 2) cards.push({ pair: null, matched: false })
  const rand = seededRandom(seed)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j]!, cards[i]!]
  }
  return cards
}

export function createCombat(options: {
  seed: number
  rows: number
  cols: number
  enemy: Omit<Enemy, 'maxHp' | 'beatsLeft'>
  playerHp?: number
  focus?: number
}): CombatState {
  return {
    version: 1,
    seed: options.seed,
    rows: options.rows,
    cols: options.cols,
    cards: createBoard(options.seed, options.rows, options.cols),
    playerHp: options.playerHp ?? 10,
    focus: options.focus ?? 3,
    guard: 0,
    cooldowns: {},
    enemy: {
      ...options.enemy,
      maxHp: options.enemy.hp,
      beatsLeft: options.enemy.every,
    },
    turn: 0,
    log: [],
    outcome: 'fighting',
  }
}

function rotate(cell: Cell, quarterTurns: number): Cell {
  let { row, col } = cell
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++)
    [row, col] = [col, -row]
  return { row, col }
}

export type Mask = {
  cells: Cell[]
  bullseye: Cell[]
  /** Every cell is on the board (an off-board mask is shown, never clipped silently). */
  legal: boolean
}

/**
 * Where a weapon lands: its footprint rotated and placed so the rotated shape's
 * top-left sits at `anchor`. Preview only: no card identity is read.
 */
export function weaponMask(
  state: Pick<CombatState, 'rows' | 'cols'>,
  weaponId: WeaponId,
  anchor: Cell,
  rotation = 0,
): Mask {
  const weapon = WEAPONS[weaponId]
  const turned = weapon.cells.map((c) => rotate(c, rotation))
  const minRow = Math.min(...turned.map((c) => c.row))
  const minCol = Math.min(...turned.map((c) => c.col))
  const place = (c: Cell) => ({
    row: anchor.row + c.row - minRow,
    col: anchor.col + c.col - minCol,
  })
  const cells = turned.map(place)
  const bullseye = weapon.bullseye.map((c) => place(rotate(c, rotation)))
  const legal =
    weapon.rotations.includes(((rotation % 4) + 4) % 4) &&
    cells.every((cell) => isBoardCell(state, cell))
  return { cells, bullseye, legal }
}

/** Every legal placement of a weapon on this board, all anchors and rotations. */
export function legalMasks(
  state: Pick<CombatState, 'rows' | 'cols'>,
  weaponId: WeaponId,
): { anchor: Cell; rotation: number; mask: Mask }[] {
  const out: { anchor: Cell; rotation: number; mask: Mask }[] = []
  for (const rotation of WEAPONS[weaponId].rotations)
    for (let row = 0; row < state.rows; row++)
      for (let col = 0; col < state.cols; col++) {
        const mask = weaponMask(state, weaponId, { row, col }, rotation)
        if (mask.legal) out.push({ anchor: { row, col }, rotation, mask })
      }
  return out
}

/** Why a weapon cannot strike now, or null when it can. */
export function strikeBlocked(
  state: CombatState,
  weaponId: WeaponId,
  mask: Mask,
): string | null {
  if (state.outcome !== 'fighting') return 'The fight is over.'
  if (!mask.legal) return 'That shape does not fit on the board there.'
  if ((state.cooldowns[weaponId] ?? 0) > 0) return 'Still cooling down.'
  if (state.focus < WEAPONS[weaponId].focusCost) return 'Not enough Focus.'
  return null
}

function clone(state: CombatState): CombatState {
  return {
    ...state,
    cards: state.cards.map((c) => ({ ...c })),
    cooldowns: { ...state.cooldowns },
    enemy: { ...state.enemy },
    log: [...state.log],
  }
}

function dealDamage(next: CombatState, amount: number) {
  if (amount <= 0) return
  const overkill = Math.max(0, amount - next.enemy.hp)
  next.enemy.hp = Math.max(0, next.enemy.hp - amount)
  next.log.push({ type: 'damage', amount, enemyHp: next.enemy.hp, overkill })
  if (next.enemy.hp === 0) {
    next.outcome = 'victory'
    next.log.push({ type: 'victory' })
  }
}

/** One player action passes: cooldowns tick and the enemy's telegraph advances. */
function endTurn(next: CombatState, stagger: boolean) {
  next.turn++
  for (const id of Object.keys(next.cooldowns) as WeaponId[])
    next.cooldowns[id] = Math.max(0, (next.cooldowns[id] ?? 0) - 1)
  if (next.outcome !== 'fighting') return
  if (!pairsLeft(next)) {
    // A cleared board with the enemy standing deals a fresh one, so a fight never stalls.
    next.cards = createBoard(next.seed + next.turn * 7919, next.rows, next.cols)
    next.log.push({ type: 'redeal' })
  }
  if (stagger) {
    next.enemy.beatsLeft++
    next.log.push({ type: 'stagger' })
  }
  next.enemy.beatsLeft--
  next.log.push({ type: 'tempo', beatsLeft: next.enemy.beatsLeft })
  if (next.enemy.beatsLeft > 0) return
  const blocked = Math.min(next.guard, next.enemy.attack)
  next.guard -= blocked
  next.playerHp = Math.max(0, next.playerHp - (next.enemy.attack - blocked))
  next.enemy.beatsLeft = next.enemy.every
  next.log.push({
    type: 'enemy-attack',
    amount: next.enemy.attack,
    blocked,
    playerHp: next.playerHp,
  })
  if (next.playerHp === 0) {
    next.outcome = 'defeat'
    next.log.push({ type: 'defeat' })
  }
}

const live = (state: CombatState, cell: Cell) => {
  if (!isBoardCell(state, cell)) return null
  const card = state.cards[index(state.cols, cell)]
  return card && card.pair !== null && !card.matched ? card : null
}

/**
 * Scout: two cells, the second chosen after seeing the first. A pair matches
 * and hits; a miss shows both and lets the enemy's telegraph advance.
 */
export function scout(state: CombatState, a: Cell, b: Cell): CombatState {
  if (state.outcome !== 'fighting') return state
  const first = live(state, a)
  const second = live(state, b)
  if (!first || !second || index(state.cols, a) === index(state.cols, b))
    return state
  const next = clone(state)
  next.log.push({ type: 'reveal', cells: [a, b] })
  if (first.pair === second.pair) {
    next.cards[index(next.cols, a)]!.matched = true
    next.cards[index(next.cols, b)]!.matched = true
    next.log.push({
      type: 'match',
      pair: first.pair!,
      cells: [a, b],
      bullseye: false,
    })
    dealDamage(next, PAIR_DAMAGE)
  } else next.log.push({ type: 'miss', cells: [a, b] })
  endTurn(next, false)
  return next
}

/**
 * Strike: commit a weapon at an anchor and rotation. Every live card under the
 * mask is revealed; pairs wholly inside it match (at most PAIRS_PER_STRIKE),
 * and a pair touching a bullseye cell hits harder.
 */
export function strike(
  state: CombatState,
  weaponId: WeaponId,
  anchor: Cell,
  rotation = 0,
): CombatState {
  const weapon = WEAPONS[weaponId]
  const mask = weaponMask(state, weaponId, anchor, rotation)
  if (strikeBlocked(state, weaponId, mask)) return state
  const next = clone(state)
  next.focus -= weapon.focusCost
  next.cooldowns[weaponId] = weapon.cooldown + 1
  const revealed = mask.cells.filter((c) => live(next, c))
  next.log.push({ type: 'reveal', cells: revealed })
  const byPair = new Map<number, Cell[]>()
  for (const cell of revealed) {
    const pair = next.cards[index(next.cols, cell)]!.pair!
    byPair.set(pair, [...(byPair.get(pair) ?? []), cell])
  }
  const isBullseye = (c: Cell) =>
    mask.bullseye.some((b) => b.row === c.row && b.col === c.col)
  const found = weapon.matches
    ? [...byPair.entries()]
        .filter(([, cells]) => cells.length === 2)
        .map(([pair, cells]) => ({
          pair,
          cells,
          bullseye: cells.some(isBullseye),
        }))
        // Bullseye pairs resolve first, so a deliberate aim is never wasted by the cap.
        .sort((x, y) => Number(y.bullseye) - Number(x.bullseye))
    : []
  const complete = found.slice(0, PAIRS_PER_STRIKE)
  if (found.length > complete.length)
    next.log.push({ type: 'capped', pairs: found.length - complete.length })
  let damage = complete.length >= 2 ? MULTI_MATCH_BONUS : 0
  for (const hit of complete) {
    for (const cell of hit.cells)
      next.cards[index(next.cols, cell)]!.matched = true
    next.log.push({ type: 'match', ...hit })
    damage += PAIR_DAMAGE + (hit.bullseye ? BULLSEYE_DAMAGE : 0)
  }
  if (!complete.length) next.log.push({ type: 'miss', cells: revealed })
  if (weapon.guard && complete.length) {
    // Guard does not stack past one attack's worth, so a cheap shape is no wall.
    next.guard = Math.min(MAX_GUARD, next.guard + weapon.guard)
    next.log.push({ type: 'guard', amount: weapon.guard })
  }
  // Two pairs in one Staff strike charge a Focus back.
  if (weapon.id === 'staff' && complete.length >= 2) next.focus += 1
  dealDamage(next, damage)
  endTurn(next, weapon.stagger && complete.length > 0)
  return next
}

/** Pairs left to find (the board can always still be cleared). */
export function pairsLeft(state: CombatState): number {
  return state.cards.filter((c) => c.pair !== null && !c.matched).length / 2
}

/** A plain JSON copy (saves, replays); identities included, so keep it off the client UI. */
export function serializeCombat(state: CombatState): string {
  return JSON.stringify(state)
}

/**
 * The mask placed so its pivot (the first bullseye, or the first cell) sits on
 * `at`: the cell under the pointer or keyboard focus. Players aim where they
 * look, whatever the shape's bounding box.
 */
export function maskAt(
  state: Pick<CombatState, 'rows' | 'cols'>,
  weaponId: WeaponId,
  at: Cell,
  rotation = 0,
): { anchor: Cell; mask: Mask } {
  const weapon = WEAPONS[weaponId]
  const turned = weapon.cells.map((c) => rotate(c, rotation))
  const minRow = Math.min(...turned.map((c) => c.row))
  const minCol = Math.min(...turned.map((c) => c.col))
  const pivot = rotate(weapon.bullseye[0] ?? weapon.cells[0]!, rotation)
  const anchor = {
    row: at.row - (pivot.row - minRow),
    col: at.col - (pivot.col - minCol),
  }
  return { anchor, mask: weaponMask(state, weaponId, anchor, rotation) }
}

const COLUMNS = 'ABCDEFGH'

/** Spoken coordinate, "C4": columns are letters, rows count from 1. */
export function cellName(cell: Cell): string {
  return `${COLUMNS[cell.col] ?? '?'}${cell.row + 1}`
}

/**
 * One sentence for what an action did, from its events: the live-region
 * announcement and the status line under the board.
 */
export function describeEvents(events: CombatEvent[]): string {
  const parts: string[] = []
  for (const e of events) {
    if (e.type === 'reveal' && e.cells.length)
      parts.push(`Revealed ${e.cells.map(cellName).join(', ')}.`)
    else if (e.type === 'match')
      parts.push(
        `Pair at ${e.cells.map(cellName).join(' and ')}${e.bullseye ? ', on the bullseye' : ''}!`,
      )
    else if (e.type === 'miss') parts.push('No pair.')
    else if (e.type === 'capped')
      parts.push(
        `${e.pairs} more pair${e.pairs === 1 ? '' : 's'} stay hidden (two per strike).`,
      )
    else if (e.type === 'damage')
      parts.push(
        `${e.amount} damage${e.overkill ? ` (${e.overkill} overkill)` : ''}.`,
      )
    else if (e.type === 'guard') parts.push('Guard raised.')
    else if (e.type === 'stagger') parts.push('The enemy staggers.')
    else if (e.type === 'redeal') parts.push('A fresh board is dealt.')
    else if (e.type === 'enemy-attack')
      parts.push(
        e.blocked
          ? `The enemy strikes for ${e.amount}; Guard blocks ${e.blocked}.`
          : `The enemy strikes for ${e.amount}.`,
      )
    else if (e.type === 'victory') parts.push('Victory!')
    else if (e.type === 'defeat') parts.push('Defeated.')
  }
  return parts.join(' ')
}

/**
 * A saved fight, validated: anything malformed returns null, so a damaged
 * save drops the fight (the player is back on the map) instead of crashing.
 * The event log is not restored; it only feeds the last announcement.
 */
export function restoreCombat(input: unknown): CombatState | null {
  if (!input || typeof input !== 'object') return null
  const s = input as Partial<CombatState>
  const int = (v: unknown, min: number, max: number) =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max
  if (s.version !== 1 || !int(s.rows, 2, 8) || !int(s.cols, 2, 8)) return null
  const rows = s.rows!
  const cols = s.cols!
  if (!Array.isArray(s.cards) || s.cards.length !== rows * cols) return null
  const cards = s.cards.map((c) => ({
    pair: c && int(c.pair, 0, 63) ? (c.pair as number) : null,
    matched: c?.matched === true,
  }))
  const counts = new Map<number, number>()
  for (const c of cards)
    if (c.pair !== null) counts.set(c.pair, (counts.get(c.pair) ?? 0) + 1)
  if ([...counts.values()].some((n) => n !== 2)) return null
  const e = s.enemy
  if (
    !e ||
    typeof e.name !== 'string' ||
    !int(e.maxHp, 1, 999) ||
    !int(e.hp, 0, e.maxHp) ||
    !int(e.attack, 0, 99) ||
    !int(e.every, 1, 20) ||
    !int(e.beatsLeft, 0, 21)
  )
    return null
  if (
    !int(s.playerHp, 0, 99) ||
    !int(s.focus, 0, 99) ||
    !int(s.guard, 0, MAX_GUARD) ||
    !int(s.turn, 0, 100000) ||
    !int(s.seed, -(2 ** 31), 2 ** 32)
  )
    return null
  const cooldowns: Partial<Record<WeaponId, number>> = {}
  for (const id of Object.keys(WEAPONS) as WeaponId[]) {
    const v = s.cooldowns?.[id]
    if (int(v, 0, 10)) cooldowns[id] = v
  }
  const outcome =
    s.outcome === 'victory' || s.outcome === 'defeat' ? s.outcome : 'fighting'
  return {
    version: 1,
    seed: s.seed!,
    rows,
    cols,
    cards,
    playerHp: s.playerHp!,
    focus: s.focus!,
    guard: s.guard!,
    cooldowns,
    enemy: {
      name: e.name.slice(0, 60),
      hp: e.hp,
      maxHp: e.maxHp,
      attack: e.attack,
      every: e.every,
      beatsLeft: e.beatsLeft,
    },
    turn: s.turn!,
    log: [],
    outcome,
  }
}

/** Is `cell` inside the cell list (masks, reveals)? */
export function includesCell(cells: readonly Cell[], cell: Cell): boolean {
  return cells.some((c) => c.row === cell.row && c.col === cell.col)
}

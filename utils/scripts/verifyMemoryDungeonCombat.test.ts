// Memory Dungeon spatial weapon combat (conductor memory-dungeon t-006;
// projects/memory-dungeon/COMBAT-PATTERNS.md): weapon masks that preview
// exactly and never clip silently, strikes that resolve each pair once, and
// seeded player simulations showing that remembering card positions, not
// revealing the widest shape, is what wins fights on 4x4, 4x6 and 6x6.
import assert from 'node:assert/strict'
import {
  PAIRS_PER_STRIKE,
  WEAPONS,
  createBoard,
  createCombat,
  index,
  legalMasks,
  pairsLeft,
  scout,
  seededRandom,
  serializeCombat,
  strike,
  strikeBlocked,
  weaponMask,
  type Cell,
  type CombatState,
  type WeaponId,
} from '../memoryDungeon/combat'
import { COMBAT_COLS, COMBAT_ROOMS, COMBAT_ROWS } from '../memoryDungeon/rooms'

const key = (cells: Cell[]) =>
  cells
    .map((c) => `${c.row},${c.col}`)
    .sort()
    .join(' ')

const board = { rows: 4, cols: 4 }

// 1. Masks are the shapes COMBAT-PATTERNS.md names, rotated and anchored at the
// rotated shape's top-left.
assert.equal(
  key(weaponMask(board, 'twinblade', { row: 1, col: 2 }).cells),
  '1,2 2,2',
  'the Twinblade is two vertical cells',
)
assert.equal(
  key(weaponMask(board, 'twinblade', { row: 1, col: 2 }, 1).cells),
  '1,2 1,3',
  'rotated, the Twinblade lies horizontal',
)
assert.equal(
  key(weaponMask(board, 'hammer', { row: 0, col: 0 }).cells),
  '0,0 1,1 2,2',
  'the Rune Hammer is a three-cell diagonal',
)
assert.equal(
  key(weaponMask(board, 'hammer', { row: 0, col: 0 }, 1).cells),
  '0,2 1,1 2,0',
  'turned once, the Hammer takes the reverse diagonal',
)
assert.equal(
  key(weaponMask(board, 'staff', { row: 0, col: 0 }).cells),
  '0,1 1,0 1,1 1,2 2,1',
  "the Seer's Staff is a five-cell cross",
)
assert.equal(
  key(weaponMask(board, 'lantern', { row: 2, col: 2 }).cells),
  '2,2 2,3 3,2 3,3',
  'the Lantern is a 2x2 square',
)
const spearShapes = new Set(
  [0, 1, 2, 3].map((r) =>
    key(weaponMask(board, 'spear', { row: 0, col: 0 }, r).cells),
  ),
)
assert.equal(spearShapes.size, 4, 'each Spear rotation is a distinct L')
for (const id of Object.keys(WEAPONS) as WeaponId[]) {
  const weapon = WEAPONS[id]
  for (const r of weapon.rotations) {
    const mask = weaponMask({ rows: 6, cols: 6 }, id, { row: 1, col: 1 }, r)
    assert.equal(mask.cells.length, weapon.cells.length, `${id} keeps its size`)
    assert.ok(
      mask.bullseye.every((b) => mask.cells.some((c) => key([c]) === key([b]))),
      `${id} bullseye cells sit inside its footprint`,
    )
  }
}

// 2. Edges: an overhanging mask is reported whole and illegal, never clipped.
const overhang = weaponMask(board, 'staff', { row: 2, col: 2 })
assert.equal(overhang.legal, false, 'a cross hanging off the board is illegal')
assert.equal(overhang.cells.length, 5, 'and still shows all five cells')
assert.ok(
  overhang.cells.some((c) => c.row === 4),
  'including the off-board ones',
)
assert.equal(
  weaponMask(board, 'twinblade', { row: 0, col: 0 }, 2).legal,
  false,
  'a rotation the weapon lacks is illegal',
)
assert.equal(
  legalMasks(board, 'twinblade').length,
  24,
  'Twinblade: 12 vertical + 12 horizontal on 4x4',
)
assert.equal(
  legalMasks(board, 'staff').length,
  4,
  'the cross fits four ways on 4x4',
)
assert.equal(
  legalMasks({ rows: 6, cols: 6 }, 'staff').length,
  16,
  'and sixteen on 6x6',
)
assert.equal(
  legalMasks({ rows: 4, cols: 6 }, 'hammer').length,
  16,
  'Hammer: 8 per diagonal on 4x6',
)

// 3. Boards: seeded, every pair twice, and an odd board keeps one obstacle.
for (const [rows, cols] of [
  [4, 4],
  [4, 6],
  [6, 6],
  [5, 5],
]) {
  const cards = createBoard(7, rows!, cols!)
  assert.equal(cards.length, rows! * cols!)
  const counts = new Map<number | null, number>()
  for (const c of cards) counts.set(c.pair, (counts.get(c.pair) ?? 0) + 1)
  for (const [pair, n] of counts)
    assert.equal(n, pair === null ? 1 : 2, `${rows}x${cols} pair ${pair} count`)
  assert.equal(counts.has(null), (rows! * cols!) % 2 === 1)
}
assert.deepEqual(
  createBoard(42, 6, 6),
  createBoard(42, 6, 6),
  'same seed, same board',
)
assert.notDeepEqual(createBoard(42, 6, 6), createBoard(43, 6, 6))

const enemy = { name: 'Memory Leech', hp: 12, attack: 2, every: 3 }
const fresh = (seed = 1, rows = 4, cols = 4) =>
  createCombat({ seed, rows, cols, enemy })

/** Every cell holding pair `p`, from the board itself (test-side omniscience). */
const cellsOf = (state: CombatState, p: number): Cell[] => {
  const out: Cell[] = []
  state.cards.forEach((c, i) => {
    if (c.pair === p && !c.matched)
      out.push({ row: Math.floor(i / state.cols), col: i % state.cols })
  })
  return out
}
const pairAt = (state: CombatState, cell: Cell) =>
  state.cards[index(state.cols, cell)]!.pair

/** A legal placement of `weapon` covering both cells, bullseye on one if possible. */
function aimAt(state: CombatState, id: WeaponId, cells: Cell[]) {
  const fits = legalMasks(state, id).filter((m) =>
    cells.every((c) =>
      m.mask.cells.some((x) => x.row === c.row && x.col === c.col),
    ),
  )
  return (
    fits.find((m) =>
      m.mask.bullseye.some((b) =>
        cells.some((c) => c.row === b.row && c.col === b.col),
      ),
    ) ?? fits[0]
  )
}

// 4. Scout: a pair matches and hits; a miss shows both and advances the tempo.
{
  const s = fresh()
  const [a, b] = cellsOf(s, 0)
  const hit = scout(s, a!, b!)
  assert.equal(hit.enemy.hp, 10, 'a scouted pair deals 2')
  assert.deepEqual(
    hit.log.map((e) => e.type),
    ['reveal', 'match', 'damage', 'tempo'],
    'reveal, match, damage and tempo are separate events',
  )
  assert.equal(scout(hit, a!, b!), hit, 'a matched pair cannot be used twice')
  const other = cellsOf(s, 1)[0]!
  const miss = scout(s, a!, other)
  assert.equal(miss.enemy.hp, 12)
  assert.equal(miss.log[1]!.type, 'miss')
  assert.equal(miss.enemy.beatsLeft, 2, 'a miss spends a beat of the telegraph')
  assert.equal(scout(s, a!, a!), s, 'one card cannot be both picks')
  assert.equal(
    s.log.length,
    0,
    'actions never mutate the state they were given',
  )
}

// Adversarial coordinate integrity: a flattened index must never allow a
// forged off-board or fractional pick to resolve a legitimate pair for free.
for (const [rows, cols] of [
  [4, 4],
  [4, 6],
  [6, 6],
] as const) {
  for (let seed = 1; seed <= 24; seed++) {
    const state = fresh(seed, rows, cols)
    const first = state.cards[0]!.pair!
    const mateIndex = state.cards.findIndex(
      (card, position) => position !== 0 && card.pair === first,
    )
    const mate = {
      row: Math.floor(mateIndex / cols),
      col: mateIndex % cols,
    }
    assert.ok(mateIndex > 0, 'the original first card has a mate')
    const invalid: Cell[] = [
      { row: -1, col: cols },
      { row: 1, col: -1 },
      { row: 0.5, col: cols / 2 },
      { row: rows, col: 0 },
      { row: 0, col: cols },
      { row: Number.NaN, col: 0 },
      { row: 0, col: Number.POSITIVE_INFINITY },
    ]
    for (const forged of invalid) {
      assert.equal(
        scout(state, forged, mate),
        state,
        `${rows}x${cols} seed ${seed}: invalid first pick cannot earn a match`,
      )
      assert.equal(
        scout(state, mate, forged),
        state,
        `${rows}x${cols} seed ${seed}: invalid second pick cannot earn a match`,
      )
      const mask = weaponMask(state, 'twinblade', forged)
      assert.equal(mask.legal, false, 'invalid strike anchors are illegal')
      assert.equal(
        strike(state, 'twinblade', forged),
        state,
        'invalid strikes cannot spend Focus, advance enemy tempo or mutate state',
      )
    }
    assert.equal(
      scout(state, { row: 0, col: 0 }, mate).enemy.hp,
      state.enemy.hp - 2,
      'a legitimate remembered pair still deals normal damage',
    )
    assert.equal(state.turn, 0, 'rejected moves never mutate the source')
  }
}

// 5. Strike: a remembered vertical pair under the Twinblade lands a bullseye hit
// and banks a Guard.
{
  let s = fresh(3, 6, 6)
  let target: Cell[] | null = null
  for (let p = 0; p < 18 && !target; p++) {
    const cells = cellsOf(s, p)
    if (aimAt(s, 'twinblade', cells)) target = cells
  }
  // Seed 3 on 6x6 has an adjacent pair somewhere; search seeds if not.
  for (let seed = 4; !target; seed++) {
    s = fresh(seed, 6, 6)
    for (let p = 0; p < 18 && !target; p++) {
      const cells = cellsOf(s, p)
      if (aimAt(s, 'twinblade', cells)) target = cells
    }
  }
  const aim = aimAt(s, 'twinblade', target)!
  const hit = strike(s, 'twinblade', aim.anchor, aim.rotation)
  assert.equal(hit.enemy.hp, 8, 'a bullseye pair deals 2 + 2')
  assert.equal(hit.guard, 1, 'the Twinblade grants a Guard')
  assert.equal(
    strike(hit, 'twinblade', aim.anchor, aim.rotation).log.filter(
      (e) => e.type === 'match',
    ).length,
    1,
    'the struck pair stays spent',
  )
}

// 6. Costs: Focus and cooldown gate the big shapes; illegal masks are refused.
{
  const s = fresh()
  assert.equal(
    strikeBlocked(s, 'staff', weaponMask(s, 'staff', { row: 2, col: 2 })),
    'That shape does not fit on the board there.',
  )
  const cast = strike(s, 'staff', { row: 0, col: 0 })
  assert.equal(cast.focus, s.focus - 2, 'the Staff costs 2 Focus')
  assert.equal(
    strikeBlocked(cast, 'staff', weaponMask(cast, 'staff', { row: 1, col: 1 })),
    'Still cooling down.',
  )
  const poor = { ...s, focus: 1 }
  assert.equal(
    strikeBlocked(poor, 'staff', weaponMask(poor, 'staff', { row: 0, col: 0 })),
    'Not enough Focus.',
  )
  const lit = strike(s, 'lantern', { row: 0, col: 0 })
  assert.equal(lit.enemy.hp, 12, 'the Lantern scouts and never damages')
  assert.ok(
    lit.cards.every((c) => !c.matched),
    'and resolves no pair',
  )
}

// 7. The per-strike cap: a footprint holding three pairs resolves two, logs the
// rest as capped, and the third pair stays live.
{
  const s = fresh(5, 4, 4)
  // Arrange a lantern-free cross holding three complete pairs.
  const cross = weaponMask(s, 'staff', { row: 0, col: 0 }).cells
  const forced: CombatState = {
    ...s,
    cards: s.cards.map((c) => ({ ...c })),
  }
  const pairsInCross = [7, 7, 6, 6, 5]
  cross.forEach((c, i) => (forced.cards[index(4, c)]!.pair = pairsInCross[i]!))
  const after = strike(forced, 'staff', { row: 0, col: 0 })
  const matched = after.log.filter((e) => e.type === 'match')
  assert.equal(matched.length, PAIRS_PER_STRIKE)
  assert.equal(
    after.enemy.hp,
    12 - (2 + 2 + 2 + 1),
    'two pairs, one on the bullseye, plus the multi-match bonus',
  )
  assert.equal(
    after.focus,
    s.focus - 2 + 1,
    'two pairs in a Staff strike refund a Focus',
  )
}

// 8. Tempo and Guard: the enemy strikes on its telegraph, Guard absorbs it, a
// Hammer match staggers it, and a cleared board deals a fresh one.
{
  let s = fresh(9)
  const far = (n: number) => cellsOf(s, n)
  s = scout(s, far(0)[0]!, far(1)[0]!)
  s = scout(s, far(0)[0]!, far(1)[0]!)
  s = scout(s, far(0)[0]!, far(1)[0]!)
  const attack = s.log.find((e) => e.type === 'enemy-attack')
  assert.ok(
    attack && attack.type === 'enemy-attack' && attack.playerHp === 8,
    'three misses: the telegraphed attack lands',
  )
  assert.equal(s.enemy.beatsLeft, 3, 'and the telegraph resets')
  // Columns 0 and 1 hold vertical pairs 6 and 7; the right half pairs across rows.
  const layout = [6, 7, 0, 1, 6, 7, 2, 3, 0, 1, 4, 5, 2, 3, 4, 5]
  const stacked: CombatState = {
    ...fresh(9),
    cards: layout.map((pair) => ({ pair, matched: false })),
  }
  const whiff = strike(stacked, 'twinblade', { row: 0, col: 2 })
  assert.equal(
    whiff.guard,
    0,
    'a Twinblade strike that finds no pair banks no Guard',
  )
  let g = strike(stacked, 'twinblade', { row: 0, col: 0 })
  g = strike(g, 'twinblade', { row: 0, col: 1 })
  assert.equal(g.guard, 1, 'two Twinblade hits bank one Guard, not two')
  g = scout(g, cellsOf(g, 0)[0]!, cellsOf(g, 1)[0]!)
  assert.equal(g.playerHp, 9, 'banked Guard softens the telegraphed hit')
  const tough = createCombat({
    seed: 9,
    rows: 4,
    cols: 4,
    enemy: { ...enemy, hp: 99 },
  })
  let clear = tough
  for (let p = 0; p < 8; p++) {
    const [a, b] = cellsOf(clear, p)
    clear = scout(clear, a!, b!)
  }
  assert.ok(
    clear.log.some((e) => e.type === 'redeal'),
    'a cleared board with the enemy alive redeals',
  )
  assert.equal(pairsLeft(clear), 8)
}

// 9. Replay: same seed and actions, same fight; it survives JSON.
{
  const run = () => {
    let s = fresh(11, 4, 6)
    s = strike(s, 'hammer', { row: 0, col: 0 })
    s = scout(s, { row: 3, col: 5 }, { row: 3, col: 4 })
    s = strike(s, 'spear', { row: 1, col: 3 }, 2)
    return s
  }
  assert.deepEqual(run(), run())
  assert.deepEqual(JSON.parse(serializeCombat(run())), run())
}

// 10. Players. Each sees exactly what the game shows (cards a reveal turned up)
// and keeps a memory of it with some fidelity.
type Player = {
  name: string
  /** Chance each revealed card is remembered. */
  recall: number
  /** Uses shaped weapons on remembered pairs. */
  targets: boolean
  /** Fires the widest affordable shape at random, ignoring memory. */
  spray: boolean
}

const ARCHIVIST = (pairs: number) => ({
  hp: pairs,
  attack: 2,
  // Bigger boards give a longer telegraph: 4 beats on 4x4 and 4x6, 5 on 6x6.
  every: 2 + Math.ceil(pairs / 6),
})

type Setup = {
  enemy: { name: string; hp: number; attack: number; every: number }
  playerHp: number
  focus: number
  loadout: WeaponId[]
}

function play(
  player: Player,
  seed: number,
  rows: number,
  cols: number,
  setup?: Setup,
) {
  const pairs = Math.floor((rows * cols) / 2)
  const allowed = (id: WeaponId) => !setup || setup.loadout.includes(id)
  let s = createCombat({
    seed,
    rows,
    cols,
    enemy: setup?.enemy ?? { name: 'Archivist', ...ARCHIVIST(pairs) },
    playerHp: setup?.playerHp ?? 10,
    focus: setup?.focus,
  })
  const rand = seededRandom(seed * 31 + 7)
  const memory = new Map<number, number>() // cell index -> pair
  const learn = (before: CombatState, after: CombatState) => {
    for (const e of after.log.slice(before.log.length)) {
      if (e.type === 'redeal') memory.clear()
      if (e.type !== 'reveal') continue
      for (const c of e.cells)
        if (rand() < player.recall)
          memory.set(index(cols, c), pairAt(before, c)!)
    }
    for (const [i] of memory) if (after.cards[i]!.matched) memory.delete(i)
  }
  const cellOf = (i: number): Cell => ({
    row: Math.floor(i / cols),
    col: i % cols,
  })
  const liveCells = () =>
    s.cards.flatMap((c, i) => (c.pair !== null && !c.matched ? [i] : []))
  const knownPairs = () => {
    const seen = new Map<number, number[]>()
    for (const [i, p] of memory) seen.set(p, [...(seen.get(p) ?? []), i])
    return [...seen.values()].filter((v) => v.length === 2)
  }
  const act = (next: CombatState) => {
    learn(s, next)
    s = next
  }
  let guard = 0
  while (s.outcome === 'fighting' && guard++ < 400) {
    if (player.spray) {
      const id = (['staff', 'hammer', 'spear', 'twinblade'] as WeaponId[]).find(
        (w) => allowed(w) && !strikeBlocked(s, w, legalMasks(s, w)[0]!.mask),
      )
      if (id) {
        const options = legalMasks(s, id)
        const pick = options[Math.floor(rand() * options.length)]!
        act(strike(s, id, pick.anchor, pick.rotation))
        continue
      }
    }
    const known = knownPairs()
    if (known.length) {
      const cells = known[0]!.map(cellOf)
      if (player.targets) {
        const shot = (['twinblade', 'spear', 'hammer', 'rapier'] as WeaponId[])
          .filter(allowed)
          .map((id) => ({ id, aim: aimAt(s, id, cells) }))
          .find(({ id, aim }) => aim && !strikeBlocked(s, id, aim.mask))
        if (shot) {
          act(strike(s, shot.id, shot.aim!.anchor, shot.aim!.rotation))
          continue
        }
      }
      act(scout(s, cells[0]!, cells[1]!))
      continue
    }
    // Explore: flip an unremembered card, then its remembered mate or another unknown.
    const live = liveCells()
    const unknown = live.filter((i) => !memory.has(i))
    const pool = unknown.length ? unknown : live
    const first = pool[Math.floor(rand() * pool.length)]!
    const p = s.cards[first]!.pair
    const mate = [...memory].find(([i, q]) => q === p && i !== first)
    const rest = (unknown.length > 1 ? unknown : live).filter(
      (i) => i !== first,
    )
    const second = mate ? mate[0] : rest[Math.floor(rand() * rest.length)]!
    act(scout(s, cellOf(first), cellOf(second)))
  }
  return { won: s.outcome === 'victory', turns: s.turn }
}

const PLAYERS: Player[] = [
  { name: 'blind', recall: 0, targets: false, spray: false },
  { name: 'spray', recall: 0, targets: false, spray: true },
  { name: 'memory-60', recall: 0.6, targets: false, spray: false },
  { name: 'memory', recall: 1, targets: false, spray: false },
  { name: 'targeting', recall: 1, targets: true, spray: false },
]
const SEEDS = 200
const results: Record<
  string,
  Record<string, { win: number; turns: number }>
> = {}
for (const [rows, cols] of [
  [4, 4],
  [4, 6],
  [6, 6],
] as const) {
  const size = `${rows}x${cols}`
  results[size] = {}
  for (const player of PLAYERS) {
    let win = 0
    let turns = 0
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = play(player, seed, rows, cols)
      win += Number(r.won)
      turns += r.turns
    }
    results[size]![player.name] = { win: win / SEEDS, turns: turns / SEEDS }
  }
}
if (process.env.MD_COMBAT_STATS) console.log(JSON.stringify(results, null, 1))

for (const [size, r] of Object.entries(results)) {
  const at = (n: string) => r[n]!
  assert.ok(
    at('memory').win > at('blind').win + 0.3,
    `${size}: memory beats blind play (${at('memory').win} vs ${at('blind').win})`,
  )
  assert.ok(
    at('memory').win >= at('memory-60').win &&
      at('memory-60').win > at('blind').win,
    `${size}: better memory, more wins`,
  )
  assert.ok(
    at('memory').win > at('spray').win + 0.3,
    `${size}: spraying the widest shape never replaces memory (${at('spray').win})`,
  )
  assert.ok(
    at('spray').win < 0.5,
    `${size}: blind wide reveals are no indiscriminate solve`,
  )
  assert.ok(
    at('targeting').win >= at('memory').win,
    `${size}: aiming shapes at remembered pairs pays`,
  )
  assert.ok(
    at('targeting').turns < at('memory').turns,
    `${size}: and wins in fewer actions`,
  )
}

// 11. Briar Camp's combat rooms (t-007) hold the same line on their 4x4 board:
// remembering wins, guessing and spraying shapes mostly lose.
const roomStats: Record<string, Record<string, number>> = {}
for (const [roomId, room] of Object.entries(COMBAT_ROOMS)) {
  roomStats[roomId] = {}
  for (const player of PLAYERS) {
    let win = 0
    for (let seed = 1; seed <= SEEDS; seed++)
      win += Number(play(player, seed, COMBAT_ROWS, COMBAT_COLS, room).won)
    roomStats[roomId]![player.name] = win / SEEDS
  }
  const at = (n: string) => roomStats[roomId]![n]!
  assert.ok(
    at('memory') >= 0.95,
    `${roomId}: remembering wins (${at('memory')})`,
  )
  assert.ok(
    at('targeting') >= 0.95,
    `${roomId}: aiming wins (${at('targeting')})`,
  )
  assert.ok(
    at('memory-60') >= 0.6,
    `${roomId}: partial memory mostly wins (${at('memory-60')})`,
  )
  assert.ok(
    at('blind') <= 0.35,
    `${roomId}: guessing mostly loses (${at('blind')})`,
  )
  assert.ok(
    at('spray') <= 0.5,
    `${roomId}: spraying shapes mostly loses (${at('spray')})`,
  )
}
if (process.env.MD_COMBAT_STATS) console.log(JSON.stringify(roomStats))

console.log(
  'Memory Dungeon combat: masks, edges, costs, cap, tempo, replay and',
  `${PLAYERS.length} player models x 3 boards x ${SEEDS} seeds verified`,
)

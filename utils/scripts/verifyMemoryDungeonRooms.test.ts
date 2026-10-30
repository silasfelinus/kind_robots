// Memory Dungeon combat rooms on the Briar Camp board (conductor memory-dungeon
// t-007): the Rootbound Warden and the forest duels fight on the weapon engine,
// previews aim where the player points, saves carry a fight safely, and the
// board is reachable by keyboard and screen reader. Balance per room lives in
// verifyMemoryDungeonCombat.test.ts (section 11).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  WEAPONS,
  cellName,
  createCombat,
  describeEvents,
  includesCell,
  legalMasks,
  maskAt,
  restoreCombat,
  scout,
  strike,
  type WeaponId,
} from '../memoryDungeon/combat'
import {
  COMBAT_PAIRS,
  COMBAT_ROOMS,
  HOUSE_DUEL_ROOMS,
  isCombatRoom,
  isHouseDuelOrigin,
  restoreBriarCombat,
  startCombatRoom,
} from '../memoryDungeon/rooms'
import {
  newBriarSave,
  recoverBriarCombatDefeat,
  restoreBriarSave,
} from '../memoryDungeonWorld'
import {
  DARK_BRIAR_DUELS,
  darkBriarCanDuel,
  darkBriarDuelForRoom,
} from '../memoryDungeon/darkBriarDuels'
import {
  DARK_BRIAR_SCENES,
  DARK_BRIAR_WAVES,
  darkBriarChoose,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
} from '../memoryDungeon/darkBriar'

// 1. Aiming: the pointed-at cell is the weapon's pivot (its bullseye when it has one).
for (const id of Object.keys(WEAPONS) as WeaponId[])
  for (const rotation of WEAPONS[id].rotations) {
    const at = { row: 2, col: 3 }
    const { mask } = maskAt({ rows: 6, cols: 6 }, id, at, rotation)
    assert.ok(
      includesCell(mask.cells, at),
      `${id} r${rotation}: the aimed cell is in the shape`,
    )
    if (WEAPONS[id].bullseye.length)
      assert.ok(
        includesCell(mask.bullseye, at),
        `${id} r${rotation}: and is the bullseye`,
      )
  }
assert.equal(
  maskAt({ rows: 4, cols: 4 }, 'staff', { row: 0, col: 0 }).mask.legal,
  false,
  'a cross aimed at the corner overhangs and is refused, not clipped',
)

// 2. Rooms: the forest duels, the Warden, the House's three guardian duels
// and the Dark Briar's three bouts,
// Classic Echo Chamber untouched, tools that fit.
assert.deepEqual(Object.keys(COMBAT_ROOMS).sort(), [
  'collector',
  'empty-armor',
  'hearth-guard',
  'moss-judge',
  'patrol',
  'sprite',
  'twinned-guard',
  'unpaid-patrol',
  'vault-2',
])
assert.equal(isCombatRoom('vault-1'), false, 'the Echo Chamber stays Classic')
assert.equal(isCombatRoom('toString'), false, 'only authored rooms count')
assert.equal(
  new Set(Object.values(COMBAT_ROOMS).map((room) => room.enemy.name)).size,
  Object.keys(COMBAT_ROOMS).length,
  'every combat room fights its own enemy',
)
assert.equal(
  new Set(
    Object.values(COMBAT_ROOMS).map(
      (room) => `${room.enemy.hp}/${room.enemy.attack}/${room.enemy.every}`,
    ),
  ).size,
  Object.keys(COMBAT_ROOMS).length,
  'and fights at its own tempo',
)
for (const room of Object.values(COMBAT_ROOMS))
  assert.ok(room.intro.length > 40 && room.artPrompt.length >= 120)
// HD-09, HD-22 and HD-28 each launch their own guardian, never a forest board.
assert.deepEqual(HOUSE_DUEL_ROOMS, {
  'HD-09': 'hearth-guard',
  'HD-22': 'collector',
  'HD-28': 'twinned-guard',
})
for (const [origin, room] of Object.entries(HOUSE_DUEL_ROOMS)) {
  assert.ok(isHouseDuelOrigin(origin) && isCombatRoom(room))
  assert.notEqual(room, 'sprite')
  assert.notEqual(room, 'patrol')
}
assert.equal(isHouseDuelOrigin('HD-32'), false, 'the Warden keeps its vault')
assert.equal(COMBAT_PAIRS, 8)
for (const [id, room] of Object.entries(COMBAT_ROOMS)) {
  for (const weapon of room.loadout)
    assert.ok(
      legalMasks({ rows: 4, cols: 4 }, weapon).length > 0,
      `${id}: ${weapon} fits the board`,
    )
  assert.ok(
    room.focus >= Math.min(...room.loadout.map((w) => WEAPONS[w].focusCost)),
  )
}
const images = Array.from({ length: 10 }, (_, i) => `/img/${i}.webp`)
const fresh = startCombatRoom('vault-2', 42, images)
assert.equal(fresh.state.rows * fresh.state.cols, 16)
assert.equal(fresh.images.length, 8, 'one image per pair')
assert.equal(fresh.state.enemy.name, 'Rootbound Warden')
assert.deepEqual(startCombatRoom('vault-2', 42, images), fresh, 'seeded')

// 3. Narration: one plain sentence per action, with coordinates.
assert.equal(cellName({ row: 3, col: 1 }), 'B4')
assert.equal(
  describeEvents([
    {
      type: 'reveal',
      cells: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ],
    },
    {
      type: 'match',
      pair: 1,
      cells: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ],
      bullseye: true,
    },
    { type: 'damage', amount: 4, enemyHp: 8, overkill: 0 },
    { type: 'guard', amount: 1 },
    { type: 'tempo', beatsLeft: 3 },
  ]),
  'Revealed A1, A2. Pair at A1 and A2, on the bullseye! 4 damage. Guard raised.',
)
assert.equal(
  describeEvents([
    { type: 'miss', cells: [] },
    { type: 'enemy-attack', amount: 2, blocked: 1, playerHp: 7 },
  ]),
  'No pair. The enemy strikes for 2; Guard blocks 1.',
)

// 4. Saves: a fight in progress round-trips; damaged saves fall back to the map.
let played = fresh.state
played = strike(played, 'hammer', { row: 0, col: 0 })
played = scout(played, { row: 3, col: 3 }, { row: 3, col: 2 })
const json = JSON.parse(JSON.stringify(played))
assert.deepEqual(
  restoreCombat(json),
  { ...played, log: [] },
  'a fight restores exactly, minus its event log',
)
assert.equal(restoreCombat({ ...json, rows: 40 }), null)
assert.equal(
  restoreCombat({ ...json, guard: 5 }),
  null,
  'Guard past its cap is a tampered save',
)
assert.equal(
  restoreCombat({ ...json, turn: 100000 }),
  null,
  'a forged 100,000-turn checkpoint is rejected before expensive seeded-board replay',
)
const cooling = strike(fresh.state, 'hammer', { row: 0, col: 0 })
assert.equal(cooling.cooldowns.hammer, 1)
assert.ok(
  restoreCombat(JSON.parse(JSON.stringify(cooling))),
  'an earned weapon cooldown survives save restoration',
)
for (const badCooldowns of [
  { hammer: -1 },
  { hammer: 2 },
  { twinblade: 1 },
  { 'unknown-weapon': 1 },
  { hammer: null },
  ['hammer'],
]) {
  assert.equal(
    restoreCombat({ ...json, cooldowns: badCooldowns }),
    null,
    'malformed or impossible cooldown entries cannot be silently dropped on reload',
  )
}
assert.equal(
  restoreCombat({ ...json, cooldowns: null }),
  null,
  'a corrupt cooldown ledger cannot be interpreted as an empty one',
)
assert.ok(
  restoreCombat({ ...json, cooldowns: undefined }),
  'older checkpoints without a cooldown ledger remain compatible',
)
assert.equal(played.history?.actions.length, played.turn)
for (const [label, forged] of [
  ['free Focus', { focus: json.focus + 1 }],
  ['free health', { playerHp: json.playerHp + 1 }],
  ['forged damage', { enemy: { ...json.enemy, hp: json.enemy.hp - 1 } }],
  ['forged tempo', { enemy: { ...json.enemy, beatsLeft: 1 } }],
  ['missing action', { history: { ...json.history, actions: [] } }],
  [
    'duplicate action',
    {
      history: {
        ...json.history,
        actions: [...json.history.actions, json.history.actions[0]],
      },
    },
  ],
  [
    'impossible action',
    {
      history: {
        ...json.history,
        actions: [
          { type: 'scout', a: { row: -1, col: 0 }, b: { row: 0, col: 1 } },
          ...json.history.actions.slice(1),
        ],
      },
    },
  ],
  [
    'unavailable weapon',
    {
      history: {
        ...json.history,
        actions: [
          {
            type: 'strike',
            weaponId: 'unknown',
            anchor: { row: 0, col: 0 },
            rotation: 0,
          },
          ...json.history.actions.slice(1),
        ],
      },
    },
  ],
] as const) {
  assert.equal(
    restoreCombat({ ...json, ...forged }),
    null,
    `journal rejects ${label}`,
  )
}
assert.ok(
  restoreCombat({ ...json, history: undefined }),
  'old checkpoints without action histories remain loadable',
)

// Actual terminal outcomes, unlike edited snapshots, replay from earned actions.
const victoryStart = createCombat({
  seed: 43,
  rows: 4,
  cols: 4,
  enemy: { name: 'Glass Imp', hp: 2, attack: 0, every: 3 },
})
const victoryPair = victoryStart.cards.flatMap((card, i) =>
  card.pair === 0 ? [{ row: Math.floor(i / 4), col: i % 4 }] : [],
)
const earnedVictory = scout(victoryStart, victoryPair[0]!, victoryPair[1]!)
assert.equal(earnedVictory.outcome, 'victory')
assert.deepEqual(
  restoreCombat(JSON.parse(JSON.stringify(earnedVictory))),
  { ...earnedVictory, log: [] },
  'an earned victory survives journal replay',
)
const defeatStart = createCombat({
  seed: 44,
  rows: 4,
  cols: 4,
  enemy: { name: 'Glass Imp', hp: 99, attack: 4, every: 1 },
  playerHp: 4,
})
const mismatch = defeatStart.cards
  .map((card, i) => ({ card, i }))
  .filter((entry) => entry.card.pair !== null)
const first = mismatch[0]!
const other = mismatch.find((entry) => entry.card.pair !== first.card.pair)!
const earnedDefeat = scout(
  defeatStart,
  { row: Math.floor(first.i / 4), col: first.i % 4 },
  { row: Math.floor(other.i / 4), col: other.i % 4 },
)
assert.equal(earnedDefeat.outcome, 'defeat')
assert.deepEqual(
  restoreCombat(JSON.parse(JSON.stringify(earnedDefeat))),
  { ...earnedDefeat, log: [] },
  'an earned defeat survives journal replay',
)

const tampered = json.cards.map((c: { pair: number }, i: number) =>
  i ? c : { ...c, pair: (c.pair + 1) % 8 },
)
assert.equal(
  restoreCombat({ ...json, cards: tampered }),
  null,
  'a board whose pairs no longer come in twos is rejected',
)
assert.equal(
  restoreCombat({
    ...json,
    cards: json.cards.map((card: { pair: number }) => ({
      ...card,
      pair: card.pair + 8,
    })),
  }),
  null,
  'renumbering every pair outside the seeded board range cannot mint a new board',
)
assert.equal(
  restoreCombat({
    ...json,
    cards: json.cards.map(() => ({ pair: null, matched: false })),
  }),
  null,
  'an all-obstacle board cannot skip a combat encounter',
)
assert.equal(
  restoreCombat({
    ...json,
    cards: json.cards.map((card: { pair: number; matched: boolean }) => ({
      ...card,
      pair: card.pair === 0 ? 1 : card.pair === 1 ? 0 : card.pair,
    })),
  }),
  null,
  'relabeling complete pairs cannot move the hidden cards away from their seeded positions',
)
assert.equal(
  restoreCombat({ ...json, seed: json.seed + 1 }),
  null,
  'changing the seed without dealing a new board cannot manipulate pair locations',
)
assert.equal(
  restoreCombat({
    ...fresh.state,
    turn: 1,
    cards: fresh.state.cards.map((card) => ({
      ...card,
      matched: card.pair !== null,
    })),
    enemy: { ...fresh.state.enemy, hp: 0 },
    outcome: 'victory',
  }),
  null,
  'one action cannot resolve all eight pairs, even with a forged victory',
)
const redealStart = createCombat({
  seed: 91,
  rows: 2,
  cols: 2,
  enemy: { name: 'Patient Guardian', hp: 50, attack: 0, every: 20 },
})
const pairsToScout = [0, 1].map((pair) =>
  redealStart.cards.flatMap((card, i) =>
    card.pair === pair
      ? [{ row: Math.floor(i / redealStart.cols), col: i % redealStart.cols }]
      : [],
  ),
)
let redealt = redealStart
for (const [first, second] of pairsToScout)
  redealt = scout(redealt, first!, second!)
assert.ok(redealt.log.some((event) => event.type === 'redeal'))
assert.deepEqual(
  restoreCombat(JSON.parse(JSON.stringify(redealt))),
  { ...redealt, log: [] },
  'a genuine seed-derived redeal restores even when its layout differs from the opening board',
)
for (let seed = 1; seed <= 32; seed++) {
  const initial = createCombat({
    seed,
    rows: 4,
    cols: 4,
    enemy: { name: 'Patient Guardian', hp: 100, attack: 0, every: 20 },
  })
  let current = initial
  for (let pair = 0; pair < 8; pair++) {
    const positions = initial.cards.flatMap((card, i) =>
      card.pair === pair
        ? [{ row: Math.floor(i / initial.cols), col: i % initial.cols }]
        : [],
    )
    current = scout(current, positions[0]!, positions[1]!)
    assert.deepEqual(
      restoreCombat(JSON.parse(JSON.stringify(current))),
      { ...current, log: [] },
      `seed ${seed}, turn ${pair + 1}: a real played board remains restorable`,
    )
  }
  assert.ok(
    current.log.some((event) => event.type === 'redeal'),
    `seed ${seed}: clearing the board genuinely redeals it`,
  )
}
assert.equal(
  restoreCombat({
    ...json,
    cards: json.cards.map((card: { matched: boolean }, i: number) =>
      i === 0 ? { ...card, matched: !card.matched } : card,
    ),
  }),
  null,
  'one face of a pair cannot be marked matched on its own',
)
assert.equal(
  restoreCombat({ ...json, outcome: 'victory' }),
  null,
  'victory requires the enemy to have no health',
)
assert.equal(
  restoreCombat({ ...json, outcome: 'defeat' }),
  null,
  'defeat requires the player to have no health',
)
assert.equal(
  restoreCombat({ ...json, enemy: { ...json.enemy, hp: 0 } }),
  null,
  'an enemy at zero health cannot remain in a fighting checkpoint',
)
assert.equal(
  restoreCombat({
    ...json,
    outcome: 'victory',
    enemy: { ...json.enemy, hp: 0 },
  }),
  null,
  'a journaled checkpoint cannot claim victory without earned damage',
)
assert.equal(
  restoreCombat({ ...json, outcome: 'defeat', playerHp: 0 }),
  null,
  'a journaled checkpoint cannot invent an enemy attack',
)
assert.ok(
  restoreCombat({
    ...json,
    history: undefined,
    outcome: 'victory',
    enemy: { ...json.enemy, hp: 0 },
  }),
  'older unjournaled saves retain structural victory compatibility',
)
assert.ok(
  restoreCombat({
    ...json,
    history: undefined,
    outcome: 'defeat',
    playerHp: 0,
  }),
  'older unjournaled saves retain structural defeat compatibility',
)
const oddBoard = createCombat({
  seed: 17,
  rows: 5,
  cols: 5,
  enemy: { name: 'Puzzle Sentinel', hp: 8, attack: 1, every: 3 },
})
assert.ok(restoreCombat(oddBoard), 'odd boards retain their one legal obstacle')
assert.equal(
  restoreCombat({
    ...oddBoard,
    cards: oddBoard.cards.map((card) =>
      card.pair === null ? { ...card, matched: true } : card,
    ),
  }),
  null,
  'the odd-board obstacle can never count as a matched pair',
)

assert.equal(
  restoreBriarCombat({ state: json, images: images.slice(0, 3) }),
  null,
  'too few images',
)

const save = {
  ...newBriarSave(),
  room: 'memory',
  roomId: 'vault-2',
  combat: { state: json, images: fresh.images },
}
const restored = restoreBriarSave(JSON.parse(JSON.stringify(save)))
assert.equal(restored.room, 'memory')
assert.equal(restored.roomId, 'vault-2')
assert.equal(restored.combat?.state.enemy.hp, played.enemy.hp)
assert.deepEqual(restored.cards, [])
const noFight = restoreBriarSave({ ...save, combat: null })
assert.equal(
  noFight.room,
  'map',
  'a combat room without its fight returns to the map',
)
assert.equal(noFight.combat, null)
assert.equal(newBriarSave().combat, null)
// Every authored room restores its own enemy and original 4x4 board, never
// another room's enemy or inflated stats from a modified checkpoint.
for (const roomId of Object.keys(
  COMBAT_ROOMS,
) as (keyof typeof COMBAT_ROOMS)[]) {
  const original = startCombatRoom(roomId, 42, images)
  const enemy = original.state.enemy
  assert.deepEqual(
    restoreBriarCombat(original, roomId),
    original,
    `${roomId}: its own untouched fight restores`,
  )
  for (const [label, forged] of [
    ['name', { name: 'Invented Guardian' }],
    ['health pool', { maxHp: enemy.maxHp + 1 }],
    ['damage', { attack: enemy.attack + 1 }],
    ['attack interval', { every: enemy.every + 1 }],
    ['telegraph delay', { beatsLeft: enemy.every + 1 }],
    ['zero telegraph', { beatsLeft: 0 }],
  ] as const) {
    assert.equal(
      restoreBriarCombat(
        {
          ...original,
          state: { ...original.state, enemy: { ...enemy, ...forged } },
        },
        roomId,
      ),
      null,
      `${roomId}: forged ${label} is rejected`,
    )
  }
  for (const [label, forged] of [
    ['hearts', { playerHp: COMBAT_ROOMS[roomId].playerHp + 1 }],
    ['focus', { focus: COMBAT_ROOMS[roomId].focus + 1 }],
    ['rows', { rows: 2, cols: 8 }],
    [
      'initial health',
      { history: { ...original.state.history, initialPlayerHp: 99 } },
    ],
    [
      'initial Focus',
      { history: { ...original.state.history, initialFocus: 99 } },
    ],
  ] as const) {
    assert.equal(
      restoreBriarCombat(
        { ...original, state: { ...original.state, ...forged } },
        roomId,
      ),
      null,
      `${roomId}: forged ${label} is rejected`,
    )
  }
  const forbiddenWeapon = (Object.keys(WEAPONS) as WeaponId[]).find(
    (id) => !COMBAT_ROOMS[roomId].loadout.includes(id),
  )
  if (forbiddenWeapon) {
    const forged = strike(original.state, forbiddenWeapon, { row: 0, col: 0 })
    assert.equal(forged.turn, 1, 'the forbidden weapon can fire in isolation')
    assert.ok(
      restoreCombat(forged),
      'the forged action is internally replayable',
    )
    assert.equal(
      restoreBriarCombat({ ...original, state: forged }, roomId),
      null,
      `${roomId}: a valid replay cannot use an unearned weapon`,
    )
  }
}
assert.equal(
  restoreBriarSave({
    ...save,
    roomId: 'collector',
  }).room,
  'map',
  'a valid Warden board cannot impersonate the House Collector',
)
// A House guardian duel saved mid-fight restores to the same guardian, and a
// duel saved before the guardians had boards of their own still restores.
for (const roomId of ['collector', 'sprite'] as const) {
  const guardian = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...save,
        roomId,
        combat: startCombatRoom(roomId, 42, images),
        house: { ...newBriarSave().house, current: 'HD-22' },
      }),
    ),
  )
  assert.equal(guardian.room, 'memory')
  assert.equal(guardian.roomId, roomId)
}
const classic = restoreBriarSave({
  ...newBriarSave(),
  room: 'memory',
  roomId: 'vault-1',
  cards: [
    { id: 0, pairId: 0, image: '/a.webp', flipped: false, matched: false },
    { id: 1, pairId: 0, image: '/a.webp', flipped: false, matched: false },
  ],
})
assert.equal(
  classic.room,
  'memory',
  'Classic rooms still restore from their cards',
)
assert.equal(classic.combat, null)

// 5. The board: mounted in the overworld, previews before commit, reachable by keyboard and reader.
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
const board = readFileSync('components/memory-dungeon/combat-board.vue', 'utf8')
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(overworld, /<memory-dungeon-combat-board/)
assert.match(
  overworld,
  /v-if="!world\.state\.combat"[\s\S]*?peekPair/,
  'Lantern replaces Peek in fights',
)
assert.match(board, /role="grid"/)
assert.match(board, /role="gridcell"/)
assert.match(board, /aria-live="polite"/)
assert.match(board, /aria-keyshortcuts="R"/)
assert.match(
  board,
  /ArrowUp[\s\S]*ArrowRight/,
  'arrow keys move across the board',
)
assert.match(board, /maskAt\(/, 'the shape is previewed where the player aims')
assert.match(
  board,
  /strikeBlocked\(/,
  'and an illegal or unaffordable strike says why before commit',
)
assert.match(board, /cellLabel/, 'every cell has a spoken label')
assert.match(
  store,
  /COMBAT_ROOMS\[roomId\]\.loadout\.includes\(weapon\)/,
  'the store only fires weapons the room grants',
)
assert.match(
  store,
  /resolveMemoryDungeonDeck\(deck\.value, required\)/,
  'fights use the shared deck choice',
)
assert.match(
  store,
  /HOUSE_DUEL_ROOMS\[house\.current as HouseDuelOrigin\]/,
  'a House duel begins its own guardian room',
)
assert.match(
  store,
  /room === HOUSE_DUEL_ROOMS\[houseOrigin\] \|\|\s+room === 'sprite' \|\|\s+room === 'patrol'/,
  'and a duel begun before the guardians had boards still finishes',
)

// 6. The Dark Briar's bouts: three optional fights beside the scene choice,
// each its own room, remembered in the Dark Briar save, never a gate.
assert.deepEqual(
  Object.fromEntries(
    Object.values(DARK_BRIAR_DUELS).map((duel) => [duel.key, duel.room]),
  ),
  { '5,5': 'moss-judge', '7,3': 'unpaid-patrol', '7,1': 'empty-armor' },
)
for (const duel of Object.values(DARK_BRIAR_DUELS)) {
  assert.ok(DARK_BRIAR_SCENES[duel.key], `${duel.key} is a Dark Briar scene`)
  assert.ok(isCombatRoom(duel.room))
  assert.equal(darkBriarDuelForRoom(duel.room), duel)
  assert.ok(duel.offer.length > 10 && duel.victory.length > 60)
  assert.ok(
    COMBAT_ROOMS[duel.room].artPrompt.endsWith(
      'Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    ),
    `${duel.room} is painted in the Dark Briar's light`,
  )
  assert.equal(isHouseDuelOrigin(duel.key), false)
}
assert.equal(darkBriarDuelForRoom('sprite'), null, 'Briar fights stay Briar')
assert.equal(darkBriarDuelForRoom(null), null)

const explored = {
  ...newDarkBriarProgress(),
  phase: 'exploring' as const,
  revealed: ['2,4', '5,5'],
  visited: ['2,4', '5,5'],
  player: '5,5',
}
assert.equal(darkBriarCanDuel(explored, '5,5'), true)
assert.equal(
  darkBriarCanDuel({ ...explored, player: '2,4' }, '5,5'),
  false,
  'a bout is offered only where the challenger stands',
)
assert.equal(darkBriarCanDuel({ ...explored, phase: 'matching' }, '5,5'), false)
assert.equal(darkBriarCanDuel({ ...explored, duels: ['5,5'] }, '5,5'), false)
assert.equal(darkBriarCanDuel(explored, '2,4'), false, 'no bout at camp')
const decided = darkBriarChoose(explored, '5,5', 'witness')
assert.equal(
  darkBriarCanDuel(decided, '5,5'),
  true,
  'the bout stays open after the scene decision',
)

// Saves: won bouts restore; old saves gain an empty list; forged keys drop.
assert.deepEqual(newDarkBriarProgress().duels, [])
assert.equal(newDarkBriarProgress().duelReturn, null)
const earlier = DARK_BRIAR_WAVES.slice(0, 3).flat()
const darkSave = {
  ...newDarkBriarProgress(),
  waveIndex: 3,
  revealed: earlier,
  visited: earlier,
  duels: ['5,5', '7,3', '9,9', '2,4'],
  duelReturn: 'house',
}
const reloadedDark = restoreDarkBriarProgress(
  JSON.parse(JSON.stringify(darkSave)),
)
assert.deepEqual(
  reloadedDark.duels,
  ['5,5', '7,3'],
  'won bouts restore; forged and non-bout keys drop',
)
assert.equal(reloadedDark.duelReturn, 'house')
const { duels: _d, duelReturn: _r, ...olderDark } = darkSave
const fromOlder = restoreDarkBriarProgress(
  JSON.parse(JSON.stringify(olderDark)),
)
assert.deepEqual(fromOlder.duels, [], 'saves from before the bouts restore')
assert.equal(fromOlder.duelReturn, null)
assert.equal(
  restoreDarkBriarProgress({ ...darkSave, duelReturn: 'memory' }).duelReturn,
  null,
)

// A bout in progress restores on the Briar save like any combat room, and a
// lost bout never sends the Briar traveller back to camp.
const bout = startCombatRoom('moss-judge', 7, images)
const boutSave = restoreBriarSave(
  JSON.parse(
    JSON.stringify({
      ...newBriarSave(),
      room: 'memory',
      roomId: 'moss-judge',
      combat: bout,
      player: '6,4',
    }),
  ),
)
assert.equal(boutSave.room, 'memory')
assert.equal(boutSave.roomId, 'moss-judge')
const lostBout = recoverBriarCombatDefeat({
  ...newBriarSave(),
  room: 'memory',
  roomId: 'moss-judge',
  player: '6,4',
  hearts: 1,
  combat: { ...bout, state: { ...bout.state, outcome: 'defeat' } },
})
assert.equal(lostBout.room, 'map')
assert.equal(lostBout.player, '6,4', 'a lost bout keeps the Briar position')
assert.equal(lostBout.hearts, 3)

const stage = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
assert.match(stage, /world\.startDarkDuel\(\)/, 'the stage offers the bout')
assert.match(stage, /data-testid="dark-briar-duel"/)
assert.match(
  overworld,
  /v-if="world\.activeReality === 'e02' && !world\.darkDuelActive"/,
  'the Dark Briar stage yields to the combat board during a bout',
)
assert.match(store, /const darkDuel = darkBriarDuelForRoom\(room\)/)
assert.match(store, /finishDarkDuel\(darkDuel\)/)
assert.match(store, /closeDarkDuel\(/)

console.log(
  'Memory Dungeon combat rooms: aiming, room tools, narration, saves, accessible board and Dark Briar bouts verified',
)

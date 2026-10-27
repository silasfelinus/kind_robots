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
import { newBriarSave, restoreBriarSave } from '../memoryDungeonWorld'

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

// 2. Rooms: the forest duels, the Warden and the House's three guardian duels,
// Classic Echo Chamber untouched, tools that fit.
assert.deepEqual(Object.keys(COMBAT_ROOMS).sort(), [
  'collector',
  'hearth-guard',
  'patrol',
  'sprite',
  'twinned-guard',
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
const tampered = json.cards.map((c: { pair: number }, i: number) =>
  i ? c : { ...c, pair: (c.pair + 1) % 8 },
)
assert.equal(
  restoreCombat({ ...json, cards: tampered }),
  null,
  'a board whose pairs no longer come in twos is rejected',
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
// A House guardian duel saved mid-fight restores to the same guardian, and a
// duel saved before the guardians had boards of their own still restores.
for (const roomId of ['collector', 'sprite'] as const) {
  const guardian = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...save,
        roomId,
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

console.log(
  'Memory Dungeon combat rooms: aiming, room tools, narration, saves and accessible board verified',
)

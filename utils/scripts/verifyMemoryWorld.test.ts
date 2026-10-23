import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_DUNGEON_DECK,
  DESIGNED_DUNGEON_ART,
  isEligibleDungeonArt,
  normalizeDungeonDeck,
  uniqueDeckPaths,
} from '../memoryDungeonDeck'

import {
  BRIAR_DUNGEON,
  BRIAR_GATE,
  BRIAR_LINKS,
  BRIAR_SITES,
  BRIAR_START,
  BRIAR_TILES,
  briarConnected,
  newBriarSave,
  restoreBriarSave,
  validateBriarLinks,
} from '../memoryDungeonWorld'

assert.deepEqual(
  validateBriarLinks(),
  [],
  'All reveal links are in-bounds, adjacent, and expose at most two new options',
)
assert.equal(BRIAR_TILES.length, 64)
assert.equal(new Set(BRIAR_TILES.map((tile) => tile.key)).size, 64)

const first = newBriarSave()
assert.deepEqual(first.frontier, ['3,4', '2,5'])
assert.equal(first.attempts, 0)
assert.equal(first.player, BRIAR_START)

const visited = new Set(first.revealed)
const queue = [...first.revealed]
while (queue.length) {
  const current = queue.shift()!
  for (const next of BRIAR_LINKS[current] ?? []) {
    if (!visited.has(next)) {
      visited.add(next)
      queue.push(next)
    }
  }
}
for (const site of Object.keys(BRIAR_SITES)) {
  assert.equal(
    visited.has(site),
    true,
    `Player can eventually reveal site ${site}`,
  )
}
assert.equal(visited.has(BRIAR_DUNGEON), true)
assert.equal(visited.has(BRIAR_GATE), true)
assert.equal(BRIAR_SITES['4,2']?.kind, 'merchant')
assert.equal(BRIAR_SITES['2,7']?.kind, 'puzzle')
assert.equal(BRIAR_SITES['3,6']?.kind, 'chest')
assert.equal(BRIAR_SITES['7,6']?.kind, 'chest')
assert.equal(BRIAR_SITES['5,2']?.kind, 'sealed')

const road = ['2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '8,4']
assert.equal(briarConnected(BRIAR_START, BRIAR_GATE, road), true)
assert.equal(briarConnected(BRIAR_START, BRIAR_GATE, road.slice(0, -1)), false)

const saved = {
  ...newBriarSave(),
  revealed: ['1,4', '2,4', '3,4', '99,99', '3,4'],
  frontier: ['4,4', '-1,1', '3,4'],
  player: '3,4',
  attempts: 11,
  cards: [
    { id: 0, pairId: 0, image: '/ok.jpg', matched: false, flipped: true },
  ],
  room: 'memory',
  roomId: 'vault-1',
}
const restored = restoreBriarSave(saved)
assert.deepEqual(restored.revealed, ['2,4', '1,4', '3,4'])
assert.deepEqual(restored.frontier, ['4,4'])
assert.equal(restored.player, '3,4')
assert.equal(restored.attempts, 11)
assert.equal(
  restored.cards[0]?.flipped,
  false,
  'Incomplete one-card turn is discarded safely',
)
assert.equal(
  restored.room,
  'memory',
  'Active matching room can resume after reload',
)
assert.equal(
  restoreBriarSave({ ...saved, version: 999 }).attempts,
  0,
  'Unknown schema resets safely',
)
assert.equal(
  restoreBriarSave({ ...saved, attempts: -99 }).attempts,
  0,
  'Corrupt attempts cannot go negative',
)

console.log(
  'Memory Dungeon Briar Camp: reveal routes, landmarks and save contracts passed.',
)

assert.equal(
  DESIGNED_DUNGEON_ART.length,
  18,
  'Designed fantasy deck has eighteen unique art faces',
)
assert.equal(
  new Set(DESIGNED_DUNGEON_ART.map((item) => item.imagePath)).size,
  8,
)
assert.equal(
  DESIGNED_DUNGEON_ART.every((entry) =>
    entry.imagePath.startsWith('data:image/svg+xml'),
  ),
  true,
)
assert.deepEqual(normalizeDungeonDeck({}), DEFAULT_DUNGEON_DECK)
assert.equal(normalizeDungeonDeck({ family: 'bad' }).family, 'designed')
assert.deepEqual(
  normalizeDungeonDeck({ collectionIds: [1, 1, -1, 2] }).collectionIds,
  [1, 2],
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, false, false),
  true,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: false, isMature: false }, true, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: null, isMature: false }, false, false),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isActive: false }, true, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, false, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, false),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, true),
  true,
)
assert.deepEqual(
  uniqueDeckPaths(['/forest.jpg', '/forest.jpg', '', '/sun.jpg']),
  ['/forest.jpg', '/sun.jpg'],
)

const classicScreen = readFileSync(
  'components/pages/memory-dungeon.vue',
  'utf8',
)
const mapScreen = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
const launcherScreen = readFileSync(
  'components/pages/memory-dungeon-launcher.vue',
  'utf8',
)
const memoryCore = readFileSync('stores/memoryStore.ts', 'utf8')
assert.match(
  classicScreen,
  /<memory-dungeon-deck-selector/,
  'Classic settings mount shared art selector',
)
assert.match(
  mapScreen,
  /<memory-dungeon-deck-selector/,
  'Overworld settings mount shared art selector',
)
assert.match(
  launcherScreen,
  /<memory-dungeon-deck-selector/,
  'Launcher mounts shared art selector',
)
assert.doesNotMatch(
  classicScreen,
  /<collection-picker/,
  'Classic does not retain duplicate gallery picker',
)
assert.match(
  classicScreen,
  /setGameSuiteDeckResolver/,
  'Classic supplies the same resolver to memory store',
)
assert.match(
  classicScreen,
  /resolveMemoryDungeonDeck\(selection, needed\)/,
  'Classic resolves using locked shared settings',
)
assert.match(
  memoryCore,
  /if \(gameSuiteDeckResolver\)/,
  'Both Classic and RPG can resolve selected image pools',
)
assert.match(
  memoryCore,
  /new Set\(imagePaths\)\.size !== needed/,
  'Classic rejects duplicate card faces',
)

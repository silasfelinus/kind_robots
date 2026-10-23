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
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_REVEAL_WAVES,
  BRIAR_WAVE_SIZES,
  createBriarWaveCards,
  validateBriarWaves,
} from '../memoryDungeonWaves'

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
assert.deepEqual(first.frontier, [])
assert.deepEqual(first.revealed, [])
assert.equal(first.waveIndex, 0)
assert.equal(first.wavePhase, 'matching')
assert.equal(first.attempts, 0)
assert.equal(first.player, BRIAR_START)

const visited = new Set([BRIAR_START])
const queue = [BRIAR_START]
while (queue.length) {
  const current = queue.shift()!
  for (const next of BRIAR_LINKS[current] ?? []) {
    if (!visited.has(next)) {
      visited.add(next)
      queue.push(next)
    }
  }
}
for (const site of Object.keys(BRIAR_SITES).filter((key) => !BRIAR_CROSS_MAP_KEYS.includes(key as (typeof BRIAR_CROSS_MAP_KEYS)[number]))) {
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
assert.deepEqual(restored.revealed, ['1,4', '2,4', '3,4'])
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
  32,
  'Designed fantasy deck has thirty-two unique art faces',
)
assert.equal(
  new Set(DESIGNED_DUNGEON_ART.map((item) => item.imagePath)).size,
  32,
)
assert.equal(
  DESIGNED_DUNGEON_ART.every((entry) =>
    entry.imagePath.startsWith('data:image/svg+xml'),
  ),
  true,
)
assert.deepEqual(normalizeDungeonDeck({}), DEFAULT_DUNGEON_DECK)
assert.equal(normalizeDungeonDeck({ gallery: 'generated' }).gallery, 'generated')
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


assert.deepEqual(validateBriarWaves(), [])
assert.deepEqual(BRIAR_REVEAL_WAVES.map((wave) => wave.length), BRIAR_WAVE_SIZES)
assert.equal(BRIAR_REVEAL_WAVES.flat().length, 60)
assert.equal(new Set([...BRIAR_REVEAL_WAVES.flat(), ...BRIAR_CROSS_MAP_KEYS]).size, 64)
assert.equal(BRIAR_CROSS_MAP_KEYS.length, 4)
for (const [index, wave] of BRIAR_REVEAL_WAVES.entries()) {
  const faces = Array.from({ length: wave.length / 2 }, (_, pair) => `/design/pair-${pair}.png`)
  const cards = createBriarWaveCards(wave, faces, () => 0.4)
  assert.equal(cards.length, wave.length, `wave ${index + 1} has expected card count`)
  assert.equal(new Set(cards.map((card) => card.tile)).size, wave.length)
  for (const image of faces) {
    assert.equal(cards.filter((card) => card.image === image).length, 2)
  }
}
assert.throws(() => createBriarWaveCards(['2,4','3,4'], ['/same.jpg','/same.jpg']))
assert.equal(BRIAR_SITES['4,2']?.kind, 'merchant')
assert.equal(BRIAR_SITES['6,2']?.kind, 'dungeon')
assert.equal(isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 42, true), true,
  'Explicitly selected owner art can be used in custom decks')
assert.equal(isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 77, true), false,
  'Another user’s private art is always excluded')

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

assert.match(mapScreen, /world\.pickMapCard/, 'Map cards must be matched, not single-click unveiled')
assert.match(mapScreen, /world\.nextWave/, 'Player actively begins each subsequent reveal round')
assert.doesNotMatch(mapScreen, /world\.state\.frontier\.includes/, 'Prototype single-click fog reveal is removed')

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_DUNGEON_DECK,
  DESIGNED_DUNGEON_ART,
  isEligibleDungeonArt,
  normalizeDungeonDeck,
  uniqueDeckPaths,
  unseenDeckPaths,
  deckImageIdentity,
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
  briarTileProgress,
  newBriarSave,
  restoreBriarSave,
  validateBriarLinks,
} from '../memoryDungeonWorld'
import {
  BRIAR_SCENES,
  briarSceneOpening,
  canChooseBriarScene,
} from '../memoryDungeon/scenes'

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

assert.equal(
  first.prologueChoice,
  null,
  'New games have not yet chosen a prologue path',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'terms' })
    .prologueChoice,
  'terms',
  'The opening choice survives a browser reload',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'anchor' })
    .prologueChoice,
  'anchor',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'invalid' })
    .prologueChoice,
  null,
  'Old and malformed saves cannot invent a prologue outcome',
)

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
for (const site of Object.keys(BRIAR_SITES).filter(
  (key) =>
    !BRIAR_CROSS_MAP_KEYS.includes(
      key as (typeof BRIAR_CROSS_MAP_KEYS)[number],
    ),
)) {
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

const firstBriarExpansion = [
  '1,5',
  '1,6',
  '1,7',
  '2,7',
  '2,2',
  '2,1',
  '3,1',
  '4,1',
  '6,1',
  '7,1',
  '7,2',
  '4,5',
  '5,3',
  '5,6',
  '6,7',
  '7,5',
]
for (const key of firstBriarExpansion) {
  assert.ok(BRIAR_SCENES[key], `Expanded scene ${key} is authored`)
  assert.equal(BRIAR_SCENES[key]?.choices.length, 2)
  assert.ok(visited.has(key), `Scene ${key} is reachable from Briar Camp`)
  const savedChoices = Object.fromEntries(
    firstBriarExpansion.map((site) => [
      site,
      BRIAR_SCENES[site]!.choices[0]!.id,
    ]),
  )
  const save = restoreBriarSave({
    ...newBriarSave(),
    sceneChoices: savedChoices,
  })
  assert.equal(save.sceneChoices[key], BRIAR_SCENES[key]?.choices[0]?.id)
}
assert.equal(
  new Set(firstBriarExpansion).size,
  16,
  'First Briar expansion adds exactly sixteen unique coordinates',
)
assert.match(
  briarSceneOpening(BRIAR_SCENES['7,2']!, { '2,2': 'observe' }),
  /wolf patrol tracks/,
  "Forest court reflects the player's earlier investigation",
)

const sceneCoordinates = Object.keys(BRIAR_SCENES)
assert.ok(
  sceneCoordinates.length >= 12,
  'World 1 begins with authored individual scenes',
)
for (const key of sceneCoordinates) {
  assert.ok(
    BRIAR_TILES.some((tile) => tile.key === key),
    `Scene ${key} is on map`,
  )
  const scene = BRIAR_SCENES[key]!
  assert.ok(scene.opening.length > 100, `Scene ${key} has prose`)
  assert.ok(scene.artPrompt.length > 40, `Scene ${key} has an art brief`)
  assert.equal(scene.choices.length, 2, `Scene ${key} has two decisions`)
  assert.equal(new Set(scene.choices.map((option) => option.id)).size, 2)
}

assert.equal(
  BRIAR_SCENES['4,4']?.choices.length,
  2,
  'The mermaid twins offer two different responses',
)
assert.match(BRIAR_SCENES['4,4']!.opening, /Scylla/)
assert.match(BRIAR_SCENES['4,4']!.opening, /Charybdis/)
assert.match(BRIAR_SCENES['4,3']!.opening, /executioner’s hood/)
assert.match(
  briarSceneOpening(BRIAR_SCENES['4,3']!, { '4,4': 'escort' }),
  /UNNECESSARY BUT BINDING/,
  "Oren responds to the player's earlier choice",
)

assert.match(
  briarSceneOpening(BRIAR_SCENES['6,4']!, { '3,5': 'light' }),
  /own voice thanks to you/,
  'Pip recalls an earlier decision',
)
assert.equal(
  canChooseBriarScene(BRIAR_SCENES['2,4']!.choices[0]!, {
    lanterns: 0,
    wildflowers: 0,
  }),
  false,
  'Players cannot spend a lantern they lack',
)
assert.equal(
  canChooseBriarScene(BRIAR_SCENES['2,4']!.choices[1]!, {
    lanterns: 0,
    wildflowers: 0,
  }),
  true,
  'A no-cost story continuation remains available',
)
const visitSave = {
  ...newBriarSave(),
  revealed: ['2,4', '3,4', '3,6', '5,5', '5,2', '6,2', '8,4', '2,7'],
  visited: ['2,4', '3,6', '5,5', '5,2', '6,2', '8,4', '2,7'],
}
assert.equal(briarTileProgress(visitSave, '4,8'), 'hidden')
assert.equal(briarTileProgress(visitSave, '3,4'), 'unvisited')
assert.equal(briarTileProgress(visitSave, '2,4'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '3,6'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '5,5'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '5,2'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '6,2'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '8,4'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '2,7'), 'unfinished')
const settledSave = {
  ...visitSave,
  sceneChoices: { '2,4': 'copy', '5,5': 'gift' },
  chestClaims: ['3,6'],
  completedEncounters: ['5,5'],
  relics: ['bramble-chime'],
  gateOpened: true,
  puzzleSolved: true,
}
for (const key of ['2,4', '3,6', '5,5', '6,2', '8,4', '2,7']) {
  assert.equal(
    briarTileProgress(settledSave, key),
    'complete',
    `${key} clears only when resolved`,
  )
}
assert.equal(
  briarTileProgress({ ...settledSave, completedEncounters: [] }, '5,5'),
  'unfinished',
  'Hearing the Sprite without completing its duel does not clear the square',
)
assert.equal(
  briarTileProgress(settledSave, '5,2'),
  'unfinished',
  'Cross-world seals remain pending',
)
const restoredScene = restoreBriarSave({
  ...settledSave,
  sceneChoices: { ...settledSave.sceneChoices, '3,4': 'invalid' },
})
assert.equal(restoredScene.sceneChoices['2,4'], 'copy')
assert.equal(restoredScene.sceneChoices['3,4'], undefined)
assert.ok(restoredScene.visited.includes('3,6'))
assert.ok(
  restoreBriarSave({
    ...newBriarSave(),
    revealed: ['2,4'],
    player: '2,4',
    visited: undefined,
    sceneChoices: undefined,
  }).visited.includes('2,4'),
  'Older saves recover the last visited square',
)

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
  36,
  'Designed fantasy deck has thirty-six unique art faces',
)
assert.equal(
  new Set(DESIGNED_DUNGEON_ART.map((item) => item.imagePath)).size,
  36,
)
assert.equal(
  DESIGNED_DUNGEON_ART.every((entry) =>
    entry.imagePath.startsWith('data:image/svg+xml'),
  ),
  true,
)
assert.deepEqual(normalizeDungeonDeck({}), DEFAULT_DUNGEON_DECK)
assert.equal(
  normalizeDungeonDeck({ gallery: 'generated' }).gallery,
  'generated',
)
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
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, true, true),
  false,
  'Mature-only mode must exclude all non-mature cards rather than mixing them',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, false, true),
  false,
  'Non-mature mode must never include mature art',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, false),
  false,
  'Guest, child, or mature-off accounts cannot force mature cards through local settings',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, false, false),
  true,
  'Anonymous and restricted users still get normal public safe art',
)
assert.deepEqual(
  uniqueDeckPaths(['/forest.jpg', '/forest.jpg', '', '/sun.jpg']),
  ['/forest.jpg', '/sun.jpg'],
)

assert.deepEqual(validateBriarWaves(), [])
assert.deepEqual(
  BRIAR_REVEAL_WAVES.map((wave) => wave.length),
  BRIAR_WAVE_SIZES,
)
assert.equal(BRIAR_REVEAL_WAVES.flat().length, 60)
assert.equal(
  new Set([...BRIAR_REVEAL_WAVES.flat(), ...BRIAR_CROSS_MAP_KEYS]).size,
  64,
)
assert.equal(BRIAR_CROSS_MAP_KEYS.length, 4)
for (const [index, wave] of BRIAR_REVEAL_WAVES.entries()) {
  const faces = Array.from(
    { length: wave.length / 2 },
    (_, pair) => `/design/pair-${pair}.png`,
  )
  const cards = createBriarWaveCards(wave, faces, () => 0.4)
  assert.equal(
    cards.length,
    wave.length,
    `wave ${index + 1} has expected card count`,
  )
  assert.equal(new Set(cards.map((card) => card.tile)).size, wave.length)
  for (const image of faces) {
    assert.equal(cards.filter((card) => card.image === image).length, 2)
  }
}
assert.throws(() =>
  createBriarWaveCards(['2,4', '3,4'], ['/same.jpg', '/same.jpg']),
)
assert.equal(BRIAR_SITES['4,2']?.kind, 'merchant')
assert.equal(BRIAR_SITES['6,2']?.kind, 'dungeon')
assert.equal(
  isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 42, true),
  true,
  'Explicitly selected owner art can be used in custom decks',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 77, true),
  false,
  'Another user’s private art is always excluded',
)

assert.deepEqual(
  unseenDeckPaths(
    ['/owl.png', '/fern.png', '/owl.png', '/moth.png'],
    ['/owl.png'],
  ),
  ['/fern.png', '/moth.png'],
  'Previously drawn images never re-enter the playable pool',
)
assert.equal(
  deckImageIdentity(
    '/api/art/image/archive/319?variant=medium&exp=100&sig=old',
  ),
  '/api/art/image/archive/319',
)
assert.deepEqual(
  unseenDeckPaths(
    [
      '/api/art/image/archive/319?exp=200&sig=new',
      '/api/art/image/archive/320?exp=200&sig=new',
    ],
    ['/api/art/image/archive/319?exp=100&sig=old'],
  ),
  ['/api/art/image/archive/320?exp=200&sig=new'],
  'Signed URL refresh never allows the same artwork to repeat',
)
assert.deepEqual(
  unseenDeckPaths(['/one.png', '/one.png'], ['/one.png']),
  [],
  'Exhausted collection must not silently recycle an image',
)

const pool = Array.from({ length: 60 }, (_, i) => `/fresh-${i}.jpg`)
const alreadyUsed = new Set<string>()
for (const wave of BRIAR_REVEAL_WAVES) {
  const fresh = unseenDeckPaths(pool, [...alreadyUsed]).slice(
    0,
    wave.length / 2,
  )
  assert.equal(fresh.length, wave.length / 2)
  assert.equal(fresh.filter((value) => alreadyUsed.has(value)).length, 0)
  for (const path of fresh) alreadyUsed.add(path)
}
assert.equal(alreadyUsed.size, 30)
const usedSave = restoreBriarSave({
  ...newBriarSave(),
  seenMapImages: ['/already.jpg', '/other.jpg', '/already.jpg'],
  mapCards: [
    {
      id: 0,
      pairId: 0,
      image: '/current.jpg',
      tile: '2,4',
      flipped: true,
      matched: false,
    },
  ],
})
assert.deepEqual(usedSave.seenMapImages, [
  '/already.jpg',
  '/other.jpg',
  '/current.jpg',
])
assert.deepEqual(
  newBriarSave().seenMapImages,
  [],
  'New expedition starts with a fresh art history',
)
assert.deepEqual(
  unseenDeckPaths(
    ['/already.jpg', '/current.jpg', '/new.jpg'],
    usedSave.seenMapImages,
  ),
  ['/new.jpg'],
  'Reloaded save still blocks all previously seen cards',
)

assert.equal(
  newBriarSave().mapDeckSignature,
  '',
  'New runs have no old deck binding',
)
const restoredDeck = restoreBriarSave({
  ...newBriarSave(),
  mapDeckSignature: '{"family":"gallery","gallery":"collections"}',
  revealed: ['2,4', '1,4'],
  attempts: 19,
})
assert.equal(
  restoredDeck.mapDeckSignature,
  '{"family":"gallery","gallery":"collections"}',
)
assert.deepEqual(restoredDeck.revealed, ['2,4', '1,4'])
assert.equal(restoredDeck.attempts, 19)
const oldDeckSave = restoreBriarSave({
  ...newBriarSave(),
  mapDeckSignature: undefined,
  mapCards: [
    {
      id: 0,
      pairId: 0,
      image: '/designed.svg',
      tile: '2,4',
      flipped: false,
      matched: false,
    },
  ],
})
assert.equal(
  oldDeckSave.mapDeckSignature,
  '',
  'Older saves must trigger art-source reconciliation',
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
const worldStoreSource = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const deckLoaderSource = readFileSync(
  'stores/helpers/memoryDungeonDeckSource.ts',
  'utf8',
)
assert.match(
  worldStoreSource,
  /state\.value\.seenMapImages/,
  'Overworld persists used image history',
)
assert.match(
  worldStoreSource,
  /keys\.length \/ 2,[\s\S]*?usedPrior,[\s\S]*?state\.value\.seenMapImages/,
  'A new map round excludes all previous wave images',
)
assert.match(
  classicScreen,
  /runSeenImages\.add\(path\)/,
  'Classic records images once each floor is dealt',
)
assert.match(
  deckLoaderSource,
  /unseenDeckPaths\(/,
  'All gallery and model pools exclude previous images',
)

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
  /data-testid="memory-dungeon-prologue"/,
  'The new full-screen opening is part of the existing memory game',
)
assert.match(
  launcherScreen,
  /world\.recordPrologueChoice\(choice\)/,
  'A prologue choice is persisted before entry',
)
assert.match(
  launcherScreen,
  /hasExistingSave/,
  'Existing runs resume without forcing the new prologue',
)
assert.match(
  worldStoreSource,
  /function recordPrologueChoice\(/,
  'Only the store changes game state',
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
  /resolveMemoryDungeonDeck\([\s\S]*?selection, needed, 0, \[\.\.\.runSeenImages\]/,
  'Classic resolves with a per-run exclusion list of previous floors',
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

assert.match(mapScreen, /:data-progress="progressFor\(tile\.key\)"/)
assert.match(mapScreen, /progressLabel\(tile\.key\)/)
assert.match(mapScreen, /world\.chooseScene\(choice\.id\)/)
assert.match(worldStoreSource, /state\.value\.sceneChoices\[key\] = choice\.id/)
assert.match(worldStoreSource, /state\.value\.visited\.push\(key\)/)
assert.match(
  mapScreen,
  /world\.pickMapCard/,
  'Map cards must be matched, not single-click unveiled',
)
assert.match(
  mapScreen,
  /world\.nextWave/,
  'Player actively begins each subsequent reveal round',
)
assert.doesNotMatch(
  mapScreen,
  /world\.state\.frontier\.includes/,
  'Prototype single-click fog reveal is removed',
)

const sharedFlipCss = readFileSync('assets/css/memory-dungeon.css', 'utf8')
const combatBoard = readFileSync(
  'components/memory-dungeon/combat-board.vue',
  'utf8',
)
assert.match(
  worldStoreSource,
  /async function refreshMapDeck\(/,
  'Changing galleries must refresh the active map deck',
)
assert.match(
  worldStoreSource,
  /if \(previous !== currentDeckSignature\.value && mapMatching\.value\)/,
  'Deck selection changes must be applied immediately while matching',
)
assert.match(
  worldStoreSource,
  /state\.value\.mapCards[\s\S]*?\.filter\(\(card\) => !card\.matched\)/,
  'Refacing the board must preserve matched cards and revealed terrain',
)
assert.match(
  worldStoreSource,
  /state\.value\.mapDeckSignature = currentDeckSignature\.value/,
  'Successful deck loads must record the applied source',
)
assert.match(
  mapScreen,
  /world\.syncActiveMapDeck\(\)/,
  'Older saved maps automatically resync artwork on opening',
)
assert.match(
  mapScreen,
  /world\.mapDeckError/,
  'Failed custom-gallery loads must show a visible error',
)
assert.match(
  mapScreen,
  /role="dialog"/,
  'Settings float as a game panel instead of reducing map height',
)
assert.match(
  mapScreen,
  /md-card-inner/,
  'Map cards animate with the same flip vocabulary as Classic',
)
assert.match(combatBoard, /md-card-inner/, 'Combat cards animate the same way')
assert.match(
  sharedFlipCss,
  /transition: transform 0\.55s ease/,
  '3D flip retains Classic Match animation timing',
)

const selectorSource = readFileSync(
  'components/memory-dungeon/deck-selector.vue',
  'utf8',
)
const imageApiSource = readFileSync('server/api/art/memory-deck.get.ts', 'utf8')
const collectionPickerSource = readFileSync(
  'components/art/collection-picker.vue',
  'utf8',
)
assert.match(
  selectorSource,
  /selected\.family !== 'designed' && matureAvailable/,
  'Mature selection controls are completely hidden from guests, child roles, and mature-off users',
)
assert.match(selectorSource, /Non-mature only/)
assert.match(selectorSource, /Mature only/)
assert.doesNotMatch(
  selectorSource,
  /Include mature, public art/,
  'The old mixed-rating checkbox must not return',
)
assert.match(worldStoreSource, /userStore\.isLoggedIn/)
assert.match(worldStoreSource, /!userStore\.isChild/)
assert.match(
  worldStoreSource,
  /userStore\.showMature === true/,
  'Mature permission uses the restricted effective user-store preference',
)
assert.match(imageApiSource, /access\.isAuthenticated/)
assert.match(imageApiSource, /!access\.restricted/)
assert.match(
  imageApiSource,
  /\{ isMature: mature \}/,
  'Even forged API queries must be forced to a safe-only or mature-only rating',
)
assert.match(
  collectionPickerSource,
  /!userStore\.isChild/,
  'Memory collection index never asks for mature folders from child accounts',
)
assert.match(
  classicScreen,
  /Public mature only/,
  'Classic summary must not claim that mature mode mixes safe and mature artwork',
)

const consoleStage = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.match(
  consoleStage,
  /data-testid="memory-world-console-stage"/,
  'Overworld renders a dedicated, fully bounded console stage',
)
assert.match(
  consoleStage,
  /container: md-world \/ size/,
  'Map stage uses its actual available dimensions, not viewport height',
)
assert.match(
  consoleStage,
  /@container md-world \(min-width: 760px\)/,
  'Tablet landscape uses a two-column game layout independent of viewport breakpoint labels',
)
assert.match(
  consoleStage,
  /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/,
  'Map and encounter split available landscape width equally',
)
assert.match(
  consoleStage,
  /width: min\(100cqw, 100cqh\)/,
  'Map fills its square viewport up to the available panel height',
)
assert.match(
  consoleStage,
  /class="md-scene-overview"/,
  'Encounter panel includes a prominent image and narrative',
)
assert.match(
  consoleStage,
  /world\.activeMapCard\.image/,
  'The selected picture is rendered at enlarged resolution in the encounter panel',
)
assert.match(
  consoleStage,
  /md-scene-status/,
  'Current map status lives alongside the enlarged picture',
)
assert.match(
  consoleStage,
  /backgroundSize: '800% 800%'/,
  'Exploration displays a closeup of the current map square',
)
assert.doesNotMatch(
  consoleStage,
  /kr-scroll min-h-0 w-full flex-1 overflow-y-auto/,
  'Gameplay location panel does not become a vertically scrolling webpage',
)
assert.match(
  consoleStage,
  /\.md-map-layout \{[\s\S]*?overflow: hidden/,
  'Entire game stage remains within the shell instead of scrolling',
)
assert.match(
  worldStoreSource,
  /const activeMapCard = computed\(/,
  'Current flipped card is published for full-scale memory preview',
)

const layoutVerifier = readFileSync(
  'utils/scripts/verifyLayoutContract.ts',
  'utf8',
)
assert.match(
  consoleStage,
  /data-layout="console-fixed"/,
  'Map explicitly opts into a bounded console instead of requiring scroll',
)
assert.match(
  layoutVerifier,
  /const fixedConsoleStage =/,
  'Global layout contract has an explicit bounded-console exception',
)
assert.match(
  layoutVerifier,
  /!fixedConsoleStage/,
  'Exception is restricted to named fixed consoles, not all pages',
)

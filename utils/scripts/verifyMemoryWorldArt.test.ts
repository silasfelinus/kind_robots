import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  WORLD_ONE_ART_SHOTS,
  validateWorldOneArtManifest,
  briarIllustrationPath,
} from '../memoryDungeon/artManifest'
import {
  WORLD_ONE_GALLERY,
  validateRealmGallery,
} from '../memoryDungeon/realmGallery'
import {
  MEMORY_CARD_BACKS,
  normalizeMemoryCardBack,
  memoryCardBackPath,
} from '../memoryDungeonCardArt'
import { BRIAR_TILES } from '../memoryDungeonWorld'
import { BRIAR_STORY_ATLAS } from '../memoryDungeonStoryAtlas'
import { HOUSE_ROOMS } from '../memoryDungeon/house'
import { BRIAR_REVEAL_WAVES } from '../memoryDungeonWaves'
import {
  DEFAULT_DUNGEON_DECK,
  normalizeDungeonDeck,
} from '../memoryDungeonDeck'

const deliveredShotPaths = new Set(
  WORLD_ONE_ART_SHOTS.map((shot) => shot.targetPath),
)
let illustratedBriarOutcomes = 0
for (const tile of BRIAR_TILES) {
  const scene = BRIAR_STORY_ATLAS[tile.key]!
  const establishing = briarIllustrationPath(tile.key)
  assert.ok(
    establishing && deliveredShotPaths.has(establishing),
    `Missing Briar scene art: ${tile.key}`,
  )
  for (const choice of scene.choices) {
    const outcome = briarIllustrationPath(tile.key, choice.id)
    assert.ok(
      outcome && deliveredShotPaths.has(outcome),
      `Missing Briar consequence art: ${tile.key}/${choice.id}`,
    )
    assert.notEqual(
      outcome,
      establishing,
      'A choice must change the illustration',
    )
    illustratedBriarOutcomes++
  }
  assert.equal(
    briarIllustrationPath(tile.key, 'unearned-forged-choice'),
    establishing,
    'A forged choice must never select consequence artwork',
  )
}
assert.equal(illustratedBriarOutcomes, 128)
assert.equal(briarIllustrationPath('not-a-site'), null)

assert.deepEqual(validateWorldOneArtManifest(), [])
assert.deepEqual(validateRealmGallery(WORLD_ONE_GALLERY, 1), [])
assert.equal(WORLD_ONE_GALLERY.length, 32)
assert.equal(
  WORLD_ONE_GALLERY.filter((card) => card.role === 'collaboration').length,
  2,
)
assert.equal(
  WORLD_ONE_GALLERY.filter((card) => card.role !== 'collaboration').length,
  30,
)
assert.equal(
  BRIAR_REVEAL_WAVES.reduce((total, wave) => total + wave.length / 2, 0),
  30,
  'The 30 local images fit all four map reveal rounds without repeats',
)
assert.equal(
  new Set(WORLD_ONE_GALLERY.map((card) => card.sceneKey).filter(Boolean)).size,
  30,
  'Each local card represents a distinct authored Briar location',
)
assert.deepEqual(
  WORLD_ONE_GALLERY.filter((card) => card.role === 'collaboration').map(
    (card) => card.partnerWorld,
  ),
  [2, 4],
  'The two cross-world images make specific future-realm promises',
)
assert.ok(WORLD_ONE_GALLERY.every((card) => card.prompt.length > 100))
assert.equal(
  WORLD_ONE_ART_SHOTS.filter((shot) => shot.kind === 'overworld').length,
  BRIAR_TILES.length,
)
assert.equal(
  WORLD_ONE_ART_SHOTS.filter((shot) => shot.kind === 'dungeon').length,
  Object.keys(HOUSE_ROOMS).length,
)
assert.equal(
  WORLD_ONE_ART_SHOTS.filter((shot) => shot.kind === 'match-gallery').length,
  32,
)
assert.ok(
  WORLD_ONE_ART_SHOTS.every(
    (shot) =>
      shot.delivery === 'not-submitted' &&
      shot.jobId === null &&
      shot.deliveredUrl === null,
  ),
  'Briefs must never masquerade as queued or rendered ArtJobs',
)
assert.deepEqual(
  MEMORY_CARD_BACKS.map((card) => card.id),
  ['briar', 'arcane'],
)
assert.equal(normalizeMemoryCardBack('mangled'), 'briar')
assert.equal(normalizeMemoryCardBack('arcane'), 'arcane')
assert.equal(memoryCardBackPath('arcane'), MEMORY_CARD_BACKS[1]!.path)
assert.equal(
  normalizeDungeonDeck({ family: 'realm', realmId: 1 }).family,
  'realm',
)
assert.equal(normalizeDungeonDeck({ family: 'realm', realmId: 200 }).realmId, 1)
assert.equal(normalizeDungeonDeck(DEFAULT_DUNGEON_DECK).family, 'designed')

const worldStore = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const resolver = readFileSync(
  'stores/helpers/memoryDungeonDeckSource.ts',
  'utf8',
)
const selector = readFileSync(
  'components/memory-dungeon/deck-selector.vue',
  'utf8',
)
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.match(worldStore, /REALM_UNLOCKS_KEY/)
assert.match(
  worldStore,
  /state\.value\.gateOpened = true[\s\S]*unlockedRealms\.value\.push\(1\)/,
)
assert.match(worldStore, /window\.localStorage\.setItem\(\s*REALM_UNLOCKS_KEY/)
assert.match(worldStore, /realmArtReady\.value = results\.every\(Boolean\)/)
assert.match(resolver, /choice\.family === 'realm'/)
assert.match(resolver, /loadDungeonImagePaths\(candidates, needed\)/)
assert.match(selector, /choice\.key === 'realm' && !realmDeckReady/)
assert.match(overworld, /world\.selectCardBack\(back\.id\)/)
assert.match(overworld, /memoryCardBackPath\(world\.cardBack\)/)
assert.match(overworld, /:src="currentIllustrationPath"/)
assert.match(overworld, /world\.state\.sceneChoices\[world\.state\.player\]/)
assert.match(overworld, /watch\(currentIllustrationPath/)
assert.match(overworld, /@error="sceneArtFailed = true"/)
assert.match(overworld, /:style="currentSceneStyle"/)

console.log(
  'Memory Dungeon: 64 scene + 128 consequence image selectors, 36-room art briefs, 32-card realm gallery, delivery gates and card-back persistence verified',
)

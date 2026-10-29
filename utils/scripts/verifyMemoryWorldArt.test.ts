import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { buildMemoryDungeonPlaybook } from '../playbook/memoryDungeon'
import { readFileSync } from 'node:fs'
import {
  WORLD_ONE_ART_SHOTS,
  validateWorldOneArtManifest,
  briarIllustrationPath,
  houseIllustrationPath,
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
import {
  HOUSE_ROOMS,
  newHouseProgress,
  restoreHouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'
import { BRIAR_REVEAL_WAVES } from '../memoryDungeonWaves'
import {
  DEFAULT_DUNGEON_DECK,
  normalizeDungeonDeck,
} from '../memoryDungeonDeck'

const authoredShotPaths = new Set(
  WORLD_ONE_ART_SHOTS.map((shot) => shot.targetPath),
)
let illustratedBriarOutcomes = 0
for (const tile of BRIAR_TILES) {
  const scene = BRIAR_STORY_ATLAS[tile.key]!
  const establishing = briarIllustrationPath(tile.key)
  assert.ok(
    establishing && authoredShotPaths.has(establishing),
    `Missing Briar scene art: ${tile.key}`,
  )
  for (const choice of scene.choices) {
    const outcome = briarIllustrationPath(tile.key, choice.id)
    assert.ok(
      outcome && authoredShotPaths.has(outcome),
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

let illustratedHouseOutcomes = 0
for (const room of Object.values(HOUSE_ROOMS)) {
  const establishing = houseIllustrationPath(room.id)
  assert.equal(establishing, room.imagePath)
  assert.ok(
    establishing && authoredShotPaths.has(establishing),
    `Missing House establishing painting: ${room.id}`,
  )
  for (const choice of room.choices) {
    const outcome = houseIllustrationPath(room.id, choice.id)
    assert.ok(
      outcome && authoredShotPaths.has(outcome),
      `Missing House consequence painting: ${room.id}/${choice.id}`,
    )
    assert.notEqual(outcome, establishing)
    illustratedHouseOutcomes++
  }
  assert.equal(
    houseIllustrationPath(room.id, 'unearned-forged-choice'),
    establishing,
    'Forged choices cannot select House consequence art',
  )
}
assert.equal(illustratedHouseOutcomes, 76)
assert.equal(houseIllustrationPath('HD-99'), null)
// A reloaded Hearth painting requires the actual authored route to HD-35.
const houseArtRoutes = new Map<HouseRoomId, HouseRoomId[]>([
  ['HD-01', ['HD-01']],
])
const houseArtQueue: HouseRoomId[] = ['HD-01']
for (let i = 0; i < houseArtQueue.length; i++) {
  const room = houseArtQueue[i]!
  for (const next of HOUSE_ROOMS[room]!.exits) {
    if (houseArtRoutes.has(next)) continue
    houseArtRoutes.set(next, [...houseArtRoutes.get(room)!, next])
    houseArtQueue.push(next)
  }
}
const hearthRoute = houseArtRoutes.get('HD-35')!
assert.ok(hearthRoute.length > 1)

for (const ending of ['release', 'renew', 'break'] as const) {
  const saved = newHouseProgress()
  saved.current = 'HD-35'
  saved.visited = [...hearthRoute]
  saved.wardenPassed = true
  saved.decisions['HD-35'] = ending
  saved.ending = ending
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(saved)))
  assert.ok(restored)
  assert.equal(
    houseIllustrationPath(
      restored.current,
      restored.decisions[restored.current],
    ),
    houseIllustrationPath('HD-35', ending),
    'Reloaded House decisions must select the same consequence painting',
  )
}

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
const houseStage = readFileSync(
  'components/memory-dungeon/house-stage.vue',
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
assert.match(houseStage, /:src="displayArtPath"/)
assert.match(houseStage, /@error="handleArtError"/)
assert.match(houseStage, /houseIllustrationPath\(room\.value\?\.id/)
assert.match(houseStage, /selectedChoice\.value\?\.id/)
assert.match(houseStage, /fallbackArtFailed/)

// A literal brief names what is visible and closes on its realm's medium.
const MEDIUM_LINE =
  /(?:Hand-painted gouache and ink illustration[^.]*|Candid 35mm colour photograph, natural light, soft film grain)\.$/
const NON_LITERAL =
  /\b(?:no|not|without|never|nothing|none|lettering|text|watermark|montage|legible|readable|iconic|composition|collectible|thumbnail|game|story)\b|(?<!shaped )\blike\b/i
for (const brief of WORLD_ONE_ART_SHOTS) {
  const problems = checkArtPromptContract({
    prompt: brief.prompt,
    engine: 'krea2',
  }).map((violation) => violation.rule)
  const word = brief.prompt.match(NON_LITERAL)?.[0]
  if (word) problems.push(`non-literal "${word}"`)
  if (!MEDIUM_LINE.test(brief.prompt)) problems.push('missing its medium line')
  if (brief.prompt.length < 120 || brief.prompt.length > 900)
    problems.push(`length ${brief.prompt.length}`)
  assert.deepEqual(problems, [], `${brief.id} is not a literal Krea 2 prompt`)
}

// Every Forge beat's prompt meets the same bar as the manifest briefs.
for (const node of Object.values(buildMemoryDungeonPlaybook().nodes)) {
  if (!node.artPrompt) continue
  assert.match(
    node.artPrompt,
    MEDIUM_LINE,
    `${node.key} is a tag list, not a literal prompt`,
  )
  assert.doesNotMatch(node.artPrompt, NON_LITERAL, node.key)
}

console.log(
  'Memory Dungeon: 64 scene + 128 consequence image selectors, 36 House rooms + 76 consequence selectors, 32-card realm gallery, literal Krea 2 briefs, delivery gates and card-back persistence verified',
)

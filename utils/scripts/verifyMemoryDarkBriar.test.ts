import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DARK_BRIAR_ART_REQUESTS,
  DARK_BRIAR_COLLECTIBLE_ART,
  validateDarkBriarArtRequests,
} from '../memoryDungeon/darkBriarArt'
import { newBriarSave, restoreBriarSave, BRIAR_START, BRIAR_GATE } from '../memoryDungeonWorld'
import { createBriarWaveCards } from '../memoryDungeonWaves'
import {
  DARK_BRIAR_KEYS,
  DARK_BRIAR_SCENES,
  DARK_BRIAR_WITNESSES,
  DARK_BRIAR_CLIMAX,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
  darkBriarCanChoose,
  darkBriarCanTravel,
  darkBriarChoose,
  darkBriarOpening,
  validateDarkBriarSlice,
} from '../memoryDungeon/darkBriar'
import {
  restoreMemoryRealitySave,
  restoreMemoryCampaignProgress,
} from '../memoryDungeon/campaignPersistence'
import {
  newMemoryCampaignProgress,
  completeMemoryExperience,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateDarkBriarSlice(), [])
assert.deepEqual(validateDarkBriarArtRequests(), [])
assert.equal(DARK_BRIAR_ART_REQUESTS.length, 51)
assert.equal(DARK_BRIAR_COLLECTIBLE_ART.length, 32)
assert.ok(DARK_BRIAR_ART_REQUESTS.every((request) => request.jobId === null && request.delivery === 'not-submitted'))
assert.equal(DARK_BRIAR_KEYS.length, 16)
assert.equal(new Set(DARK_BRIAR_KEYS).size, 16)
assert.ok(DARK_BRIAR_KEYS.includes(BRIAR_START))
assert.ok(DARK_BRIAR_KEYS.includes(DARK_BRIAR_CLIMAX))

const images = Array.from({ length: 8 }, (_, i) => `/sample/memory-image-${i}.webp`)
const cards = createBriarWaveCards(DARK_BRIAR_KEYS, images, () => 0.5)
assert.equal(cards.length, 16)
assert.equal(new Set(cards.map((card) => card.tile)).size, 16)
assert.equal(new Set(cards.map((card) => card.image)).size, 8)

const first = newDarkBriarProgress()
assert.equal(first.phase, 'matching')
assert.equal(first.player, BRIAR_START)
assert.deepEqual(first.sceneChoices, {})
assert.deepEqual(restoreDarkBriarProgress(null), first)
const untrusted = restoreDarkBriarProgress({ sceneChoices: { '6,2': 'fake' }, completed: true, mapCards: [] })
assert.equal(untrusted.completed, false, 'A forged/obsolete climax cannot unlock the campaign')
assert.deepEqual(untrusted.sceneChoices, {})

const interrupted = restoreDarkBriarProgress({
  ...first,
  mapCards: cards.map((card, index) => ({ ...card, flipped: index === 0, matched: false })),
  revealed: ['6,2'],
  visited: ['6,2'],
})
assert.equal(interrupted.phase, 'matching')
assert.ok(interrupted.mapCards.every((card) => !card.flipped), 'Restored unmatched cards turn face down')
assert.deepEqual(interrupted.revealed, [], 'Saved map cannot forge reveals without matching card evidence')
assert.deepEqual(interrupted.visited, [])

const finishedCards = cards.map((card) => ({ ...card, matched: true, flipped: true }))
let dark = restoreDarkBriarProgress({
  ...first,
  mapCards: finishedCards,
  revealed: DARK_BRIAR_KEYS,
  visited: DARK_BRIAR_KEYS,
  player: BRIAR_START,
})
assert.equal(dark.phase, 'exploring')
assert.equal(dark.revealed.length, 16)
assert.equal(darkBriarCanTravel(BRIAR_START, DARK_BRIAR_CLIMAX, dark.revealed), true)
assert.equal(darkBriarCanTravel(BRIAR_START, '8,8', dark.revealed), false)
assert.equal(darkBriarCanTravel(BRIAR_START, DARK_BRIAR_CLIMAX, [BRIAR_START, DARK_BRIAR_CLIMAX]), false)
assert.equal(DARK_BRIAR_SCENES[DARK_BRIAR_CLIMAX]?.choices.length, 2)
assert.equal(darkBriarCanChoose({ ...dark, player: DARK_BRIAR_CLIMAX }, DARK_BRIAR_CLIMAX), false)

const original = restoreBriarSave({
  ...newBriarSave(),
  prologueChoice: 'terms',
  gateOpened: true,
  sceneChoices: { '4,4': 'escort', '2,5': 'archive' },
  relics: ['bramble-chime'],
})
assert.ok(darkBriarOpening(DARK_BRIAR_SCENES['4,4']!, original).includes('proclamation'))
assert.ok(darkBriarOpening(DARK_BRIAR_SCENES['2,5']!, original).includes('negative'))
for (const key of DARK_BRIAR_WITNESSES) {
  dark = { ...dark, player: key }
  assert.equal(darkBriarCanChoose(dark, key), true, `Witness ${key} must be playable`)
  dark = darkBriarChoose(dark, key, DARK_BRIAR_SCENES[key]!.choices[0].id)
}
assert.equal(darkBriarCanChoose({ ...dark, player: DARK_BRIAR_CLIMAX }, DARK_BRIAR_CLIMAX), true)
dark = { ...dark, player: DARK_BRIAR_CLIMAX }
dark = darkBriarChoose(dark, DARK_BRIAR_CLIMAX, 'witness')
assert.equal(dark.completed, true)
const firstEnding = JSON.stringify(dark)
assert.equal(darkBriarChoose(dark, DARK_BRIAR_CLIMAX, 'refuse'), dark, 'Climax rewards are not farmable')
assert.equal(JSON.stringify(dark), firstEnding)
const restored = restoreDarkBriarProgress(JSON.parse(JSON.stringify(dark)))
assert.equal(restored.completed, true)
assert.equal(restored.sceneChoices[DARK_BRIAR_CLIMAX], 'witness')
assert.equal(original.gateOpened, true, 'Dark world never mutates the existing Briar save')
assert.equal(original.sceneChoices['4,4'], 'escort')

const campaign = completeMemoryExperience(newMemoryCampaignProgress(), 'e01')
const reality = restoreMemoryRealitySave({ version: 1, active: 'e02', progress: campaign })
assert.equal(reality.active, 'e02', 'Mirrored mode is resumable after a reload')
assert.equal(restoreMemoryRealitySave({ active: 'e02', progress: {} }).active, 'e01', 'Do not unlock the reflection without Briar completion')
assert.deepEqual(restoreMemoryCampaignProgress({ completed: ['e01', 'e01', 'bogus'] }).completed, ['e01'])
const completed = completeMemoryExperience(campaign, 'e02')
assert.deepEqual(restoreMemoryCampaignProgress(completed).completed, ['e01', 'e02'])
assert.equal(BRIAR_GATE, '8,4')
assert.equal(BRIAR_START, '2,4')

const stage = readFileSync('components/memory-dungeon/dark-briar-stage.vue', 'utf-8')
const overworld = readFileSync('components/pages/memory-dungeon-overworld.vue', 'utf-8')
const store = readFileSync('stores/memoryWorldStore.ts', 'utf-8')
assert.ok(stage.includes('data-testid="dark-briar-stage"'))
assert.ok(stage.includes('data-testid="dark-briar-choices"'))
assert.ok(stage.includes('world.darkPickCard(card.tile)'))
assert.ok(stage.includes('world.darkChooseScene(choice.id)'))
assert.ok(overworld.includes('<memory-dungeon-dark-briar-stage'))
assert.ok(overworld.includes('world.enterDarkBriar()'))
assert.ok(store.includes('const REALITY_KEY ='))
assert.ok(store.includes('const DARK_BRIAR_KEY ='))
assert.ok(store.includes('grantBriarCompletion()'))
assert.ok(store.includes('persistReality()'))

console.log('Dark Briar sixteen-scene playable vertical slice, independent saves, reveals, witness gate and UI wiring pass')

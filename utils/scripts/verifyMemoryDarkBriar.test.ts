import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DARK_BRIAR_ART_REQUESTS,
  DARK_BRIAR_COLLECTIBLE_ART,
  validateDarkBriarArtRequests,
} from '../memoryDungeon/darkBriarArt'
import {
  newBriarSave,
  restoreBriarSave,
  BRIAR_START,
  BRIAR_GATE,
} from '../memoryDungeonWorld'
import { createBriarWaveCards } from '../memoryDungeonWaves'
import {
  DARK_BRIAR_KEYS,
  DARK_BRIAR_WAVES,
  DARK_BRIAR_SCENES,
  DARK_BRIAR_SEALS,
  DARK_BRIAR_ENCOUNTER_KEYS,
  DARK_BRIAR_WITNESSES,
  darkBriarInspectSeal,
  darkBriarHasWitness,
  darkBriarWitnessCount,
  DARK_BRIAR_CLIMAX,
  advanceDarkBriarWave,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
  darkBriarCanChoose,
  darkBriarCanTravel,
  darkBriarChoose,
  darkBriarOpening,
  validateDarkBriarSlice,
  type DarkBriarProgress,
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
assert.equal(DARK_BRIAR_ART_REQUESTS.length, 187)
assert.equal(DARK_BRIAR_COLLECTIBLE_ART.length, 32)
assert.ok(
  DARK_BRIAR_ART_REQUESTS.every(
    (request) => request.jobId === null && request.delivery === 'not-submitted',
  ),
)
assert.equal(DARK_BRIAR_KEYS.length, 64)
assert.equal(DARK_BRIAR_ENCOUNTER_KEYS.length, 60)
assert.equal(Object.keys(DARK_BRIAR_SEALS).length, 4)
for (const key of Object.keys(DARK_BRIAR_SEALS))
  assert.equal(DARK_BRIAR_SCENES[key], undefined)
assert.equal(new Set(DARK_BRIAR_KEYS).size, 64)
assert.ok(DARK_BRIAR_KEYS.includes(BRIAR_START))
assert.ok(DARK_BRIAR_KEYS.includes(DARK_BRIAR_CLIMAX))
assert.equal(DARK_BRIAR_WAVES.length, 4)
assert.deepEqual(
  DARK_BRIAR_KEYS.slice(0, 16),
  DARK_BRIAR_WAVES[0],
  'Preserve pilot location IDs and order',
)
assert.deepEqual(new Set(DARK_BRIAR_WAVES.flat()), new Set(DARK_BRIAR_KEYS))
for (const scene of Object.values(DARK_BRIAR_SCENES)) {
  assert.ok(
    scene.opening.length >= 80,
    'Every site has substantial authored opening',
  )
  assert.ok(scene.artPrompt.length >= 60, 'Every site has unique art direction')
  assert.equal(scene.choices.length, 2)
  assert.notEqual(scene.choices[0].outcome, scene.choices[1].outcome)
}

const imagesFor = (wave: number) =>
  Array.from(
    { length: 8 },
    (_, i) => '/sample/memory-wave-' + wave + '-image-' + i + '.webp',
  )
const cardsFor = (wave: number) =>
  createBriarWaveCards(DARK_BRIAR_WAVES[wave]!, imagesFor(wave), () => 0.5)
for (let wave = 0; wave < 4; wave++) {
  const cards = cardsFor(wave)
  assert.equal(cards.length, 16)
  assert.equal(new Set(cards.map((card) => card.tile)).size, 16)
  assert.equal(new Set(cards.map((card) => card.image)).size, 8)
}

const first = newDarkBriarProgress()
assert.equal(first.phase, 'matching')
assert.equal(first.version, 3)
assert.equal(first.waveIndex, 0)
assert.equal(first.player, BRIAR_START)
assert.deepEqual(first.sceneChoices, {})
assert.deepEqual(first.sealInspections, [])
assert.deepEqual(restoreDarkBriarProgress(null), first)
const untrusted = restoreDarkBriarProgress({
  sceneChoices: { '6,2': 'fake' },
  completed: true,
  mapCards: [],
})
assert.equal(
  untrusted.completed,
  false,
  'A forged climax cannot unlock the campaign',
)
assert.deepEqual(untrusted.sceneChoices, {})

const interrupted = restoreDarkBriarProgress({
  ...first,
  mapCards: cardsFor(0).map((card, index) => ({
    ...card,
    flipped: index === 0,
    matched: false,
  })),
  revealed: ['6,2'],
  visited: ['6,2'],
})
assert.equal(interrupted.phase, 'matching')
assert.ok(interrupted.mapCards.every((card) => !card.flipped))
assert.deepEqual(
  interrupted.revealed,
  [],
  'A saved tile needs a real paired match',
)
assert.deepEqual(interrupted.visited, [])

function completeRound(state: DarkBriarProgress): DarkBriarProgress {
  const keys = DARK_BRIAR_WAVES[state.waveIndex]!
  const cards = cardsFor(state.waveIndex).map((card) => ({
    ...card,
    matched: true,
    flipped: true,
  }))
  return restoreDarkBriarProgress({
    ...state,
    phase: 'exploring',
    mapCards: cards,
    revealed: [...state.revealed, ...keys],
    visited: [...state.visited, ...keys],
    player: BRIAR_START,
    seenImages: [...state.seenImages, ...imagesFor(state.waveIndex)],
  })
}

let dark = completeRound(first)
assert.equal(dark.phase, 'exploring')
assert.equal(dark.revealed.length, 16)
const unexamined = { ...dark, player: '5,2' }
const inspected = darkBriarInspectSeal(unexamined, '5,2')
assert.deepEqual(inspected.sealInspections, ['5,2'])
assert.equal(darkBriarInspectSeal(inspected, '5,2'), inspected)
assert.equal(darkBriarCanChoose(inspected, '5,2'), false)
assert.equal(
  darkBriarInspectSeal({ ...unexamined, visited: [] }, '5,2'),
  unexamined,
)
assert.deepEqual(
  restoreDarkBriarProgress(JSON.parse(JSON.stringify(inspected)))
    .sealInspections,
  ['5,2'],
)
assert.equal(
  darkBriarCanTravel(BRIAR_START, DARK_BRIAR_CLIMAX, dark.revealed),
  true,
)
assert.equal(darkBriarCanTravel(BRIAR_START, '8,8', dark.revealed), false)
assert.equal(
  darkBriarCanTravel(BRIAR_START, DARK_BRIAR_CLIMAX, [
    BRIAR_START,
    DARK_BRIAR_CLIMAX,
  ]),
  false,
)
assert.equal(advanceDarkBriarWave(first), first, 'Cannot skip matching')
assert.equal(
  darkBriarCanChoose({ ...dark, player: DARK_BRIAR_CLIMAX }, DARK_BRIAR_CLIMAX),
  false,
  'The original pilot Warden must await testimony from the whole world',
)
const original = restoreBriarSave({
  ...newBriarSave(),
  prologueChoice: 'terms',
  gateOpened: true,
  sceneChoices: { '4,4': 'escort', '2,5': 'archive' },
  relics: ['bramble-chime'],
})
assert.ok(
  darkBriarOpening(DARK_BRIAR_SCENES['4,4']!, original).includes(
    'proclamation',
  ),
)
assert.ok(
  darkBriarOpening(DARK_BRIAR_SCENES['2,5']!, original).includes('negative'),
)
for (let wave = 1; wave < 4; wave++) {
  const previousChoices = JSON.stringify(dark.sceneChoices)
  const previousVisited = [...dark.visited]
  dark = advanceDarkBriarWave(dark)
  assert.equal(dark.waveIndex, wave)
  assert.equal(dark.phase, 'matching')
  assert.equal(dark.mapCards.length, 0)
  assert.equal(
    advanceDarkBriarWave(dark),
    dark,
    'A wave cannot be skipped twice',
  )
  dark = completeRound(dark)
  assert.equal(dark.revealed.length, 16 * (wave + 1))
  assert.equal(JSON.stringify(dark.sceneChoices), previousChoices)
  assert.ok(previousVisited.every((key) => dark.visited.includes(key)))
  assert.equal(dark.waveIndex, wave)
  assert.equal(dark.phase, 'exploring')
  const restored = restoreDarkBriarProgress(JSON.parse(JSON.stringify(dark)))
  assert.deepEqual(
    restored.revealed,
    dark.revealed,
    'Save and restore every revealed region',
  )
  assert.deepEqual(
    restored.seenImages,
    dark.seenImages,
    'Retain 32 unique image identities',
  )
}
assert.equal(dark.revealed.length, 64)
assert.equal(advanceDarkBriarWave(dark), dark, 'No fifth dark reveal round')
assert.equal(darkBriarCanTravel(BRIAR_START, '8,8', dark.revealed), true)
for (const key of DARK_BRIAR_WITNESSES) {
  dark = { ...dark, player: key }
  assert.equal(
    darkBriarCanChoose(dark, key),
    true,
    'Witness ' + key + ' must be playable',
  )
  dark = darkBriarChoose(dark, key, DARK_BRIAR_SCENES[key]!.choices[0].id)
}
assert.equal(DARK_BRIAR_WITNESSES.length, 8)
assert.equal(
  darkBriarCanChoose({ ...dark, player: DARK_BRIAR_CLIMAX }, DARK_BRIAR_CLIMAX),
  true,
)
dark = { ...dark, player: DARK_BRIAR_CLIMAX }
dark = darkBriarChoose(dark, DARK_BRIAR_CLIMAX, 'witness')
assert.equal(dark.completed, true)
assert.equal(darkBriarChoose(dark, DARK_BRIAR_CLIMAX, 'refuse'), dark)
const restored = restoreDarkBriarProgress(JSON.parse(JSON.stringify(dark)))
assert.equal(restored.completed, true)
assert.equal(restored.sceneChoices[DARK_BRIAR_CLIMAX], 'witness')
assert.equal(
  original.gateOpened,
  true,
  'Dark world cannot rewrite the original save',
)
assert.equal(original.sceneChoices['4,4'], 'escort')
const sigilWitness = restoreDarkBriarProgress({
  ...completeRound(first),
  version: 2,
  sceneChoices: { '5,2': 'testify' },
})
assert.equal(sigilWitness.sceneChoices['5,2'], 'testify')
assert.equal(darkBriarHasWitness(sigilWitness, '5,3'), true)
assert.equal(darkBriarWitnessCount(sigilWitness), 1)
assert.equal(darkBriarHasWitness(newDarkBriarProgress(), '5,3'), false)
assert.equal(DARK_BRIAR_SCENES['5,3']?.choices[0].id, 'publish')

// A player who finished the earlier 16-scene pilot must not lose the ending.
const legacyV1 = restoreDarkBriarProgress({
  ...completeRound(first),
  version: 1,
  sceneChoices: { '6,2': 'witness', '2,5': 'question' },
  completed: true,
})
assert.equal(legacyV1.version, 3)
assert.equal(legacyV1.legacyCompleted, true)
assert.equal(legacyV1.completed, true)
const legacyReload = restoreDarkBriarProgress(
  JSON.parse(JSON.stringify(legacyV1)),
)
assert.equal(
  legacyReload.completed,
  true,
  'Previously earned ending remains complete',
)
assert.equal(
  advanceDarkBriarWave(legacyReload).waveIndex,
  1,
  'Legacy players can explore new regions',
)

const forgedLastWave = restoreDarkBriarProgress({
  ...first,
  waveIndex: 3,
  revealed: [],
  mapCards: cardsFor(3),
})
assert.equal(
  forgedLastWave.waveIndex,
  0,
  'Cannot skip prior map reveals via invalid save',
)

const campaign = completeMemoryExperience(newMemoryCampaignProgress(), 'e01')
const reality = restoreMemoryRealitySave({
  version: 1,
  active: 'e02',
  progress: campaign,
})
assert.equal(reality.active, 'e02')
assert.equal(
  restoreMemoryRealitySave({ active: 'e02', progress: {} }).active,
  'e01',
)
assert.deepEqual(
  restoreMemoryCampaignProgress({ completed: ['e01', 'e01', 'bogus'] })
    .completed,
  ['e01'],
)
const completed = completeMemoryExperience(campaign, 'e02')
assert.deepEqual(restoreMemoryCampaignProgress(completed).completed, [
  'e01',
  'e02',
])
assert.equal(BRIAR_GATE, '8,4')
assert.equal(BRIAR_START, '2,4')

const stage = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf-8',
)
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf-8',
)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf-8')
assert.ok(stage.includes('data-testid="dark-briar-stage"'))
assert.ok(stage.includes('data-testid="dark-briar-choices"'))
assert.ok(stage.includes('data-testid="dark-briar-next-wave"'))
assert.ok(stage.includes('world.dark.revealed.includes(tile.key)'))
assert.ok(stage.includes('world.darkPickCard(card.tile)'))
assert.ok(stage.includes('world.darkChooseScene(choice.id)'))
assert.ok(overworld.includes('<memory-dungeon-dark-briar-stage'))
assert.ok(overworld.includes('world.enterDarkBriar()'))
assert.ok(store.includes('const REALITY_KEY ='))
assert.ok(store.includes('const DARK_BRIAR_KEY ='))
assert.ok(store.includes('grantBriarCompletion()'))
assert.ok(store.includes('persistReality()'))
assert.ok(store.includes('advanceDarkBriarWave(dark.value)'))
console.log(
  '60 Dark Briar encounters and 4 future seals, four 8-pair reveal waves, eight-witness House, migration and art briefs pass',
)

import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { readFileSync } from 'node:fs'
import {
  DARK_BRIAR_ART_REQUESTS,
  DARK_BRIAR_COLLECTIBLE_ART,
  validateDarkBriarArtRequests,
  darkBriarIllustrationPath,
} from '../memoryDungeon/darkBriarArt'
import {
  newBriarSave,
  restoreBriarSave,
  BRIAR_START,
  BRIAR_GATE,
} from '../memoryDungeonWorld'
import { createBriarWaveCards } from '../memoryDungeonWaves'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
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
  availableMemoryExperiences,
  commitToMemoryFinale,
  completeMemoryExperience,
  rememberMemoryWish,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateDarkBriarSlice(), [])
assert.deepEqual(validateDarkBriarArtRequests(), [])
assert.equal(DARK_BRIAR_ART_REQUESTS.length, 187)
assert.equal(DARK_BRIAR_COLLECTIBLE_ART.length, 32)
const authoredArtPaths = new Set(
  DARK_BRIAR_ART_REQUESTS.map((request) => request.targetPath),
)
for (const scene of Object.values(DARK_BRIAR_SCENES)) {
  const original = darkBriarIllustrationPath(scene.key)
  assert.ok(
    authoredArtPaths.has(original),
    `Missing scene art for ${scene.key}`,
  )
  for (const choice of scene.choices) {
    const consequence = darkBriarIllustrationPath(scene.key, choice.id)
    assert.ok(
      authoredArtPaths.has(consequence),
      `Missing earned consequence art for ${scene.key}/${choice.id}`,
    )
    assert.notEqual(consequence, original)
  }
  assert.equal(
    darkBriarIllustrationPath(scene.key, 'forged'),
    original,
    'Invalid or unearned choices must not select consequence artwork',
  )
}
for (const key of Object.keys(DARK_BRIAR_SEALS)) {
  assert.ok(
    authoredArtPaths.has(darkBriarIllustrationPath(key)),
    `Missing seal art for ${key}`,
  )
}
assert.ok(authoredArtPaths.has(darkBriarIllustrationPath('not-a-site')))
const artStage = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
assert.match(artStage, /:src="illustrationPath"/)
assert.match(artStage, /world\.dark\.sceneChoices\[world\.dark\.player\]/)
assert.match(artStage, /watch\(illustrationPath/)
assert.match(artStage, /@error="artFailed = true"/)

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
const unseenAtSigil = { ...unexamined, visited: [] }
assert.equal(darkBriarInspectSeal(unseenAtSigil, '5,2'), unseenAtSigil)
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

// Mirrored story echoes are earned by an actual authored choice, not by
// prologue flags, missing records, or unknown values in an old save.
for (const mirrored of Object.values(DARK_BRIAR_SCENES)) {
  const echo = mirrored.originalCallback
  if (!echo) continue
  const source = BRIAR_SCENES[echo.key]
  assert.ok(source, `Missing original Briar scene for ${mirrored.key}`)
  assert.deepEqual(
    new Set([echo.choice, echo.alternateChoice]),
    new Set(source.choices.map((choice) => choice.id)),
    `Mirrored callback at ${mirrored.key} must cover both real Briar decisions`,
  )
  for (const [choice, line] of [
    [echo.choice, echo.line],
    [echo.alternateChoice, echo.alternate],
  ] as const) {
    const earned = restoreBriarSave({
      ...newBriarSave(),
      sceneChoices: { [echo.key]: choice },
    })
    const expected = `${mirrored.opening} ${line}`
    assert.equal(darkBriarOpening(mirrored, earned), expected)
    assert.equal(
      darkBriarOpening(
        mirrored,
        restoreBriarSave(JSON.parse(JSON.stringify(earned))),
      ),
      expected,
      'The earned story branch must survive a save round trip',
    )
  }
  assert.equal(
    darkBriarOpening(mirrored, newBriarSave()),
    mirrored.opening,
    'Unvisited original scenes must not invent a remembered decision',
  )
  assert.equal(
    darkBriarOpening(mirrored, {
      ...newBriarSave(),
      sceneChoices: { [echo.key]: 'forged-choice' },
    }),
    mirrored.opening,
    'Unknown original decisions must not select the alternate branch',
  )
}
assert.equal(
  darkBriarOpening(DARK_BRIAR_SCENES['2,4']!, original),
  DARK_BRIAR_SCENES['2,4']!.opening,
  'The prologue terms flag is not the courier lantern decision',
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
// The finale is earned after any two middle pairs. Requiring e12 on restore
// silently erased a valid commitment through the Hearth + Market route.
let alternate = completed
alternate = rememberMemoryWish(alternate, 'morrow-magic-attempt')
alternate = completeMemoryExperience(alternate, 'e03')
alternate = completeMemoryExperience(alternate, 'e04')
alternate = rememberMemoryWish(alternate, 'scylla-home-wish')
alternate = completeMemoryExperience(alternate, 'e05')
alternate = rememberMemoryWish(alternate, 'char-possible-future')
alternate = completeMemoryExperience(alternate, 'e06')
for (const id of ['e07', 'e08', 'e09', 'e10'] as const) {
  alternate = completeMemoryExperience(alternate, id)
}
assert.ok(availableMemoryExperiences(alternate).includes('e13'))
alternate = commitToMemoryFinale(alternate)
assert.deepEqual(
  restoreMemoryCampaignProgress(JSON.parse(JSON.stringify(alternate))),
  alternate,
  'Save during the committed finale must not require the unchosen Crossing pair',
)
alternate = completeMemoryExperience(alternate, 'e13')
alternate = completeMemoryExperience(alternate, 'e14')
const alternateReload = restoreMemoryCampaignProgress(
  JSON.parse(JSON.stringify(alternate)),
)
assert.deepEqual(alternateReload, alternate)
assert.equal(alternateReload.completed.includes('e12'), false)
assert.deepEqual(availableMemoryExperiences(alternateReload), ['e15'])

const forgedFuture = restoreMemoryCampaignProgress({
  completed: ['e01', 'e02', 'e16', 'e03', 'e04', 'e13'],
  rememberedAnchors: ['char-possible-future', 'morrow-magic-attempt'],
  finaleCommitted: true,
})
assert.deepEqual(forgedFuture.completed, ['e01', 'e02', 'e03', 'e04'])
assert.deepEqual(forgedFuture.rememberedAnchors, ['morrow-magic-attempt'])
assert.equal(forgedFuture.finaleCommitted, false)
assert.deepEqual(availableMemoryExperiences(forgedFuture), ['e05'])
assert.deepEqual(
  restoreMemoryCampaignProgress({
    completed: ['e01', 'e02'],
    rememberedAnchors: ['morrow-magic-attempt'],
  }).rememberedAnchors,
  ['morrow-magic-attempt'],
  'An in-progress Morrow memory survives before e03 completion',
)

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
const NON_LITERAL =
  /\b(?:no|not|without|never|lettering|text|watermark|montage|legible|readable|iconic|composition|collectible|thumbnail|game|story)\b|(?<!shaped )\blike\b/i
for (const brief of [
  ...DARK_BRIAR_ART_REQUESTS,
  ...DARK_BRIAR_COLLECTIBLE_ART,
]) {
  const problems = checkArtPromptContract({
    prompt: brief.prompt,
    engine: 'krea2',
  }).map((violation) => violation.rule)
  const word = brief.prompt.match(NON_LITERAL)?.[0]
  if (word) problems.push(`non-literal "${word}"`)
  if (brief.prompt.length < 120 || brief.prompt.length > 900)
    problems.push(`length ${brief.prompt.length}`)
  assert.deepEqual(problems, [], `${brief.id} is not a literal Krea 2 prompt`)
}

console.log(
  '60 Dark Briar encounters and 4 future seals, four 8-pair reveal waves, eight-witness House, migration and literal Krea 2 art briefs pass',
)

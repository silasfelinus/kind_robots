import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BRIAR_START,
  BRIAR_LINKS,
  briarConnected,
  newBriarSave,
  restoreBriarSave,
} from '../memoryDungeonWorld'
import {
  BRIAR_REVEAL_WAVES,
  createBriarWaveCards,
  settleBriarWavePair,
} from '../memoryDungeonWaves'
import { BRIAR_SCENES, canChooseBriarScene } from '../memoryDungeon/scenes'
import { newHouseProgress } from '../memoryDungeon/house'
import {
  DARK_HOUSE_ROOMS,
  newDarkHouseProgress,
  darkHousePuzzleHint,
  darkHouseFlip,
  darkHouseAnswerPuzzle,
  darkHouseChoose,
  darkHouseMove,
  darkHouseExits,
  darkHouseRoomResolved,
  darkHouseEchoes,
  restoreDarkHouseProgress,
} from '../memoryDungeon/darkHouse'
import {
  DARK_HOUSE_TRIALS,
  DARK_HOUSE_PUZZLES,
  darkHouseTrialFaces,
} from '../memoryDungeon/darkHouseChallenges'
import {
  newDarkBriarProgress,
  restoreDarkBriarProgress,
  DARK_BRIAR_WAVES,
  DARK_BRIAR_SCENES,
  darkBriarCanTravel,
  darkBriarChoose,
} from '../memoryDungeon/darkBriar'
import {
  firstTwoWorldFrames,
  firstTwoSceneCallbacks,
  firstTwoPhysicalConsequence,
  darkBriarExtraBridge,
  earnedCourierCompensation,
  earnedBorrowedVoiceAccord,
  earnedBorrowedVoiceOutcome,
  earnedRoyalEscortAccord,
  earnedRoyalEscortOutcome,
  crossRealmConsequenceLedger,
  crossRealmHouseEpilogue,
  earnedDarkHousePuzzleClue,
} from '../memoryDungeon/firstTwoConsequences'

const base = newBriarSave()
const house = newHouseProgress()
const mirror = newDarkHouseProgress()
assert.deepEqual(firstTwoWorldFrames(base, mirror), {
  memoryCustody: 'unset',
  crossingAccord: 'unset',
  combination: 'unset:unset',
})
const combinations = new Set<string>()
for (const custody of ['release', 'renew', 'break'] as const) {
  for (const crossing of ['return', 'commons'] as const) {
    const frame = firstTwoWorldFrames(
      { ...base, house: { ...house, ending: custody } },
      { ...mirror, ending: crossing },
    )
    assert.equal(frame.memoryCustody, custody)
    assert.equal(frame.crossingAccord, crossing)
    combinations.add(frame.combination)
    const projection = firstTwoPhysicalConsequence('2,4', frame)
    assert.ok(projection && projection.length > 75)
    assert.equal(firstTwoPhysicalConsequence('8,8', frame), null)
  }
}
assert.equal(
  combinations.size,
  6,
  'Only two global switches yield six worldframes',
)

const choiceChannels = [
  ['2,4', 'lend', 'copy'],
  ['4,3', 'plan', 'load'],
  ['3,2', 'ask', 'offer'],
  ['5,4', 'truth', 'errand'],
  ['6,4', 'carry', 'read'],
  ['2,6', 'trace', 'listen'],
  ['3,5', 'light', 'listen'],
  ['6,3', 'remember', 'protect'],
  ['2,5', 'archive', 'grieve'],
] as const
for (const [site, left, right] of choiceChannels) {
  const a = firstTwoSceneCallbacks(
    site,
    { [site]: left },
    newDarkBriarProgress(),
  )
  const b = firstTwoSceneCallbacks(
    site,
    { [site]: right },
    newDarkBriarProgress(),
  )
  assert.equal(a.length, 1)
  assert.equal(b.length, 1)
  assert.notEqual(
    a[0],
    b[0],
    site + ' should remember the actual earlier approach',
  )
  assert.deepEqual(firstTwoSceneCallbacks(site, {}, newDarkBriarProgress()), [])
}
assert.deepEqual(
  firstTwoSceneCallbacks('1,1', { '3,2': 'ask' }, newDarkBriarProgress()),
  [],
)
assert.deepEqual(
  firstTwoSceneCallbacks('3,2', { '3,2': 'ask' }, newDarkBriarProgress(), 0),
  [],
)
assert.equal(
  firstTwoSceneCallbacks('3,2', { '3,2': 'ask' }, newDarkBriarProgress(), 50)
    .length,
  1,
  'High requested callback budget cannot multiply the script',
)
const allUnrelated = Object.fromEntries(
  choiceChannels.map(([key, left]) => [key, left]),
)
assert.equal(
  firstTwoSceneCallbacks('4,3', allUnrelated, newDarkBriarProgress()).length,
  1,
  'A huge choice ledger never dumps all historical callbacks into one encounter',
)

const before = newDarkBriarProgress()
assert.equal(darkBriarExtraBridge('5,4', '7,4', before), false)
assert.equal(
  darkBriarCanTravel('5,4', '7,4', ['5,4', '7,4'], before),
  false,
  'Bridge shortcut is absent before labor is actually undertaken',
)
const built = { ...before, sceneChoices: { '5,4': 'draw' } }
assert.equal(darkBriarExtraBridge('5,4', '7,4', built), true)
assert.equal(darkBriarExtraBridge('7,4', '5,4', built), true)
assert.equal(darkBriarExtraBridge('2,4', '8,4', built), false)
assert.equal(darkBriarCanTravel('5,4', '7,4', ['5,4', '7,4'], built), true)
assert.equal(darkBriarCanTravel('7,4', '5,4', ['5,4', '7,4'], built), true)
assert.equal(
  darkBriarCanTravel('5,4', '7,4', ['5,4'], built),
  false,
  'Cannot travel to unrevealed land even with a repaired bridge',
)
const released = { ...before, sceneChoices: { '5,4': 'release' } }
assert.equal(darkBriarExtraBridge('5,4', '7,4', released), false)

// The courier's shelter is a second, freely chosen act. Its resource reward
// depends on the original decision and is never paid for an invented history.
const courierAtCrossing = {
  ...newDarkBriarProgress(),
  phase: 'exploring' as const,
  player: '3,4',
  revealed: ['3,4'],
  visited: ['3,4'],
}
for (const [originalChoice, expectedReward] of [
  ['lend', 'wildflower'],
  ['copy', 'lantern'],
] as const) {
  const original = JSON.parse(
    JSON.stringify({
      ...newBriarSave(),
      sceneChoices: { '2,4': originalChoice },
    }),
  ) as ReturnType<typeof newBriarSave>
  const chosen = darkBriarChoose(courierAtCrossing, '3,4', 'shelter')
  assert.notEqual(chosen, courierAtCrossing)
  assert.equal(chosen.sceneChoices['3,4'], 'shelter')
  assert.equal(
    earnedCourierCompensation(original, chosen.sceneChoices['3,4']!),
    expectedReward,
  )
  assert.equal(
    darkBriarChoose(chosen, '3,4', 'shelter'),
    chosen,
    'An already-committed shelter choice cannot pay twice',
  )
  assert.equal(
    earnedCourierCompensation(original, 'trace'),
    null,
    'Tracing the letters is a valid alternative, not a hidden reward',
  )
  for (const site of ['2,4', '3,4']) {
    const callbacks = firstTwoSceneCallbacks(
      site,
      original.sceneChoices,
      chosen,
    )
    assert.ok(
      callbacks.some((line) =>
        line.includes(expectedReward === 'lantern' ? 'lantern' : 'wildflower'),
      ),
    )
    assert.ok(callbacks.length <= 2)
  }
}
assert.equal(
  earnedCourierCompensation(
    { ...newBriarSave(), sceneChoices: { '2,4': 'forged' } },
    'shelter',
  ),
  null,
)
assert.equal(
  earnedCourierCompensation(newBriarSave(), 'shelter'),
  null,
  'A missing original decision cannot mint supplies',
)
assert.deepEqual(
  firstTwoSceneCallbacks(
    '3,4',
    {},
    { ...courierAtCrossing, sceneChoices: { '3,4': 'shelter' } },
  ),
  [],
)
assert.ok(
  firstTwoSceneCallbacks('5,4', { '5,4': 'truth' }, built).some((line) =>
    line.includes('shorter physical route'),
  ),
)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const stage = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
assert.ok(store.includes('firstTwoWorldFrames(state.value, darkHouse.value)'))
assert.match(store, /firstTwoSceneCallbacks\(\s*dark\.value\.player/)
assert.match(
  store,
  /darkBriarCanTravel\([\s\S]*?dark\.value\.revealed,[\s\S]*?dark\.value/,
)
assert.ok(stage.includes('data-testid="dark-briar-earned-callbacks"'))
assert.ok(stage.includes('data-testid="dark-briar-custody-world-change"'))

assert.match(
  store,
  /const compensation = earnedCourierCompensation\(state\.value, id\)/,
)
assert.match(
  store,
  /if \(next === dark\.value\) return[\s\S]*?earnedCourierCompensation/,
  'The reward must be gated behind a newly committed choice',
)
assert.match(
  store,
  /state\.value\.lanterns \+= 1[\s\S]*?persist\(\)[\s\S]*?state\.value\.wildflowers \+= 1[\s\S]*?persist\(\)/,
  'Both mutually exclusive rewards must survive reload',
)

// Pip's original encounter concerned a borrowed voice, not a traveler
// supposedly sent into the marsh. Four earned responses reconcile both accounts.
assert.ok(BRIAR_REVEAL_WAVES[0]?.includes('3,5'))
assert.ok(briarConnected(BRIAR_START, '3,5', BRIAR_REVEAL_WAVES[0]!))
assert.ok(DARK_BRIAR_WAVES[0]?.includes('3,5'))
assert.ok(!DARK_BRIAR_SCENES['3,5']?.opening.includes('you directed'))
const borrowedVoiceScenes = new Set<string>()
const borrowedVoiceEpilogues = new Set<string>()
const darkTravelerBase = {
  ...newDarkBriarProgress(),
  phase: 'exploring' as const,
  mapCards: DARK_BRIAR_WAVES[0]!.map((tile, id) => ({
    id,
    tile,
    pairId: Math.floor(id / 2),
    image: `/test/memory-pair-${Math.floor(id / 2)}.webp`,
    flipped: true,
    matched: true,
  })),
  revealed: [...DARK_BRIAR_WAVES[0]!],
  visited: [BRIAR_START, '3,5'],
  player: '3,5',
}
for (const [originalChoice, prefix] of [
  ['light', 'freed'],
  ['listen', 'heard'],
] as const) {
  assert.ok(
    BRIAR_SCENES['3,5']?.choices.some((choice) => choice.id === originalChoice),
  )
  const original = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...base,
        revealed: BRIAR_REVEAL_WAVES[0],
        visited: [BRIAR_START, '3,5'],
        player: '3,5',
        wavePhase: 'exploring',
        sceneChoices: { '3,5': originalChoice },
      }),
    ),
  )
  assert.equal(original.sceneChoices['3,5'], originalChoice)
  for (const [mirrorChoice, suffix] of [
    ['apologize', 'repaired'],
    ['ask', 'consulted'],
  ] as const) {
    assert.ok(
      DARK_BRIAR_SCENES['3,5']?.choices.some(
        (choice) => choice.id === mirrorChoice,
      ),
    )
    const chosen = darkBriarChoose(darkTravelerBase, '3,5', mirrorChoice)
    assert.notEqual(chosen, darkTravelerBase)
    const reflected = restoreDarkBriarProgress(
      JSON.parse(JSON.stringify(chosen)),
    )
    assert.equal(reflected.sceneChoices['3,5'], mirrorChoice)
    const accord = `${prefix}-${suffix}`
    assert.equal(earnedBorrowedVoiceAccord(original, reflected), accord)
    assert.equal(
      crossRealmConsequenceLedger(original, mirror, reflected)
        .borrowedVoiceAccord,
      accord,
    )
    const outcome = earnedBorrowedVoiceOutcome(original, reflected)
    assert.ok(outcome && outcome.length > 80)
    borrowedVoiceScenes.add(outcome)
    const ending = crossRealmHouseEpilogue(
      original,
      { ...mirror, ending: 'commons' },
      reflected,
    )
    assert.ok(ending.includes('Pip'))
    borrowedVoiceEpilogues.add(ending)
    assert.equal(
      crossRealmHouseEpilogue(original, mirror, reflected),
      '',
      'The traveler must not reveal a future verdict before the House ends',
    )
    assert.equal(
      earnedBorrowedVoiceOutcome(original, {
        sceneChoices: { '3,5': 'invented' },
      }),
      null,
    )
  }
}
assert.equal(borrowedVoiceScenes.size, 4)
assert.equal(borrowedVoiceEpilogues.size, 4)
assert.equal(
  earnedBorrowedVoiceAccord(base, { sceneChoices: { '3,5': 'ask' } }),
  'unset',
  'Unvisited original scenes cannot invent a shared past',
)
assert.equal(
  earnedBorrowedVoiceOutcome(
    { ...base, sceneChoices: { '3,5': 'invented' } },
    { sceneChoices: { '3,5': 'apologize' } },
  ),
  null,
)
assert.equal(
  crossRealmConsequenceLedger(base, mirror).borrowedVoiceAccord,
  'unset',
  'Older saves without a mirrored traveler decision remain valid',
)
assert.match(
  store,
  /earnedBorrowedVoiceOutcome\(state\.value, dark\.value\)/,
  'The live mirrored encounter must show the earned dialogue',
)
assert.match(
  store,
  /crossRealmHouseEpilogue\(state\.value, darkHouse\.value, dark\.value\)/,
  'The House ending must read the actual mirrored traveler decision',
)

// Scylla and Char are distinct agents. Both original approaches and both
// mirrored conversations must earn different, persistent accounts and endings.
assert.ok(BRIAR_REVEAL_WAVES[0]?.includes('4,4'))
assert.ok(DARK_BRIAR_WAVES[0]?.includes('4,4'))
const royalScenes = new Set<string>()
const royalEpilogues = new Set<string>()
const royalMapCards = DARK_BRIAR_WAVES[0]!.map((tile, id) => ({
  id,
  tile,
  pairId: Math.floor(id / 2),
  image: `/test/royal-pair-${Math.floor(id / 2)}.webp`,
  flipped: true,
  matched: true,
}))
const royalBase = {
  ...newDarkBriarProgress(),
  phase: 'exploring' as const,
  mapCards: royalMapCards,
  revealed: [...DARK_BRIAR_WAVES[0]!],
  visited: [BRIAR_START, '4,4'],
  player: '4,4',
}
for (const source of ['escort', 'question'] as const) {
  assert.ok(BRIAR_SCENES['4,4']?.choices.some((choice) => choice.id === source))
  const original = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...base,
        revealed: BRIAR_REVEAL_WAVES[0],
        visited: [BRIAR_START, '4,4'],
        player: '4,4',
        wavePhase: 'exploring',
        sceneChoices: { '4,4': source },
      }),
    ),
  )
  assert.equal(original.sceneChoices['4,4'], source)
  for (const sister of ['scylla', 'char'] as const) {
    assert.ok(
      DARK_BRIAR_SCENES['4,4']?.choices.some((choice) => choice.id === sister),
    )
    const chosen = darkBriarChoose(royalBase, '4,4', sister)
    assert.notEqual(chosen, royalBase)
    assert.equal(
      darkBriarChoose(chosen, '4,4', sister),
      chosen,
      'A royal conversation cannot be repeated for another ending',
    )
    const restored = restoreDarkBriarProgress(
      JSON.parse(JSON.stringify(chosen)),
    )
    assert.equal(restored.sceneChoices['4,4'], sister)
    const accord = `${source}-${sister}`
    assert.equal(earnedRoyalEscortAccord(original, restored), accord)
    assert.equal(
      crossRealmConsequenceLedger(original, mirror, restored).royalEscortAccord,
      accord,
    )
    const scene = earnedRoyalEscortOutcome(original, restored)
    assert.ok(scene && scene.length > 110)
    assert.ok(scene.includes(sister === 'scylla' ? 'Scylla' : 'Char'))
    royalScenes.add(scene)
    for (const ending of ['return', 'commons'] as const) {
      const epilogue = crossRealmHouseEpilogue(
        original,
        { ...mirror, ending },
        restored,
      )
      assert.ok(epilogue.includes(sister === 'scylla' ? 'Scylla' : 'Char'))
      royalEpilogues.add(epilogue)
    }
    assert.equal(
      crossRealmHouseEpilogue(original, mirror, restored),
      '',
      'The sisters must not reveal the House ending early',
    )
    assert.equal(
      earnedRoyalEscortOutcome(original, {
        sceneChoices: { '4,4': 'forged' },
      }),
      null,
    )
  }
}
assert.equal(royalScenes.size, 4)
assert.equal(royalEpilogues.size, 4)
assert.equal(
  earnedRoyalEscortAccord(base, { sceneChoices: { '4,4': 'scylla' } }),
  'unset',
)
assert.equal(
  earnedRoyalEscortOutcome(
    { ...base, sceneChoices: { '4,4': 'invented' } },
    { sceneChoices: { '4,4': 'char' } },
  ),
  null,
)
assert.equal(
  crossRealmConsequenceLedger(base, mirror).royalEscortAccord,
  'unset',
  'Older saves without a royal conversation must remain valid',
)
assert.match(
  store,
  /earnedRoyalEscortOutcome\(state\.value, dark\.value\)/,
  'The live stage must render the earned royal conversation',
)
assert.ok(
  DARK_BRIAR_SCENES['4,4']?.originalCallback?.alternate.includes(
    'question about their matching faces',
  ),
  'The old callback must remember the actual lantern question',
)

const earnedHouseEpilogues = new Set<string>()
for (const witnessChoice of ['remember', 'protect'] as const) {
  for (const ending of ['return', 'commons'] as const) {
    const original = {
      ...base,
      house: { ...house, ending: 'release' as const },
      sceneChoices: { '6,3': witnessChoice, '4,3': 'plan' },
    }
    const reflected = { ...mirror, ending }
    const ledger = crossRealmConsequenceLedger(original, reflected)
    assert.equal(ledger.memoryCustody, 'release')
    assert.equal(ledger.crossingAccord, ending)
    assert.equal(
      ledger.witnessRecord,
      witnessChoice === 'remember' ? 'copied' : 'protected',
    )
    assert.equal(ledger.orensProvision, 'route')
    const text = crossRealmHouseEpilogue(original, reflected)
    assert.ok(text.includes('Oren'), 'Earned logistics must affect the ending')
    assert.ok(
      witnessChoice === 'remember'
        ? text.includes('names you copied') || text.includes('copied names')
        : text.includes('names you protected') ||
            text.includes('shielded the names'),
      'The original witness decision must survive into the ending',
    )
    assert.equal(
      crossRealmHouseEpilogue(
        JSON.parse(JSON.stringify(original)),
        JSON.parse(JSON.stringify(reflected)),
      ),
      text,
      'An existing save round-trip must not invent new ledger fields',
    )
    earnedHouseEpilogues.add(text)
  }
}
assert.equal(
  earnedHouseEpilogues.size,
  4,
  'Both House endings react to both witness policies',
)
const supplies = crossRealmHouseEpilogue(
  { ...base, sceneChoices: { '4,3': 'load' } },
  { ...mirror, ending: 'commons' },
)
assert.ok(supplies.includes('provisions'))
assert.ok(!supplies.includes('route you planned'))
for (const [choice, phrase] of [
  ['truth', 'false oath you challenged'],
  ['errand', 'apology you delivered'],
] as const) {
  const knight = { ...base, sceneChoices: { '5,4': choice } }
  assert.equal(
    crossRealmConsequenceLedger(knight, mirror).knightsDuty,
    choice === 'truth' ? 'oath' : 'errand',
  )
  assert.ok(
    crossRealmHouseEpilogue(knight, { ...mirror, ending: 'return' }).includes(
      phrase,
    ),
  )
  assert.equal(crossRealmHouseEpilogue(knight, mirror), '')
}
assert.equal(
  crossRealmHouseEpilogue(
    { ...base, sceneChoices: { '5,4': 'invented' } },
    { ...mirror, ending: 'commons' },
  ),
  '',
  'Forged Knight choices earn nothing',
)
assert.equal(
  crossRealmHouseEpilogue(
    { ...base, sceneChoices: { '4,3': 'invented', '6,3': 'invented' } },
    { ...mirror, ending: 'return' },
  ),
  '',
  'Unrecognized source choices must never earn an epilogue',
)
assert.equal(
  crossRealmHouseEpilogue(
    { ...base, sceneChoices: { '4,3': 'plan', '6,3': 'remember' } },
    mirror,
  ),
  '',
  'No future ending content may appear before the mirrored House resolves',
)
assert.equal(
  crossRealmConsequenceLedger(base, mirror).witnessRecord,
  'unset',
  'Old saves without the portable clue remain playable',
)
assert.match(
  store,
  /crossRealmHouseEpilogue\(state\.value, darkHouse\.value, dark\.value\)/,
  'The real mirrored House verdict must render the earned epilogue',
)

// A prior relationship choice must change a later playable puzzle resource,
// not merely add a sentence to the finale. Both variants are mutually exclusive.
for (const [choice, room, source] of [
  ['plan', 'HD-03', 'route'],
  ['load', 'HD-25', 'supplies'],
] as const) {
  const original = { ...base, sceneChoices: { '4,3': choice } }
  assert.equal(earnedDarkHousePuzzleClue(original, room), source)
  assert.equal(
    earnedDarkHousePuzzleClue(original, room === 'HD-03' ? 'HD-25' : 'HD-03'),
    null,
    'One earned benefit cannot leak into unrelated puzzle rooms',
  )
  const atPuzzle = { ...newDarkHouseProgress(), active: true, current: room }
  assert.equal(darkHouseEchoes(atPuzzle), 0)
  assert.equal(darkHousePuzzleHint(atPuzzle), atPuzzle)
  const helped = darkHousePuzzleHint(atPuzzle, source)
  assert.notEqual(helped, atPuzzle)
  assert.equal(helped.puzzles[room]?.hint, true)
  assert.equal(
    helped.spentEchoes,
    0,
    'Earned Oren support must not spend echoes',
  )
  assert.ok(helped.puzzles[room]?.note.includes('Oren'))
  assert.equal(darkHousePuzzleHint(helped, source), helped)
  assert.equal(
    restoreDarkHouseProgress(JSON.parse(JSON.stringify(helped))).puzzles[room]
      ?.hint,
    true,
    'Reloading cannot reclaim a second free hint',
  )
  assert.equal(
    darkHousePuzzleHint(
      { ...atPuzzle, decisions: { [room]: 'attend' } },
      source,
    ).puzzles[room],
    undefined,
    'A decided room cannot consume another clue after completion',
  )
}
assert.equal(
  earnedDarkHousePuzzleClue(
    { ...base, sceneChoices: { '4,3': 'invented' } },
    'HD-03',
  ),
  null,
  'Forged or missing Oren decisions cannot grant puzzle support',
)

// A second-wave Vault choice must be geographically reachable and authored
// before its witness testimony can become a free clue in the mirrored House.
const earlyReveals = BRIAR_REVEAL_WAVES.slice(0, 2).flat()
assert.ok(earlyReveals.includes('6,3'))
assert.ok(briarConnected(BRIAR_START, '6,3', earlyReveals))
assert.match(
  store,
  /state\.value\.sceneChoices\[key\] = choice\.id/,
  'The playable Briar scene action must record the choice that earns support',
)
for (const [witnessChoice, room, source] of [
  ['remember', 'HD-08', 'names'],
  ['protect', 'HD-34', 'consent'],
] as const) {
  const option = BRIAR_SCENES['6,3']?.choices.find(
    (choice) => choice.id === witnessChoice,
  )
  assert.ok(option, 'The original Vault must offer the earned choice')
  assert.equal(
    canChooseBriarScene(option, { wildflowers: 0, lanterns: 1 }),
    true,
    'The witness choice must be possible without an invented resource grant',
  )
  const original = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: earlyReveals,
        visited: [BRIAR_START, '6,3'],
        player: '6,3',
        waveIndex: 1,
        wavePhase: 'exploring',
        sceneChoices: { '6,3': option.id },
      }),
    ),
  )
  assert.equal(original.sceneChoices['6,3'], witnessChoice)
  assert.equal(earnedDarkHousePuzzleClue(original, room), source)
  assert.equal(
    earnedDarkHousePuzzleClue(original, room === 'HD-08' ? 'HD-34' : 'HD-08'),
    null,
    'Opposite witness policy cannot claim both puzzle benefits',
  )
  const atPuzzle = { ...newDarkHouseProgress(), active: true, current: room }
  assert.equal(darkHouseEchoes(atPuzzle), 0)
  assert.equal(darkHousePuzzleHint(atPuzzle), atPuzzle)
  assert.equal(
    darkHousePuzzleHint(atPuzzle, 'route'),
    atPuzzle,
    'An Oren entitlement cannot be forged into a witness clue',
  )
  const helped = darkHousePuzzleHint(atPuzzle, source)
  assert.equal(helped.puzzles[room]?.hint, true)
  assert.equal(helped.spentEchoes, 0)
  assert.match(helped.puzzles[room]?.note ?? '', /witness|mason/i)
  assert.equal(darkHousePuzzleHint(helped, source), helped)
  const restored = restoreDarkHouseProgress(JSON.parse(JSON.stringify(helped)))
  assert.equal(restored.puzzles[room]?.hint, true)
  assert.equal(darkHousePuzzleHint(restored, source), restored)
  const decided = { ...atPuzzle, decisions: { [room]: 'attend' } }
  assert.equal(
    darkHousePuzzleHint(decided, source),
    decided,
    'No hint can be consumed after a room decision',
  )
}
assert.equal(
  earnedDarkHousePuzzleClue(
    { ...base, sceneChoices: { '6,3': 'invented' } },
    'HD-08',
  ),
  null,
  'Forged witness policy must never earn a clue',
)
// A recovered Earth photograph is portable evidence, regardless of whether
// the protagonist archived it clinically or admitted their fear. Neither
// reaction invents a clue for a player who skipped the encounter.
assert.ok(BRIAR_REVEAL_WAVES[0]?.includes('2,5'))
assert.ok(briarConnected(BRIAR_START, '2,5', BRIAR_REVEAL_WAVES[0]!))
for (const photoChoice of ['archive', 'grieve'] as const) {
  const option = BRIAR_SCENES['2,5']?.choices.find(
    (choice) => choice.id === photoChoice,
  )
  assert.ok(option)
  assert.equal(
    canChooseBriarScene(option, { wildflowers: 0, lanterns: 1 }),
    true,
  )
  const original = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: BRIAR_REVEAL_WAVES[0],
        visited: [BRIAR_START, '2,5'],
        player: '2,5',
        wavePhase: 'exploring',
        sceneChoices: { '2,5': photoChoice },
      }),
    ),
  )
  assert.equal(earnedDarkHousePuzzleClue(original, 'HD-13'), 'earth-photo')
  assert.equal(earnedDarkHousePuzzleClue(original, 'HD-25'), null)
  const atPantry = {
    ...newDarkHouseProgress(),
    active: true,
    current: 'HD-13' as const,
  }
  assert.equal(darkHousePuzzleHint(atPantry), atPantry)
  assert.equal(darkHousePuzzleHint(atPantry, 'names'), atPantry)
  const helped = darkHousePuzzleHint(
    atPantry,
    earnedDarkHousePuzzleClue(original, 'HD-13'),
  )
  assert.equal(helped.spentEchoes, 0)
  assert.equal(helped.puzzles['HD-13']?.hint, true)
  assert.match(helped.puzzles['HD-13']?.note ?? '', /photograph|meals/i)
  const restored = restoreDarkHouseProgress(JSON.parse(JSON.stringify(helped)))
  assert.equal(darkHousePuzzleHint(restored, 'earth-photo'), restored)
  const decided = { ...atPantry, decisions: { 'HD-13': 'attend' } }
  assert.equal(
    darkHousePuzzleHint(decided, 'earth-photo'),
    decided,
    'An already-decided room cannot consume its earned photo clue',
  )
}
assert.equal(earnedDarkHousePuzzleClue(base, 'HD-13'), null)
assert.equal(
  earnedDarkHousePuzzleClue(
    { ...base, sceneChoices: { '2,5': 'invented' } },
    'HD-13',
  ),
  null,
)

const solvedTrial = darkHouseTrialFaces('HD-09')
const paidPuzzle = {
  ...newDarkHouseProgress(),
  active: true,
  current: 'HD-03' as const,
  trials: {
    'HD-09': {
      matched: solvedTrial.map((face) => face.id),
      faceUp: [],
      failures: 0,
      clue: null,
      note: '',
    },
  },
}
assert.equal(darkHouseEchoes(paidPuzzle), 1)
const paidHint = darkHousePuzzleHint(paidPuzzle)
assert.equal(paidHint.spentEchoes, 1)
assert.equal(darkHouseEchoes(paidHint), 0)
assert.equal(darkHousePuzzleHint(paidHint), paidHint)
assert.match(
  store,
  /earnedDarkHousePuzzleClue\(state\.value, darkHouse\.value\.current\)/,
)
const houseStage = readFileSync(
  'components/memory-dungeon/dark-house-stage.vue',
  'utf8',
)
assert.ok(houseStage.includes('world.darkHouseEarnedClue'))
assert.ok(houseStage.includes('free clue'))
assert.ok(houseStage.includes('Witness testimony · free clue'))
assert.ok(houseStage.includes('Protected witnesses · free clue'))
assert.ok(houseStage.includes('Dated Earth photograph · free clue'))

console.log(
  'Six earned worldframes, bounded relationship callbacks, and physical bridge shortcut pass',
)

/** Walk only connected, revealed Briar sites, preserving each movement through
 * the actual save restorer. No teleport to a later choice or invented resource. */
function walkEarnedBriarRoute(
  start: string,
  goal: string,
  revealed: readonly string[],
): string[] {
  const paths = [[start]]
  const seen = new Set([start])
  const available = new Set(revealed)
  while (paths.length) {
    const path = paths.shift()!
    const current = path[path.length - 1]!
    if (current === goal) return path
    const neighbors = [
      ...(BRIAR_LINKS[current] ?? []),
      ...Object.entries(BRIAR_LINKS)
        .filter(([, exits]) => exits.includes(current))
        .map(([source]) => source),
    ]
    for (const next of neighbors) {
      if (!available.has(next) || seen.has(next)) continue
      seen.add(next)
      paths.push([...path, next])
    }
  }
  throw new Error(`No revealed Briar route from ${start} to ${goal}`)
}

// A fresh expedition must earn its geography through real two-card matching,
// not begin with two pre-unlocked waves. This exercises the same pure pair
// settlement used by the playable store, including interrupted turns, mismatches
// and save restoration after every successful pair.
function freshBriarTwoWaves(seed: number) {
  let randomState = seed >>> 0
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 4294967296
  }
  let progress = newBriarSave()
  for (let waveIndex = 0; waveIndex < 2; waveIndex++) {
    const wave = BRIAR_REVEAL_WAVES[waveIndex]!
    assert.equal(progress.waveIndex, waveIndex)
    assert.equal(progress.wavePhase, 'matching')
    const faces = Array.from(
      { length: wave.length / 2 },
      (_, index) => `/memory/fresh-${seed}-${waveIndex}-${index}.webp`,
    )
    progress = restoreBriarSave({
      ...progress,
      mapCards: createBriarWaveCards(wave, faces, random),
      seenMapImages: [...progress.seenMapImages, ...faces],
    })
    const pairs = [...new Set(progress.mapCards.map((card) => card.pairId))]
    for (const pair of pairs) {
      const [first, second] = progress.mapCards.filter(
        (card) => card.pairId === pair,
      )
      assert.ok(first && second)
      const wrong = progress.mapCards.find(
        (card) => !card.matched && card.pairId !== pair,
      )
      if (wrong) {
        const wrongTurn = {
          ...progress,
          mapCards: progress.mapCards.map((card) =>
            card.tile === first.tile || card.tile === wrong.tile
              ? { ...card, flipped: true }
              : card,
          ),
        }
        assert.equal(
          settleBriarWavePair(wrongTurn, first.tile, wrong.tile),
          null,
          'Different pictures cannot reveal terrain',
        )
      }
      const interrupted = restoreBriarSave({
        ...progress,
        mapCards: progress.mapCards.map((card) =>
          card.tile === first.tile ? { ...card, flipped: true } : card,
        ),
      })
      assert.equal(
        interrupted.mapCards.find((card) => card.tile === first.tile)?.flipped,
        false,
        'An interrupted single-card turn must reset on reload',
      )
      const turn = {
        ...progress,
        mapCards: progress.mapCards.map((card) =>
          card.tile === first.tile || card.tile === second.tile
            ? { ...card, flipped: true }
            : card,
        ),
      }
      assert.equal(
        settleBriarWavePair(
          {
            ...turn,
            mapCards: turn.mapCards.map((card) =>
              card.tile === second.tile
                ? { ...card, image: '/memory/not-the-same-picture.webp' }
                : card,
            ),
          },
          first.tile,
          second.tile,
        ),
        null,
        'A forged pair ID cannot match visibly different pictures',
      )
      const settled = settleBriarWavePair(turn, first.tile, second.tile)
      assert.ok(settled, 'The visible identical pair must settle')
      progress = restoreBriarSave(JSON.parse(JSON.stringify(settled)))
      assert.ok(progress.revealed.includes(first.tile))
      assert.ok(progress.revealed.includes(second.tile))
      assert.equal(
        settleBriarWavePair(progress, first.tile, second.tile),
        null,
        'A matched pair cannot reveal again after reloading',
      )
    }
    assert.equal(progress.wavePhase, 'exploring')
    assert.deepEqual(
      [...progress.revealed].sort(),
      BRIAR_REVEAL_WAVES.slice(0, waveIndex + 1)
        .flat()
        .sort(),
      'Only legitimately matched map squares become accessible',
    )
    if (waveIndex === 0) {
      progress = restoreBriarSave({
        ...progress,
        waveIndex: 1,
        wavePhase: 'matching',
        mapCards: [],
      })
    }
  }
  assert.equal(progress.revealed.length, 26)
  assert.equal(progress.visited.includes(BRIAR_START), true)
  return progress
}
assert.match(
  store,
  /settleBriarWavePair\(\s*state\.value,\s*first\.tile,\s*card\.tile/,
  'The actual store must use the reducer exercised by the fresh-game witness',
)

// Four independent seeded expeditions earn the first two map waves before
// walking to Oren and the Vault. They then complete the entire mirrored House
// with each distinct pair of relationship and witness choices.
for (const [orenChoice, witnessChoice, philosophy, seed] of [
  ['plan', 'remember', 'attend', 7],
  ['plan', 'protect', 'refuse', 23],
  ['load', 'remember', 'refuse', 101],
  ['load', 'protect', 'attend', 2026],
] as const) {
  let original = freshBriarTwoWaves(seed)
  for (const [site, choice] of [
    ['4,3', orenChoice],
    ['6,3', witnessChoice],
  ] as const) {
    const route = walkEarnedBriarRoute(original.player, site, original.revealed)
    for (const step of route.slice(1)) {
      assert.ok(
        briarConnected(original.player, step, original.revealed),
        `Cannot teleport from ${original.player} to ${step}`,
      )
      original = restoreBriarSave({
        ...original,
        player: step,
        visited: [...original.visited, step],
      })
    }
    const option = BRIAR_SCENES[site]!.choices.find(
      (candidate) => candidate.id === choice,
    )
    assert.ok(option && canChooseBriarScene(option, original))
    original = restoreBriarSave({
      ...original,
      sceneChoices: { ...original.sceneChoices, [site]: choice },
    })
    assert.equal(original.sceneChoices[site], choice)
  }

  let journey = { ...newDarkHouseProgress(), active: true }
  const visitedRooms = new Set<string>([journey.current])
  const freeClueRooms: string[] = []
  function exploreEarnedHouse(): void {
    const room = journey.current
    const clue = earnedDarkHousePuzzleClue(original, room)
    if (clue) {
      assert.ok(DARK_HOUSE_PUZZLES[room], `${room} needs a real puzzle`)
      const spent = journey.spentEchoes
      journey = darkHousePuzzleHint(journey, clue)
      assert.equal(journey.spentEchoes, spent, `${room} must be free`)
      assert.equal(journey.puzzles[room]?.hint, true)
      journey = restoreDarkHouseProgress(JSON.parse(JSON.stringify(journey)))
      assert.equal(
        darkHousePuzzleHint(journey, clue),
        journey,
        `${room} cannot claim the clue twice after reload`,
      )
      freeClueRooms.push(room)
    }
    if (DARK_HOUSE_TRIALS[room]) {
      const faces = darkHouseTrialFaces(room)
      for (const pair of new Set(faces.map((face) => face.pair))) {
        const match = faces.filter((face) => face.pair === pair)
        journey = darkHouseFlip(journey, match[0]!.id)
        journey = darkHouseFlip(journey, match[1]!.id)
      }
    }
    if (DARK_HOUSE_PUZZLES[room]) {
      journey = darkHouseAnswerPuzzle(journey, DARK_HOUSE_PUZZLES[room]!.answer)
    }
    assert.equal(darkHouseRoomResolved(journey), true)
    journey = darkHouseChoose(journey, philosophy)
    journey = restoreDarkHouseProgress(JSON.parse(JSON.stringify(journey)))
    assert.equal(journey.decisions[room], philosophy)
    for (const next of DARK_HOUSE_ROOMS[room]!.exits) {
      if (visitedRooms.has(next)) continue
      assert.ok(
        darkHouseExits(journey).includes(next),
        `${room} must open ${next} after its real decision`,
      )
      journey = darkHouseMove(journey, next)
      visitedRooms.add(next)
      exploreEarnedHouse()
      journey = darkHouseMove(journey, room)
      assert.equal(journey.current, room)
    }
  }
  exploreEarnedHouse()
  assert.equal(visitedRooms.size, 36)
  assert.equal(Object.keys(journey.decisions).length, 36)
  assert.deepEqual(
    freeClueRooms.sort(),
    [
      orenChoice === 'plan' ? 'HD-03' : 'HD-25',
      witnessChoice === 'remember' ? 'HD-08' : 'HD-34',
    ].sort(),
    'Exactly two earned room-bound clues must be reachable',
  )
  assert.equal(journey.ending, philosophy === 'attend' ? 'return' : 'commons')
  const aftermath = crossRealmHouseEpilogue(original, journey)
  assert.ok(aftermath.includes('Oren'))
  assert.ok(
    witnessChoice === 'remember'
      ? aftermath.includes('copied') || aftermath.includes('names you copied')
      : aftermath.includes('protected') || aftermath.includes('shielded'),
  )
}
console.log(
  'Four seeded fresh Briar-to-House journeys: 52 real map pairs, 144 resolved House rooms, 8 earned clues, four source combinations and both endings survive save round-trips',
)

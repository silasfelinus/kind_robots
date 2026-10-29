import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HOUSE_ROOMS,
  newHouseProgress,
  restoreHouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'
import { houseFloorBeat } from '../memoryDungeon/houseFloorStory'
import { BRIAR_QUESTS, briarQuestProgress } from '../memoryDungeon/briarQuests'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'

const progress = (
  current: HouseRoomId,
  visited: HouseRoomId[] = ['HD-01', current],
  decisions: Record<string, string> = {},
) => ({
  ...newHouseProgress(),
  current,
  visited: [...new Set(visited)],
  decisions,
})

for (const [key, ids] of [
  ['6,4', ['read', 'carry']],
  ['5,4', ['truth', 'errand']],
] as const)
  for (const id of ids)
    assert.ok(
      BRIAR_SCENES[key]?.choices.some((choice) => choice.id === id),
      `House arrival references an authored Briar choice: ${key}:${id}`,
    )

for (const [room, ids] of [
  ['HD-05', ['open', 'test']],
  ['HD-06', ['route', 'stock']],
  ['HD-12', ['open', 'map']],
  ['HD-24', ['mark', 'retreat']],
  ['HD-10', ['manifest', 'improvise']],
  ['HD-11', ['respect', 'help']],
  ['HD-30', ['talk', 'rest']],
  ['HD-17', ['read']],
  ['HD-21', ['archive']],
  ['HD-16', ['return-name']],
  ['HD-26', ['testify']],
  ['HD-29', ['repair']],
  ['HD-33', ['reveal', 'consent']],
  ['HD-35', ['release', 'renew', 'break']],
] as const)
  for (const id of ids)
    assert.ok(
      HOUSE_ROOMS[room]?.choices.some((choice) => choice.id === id),
      `House chapter references an authored decision: ${room}:${id}`,
    )

const entry = progress('HD-01')
const entryBranches = [
  houseFloorBeat('HD-01', entry, {}),
  houseFloorBeat('HD-01', entry, { '6,4': 'read' }),
  houseFloorBeat('HD-01', entry, { '6,4': 'carry' }),
  houseFloorBeat('HD-01', entry, { '5,4': 'truth' }),
  houseFloorBeat('HD-01', entry, { '5,4': 'errand' }),
]
assert.equal(new Set(entryBranches.map((beat) => beat?.title)).size, 5)
assert.match(entryBranches[1]!.cost, /apology/)
assert.match(entryBranches[2]!.cost, /warning/)

const witnesses = progress('HD-13')
const middleBranches = [
  houseFloorBeat('HD-13', witnesses, {}),
  houseFloorBeat('HD-13', { ...witnesses, decisions: { 'HD-05': 'open' } }, {}),
  houseFloorBeat('HD-13', { ...witnesses, decisions: { 'HD-05': 'test' } }, {}),
  houseFloorBeat(
    'HD-13',
    { ...witnesses, decisions: { 'HD-06': 'stock' } },
    {},
  ),
]
assert.equal(new Set(middleBranches.map((beat) => beat?.title)).size, 4)
assert.match(middleBranches[1]!.cost, /scrutiny/)
assert.match(middleBranches[2]!.cost, /closed/)

const fullPath = Array.from(
  { length: 25 },
  (_, index) => `HD-${String(index + 1).padStart(2, '0')}`,
) as HouseRoomId[]
const ledger = progress('HD-25', fullPath)
const shortcut = progress(
  'HD-25',
  ['HD-01', 'HD-07', 'HD-08', 'HD-09', 'HD-10', 'HD-25'],
  { 'HD-10': 'manifest' },
)
const finalBranches = [
  houseFloorBeat('HD-25', ledger, {}),
  houseFloorBeat('HD-25', { ...ledger, decisions: { 'HD-17': 'read' } }, {}),
  houseFloorBeat('HD-25', { ...ledger, decisions: { 'HD-21': 'archive' } }, {}),
  houseFloorBeat('HD-25', shortcut, {}),
]
assert.equal(new Set(finalBranches.map((beat) => beat?.title)).size, 4)
assert.match(finalBranches[3]!.text, /unvisited halls/)
assert.match(finalBranches[3]!.cost, /cannot be invented/)

assert.ok(
  BRIAR_SCENES['4,6']?.choices.some((choice) => choice.id === 'testify'),
  'Warden petition must reference a real Briar witness',
)

const warden = progress('HD-32')
const wardenBranches: Array<{
  save: ReturnType<typeof progress>
  briar: Record<string, string>
}> = [
  { save: warden, briar: {} },
  {
    save: progress('HD-32', ['HD-01', 'HD-26', 'HD-32'], {
      'HD-26': 'testify',
    }),
    briar: {},
  },
  {
    save: progress('HD-32', ['HD-01', 'HD-17', 'HD-32'], {
      'HD-17': 'read',
    }),
    briar: {},
  },
  {
    save: progress('HD-32', ['HD-01', 'HD-16', 'HD-32'], {
      'HD-16': 'return-name',
    }),
    briar: {},
  },
  { save: warden, briar: { '4,6': 'testify' } },
]
const wardenBeats = wardenBranches.map(({ save, briar }) =>
  houseFloorBeat('HD-32', save, briar),
)
assert.equal(new Set(wardenBeats.map((beat) => beat?.title)).size, 5)
assert.match(wardenBeats[0]!.cost, /Without testimony/)
assert.match(wardenBeats[1]!.cost, /withdraw consent/)
assert.match(wardenBeats[2]!.text, /neither can sign for/)
assert.match(wardenBeats[4]!.text, /wolf patrol/)
assert.equal(
  houseFloorBeat('HD-32', warden, { '4,6': 'shelter' })?.title,
  wardenBeats[0]?.title,
  'Offering shelter does not fabricate testimony for the Warden',
)

const hearth = progress('HD-35')
const hearthBranches = [
  hearth,
  ...(['release', 'renew', 'break'] as const).map((ending) => ({
    ...progress('HD-35', ['HD-01', 'HD-35'], { 'HD-35': ending }),
    ending,
  })),
  progress('HD-35', ['HD-01', 'HD-33', 'HD-35'], {
    'HD-33': 'consent',
  }),
  progress('HD-35', ['HD-01', 'HD-33', 'HD-35'], {
    'HD-33': 'reveal',
  }),
  progress('HD-35', ['HD-01', 'HD-29', 'HD-35'], {
    'HD-29': 'repair',
  }),
]
const hearthBeats = hearthBranches.map((save) =>
  houseFloorBeat('HD-35', save, {}),
)
assert.equal(new Set(hearthBeats.map((beat) => beat?.title)).size, 7)
assert.match(hearthBeats[1]!.text, /own jars/)
assert.match(hearthBeats[2]!.cost, /genuine choice/)
assert.match(hearthBeats[3]!.text, /Char starts a list/)
assert.match(hearthBeats[4]!.cost, /Waiting protects consent/)
assert.match(hearthBeats[5]!.cost, /time to prepare/)
assert.match(hearthBeats[6]!.text, /revocation clause/)
assert.equal(
  houseFloorBeat('HD-35', hearth, {})?.title,
  'The Hearth Cannot Vote for Everyone',
  'An unresolved Hearth must not narrate an ending the player has not chosen',
)

const broom = progress('HD-06', fullPath.slice(0, 6))
const broomBeats = [
  houseFloorBeat('HD-06', broom, {}),
  houseFloorBeat('HD-06', { ...broom, decisions: { 'HD-06': 'stock' } }, {}),
  houseFloorBeat('HD-06', { ...broom, decisions: { 'HD-06': 'route' } }, {}),
]
assert.equal(new Set(broomBeats.map((beat) => beat?.title)).size, 3)
assert.match(broomBeats[1]!.text, /without first owing you a story/)
assert.match(broomBeats[2]!.cost, /next frightened resident/)

const passage = progress('HD-12', fullPath.slice(0, 12))
const passageBeats = [
  houseFloorBeat('HD-12', passage, {}),
  houseFloorBeat('HD-12', { ...passage, decisions: { 'HD-12': 'open' } }, {}),
  houseFloorBeat('HD-12', { ...passage, decisions: { 'HD-12': 'map' } }, {}),
]
assert.equal(new Set(passageBeats.map((beat) => beat?.title)).size, 3)
assert.match(passageBeats[1]!.cost, /officers now know/)
assert.match(passageBeats[2]!.cost, /closed passage/)

const cellar = progress('HD-24', fullPath.slice(0, 24))
const cellarCases = [
  cellar,
  { ...cellar, decisions: { 'HD-12': 'open' } },
  { ...cellar, decisions: { 'HD-06': 'stock' } },
  { ...cellar, decisions: { 'HD-06': 'stock', 'HD-12': 'open' } },
  {
    ...cellar,
    decisions: {
      'HD-06': 'stock',
      'HD-12': 'open',
      'HD-24': 'mark',
    },
  },
  {
    ...cellar,
    decisions: {
      'HD-06': 'stock',
      'HD-12': 'open',
      'HD-24': 'retreat',
    },
  },
]
const cellarBeats = cellarCases.map((save) => houseFloorBeat('HD-24', save, {}))
assert.equal(new Set(cellarBeats.map((beat) => beat?.title)).size, 6)
assert.match(cellarBeats[1]!.cost, /did not equip/)
assert.match(cellarBeats[2]!.cost, /permissions/)
assert.match(cellarBeats[3]!.text, /ordinary work, not a verdict/)
assert.match(cellarBeats[4]!.cost, /hunting them/)
assert.match(cellarBeats[5]!.cost, /nobody else/)
assert.equal(
  houseFloorBeat(
    'HD-24',
    { ...cellar, decisions: { 'HD-12': 'invented', 'HD-06': 'route' } },
    {},
  )?.title,
  cellarBeats[0]?.title,
  'Unknown decisions cannot fabricate the shared evacuation',
)

const sisterQuest = BRIAR_QUESTS.find(
  (quest) => quest.id === 'different-waters-same-face',
)
assert.ok(sisterQuest)
for (const id of ['escort', 'question'])
  assert.ok(
    BRIAR_SCENES['4,4']?.choices.some((choice) => choice.id === id),
    `Sisters' arrival references an authored Briar choice: 4,4:${id}`,
  )

const inventory = progress('HD-10', fullPath.slice(0, 10))
const wardrobe = progress('HD-11', fullPath.slice(0, 11))
const landing = progress(
  'HD-30',
  Array.from(
    { length: 30 },
    (_, index) => `HD-${String(index + 1).padStart(2, '0')}`,
  ) as HouseRoomId[],
)
const sisterCases: Array<{
  save: ReturnType<typeof progress>
  briar: Record<string, string>
}> = [
  { save: inventory, briar: {} },
  {
    save: { ...inventory, decisions: { 'HD-10': 'manifest' } },
    briar: {},
  },
  {
    save: { ...inventory, decisions: { 'HD-10': 'improvise' } },
    briar: {},
  },
  { save: wardrobe, briar: {} },
  {
    save: { ...wardrobe, decisions: { 'HD-11': 'respect' } },
    briar: {},
  },
  {
    save: { ...wardrobe, decisions: { 'HD-11': 'help' } },
    briar: {},
  },
  { save: landing, briar: {} },
  {
    save: { ...landing, decisions: { 'HD-30': 'rest' } },
    briar: {},
  },
  {
    save: { ...landing, decisions: { 'HD-30': 'talk' } },
    briar: {},
  },
  {
    save: {
      ...landing,
      decisions: {
        'HD-10': 'manifest',
        'HD-11': 'respect',
        'HD-30': 'talk',
      },
    },
    briar: {},
  },
  {
    save: {
      ...landing,
      decisions: {
        'HD-10': 'improvise',
        'HD-11': 'help',
        'HD-30': 'talk',
      },
    },
    briar: {},
  },
  {
    save: {
      ...landing,
      decisions: {
        'HD-10': 'improvise',
        'HD-11': 'respect',
        'HD-30': 'talk',
      },
    },
    briar: { '4,4': 'escort' },
  },
]
const sisterBeats = sisterCases.map(({ save, briar }) =>
  houseFloorBeat(save.current, save, briar),
)
assert.equal(new Set(sisterBeats.map((beat) => beat?.title)).size, 12)
assert.match(sisterBeats[1]!.cost, /bypass/)
assert.match(sisterBeats[2]!.text, /maid and her parcels/)
assert.match(sisterBeats[4]!.cost, /boot/)
assert.match(sisterBeats[5]!.cost, /unspoken/)
assert.match(sisterBeats[7]!.cost, /waits/)
assert.match(sisterBeats[9]!.text, /blank line/)
assert.match(sisterBeats[10]!.cost, /untold story/)
assert.match(sisterBeats[11]!.text, /asks Char before/)
assert.match(sisterBeats[11]!.cost, /right to refuse|still unresolved/)
assert.equal(
  briarQuestProgress(
    sisterQuest,
    sisterCases[11]!.briar,
    sisterCases[11]!.save.decisions,
  ).state,
  'complete',
  'The fully earned landing branch agrees with the existing sisters quest',
)
assert.equal(
  houseFloorBeat('HD-30', sisterCases[11]!.save, {})?.title,
  sisterBeats[8]?.title,
  'No Briar meeting means no fully earned sisters reconciliation',
)
assert.equal(
  houseFloorBeat(
    'HD-30',
    {
      ...landing,
      decisions: {
        'HD-10': 'invented',
        'HD-11': 'respect',
        'HD-30': 'talk',
      },
    },
    { '4,4': 'escort' },
  )?.title,
  sisterBeats[8]?.title,
  'Forged choice IDs cannot unlock the sisters quest payoff',
)
for (const { save, briar } of sisterCases) {
  const before = houseFloorBeat(save.current, save, briar)
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(save)))
  assert.ok(restored, `Sisters scene ${save.current} should restore`)
  assert.deepEqual(
    houseFloorBeat(save.current, restored, briar),
    before,
    `Sisters dialogue survives save restoration at ${save.current}`,
  )
}

for (const save of [
  broom,
  { ...broom, decisions: { 'HD-06': 'stock' } },
  { ...broom, decisions: { 'HD-06': 'route' } },
  passage,
  { ...passage, decisions: { 'HD-12': 'open' } },
  { ...passage, decisions: { 'HD-12': 'map' } },
  ...cellarCases,
]) {
  const before = houseFloorBeat(save.current, save, {})
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(save)))
  assert.ok(restored)
  assert.deepEqual(
    houseFloorBeat(save.current, restored, {}),
    before,
    `House return-route decision persists at ${save.current}`,
  )
}

for (const { save, briar } of wardenBranches) {
  const before = houseFloorBeat('HD-32', save, briar)
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(save)))
  assert.ok(restored)
  assert.deepEqual(houseFloorBeat('HD-32', restored, briar), before)
}
for (const save of hearthBranches) {
  const before = houseFloorBeat('HD-35', save, {})
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(save)))
  assert.ok(restored)
  assert.deepEqual(houseFloorBeat('HD-35', restored, {}), before)
}

for (const beat of [
  ...entryBranches,
  ...middleBranches,
  ...finalBranches,
  ...wardenBeats,
  ...hearthBeats,
  ...broomBeats,
  ...passageBeats,
  ...cellarBeats,
  ...sisterBeats,
]) {
  assert.ok(beat && beat.text.length >= 125 && beat.cost.length >= 50)
  assert.doesNotMatch(
    `${beat.title} ${beat.text} ${beat.cost}`,
    /world (?:16|sixteen)|floor (?:one|two|three) of three/i,
  )
}
assert.equal(houseFloorBeat('HD-02', entry, {}), null)
assert.equal(houseFloorBeat('HD-25', null, {}), null)

// The same earned witness branch survives JSON serialization and the actual
// House save restorer. A shortcut must not manufacture skipped testimony.
for (const sample of [
  { ...ledger, decisions: { 'HD-17': 'read' } },
  shortcut,
]) {
  const before = houseFloorBeat('HD-25', sample, {})
  const restored = restoreHouseProgress(JSON.parse(JSON.stringify(sample)))
  assert.ok(restored)
  assert.deepEqual(houseFloorBeat('HD-25', restored, {}), before)
}

const stage = readFileSync('components/memory-dungeon/house-stage.vue', 'utf8')
assert.match(stage, /data-testid="memory-house-floor-story"/)
assert.match(
  stage,
  /houseFloorBeat\(room\.value\?\.id, progress\.value, world\.state\.sceneChoices\)/,
)
assert.match(stage, /kr-scroll min-h-0 overflow-y-auto/)

console.log(
  'Memory House floor story: 49 authored threshold, return-route, companion and verdict branches, source choices, consent costs and save roundtrips verified',
)

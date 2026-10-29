import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HOUSE_ROOMS,
  newHouseProgress,
  restoreHouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'
import { houseFloorBeat } from '../memoryDungeon/houseFloorStory'
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
  ['HD-06', ['stock']],
  ['HD-10', ['manifest']],
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
const wardenBranches = [
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
assert.match(wardenBeats[2]!.text, /cannot sign for/)
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
  'Memory House floor story: 25 authored threshold and verdict branches, source choices, consent costs and save roundtrips verified',
)

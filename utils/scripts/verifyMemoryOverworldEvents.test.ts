import assert from 'node:assert/strict'
import {
  OVERWORLD_EVENT_CATALOG,
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  validateOverworldEventCatalog,
  worldEvent,
  worldEvents,
} from '../memoryDungeon/overworldEventCatalog'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import { HOSHIMORI_NIGHT_SITES } from '../memoryDungeon/hoshimoriNight'
import { BRIAR_COLLISION_SCENES } from '../memoryDungeon/briarCollision'
import {
  recoverBriarCollisionFromJournal,
  concludeBriarCollisionFromJournal,
} from '../memoryDungeon/briarCollisionProgress'
import {
  replayEarthJournal,
  type EarthJournalAction,
} from '../memoryDungeon/earthJournal'
import {
  newMemoryCampaignProgress,
  commitToMemoryFinale,
  completeMemoryExperience,
  availableMemoryExperiences,
  type MemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateOverworldEventCatalog(), [])
assert.equal(OVERWORLD_EVENT_CATALOG.length, 12 * 64)

for (let n = 1; n <= 12; n++) {
  const id = 'e' + String(n).padStart(2, '0')
  const events = worldEvents(id)
  assert.equal(events.length, 64, id + ' needs 64 meaningful tiles')
  const uniqueIds = new Set(events.map((event) => event.id))
  assert.equal(uniqueIds.size, 64)
  for (const event of events) {
    assert.ok(event.opening.length > 60)
    assert.ok(event.title.length > 3)
    assert.ok(event.choices.length >= 2)
    for (const choice of event.choices) {
      assert.ok(choice.outcome.length > 35)
      assert.notEqual(choice.flag, '')
      assert.ok(choice.art.path.includes(event.key.replace(',', '-')))
      assert.equal(choice.art.status, 'placeholder')
    }
  }
  if (!['e01', 'e02', 'e07'].includes(id)) {
    const kinds = new Set(events.map((event) => event.kind))
    for (const kind of [
      'memory',
      'challenge',
      'treasure',
      'monster',
      'dungeon',
      'merchant',
      'puzzle',
      'companion',
    ] as const)
      assert.ok(kinds.has(kind), id + ' missing ' + kind)
    for (const photo of EARTH_PHOTOS.filter((item) => item.experience === id))
      assert.equal(worldEvent(id, photo.site)?.photographId, photo.id)
    assert.equal(
      events.filter((event) => event.source === 'new-authoring').length,
      id === 'e08' ? 48 : 64,
    )
  }

  let progress = newOverworldEventProgress(id)
  for (let y = 1; y <= 8; y++) {
    for (let x = 1; x <= 8; x++) {
      const key = x + ',' + y
      progress = revealOverworldEvent(progress, key)
      assert.ok(
        progress.revealed.includes(key),
        id + ':' + key + ' unreachable',
      )
      const first = worldEvent(id, key)!.choices[0]!
      const chosen = chooseOverworldEvent(progress, key, first.id)
      assert.notEqual(chosen, progress)
      assert.equal(chosen.choices[key], first.id)
      assert.equal(
        chooseOverworldEvent(chosen, key, first.id),
        chosen,
        'no duplicate payout',
      )
      progress = chosen
    }
  }
  assert.equal(progress.revealed.length, 64)
  assert.equal(Object.keys(progress.choices).length, 64)
  assert.equal(progress.flags.length, 64)
  const restored = restoreOverworldEventProgress({
    ...progress,
    supplies: 999999,
    flags: ['forged'],
    revealed: [...progress.revealed, '99,99'],
    choices: { ...progress.choices, '99,99': 'forged' },
  })
  assert.ok(restored)
  assert.deepEqual(restored.revealed, progress.revealed)
  assert.deepEqual(restored.flags, progress.flags)
  assert.equal(restored.supplies, progress.supplies)
}

const blocked = newOverworldEventProgress('e03')
assert.equal(revealOverworldEvent(blocked, '8,8'), blocked)
assert.equal(chooseOverworldEvent(blocked, '8,8', 'care'), blocked)
assert.deepEqual(eventNeighbors('1,1').sort(), ['1,2', '2,1'])
assert.deepEqual(eventNeighbors('not-a-cell'), [])

const gate = worldEvent('e04', '8,8')!
assert.equal(gate.choices.length, 3)
assert.deepEqual(
  gate.choices.map((choice) => choice.id),
  ['open-the-tide-gate', 'seal-the-tide-gate', 'divert-the-current'],
)
assert.deepEqual(
  gate.choices.map((choice) => choice.flag),
  [
    'e04:char-lost-in-present',
    'e04:char-alive-commuters-stranded',
    'e04:char-alive-district-at-risk',
  ],
)
const departure = worldEvent('e05', '8,8')!
assert.deepEqual(
  departure.choices.map((choice) => choice.id),
  ['run-again', 'stay', 'tell-char'],
)
for (const id of ['e09', 'e10', 'e11', 'e12']) {
  assert.equal(
    worldEvents(id).filter((event) => event.memoryFragment).length,
    2,
  )
}
const office = worldEvent('e09', '2,2')!
const roots = worldEvent('e09', '7,6')!
assert.equal(office.memoryFragment, 'briar-office-key')
assert.equal(roots.memoryFragment, 'briar-tide-roots')
assert.equal(office.title, 'The Briar Office Key')
assert.equal(roots.title, 'The Briar Tide Roots')
assert.deepEqual(
  office.choices.map((choice) => choice.id),
  BRIAR_COLLISION_SCENES['2,2'].choices.map((choice) => choice.id),
)
assert.deepEqual(
  roots.choices.map((choice) => choice.id),
  BRIAR_COLLISION_SCENES['7,6'].choices.map((choice) => choice.id),
)
const earnedCampaign: MemoryCampaignProgress = {
  ...newMemoryCampaignProgress(),
  completed: ['e01', 'e02', 'e03', 'e04', 'e05', 'e06', 'e07', 'e08'],
  rememberedAnchors: [
    'morrow-magic-attempt',
    'scylla-home-wish',
    'char-possible-future',
  ],
  pairDecisions: { e04: 'open-the-tide-gate' },
  finaleCommitted: true,
}
const walkToOffice: EarthJournalAction[] = [
  { type: 'travel', key: '2,1' },
  { type: 'travel', key: '2,2' },
]
const walkToRoots: EarthJournalAction[] = [
  ...['3,2', '4,2', '5,2', '6,2', '7,2', '7,3', '7,4', '7,5', '7,6'].map(
    (key): EarthJournalAction => ({ type: 'travel', key }),
  ),
]
assert.deepEqual(
  recoverBriarCollisionFromJournal(earnedCampaign, [
    ...walkToOffice,
    ...walkToRoots,
  ])?.recoveredFragments,
  [],
  'reaching a fragment site must not award it without a choice',
)
for (const officeChoice of office.choices) {
  for (const rootsChoice of roots.choices) {
    const journal: EarthJournalAction[] = [
      ...walkToOffice,
      { type: 'choose', key: '2,2', choiceId: officeChoice.id },
      ...walkToRoots,
      { type: 'choose', key: '7,6', choiceId: rootsChoice.id },
    ]
    const replayed = replayEarthJournal('e09', journal)
    assert.ok(replayed)
    assert.equal(replayed.position, '7,6')
    assert.equal(replayed.progress.choices['2,2'], officeChoice.id)
    assert.equal(replayed.progress.choices['7,6'], rootsChoice.id)
    assert.deepEqual(replayed.progress.flags, [
      officeChoice.flag,
      rootsChoice.flag,
    ])
    const earned = recoverBriarCollisionFromJournal(earnedCampaign, journal)
    assert.ok(earned)
    assert.deepEqual(earned.recoveredFragments, [
      'briar-office-key',
      'briar-tide-roots',
    ])
    assert.deepEqual(
      recoverBriarCollisionFromJournal(earned, journal)?.recoveredFragments,
      earned.recoveredFragments,
      'replaying a completed decision cannot duplicate fragments',
    )
    assert.equal(
      recoverBriarCollisionFromJournal(earnedCampaign, [
        ...journal,
        { type: 'choose', key: '7,6', choiceId: rootsChoice.id },
      ]),
      null,
      'duplicate choice journals are rejected',
    )
  }
}
assert.equal(
  recoverBriarCollisionFromJournal(earnedCampaign, [
    { type: 'travel', key: '7,6' },
    { type: 'choose', key: '7,6', choiceId: roots.choices[0]!.id },
  ]),
  null,
  'teleporting to a fragment cannot be replayed',
)
assert.equal(
  recoverBriarCollisionFromJournal(earnedCampaign, [
    ...walkToOffice,
    { type: 'choose', key: '2,2', choiceId: 'forged-fragment' },
  ]),
  null,
  'forged choices cannot mint a fragment',
)
assert.equal(
  recoverBriarCollisionFromJournal({ ...earnedCampaign, pairDecisions: {} }, [
    ...walkToOffice,
    { type: 'choose', key: '2,2', choiceId: office.choices[0]!.id },
  ]),
  null,
  'the e04 catastrophe cannot be silently invented',
)
assert.equal(
  recoverBriarCollisionFromJournal(
    { ...earnedCampaign, completed: earnedCampaign.completed.slice(0, -1) },
    [
      ...walkToOffice,
      { type: 'choose', key: '2,2', choiceId: office.choices[0]!.id },
    ],
  ),
  null,
  'the e08 passage cannot be skipped',
)

const preCommitCampaign = { ...earnedCampaign, finaleCommitted: false }
assert.deepEqual(availableMemoryExperiences(preCommitCampaign), ['e09'])
assert.equal(
  recoverBriarCollisionFromJournal(preCommitCampaign, []),
  null,
  'uncommitted travel cannot earn finale fragments',
)
const committedCampaign = commitToMemoryFinale(preCommitCampaign)
assert.equal(committedCampaign.finaleCommitted, true)
assert.throws(
  () => completeMemoryExperience(committedCampaign, 'e09'),
  /Recover both misplaced/,
)
const completeBriarJournal: EarthJournalAction[] = []
let resolvedBriarSites = 0
for (let y = 1; y <= 8; y++) {
  const row = Array.from({ length: 8 }, (_, index) =>
    y % 2 === 1 ? index + 1 : 8 - index,
  )
  for (const x of row) {
    const key = x + ',' + y
    if (key !== '1,1')
      completeBriarJournal.push({ type: 'travel', key })
    if (
      resolvedBriarSites < 12 ||
      key === '2,2' ||
      key === '7,6'
    ) {
      completeBriarJournal.push({
        type: 'choose',
        key,
        choiceId: worldEvent('e09', key)!.choices[0]!.id,
      })
      resolvedBriarSites++
    }
  }
}
const completeBriarReplay = replayEarthJournal('e09', completeBriarJournal)
assert.ok(completeBriarReplay)
assert.equal(completeBriarReplay.progress.revealed.length, 64)
assert.ok(Object.keys(completeBriarReplay.progress.choices).length >= 12)
const recoveredBriar = recoverBriarCollisionFromJournal(
  committedCampaign,
  completeBriarJournal,
)
assert.ok(recoveredBriar)
assert.deepEqual(recoveredBriar.recoveredFragments, [
  'briar-office-key',
  'briar-tide-roots',
])
let shortChoiceCount = 0
const tooShortBriarJournal = completeBriarJournal.filter(
  (action) =>
    action.type !== 'choose' ||
    action.key === '2,2' ||
    action.key === '7,6' ||
    shortChoiceCount++ < 9,
)
assert.equal(
  replayEarthJournal('e09', tooShortBriarJournal)?.progress &&
    Object.keys(
      replayEarthJournal('e09', tooShortBriarJournal)!.progress.choices,
    ).length,
  11,
)
assert.equal(
  concludeBriarCollisionFromJournal(
    committedCampaign,
    tooShortBriarJournal,
  ),
  null,
  'two fragments without twelve meaningful decisions cannot end the map',
)
assert.equal(
  concludeBriarCollisionFromJournal(preCommitCampaign, completeBriarJournal),
  null,
  'the explicit finale commitment cannot be bypassed',
)
const concludedBriar = concludeBriarCollisionFromJournal(
  committedCampaign,
  completeBriarJournal,
)!
assert.ok(concludedBriar)
assert.ok(concludedBriar.completed.includes('e09'))
assert.deepEqual(availableMemoryExperiences(concludedBriar), ['e10'])
assert.deepEqual(
  replayEarthJournal('e09', JSON.parse(JSON.stringify(completeBriarJournal))),
  completeBriarReplay,
  'saved Pip decisions and position must survive reload',
)
assert.equal(
  replayEarthJournal('e09', [
    ...completeBriarJournal,
    { type: 'travel', key: '1,1' },
  ]),
  null,
  'teleporting after a valid journey must invalidate the entire journal',
)

for (const pilot of HOSHIMORI_NIGHT_SITES) {
  const adopted = worldEvent('e08', pilot.key)!
  assert.equal(adopted.title, pilot.title)
  assert.equal(adopted.opening, pilot.opening)
  assert.equal(adopted.source, 'existing-playable')
}
for (const site of worldEvents('e08')) {
  assert.ok(site.originalSite, site.key + ' lost original village landmark')
}

console.log(
  'Memory overworld reveal catalog: 768 cells, 12 graphs, fixed photos and no duplicate rewards passed',
)

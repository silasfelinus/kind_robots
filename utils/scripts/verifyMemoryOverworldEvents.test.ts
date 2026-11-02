import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
import { briarCollisionWitnessCallback } from '../memoryDungeon/briarCollisionWitness'
import { restoreMemoryCampaignProgress } from '../memoryDungeon/campaignPersistence'
import { BRIAR_COLLISION_ROUTE_SITES } from '../memoryDungeon/briarCollisionRoute'
import { EARTH_COLLISION_ROUTE_SITES } from '../memoryDungeon/earthCollisionRoute'
import earthCollision from '../memoryDungeon/earthCollision.json'
import {
  earthCollisionHistory,
  recoverEarthCollisionFromJournal,
} from '../memoryDungeon/earthCollisionProgress'
import {
  EARTH_CROSSROAD_CHOICES,
  EARTH_CROSSROAD_SCENE,
  earthCollisionCrossroadStory,
  concludeEarthCollisionFromJournal,
} from '../memoryDungeon/earthCollisionCrossroad'
import {
  advanceHoshimoriWarm,
  newHoshimoriWarmProgress,
  restoreHoshimoriWarm,
} from '../memoryDungeon/hoshimoriWarm'
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
const routeSites = Object.entries(BRIAR_COLLISION_ROUTE_SITES)
assert.equal(routeSites.length, 16)
assert.equal(
  worldEvents('e09').filter((event) => event.memoryFragment).length,
  2,
  'authored connective sites must not mint extra finale fragments',
)
for (const [key, scene] of routeSites) {
  assert.ok(
    !EARTH_PHOTOS.some(
      (photo) => photo.experience === 'e09' && photo.site === key,
    ),
    key + ' must not overwrite a chronological Earth photograph',
  )
  const event = worldEvent('e09', key)!
  assert.equal(event.title, scene.title)
  assert.equal(event.opening, scene.opening)
  assert.equal(event.speaker, scene.speaker)
  assert.equal(event.kind, scene.kind)
  assert.equal(event.sceneArt.status, 'placeholder')
  assert.equal(event.choices.length, 2)
  assert.equal(event.memoryFragment, undefined)
  assert.deepEqual(
    event.choices.map((choice) => choice.id),
    scene.choices.map((choice) => choice.id),
  )
  assert.equal(
    new Set(event.choices.map((choice) => choice.flag)).size,
    2,
    key + ' must preserve two distinct consequences',
  )
  for (const choice of event.choices) {
    assert.ok(choice.outcome.length > 90, key + ' needs an authored outcome')
    assert.ok(
      choice.art.prompt.includes(scene.title) ||
        choice.art.prompt.includes(choice.label),
    )
    const [x, y] = key.split(',').map(Number) as [number, number]
    const steps: EarthJournalAction[] = []
    for (let step = 2; step <= x; step++)
      steps.push({ type: 'travel', key: step + ',1' })
    for (let step = 2; step <= y; step++)
      steps.push({ type: 'travel', key: x + ',' + step })
    const journal: EarthJournalAction[] = [
      ...steps,
      { type: 'choose', key, choiceId: choice.id },
    ]
    const replayed = replayEarthJournal('e09', journal)
    assert.ok(replayed, key + ' must be reachable by legal travel')
    assert.equal(replayed.position, key)
    assert.equal(replayed.progress.choices[key], choice.id)
    assert.ok(replayed.progress.flags.includes(choice.flag))
    assert.equal(
      replayEarthJournal('e09', [
        ...journal,
        { type: 'choose', key, choiceId: choice.id },
      ]),
      null,
      'a replayed site must not pay out twice',
    )
  }
}

const newCrossroads = [
  '4,1',
  '5,1',
  '6,1',
  '7,1',
  '8,1',
  '4,3',
  '5,3',
  '6,3',
] as const
const newCrossroadFlags = new Set<string>()
const newCrossroadOutcomes = new Set<string>()
for (const key of newCrossroads) {
  const scene = BRIAR_COLLISION_ROUTE_SITES[key]
  const event = worldEvent('e09', key)!
  assert.equal(event.title, scene.title)
  assert.equal(event.memoryFragment, undefined)
  assert.equal(event.choices.length, 2)
  assert.ok(scene.opening.length > 180, key + ' needs a developed opening')
  assert.ok(scene.artSubject.length > 70, key + ' needs a visual brief')
  for (const choice of event.choices) {
    assert.ok(
      choice.outcome.length > 130,
      key + ' needs a consequential ending',
    )
    assert.ok(Object.values(choice.effects).some((effect) => effect !== 0))
    assert.ok(!newCrossroadFlags.has(choice.flag), 'flags must be unique')
    assert.ok(
      !newCrossroadOutcomes.has(choice.outcome),
      'outcomes must be unique',
    )
    newCrossroadFlags.add(choice.flag)
    newCrossroadOutcomes.add(choice.outcome)
    const [x, y] = key.split(',').map(Number) as [number, number]
    const journal: EarthJournalAction[] = []
    for (let step = 2; step <= x; step++)
      journal.push({ type: 'travel', key: step + ',1' })
    for (let step = 2; step <= y; step++)
      journal.push({ type: 'travel', key: x + ',' + step })
    journal.push({ type: 'choose', key, choiceId: choice.id })
    const replayed = replayEarthJournal('e09', journal)
    assert.ok(replayed, key + ' must have a legal route')
    assert.equal(replayed.progress.choices[key], choice.id)
    assert.ok(replayed.progress.flags.includes(choice.flag))
    assert.equal(
      replayEarthJournal('e09', [
        ...journal,
        { type: 'choose', key, choiceId: choice.id },
      ]),
      null,
      key + ' cannot pay twice',
    )
    assert.equal(
      replayEarthJournal('e09', [
        ...journal.slice(0, -1),
        { type: 'choose', key, choiceId: 'invented-crossroad' },
      ]),
      null,
      key + ' cannot accept a forged choice',
    )
    const restored = restoreOverworldEventProgress({
      ...replayed.progress,
      supplies: 99999,
      flags: ['forged-crossroad'],
    })
    assert.ok(restored)
    assert.deepEqual(restored.choices, replayed.progress.choices)
    assert.deepEqual(restored.flags, replayed.progress.flags)
    assert.equal(restored.supplies, replayed.progress.supplies)
    assert.equal(restored.trust, replayed.progress.trust)
    assert.equal(restored.evidence, replayed.progress.evidence)
    assert.equal(restored.danger, replayed.progress.danger)
  }
}
assert.equal(newCrossroadFlags.size, 16)
assert.equal(newCrossroadOutcomes.size, 16)
assert.equal(
  worldEvents('e09').filter((event) => event.memoryFragment).length,
  2,
  'new crossroads must not mint extra memory fragments',
)

const witnessCallbacks = new Set<string>()
for (const verdict of ['trust-witnesses', 'protect-village'] as const) {
  const restoredCampaign = restoreMemoryCampaignProgress(
    JSON.parse(
      JSON.stringify({
        campaignVersion: 2,
        completed: ['e01', 'e02'],
        pairDecisions: { e02: verdict },
      }),
    ),
  )
  assert.equal(restoredCampaign.pairDecisions?.e02, verdict)
  const originalCampaign = JSON.stringify(restoredCampaign)
  for (const [key, scene] of Object.entries(BRIAR_COLLISION_SCENES)) {
    const event = worldEvent('e09', key)!
    const originalEvent = JSON.stringify(event)
    const prelude = briarCollisionWitnessCallback(restoredCampaign, key)
    assert.ok(prelude.opening.length > 110, verdict + ':' + key)
    assert.equal(prelude.outcome, '')
    for (const choice of scene.choices) {
      const callback = briarCollisionWitnessCallback(
        restoredCampaign,
        key,
        choice.id,
      )
      assert.equal(callback.opening, prelude.opening)
      assert.ok(callback.outcome.length > 110, verdict + ':' + choice.id)
      assert.ok(!witnessCallbacks.has(callback.outcome))
      witnessCallbacks.add(callback.outcome)
      assert.equal(
        briarCollisionWitnessCallback(restoredCampaign, key, 'forged').outcome,
        '',
      )
    }
    assert.equal(JSON.stringify(event), originalEvent)
  }
  assert.equal(JSON.stringify(restoredCampaign), originalCampaign)
}
assert.equal(witnessCallbacks.size, 12)
const unearnedWitness = {
  ...newMemoryCampaignProgress(),
  pairDecisions: { e02: 'trust-witnesses' },
}
assert.deepEqual(
  briarCollisionWitnessCallback(unearnedWitness, '2,2'),
  { opening: '', outcome: '' },
  'an uncompleted Briar chapter cannot supply a witness',
)
const unresolvedWitness = restoreMemoryCampaignProgress({
  campaignVersion: 2,
  completed: ['e01', 'e02'],
  pairDecisions: { e02: 'forged' },
})
assert.deepEqual(
  briarCollisionWitnessCallback(unresolvedWitness, '7,6'),
  { opening: '', outcome: '' },
  'invalid or legacy unresolved decisions cannot invent public testimony',
)
assert.deepEqual(
  briarCollisionWitnessCallback(
    restoreMemoryCampaignProgress({
      campaignVersion: 2,
      completed: ['e01', 'e02'],
      pairDecisions: { e02: 'protect-village' },
    }),
    '1,1',
  ),
  { opening: '', outcome: '' },
  'the callback must not leak into unrelated map locations',
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
    if (key !== '1,1') completeBriarJournal.push({ type: 'travel', key })
    if (resolvedBriarSites < 12 || key === '2,2' || key === '7,6') {
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
  concludeBriarCollisionFromJournal(committedCampaign, tooShortBriarJournal),
  null,
  'two fragments without twelve meaningful decisions cannot end the map',
)
assert.equal(
  concludeBriarCollisionFromJournal(preCommitCampaign, completeBriarJournal),
  null,
  'the explicit finale commitment cannot be bypassed',
)
const forgedReceiptCampaign = {
  ...committedCampaign,
  recoveredFragments: ['briar-office-key', 'briar-tide-roots'] as const,
}
const noFragmentChoices = completeBriarJournal.filter(
  (action) =>
    action.type !== 'choose' || (action.key !== '2,2' && action.key !== '7,6'),
)
assert.equal(
  concludeBriarCollisionFromJournal(forgedReceiptCampaign, noFragmentChoices),
  null,
  'serialized fragment receipts cannot replace both actual scene decisions',
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

const earthScenes = earthCollision
assert.equal(earthScenes.length, 2)
assert.deepEqual(
  earthScenes.map((scene) => scene.key),
  ['2,2', '7,6'],
)
assert.deepEqual(
  earthScenes.map((scene) => worldEvent('e10', scene.key)!.memoryFragment),
  ['city-lantern-charter', 'city-forest-hours'],
)
assert.deepEqual(
  EARTH_PHOTOS.filter((photo) => photo.experience === 'e10').map(
    (photo) => photo.site,
  ),
  ['1,5', '5,7'],
)
for (const scene of earthScenes) {
  const event = worldEvent('e10', scene.key)!
  assert.equal(event.title, scene.title)
  assert.equal(event.opening, scene.opening)
  assert.equal(event.choices.length, 3)
  assert.equal(event.sceneArt.status, 'placeholder')
  assert.ok(scene.puzzle.length > 200, 'The evidence puzzle needs fair clues')
  assert.equal(new Set(scene.choices.map((choice) => choice.flag)).size, 3)
  for (const choice of scene.choices) {
    const resolved = event.choices.find((item) => item.id === choice.id)!
    assert.ok(resolved)
    assert.ok(resolved.outcome.length > 250)
    assert.ok(resolved.outcome.includes('If the first plan fails:'))
    assert.ok(resolved.art.prompt.includes(choice.artSubject))
    assert.deepEqual(resolved.effects, choice.effects)
  }
}
const e10RouteSites = Object.entries(EARTH_COLLISION_ROUTE_SITES)
assert.equal(e10RouteSites.length, 8)
assert.equal(
  worldEvents('e10').filter((event) => event.memoryFragment).length,
  2,
  'new connective encounters must not create additional memory fragments',
)
const e10RouteFlags = new Set<string>()
const e10RouteOutcomes = new Set<string>()
let e10RouteCases = 0
for (const [key, scene] of e10RouteSites) {
  assert.ok(
    !earthScenes.some((fragment) => fragment.key === key) &&
      !EARTH_PHOTOS.some(
        (photo) => photo.experience === 'e10' && photo.site === key,
      ) &&
      key !== '8,8',
    key + ' must not overwrite a fragment, photo, or final verdict',
  )
  const event = worldEvent('e10', key)!
  assert.equal(event.title, scene.title)
  assert.equal(event.opening, scene.opening)
  assert.equal(event.speaker, scene.speaker)
  assert.equal(event.kind, scene.kind)
  assert.equal(event.memoryFragment, undefined)
  assert.equal(event.choices.length, 2)
  assert.ok(scene.opening.length > 200, key + ' needs a developed opening')
  assert.ok(scene.artSubject.length > 70, key + ' needs visual direction')
  assert.equal(event.sceneArt.status, 'placeholder')
  assert.ok(event.sceneArt.prompt.includes(scene.artSubject))
  for (const choice of event.choices) {
    assert.ok(choice.outcome.length > 180, key + ' needs a real aftermath')
    assert.ok(
      Object.values(choice.effects).some((effect) => effect !== 0),
      key + ' must have an actual resource consequence',
    )
    assert.ok(!e10RouteFlags.has(choice.flag), 'flags must be unique')
    assert.ok(!e10RouteOutcomes.has(choice.outcome), 'outcomes must be unique')
    e10RouteFlags.add(choice.flag)
    e10RouteOutcomes.add(choice.outcome)
    assert.ok(choice.art.prompt.includes(choice.label))
    assert.equal(choice.art.status, 'placeholder')
    const [x, y] = key.split(',').map(Number) as [number, number]
    const journal: EarthJournalAction[] = []
    for (let step = 2; step <= x; step++)
      journal.push({ type: 'travel', key: step + ',1' })
    for (let step = 2; step <= y; step++)
      journal.push({ type: 'travel', key: x + ',' + step })
    journal.push({ type: 'choose', key, choiceId: choice.id })
    const replayed = replayEarthJournal('e10', journal)
    assert.ok(replayed, key + ' must be reachable by adjacent travel')
    assert.equal(replayed.position, key)
    assert.equal(replayed.progress.choices[key], choice.id)
    assert.ok(replayed.progress.flags.includes(choice.flag))
    assert.equal(replayed.progress.supplies, choice.effects.supplies ?? 0)
    assert.equal(replayed.progress.trust, choice.effects.trust ?? 0)
    assert.equal(replayed.progress.evidence, choice.effects.evidence ?? 0)
    assert.equal(
      replayed.progress.danger,
      Math.max(0, choice.effects.danger ?? 0),
    )
    assert.deepEqual(
      replayEarthJournal('e10', JSON.parse(JSON.stringify(journal))),
      replayed,
      'authored consequences must survive a save/restore roundtrip',
    )
    assert.equal(
      replayEarthJournal('e10', [
        ...journal,
        { type: 'choose', key, choiceId: choice.id },
      ]),
      null,
      'replayed decisions cannot pay twice',
    )
    assert.equal(
      replayEarthJournal('e10', [
        ...journal.slice(0, -1),
        { type: 'choose', key, choiceId: 'forged' },
      ]),
      null,
      'invented choice IDs cannot be restored',
    )
    e10RouteCases++
  }
}
assert.equal(e10RouteCases, 16)
assert.equal(e10RouteFlags.size, 16)
assert.equal(e10RouteOutcomes.size, 16)

const e10OfficeWalk: EarthJournalAction[] = [
  { type: 'travel', key: '2,1' },
  { type: 'travel', key: '2,2' },
]
const e10StationWalk: EarthJournalAction[] = [
  ...['3,2', '4,2', '5,2', '6,2', '7,2', '7,3', '7,4', '7,5', '7,6'].map(
    (key): EarthJournalAction => ({ type: 'travel', key }),
  ),
]
function warmCharter(choice: 'consent' | 'open') {
  let warm = newHoshimoriWarmProgress(17)
  for (let x = 2; x <= 8; x++)
    warm = advanceHoshimoriWarm(warm, { type: 'move', to: x + ',1' })
  for (let y = 2; y <= 8; y++)
    warm = advanceHoshimoriWarm(warm, { type: 'move', to: '8,' + y })
  warm = advanceHoshimoriWarm(warm, { type: 'choose', id: choice })
  assert.equal(warm.choices['8,8'], choice)
  assert.deepEqual(restoreHoshimoriWarm(JSON.parse(JSON.stringify(warm))), warm)
  return warm
}
let e10BranchCases = 0
for (const tideGate of [
  'open-the-tide-gate',
  'seal-the-tide-gate',
  'divert-the-current',
] as const) {
  for (const charter of ['consent', 'open'] as const) {
    const warm = warmCharter(charter)
    for (const officeChoice of office.choices) {
      const briarJournal = completeBriarJournal.map((action) =>
        action.type === 'choose' && action.key === '2,2'
          ? { ...action, choiceId: officeChoice.id }
          : action,
      )
      const campaign = {
        ...concludedBriar,
        pairDecisions: { ...concludedBriar.pairDecisions, e04: tideGate },
      }
      assert.deepEqual(earthCollisionHistory(campaign, warm, briarJournal), {
        tideGate,
        charter,
        office: officeChoice.id,
      })
      for (const first of earthScenes[0]!.choices) {
        for (const second of earthScenes[1]!.choices) {
          const journal: EarthJournalAction[] = [
            ...e10OfficeWalk,
            { type: 'choose', key: '2,2', choiceId: first.id },
            ...e10StationWalk,
            { type: 'choose', key: '7,6', choiceId: second.id },
          ]
          const replay = replayEarthJournal('e10', journal)
          assert.ok(replay)
          assert.equal(replay.position, '7,6')
          assert.equal(replay.progress.flags.length, 2)
          assert.equal(
            replayEarthJournal('e10', [
              ...journal,
              { type: 'choose', key: '7,6', choiceId: second.id },
            ]),
            null,
          )
          const recovered = recoverEarthCollisionFromJournal(
            campaign,
            journal,
            warm,
            briarJournal,
          )
          assert.ok(recovered)
          assert.deepEqual(recovered.recoveredFragments?.slice(-2), [
            'city-lantern-charter',
            'city-forest-hours',
          ])
          assert.deepEqual(
            recoverEarthCollisionFromJournal(
              recovered,
              journal,
              warm,
              briarJournal,
            ),
            recovered,
            'Replayed fragments cannot be awarded twice',
          )
          e10BranchCases++
        }
      }
      assert.deepEqual(
        recoverEarthCollisionFromJournal(
          campaign,
          [...e10OfficeWalk, ...e10StationWalk],
          warm,
          briarJournal,
        )?.recoveredFragments,
        campaign.recoveredFragments,
        'Visiting fragment sites without choosing earns nothing',
      )
      const shortBriar = briarJournal.filter(
        (action) =>
          action.type !== 'choose' || ['2,2', '7,6'].includes(action.key),
      )
      assert.equal(earthCollisionHistory(campaign, warm, shortBriar), null)
      const forgedWarm = { ...warm, flags: ['invented-charter'] }
      assert.equal(
        earthCollisionHistory(campaign, forgedWarm, briarJournal),
        null,
      )
      const forgedBriar = [
        ...briarJournal,
        { type: 'choose', key: '7,6', choiceId: 'invented' },
      ]
      assert.equal(earthCollisionHistory(campaign, warm, forgedBriar), null)
    }
  }
}
assert.equal(e10BranchCases, 162)
assert.equal(
  recoverEarthCollisionFromJournal(
    concludedBriar,
    [
      { type: 'travel', key: '7,6' },
      { type: 'choose', key: '7,6', choiceId: earthScenes[1]!.choices[0]!.id },
    ],
    warmCharter('consent'),
    completeBriarJournal,
  ),
  null,
  'Teleporting cannot mint Morrow fragments',
)
assert.equal(
  earthCollisionHistory(
    {
      ...concludedBriar,
      completed: concludedBriar.completed.filter((id) => id !== 'e09'),
    },
    warmCharter('consent'),
    completeBriarJournal,
  ),
  null,
  'The earned Pip finale gate cannot be skipped',
)

const completeEarthJournal: EarthJournalAction[] = []
let authoredEarthChoices = 0
for (let y = 1; y <= 8; y++) {
  const row = Array.from({ length: 8 }, (_, index) =>
    y % 2 === 1 ? index + 1 : 8 - index,
  )
  for (const x of row) {
    const key = x + ',' + y
    if (key !== '1,1') completeEarthJournal.push({ type: 'travel', key })
    if (authoredEarthChoices < 12 || key === '2,2' || key === '7,6') {
      completeEarthJournal.push({
        type: 'choose',
        key,
        choiceId: worldEvent('e10', key)!.choices[0]!.id,
      })
      authoredEarthChoices++
    }
  }
}
for (let x = 2; x <= 8; x++)
  completeEarthJournal.push({ type: 'travel', key: x + ',8' })
const completeEarthReplay = replayEarthJournal('e10', completeEarthJournal)
assert.ok(completeEarthReplay)
assert.equal(completeEarthReplay.position, '8,8')
assert.ok(Object.keys(completeEarthReplay.progress.choices).length >= 12)
assert.equal(EARTH_CROSSROAD_CHOICES.length, 2)
assert.ok(EARTH_CROSSROAD_SCENE.art.prompt.length > 100)
assert.ok(
  EARTH_CROSSROAD_CHOICES.every((choice) => choice.art.prompt.length > 100),
)
let e10VerdictCases = 0
const e10Openings = new Set<string>()
for (const tideGate of [
  'open-the-tide-gate',
  'seal-the-tide-gate',
  'divert-the-current',
] as const) {
  for (const charter of ['consent', 'open'] as const) {
    const warm = warmCharter(charter)
    for (const officeChoice of office.choices) {
      const briarJournal = completeBriarJournal.map((action) =>
        action.type === 'choose' && action.key === '2,2'
          ? { ...action, choiceId: officeChoice.id }
          : action,
      )
      const campaign = {
        ...concludedBriar,
        pairDecisions: { ...concludedBriar.pairDecisions, e04: tideGate },
      }
      const history = earthCollisionHistory(campaign, warm, briarJournal)
      assert.ok(history)
      const story = earthCollisionCrossroadStory(history)
      assert.ok(story.opening.length > 500)
      assert.equal(story.outcome, '')
      assert.ok(!e10Openings.has(story.opening))
      e10Openings.add(story.opening)
      for (const verdict of EARTH_CROSSROAD_CHOICES) {
        const result = concludeEarthCollisionFromJournal(
          campaign,
          completeEarthJournal,
          warm,
          briarJournal,
          verdict.id,
        )
        assert.ok(result)
        assert.equal(result.pairDecisions?.e10, verdict.id)
        assert.ok(result.completed.includes('e10'))
        assert.deepEqual(availableMemoryExperiences(result), ['e11'])
        assert.deepEqual(result.recoveredFragments?.slice(-2), [
          'city-lantern-charter',
          'city-forest-hours',
        ])
        const consequence = earthCollisionCrossroadStory(history, verdict.id)
        assert.ok(consequence.outcome.length > 450)
        assert.equal(
          concludeEarthCollisionFromJournal(
            result,
            completeEarthJournal,
            warm,
            briarJournal,
            verdict.id,
          ),
          null,
          'a completed verdict cannot be awarded twice',
        )
        assert.deepEqual(
          earthCollisionHistory(result, warm, briarJournal),
          history,
          'completed city must retain the real witness history for its epilogue',
        )
        e10VerdictCases++
      }
    }
  }
}
assert.equal(e10VerdictCases, 36)
assert.equal(e10Openings.size, 18)
const routeEchoHistory = {
  tideGate: 'open-the-tide-gate',
  charter: 'consent',
  office: 'translate-shift-oath',
} as const
const routeEchoChoices = [
  ['1,1', 'witness-the-guard'],
  ['1,1', 'hold-the-landing'],
  ['3,1', 'publish-the-forgery'],
  ['3,1', 'escort-the-moth'],
  ['6,5', 'witness-chosen-households'],
  ['6,5', 'lease-the-common-stair'],
  ['8,7', 'keep-uncertain-names'],
  ['8,7', 'rescue-before-records'],
] as const
const echoOpenings = new Set<string>()
const echoOutcomes = new Set<string>()
for (const verdict of EARTH_CROSSROAD_CHOICES) {
  const baseline = earthCollisionCrossroadStory(routeEchoHistory, verdict.id)
  for (const [key, choiceId] of routeEchoChoices) {
    const [x, y] = key.split(',').map(Number) as [number, number]
    const journal: EarthJournalAction[] = []
    for (let step = 2; step <= x; step++)
      journal.push({ type: 'travel', key: step + ',1' })
    for (let step = 2; step <= y; step++)
      journal.push({ type: 'travel', key: x + ',' + step })
    journal.push({ type: 'choose', key, choiceId })
    assert.ok(replayEarthJournal('e10', journal))
    const echoed = earthCollisionCrossroadStory(
      routeEchoHistory,
      verdict.id,
      journal,
    )
    assert.ok(echoed.opening.length > baseline.opening.length)
    assert.ok(echoed.outcome.length > baseline.outcome.length)
    assert.deepEqual(
      earthCollisionCrossroadStory(
        routeEchoHistory,
        verdict.id,
        JSON.parse(JSON.stringify(journal)),
      ),
      echoed,
      'earned route callbacks must survive save/restore',
    )
    assert.deepEqual(
      earthCollisionCrossroadStory(
        routeEchoHistory,
        verdict.id,
        journal.slice(0, -1),
      ),
      baseline,
      'walking past a site cannot award its narrative consequence',
    )
    assert.deepEqual(
      earthCollisionCrossroadStory(routeEchoHistory, verdict.id, [
        ...journal.slice(0, -1),
        { type: 'choose', key, choiceId: 'forged-choice' },
      ]),
      baseline,
      'a forged choice cannot manufacture a finale callback',
    )
    echoOpenings.add(echoed.opening)
    echoOutcomes.add(echoed.outcome)
  }
  assert.deepEqual(
    earthCollisionCrossroadStory(routeEchoHistory, verdict.id, {
      flags: ['canal-honest-manifest'],
    }),
    baseline,
    'serialized flags are not replay evidence',
  )
}
assert.equal(echoOpenings.size, 16)
assert.equal(echoOutcomes.size, 16)
const validEarthHistory = warmCharter('consent')
assert.deepEqual(earthCollisionCrossroadStory(null), {
  opening: '',
  outcome: '',
})
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    completeEarthJournal,
    validEarthHistory,
    completeBriarJournal,
    'invented-verdict',
  ),
  null,
)
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    completeEarthJournal.slice(0, -1),
    validEarthHistory,
    completeBriarJournal,
    EARTH_CROSSROAD_CHOICES[0]!.id,
  ),
  null,
  'the crossroad must be reached on foot',
)
let optionalEarthChoices = 0
const tooShortEarthJournal = completeEarthJournal.filter(
  (action) =>
    action.type !== 'choose' ||
    ['2,2', '7,6'].includes(action.key) ||
    optionalEarthChoices++ < 9,
)
assert.ok(
  Object.keys(replayEarthJournal('e10', tooShortEarthJournal)!.progress.choices)
    .length < 12,
)
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    tooShortEarthJournal,
    validEarthHistory,
    completeBriarJournal,
    EARTH_CROSSROAD_CHOICES[0]!.id,
  ),
  null,
  'both fragments cannot substitute for twelve decisions',
)
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    completeEarthJournal.filter(
      (action) =>
        action.type !== 'choose' ||
        (action.key !== '2,2' && action.key !== '7,6'),
    ),
    validEarthHistory,
    completeBriarJournal,
    EARTH_CROSSROAD_CHOICES[0]!.id,
  ),
  null,
  'serialized fragment receipts cannot replace witnessed choices',
)
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    [
      { type: 'travel', key: '8,8' },
      { type: 'choose', key: '8,8', choiceId: 'forged' },
    ],
    validEarthHistory,
    completeBriarJournal,
    EARTH_CROSSROAD_CHOICES[0]!.id,
  ),
  null,
  'teleporting cannot reach the final crisis',
)
assert.equal(
  concludeEarthCollisionFromJournal(
    concludedBriar,
    completeEarthJournal,
    { ...validEarthHistory, flags: ['forged'] },
    completeBriarJournal,
    EARTH_CROSSROAD_CHOICES[0]!.id,
  ),
  null,
  'invented Hoshimori testimony cannot unlock the final crisis',
)

const e10Console = readFileSync(
  new URL(
    '../../components/pages/memory-dungeon-earth-collision.vue',
    import.meta.url,
  ),
  'utf8',
)
const e10Store = readFileSync(
  new URL('../../stores/memoryEarthCollisionStore.ts', import.meta.url),
  'utf8',
)
const memoryPage = readFileSync(
  new URL('../../components/pages/memory-dungeon.vue', import.meta.url),
  'utf8',
)
const overworldPage = readFileSync(
  new URL(
    '../../components/pages/memory-dungeon-overworld.vue',
    import.meta.url,
  ),
  'utf8',
)
const campaignStore = readFileSync(
  new URL('../../stores/memoryWorldStore.ts', import.meta.url),
  'utf8',
)
assert.ok(e10Console.includes('data-testid="memory-earth-collision-console"'))
assert.ok(e10Console.includes('collision.tiles'))
assert.ok(e10Console.includes('collision.choose(choice.id)'))
assert.ok(e10Console.includes('collision.history.charter'))
assert.ok(e10Store.includes("replayEarthJournal('e10', journal.value)"))
assert.ok(e10Store.includes("compactEarthJournal('e10', journal.value)"))
assert.ok(
  e10Store.includes(
    'earthCollisionHistory(world.campaign, hoshimori.progress, briar.journal)',
  ),
)
assert.ok(e10Store.includes('world.syncEarthCollisionJournal('))
assert.ok(campaignStore.includes('recoverEarthCollisionFromJournal('))
assert.ok(memoryPage.includes('v-else-if="earthCollisionMode"'))
assert.ok(overworldPage.includes('data-testid="memory-enter-earth-collision"'))
assert.ok(overworldPage.includes("world.campaign.completed.includes('e09')"))
assert.match(
  e10Store,
  /earthCollisionCrossroadStory\(\s*history\.value,\s*world\.campaign\.pairDecisions\?\.e10,\s*journal\.value/,
)
assert.ok(e10Store.includes('world.finishEarthCollision('))
assert.ok(e10Store.includes("position.value === '8,8'"))
assert.ok(e10Console.includes('data-testid="memory-earth-crossroad-choices"'))
assert.ok(e10Console.includes('collision.conclude(choice.id)'))
assert.ok(campaignStore.includes('concludeEarthCollisionFromJournal('))

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

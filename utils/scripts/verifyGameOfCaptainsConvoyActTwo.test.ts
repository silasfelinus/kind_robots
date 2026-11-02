import assert from 'node:assert/strict'
import {
  consequenceForRun,
  resolveConsequence,
  validConsequenceHistory,
  type ConsequenceRecord,
} from '../gameOfCaptains/consequenceStories'
import { CONVOY_AND_ACT_TWO_CASES } from '../gameOfCaptains/consequenceStoriesConvoyAndActTwo'
import { COUCH_CONSEQUENCE_ART_IDS } from '../gameOfCaptains/consequencePaintings'
import {
  nextDestination,
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { controls, playVoyage } from './spaceCouchTraceHarness'

const ids = ['refugees', 'concord-intake', 'sesh-backups'] as const
const expectedChapters = [1, 4, 4] as const
const policies = ['aid', 'observe', 'intervene'] as const
const narrativeLines = new Set<string>()
const earned: ConsequenceRecord[] = []
assert.deepEqual(Object.keys(CONVOY_AND_ACT_TWO_CASES).sort(), [...ids].sort())

for (const [idx, missionId] of ids.entries()) {
  const chapter = expectedChapters[idx]!
  assert.ok(VOYAGE_BOARDS[chapter - 1]!.includes(missionId))
  const raw: VoyageRun = {
    ...startVoyage('vale', ['pell', 'rue', 'vela'], 901 + idx),
    chapter,
    phase: 'decision',
    missionId,
  }
  const episode = consequenceForRun(raw)
  assert.ok(episode)
  assert.equal(episode.id, CONVOY_AND_ACT_TWO_CASES[missionId].id)
  assert.equal(episode.choices.length, 3)
  assert.deepEqual(
    episode.choices.map((choice) => choice.policy).sort(),
    [...policies].sort(),
  )
  assert.deepEqual(
    controls(raw).map((action) => action.label),
    episode.choices.map((choice) => 'consequence:' + choice.id),
  )
  assert.ok(episode.opening.length > 300 && episode.conflict.length > 100)
  assert.equal(resolveConsequence(raw, 'invalid-choice'), raw)
  for (const choice of episode.choices) {
    assert.ok(choice.label.length > 30 && choice.cost.length > 55)
    assert.ok(choice.approach.length > 45)
    assert.ok(choice.check.difficulty >= 5 && choice.check.difficulty <= 10)
    for (const variant of ['success', 'failure'] as const) {
      const outcome = choice[variant]
      assert.ok(outcome.narrative.length > 240)
      assert.ok(outcome.callback.length > 90)
      assert.ok(outcome.flags.length >= 2)
      assert.ok(Object.keys(outcome.delta).length >= 2)
      assert.ok(!narrativeLines.has(outcome.narrative), 'distinct authored aftermath')
      narrativeLines.add(outcome.narrative)
      const key = 'consequences/' + episode.id + '-' + choice.id + '-' + variant
      assert.ok(!(key in COUCH_CONSEQUENCE_ART_IDS), 'art pending, not delivered')
    }
    const after = resolveConsequence(raw, choice.id)
    const record = after.consequenceHistory!.at(-1)!
    assert.equal(after.phase, 'debrief')
    assert.equal(record.episodeId, episode.id)
    assert.equal(record.missionId, missionId)
    assert.equal(record.choiceId, choice.id)
    assert.equal(after.missionHistory?.at(-1)?.policy, choice.policy)
    assert.ok(after.worldFlags?.includes(record.flags[0]!))
    assert.ok(after.scene.includes(choice.label))
    assert.equal(
      record.callback,
      choice[record.succeeded ? 'success' : 'failure'].callback,
    )
    assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(after))), after)
    assert.equal(consequenceForRun({ ...after, phase: 'decision' }), null)
    assert.equal(resolveConsequence(after, choice.id), after)
    assert.deepEqual(resolveConsequence(raw, choice.id), after)
    if (choice.policy === 'aid') earned.push(record)
  }
}
assert.equal(narrativeLines.size, 18)
assert.equal(earned.length, 3)

const convoyFirst = earned[0]!
const concordWithConvoy: VoyageRun = {
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 54),
  chapter: 4,
  missionId: 'concord-intake',
  phase: 'decision',
  consequenceHistory: [convoyFirst],
}
const enriched = consequenceForRun(concordWithConvoy)
assert.ok(enriched?.opening.includes('sealed letter arrives from the convoy'))
assert.equal(enriched?.choices.length, 3)
assert.ok(
  consequenceForRun({
    ...concordWithConvoy,
    consequenceHistory: [
      { ...convoyFirst, flags: ['convoy-route-exposed'] },
    ],
  })?.opening.includes('patrols already know'),
)

const concordResult = resolveConsequence(concordWithConvoy, enriched!.choices[0]!.id)
const seshWithPrior: VoyageRun = {
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 54),
  chapter: 4,
  missionId: 'sesh-backups',
  phase: 'decision',
  worldFlags: ['concord-resident-personhood'],
}
assert.ok(
  consequenceForRun(seshWithPrior)?.opening.includes(
    'successful personhood petition',
  ),
)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(concordResult))), concordResult)

// A fourth authored decision must remain saveable without changing v1.
const firstThree = [
  convoyFirst,
  { ...convoyFirst, chapter: 2, episodeId: 'warp-a2-last-copy',
    missionId: 'archive', choiceId: 'evacuate-readers', artKey: 'consequences/warp-a2-last-copy-evacuate-readers-success', flags: [] },
  { ...convoyFirst, chapter: 3, episodeId: 'warp-a1-weight-of-a-name',
    missionId: 'bar', choiceId: 'protect-sanctuary', artKey: 'consequences/warp-a1-weight-of-a-name-protect-sanctuary-success', flags: [] },
]
const fourth = {
  ...concordResult,
  consequenceHistory: [...firstThree, concordResult.consequenceHistory!.at(-1)!],
}
assert.ok(validConsequenceHistory(fourth.consequenceHistory))
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(fourth))), fourth)
assert.equal(
  validConsequenceHistory(Array(10).fill(convoyFirst)),
  false,
  'ten authored records cannot fit a nine-chapter voyage',
)

// Act I transmissions arrive during Act II; Act II callbacks arrive in Act III.
const firstFollowup = nextDestination({
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 54),
  phase: 'debrief',
  chapter: 3,
  consequenceHistory: [convoyFirst],
})
assert.ok(firstFollowup.scene.includes(convoyFirst.callback))
assert.ok(firstFollowup.log.includes('Follow-up transmission: ' + convoyFirst.callback))
const midgameFollowup = nextDestination({
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 54),
  phase: 'debrief',
  chapter: 6,
  consequenceHistory: [
    convoyFirst,
    concordResult.consequenceHistory!.at(-1)!,
  ],
})
assert.equal(midgameFollowup.chapter, 7)
assert.ok(
  midgameFollowup.scene.includes(concordResult.consequenceHistory!.at(-1)!.callback),
)
assert.ok(
  midgameFollowup.log.some((entry) => entry.includes('Follow-up transmission:')),
)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(midgameFollowup))),
  midgameFollowup,
)

let storyChoices = 0
for (let seed = 1; seed <= 12; seed++) {
  const targetActTwo = seed % 2 === 0 ? 'sesh-backups' : 'concord-intake'
  const { run, steps } = playVoyage(
    'vale',
    ['pell', 'rue', 'vela'],
    seed,
    {
      name: 'convoy-into-act-two',
      order: () => policies[(seed - 1) % 3]!,
      chart: (voyage) =>
        voyage.chapter === 1
          ? 'refugees'
          : voyage.chapter === 2
            ? 'archive'
            : voyage.chapter === 3
              ? 'bar'
              : voyage.chapter === 4
                ? targetActTwo
                : undefined,
      authoredChoices: true,
      sideQuests: false,
      errand: () => null,
      finale: 'protect',
    },
  )
  assert.equal(run.phase, 'ending')
  assert.equal(run.consequenceHistory?.length, 4)
  assert.equal(run.consequenceHistory?.[0]?.missionId, 'refugees')
  assert.equal(run.consequenceHistory?.[3]?.missionId, targetActTwo)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
  storyChoices += steps.filter((step) => step.startsWith('consequence:')).length
}
assert.equal(storyChoices, 48)
console.log(
  'Space Couch convoy/Act II: 3 cases, 9 choices, 18 outcomes, ' +
    '12 complete voyages, 48 authored decisions, v1 four-scene saves, ' +
    'and both later-act callbacks verified',
)

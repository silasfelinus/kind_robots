import assert from 'node:assert/strict'
import {
  consequenceForRun,
  resolveConsequence,
  validConsequenceHistory,
  type ConsequenceRecord,
} from '../gameOfCaptains/consequenceStories'
import { ACT_THREE_OPENING_CASES } from '../gameOfCaptains/consequenceStoriesActThreeOpening'
import { ACT_THREE_MIDDLE_CASES } from '../gameOfCaptains/consequenceStoriesActThreeMiddle'
import { COUCH_CONSEQUENCE_ART_IDS } from '../gameOfCaptains/consequencePaintings'
import {
  nextDestination,
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { controls, playVoyage } from './spaceCouchTraceHarness'

const ids = [
  'jump-gate-permit',
  'serendipity-last-call',
  'gameworld-finale',
] as const
const policies = ['aid', 'observe', 'intervene'] as const
const narratives = new Set<string>()
const records: ConsequenceRecord[] = []
assert.deepEqual(Object.keys(ACT_THREE_OPENING_CASES).sort(), [...ids].sort())

for (const [index, missionId] of ids.entries()) {
  assert.ok(VOYAGE_BOARDS[6]!.includes(missionId))
  const before: VoyageRun = {
    ...startVoyage('vale', ['pell', 'rue', 'vela'], 1400 + index),
    chapter: 7,
    phase: 'decision',
    missionId,
  }
  const scene = consequenceForRun(before)
  assert.ok(scene)
  assert.equal(scene.id, ACT_THREE_OPENING_CASES[missionId].id)
  assert.ok(scene.opening.length > 330 && scene.conflict.length > 110)
  assert.equal(scene.choices.length, 3)
  assert.deepEqual(
    scene.choices.map((choice) => choice.policy).sort(),
    [...policies].sort(),
  )
  assert.deepEqual(
    controls(before).map((action) => action.label),
    scene.choices.map((choice) => 'consequence:' + choice.id),
  )
  assert.equal(resolveConsequence(before, 'not-a-choice'), before)
  for (const choice of scene.choices) {
    assert.ok(choice.label.length >= 35)
    assert.ok(choice.approach.length >= 50 && choice.cost.length >= 60)
    assert.ok(choice.check.difficulty >= 5 && choice.check.difficulty <= 10)
    for (const outcomeKey of ['success', 'failure'] as const) {
      const outcome = choice[outcomeKey]
      assert.ok(outcome.narrative.length > 240)
      assert.ok(outcome.callback.length > 100)
      assert.ok(outcome.flags.length >= 2)
      assert.ok(Object.keys(outcome.delta).length >= 2)
      assert.ok(
        !narratives.has(outcome.narrative),
        'unique story for every result',
      )
      narratives.add(outcome.narrative)
      const artKey =
        'consequences/' + scene.id + '-' + choice.id + '-' + outcomeKey
      assert.ok(
        !(artKey in COUCH_CONSEQUENCE_ART_IDS),
        'unrendered art cannot claim a delivered ID',
      )
    }
    const after = resolveConsequence(before, choice.id)
    assert.equal(after.phase, 'debrief')
    assert.ok(after.scene.includes(choice.label))
    assert.equal(after.missionHistory?.at(-1)?.policy, choice.policy)
    assert.equal(after.consequenceHistory?.at(-1)?.choiceId, choice.id)
    assert.ok(
      after.worldFlags?.includes(after.consequenceHistory!.at(-1)!.flags[0]!),
    )
    assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(after))), after)
    assert.equal(consequenceForRun({ ...after, phase: 'decision' }), null)
    assert.equal(resolveConsequence(after, choice.id), after)
    assert.deepEqual(resolveConsequence(before, choice.id), after)
    if (choice.policy === 'aid') records.push(after.consequenceHistory!.at(-1)!)
  }
}
assert.equal(narratives.size, 18)
assert.equal(records.length, 3)

const callbacks = [
  ['jump-gate-permit', 'concord-resident-personhood', 'Mara recognizes'],
  ['serendipity-last-call', 'sanctuary_charter_preserved', 'Vox remembers'],
  ['gameworld-finale', 'gameworld-union-clause-upheld', 'union is still'],
  [
    'gameworld-finale',
    'gameworld-contestants-exposed',
    'earlier public broadcast',
  ],
] as const
for (const [missionId, flag, expected] of callbacks) {
  const before: VoyageRun = {
    ...startVoyage('vale', ['pell', 'rue', 'vela'], 720),
    chapter: 7,
    missionId,
    phase: 'decision',
    worldFlags: [flag],
  }
  assert.ok(consequenceForRun(before)?.opening.includes(expected))
  assert.equal(consequenceForRun(before)?.choices.length, 3)
}
assert.ok(validConsequenceHistory(records))

// In a restored voyage, early choices reframe chapter seven without changing its IDs.
const saved = {
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 721),
  chapter: 7,
  missionId: 'jump-gate-permit',
  phase: 'decision' as const,
  worldFlags: ['concord-resident-personhood'],
}
const restored = restoreVoyage(JSON.parse(JSON.stringify(saved)))
assert.ok(restored)
assert.ok(consequenceForRun(restored)?.opening.includes('Mara recognizes'))
assert.deepEqual(
  restoreVoyage(
    JSON.parse(
      JSON.stringify(resolveConsequence(restored, 'consult-affected-worlds')),
    ),
  ),
  resolveConsequence(restored, 'consult-affected-worlds'),
)

// An Act III resolution becomes an endgame follow-up, not a replacement ending.
const afterChapterSeven = nextDestination({
  ...startVoyage('vale', ['pell', 'rue', 'vela'], 801),
  chapter: 7,
  phase: 'debrief',
  consequenceHistory: records,
})
assert.equal(afterChapterSeven.chapter, 8)
assert.ok(afterChapterSeven.scene.includes(records[0]!.callback))
assert.ok(
  afterChapterSeven.log.includes(
    'Last command consequence: ' + records[0]!.callback,
  ),
)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(afterChapterSeven))),
  afterChapterSeven,
)

let choicesSeen = 0
for (let seed = 1; seed <= 12; seed++) {
  const target = ids[(seed - 1) % ids.length]!
  // The Gameworld finale only reaches the board with a crew or history that
  // knows the Gameworld (missionBoard); Mox opens it when the Convoy's Act I
  // route never visits there.
  const crew =
    target === 'gameworld-finale'
      ? (['mox', 'rue', 'vela'] as const)
      : (['pell', 'rue', 'vela'] as const)
  const { run, steps } = playVoyage('vale', [...crew], seed, {
    name: 'act-three-authored-returns',
    order: () => policies[(seed - 1) % 3]!,
    chart: (voyage) =>
      voyage.chapter === 3
        ? 'bar'
        : voyage.chapter === 7
          ? target
          : VOYAGE_BOARDS[voyage.chapter - 1]?.[0],
    authoredChoices: true,
    sideQuests: false,
    errand: () => null,
    finale: 'protect',
  })
  assert.equal(run.phase, 'ending')
  assert.ok(
    run.consequenceHistory?.some((record) => record.missionId === target),
  )
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
  choicesSeen += steps.filter((step) => step.startsWith('consequence:')).length
}
assert.ok(choicesSeen >= 12)

const ashDock = ACT_THREE_MIDDLE_CASES['cushion-recall']
assert.equal(ashDock.id, 'warp-e4-sofa-recall')
assert.ok(VOYAGE_BOARDS[7]!.includes('cushion-recall'))
assert.ok(ashDock.opening.length > 330 && ashDock.conflict.length > 110)
assert.equal(ashDock.choices.length, 3)
assert.deepEqual(
  ashDock.choices.map((choice) => choice.policy).sort(),
  [...policies].sort(),
)
const ashDockStories = new Set<string>()
for (const [index, choice] of ashDock.choices.entries()) {
  const before: VoyageRun = {
    ...startVoyage('vale', ['pell', 'rue', 'vela'], 3800 + index),
    chapter: 8,
    missionId: 'cushion-recall',
    phase: 'decision',
  }
  const episode = consequenceForRun(before)
  assert.equal(episode?.id, ashDock.id)
  assert.deepEqual(
    controls(before).map((action) => action.label),
    ashDock.choices.map((action) => 'consequence:' + action.id),
  )
  assert.equal(resolveConsequence(before, 'made-up-action'), before)
  assert.ok(choice.label.length >= 35)
  assert.ok(choice.approach.length >= 50)
  assert.ok(choice.cost.length >= 60)
  assert.ok(choice.check.difficulty >= 5 && choice.check.difficulty <= 10)
  for (const result of ['success', 'failure'] as const) {
    const outcome = choice[result]
    assert.ok(outcome.narrative.length > 240)
    assert.ok(outcome.callback.length > 100)
    assert.ok(outcome.flags.length >= 2)
    assert.ok(Object.keys(outcome.delta).length >= 2)
    assert.ok(!ashDockStories.has(outcome.narrative))
    ashDockStories.add(outcome.narrative)
    const artKey = 'consequences/' + ashDock.id + '-' + choice.id + '-' + result
    assert.ok(!(artKey in COUCH_CONSEQUENCE_ART_IDS))
  }
  const after = resolveConsequence(before, choice.id)
  assert.equal(after.phase, 'debrief')
  assert.equal(after.missionHistory?.at(-1)?.policy, choice.policy)
  assert.equal(after.consequenceHistory?.at(-1)?.choiceId, choice.id)
  assert.equal(after.consequenceHistory?.at(-1)?.missionId, 'cushion-recall')
  assert.ok(after.scene.includes(choice.label))
  assert.ok(validConsequenceHistory(after.consequenceHistory))
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(after))), after)
  assert.deepEqual(resolveConsequence(before, choice.id), after)
  assert.equal(resolveConsequence(after, choice.id), after)
}
assert.equal(ashDockStories.size, 6)

console.log(
  'Space Couch Act III: three authored returns, nine choices, 18 distinct outcomes, ' +
    'earlier-world callbacks, save parity and 12 complete seeded voyages verified',
)

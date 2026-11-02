import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  consequenceForRun,
  resolveConsequence,
  type ConsequenceRecord,
} from '../gameOfCaptains/consequenceStories'
import { ACT_ONE_UNPAINTED_CASES } from '../gameOfCaptains/consequenceStoriesActOneRemainder'
import { COUCH_CONSEQUENCE_ART_IDS } from '../gameOfCaptains/consequencePaintings'
import {
  nextDestination,
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { controls, playVoyage } from './spaceCouchTraceHarness'

const destinations = ['windglass', 'haleth', 'rootborne'] as const
const policies = ['aid', 'observe', 'intervene'] as const
const scenes = new Set<string>()
const cases: ConsequenceRecord[] = []

assert.deepEqual(
  Object.keys(ACT_ONE_UNPAINTED_CASES).sort(),
  [...destinations].sort(),
)
for (const [index, missionId] of destinations.entries()) {
  const chapter = index + 1
  assert.ok(VOYAGE_BOARDS[index]!.includes(missionId), missionId)
  const run: VoyageRun = {
    ...startVoyage('fluke', ['pell', 'mox', 'rue'], 103 + index),
    chapter,
    missionId,
    phase: 'decision',
  }
  const episode = consequenceForRun(run)
  assert.ok(episode, 'authored decision should appear for ' + missionId)
  assert.equal(episode.id, ACT_ONE_UNPAINTED_CASES[missionId].id)
  assert.equal(episode.choices.length, 3)
  assert.deepEqual(
    episode.choices.map((choice) => choice.policy).sort(),
    [...policies].sort(),
  )
  assert.equal(new Set(episode.choices.map((choice) => choice.id)).size, 3)
  assert.ok(episode.opening.length > 300 && episode.conflict.length > 80)
  assert.deepEqual(
    controls(run).map((control) => control.label),
    episode.choices.map((choice) => 'consequence:' + choice.id),
  )
  assert.equal(resolveConsequence(run, 'missing-choice'), run)

  for (const choice of episode.choices) {
    assert.ok(choice.label.length > 24 && choice.cost.length > 60)
    assert.ok(choice.approach.length > 50)
    assert.ok(choice.check.difficulty >= 5 && choice.check.difficulty <= 10)
    for (const variant of ['success', 'failure'] as const) {
      const outcome = choice[variant]
      assert.ok(outcome.narrative.length > 210)
      assert.ok(outcome.callback.length > 85)
      assert.ok(outcome.flags.length >= 2)
      assert.ok(Object.keys(outcome.delta).length >= 2)
      assert.ok(!scenes.has(outcome.narrative), 'each outcome has original writing')
      scenes.add(outcome.narrative)
      const artKey = 'consequences/' + episode.id + '-' + choice.id + '-' + variant
      assert.ok(
        !(artKey in COUCH_CONSEQUENCE_ART_IDS),
        'an unrendered outcome is not represented as finished art',
      )
    }

    const resolved = resolveConsequence(run, choice.id)
    const record = resolved.consequenceHistory?.at(-1)
    assert.equal(resolved.phase, 'debrief')
    assert.equal(record?.chapter, chapter)
    assert.equal(record?.missionId, missionId)
    assert.equal(record?.episodeId, episode.id)
    assert.equal(record?.choiceId, choice.id)
    assert.equal(resolved.missionHistory?.at(-1)?.policy, choice.policy)
    assert.ok(resolved.worldFlags?.includes(record!.flags[0]!))
    assert.ok(resolved.scene.includes(choice.label))
    assert.equal(
      record?.callback,
      choice[record!.succeeded ? 'success' : 'failure'].callback,
    )
    assert.deepEqual(
      restoreVoyage(JSON.parse(JSON.stringify(resolved))),
      resolved,
      'authored decisions must survive v1 save restoration',
    )
    assert.equal(
      consequenceForRun({ ...resolved, phase: 'decision' }),
      null,
      'earned outcome cannot be farmed twice',
    )
    assert.equal(resolveConsequence(resolved, choice.id), resolved)
    assert.deepEqual(resolveConsequence(run, choice.id), resolved)
    if (choice.policy === 'aid') cases.push(record!)
  }
}
assert.equal(scenes.size, 18)
assert.equal(cases.length, 3)

for (let index = 0; index < 3; index++) {
  const source: VoyageRun = {
    ...startVoyage('fluke', ['pell', 'mox', 'rue'], 71),
    phase: 'debrief',
    chapter: 3 + index,
    consequenceHistory: cases,
  }
  const following = nextDestination(source)
  assert.equal(following.chapter, 4 + index)
  assert.ok(following.scene.includes('INCOMING FOLLOW-UP: ' + cases[index]!.callback))
  assert.ok(following.log.includes('Follow-up transmission: ' + cases[index]!.callback))
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(following))), following)
}
const afterActTwo = nextDestination({
  ...startVoyage('fluke', ['pell', 'mox', 'rue'], 71),
  phase: 'debrief',
  chapter: 6,
  consequenceHistory: cases,
})
assert.equal(afterActTwo.chapter, 7)
assert.ok(!afterActTwo.scene.includes('INCOMING FOLLOW-UP:'))

let visits = 0
for (let seed = 1; seed <= 12; seed++) {
  const policy = policies[(seed - 1) % 3]!
  const { run, steps } = playVoyage('fluke', ['pell', 'mox', 'rue'], seed, {
    name: 'remaining-act-one-real-decisions',
    order: () => policy,
    chart: (voyage) =>
      destinations.find((id) =>
        VOYAGE_BOARDS[voyage.chapter - 1]?.includes(id),
      ),
    authoredChoices: true,
    sideQuests: false,
    errand: () => null,
    finale: 'protect',
  })
  assert.equal(run.phase, 'ending')
  assert.deepEqual(
    run.consequenceHistory?.map((record) => record.missionId),
    destinations,
  )
  visits += steps.filter((step) => step.startsWith('consequence:')).length
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
}
assert.equal(visits, 36)

const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
assert.match(page, /store\.decideConsequence\(choice\.id\)/)
assert.match(page, /voyageStageArt\(run\.value, paintedVoyageImage\)/)
console.log(
  'Space Couch further authored worlds: 3 routes, 9 choices, ' +
    scenes.size +
    ' original outcomes, 3 Act II callbacks, ' +
    visits +
    ' actual story-choice activations across 12 complete voyages',
)

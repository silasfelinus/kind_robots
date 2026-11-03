import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  consequenceForRun,
  resolveConsequence,
  type ConsequenceRecord,
} from '../gameOfCaptains/consequenceStories'
import { ACT_ONE_EXPANDED_CONSEQUENCES } from '../gameOfCaptains/consequenceStoriesActOneExpansion'
import { COUCH_CONSEQUENCE_ART_IDS } from '../gameOfCaptains/consequencePaintings'
import {
  nextDestination,
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { controls, playVoyage } from './spaceCouchTraceHarness'

const destinations = ['ashdock', 'nacre', 'gameworld'] as const
const policies = ['aid', 'observe', 'intervene'] as const
const allOutcomes = new Set<string>()
const callbacks: ConsequenceRecord[] = []

assert.deepEqual(
  Object.keys(ACT_ONE_EXPANDED_CONSEQUENCES).sort(),
  [...destinations].sort(),
)
for (const [index, missionId] of destinations.entries()) {
  const chapter = index + 1
  assert.ok(VOYAGE_BOARDS[index]!.includes(missionId))
  const starting = startVoyage('fluke', ['pell', 'mox', 'rue'], 103 + index)
  const run: VoyageRun = {
    ...starting,
    chapter,
    missionId,
    phase: 'decision',
  }
  const episode = consequenceForRun(run)
  assert.ok(episode, missionId + ' has an authored decision on its real route')
  assert.equal(episode.id, ACT_ONE_EXPANDED_CONSEQUENCES[missionId].id)
  assert.equal(episode.choices.length, 3)
  assert.deepEqual(
    episode.choices.map((choice) => choice.policy).sort(),
    [...policies].sort(),
  )
  assert.equal(new Set(episode.choices.map((choice) => choice.id)).size, 3)
  assert.deepEqual(
    controls(run).map((control) => control.label),
    episode.choices.map((choice) => 'consequence:' + choice.id),
    'random walkers must take the same three options as real players',
  )
  assert.ok(episode.opening.length > 200 && episode.conflict.length > 70)
  assert.equal(resolveConsequence(run, 'unavailable-choice'), run)
  for (const choice of episode.choices) {
    assert.ok(choice.label.length > 25 && choice.cost.length > 55)
    assert.ok(choice.approach.length > 30)
    assert.ok(choice.check.difficulty >= 5 && choice.check.difficulty <= 10)
    for (const variant of ['success', 'failure'] as const) {
      const outcome = choice[variant]
      assert.ok(outcome.narrative.length > 220)
      assert.ok(outcome.callback.length > 95)
      assert.ok(outcome.flags.length >= 2)
      assert.ok(Object.keys(outcome.delta).length >= 2)
      assert.ok(!allOutcomes.has(outcome.narrative), 'unique written outcome')
      allOutcomes.add(outcome.narrative)
      const key = 'consequences/' + episode.id + '-' + choice.id + '-' + variant
      assert.ok(
        !(key in COUCH_CONSEQUENCE_ART_IDS),
        'unpainted new outcome must not masquerade as delivered art',
      )
    }
    const result = resolveConsequence(run, choice.id)
    const record = result.consequenceHistory?.at(-1)
    assert.equal(result.phase, 'debrief')
    assert.equal(record?.episodeId, episode.id)
    assert.equal(record?.missionId, missionId)
    assert.equal(record?.choiceId, choice.id)
    assert.equal(record?.chapter, chapter)
    assert.equal(result.missionHistory?.at(-1)?.policy, choice.policy)
    assert.ok(result.worldFlags?.includes(record!.flags[0]!))
    assert.ok(result.scene.includes(choice.label))
    assert.equal(
      record?.callback,
      choice[record!.succeeded ? 'success' : 'failure'].callback,
    )
    assert.deepEqual(
      restoreVoyage(JSON.parse(JSON.stringify(result))),
      result,
      'new case must survive a real version-one save restore',
    )
    assert.equal(
      consequenceForRun({ ...result, phase: 'decision' }),
      null,
      'one-time testimony cannot be farmed',
    )
    assert.equal(resolveConsequence(result, choice.id), result)
    assert.deepEqual(resolveConsequence(run, choice.id), result)
    if (choice.policy === 'aid') callbacks.push(record!)
  }
}
assert.equal(allOutcomes.size, 18)
assert.equal(callbacks.length, 3)

for (let i = 0; i < callbacks.length; i++) {
  const voyage: VoyageRun = {
    ...startVoyage('fluke', ['pell', 'mox', 'rue'], 77),
    phase: 'debrief',
    chapter: 3 + i,
    consequenceHistory: callbacks,
  }
  const following = nextDestination(voyage)
  assert.equal(following.chapter, 4 + i)
  assert.ok(
    following.scene.includes('INCOMING FOLLOW-UP: ' + callbacks[i]!.callback),
    'a distinct earned case resurfaces once in Act II, chapter ' +
      following.chapter,
  )
  assert.ok(
    following.log.includes('Follow-up transmission: ' + callbacks[i]!.callback),
    'the earned follow-up must remain in the captain log',
  )
  assert.deepEqual(
    restoreVoyage(JSON.parse(JSON.stringify(following))),
    following,
  )
}
const noMore = nextDestination({
  ...startVoyage('fluke', ['pell', 'mox', 'rue'], 77),
  phase: 'debrief',
  chapter: 6,
  consequenceHistory: callbacks,
})
assert.ok(!noMore.scene.includes('INCOMING FOLLOW-UP:'))
assert.equal(
  nextDestination({ ...noMore, phase: 'debrief', chapter: 6 }).chapter,
  7,
)

let visits = 0
for (let seed = 1; seed <= 12; seed++) {
  const policy = policies[(seed - 1) % policies.length]!
  const { run, steps } = playVoyage('fluke', ['pell', 'mox', 'rue'], seed, {
    name: 'expanded-authored-act-one',
    order: () => policy,
    chart: (voyage) =>
      destinations.find((missionId) =>
        VOYAGE_BOARDS[voyage.chapter - 1]?.includes(missionId),
      ),
    authoredChoices: true,
    sideQuests: false,
    errand: () => null,
    finale: 'protect',
  })
  assert.equal(run.phase, 'ending', 'newly authored route cannot softlock')
  assert.equal(run.consequenceHistory?.length, 5)
  assert.deepEqual(
    run.consequenceHistory
      ?.filter((record) => record.chapter <= 3)
      .map((record) => record.missionId),
    destinations,
  )
  assert.equal(run.consequenceHistory?.[3]?.missionId, 'concord-intake')
  visits += steps.filter((step) => step.startsWith('consequence:')).length
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
}
assert.equal(
  visits,
  60,
  'three first-act cases, the Act II Concord case and one Act III case per voyage',
)
const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
assert.match(page, /store\.decideConsequence\(choice\.id\)/)
assert.match(page, /voyageStageArt\(run\.value, paintedVoyageImage\)/)
console.log(
  'Space Couch authored worlds: 3 destinations, 9 distinct options, ' +
    allOutcomes.size +
    ' written outcomes, 3 earned Act II callbacks and ' +
    visits +
    ' complete-voyage choice activations verified',
)

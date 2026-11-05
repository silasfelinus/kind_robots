import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  decidePolicy,
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import {
  consequenceForRun,
  resolveConsequence,
} from '../gameOfCaptains/consequenceStories'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { controls, playVoyage } from './spaceCouchTraceHarness'

const baseline = {
  ...startVoyage('fluke', ['pell', 'mox', 'rue'], 41),
  phase: 'decision' as const,
  missionId: 'windglass',
  supplies: 0,
  reputation: 3,
  trust: 2,
}

const emptyAid = decidePolicy(baseline, 'aid')
assert.equal(emptyAid.phase, 'debrief')
assert.equal(emptyAid.supplies, 0)
assert.equal(emptyAid.trust, 3)
assert.equal(emptyAid.reputation, 3)
assert.match(emptyAid.scene, /without the promised crates/)
assert.ok(emptyAid.worldFlags?.includes('supply-shortfall:1:aid'))
assert.equal(emptyAid.missionHistory?.at(-1)?.policy, 'aid')
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(emptyAid))), emptyAid)

const paidAid = decidePolicy({ ...baseline, supplies: 1 }, 'aid')
assert.equal(paidAid.supplies, 0)
assert.equal(paidAid.trust, 3)
assert.equal(paidAid.reputation, 5)
assert.ok(!paidAid.worldFlags?.includes('supply-shortfall:1:aid'))

const underfunded = decidePolicy({ ...baseline, supplies: 1 }, 'intervene')
assert.equal(underfunded.supplies, 0)
assert.equal(underfunded.reputation, 0)
assert.ok(underfunded.worldFlags?.includes('supply-shortfall:1:intervene'))
const emptyIntervention = decidePolicy(baseline, 'intervene')
assert.equal(emptyIntervention.supplies, 0)
assert.equal(emptyIntervention.reputation, -1)
assert.match(emptyIntervention.scene, /without enough resources/)
const funded = decidePolicy({ ...baseline, supplies: 2 }, 'intervene')
assert.equal(funded.supplies, 0)
assert.equal(funded.reputation, 1)
assert.ok(!funded.worldFlags?.includes('supply-shortfall:1:intervene'))

const observation = decidePolicy(baseline, 'observe')
assert.equal(observation.reputation, 2)
assert.equal(observation.trust, 1)
assert.equal(observation.supplies, 0)
assert.ok(
  !observation.worldFlags?.some((f) => f.startsWith('supply-shortfall')),
)
assert.equal(decidePolicy(emptyAid, 'aid'), emptyAid, 'no repeat order')

for (const missionId of ['archive', 'bar']) {
  const chapter =
    VOYAGE_BOARDS.findIndex((board) => board.includes(missionId)) + 1
  assert.ok(chapter > 0, missionId)
  const scenario: VoyageRun = {
    ...baseline,
    chapter,
    missionId,
  }
  const episode = consequenceForRun(scenario)
  assert.ok(episode, missionId)
  assert.equal(episode.choices.length, 3)
  assert.deepEqual(
    controls(scenario).map((action) => action.label),
    episode.choices.map((choice) => 'consequence:' + choice.id),
    'random play must see the same authored choices as the page',
  )
  for (const choice of episode.choices) {
    const result = resolveConsequence(scenario, choice.id)
    assert.equal(result.phase, 'debrief')
    assert.equal(result.consequenceHistory?.at(-1)?.choiceId, choice.id)
    assert.equal(result.missionHistory?.at(-1)?.policy, choice.policy)
    assert.ok(result.scene.includes(choice.label))
    assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(result))), result)
    assert.equal(resolveConsequence(result, choice.id), result)
  }
}

// Complete real-page stories rather than merely calling the generic policy
// function. This crosses the actual first-act Archive and Vox/Serendipity stops.
let authoredDecisions = 0
for (let seed = 1; seed <= 12; seed++) {
  const { run, steps } = playVoyage('fluke', ['pell', 'mox', 'rue'], seed, {
    name: 'scarcity-real-page',
    order: () => 'aid',
    chart: (run) =>
      VOYAGE_BOARDS[run.chapter - 1]?.find(
        (id) => id === 'archive' || id === 'bar',
      ) ?? VOYAGE_BOARDS[run.chapter - 1]?.[0],
    authoredChoices: true,
    sideQuests: false,
    errand: () => null,
    finale: 'protect',
  })
  assert.equal(run.phase, 'ending', 'complete real-page voyage')
  authoredDecisions += steps.filter((step) =>
    step.startsWith('consequence:'),
  ).length
}
assert.equal(
  authoredDecisions,
  60,
  'three first-act scenes, Concord Act II and one Act III scene per voyage',
)

const ui = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
assert.match(ui, /run\.supplies > 0/)
assert.match(ui, /run\.supplies >= 2/)
assert.match(ui, /EMPTY HOLD/)
assert.match(ui, /store\.decideConsequence\(choice\.id\)/)
console.log(
  'Space Couch scarcity and UI parity: 12 complete authored-choice voyages, ' +
    authoredDecisions +
    ' original story decisions, stocked/underfunded ethics tested',
)

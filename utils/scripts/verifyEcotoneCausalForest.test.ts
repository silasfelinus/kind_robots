import assert from 'node:assert/strict'
import {
  chooseBeat,
  createRun,
  findCard,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import { contextualOpeningChoices } from '../ecotone/sceneOffers'

const loop = findCard('GR-4')
const bonfire = findCard('GR-5')
assert.ok(loop && bonfire)

const loopState = (seed: number): RunState => ({
  ...createRun(seed, 'reporter'),
  phase: 'beat',
  event: 'green-ribbon',
  step: 4,
  day: 2,
  card: 'GR-4',
  openingState: 'sober',
  currentState: 'sober',
})

let measuredSeed = 0
let mistakenSeed = 0
for (let seed = 1; seed <= 500 && (!measuredSeed || !mistakenSeed); seed++) {
  const result = chooseBeat(loopState(seed), 'seam')
  if (result.pending?.entry.roll?.success) measuredSeed ||= seed
  else if (result.pending?.entry.roll?.success === false) mistakenSeed ||= seed
}
assert.ok(measuredSeed && mistakenSeed, 'both seeded outcomes are reachable')

const measured = chooseBeat(loopState(measuredSeed), 'seam')
const mistaken = chooseBeat(loopState(mistakenSeed), 'seam')
assert.equal(measured.pending?.entry.roll?.success, true)
assert.equal(mistaken.pending?.entry.roll?.success, false)
assert.ok(measured.flags.includes('loop_seam_measured'))
assert.ok(mistaken.flags.includes('loop_wrong_map_posted'))

const bonfireState = (state: RunState): RunState => ({
  ...state,
  phase: 'beat',
  step: 8,
  day: 3,
  card: 'GR-5',
  pending: null,
})

const available = (state: RunState) =>
  contextualOpeningChoices(bonfire, state).map((choice) => choice.id)

const plain = bonfireState(loopState(1))
const successRoute = restoreRun(
  JSON.parse(JSON.stringify(bonfireState(measured))),
)
const failureRoute = restoreRun(
  JSON.parse(JSON.stringify(bonfireState(mistaken))),
)
assert.ok(successRoute && failureRoute)

for (const state of [plain, successRoute, failureRoute]) {
  assert.deepEqual(
    available(state).slice(0, 3),
    ['petition', 'buyer', 'offering'],
    'existing choice indices remain stable for saved runs',
  )
}
assert.ok(!available(plain).includes('seam-survey'))
assert.ok(!available(plain).includes('map-reconciliation'))
assert.ok(available(successRoute).includes('seam-survey'))
assert.ok(!available(successRoute).includes('map-reconciliation'))
assert.ok(available(failureRoute).includes('map-reconciliation'))
assert.ok(!available(failureRoute).includes('seam-survey'))

assert.equal(
  chooseBeat(successRoute, 'map-reconciliation'),
  successRoute,
  'the reducer must reject a choice hidden by the opposite history',
)
assert.equal(
  chooseBeat(failureRoute, 'seam-survey'),
  failureRoute,
  'forged choice IDs cannot bypass the route prerequisite',
)

const surveyed = chooseBeat(successRoute, 'seam-survey')
const reconciled = chooseBeat(failureRoute, 'map-reconciliation')
assert.ok(surveyed.pending?.entry.roll)
assert.ok(reconciled.pending?.entry.roll)
assert.ok(
  surveyed.flags.some((flag) =>
    ['forest_joint_survey', 'forest_survey_disputed'].includes(flag),
  ),
)
assert.ok(
  reconciled.flags.some((flag) =>
    ['forest_resurvey_agreed', 'forest_resurvey_unfunded'].includes(flag),
  ),
)
assert.notEqual(
  surveyed.pending?.entry.choice,
  reconciled.pending?.entry.choice,
)
assert.deepEqual(
  restoreRun(JSON.parse(JSON.stringify(surveyed))),
  surveyed,
  'the new survey result survives save and restore',
)
assert.deepEqual(
  restoreRun(JSON.parse(JSON.stringify(reconciled))),
  reconciled,
  'the alternate negotiation survives save and restore',
)
console.log(
  `Ecotone causal forest: seam success seed ${measuredSeed}, failure seed ${mistakenSeed}; divergent playable negotiations and save safety`,
)

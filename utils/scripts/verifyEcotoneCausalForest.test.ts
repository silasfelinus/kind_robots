import assert from 'node:assert/strict'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
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
let gladeSeed = 0
let markedSeed = 0
const negotiationResults = {
  'glade-witnesses': new Set<boolean>(),
  'marker-stewards': new Set<boolean>(),
}
for (let seed = 1; seed <= 500; seed++) {
  const result = chooseBeat(loopState(seed), 'slug')
  const glade = result.flags.includes('loop_glade_music')
  const marked = result.flags.includes('loop_exit_marked')
  assert.notEqual(glade, marked, 'slug outcomes must grant exactly one route')
  if (glade) gladeSeed ||= seed
  if (marked) markedSeed ||= seed
  const fire = bonfireState(result)
  const choices = available(fire)
  assert.deepEqual(
    choices.slice(0, 3),
    ['petition', 'buyer', 'offering'],
    'existing saved choice positions must remain stable',
  )
  assert.equal(choices.length, 4, 'each slug outcome gets one earned action')
  assert.equal(choices.includes('glade-witnesses'), glade)
  assert.equal(choices.includes('marker-stewards'), marked)
  assert.equal(choices.includes('seam-survey'), false)
  assert.equal(choices.includes('map-reconciliation'), false)
  const action = glade ? 'glade-witnesses' : 'marker-stewards'
  const forbidden = glade ? 'marker-stewards' : 'glade-witnesses'
  assert.equal(
    chooseBeat(fire, forbidden),
    fire,
    'a forged action cannot bypass the opposite history',
  )
  const negotiated = chooseBeat(fire, action)
  const roll = negotiated.pending?.entry.roll
  assert.ok(roll, 'the negotiated tradeoff must have a real skill check')
  negotiationResults[action].add(roll.success)
  assert.ok(
    negotiated.flags.some((flag) =>
      glade
        ? [
            'forest_glade_listening_committee',
            'forest_glade_witnesses_uncertain',
          ].includes(flag)
        : ['forest_safe_corridor', 'forest_corridor_unstaffed'].includes(flag),
    ),
  )
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(negotiated))),
    negotiated,
    'both earned decisions and their costs must survive save/restore',
  )
}
assert.ok(gladeSeed && markedSeed, 'both slug results have seeded witnesses')
assert.deepEqual(
  [...negotiationResults['glade-witnesses']].sort(),
  [false, true],
  'the glade negotiation has reachable success and failure',
)
assert.deepEqual(
  [...negotiationResults['marker-stewards']].sort(),
  [false, true],
  'the rescue-marker negotiation has reachable success and failure',
)

const walkTo = (initial: RunState, target: string): RunState => {
  let state = initial
  for (let turn = 0; turn < 100; turn++) {
    if (state.phase === 'beat' && state.card === target) return state
    if (state.pending) {
      state = advance(state)
      continue
    }
    if (state.phase === 'fork') {
      assert.ok(state.offered[0], 'a fork must offer a playable card')
      state = chooseFork(state, state.offered[0])
      continue
    }
    if (state.phase === 'crossroads') {
      state = chooseCrossroads(state, 'stay')
      continue
    }
    assert.equal(state.phase, 'beat', 'the target must precede the ending')
    const card = findCard(state.card)
    assert.ok(card)
    const options = contextualOpeningChoices(card, state).filter(
      (choice) => !choice.locked,
    )
    const selected =
      card.id === 'GR-1'
        ? 'acro'
        : card.id === 'GR-2'
          ? 'sober'
          : card.id === 'GR-3'
            ? 'alone'
            : options[0]?.id
    assert.ok(selected, `no playable option on ${card.id}`)
    const next = chooseBeat(state, selected)
    assert.notEqual(next, state, `reducer stalled on ${card.id}`)
    state = next
  }
  assert.fail(`could not reach ${target} from a new game`)
}

for (const seed of [gladeSeed, markedSeed]) {
  const start = advance(chooseEvent(createRun(seed, 'reporter'), 'green-ribbon'))
  const forest = walkTo(start, 'GR-4')
  const result = chooseBeat(forest, 'slug')
  assert.ok(result.pending?.entry.roll)
  const fire = walkTo(advance(result), 'GR-5')
  const expected = result.flags.includes('loop_glade_music')
    ? 'glade-witnesses'
    : 'marker-stewards'
  assert.ok(
    available(fire).includes(expected),
    'the earned negotiation must be playable in a genuine new-game journey',
  )
  assert.ok(
    chooseBeat(fire, expected).pending?.entry.roll,
    'the new-game journey can resolve the negotiated tradeoff',
  )
}

console.log(
  `Ecotone causal forest: seam ${measuredSeed}/${mistakenSeed}, slug ${gladeSeed}/${markedSeed}; paired negotiations, new-game journeys and save safety`,
)

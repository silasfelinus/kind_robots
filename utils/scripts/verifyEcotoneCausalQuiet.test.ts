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

const meadow = findCard('QW-4')
const cabin = findCard('QW-5')
assert.ok(meadow && cabin)

const available = (state: RunState) =>
  contextualOpeningChoices(cabin, state).map((choice) => choice.id)

// Walk the actual seeded route, including the forks and optional meetings.
// No test-only flag injection is allowed to stand in for an earned decision.
function walkTo(initial: RunState, target: string): RunState {
  let state = initial
  for (let turn = 0; turn < 100; turn++) {
    if (state.phase === 'beat' && state.card === target) return state
    if (state.pending) {
      state = advance(state)
      continue
    }
    if (state.phase === 'fork') {
      assert.ok(state.offered[0], 'the fork must have a playable card')
      state = chooseFork(state, state.offered[0])
      continue
    }
    if (state.phase === 'crossroads') {
      state = chooseCrossroads(state, 'stay')
      continue
    }
    assert.equal(state.phase, 'beat', 'the target must precede the ending')
    const card = findCard(state.card)
    assert.ok(card, `unknown card ${state.card}`)
    const choices = contextualOpeningChoices(card, state).filter(
      (choice) => !choice.locked,
    )
    const choice =
      card.id === 'QW-1'
        ? 'trail'
        : card.id === 'QW-2'
          ? 'sober'
          : choices[0]?.id
    assert.ok(choice, `no playable choice on ${card.id}`)
    const next = chooseBeat(state, choice)
    assert.notEqual(next, state, `reducer stalled on ${card.id}`)
    state = next
  }
  assert.fail(`could not reach ${target} from a new game`)
}

const routeSeeds: Record<string, number> = {}
const results = {
  'elk-ledger': new Set<boolean>(),
  'elk-safety': new Set<boolean>(),
}

for (let seed = 1; seed <= 200; seed++) {
  const start = advance(chooseEvent(createRun(seed, 'reporter'), 'quiet'))
  const elk = walkTo(start, 'QW-4')
  const investigated = chooseBeat(elk, 'ranger')
  const firstRoll = investigated.pending?.entry.roll
  assert.ok(firstRoll, 'the ranger interview requires an actual 2d6 check')
  const copied = investigated.flags.includes('elk_ranger_log_copied')
  const followup = investigated.flags.includes('elk_ranger_followup')
  assert.notEqual(
    copied,
    followup,
    'one outcome grants exactly one earned route',
  )
  assert.equal(copied, firstRoll.success)

  const cabinState = walkTo(advance(investigated), 'QW-5')
  const offered = available(cabinState)
  assert.deepEqual(
    offered.slice(0, 4),
    ['restore', 'monitor', 'call', 'porch'],
    'old choice positions must remain stable for saved games',
  )
  assert.equal(offered.length, 5, 'exactly one ranger consequence is playable')
  const earned = copied ? 'elk-ledger' : 'elk-safety'
  const forbidden = copied ? 'elk-safety' : 'elk-ledger'
  assert.ok(offered.includes(earned))
  assert.ok(!offered.includes(forbidden))
  assert.equal(
    chooseBeat(cabinState, forbidden),
    cabinState,
    'a forged opposite-route action must be rejected',
  )

  const negotiated = chooseBeat(cabinState, earned)
  const secondRoll = negotiated.pending?.entry.roll
  assert.ok(secondRoll, 'the earned choice must resolve a real skill check')
  results[earned].add(secondRoll.success)
  routeSeeds[`${earned}:${secondRoll.success}`] ||= seed
  assert.ok(
    negotiated.flags.includes(
      copied
        ? secondRoll.success
          ? 'elk_observation_network'
          : 'elk_network_unstaffed'
        : secondRoll.success
          ? 'elk_viewing_stewards'
          : 'elk_viewing_unstaffed',
    ),
    'the exact earned outcome persists in the run state',
  )
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(negotiated))),
    negotiated,
    'the outcome and its resource cost survive save and restore',
  )
}

assert.deepEqual(
  [...results['elk-ledger']].sort(),
  [false, true],
  'the observation network has reachable success and failure',
)
assert.deepEqual(
  [...results['elk-safety']].sort(),
  [false, true],
  'the safety stewards have reachable success and failure',
)
assert.equal(Object.keys(routeSeeds).length, 4)
console.log(
  `Ecotone Quiet Way ranger consequences: ${JSON.stringify(routeSeeds)}; 200 new-game journeys, both routes and all four roll results verified`,
)

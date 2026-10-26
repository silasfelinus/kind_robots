import assert from 'node:assert/strict'
import {
  advance,
  cardAsides,
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

const bench = findCard('QW-2')
const meadow = findCard('QW-4')
const cabin = findCard('QW-5')
assert.ok(bench && meadow && cabin)

const available = (state: RunState) =>
  contextualOpeningChoices(meadow, state).map((choice) => choice.id)

// Each witness starts at the actual Quiet Way opening and walks its forks.
// No synthetic flags or direct jumps to later beats.
function walkTo(initial: RunState, target: string): RunState {
  let state = initial
  for (let turn = 0; turn < 100; turn++) {
    if (state.phase === 'beat' && state.card === target) return state
    if (state.pending) {
      state = advance(state)
      continue
    }
    if (state.phase === 'fork') {
      assert.ok(state.offered[0], 'the fork must offer a playable card')
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
    const choice = card.id === 'QW-1' ? 'trail' : choices[0]?.id
    assert.ok(choice, `no playable choice on ${card.id}`)
    const next = chooseBeat(state, choice)
    assert.notEqual(next, state, `reducer stalled on ${card.id}`)
    state = next
  }
  assert.fail(`could not reach ${target} from a new game`)
}

const routeSeeds: Record<string, number> = {}
const results = {
  'heron-ledger': new Set<boolean>(),
  'tally-witness': new Set<boolean>(),
}
for (let seed = 1; seed <= 200; seed++) {
  const start = advance(chooseEvent(createRun(seed, 'reporter'), 'quiet'))
  const morning = walkTo(start, 'QW-2')
  const observed = chooseBeat(morning, 'sober')
  assert.ok(observed.pending, 'the opening lens must produce an authored result')
  assert.equal(
    observed.pending.entry.roll,
    null,
    'the opening perspective uses a seeded complication, not a dice roll',
  )
  const matched = observed.flags.includes('bench_heron_photo_match')
  const erased = observed.flags.includes('bench_tally_erased')
  assert.notEqual(
    matched,
    erased,
    'one bench outcome grants exactly one later route',
  )
  assert.equal(
    matched,
    (seed + 'QW-2'.length + 'sober'.length) % 4 !== 0,
    'the opening complication must remain deterministic across seeds',
  )

  const meadowState = walkTo(advance(observed), 'QW-4')
  const offered = available(meadowState)
  assert.deepEqual(
    offered.slice(0, 3),
    ['wait', 'ranger', 'road'],
    'old meadow choice positions remain stable for saved games',
  )
  assert.equal(offered.length, 4, 'one earned fourth choice stays within cap')
  const earned = matched ? 'heron-ledger' : 'tally-witness'
  const forbidden = matched ? 'tally-witness' : 'heron-ledger'
  assert.ok(offered.includes(earned))
  assert.ok(!offered.includes(forbidden))
  assert.equal(
    chooseBeat(meadowState, forbidden),
    meadowState,
    'the reducer rejects an unearned opposite-route choice',
  )

  const negotiated = chooseBeat(meadowState, earned)
  const secondRoll = negotiated.pending?.entry.roll
  assert.ok(secondRoll, 'the earned choice resolves a real skill check')
  results[earned].add(secondRoll.success)
  routeSeeds[`${earned}:${secondRoll.success}`] ||= seed
  const expectedFlag = matched
    ? secondRoll.success
      ? 'elk_heron_joint_log'
      : 'elk_heron_log_disputed'
    : secondRoll.success
      ? 'elk_tally_witnesses'
      : 'elk_tally_unsigned'
  assert.ok(negotiated.flags.includes(expectedFlag))
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(negotiated))),
    negotiated,
    'the result and its real nerve cost survive save and restore',
  )

  const cabinState = walkTo(advance(negotiated), 'QW-5')
  assert.deepEqual(
    contextualOpeningChoices(cabin, cabinState).map((choice) => choice.id),
    ['restore', 'monitor', 'call', 'porch'],
    'the final restoration menu keeps its four choices and save indices',
  )
  assert.ok(
    cardAsides(cabin, cabinState).some((line) =>
      line.includes(
        matched
          ? secondRoll.success
            ? 'wildlife observation template'
            : 'incomplete heron-and-elk'
          : secondRoll.success
            ? 'witnessed elk times'
            : 'conflicting elk accounts',
      ),
    ),
    'the later scene acknowledges the exact earned outcome',
  )
}

assert.deepEqual(
  [...results['heron-ledger']].sort(),
  [false, true],
  'the comparison route has reachable success and failure',
)
assert.deepEqual(
  [...results['tally-witness']].sort(),
  [false, true],
  'the independent-witness route has reachable success and failure',
)
assert.equal(Object.keys(routeSeeds).length, 4)
console.log(
  `Ecotone Quiet Way bench-to-meadow consequences: ${JSON.stringify(routeSeeds)}; 200 new-game journeys, all four earned results, callbacks and saves verified`,
)

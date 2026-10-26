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
function walkTo(initial: RunState, target: string, solo = false): RunState {
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
    const choice =
      card.id === 'QW-1'
        ? 'trail'
        : card.id === 'QW-3' && solo
          ? 'alone'
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
  'heron-ledger': new Set<boolean>(),
  'tally-witness': new Set<boolean>(),
}
for (let seed = 1; seed <= 200; seed++) {
  const start = advance(chooseEvent(createRun(seed, 'reporter'), 'quiet'))
  const morning = walkTo(start, 'QW-2')
  const observed = chooseBeat(morning, 'sober')
  assert.ok(
    observed.pending,
    'the opening lens must produce an authored result',
  )
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

const roadOutcomeSeeds: Record<string, number> = {}
const roadNegotiationResults = {
  tracks: new Set<boolean>(),
  photo: new Set<boolean>(),
}
for (let seed = 1; seed <= 300; seed++) {
  const solo = seed % 2 === 0
  const start = advance(chooseEvent(createRun(seed, 'reporter'), 'quiet'))
  const benchState = walkTo(start, 'QW-2')
  const observed = chooseBeat(benchState, 'sober')
  const meadowState = walkTo(advance(observed), 'QW-4', solo)

  if (seed === 1) {
    const plainCabin = walkTo(
      advance(chooseBeat(meadowState, 'wait')),
      'QW-5',
    )
    assert.equal(
      contextualOpeningChoices(cabin, plainCabin).find(
        (choice) => choice.id === 'monitor',
      )?.label,
      'Commit four Saturdays to creek monitoring and learn the crew plan',
      'unrelated meadow choices keep the original monitoring negotiation',
    )
  }

  const road = chooseBeat(meadowState, 'road')
  assert.ok(road.pending?.entry.roll, 'the road check must roll 2d6')
  const tracks = road.flags.includes('elk_road_tracks_vanished')
  const photo = road.flags.includes('elk_future_photo')
  assert.notEqual(tracks, photo, 'road results must select one evidence route')
  assert.equal(tracks, road.pending.entry.roll.success)

  const cabinState = walkTo(advance(road), 'QW-5')
  if (solo) assert.equal(cabinState.activeLead, null)
  const choices = contextualOpeningChoices(cabin, cabinState)
  assert.deepEqual(
    choices.map((choice) => choice.id),
    ['restore', 'monitor', 'call', 'porch'],
    'all four saved choice IDs and their positions stay stable',
  )
  const monitoring = choices.find((choice) => choice.id === 'monitor')
  assert.ok(monitoring)
  assert.equal(
    monitoring.label,
    tracks
      ? 'Commit four Saturdays to a safe road-to-creek wildlife survey'
      : 'Commit four Saturdays to checking the future-dated meadow photo',
    'the later playable action must change with the road outcome',
  )
  assert.equal(
    monitoring.check?.skill,
    tracks ? 'lore' : 'wits',
    'the two negotiated plans demand different expertise',
  )

  const negotiated = chooseBeat(cabinState, 'monitor')
  const roll = negotiated.pending?.entry.roll
  assert.ok(roll, 'the new negotiated plan must make a real skill check')
  assert.equal(
    negotiated.pending?.entry.choice,
    monitoring.label,
    'the reducer must resolve the same action displayed to the player',
  )
  const branch = tracks ? 'tracks' : 'photo'
  roadNegotiationResults[branch].add(roll.success)
  roadOutcomeSeeds[`${branch}:${roll.success}`] ||= seed
  const expected = tracks
    ? roll.success
      ? 'creek_corridor_survey_planned'
      : 'creek_corridor_survey_deferred'
    : roll.success
      ? 'creek_photo_audit_agreed'
      : 'creek_photo_audit_unverified'
  assert.ok(negotiated.flags.includes(expected))
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(negotiated))),
    negotiated,
    'the exact road-dependent outcome survives save and restore',
  )
}
assert.deepEqual([...roadNegotiationResults.tracks].sort(), [false, true])
assert.deepEqual([...roadNegotiationResults.photo].sort(), [false, true])
assert.equal(
  Object.keys(roadOutcomeSeeds).length,
  4,
  'both road histories and both later check results are reachable from new games',
)
console.log(
  `Ecotone Quiet Way road-to-cabin consequences: ${JSON.stringify(roadOutcomeSeeds)}; 300 fresh journeys, solo paths and saved results verified`,
)

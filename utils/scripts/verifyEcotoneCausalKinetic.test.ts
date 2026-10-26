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
import { ecotoneArtSlots, outcomeArtKey } from '../ecotone/artSlots'

const startLine = findCard('KN-4')
const bay = findCard('KN-5')
const finish = findCard('KN-6')
assert.ok(startLine && bay && finish)

function walkTo(initial: RunState, target: string, solo: boolean): RunState {
  let state = initial
  for (let turn = 0; turn < 110; turn++) {
    if (state.phase === 'beat' && state.card === target) return state
    if (state.pending) {
      state = advance(state)
      continue
    }
    if (state.phase === 'fork') {
      assert.ok(state.offered[0], 'every fork needs a playable card')
      state = chooseFork(state, state.offered[0])
      continue
    }
    if (state.phase === 'crossroads') {
      state = chooseCrossroads(state, 'stay')
      continue
    }
    assert.equal(state.phase, 'beat', 'target must precede the finale')
    const card = findCard(state.card)
    assert.ok(card, `missing card ${state.card}`)
    const choices = contextualOpeningChoices(card, state).filter(
      (choice) => !choice.locked,
    )
    const selected =
      card.id === 'KN-3' && solo ? 'alone' : choices[0]?.id
    assert.ok(selected, `no playable choice for ${card.id}`)
    const next = chooseBeat(state, selected)
    assert.notEqual(next, state, `reducer stalled at ${card.id}`)
    state = next
  }
  assert.fail(`cannot reach ${target} from a new Kinetic game`)
}

for (const choiceId of ['dot-bailout', 'shore-relay'])
  for (const result of ['success', 'failure'] as const)
    assert.ok(
      ecotoneArtSlots().outcomes.includes(outcomeArtKey('KN-5', choiceId, result)),
      `earned bay choice ${choiceId}/${result} needs a durable art slot`,
    )

const witnesses: Record<string, number> = {}
const outcomes = {
  aboard: new Set<boolean>(),
  ashore: new Set<boolean>(),
}

for (let seed = 1; seed <= 320; seed++) {
  const solo = seed % 2 === 0
  const initial = advance(chooseEvent(createRun(seed, 'reporter'), 'kinetic'))
  const conscripted = walkTo(initial, 'KN-4', solo)
  const dotChoice = chooseBeat(conscripted, 'dot-aboard')
  const firstRoll = dotChoice.pending?.entry.roll
  assert.ok(firstRoll, 'Dot recruitment must be a real 2d6 check')
  const aboard = dotChoice.flags.includes('dot_aboard')
  const chasing = dotChoice.flags.includes('dot_chasing')
  assert.notEqual(aboard, chasing, 'Dot is either aboard or on the chase bike')
  assert.equal(aboard, firstRoll.success)

  const bayState = walkTo(advance(dotChoice), 'KN-5', solo)
  if (solo) assert.equal(bayState.activeLead, null)
  const choices = contextualOpeningChoices(bay, bayState)
  assert.deepEqual(
    choices.slice(0, 3).map((choice) => choice.id),
    ['pedal', 'current', 'buoy'],
    'existing bay choices retain their save positions',
  )
  assert.equal(choices.length, 4, 'one earned fourth choice, never five')
  const earned = aboard ? 'dot-bailout' : 'shore-relay'
  const forbidden = aboard ? 'shore-relay' : 'dot-bailout'
  assert.equal(choices[3]?.id, earned)
  assert.equal(
    chooseBeat(bayState, forbidden),
    bayState,
    'the reducer rejects the unearned opposite strategy',
  )
  assert.ok(
    cardAsides(bay, bayState).some((line) =>
      line.includes(aboard ? 'inside the cargo hold' : 'shore road'),
    ),
    'the bay scene must remember Dot’s actual location',
  )
  const negotiated = chooseBeat(bayState, earned)
  const secondRoll = negotiated.pending?.entry.roll
  assert.ok(secondRoll, 'the safety strategy needs its own skill check')
  assert.equal(
    choices[3]?.check?.skill,
    aboard ? 'rizz' : 'wits',
    'aboard coordination and shore navigation use different skills',
  )
  assert.equal(negotiated.pending?.entry.choice, choices[3]?.label)
  const branch = aboard ? 'aboard' : 'ashore'
  outcomes[branch].add(secondRoll.success)
  witnesses[`${branch}:${secondRoll.success}`] ||= seed
  const expected = aboard
    ? secondRoll.success
      ? 'slug_dot_safety_coordinated'
      : 'slug_dot_bailout_delayed'
    : secondRoll.success
      ? 'slug_shore_relay_confirmed'
      : 'slug_shore_relay_missed'
  assert.ok(negotiated.flags.includes(expected))
  assert.equal(
    negotiated.flags.includes('slug_sank'),
    !secondRoll.success,
    'a failed safety relay sinks the slug but rescues the crew',
  )
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(negotiated))),
    negotiated,
    'the earned outcome and its cost survive a versioned save',
  )
  const finishState = walkTo(advance(negotiated), 'KN-6', solo)
  assert.ok(
    cardAsides(finish, finishState).some((line) =>
      line.includes(
        aboard
          ? secondRoll.success
            ? 'list of the volunteers'
            : 'soggy safety checklist'
          : secondRoll.success
            ? 'safer ramp route'
            : 'flags lost in the fog',
      ),
    ),
    'the finale remembers the exact bay rescue outcome',
  )
}

assert.deepEqual([...outcomes.aboard].sort(), [false, true])
assert.deepEqual([...outcomes.ashore].sort(), [false, true])
assert.equal(
  Object.keys(witnesses).length,
  4,
  'all four earned outcomes must be reachable from genuine new games',
)
console.log(
  `Ecotone Kinetic Dot-to-bay consequences: ${JSON.stringify(witnesses)}; 320 fresh seeded journeys, solo agency, saved outcomes and Ferndale callbacks verified`,
)

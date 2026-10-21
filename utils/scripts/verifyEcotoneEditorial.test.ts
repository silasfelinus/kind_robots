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
  type RunState,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'

type ElkChoice = 'ranger' | 'road'

function soberQuietJourney(seed: number, elkChoice: ElkChoice): RunState {
  let state = advance(chooseEvent(createRun(seed, 'reporter'), 'quiet'))
  let guard = 0
  let witnessedElk = false
  let witnessedEcho = false
  while (state.phase !== 'end') {
    assert.ok(++guard < 120, 'even a poorly rolled sober route terminates')
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[0]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, false))
      continue
    }
    assert.equal(state.phase, 'beat')
    const card = findCard(state.card)
    assert.ok(card)
    if (card.id === 'QW-5') {
      const asides = cardAsides(card, state).join(' ')
      if (state.flags.includes('elk_ranger_followup')) {
        assert.match(asides, /three independent visitors/)
        witnessedEcho = true
      }
      if (state.flags.includes('elk_future_photo')) {
        assert.match(asides, /sandwich-shop receipt/)
        witnessedEcho = true
      }
    }
    const choiceId =
      card.id === 'QW-1'
        ? 'trail'
        : card.id === 'QW-2'
          ? 'sober'
          : card.id === 'QW-4'
            ? elkChoice
            : card.id === 'QW-5'
              ? 'restore'
              : openingLensChoices(card).find((choice) => !choice.locked)?.id
    assert.ok(choiceId, `playable choice for ${card.id}`)
    state = advance(chooseBeat(state, choiceId))
    if (card.id === 'QW-4') witnessedElk = true
  }
  assert.ok(witnessedElk, 'a quiet journey actually reaches Elk Meadow')
  const elk = state.log.find((entry) => entry.source === 'QW-4')
  assert.ok(elk?.roll, 'the elk decision actually made a dice check')
  if (!elk.roll.success) {
    assert.ok(witnessedEcho, 'a failed elk check alters the later cabin scene')
    assert.ok(
      state.flags.includes(
        elkChoice === 'ranger' ? 'elk_ranger_followup' : 'elk_future_photo',
      ),
    )
    assert.equal(
      elk.effects.flag,
      elkChoice === 'ranger' ? 'elk_ranger_followup' : 'elk_future_photo',
      'the logged consequence is the real saved flag',
    )
  }
  assert.equal(state.openingState, 'sober')
  assert.match(state.ending ?? '', /^ecotopia\.sober\.(hope|dark)$/)
  return state
}

for (const elkChoice of ['ranger', 'road'] as const) {
  const results = new Set<string>()
  for (let seed = 1; seed <= 100; seed += 1) {
    const completed = soberQuietJourney(seed, elkChoice)
    const elk = completed.log.find((entry) => entry.source === 'QW-4')!
    results.add(elk.roll?.success ? 'success' : 'failure')
    if (seed === 7) {
      assert.deepEqual(
        completed,
        soberQuietJourney(seed, elkChoice),
        'a sober journey, including earned consequences, replays identically',
      )
    }
  }
  assert.deepEqual(
    [...results].sort(),
    ['failure', 'success'],
    `${elkChoice} has both witnessed roll results under real seeded play`,
  )
}

const fairExit = findCard('GR-4')!
const fairFinale = findCard('GR-5')!
assert.ok(
  !cardAsides(fairFinale, createRun(8, 'reporter')).some((line) =>
    /exit markers|impossible maps|hikers you waited with/.test(line),
  ),
  'a new run cannot fabricate the new forest-loop callbacks',
)
for (const [choiceId, failureFlag, phrase] of [
  ['slug', 'loop_exit_marked', /improvised exit markers/],
  ['seam', 'loop_wrong_map_posted', /impossible maps/],
] as const) {
  let failed = false
  for (let seed = 1; seed <= 80; seed += 1) {
    const start: RunState = {
      ...createRun(seed, 'reporter'),
      phase: 'beat',
      event: 'green-ribbon',
      card: fairExit.id,
      openingState: 'sober',
      currentState: 'sober',
    }
    const result = chooseBeat(start, choiceId)
    if (!result.log[0]?.roll?.success) {
      failed = true
      assert.ok(result.flags.includes(failureFlag))
      assert.match(cardAsides(fairFinale, result).join(' '), phrase)
      assert.ok(
        !cardAsides(fairFinale, start).some((line) => phrase.test(line)),
      )
      break
    }
  }
  assert.ok(failed, `${choiceId} has a deterministic failure witness`)
}
 
// Round eight: the *result* of a choice, not just the entrance, must make
// room for the guide actually traveling with the player.
const outcomeGuides = ['kit', 'juniper', 'cedar', 'mara'] as const
const commentaryCases = [
  ['GR-5', 'petition'],
  ['GR-5', 'buyer'],
  ['GR-5', 'offering'],
  ['QW-5', 'restore'],
  ['QW-5', 'call'],
  ['QW-5', 'porch'],
] as const
for (const [cardId, choiceId] of commentaryCases) {
  const card = findCard(cardId)!
  const choice = card.choices.find((item) => item.id === choiceId)!
  for (const outcome of [choice.success, choice.failure].filter(
    (item) => item !== undefined,
  )) {
    assert.deepEqual(
      Object.keys(outcome.leadLines ?? {}).sort(),
      ['alone', ...outcomeGuides].sort(),
      `${cardId}/${choiceId} gives everyone a distinct voiced outcome`,
    )
    assert.equal(
      new Set(Object.values(outcome.leadLines)).size,
      5,
      'no two present companions share a generic reaction',
    )
  }

  const observed = new Set<string>()
  for (let seed = 1; seed <= 64; seed += 1) {
    const guide = outcomeGuides[seed % outcomeGuides.length]!
    const start: RunState = {
      ...createRun(seed, 'reporter'),
      phase: 'beat',
      event: card.event!,
      card: cardId,
      meetingOrder: [guide],
      activeLead: guide,
      openingState: 'sober',
      currentState: 'sober',
    }
    const result = chooseBeat(start, choiceId)
    const entry = result.log[0]!
    const selected = entry.roll?.success === false ? choice.failure! : choice.success
    observed.add(entry.roll?.success === false ? 'failure' : 'success')
    assert.equal(
      entry.text,
      [selected.text, selected.leadLines?.[guide]].filter(Boolean).join('\n\n'),
      `${cardId}/${choiceId} logs the voice of the guide actually present`,
    )
    assert.ok(!entry.text.includes('undefined'))
    const soloStart: RunState = {
      ...start,
      activeLead: null,
      meetingOrder: [guide],
    }
    const solo = chooseBeat(soloStart, choiceId)
    const soloEntry = solo.log[0]!
    const soloOutcome =
      soloEntry.roll?.success === false ? choice.failure! : choice.success
    assert.equal(
      soloEntry.text,
      [soloOutcome.text, soloOutcome.leadLines?.alone]
        .filter(Boolean)
        .join('\n\n'),
      'having met a companion does not make them magically present later',
    )
  }
  assert.ok(observed.has('success'))
  if (choice.failure) assert.ok(observed.has('failure'))
}

for (const [cardId, choiceId, expectedFlag, scene] of [
  ['GR-5', 'petition', 'forest_petition', 'speech'],
  ['GR-5', 'buyer', 'buyer_no_names', 'privacy'],
  ['QW-5', 'restore', 'creek_started', 'snag'],
  ['QW-5', 'call', 'cabin_future_message', 'gauge'],
] as const) {
  let found = false
  for (let seed = 1; seed <= 128; seed += 1) {
    const start: RunState = {
      ...createRun(seed, 'reporter'),
      phase: 'beat',
      event: cardId === 'GR-5' ? 'green-ribbon' : 'quiet',
      card: cardId,
      openingState: 'sober',
      currentState: 'sober',
    }
    const result = chooseBeat(start, choiceId)
    if (result.log[0]?.roll?.success !== false) continue
    found = true
    assert.ok(result.flags.includes(expectedFlag))
    assert.ok(result.nerve < start.nerve, `${cardId} failed roll costs nerve`)
    assert.ok(
      result.log[0]?.text.toLowerCase().includes(scene),
      `${cardId} failure has authored, scene-specific consequences`,
    )
    if (cardId === 'GR-5' && choiceId === 'buyer') {
      assert.ok(result.goodwill <= start.goodwill)
    }
    break
  }
  assert.ok(found, `${cardId}/${choiceId} has an observed failure`)
}

const soberBench = findCard('QW-2')!
const elkMeadow = findCard('QW-4')!
let foundBenchFailure = false
for (let seed = 1; seed <= 128; seed += 1) {
  const start: RunState = {
    ...createRun(seed, 'reporter'),
    phase: 'beat',
    event: 'quiet',
    card: 'QW-2',
  }
  const result = chooseBeat(start, 'sober')
  if (result.log[0]?.roll?.success !== false) continue
  foundBenchFailure = true
  assert.ok(result.flags.includes('bench_tally_erased'))
  assert.ok(result.nerve < start.nerve)
  assert.match(cardAsides(elkMeadow, result).join(' '), /peculiar block handwriting/)
  assert.ok(
    !cardAsides(elkMeadow, start).join(' ').includes('peculiar block handwriting'),
    'a first-time visitor has no false memory of the erased board',
  )
  break
}
assert.ok(foundBenchFailure, 'the sober bench has an actual losing-roll witness')

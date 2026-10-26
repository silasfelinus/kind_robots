import assert from 'node:assert/strict'
import {
  ARCHETYPES,
  COMPANIONS,
  LENSES,
  type EventId,
  type LensId,
} from '../ecotone/content'
import {
  ALL_CARDS,
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
import { openingLensChoices } from '../ecotone/openingLensChoices'
import { EVENTS } from '../ecotone/story'

// Companion and perception continuity (weird-humboldt t-010): every archetype
// x voluntary opening state finishes each event while declining every first
// companion, and a declined companion is still met later. No companion is a
// substance-gated prize, and sober play keeps every clue and hopeful ending.
const STATES = LENSES.map((lens) => lens.id)
const FIRST_FOUR: LensId[] = ['sober', 'tipsy', 'stoned', 'tripping_balls']
assert.ok(
  FIRST_FOUR.every((id) => STATES.includes(id)),
  'the four first-encounter states exist',
)
// The design file lists eight; the engine ships seven ('organizer' is unbuilt).
assert.ok(ARCHETYPES.length >= 7)

type Policy = 'decline-then-follow' | 'decline-always' | 'accept-all'

function play(
  event: EventId,
  lens: LensId,
  archetype: string,
  seed: number,
  policy: Policy,
): RunState {
  let state = createRun(seed, archetype)
  state = advance(chooseEvent(state, event))
  let turns = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 125, `${event}/${lens}/${archetype} stalled`)
    if (state.phase === 'fork') {
      state = chooseFork(
        state,
        state.offered[(seed + state.step) % state.offered.length]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      const decision =
        policy === 'decline-always'
          ? 'stay'
          : policy === 'accept-all' && state.activeLead
            ? 'together'
            : 'follow'
      state = advance(chooseCrossroads(state, decision))
      continue
    }
    const card = findCard(state.card)
    assert.ok(card, 'only authored cards are offered')
    const choices = openingLensChoices(card).filter(
    (choice) =>
      !choice.locked &&
      (!choice.requiresFlag || state.flags.includes(choice.requiresFlag)),
  )
    assert.ok(choices.length > 0, `${card.id} keeps a playable decision`)
    const requested = choices.find((choice) => choice.lens === lens)
    const meeting = choices.filter((choice) => choice.meet !== undefined)
    const area = choices.filter((choice) => choice.prospect)
    let id: string
    if (!state.openingState && requested) id = requested.id
    else if (area.length && !state.prospect) id = area[seed % area.length]!.id
    else if (meeting.length) {
      const accept = policy === 'accept-all'
      id = (meeting.find((choice) => choice.meet === accept) ?? meeting[0])!.id
    } else id = [...choices].sort((a, b) => a.id.localeCompare(b.id))[0]!.id
    const result = chooseBeat(state, id)
    assert.ok(result.pending, `${card.id}/${id} resolves`)
    state = advance(result)
  }
  return state
}

const metBy = new Map<string, Set<string>>() // `${lens}` -> companions met
for (const lens of STATES) metBy.set(lens, new Set())
let declinedThenReconnected = 0
let runs = 0

for (const archetype of ARCHETYPES) {
  for (const lens of STATES) {
    for (const event of EVENTS) {
      for (const policy of [
        'decline-then-follow',
        'decline-always',
        'accept-all',
      ] as Policy[]) {
        const seed = 7 + (runs % 5)
        const run = play(event.id, lens, archetype.id, seed, policy)
        runs += 1
        const tag = `${archetype.id}/${lens}/${event.id}/${policy}`
        assert.ok(run.ending, `${tag} reaches an ending`)
        assert.equal(run.openingState, lens, `${tag} keeps its opening state`)
        assert.ok(
          Number.isInteger(run.clarity) && run.clarity >= 0 && run.clarity <= 8,
          `${tag} clarity stays a recoverable bounded meter`,
        )
        assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(run))), run)
        for (const id of run.meetingOrder) metBy.get(lens)!.add(id)
        if (policy === 'decline-then-follow' && run.followHistory.length)
          declinedThenReconnected += 1
      }
    }
  }
}

// Every companion stays reachable from every opening state: a first-encounter
// shortcut is never the only way to meet someone.
for (const lens of STATES)
  for (const companion of COMPANIONS)
    assert.ok(
      metBy.get(lens)!.has(companion.id),
      `${companion.id} can be met after opening as ${lens}`,
    )
assert.ok(declinedThenReconnected > 0, 'declined invitations reconnect later')

// Cedar's parents stay together in every authored line.
const corpus = JSON.stringify(ALL_CARDS)
assert.doesNotMatch(
  corpus,
  /Cedar[^"]{0,120}parents[^"]{0,60}(divorc|split up|separat|broke up|left each other)/i,
  "Cedar's parents never separate",
)
assert.doesNotMatch(corpus, /parents_apart|parents_split|parents_divorce/)

console.log(`Ecotone companion continuity: ${runs} campaigns`)

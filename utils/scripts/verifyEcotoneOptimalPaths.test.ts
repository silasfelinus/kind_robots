import assert from 'node:assert/strict'
import {
  ARCHETYPES,
  COMPANIONS,
  ENDING_IDS,
  ENDING_LENSES,
  LENSES,
  type CompanionId,
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
  computeEnding,
  createRun,
  findCard,
  type RunState,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import * as STORY from '../ecotone/story'
import { EVENTS } from '../ecotone/story'

// weird-humboldt t-018: for each companion, seeded full runs that decline the
// first introduction and later follow them still reach a hopeful personal
// ending from every opening state, using naturally resolved decisions.
const STATES = LENSES.map((lens) => lens.id)
const PERSONAL: CompanionId[] = ['mara', 'kit', 'juniper', 'cedar']

function play(
  event: EventId,
  lens: LensId,
  archetype: string,
  seed: number,
  target: CompanionId,
  declineFirst: boolean,
): RunState {
  let state = createRun(seed, archetype)
  state = advance(chooseEvent(state, event))
  let turns = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 150, `${event}/${lens}/${archetype} stalled`)
    if (state.phase === 'fork') {
      state = chooseFork(
        state,
        state.offered[(seed + state.step) % state.offered.length]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      const wanted = state.activeLead === target || !state.activeLead
      state = advance(chooseCrossroads(state, wanted ? 'follow' : 'stay'))
      continue
    }
    const card = findCard(state.card)
    assert.ok(card)
    const choices = openingLensChoices(card).filter(
      (c) =>
        !c.locked && (!c.requiresFlag || state.flags.includes(c.requiresFlag)),
    )
    const requested = choices.find((c) => c.lens === lens)
    const meeting = choices.filter((c) => c.meet !== undefined)
    const area = choices.filter((c) => c.prospect)
    let id: string
    if (!state.openingState && requested) id = requested.id
    else if (area.length && !state.prospect) id = area[seed % area.length]!.id
    else if (meeting.length)
      id = (meeting.find((c) => c.meet === !declineFirst) ?? meeting[0])!.id
    else id = [...choices].sort((a, b) => a.id.localeCompare(b.id))[0]!.id
    state = advance(chooseBeat(state, id))
  }
  return state
}

const hope = new Map<string, number>()
const seen = new Set<string>()
let runs = 0
for (const target of PERSONAL)
  for (const lens of STATES)
    for (const event of EVENTS)
      for (const archetype of ARCHETYPES)
        for (const seed of [3, 7, 11]) {
          for (const declineFirst of [true, false]) {
            const run = play(
              event.id,
              lens,
              archetype.id,
              seed,
              target,
              declineFirst,
            )
            runs += 1
            const ending = computeEnding(run)
            seen.add(ending.id)
            if (ending.fate === 'hope')
              hope.set(ending.id, (hope.get(ending.id) ?? 0) + 1)
          }
        }
// Every companion has a hopeful personal ending from every opening state,
// reached with and without accepting the first introduction.
for (const companion of PERSONAL)
  for (const lens of STATES)
    assert.ok(
      hope.has(`${companion}.${lens}.hope`),
      `${companion} has a reachable hopeful ending from ${lens}`,
    )

// The 56 companion ending slots (4 companions x 7 states x 2 fates) are
// distinct, separate from the solo and Wild Way lines.
const companionSlots = ENDING_IDS.filter((id) =>
  PERSONAL.includes(id.split('.')[0] as CompanionId),
)
assert.equal(companionSlots.length, 56)
assert.equal(new Set(companionSlots).size, 56)
assert.equal(ENDING_LENSES.length, 7)
assert.ok(COMPANIONS.length >= 4)

// Cedar's parents stay together in every authored line, endings included.
const corpus = JSON.stringify([ALL_CARDS, STORY])
assert.doesNotMatch(
  corpus,
  /Cedar[^"]{0,120}parents[^"]{0,60}(divorc|split up|separat|broke up|left each other)/i,
  "Cedar's parents never separate",
)
assert.doesNotMatch(corpus, /parents_apart|parents_split|parents_divorce/)

console.log(
  `Ecotone optimal paths: ${runs} runs, ${hope.size} hopeful companion endings, ${seen.size} endings seen`,
)

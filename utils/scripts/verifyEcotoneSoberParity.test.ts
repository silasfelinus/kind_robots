import assert from 'node:assert/strict'
import { ARCHETYPES, LENSES } from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  findCard,
  restoreRun,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import { EVENTS } from '../ecotone/story'

// Sober parity: a player who abstains at every offer still finishes every
// event, reaches both a hope and a dark ending, passes through every chapter,
// and meets most of the story's cards. Substance is never required to see the story.
const SEEDS = Array.from({ length: 40 }, (_, index) => index + 1)

function soberJourney(event: (typeof EVENTS)[number]['id'], seed: number) {
  let state = createRun(seed, ARCHETYPES[seed % ARCHETYPES.length]!.id)
  state = advance(chooseEvent(state, event))
  let turns = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 125, `${event}/${seed} sober campaign stalled`)
    if (state.phase === 'fork') {
      state = chooseFork(
        state,
        state.offered[(seed + state.step) % state.offered.length]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, seed % 2 ? 'follow' : 'stay'))
      continue
    }
    const card = findCard(state.card)
    assert.ok(card, `${event}/${seed} offers only authored cards`)
    const choices = openingLensChoices(card).filter(
    (choice) =>
      !choice.locked &&
      (!choice.requiresFlag || state.flags.includes(choice.requiresFlag)),
  )
    assert.ok(choices.length > 0, `${card.id} keeps a playable decision`)
    const sober = choices.find((choice) => choice.lens === 'sober')
    const neutral = choices.filter((choice) => !choice.lens)
    const pool = !state.openingState && sober ? [sober] : neutral
    assert.ok(
      pool.length > 0,
      `${card.id} has a decision that needs no substance`,
    )
    // Even seeds play for the future (most goodwill and evidence), odd seeds
    // for the least; both must stay possible without substance.
    const value = (choice: (typeof pool)[number]) =>
      (choice.success.effects.goodwill ?? 0) +
      (choice.success.effects.evidence ? 1 : 0)
    const ranked = [...pool].sort(
      (a, b) =>
        (value(b) - value(a)) * (seed % 2 ? -1 : 1) || a.id.localeCompare(b.id),
    )
    const chosen = ranked[0]!
    const result = chooseBeat(state, chosen.id)
    assert.ok(result.pending, `${card.id}/${chosen.id} resolves`)
    state = advance(result)
  }
  return state
}

const chapters = new Set<number>()
const endings = new Set<string>()
const reached = new Set<string>()

for (const event of EVENTS) {
  const eventEndings = new Set<string>()
  for (const seed of SEEDS) {
    const run = soberJourney(event.id, seed)
    assert.ok(run.ending, `${event.id}/${seed} reaches an ending`)
    assert.equal(run.openingState, 'sober')
    assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(run))), run)
    eventEndings.add(run.ending!.split('.')[2]!)
    endings.add(run.ending!)
    for (const id of run.played) {
      reached.add(id)
      const card = findCard(id)
      if (card) chapters.add(card.chapter)
    }
  }
  assert.ok(eventEndings.has('hope'), `${event.id} sober route can end in hope`)
  assert.ok(eventEndings.has('dark'), `${event.id} sober route can end dark`)
}

for (const chapter of [1, 2, 3, 4, 5, 6])
  assert.ok(chapters.has(chapter), `sober route visits chapter ${chapter}`)
assert.ok(LENSES.some((lens) => lens.id === 'sober'))
assert.ok(reached.size >= 150, 'the sober route meets most of the story')
assert.ok(endings.size >= 6, 'the sober route reaches varied endings')
console.log(
  `Ecotone sober parity: ${endings.size} endings, ${reached.size} cards`,
)

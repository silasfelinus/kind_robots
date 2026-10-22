import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LOCATION_ATLAS_QUESTS } from '../ecotone/locationAtlasQuests'
import { ENCOUNTERS } from '../ecotone/content'
import {
  advance,
  chooseBeat,
  createRun,
  drawFork,
  findCard,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import {
  cardArtKey,
  ecotoneArtSlots,
  outcomeArtKey,
} from '../ecotone/artSlots'
import { allConceptArtPitches } from '../ecotone/conceptArtPitches'
import { isEcotoneReviewHeldArtSubject } from '../ecotone/reviewHold'
import { ROUTES } from '../ecotone/story'

const ids = ['LA-BAKER-01', 'LA-SOHUM-01', 'LA-FERNDALE-01', 'LA-CEMETERY-01']
const slots = ecotoneArtSlots()
const pitches = new Map(allConceptArtPitches().map((pitch) => [pitch.key, pitch]))
assert.deepEqual(LOCATION_ATLAS_QUESTS.map((card) => card.id), ids)
assert.equal(new Set(ENCOUNTERS.map((card) => card.id)).size, ENCOUNTERS.length)
let successes = 0
let failures = 0
let journeys = 0
const played = new Set<string>()
const seenInDraw = new Set<string>()

for (const card of LOCATION_ATLAS_QUESTS) {
  assert.equal(findCard(card.id)?.id, card.id)
  assert.ok(ENCOUNTERS.includes(card), 'quest is actually available in the encounter deck')
  assert.equal(card.choices.length, 3)
  assert.equal(card.body.length, 2)
  assert.ok(card.provenance.includes('fictional'))
  const artKeys = [
    cardArtKey(card.id),
    `paragraphs/${card.id.toLowerCase()}/2`,
    ...card.choices.flatMap((choice) => [
      outcomeArtKey(card.id, choice.id, 'success'),
      ...(choice.failure
        ? [outcomeArtKey(card.id, choice.id, 'failure')]
        : []),
    ]),
  ]
  for (const key of artKeys) {
    assert.ok(pitches.has(key), `missing generated visual brief for ${key}`)
    const pitch = pitches.get(key)!
    assert.ok(!isEcotoneReviewHeldArtSubject({
      asset: key,
      prompt: [pitch.title, pitch.placeTime, pitch.subject, pitch.action].join(' '),
    }), `excluded material leaked into art pitch ${key}`)
  }
  assert.ok(slots.cards.includes(cardArtKey(card.id)))
  for (const choice of card.choices) {
    assert.ok(slots.outcomes.includes(outcomeArtKey(card.id, choice.id, 'success')))
    if (choice.failure)
      assert.ok(slots.outcomes.includes(outcomeArtKey(card.id, choice.id, 'failure')))
  }
  const fork = ROUTES['green-ribbon'].findIndex((step) =>
    step.kind === 'fork' && step.pools.includes(card.chapter))
  assert.ok(fork >= 0, 'every new atlas card is in a reachable pool')

  for (let seed = 1; seed <= 500; seed += 1) {
    const start = createRun(seed, 'reporter')
    const run: RunState = {
      ...start,
      phase: 'beat',
      event: 'green-ribbon',
      step: fork,
      day: 2,
      card: card.id,
      openingState: 'sober',
      currentState: 'sober',
      pending: null,
    }
    const offered = drawFork({ ...run, phase: 'fork', card: null }, fork)
    if (offered.includes(card.id)) seenInDraw.add(card.id)
    for (const choice of card.choices) {
      const resolved = chooseBeat(run, choice.id)
      assert.equal(resolved.pending?.entry.source, card.id)
      assert.ok(resolved.flags.length > 0, 'choice leaves a tangible future flag')
      assert.ok(
        slots.outcomes.includes(resolved.pending?.entry.art ?? ''),
        'actual outcome owns an art key',
      )
      const roll = resolved.pending?.entry.roll
      if (roll) {
        if (roll.success) successes += 1
        else failures += 1
      }
      const restored = restoreRun(JSON.parse(JSON.stringify(resolved)))
      assert.deepEqual(restored, resolved)
      const continued = advance(resolved)
      assert.notEqual(continued.card, card.id, 'no unintended repeat loop')
      assert.ok(['beat','fork','crossroads','end'].includes(continued.phase))
      assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(continued))), continued)
      played.add(card.id)
      journeys += 1
    }
  }
}
assert.ok(successes > 250)
assert.ok(failures > 250)
assert.deepEqual([...played].sort(), [...ids].sort())
assert.deepEqual([...seenInDraw].sort(), [...ids].sort(), 'all four added quests appear in seeded real draws')
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(board, /questCallbacks/)
console.log(
  `Ecotone atlas: ${ids.length} playable stories, ${journeys} adversarial choice runs, ${successes} successes, ${failures} failures, all four seeded draws, ${ids.length} unique story-card art slots`,
)

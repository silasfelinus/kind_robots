import assert from 'node:assert/strict'
import { MIDDLE_ENCOUNTERS } from '../ecotone/middleEncounters'
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
import { cardArtKey, ecotoneArtSlots, outcomeArtKey } from '../ecotone/artSlots'
import { ECOTONE_CARD_ART_PROMPTS } from '../ecotone/artPrompts'
import { allConceptArtPitches } from '../ecotone/conceptArtPitches'
import { earnedQuestCallbacks } from '../ecotone/finaleExpansion'
import { REGIONAL_CALLBACKS } from '../ecotone/regionalCallbacks'
import { isEcotoneReviewHeldArtSubject } from '../ecotone/reviewHold'
import { ROUTES } from '../ecotone/story'

// The eight curated middle encounters (conductor weird-humboldt t-027; Silas,
// 2026-11-19 PT: "Go ahead and build the 8 candidate encounters").
const ids = [
  'MC-002',
  'MC-007',
  'MC-001',
  'MC-004',
  'MC-003',
  'MC-006',
  'MC-005',
  'MC-008',
]
const minChapter: Record<string, number> = {
  'MC-001': 3,
  'MC-002': 2,
  'MC-003': 4,
  'MC-004': 2,
  'MC-005': 5,
  'MC-006': 4,
  'MC-007': 2,
  'MC-008': 3,
}
assert.deepEqual(
  MIDDLE_ENCOUNTERS.map((card) => card.id),
  ids,
)
assert.equal(new Set(ENCOUNTERS.map((card) => card.id)).size, ENCOUNTERS.length)

const slots = ecotoneArtSlots()
const pitches = new Map(
  allConceptArtPitches().map((pitch) => [pitch.key, pitch]),
)
const banned =
  /\b(?:wiyot|tuluwat|indian island|tribal|tribe|indigenous|native californian|reservation|grave|burial)\b/i
let successes = 0
let failures = 0
let journeys = 0
const seenInDraw = new Map<string, Set<string>>()

for (const card of MIDDLE_ENCOUNTERS) {
  assert.equal(findCard(card.id)?.id, card.id)
  assert.ok(ENCOUNTERS.includes(card), `${card.id} is in the encounter deck`)
  assert.ok(card.chapter >= minChapter[card.id]!, `${card.id} chapter_min`)
  assert.equal(card.body.length, 2)
  assert.equal(card.choices.length, 3, 'two rolls and one honest third way')
  assert.equal(card.choices.filter((choice) => choice.check).length, 2)
  assert.ok(card.provenance.includes('fictional'))
  assert.ok(card.aloneLine, `${card.id} speaks to a solo player`)
  for (const lead of ['mara', 'kit', 'juniper', 'cedar'] as const)
    assert.ok(card.leadLines?.[lead], `${card.id} has a line for ${lead}`)
  const prose = JSON.stringify(card)
  assert.doesNotMatch(
    prose,
    banned,
    `${card.id} stays clear of excluded content`,
  )
  assert.doesNotMatch(
    prose,
    /\b(?:divorc|separated|split up)\w*/i,
    `${card.id} keeps Cedar’s parents together`,
  )
  for (const choice of card.choices) {
    assert.ok(choice.cost, `${card.id}/${choice.id} names its cost`)
    for (const outcome of [choice.success, choice.failure ?? null])
      if (outcome)
        assert.ok(outcome.effects.flag, `${card.id}/${choice.id} leaves a flag`)
  }

  const prompt = ECOTONE_CARD_ART_PROMPTS[cardArtKey(card.id)]
  assert.ok(prompt, `${card.id} has a literal card picture prompt`)
  assert.doesNotMatch(prompt, /\bMara\b/, 'the prompt never names Mara')
  assert.ok(
    !isEcotoneReviewHeldArtSubject({ asset: cardArtKey(card.id), prompt }),
  )
  const artKeys = [
    cardArtKey(card.id),
    `paragraphs/${card.id.toLowerCase()}/2`,
    ...card.choices.flatMap((choice) => [
      outcomeArtKey(card.id, choice.id, 'success'),
      ...(choice.failure ? [outcomeArtKey(card.id, choice.id, 'failure')] : []),
    ]),
  ]
  for (const key of artKeys)
    assert.ok(pitches.has(key), `missing visual brief for ${key}`)
  assert.ok(slots.cards.includes(cardArtKey(card.id)))

  // One earned finale callback per card, shown only once it is played.
  const callback = REGIONAL_CALLBACKS.find((item) => item.id === card.id)
  assert.ok(callback, `${card.id} has a finale callback`)
  assert.ok(
    earnedQuestCallbacks([callback.flag], [card.id]).includes(callback.text),
  )
  assert.ok(!earnedQuestCallbacks([callback.flag], []).includes(callback.text))

  // Reachable on every route that has a fork for its chapter.
  let reachable = 0
  for (const event of ['green-ribbon', 'kinetic', 'quiet'] as const) {
    const fork = ROUTES[event].findIndex(
      (step) => step.kind === 'fork' && step.pools.includes(card.chapter),
    )
    if (fork < 0) continue
    reachable += 1
    for (let seed = 1; seed <= 300; seed += 1) {
      const base: RunState = {
        ...createRun(seed, 'reporter'),
        event,
        step: fork,
        day: 2,
        openingState: 'sober',
        currentState: 'sober',
        pending: null,
      }
      const offered = drawFork({ ...base, phase: 'fork', card: null }, fork)
      if (offered.includes(card.id)) {
        const seen = seenInDraw.get(card.id) ?? new Set<string>()
        seen.add(event)
        seenInDraw.set(card.id, seen)
      }
      if (event !== 'green-ribbon') continue
      const run: RunState = { ...base, phase: 'beat', card: card.id }
      for (const choice of card.choices) {
        const resolved = chooseBeat(run, choice.id)
        assert.equal(resolved.pending?.entry.source, card.id)
        assert.ok(
          slots.outcomes.includes(resolved.pending?.entry.art ?? ''),
          'the actual outcome owns an art key',
        )
        const roll = resolved.pending?.entry.roll
        if (roll) {
          if (roll.success) successes += 1
          else failures += 1
        }
        assert.deepEqual(
          restoreRun(JSON.parse(JSON.stringify(resolved))),
          resolved,
        )
        const continued = advance(resolved)
        assert.notEqual(continued.card, card.id, 'no unintended repeat loop')
        assert.ok(
          ['beat', 'fork', 'crossroads', 'end'].includes(continued.phase),
        )
        journeys += 1
      }
    }
  }
  assert.ok(reachable >= 2, `${card.id} is reachable on at least two routes`)
}
assert.ok(successes > 300, 'rolled choices succeed')
assert.ok(failures > 300, 'rolled choices fail and have real consequences')
assert.deepEqual(
  [...seenInDraw.keys()].sort(),
  [...ids].sort(),
  'all eight appear in seeded real fork draws',
)
console.log(
  `Ecotone middle encounters: ${ids.length} cards, ${journeys} played choices (${successes} successes, ${failures} failures), drawn on ${[
    ...new Set([...seenInDraw.values()].flatMap((set) => [...set])),
  ].join('/')} routes, ${ids.length} finale callbacks`,
)

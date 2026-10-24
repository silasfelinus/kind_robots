import assert from 'node:assert/strict'
import { COMPANIONS } from '../ecotone/content'
import {
  chooseCrossroads,
  createRun,
  encounterEligible,
  type RunState,
} from '../ecotone/engine'
import { FORMER_GUIDE_QUESTS } from '../ecotone/formerGuideQuests'
import { QUEST_CARDS } from '../ecotone/questExpansion'
import { ROUTES } from '../ecotone/story'

// Juniper is a guide with her own motives: in every pairing that lets her
// guide, her scenes offer a choice that leaves her in charge of her own work,
// and every outcome records a distinct, Juniper-named consequence.
const census = QUEST_CARDS.find((card) => card.id === 'WH-012')!
const former = FORMER_GUIDE_QUESTS.find((card) => card.id === 'FR-JUNIPER-01')!
assert.ok(census && former)

const others = COMPANIONS.map((guide) => guide.id).filter(
  (id) => id !== 'juniper',
)
assert.equal(others.length, 3)

function atCrossroads(
  seed: number,
  initial: string,
  newcomer: string,
): RunState {
  return {
    ...createRun(seed, 'reporter'),
    phase: 'crossroads',
    event: 'quiet',
    step: ROUTES.quiet.findIndex((step) => step.kind === 'crossroads'),
    day: 2,
    openingState: 'sober',
    currentState: 'sober',
    prospect: initial,
    activeLead: initial,
    travelCompanions: [],
    meetingOrder: [initial],
    newcomerOrder: [newcomer],
  } as RunState
}

for (const other of others) {
  for (const seed of [3, 11, 19]) {
    const juniperLeads = atCrossroads(seed, 'juniper', other)
    assert.equal(
      encounterEligible(census, chooseCrossroads(juniperLeads, 'together')),
      true,
      'Juniper guides her census alongside ' + other,
    )
    assert.equal(
      encounterEligible(former, chooseCrossroads(juniperLeads, 'follow')),
      true,
      'Juniper keeps her own work after the player follows ' + other,
    )
    const otherLeads = atCrossroads(seed, other, 'juniper')
    assert.equal(
      encounterEligible(former, chooseCrossroads(otherLeads, 'together')),
      false,
      'a co-traveler is not a departed guide',
    )
  }
}

const flags = new Map<string, string>()
for (const card of [census, former]) {
  assert.ok(card.choices.length >= 3, card.id + ' offers real alternatives')
  assert.match(card.body.join(' '), /Juniper/)
  for (const choice of card.choices) {
    const outcomes = [choice.success, choice.failure].filter(Boolean)
    assert.ok(outcomes.length >= 1)
    for (const outcome of outcomes) {
      const flag = outcome!.effects?.flag
      assert.ok(flag && flag.startsWith('juniper_'), card.id + '/' + choice.id)
      assert.equal(
        flags.has(flag),
        false,
        'each Juniper outcome records its own flag: ' + flag,
      )
      flags.set(flag, card.id + '/' + choice.id)
    }
  }
}

// Each scene has an outcome where the player defers to Juniper's judgment and
// one where she is answered by other people instead of being obeyed.
assert.ok(census.choices.some((choice) => choice.id === 'gate'))
assert.ok(former.choices.some((choice) => choice.id === 'step-away'))
assert.match(JSON.stringify(census.body), /not obedience/)
assert.match(
  JSON.stringify(former.choices.find((c) => c.id === 'step-away')),
  /decide whether to return/,
)

console.log('Ecotone Juniper agency tests passed')

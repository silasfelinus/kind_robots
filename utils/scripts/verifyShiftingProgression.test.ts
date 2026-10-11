import assert from 'node:assert/strict'
import {
  AUTHORED_PACK,
  newAuthoredJourney,
  stepAuthoredJourney,
  type AuthoredJourneyState,
  type AuthoredResult,
} from '../shiftingLands/authoredJourney'
import {
  reachableLocations,
  type JourneyRoll,
  type Skill,
} from '../shiftingLands/journey'
import {
  canUseJourneyReward,
  checkJourneySkill,
  journeyCharacterSheet,
} from '../shiftingLands/progression'

const bonuses: Record<Skill, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}

function withCommittedOutcome(
  state: AuthoredJourneyState,
  encounterId: string,
  choiceId: string,
  success: boolean,
): AuthoredJourneyState {
  const card = AUTHORED_PACK.encounters.find((item) => item.id === encounterId)!
  const choice = card.choices.find((item) => item.id === choiceId)!
  const effect = success ? choice.success : choice.failure
  const dice: [number, number] = success ? [6, 6] : [1, 1]
  const modifier = bonuses[choice.roll.skill] + choice.roll.modifier
  const total = dice[0] + dice[1] + modifier
  assert.equal(total >= choice.roll.target, success)
  const turn = state.journey.turn + 1
  const roll: JourneyRoll = {
    landId: 'homestead',
    locationId: card.locationId,
    dice,
    skill: choice.roll.skill,
    modifier,
    difficulty: choice.roll.target,
    total,
    success,
  }
  const outcome: AuthoredResult = {
    locationId: card.locationId,
    encounterId,
    choiceId,
    turn,
    roll,
    resultText: effect.text,
    hpChange: effect.hp_delta,
    provisionChange: effect.provisions_delta,
    flags: effect.add_flags,
  }
  return {
    ...state,
    drawn: { ...state.drawn, [card.locationId]: encounterId },
    outcomes: [...state.outcomes, outcome],
    journey: {
      ...state.journey,
      turn,
      resolved: [
        ...state.journey.resolved,
        {
          landId: 'homestead',
          locationId: card.locationId,
          turn,
          approach: 'test',
          roll,
          hpChange: effect.hp_delta,
          provisionChange: effect.provisions_delta,
        },
      ],
    },
  }
}

const initial = newAuthoredJourney(77)
const start = journeyCharacterSheet(initial)
assert.equal(start.hp, 8)
assert.equal(start.maxHp, 8)
assert.equal(start.provisions, 2)
assert.equal(start.skills.steel, 3)
assert.equal(start.skills.wits, 2)
assert.deepEqual(start.inventory, [])
assert.deepEqual(start.relationships, [])
assert.equal(checkJourneySkill(start, 'steel', 10, [3, 4])?.success, true)
assert.equal(checkJourneySkill(start, 'steel', 11, [3, 4])?.success, false)
assert.equal(checkJourneySkill(start, 'steel', 8, [0, 7]), null)
assert.equal(checkJourneySkill(start, 'steel', 80, [3, 3]), null)

const repaired = withCommittedOutcome(
  initial,
  'the-orchard-debt',
  'brace-axle',
  true,
)
const trained = withCommittedOutcome(
  repaired,
  'rope-at-dawn',
  'tie-new-knot',
  true,
)
const trainedSheet = journeyCharacterSheet(trained)
assert.equal(trainedSheet.techniques.length, 2)
assert.equal(trainedSheet.skills.wits, 3, 'two lessons grant at most +1')
assert.equal(trainedSheet.skills.steel, 3)
assert.equal(checkJourneySkill(trainedSheet, 'wits', 10, [3, 4])?.success, true)
assert.equal(trainedSheet.resolvedEncounters, 2)

const herbal = withCommittedOutcome(
  initial,
  'a-cup-offered',
  'ask-ingredients',
  true,
)
const herbalSheet = journeyCharacterSheet(herbal)
assert.equal(herbalSheet.inventory[0]?.id, 'willow-bark-dose')
assert.equal(herbalSheet.inventory[0]?.kind, 'medicine')
assert.equal(canUseJourneyReward(herbalSheet, 'willow-bark-dose'), true)
assert.equal(
  canUseJourneyReward(herbalSheet, 'willow-bark-dose', ['willow-bark-dose']),
  false,
  'already-used rewards cannot be spent twice',
)
assert.equal(canUseJourneyReward(herbalSheet, 'unearned-reward'), false)

const ribbon = withCommittedOutcome(
  initial,
  'the-locked-dormitory',
  'search-lock',
  true,
)
const ribbonSheet = journeyCharacterSheet(ribbon)
assert.equal(ribbonSheet.inventory[0]?.id, 'ribbon-evidence')
assert.equal(
  canUseJourneyReward(ribbonSheet, 'ribbon-evidence'),
  false,
  'evidence is not a consumable',
)
assert.equal(
  ribbonSheet.relationships.length,
  0,
  'encounter cast is not automatically a companion',
)

const welcomed = withCommittedOutcome(
  initial,
  'family-at-the-fence',
  'honor-guest',
  true,
)
const welcomeSheet = journeyCharacterSheet(welcomed)
assert.deepEqual(
  welcomeSheet.relationships.map((relation) => relation.disposition),
  ['trusted'],
)
assert.equal(welcomeSheet.relationships[0]?.traveling, false)
const excluded = withCommittedOutcome(
  initial,
  'family-at-the-fence',
  'honor-guest',
  false,
)
assert.equal(
  journeyCharacterSheet(excluded).relationships[0]?.disposition,
  'wary',
)

const injury = withCommittedOutcome(
  initial,
  'rope-at-dawn',
  'take-the-rope',
  false,
)
assert.equal(journeyCharacterSheet(injury).conditions[0]?.id, 'rope-burn')
assert.equal(journeyCharacterSheet(injury).skills.steel, 2)

const repeated = {
  ...herbal,
  outcomes: [...herbal.outcomes, herbal.outcomes[0]!],
}
assert.equal(
  journeyCharacterSheet(repeated).inventory.length,
  1,
  'one location cannot farm items',
)

const forgedProse = {
  ...herbal,
  outcomes: [
    {
      ...herbal.outcomes[0]!,
      resultText: 'Someone gave Zuzu all their treasure.',
    },
  ],
}
assert.deepEqual(journeyCharacterSheet(forgedProse).inventory, [])
const forgedFlags = {
  ...herbal,
  outcomes: [{ ...herbal.outcomes[0]!, flags: ['spoofed-reward'] }],
}
assert.deepEqual(journeyCharacterSheet(forgedFlags).inventory, [])
const forgedDraw = { ...herbal, drawn: {} }
assert.deepEqual(journeyCharacterSheet(forgedDraw).inventory, [])
const uncommitted = {
  ...herbal,
  journey: { ...herbal.journey, resolved: [] },
}
assert.deepEqual(journeyCharacterSheet(uncommitted).inventory, [])

let actual = newAuthoredJourney(20261009)
const first = reachableLocations(actual.journey)[0]!
actual = stepAuthoredJourney(actual, { type: 'TRAVEL', locationId: first })
const drawnId = actual.drawn[first]!
const selected = AUTHORED_PACK.encounters.find((item) => item.id === drawnId)!
actual = stepAuthoredJourney(actual, {
  type: 'CHOOSE',
  choiceId: selected.choices[0]!.id,
})
const liveSheet = journeyCharacterSheet(actual)
assert.equal(liveSheet.resolvedEncounters, 1)
assert.equal(liveSheet.hp, actual.journey.hp)
assert.equal(liveSheet.provisions, actual.journey.provisions)
assert.equal(
  liveSheet.inventory.every((item) => item.sourceEncounterId === drawnId),
  true,
)

console.log(
  'Shifting Lands progression contract passed: authored rewards, bounded skills, conditions, bonds, dice and no farming',
)

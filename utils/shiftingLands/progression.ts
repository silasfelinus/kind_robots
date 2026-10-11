import {
  AUTHORED_PACK,
  type AuthoredJourneyState,
  type AuthoredResult,
} from './authoredJourney'
import type { Skill } from './journey'

export type JourneyInventoryItem = {
  id: string
  name: string
  kind: 'supply' | 'medicine' | 'evidence'
  sourceEncounterId: string
  available: boolean
}

export type JourneyTechnique = {
  id: string
  name: string
  skill: Skill
  sourceEncounterId: string
}

export type JourneyCondition = {
  id: string
  name: string
  penaltySkill: Skill
  sourceEncounterId: string
}

export type JourneyRelationship = {
  id: string
  name: string
  disposition: 'trusted' | 'wary'
  sourceEncounterId: string
  traveling: false
}

export type JourneyCharacterSheet = {
  hp: number
  maxHp: 8
  provisions: number
  skills: Record<Skill, number>
  techniques: JourneyTechnique[]
  inventory: JourneyInventoryItem[]
  conditions: JourneyCondition[]
  relationships: JourneyRelationship[]
  resolvedEncounters: number
}

const BASE_SKILLS: Record<Skill, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}

type EarnedReward = Omit<JourneyInventoryItem, 'sourceEncounterId' | 'available'>
type EarnedTechnique = Omit<JourneyTechnique, 'sourceEncounterId'>
type EarnedCondition = Omit<JourneyCondition, 'sourceEncounterId'>
type EarnedRelationship = Omit<JourneyRelationship, 'sourceEncounterId'>

type ProgressionRule = {
  encounterId: string
  choiceId: string
  success: boolean
  item?: EarnedReward
  technique?: EarnedTechnique
  condition?: EarnedCondition
  relationship?: EarnedRelationship
}

// Progression belongs to a specific authored outcome, never a random species/job
// roll. Only what the actual prose grants is represented as a physical item.
const RULES: ProgressionRule[] = [
  {
    encounterId: 'scarecrows-lantern',
    choiceId: 'cut-the-line',
    success: true,
    item: { id: 'recovered-rations', name: 'Recovered ration pouch', kind: 'supply' },
  },
  {
    encounterId: 'a-cup-offered',
    choiceId: 'ask-ingredients',
    success: true,
    item: { id: 'willow-bark-dose', name: 'Wrapped willow-bark dose', kind: 'medicine' },
  },
  {
    encounterId: 'a-cup-offered',
    choiceId: 'drink-first',
    success: true,
    item: { id: 'willow-bark-dose', name: 'Second herbal dose', kind: 'medicine' },
  },
  {
    encounterId: 'the-locked-dormitory',
    choiceId: 'search-lock',
    success: true,
    item: { id: 'ribbon-evidence', name: 'Ribbon from the dormitory hinge', kind: 'evidence' },
  },
  {
    encounterId: 'the-orchard-debt',
    choiceId: 'brace-axle',
    success: true,
    technique: { id: 'field-repairs', name: 'Field repairs', skill: 'wits' },
  },
  {
    encounterId: 'rope-at-dawn',
    choiceId: 'tie-new-knot',
    success: true,
    technique: { id: 'ropework', name: 'Ropework', skill: 'wits' },
  },
  {
    encounterId: 'rope-at-dawn',
    choiceId: 'take-the-rope',
    success: false,
    condition: { id: 'rope-burn', name: 'Burned palm', penaltySkill: 'steel' },
  },
  {
    encounterId: 'a-cup-offered',
    choiceId: 'drink-first',
    success: false,
    condition: { id: 'herbal-dizziness', name: 'Herbal dizziness', penaltySkill: 'awareness' },
  },
  {
    encounterId: 'family-at-the-fence',
    choiceId: 'honor-guest',
    success: true,
    relationship: {
      id: 'orchard-household',
      name: 'Orchard household',
      disposition: 'trusted',
      traveling: false,
    },
  },
  {
    encounterId: 'family-at-the-fence',
    choiceId: 'honor-guest',
    success: false,
    relationship: {
      id: 'orchard-household',
      name: 'Orchard household',
      disposition: 'wary',
      traveling: false,
    },
  },
  {
    encounterId: 'a-crust-for-the-road',
    choiceId: 'thank-with-bow',
    success: true,
    relationship: {
      id: 'kitchen-novice',
      name: 'Kitchen novice',
      disposition: 'trusted',
      traveling: false,
    },
  },
]

// A saved result must agree with the source card, selected choice, exact
// outcome prose and committed location check. A forged flag or uncommitted
// future scene must never award a Reward, technique or relationship.
function verifiedResult(
  state: AuthoredJourneyState,
  outcome: AuthoredResult,
): boolean {
  const card = AUTHORED_PACK.encounters.find(
    (encounter) => encounter.id === outcome.encounterId,
  )
  const choice = card?.choices.find((candidate) => candidate.id === outcome.choiceId)
  const committed = state.journey.resolved.find(
    (result) => result.locationId === outcome.locationId,
  )
  if (!card || !choice || !committed) return false
  const effect = outcome.roll?.success ? choice.success : choice.failure
  return (
    card.locationId === outcome.locationId &&
    state.drawn[outcome.locationId] === card.id &&
    committed.approach === 'test' &&
    committed.turn === outcome.turn &&
    committed.roll?.total === outcome.roll?.total &&
    committed.roll?.success === outcome.roll?.success &&
    outcome.roll?.skill === choice.roll.skill &&
    outcome.roll?.difficulty === choice.roll.target &&
    outcome.resultText === effect.text &&
    Array.isArray(outcome.flags) &&
    outcome.flags.length === effect.add_flags.length &&
    [...outcome.flags].sort().every((flag, index) => flag === [...effect.add_flags].sort()[index])
  )
}

export function journeyCharacterSheet(
  state: AuthoredJourneyState,
): JourneyCharacterSheet {
  const inventory: JourneyInventoryItem[] = []
  const techniques: JourneyTechnique[] = []
  const conditions: JourneyCondition[] = []
  const relationships: JourneyRelationship[] = []
  const seenLocations = new Set<string>()
  const seenRewards = new Set<string>()

  for (const outcome of [...state.outcomes].sort((a, b) => a.turn - b.turn)) {
    if (
      seenLocations.has(outcome.locationId) ||
      !verifiedResult(state, outcome)
    ) continue
    seenLocations.add(outcome.locationId)
    for (const rule of RULES) {
      if (
        rule.encounterId !== outcome.encounterId ||
        rule.choiceId !== outcome.choiceId ||
        rule.success !== outcome.roll.success
      ) continue
      if (rule.item && !seenRewards.has(rule.item.id)) {
        inventory.push({
          ...rule.item,
          sourceEncounterId: outcome.encounterId,
          available: true,
        })
        seenRewards.add(rule.item.id)
      }
      if (rule.technique && !techniques.some((item) => item.id === rule.technique!.id))
        techniques.push({ ...rule.technique, sourceEncounterId: outcome.encounterId })
      if (rule.condition && !conditions.some((item) => item.id === rule.condition!.id))
        conditions.push({ ...rule.condition, sourceEncounterId: outcome.encounterId })
      if (rule.relationship && !relationships.some((item) => item.id === rule.relationship!.id))
        relationships.push({ ...rule.relationship, sourceEncounterId: outcome.encounterId })
    }
  }

  const skills = { ...BASE_SKILLS }
  for (const skill of Object.keys(BASE_SKILLS) as Skill[]) {
    // Advancement is deliberately bounded. Two repair lessons cannot stack
    // into an indefinitely escalating combat/stat advantage.
    if (techniques.some((technique) => technique.skill === skill))
      skills[skill] += 1
    if (conditions.some((condition) => condition.penaltySkill === skill))
      skills[skill] = Math.max(0, skills[skill] - 1)
  }
  return {
    hp: state.journey.hp,
    maxHp: 8,
    provisions: state.journey.provisions,
    skills,
    techniques,
    inventory,
    conditions,
    relationships,
    resolvedEncounters: state.journey.resolved.length,
  }
}

export function canUseJourneyReward(
  sheet: JourneyCharacterSheet,
  rewardId: string,
  alreadyUsed: readonly string[] = [],
): boolean {
  return !alreadyUsed.includes(rewardId) &&
    sheet.inventory.some((item) =>
      item.id === rewardId && item.available && item.kind !== 'evidence',
    )
}

// Pure preview of a check. Existing v2 encounter saves keep their recorded
// modifiers; adoption of technique modifiers in live rolls needs t-009's
// explicit save version/replay migration, not silent retroactive re-scoring.
export function checkJourneySkill(
  sheet: JourneyCharacterSheet,
  skill: Skill,
  target: number,
  dice: readonly [number, number],
): { total: number; modifier: number; success: boolean } | null {
  if (
    !Object.hasOwn(sheet.skills, skill) ||
    !Number.isInteger(target) ||
    target < 2 ||
    target > 30 ||
    dice.length !== 2 ||
    dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)
  ) return null
  const modifier = sheet.skills[skill]
  const total = dice[0] + dice[1] + modifier
  return { total, modifier, success: total >= target }
}

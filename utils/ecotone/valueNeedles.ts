import type { RunState } from './engine'
import { rollDice } from './engine'
import { SUBSTANCE_CHOICES, type SubstanceId } from './substanceArc'

/**
 * Ecotone's four pre-existing thematic fault lines. These are not virtue scores,
 * real-world pharmacology or guaranteed fates: they weight fictional finale rolls.
 */
export const VALUE_AXES = [
  { id: 'autonomy', left: 'Autonomy', right: 'Solidarity', question: 'My freedom, or what we owe one another?' },
  { id: 'continuity', left: 'Continuity', right: 'Reinvention', question: 'What should survive, and what should change?' },
  { id: 'ecology', left: 'Ecology', right: 'Engineering', question: 'Living systems, built systems, or their uneasy alliance?' },
  { id: 'agency', left: 'Agency', right: 'Fate', question: 'Can a forecast be changed by what we do?' },
] as const

export type ValueAxisId = (typeof VALUE_AXES)[number]['id']
export type ValueRoll = {
  id: ValueAxisId
  left: string
  right: string
  question: string
  chemistry: number
  decisions: number
  pull: number
  dice: [number, number]
  total: number
  outcome: string
  /** On a 0-100 scale: this is the accumulated lean before the die roll. */
  position: number
}

type Vector = readonly [number, number, number, number]

/**
 * Each voluntary scene changes which question the story foregrounds, never
 * what a real person must believe. Coffee + cannabis are intentionally opposed
 * on the Ecology/Engineering axis and may cancel one another.
 */
const MOMENT_PERSPECTIVES: Record<SubstanceId, Vector> = {
  alcohol: [1, 0, 0, 0],
  cannabis: [0, 0, -1, 0],
  coffee: [0, 0, 1, -1],
  psychedelic: [0, 1, 0, 1],
  cocaine: [-1, 1, 0, 0],
  meth: [0, 0, 1, -1],
  mdma: [1, 0, 0, -1],
}

/** Concrete, earned flags only. Unknown flags are not guessed into politics. */
const DECISION_PERSPECTIVES: Record<string, Vector> = {
  peaches_shared: [2, 0, 0, 0],
  peach_receipt_kept: [0, -1, 0, -1],
  fair_second_station: [2, 0, 0, 0],
  fair_schedule_verified: [0, 0, 0, -1],
  fair_consent_agreement: [1, 0, 0, -1],
  juniper_closed_path: [-2, 0, -1, 0],
  juniper_habitat_verified: [0, 0, -1, -1],
  juniper_human_allies_trusted: [2, 0, -1, 0],
  kit_collaborator_credit_kept: [2, 0, 0, 0],
  kit_workshop_kept_public: [1, 2, 0, 0],
  kit_refused_buyout: [-1, 0, 0, 0],
  cocaine_union_terms: [2, 0, 0, 0],
}

function capped(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value))
}

export function philosophyNeedles(
  state: Pick<RunState, 'seed' | 'substanceMoments' | 'log'>,
): ValueRoll[] {
  const chemistry = [0, 0, 0, 0]
  const decisions = [0, 0, 0, 0]
  for (const { id } of SUBSTANCE_CHOICES) {
    const count = state.substanceMoments.filter((m) => m.selected.includes(id)).length
    // One-time experimentation matters; repetition matters more, but a binge
    // cannot be farmed for unlimited ideological power.
    const strength = count >= 3 ? 2 : count > 0 ? 1 : 0
    MOMENT_PERSPECTIVES[id].forEach((delta, i) => {
      chemistry[i] = (chemistry[i] ?? 0) + delta * strength
    })
  }
  // An intentional break moves the agency question, without erasing history.
  const breaks = state.substanceMoments.filter(
    (m, index) => index > 0 && m.selected.length === 0,
  ).length
  chemistry[3] = (chemistry[3] ?? 0) - Math.min(2, breaks)
  for (const entry of state.log) {
    const flag = entry.effects.flag
    const written = flag ? DECISION_PERSPECTIVES[flag] : undefined
    const regionalCare = flag?.endsWith('_care') ? ([1, 0, 0, 0] as const) : undefined
    const verified = flag?.endsWith('_verified') ? ([0, 0, 0, -1] as const) : undefined
    const vector = written ?? regionalCare ?? verified
    if (!vector) continue
    vector.forEach((delta, i) => {
      decisions[i] = (decisions[i] ?? 0) + delta
    })
  }

  return VALUE_AXES.map((axis, i) => {
    const chemicalLean = capped(chemistry[i] ?? 0, 2)
    const decisionLean = capped(decisions[i] ?? 0, 3)
    const pull = capped(chemicalLean + decisionLean, 4)
    const dice = rollDice(state.seed, 9000 + i)
    const total = dice[0] + dice[1] + pull
    const outcome = total === 7 ? 'In tension' : total < 7 ? axis.left : axis.right
    return {
      ...axis,
      chemistry: chemicalLean,
      decisions: decisionLean,
      pull,
      dice,
      total,
      outcome,
      position: Math.max(8, Math.min(92, 50 + pull * 10)),
    }
  })
}

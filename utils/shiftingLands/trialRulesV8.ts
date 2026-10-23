import type { TrialChoice } from './authoredBosses'
import { trialForLandV7 } from './trialRulesV7'

// V8 only. Never mutate V7 choices in place: old action ledgers must replay
// with the exact targets that were in force when those journeys were saved.
export const TRIAL_RULES_V8 = 1

export function trialForLandV8(landId: string) {
  const base = trialForLandV7(landId)
  if (!base) return null
  const verge = landId === 'verge'
  const tuned: TrialChoice[] = base.choices.map((choice) => {
    if (choice.id === 'scout')
      return {
        ...choice,
        target: verge ? 9 : 8,
        intent:
          'Spend 1 HP preparing to find a genuinely safer route. An earned scouting plan uses Awareness and improves your odds without harming travelers.',
      }
    if (choice.id === 'witness')
      return {
        ...choice,
        target: verge ? 10 : 9,
        intent:
          'Your two or more earned mercy/honesty deeds now bring credible witnesses who improve your chance at an unbought passage.',
      }
    if (choice.id === 'solidarity')
      return {
        ...choice,
        target: verge ? 9 : 8,
        intent:
          'Four mercy and two honesty marks earn a united community approach. Harder to unlock than coercion, safer once the people stand together.',
      }
    return { ...choice }
  })
  return { ...base, choices: tuned }
}

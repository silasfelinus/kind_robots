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
        target: verge ? 10 : 9,
        intent:
          'Take the safer way you found while scouting, paid for in your own strength. You know where to step now, and no traveler pays for your crossing.',
      }
    if (choice.id === 'witness')
      return {
        ...choice,
        target: verge ? 11 : 10,
        intent:
          'The people you helped have come to speak for you. With witnesses who know your deeds at your back, the way opens more easily, and nobody is paid off.',
      }
    if (choice.id === 'solidarity')
      return {
        ...choice,
        target: verge ? 10 : 9,
        intent:
          'Everyone you protected stands at your side. It was harder to earn than a threat, and it holds steadier once they stand together.',
      }
    return { ...choice }
  })
  return { ...base, choices: tuned }
}

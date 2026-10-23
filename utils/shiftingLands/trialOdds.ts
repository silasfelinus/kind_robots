import type { TrialChoice } from './authoredBosses'

// Exact 2d6 distribution, not an implied certainty from a difficulty label.
// Shared by player-facing odds and seeded adversarial policies.
const SKILL_BONUS: Record<TrialChoice['skill'], number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}

export function trialSuccessOutcomes(choice: TrialChoice): number {
  const needed = choice.target - SKILL_BONUS[choice.skill]
  let wins = 0
  for (let first = 1; first <= 6; first++)
    for (let second = 1; second <= 6; second++)
      if (first + second >= needed) wins++
  return wins
}

export function trialSuccessPercent(choice: TrialChoice): number {
  return Math.round((trialSuccessOutcomes(choice) * 1000) / 36) / 10
}

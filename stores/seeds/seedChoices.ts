// /stores/seeds/seedChoices.ts
import { characterChoices } from './characterChoices'
import { botChoices } from './botChoices'
import { scenarioChoices } from './scenarioChoices'
import { pitchChoices } from './pitchChoices'
import { chatChoices } from './chatChoices'
import { rewardChoices } from './rewardChoices'

import type { ChoiceEntry } from '@/stores/choiceStore'

export const allSeeds: ChoiceEntry[] = [
  ...characterChoices,
  ...botChoices,
  ...scenarioChoices,
  ...pitchChoices,
  ...chatChoices,
  ...rewardChoices,
]

export function loadAllChoiceSeeds(
  choiceStore: ReturnType<typeof useChoiceStore>,
) {
  allSeeds.forEach(({ label, model, options }) => {
    choiceStore.registerChoice(label, model, options)
  })
}

// /stores/seeds/seedChoices.ts
import { characterChoices } from './characterSeeds'
import { botChoices } from './botSeeds'
import { scenarioChoices } from './scenarioSeeds'
import { pitchChoices } from './pitchSeeds'
import { chatChoices } from './chatSeeds'
import { rewardChoices } from './rewardSeeds'

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

// /stores/seeds/seedChoices.ts
import { useChoiceStore } from '@/stores/choiceStore'

import { characterChoices } from './characterSeeds'
import { botChoices } from './botSeeds'
import { scenarioChoices } from './scenarioSeeds'
import { pitchChoices } from './pitchSeeds'
import { rewardChoices } from './rewardSeeds'

const allSeeds = [
  ...characterChoices,
  ...botChoices,
  ...scenarioChoices,
  ...pitchChoices,
  ...rewardChoices,
]

const choiceStore = useChoiceStore()

allSeeds.forEach(({ label, model, options }) => {
  choiceStore.registerChoice(label, model, options)
})
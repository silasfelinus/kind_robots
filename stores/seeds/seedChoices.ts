// /stores/seeds/seedChoices.ts
import { useChoiceStore } from '@/stores/choiceStore'

import { characterChoices } from './seedCharacters'
import { botChoices } from './seedBots'
import { scenarioChoices } from './seedScenarios'
import { pitchChoices } from './seedPitches'
import { rewardChoices } from './seedRewards'

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
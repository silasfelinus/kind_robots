// /server/utils/suggest/sheets/index.ts
import adventureSuggest from './adventureSuggest'
import pitchSuggest from './pitchSuggest'
import stageSuggest from './stageSuggest'
import botSuggest from './botSuggest'
import scenarioSuggest from './scenarioSuggest'
import rewardSuggest from './rewardSuggest'
import dreamSuggest from './dreamSuggest'
import type { SuggestSheet } from '../suggestTypes'

export const suggestSheets = [
  adventureSuggest,
  pitchSuggest,
  stageSuggest,
  botSuggest,
  scenarioSuggest,
  rewardSuggest,
  dreamSuggest,
] satisfies SuggestSheet[]

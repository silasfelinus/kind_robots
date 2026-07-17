// /server/utils/suggest/sheets/index.ts
import adventureSuggest from './adventureSuggest'
import stageSuggest from './stageSuggest'
import botSuggest from './botSuggest'
import scenarioSuggest from './scenarioSuggest'
import rewardSuggest from './rewardSuggest'
import dreamSuggest from './dreamSuggest'
import modelBuilderSuggest from './modelBuilderSuggest'
import packmakerSuggest from './packmakerSuggest'
import type { SuggestSheet } from '../suggestTypes'

export const suggestSheets = [
  adventureSuggest,
  stageSuggest,
  botSuggest,
  scenarioSuggest,
  rewardSuggest,
  dreamSuggest,
  modelBuilderSuggest,
  packmakerSuggest,
] satisfies SuggestSheet[]

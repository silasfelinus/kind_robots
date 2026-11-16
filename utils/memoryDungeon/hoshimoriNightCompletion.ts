import { FURNACE_ENDINGS, type FurnaceProgress } from './furnaceOfNames'
import {
  HOSHIMORI_NIGHT_SITES,
  restoreHoshimoriNight,
  type NightProgress,
} from './hoshimoriNight'
import {
  chooseMemoryPairEnding,
  completeMemoryExperience,
  type MemoryCampaignProgress,
} from './reimaginerCampaign'

const COUNCIL_ENDINGS = {
  'allow-departure': 'unbar-all-doors',
  'require-consent': 'keep-shelter-charter',
} as const

/**
 * Closes e08 only after the complete authored night route and a real Furnace
 * exit have both replayed successfully. The council choice owns the campaign
 * consequence; the three Furnace endings remain distinct local outcomes.
 */
export function concludeHoshimoriNight(
  campaign: MemoryCampaignProgress,
  night: NightProgress,
  furnace: FurnaceProgress,
): MemoryCampaignProgress | null {
  if (
    campaign.completed.includes('e08') ||
    !campaign.completed.includes('e07') ||
    !furnace.completed ||
    !furnace.ending ||
    !FURNACE_ENDINGS.includes(furnace.ending)
  )
    return null

  const restored = restoreHoshimoriNight(
    JSON.parse(JSON.stringify(night)) as unknown,
  )
  if (
    !restored ||
    restored.visited.length !== HOSHIMORI_NIGHT_SITES.length ||
    Object.keys(restored.choices).length !== HOSHIMORI_NIGHT_SITES.length
  )
    return null

  const councilChoice = restored.choices['4,4']
  const pairEnding =
    COUNCIL_ENDINGS[councilChoice as keyof typeof COUNCIL_ENDINGS]
  if (!pairEnding) return null

  try {
    const decided = chooseMemoryPairEnding(campaign, 'e08', pairEnding)
    return completeMemoryExperience(decided, 'e08')
  } catch {
    return null
  }
}

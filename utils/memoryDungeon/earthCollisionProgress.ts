import earthCollision from './earthCollision.json'
import { BRIAR_COLLISION_SCENES } from './briarCollision'
import { replayEarthJournal } from './earthJournal'
import { restoreHoshimoriWarm } from './hoshimoriWarm'
import {
  MEMORY_PAIR_ENDINGS,
  availableMemoryExperiences,
  recoverMemoryCollisionFragment,
  type MemoryCampaignProgress,
} from './reimaginerCampaign'

/**
 * World Ten must inherit actual Hoshimori and Briar decisions. A completed
 * campaign flag alone cannot fabricate Vesper's charter or Pip's witnesses.
 */
export function earthCollisionHistory(
  campaign: MemoryCampaignProgress,
  hoshimoriSave: unknown,
  briarJournal: unknown,
): { tideGate: string; charter: 'consent' | 'open'; office: string } | null {
  if (
    !campaign.finaleCommitted ||
    !campaign.completed.includes('e07') ||
    !campaign.completed.includes('e09') ||
    !availableMemoryExperiences(campaign).includes('e10') ||
    !campaign.recoveredFragments?.includes('briar-office-key') ||
    !campaign.recoveredFragments?.includes('briar-tide-roots')
  )
    return null

  const tideGate = campaign.pairDecisions?.e04
  if (!MEMORY_PAIR_ENDINGS.e04.some((choice) => choice.id === tideGate))
    return null

  const hoshimori = restoreHoshimoriWarm(hoshimoriSave)
  const charter = hoshimori?.choices['8,8']
  if (charter !== 'consent' && charter !== 'open') return null

  const briar = replayEarthJournal('e09', briarJournal)
  if (!briar) return null
  const office = briar.progress.choices['2,2']
  if (
    !BRIAR_COLLISION_SCENES['2,2'].choices.some(
      (choice) => choice.id === office,
    ) ||
    !BRIAR_COLLISION_SCENES['7,6'].choices.some(
      (choice) => choice.id === briar.progress.choices['7,6'],
    )
  )
    return null

  return { tideGate: tideGate!, charter, office }
}

/** Only an irreversible choice reached by adjacent travel earns a fragment. */
export function recoverEarthCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  earthJournal: unknown,
  hoshimoriSave: unknown,
  briarJournal: unknown,
): MemoryCampaignProgress | null {
  if (!earthCollisionHistory(campaign, hoshimoriSave, briarJournal))
    return null
  const replayed = replayEarthJournal('e10', earthJournal)
  if (!replayed) return null

  let next = campaign
  for (const scene of earthCollision) {
    const chosen = replayed.progress.choices[scene.key]
    if (scene.choices.some((choice) => choice.id === chosen))
      next = recoverMemoryCollisionFragment(
        next,
        scene.fragment as 'city-lantern-charter' | 'city-forest-hours',
      )
  }
  return next
}

import { BRIAR_COLLISION_SCENES } from './briarCollision'
import { replayEarthJournal } from './earthJournal'
import {
  MEMORY_PAIR_ENDINGS,
  completeMemoryExperience,
  availableMemoryExperiences,
  recoverMemoryCollisionFragment,
  type MemoryCampaignProgress,
} from './reimaginerCampaign'

/**
 * Fragment ownership is earned by replaying legal adjacent travel and an
 * irreversible authored choice, never by visiting a marked tile or trusting
 * serialized flags, resources or fragment IDs.
 */
export function recoverBriarCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  journal: unknown,
): MemoryCampaignProgress | null {
  if (
    !campaign.finaleCommitted ||
    !campaign.completed.includes('e02') ||
    !campaign.completed.includes('e08') ||
    !availableMemoryExperiences(campaign).includes('e09') ||
    !MEMORY_PAIR_ENDINGS.e04.some(
      (choice) => choice.id === campaign.pairDecisions?.e04,
    )
  )
    return null

  const replayed = replayEarthJournal('e09', journal)
  if (!replayed) return null

  let next = campaign
  for (const [key, scene] of Object.entries(BRIAR_COLLISION_SCENES)) {
    const decision = replayed.progress.choices[key]
    if (scene.choices.some((choice) => choice.id === decision))
      next = recoverMemoryCollisionFragment(next, scene.fragment)
  }
  return next
}

/**
 * The finale handoff requires both genuinely recovered fragments and a
 * substantial witnessed route. Serialized campaign fragments alone are not
 * proof of twelve choices; replay the journal before advancing.
 */
export function concludeBriarCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  journal: unknown,
): MemoryCampaignProgress | null {
  const replayed = replayEarthJournal('e09', journal)
  if (!replayed || Object.keys(replayed.progress.choices).length < 12)
    return null
  for (const [key, scene] of Object.entries(BRIAR_COLLISION_SCENES)) {
    if (
      !scene.choices.some(
        (choice) => choice.id === replayed.progress.choices[key],
      )
    )
      return null
  }
  const earned = recoverBriarCollisionFromJournal(campaign, journal)
  if (!earned) return null
  try {
    return completeMemoryExperience(earned, 'e09')
  } catch {
    return null
  }
}

import { replayEarthJournal } from './earthJournal'
import {
  MEMORY_LAST_CHOICE,
  MEMORY_PAIR_ENDINGS,
  availableMemoryExperiences,
  chooseMemoryLastChoice,
  chooseMemoryPairEnding,
  completeMemoryExperience,
  recoverMemoryCollisionFragment,
  type MemoryCampaignProgress,
  type MemoryCollisionFragmentId,
  type MemoryLastChoice,
} from './reimaginerCampaign'

import { FINALE_FRAGMENT_SITES, type FinaleWorld } from './finaleFragments'

export { FINALE_FRAGMENT_SITES, type FinaleWorld }

const PREVIOUS: Readonly<Record<FinaleWorld, 'e10' | 'e11'>> = {
  e11: 'e10',
  e12: 'e11',
}

const PREVIOUS_FRAGMENTS: Readonly<
  Record<FinaleWorld, readonly MemoryCollisionFragmentId[]>
> = {
  e11: ['city-lantern-charter', 'city-forest-hours'],
  e12: ['sea-unwritten-map', 'sea-sister-bell'],
}

export const FINALE_MIN_DECISIONS = 12
export const FINALE_CROSSING_SITE = '8,8'

/**
 * A late world opens only after the previous crossing was genuinely
 * completed with both of its displaced memories, never from a bare flag.
 */
export function finaleCollisionUnlocked(
  campaign: MemoryCampaignProgress,
  world: FinaleWorld,
): boolean {
  return (
    campaign.finaleCommitted &&
    campaign.completed.includes(PREVIOUS[world]) &&
    PREVIOUS_FRAGMENTS[world].every((id) =>
      campaign.recoveredFragments?.includes(id),
    ) &&
    (campaign.completed.includes(world) ||
      availableMemoryExperiences(campaign).includes(world))
  )
}

export function finaleFragmentsChosen(
  world: FinaleWorld,
  choices: Readonly<Record<string, string>>,
): number {
  return Object.keys(FINALE_FRAGMENT_SITES[world]).filter((key) =>
    Boolean(choices[key]),
  ).length
}

export function finaleCrossingEarned(
  world: FinaleWorld,
  choices: Readonly<Record<string, string>>,
): boolean {
  return (
    finaleFragmentsChosen(world, choices) === 2 &&
    Object.keys(choices).length >= FINALE_MIN_DECISIONS
  )
}

/** Only a choice reached by legal adjacent travel recovers a fragment. */
export function recoverFinaleCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  world: FinaleWorld,
  journal: unknown,
): MemoryCampaignProgress | null {
  if (!finaleCollisionUnlocked(campaign, world)) return null
  const replayed = replayEarthJournal(world, journal)
  if (!replayed) return null
  let next = campaign
  for (const [key, fragment] of Object.entries(FINALE_FRAGMENT_SITES[world]))
    if (replayed.progress.choices[key])
      next = recoverMemoryCollisionFragment(next, fragment)
  return next
}

export interface FinaleDecision {
  /** e12 only: the Hoshimori crossroads verdict. */
  verdict?: string
  /** e12 only: the campaign's final choice. */
  last?: MemoryLastChoice
}

/**
 * Leaving a late world requires a replayed route standing at the crossing,
 * both fragments, twelve decisions and, for e12, the crossroads verdict and
 * the final choice. Anything less leaves the campaign unchanged.
 */
export function concludeFinaleCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  world: FinaleWorld,
  journal: unknown,
  decision: FinaleDecision = {},
): MemoryCampaignProgress | null {
  const replayed = replayEarthJournal(world, journal)
  if (
    !replayed ||
    replayed.position !== FINALE_CROSSING_SITE ||
    !finaleCrossingEarned(world, replayed.progress.choices)
  )
    return null
  const earned = recoverFinaleCollisionFromJournal(campaign, world, journal)
  if (!earned) return null
  try {
    if (world === 'e11') return completeMemoryExperience(earned, 'e11')
    if (
      !decision.verdict ||
      !decision.last ||
      !MEMORY_PAIR_ENDINGS.e12.some((c) => c.id === decision.verdict) ||
      !MEMORY_LAST_CHOICE.some((c) => c.id === decision.last)
    )
      return null
    const decided = chooseMemoryLastChoice(
      chooseMemoryPairEnding(earned, 'e12', decision.verdict),
      decision.last,
    )
    return completeMemoryExperience(decided, 'e12')
  } catch {
    return null
  }
}

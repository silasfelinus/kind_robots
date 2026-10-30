import { BRIAR_QUESTS } from './briarQuests'
import { BRIAR_RARE_EVENTS, type EarnedBriarRareEvent } from './briarRareEvents'

export interface MemoryAchievement {
  id: string
  questId: string
  title: string
  description: string
  artPath: string
  earned: boolean
}

const MEDALS: Record<string, { title: string; description: string }> = {
  'the-fourth-column': {
    title: 'A Fourth Way Out',
    description:
      'Make Oren account for someone his first evacuation plan left behind.',
  },
  'the-second-signature': {
    title: 'Two Dates, One Truth',
    description: 'Give Mosswick a truthful account without inventing a debtor.',
  },
  'a-letter-written-back': {
    title: 'The Door Answers Back',
    description:
      'Carry a reply that makes the Brass Knight answer for his order.',
  },
  'the-voice-that-came-home': {
    title: 'Return to Sender',
    description:
      'Help Pip recognize a missing courier without claiming their identity.',
  },
  'the-road-without-an-owner': {
    title: 'A Road for Everyone',
    description: 'Find a path for the Wolf-Mother that respects her witnesses.',
  },
  'two-crowns-one-promise': {
    title: 'Two Crowns, No Clerk',
    description:
      'Let Scylla and Char decide who may tell the story of their departure.',
  },
  'supper-for-tomorrow': {
    title: 'Bread and Tomorrow',
    description: 'Choose how a scarce harvest can help the village.',
  },
  'the-name-left-blank': {
    title: 'The Right to Be Missing',
    description:
      "Honor a daughter's agency while investigating the erased guests.",
  },
}

/**
 * The first eight of the planned 64 campaign achievements. Each is a
 * cosmetic Chronicle medal for a rare World One convergence, not a stat
 * boost or another claimable reward. Reuse the corresponding quest painting.
 */
export const MEMORY_BRIAR_ACHIEVEMENTS = BRIAR_RARE_EVENTS.map((event) => {
  const quest = BRIAR_QUESTS.find((entry) => entry.id === event.questId)
  const medal = MEDALS[event.id]
  if (!quest || !medal)
    throw new Error(`Missing Memory Dungeon medal source for ${event.id}`)
  return {
    id: event.id,
    questId: event.questId,
    title: medal.title,
    description: medal.description,
    artPath: quest.artPath,
  }
})

const validIds = new Set(MEMORY_BRIAR_ACHIEVEMENTS.map((medal) => medal.id))

/** Older and malformed local storage must never introduce unknown medals. */
export function restoreMemoryAchievements(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids = new Set(
    value.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id),
    ),
  )
  return MEMORY_BRIAR_ACHIEVEMENTS.filter((medal) => ids.has(medal.id)).map(
    (medal) => medal.id,
  )
}

/**
 * Only a fully earned, authored rare event can mint a medal. The permanent
 * list survives new expeditions and checkpoint loads; replaying an outcome
 * never duplicates it.
 */
export function reconcileMemoryAchievements(
  previous: readonly string[],
  earnedEvents: readonly EarnedBriarRareEvent[],
): string[] {
  const ids = new Set(restoreMemoryAchievements(previous))
  for (const event of earnedEvents)
    if (validIds.has(event.id)) ids.add(event.id)
  return MEMORY_BRIAR_ACHIEVEMENTS.filter((medal) => ids.has(medal.id)).map(
    (medal) => medal.id,
  )
}

export function memoryAchievementGallery(
  savedIds: readonly string[],
): MemoryAchievement[] {
  const earned = new Set(restoreMemoryAchievements(savedIds))
  return MEMORY_BRIAR_ACHIEVEMENTS.map((medal) => ({
    ...medal,
    earned: earned.has(medal.id),
  }))
}

import { BRIAR_QUESTS } from './briarQuests'
import { BRIAR_RARE_EVENTS, type EarnedBriarRareEvent } from './briarRareEvents'

export interface MemoryAchievement {
  id: string
  questId: string
  title: string
  description: string
  echo: string | null
  artPath: string
  earned: boolean
}

const MEDALS: Record<string, { title: string; description: string; echo: string }> = {
  'the-fourth-column': {
    title: 'A Fourth Way Out',
    description:
      'Make Oren account for someone his first evacuation plan left behind.',
    echo:
      'Oren keeps the fourth column open after the evacuation is over. It is a list of people the first plan failed to see, not a tally of people who owe him thanks. Every future route must begin with that uncomfortable arithmetic.',
  },
  'the-second-signature': {
    title: 'Two Dates, One Truth',
    description: 'Give Mosswick a truthful account without inventing a debtor.',
    echo:
      'Mosswick begins keeping two ledgers: one for what was promised and one for what can actually be proved. The second is much thinner. For the first time, he is proud to show a customer a page with an honest blank.',
  },
  'a-letter-written-back': {
    title: 'The Door Answers Back',
    description:
      'Carry a reply that makes the Brass Knight answer for his order.',
    echo:
      'The Brass Knight leaves his sword against the door while he reads the reply. He has learned that a written apology can open a hearing, but cannot deliver its verdict. The people on the other side still decide whether to answer.',
  },
  'the-voice-that-came-home': {
    title: 'Return to Sender',
    description:
      'Help Pip recognize a missing courier without claiming their identity.',
    echo:
      'Pip leaves a space in his route book for a destination that cannot yet be named. He refuses to call it a failed delivery. A voice can be recognized without turning the person behind it into someone else\'s property.',
  },
  'the-road-without-an-owner': {
    title: 'A Road for Everyone',
    description: 'Find a path for the Wolf-Mother that respects her witnesses.',
    echo:
      'The Wolf-Mother folds her map with the paths facing inward. She can guide the next traveler without giving the Index a list of the children who used them. A safe road does not need an owner, only people willing to keep it safe.',
  },
  'two-crowns-one-promise': {
    title: 'Two Crowns, No Clerk',
    description:
      'Let Scylla and Char decide who may tell the story of their departure.',
    echo:
      'Scylla\'s careful itinerary and Char\'s scribbled additions still disagree about the weather. They agree about one thing: no clerk may turn their two wishes into one royal signature. Even sisters who travel together deserve separate answers.',
  },
  'supper-for-tomorrow': {
    title: 'Bread and Tomorrow',
    description: 'Choose how a scarce harvest can help the village.',
    echo:
      'The field cook leaves an empty line beneath the supper tally for whatever the next harvest brings. A meal cannot undo hunger, and a sapling cannot feed someone tonight. The workers keep both truths in the same book.',
  },
  'the-name-left-blank': {
    title: 'The Right to Be Missing',
    description:
      "Honor a daughter's agency while investigating the erased guests.",
    echo:
      'The village registry learns to distinguish eleven erased records from a twelfth absence. A blank can mean that someone was forgotten, or that someone asked not to be found. The difference belongs to the missing person, not the clerk.',
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
    echo: medal.echo,
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
    echo: earned.has(medal.id) ? medal.echo : null,
    earned: earned.has(medal.id),
  }))
}

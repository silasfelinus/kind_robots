import type { RainbowAllegiance } from './rainbowAllegiance'
import { FINALE_ENDINGS, type FinaleChoice } from './rainbowEclipseFinale'

export type RainbowEndingArchiveEntry = {
  id: string
  choice: FinaleChoice
  road: RainbowAllegiance | 'choice' | 'turned'
  roadLabel: string
  title: string
  summary: string
  unlocked: boolean
}

const CHOICES = [
  {
    choice: 'restore',
    title: 'Restore the Crown',
    summary:
      'The Crown woke with its first rule whole again. This page was pressed before the roads were charted, so it keeps only the choice.',
  },
  {
    choice: 'evacuate',
    title: 'Free the Fleet',
    summary:
      'Every fleet the Crown held flew home on its own heading. This page was pressed before the roads were charted, so it keeps only the choice.',
  },
  {
    choice: 'sever',
    title: 'Cut the Leash',
    summary:
      'The Crown let go of the Ocean for good. This page was pressed before the roads were charted, so it keeps only the choice.',
  },
] as const satisfies ReadonlyArray<{
  choice: FinaleChoice
  title: string
  summary: string
}>

const ROADS = ['rebel', 'loyal'] as const

/** A loyal crew that heard the Crown's plea and turned at the last (story critic S4, S20). */
const STOOD_DOWN = {
  id: 'ending-stood-down',
  choice: 'restore',
  road: 'turned',
  roadLabel: 'Loyal road, turned',
  title: 'Turned at the Crown',
  summary:
    'Sent to take the Crown, the crew heard it ask instead, and flew high. Command still has not filed the report.',
} as const satisfies Omit<RainbowEndingArchiveEntry, 'unlocked'>

/**
 * Record both a broadly earned final choice and its exact allegiance.
 * Historical saves only held the broad choice; never retroactively guess
 * whether those flights rebelled or stayed loyal.
 */
export function rainbowEndingMemoryIds(
  choice: FinaleChoice,
  road: RainbowAllegiance | null,
  stoodDown = false,
): string[] {
  const choiceId = `ending-${choice}`
  const ids =
    road === null ? [choiceId] : [choiceId, `ending-${road}-${choice}`]
  return stoodDown ? [...ids, STOOD_DOWN.id] : ids
}

/**
 * Three old-style choice memories and six named, allegiance-specific outcomes.
 * The variant ids are private scrapbook mastery, not extra site achievements.
 * Only an exact earned id unlocks a road outcome.
 */
export function rainbowEndingArchive(
  mastery: readonly string[],
): RainbowEndingArchiveEntry[] {
  const earned = new Set(mastery)
  const choices = CHOICES.map((entry) => ({
    ...entry,
    id: `ending-${entry.choice}`,
    road: 'choice' as const,
    roadLabel: 'Final choice',
  }))
  const roads = ROADS.flatMap((road) =>
    CHOICES.map(({ choice }) => ({
      id: `ending-${road}-${choice}`,
      choice,
      road,
      roadLabel: road === 'rebel' ? 'Rebel road' : 'Loyal road',
      title: FINALE_ENDINGS[road][choice].title,
      summary: FINALE_ENDINGS[road][choice].world,
    })),
  )
  return [...choices, ...roads, STOOD_DOWN].map((entry) => ({
    ...entry,
    unlocked: earned.has(entry.id),
  }))
}

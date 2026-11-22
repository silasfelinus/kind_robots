import type { RainbowAllegiance } from './rainbowAllegiance'
import { FINALE_ENDINGS, type FinaleChoice } from './rainbowEclipseFinale'

export type RainbowEndingArchiveEntry = {
  id: string
  choice: FinaleChoice
  road: RainbowAllegiance | 'choice'
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
      'Your choice to restore the Crown is remembered. The original record does not prove which Motherland road you flew.',
  },
  {
    choice: 'evacuate',
    title: 'Free the Fleet',
    summary:
      'Your choice to evacuate is remembered. The original record does not prove which Motherland road you flew.',
  },
  {
    choice: 'sever',
    title: 'Cut the Leash',
    summary:
      'Your choice to sever the Crown is remembered. The original record does not prove which Motherland road you flew.',
  },
] as const satisfies ReadonlyArray<{
  choice: FinaleChoice
  title: string
  summary: string
}>

const ROADS = ['rebel', 'loyal'] as const

/**
 * Record both a broadly earned final choice and its exact allegiance.
 * Historical saves only held the broad choice; never retroactively guess
 * whether those flights rebelled or stayed loyal.
 */
export function rainbowEndingMemoryIds(
  choice: FinaleChoice,
  road: RainbowAllegiance | null,
): string[] {
  const choiceId = `ending-${choice}`
  return road === null ? [choiceId] : [choiceId, `ending-${road}-${choice}`]
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
  return [...choices, ...roads].map((entry) => ({
    ...entry,
    unlocked: earned.has(entry.id),
  }))
}

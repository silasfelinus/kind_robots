import type { FinaleChoice } from './rainbowEclipseFinale'

export type RainbowEndingArchiveEntry = {
  choice: FinaleChoice
  title: string
  summary: string
  unlocked: boolean
}

const ENDING_CHOICES = [
  {
    choice: 'restore',
    title: 'Restore the Crown',
    summary:
      'The Crown remembers its first promise. What it remembers about the Motherland depends on your allegiance.',
  },
  {
    choice: 'evacuate',
    title: 'Free the Fleet',
    summary:
      'The captive fleet escapes. Who claims the empty sea depends on the road your squadron flew.',
  },
  {
    choice: 'sever',
    title: 'Cut the Leash',
    summary:
      'The Crown loses its hold. Your choices decide what freedom costs.',
  },
] as const satisfies ReadonlyArray<{
  choice: FinaleChoice
  title: string
  summary: string
}>

/**
 * The current cabinet saves three final-choice mastery feats, not all nine
 * allegiance-specific variants. Never label an unrecorded variant as collected.
 */
export function rainbowEndingArchive(
  mastery: readonly string[],
): RainbowEndingArchiveEntry[] {
  return ENDING_CHOICES.map((ending) => ({
    ...ending,
    unlocked: mastery.includes(`ending-${ending.choice}`),
  }))
}

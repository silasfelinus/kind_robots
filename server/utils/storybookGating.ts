// /server/utils/storybookGating.ts
//
// The gate that will eventually lock a genre, a character, or a narrator until
// the reader earns it (storybook/t-033, enforced by t-038).
//
// Silas, 2026-09-12: "eventually we may gate certain genre choices and or
// characters, and award them when they finish a story." The award side is real
// already -- resolving a run credits an ending and, when a deck is complete,
// its COLLECTION achievement. The LOCK side is deliberately inert: a deck's
// unlockAchievementId can be set today, and this module already answers whether
// a reader has it, but refusing a run stays behind an env flag until the card
// hand can actually render a locked card with an unlock hint. A gate the UI
// cannot explain is a dead end, not a goal.

import prisma from './prisma'
import { withStatusCode } from './davinci'

export const DECK_GATE_ENV_FLAG = 'STORYBOOK_ENFORCE_DECK_GATES'

export function deckGatesEnforced(): boolean {
  return process.env[DECK_GATE_ENV_FLAG] === 'true'
}

export interface GatedDeck {
  key: string
  title: string
  unlockAchievementId: number | null
}

/** True when the reader may play this deck right now. */
export async function isDeckUnlocked(
  deck: GatedDeck,
  userId: number,
): Promise<boolean> {
  if (!deck.unlockAchievementId) return true
  const record = await prisma.achievementRecord.findFirst({
    where: { achievementId: deck.unlockAchievementId, userId },
    select: { id: true },
  })
  return Boolean(record)
}

/**
 * Refuse a run on a locked deck -- but only once enforcement is switched on.
 *
 * Until then this is observability: `unlocked` still reports the truth on
 * GET /api/storybook/decks, so the hand can be built and checked against real
 * data before a single reader is turned away.
 */
export async function assertDeckPlayable(
  deck: GatedDeck,
  userId: number,
): Promise<void> {
  if (!deck.unlockAchievementId) return
  if (await isDeckUnlocked(deck, userId)) return
  if (!deckGatesEnforced()) return
  throw withStatusCode(
    `The ${deck.title} deck is still locked. Finish a story that unlocks it first.`,
    403,
  )
}

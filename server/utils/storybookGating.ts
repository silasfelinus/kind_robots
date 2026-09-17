// /server/utils/storybookGating.ts
//
// The gate that locks a genre deck or a character until the reader earns it
// (storybook/t-033 built the deck side dormant; t-038 wires up Character and
// turns both into a real refusal once enforcement is on).
//
// Silas, 2026-09-12: "eventually we may gate certain genre choices and or
// characters, and award them when they finish a story." The award side is real
// already -- resolving a run credits an ending and, when a deck is complete,
// its COLLECTION achievement. The LOCK side stays behind one env flag shared
// by both gate kinds: a deck or Character's unlockAchievementId can be set
// today, and this module always answers whether a reader has it (so
// GET /api/storybook/decks and GET /api/storybook/characters can render a
// truthful lock before a single reader is turned away), but refusing a run
// stays inert until STORYBOOK_ENFORCE_DECK_GATES is switched on. A gate the UI
// cannot explain is a dead end, not a goal.

import prisma from './prisma'
import { withStatusCode } from './davinci'

export const DECK_GATE_ENV_FLAG = 'STORYBOOK_ENFORCE_DECK_GATES'

export function deckGatesEnforced(): boolean {
  return process.env[DECK_GATE_ENV_FLAG] === 'true'
}

export interface Gated {
  unlockAchievementId: number | null
}

export interface GatedDeck extends Gated {
  key: string
  title: string
}

export interface GatedCharacter extends Gated {
  id: number
  name: string
}

/** True when the reader holds the entity's unlock Achievement (or it has none). */
export async function isUnlocked(
  entity: Gated,
  userId: number,
): Promise<boolean> {
  if (!entity.unlockAchievementId) return true
  const record = await prisma.achievementRecord.findFirst({
    where: { achievementId: entity.unlockAchievementId, userId },
    select: { id: true },
  })
  return Boolean(record)
}

/** True when the reader may play this deck right now. */
export async function isDeckUnlocked(
  deck: GatedDeck,
  userId: number,
): Promise<boolean> {
  return isUnlocked(deck, userId)
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
  if (await isUnlocked(deck, userId)) return
  if (!deckGatesEnforced()) return
  throw withStatusCode(
    `The ${deck.title} deck is still locked. Finish a story that unlocks it first.`,
    403,
  )
}

/**
 * Refuse a run cast on a locked Character -- same shape and same flag as
 * assertDeckPlayable, checked for every cast member (Hero and Company alike;
 * a locked companion is exactly as much a spoiler as a locked protagonist).
 */
export async function assertCastPlayable(
  cast: GatedCharacter[],
  userId: number,
): Promise<void> {
  if (!deckGatesEnforced()) return
  for (const character of cast) {
    if (!character.unlockAchievementId) continue
    if (await isUnlocked(character, userId)) continue
    throw withStatusCode(
      `${character.name} is still locked. Finish a story that unlocks them first.`,
      403,
    )
  }
}

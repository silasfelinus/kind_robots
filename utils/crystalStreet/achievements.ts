// /utils/crystalStreet/achievements.ts
//
// Terrors on Crystal Street's site achievements
// (utils/achievements/catalog/main/crystal-street.ts), judged from one
// committed move: the week before and after it, plus the scrapbook before and
// after. crystalStreetStore.commit() is the only caller; load() restores a
// week without committing, so a saved week never awards anything.

import { ARCHETYPES, ARC_STEPS, BEST_WINS, VILLAINS, endingKey } from './rules'
import type { RunState } from './rules'

export type CrystalScrapbookView = {
  runs: readonly { villain: string; archetype: string }[]
  endings: readonly string[]
  friends: readonly string[]
}

export const CRYSTAL_FIVE = 5
export const CRYSTAL_TEN_FRIENDS = 10
const CLUES_PER_VILLAIN = 3

function bestCount(book: CrystalScrapbookView): number {
  return VILLAINS.filter((v) => book.endings.includes(endingKey(v.id, 'best')))
    .length
}

const villainsMet = (book: CrystalScrapbookView) =>
  new Set(book.runs.map((r) => r.villain)).size
const cliquesPlayed = (book: CrystalScrapbookView) =>
  new Set(book.runs.map((r) => r.archetype)).size
const arcsDone = (run: RunState) =>
  run.flags.filter((f) => f.startsWith('arc:') && f.endsWith(`:${ARC_STEPS}`))
    .length

/** Crossed a threshold on this move (it was below, now it is at or over). */
const crossed = (before: number, after: number, goal: number) =>
  before < goal && after >= goal

/** The achievement codes one committed move earned. */
export function crystalStreetDeeds(
  before: RunState | null,
  after: RunState,
  bookBefore: CrystalScrapbookView,
  bookAfter: CrystalScrapbookView,
): string[] {
  // A new week (or a different one) is not a played move.
  if (!before || before.seed !== after.seed) return []
  const codes: string[] = []

  if (after.crew.length > before.crew.length && after.crew.length >= 3)
    codes.push('crystal-street-full-crew')
  if (arcsDone(after) > arcsDone(before))
    codes.push('crystal-street-arc-complete')
  if (crossed(before.wins, after.wins, BEST_WINS))
    codes.push('crystal-street-twelve-wins')
  if (crossed(before.clues.length, after.clues.length, CLUES_PER_VILLAIN))
    codes.push('crystal-street-case-cracked')
  if (
    after.pending?.rerolled &&
    after.pending.roll.success &&
    !before.pending?.rerolled
  )
    codes.push('crystal-street-second-chance')
  if (
    after.quarters < before.quarters &&
    after.items.length > before.items.length
  )
    codes.push('crystal-street-shopper')

  if (!before.ending && after.ending) {
    codes.push('crystal-street-first-week')
    const { tier, special } = after.ending
    if (special === 'final-girl') codes.push('crystal-street-final-girl')
    else if (special) codes.push('crystal-street-burned-bridges')
    if (tier === 'best') codes.push('crystal-street-best-ending')
    if (tier === 'bad' && !special) codes.push('crystal-street-rough-week')
  }

  if (crossed(villainsMet(bookBefore), villainsMet(bookAfter), CRYSTAL_FIVE))
    codes.push('crystal-street-five-nightmares')
  if (crossed(villainsMet(bookBefore), villainsMet(bookAfter), VILLAINS.length))
    codes.push('crystal-street-all-nightmares')
  if (crossed(bestCount(bookBefore), bestCount(bookAfter), CRYSTAL_FIVE))
    codes.push('crystal-street-best-five')
  if (
    crossed(
      cliquesPlayed(bookBefore),
      cliquesPlayed(bookAfter),
      ARCHETYPES.length,
    )
  )
    codes.push('crystal-street-every-clique')
  if (
    crossed(
      bookBefore.friends.length,
      bookAfter.friends.length,
      CRYSTAL_TEN_FRIENDS,
    )
  )
    codes.push('crystal-street-ten-friends')
  return codes
}

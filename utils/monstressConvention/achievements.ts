// /utils/monstressConvention/achievements.ts
//
// MONSTRIQUE achievements (utils/achievements/catalog/main/
// monstress-convention.ts). Both case stores call achievementsFor(prev, next)
// from commit(), so an achievement is earned by the action that changed the
// case, never by loading a save. Nothing here depends on mature-only content:
// the general edition can earn every one.

import {
  CHAPTER_ONE_ENDINGS,
  SCORE_TABLE,
  type CaseEnding,
  type CaseState,
} from './prologue'

const FLAG_ACHIEVEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['odette-hired-us', 'monstress-convention-dead-client'],
  ['double-murder-discovered', 'monstress-convention-room-205'],
  ['fangs-returned', 'monstress-convention-rental-fangs'],
  ['violet-paid', 'monstress-convention-bill-squared'],
  ['billboard-shot', 'monstress-convention-billboard'],
  ['reel-running', 'monstress-convention-midnight-matinee'],
  ['invoice-returned', 'monstress-convention-credit-due'],
]

const EVIDENCE_ACHIEVEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['ice-timing', 'monstress-convention-ice-timing'],
  ['fan-exonerated', 'monstress-convention-not-the-fan'],
  ['knife-prop-mark', 'monstress-convention-prop-mark'],
  // The camera-and-fangs close-up is the case's one working combination.
  ['fangs-detail', 'monstress-convention-combiner'],
  ['sleeve-face', 'monstress-convention-scratched-sleeve'],
]

const ENDING_ACHIEVEMENTS: Readonly<Record<CaseEnding, string>> = {
  'lead-earned': 'monstress-convention-ending-lead',
  reckless: 'monstress-convention-ending-reckless',
  'fifth-hexblade': 'monstress-convention-ending-hexblade',
  'five-knives': 'monstress-convention-ending-five-knives',
}

/**
 * Chapter One's endings: the ones "Both Sides" and "Three Front Pages" count.
 * Chapter Two's ending has its own achievement.
 */
export const MONSTRIQUE_ENDINGS: CaseEnding[] = [...CHAPTER_ONE_ENDINGS]
const chapterOneEnding = (ending: CaseEnding | null): boolean =>
  !!ending && MONSTRIQUE_ENDINGS.includes(ending)

const GENERAL_ROWS = SCORE_TABLE.filter((row) => !row.mature)

/** The case score counting only what the general edition can earn. */
export function generalCaseScore(state: CaseState): number {
  return GENERAL_ROWS.reduce(
    (sum, row) =>
      state.evidence.includes(row.key) || state.flags.includes(row.key)
        ? sum + row.points
        : sum,
    0,
  )
}

export const GENERAL_MAX_SCORE = GENERAL_ROWS.reduce(
  (sum, row) => sum + row.points,
  0,
)

/** Every achievement this case state shows the player has earned. */
function earnedBy(state: CaseState): Set<string> {
  const codes = new Set<string>()
  for (const [flag, code] of FLAG_ACHIEVEMENTS)
    if (state.flags.includes(flag)) codes.add(code)
  for (const [key, code] of EVIDENCE_ACHIEVEMENTS)
    if (state.evidence.includes(key)) codes.add(code)
  if (state.flags.includes('odette-met') && state.flags.includes('violet-met'))
    codes.add('monstress-convention-both-witnesses')
  if (
    state.asked.some((entry) => entry.startsWith('iris:')) &&
    state.asked.some((entry) => entry.startsWith('nico:'))
  )
    codes.add('monstress-convention-tag-team')
  if (state.room === 'convention-center')
    codes.add('monstress-convention-convention')
  if (state.ending) {
    codes.add(ENDING_ACHIEVEMENTS[state.ending])
    if (
      chapterOneEnding(state.ending) &&
      generalCaseScore(state) >= GENERAL_MAX_SCORE
    )
      codes.add('monstress-convention-full-file')
  }
  return codes
}

/**
 * Codes the action that turned `prev` into `next` newly earned.
 * `endingsSeen` is how many different endings this player's scrapbook holds
 * after the action.
 */
export function achievementsFor(
  prev: CaseState,
  next: CaseState,
  endingsSeen = 0,
): string[] {
  const before = earnedBy(prev)
  const earned = [...earnedBy(next)].filter((code) => !before.has(code))
  if (chapterOneEnding(next.ending) && next.ending !== prev.ending) {
    if (endingsSeen >= 2) earned.push('monstress-convention-both-endings')
    if (endingsSeen >= MONSTRIQUE_ENDINGS.length)
      earned.push('monstress-convention-all-endings')
  }
  return earned
}

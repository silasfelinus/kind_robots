// /utils/monstressConvention/achievements.ts
//
// MONSTRIQUE achievements (utils/achievements/catalog/main/
// monstress-convention.ts). Both case stores call achievementsFor(prev, next)
// from commit(), so an achievement is earned by the action that changed the
// case, never by loading a save. Nothing here depends on mature-only content:
// the general edition can earn every one.

import { SCORE_TABLE, type CaseEnding, type CaseState } from './prologue'

const FLAG_ACHIEVEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['odette-hired-us', 'monstress-convention-dead-client'],
  ['double-murder-discovered', 'monstress-convention-room-205'],
  ['fangs-returned', 'monstress-convention-rental-fangs'],
  ['violet-paid', 'monstress-convention-bill-squared'],
  ['billboard-shot', 'monstress-convention-billboard'],
]

const EVIDENCE_ACHIEVEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['ice-timing', 'monstress-convention-ice-timing'],
  ['fan-exonerated', 'monstress-convention-not-the-fan'],
  ['knife-prop-mark', 'monstress-convention-prop-mark'],
  // The camera-and-fangs close-up is the case's one working combination.
  ['fangs-detail', 'monstress-convention-combiner'],
]

const ENDING_ACHIEVEMENTS: Readonly<Record<CaseEnding, string>> = {
  'lead-earned': 'monstress-convention-ending-lead',
  reckless: 'monstress-convention-ending-reckless',
}

export const MONSTRIQUE_ENDINGS = Object.keys(
  ENDING_ACHIEVEMENTS,
) as CaseEnding[]

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
    if (generalCaseScore(state) >= GENERAL_MAX_SCORE)
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
  if (
    next.ending &&
    next.ending !== prev.ending &&
    endingsSeen >= MONSTRIQUE_ENDINGS.length
  )
    earned.push('monstress-convention-both-endings')
  return earned
}

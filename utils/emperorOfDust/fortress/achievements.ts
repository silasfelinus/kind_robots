// Emperor of Dust achievements (conductor emperor-of-dust t-065): which
// catalog codes one deed earns. Each helper compares the state before and
// after the deed, so a save that loads already finished earns nothing.

import { CODEX_SIZE } from './codex'
import { isOver } from './engine'
import { endingOf, type EndingId } from './endings'
import { RELICS, type RelicVault } from './relics'
import type { Codex, FortressRun } from './types'

/** One achievement per ending family. */
export const ENDING_ACHIEVEMENTS: Record<EndingId, string> = {
  'bell-restored': 'emperor-of-dust-bell-restored',
  'open-roads': 'emperor-of-dust-open-roads',
  'iron-peace': 'emperor-of-dust-iron-peace',
  'crows-bargain': 'emperor-of-dust-crows-bargain',
  'witchwater-throne': 'emperor-of-dust-witchwater-throne',
  'tunnels-and-councils': 'emperor-of-dust-tunnels-and-councils',
  'long-night': 'emperor-of-dust-long-night',
  'hundred-candles': 'emperor-of-dust-hundred-candles',
}

const FLAG_ACHIEVEMENTS: [flag: string, code: string][] = [
  ['horror-sealed', 'emperor-of-dust-crypt-sealed'],
  ['abbess-unmasked', 'emperor-of-dust-abbess-unmasked'],
]

/** A day ended: `before` is the run at dusk, `after` the run at dawn. */
export function dawnAchievements(
  before: FortressRun,
  after: FortressRun,
): string[] {
  const codes: string[] = []
  const tonight = after.reports.slice(before.reports.length)
  if (
    tonight.some((report) =>
      report.quests.some((quest) => quest.tier === 'triumph'),
    )
  )
    codes.push('emperor-of-dust-triumph')
  for (const [flag, code] of FLAG_ACHIEVEMENTS)
    if (!before.flags.includes(flag) && after.flags.includes(flag))
      codes.push(code)
  if (isOver(before) || !isOver(after)) return codes
  codes.push('emperor-of-dust-reign-complete')
  codes.push(ENDING_ACHIEVEMENTS[endingOf(after).id])
  if (!after.memorials.length) codes.push('emperor-of-dust-no-names')
  return codes
}

/** A relic was claimed into the vault. */
export function relicAchievements(
  before: RelicVault,
  after: RelicVault,
): string[] {
  if (after.owned.length <= before.owned.length) return []
  const codes = ['emperor-of-dust-first-relic']
  if (after.owned.length >= Object.keys(RELICS).length)
    codes.push('emperor-of-dust-both-relics')
  return codes
}

/** The Codex grew from something the court did. */
export function codexAchievements(before: Codex, after: Codex): string[] {
  return before.revealed.length < CODEX_SIZE &&
    after.revealed.length >= CODEX_SIZE
    ? ['emperor-of-dust-codex-complete']
    : []
}

// Shifting Desks achievements (conductor shifting-desks t-050): which catalog
// codes a deed earns. A completion is judged when its receipt is first filed,
// so a restored save or a repeat of the same run earns nothing new. A filed
// completion also credits what the archive already holds (milestones and
// endings from before these achievements existed), at that deed.

import { dailyDateOf } from './daily'
import type { RewardArchive } from './rewards'
import { ENDINGS, JOB_TITLES, type RunState } from './rules'

/** The reward archive's milestones that are also achievements. */
export const MILESTONE_ACHIEVEMENTS: Record<string, string> = {
  'first-ending': 'shifting-desks-first-ending',
  'five-departments': 'shifting-desks-five-departments',
  'employee-of-the-month': 'shifting-desks-employee-of-the-month',
  'mutation-used': 'shifting-desks-mutation-used',
  'society-agent': 'shifting-desks-society-agent',
  successor: 'shifting-desks-successor',
  'forms-25': 'shifting-desks-forms-25',
  'three-endings': 'shifting-desks-three-endings',
  'exceptional-empathy': 'shifting-desks-exceptional-empathy',
}

/** Endings that are achievements of their own. */
export const ENDING_ACHIEVEMENTS: Record<string, string> = {
  'posthumous-affairs': 'shifting-desks-posthumous-affairs',
  'the-kind-rewrite': 'shifting-desks-the-kind-rewrite',
}

/** A run reached its ending and `receiptId` was filed into the archive. */
export function completionAchievements(
  before: RewardArchive,
  after: RewardArchive,
  receiptId: string,
  endingsFound: readonly string[],
  run: Pick<RunState, 'seed'>,
): string[] {
  const filed = after.runs.find((receipt) => receipt.id === receiptId)
  if (!filed || before.runs.some((receipt) => receipt.id === receiptId))
    return []
  const codes: string[] = []
  for (const [milestone, code] of Object.entries(MILESTONE_ACHIEVEMENTS))
    if (after.milestones[milestone]) codes.push(code)
  for (const [ending, code] of Object.entries(ENDING_ACHIEVEMENTS))
    if (endingsFound.includes(ending)) codes.push(code)
  if (ENDINGS.every((ending) => endingsFound.includes(ending.id)))
    codes.push('shifting-desks-all-endings')
  if (dailyDateOf(run.seed)) codes.push('shifting-desks-daily-memo')
  const titles = new Set(after.runs.map((receipt) => receipt.jobTitle))
  if (JOB_TITLES.every((job) => titles.has(job.title)))
    codes.push('shifting-desks-every-job')
  return codes
}

/** A Society favor or the mutation was spent mid-run. */
export function instantAchievements(
  before: Pick<RunState, 'mutationUsed' | 'societyRecord'>,
  after: Pick<RunState, 'mutationUsed' | 'societyRecord'>,
): string[] {
  const codes: string[] = []
  if (!before.mutationUsed && after.mutationUsed)
    codes.push('shifting-desks-mutation-used')
  const met = (run: Pick<RunState, 'societyRecord'>) =>
    Object.values(run.societyRecord).includes('met')
  if (!met(before) && met(after)) codes.push('shifting-desks-society-agent')
  return codes
}

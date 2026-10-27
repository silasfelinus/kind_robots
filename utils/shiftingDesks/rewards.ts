import {
  ENDINGS,
  endingFor,
  jobById,
  mutationById,
  societyById,
  type Grades,
  type RunState,
} from './rules'

export const REWARD_ARCHIVE_VERSION = 1
export const REWARD_ARCHIVE_LIMIT = 30

export type RunReceipt = {
  id: string
  endingId: string
  completedAt: string
  jobTitle: string
  society: string
  mutation: string
  floors: number
  files: number
  employees: number
  forms: number
  successors: number
  grades: Grades
  flags: string[]
  mutationUsed: boolean
  societyMet: boolean
}

export type RewardArchive = {
  version: 1
  milestones: Record<string, string>
  runs: RunReceipt[]
}

export type Milestone = {
  id: string
  title: string
  detail: string
  icon: string
  target: number
  value: (archive: RewardArchive, endings: string[]) => number
  badge?: boolean
}

export const MILESTONES: Milestone[] = [
  {
    id: 'first-ending',
    title: 'A Permanent Position',
    detail: 'Reach your first ending. There is no exit interview.',
    icon: 'kind-icon:trophy',
    target: 1,
    badge: true,
    value: (_a, e) => e.length,
  },
  {
    id: 'five-departments',
    title: 'Entirely Reviewed',
    detail: 'Get through all five departments in a single run.',
    icon: 'kind-icon:folder',
    target: 5,
    badge: true,
    value: (a) => Math.max(0, ...a.runs.map((r) => r.floors)),
  },
  {
    id: 'employee-of-the-month',
    title: 'Employee of the Month',
    detail: 'Let the Board make you an example.',
    icon: 'kind-icon:trophy',
    target: 1,
    badge: true,
    value: (a) =>
      a.runs.some((r) => r.endingId === 'employee-of-the-month') ? 1 : 0,
  },
  {
    id: 'mutation-used',
    title: 'Medical Leave Denied',
    detail: 'Use an officially undocumented mutation.',
    icon: 'kind-icon:eye',
    target: 1,
    value: (a) => (a.runs.some((r) => r.mutationUsed) ? 1 : 0),
  },
  {
    id: 'society-agent',
    title: 'Discreet Membership',
    detail: 'Carry out business for a secret society.',
    icon: 'kind-icon:users',
    target: 1,
    value: (a) => (a.runs.some((r) => r.societyMet) ? 1 : 0),
  },
  {
    id: 'successor',
    title: 'Team Restructuring',
    detail: 'Make use of at least one Successor.',
    icon: 'kind-icon:refresh',
    target: 1,
    value: (a) => (a.runs.some((r) => r.employees > 1) ? 1 : 0),
  },
  {
    id: 'forms-25',
    title: 'A Paper Trail',
    detail: 'Handle 25 files in a single run.',
    icon: 'kind-icon:book',
    target: 25,
    value: (a) => Math.max(0, ...a.runs.map((r) => r.files)),
  },
  {
    id: 'test-report',
    title: 'Subject Under Observation',
    detail: 'Receive your first final psychological report.',
    icon: 'kind-icon:book',
    target: 1,
    value: (a) => a.runs.length,
  },
  {
    id: 'three-endings',
    title: 'Repeat Offender',
    detail: 'Discover three different endings.',
    icon: 'kind-icon:layers',
    target: 3,
    value: (_a, e) => e.length,
  },
  {
    id: 'exceptional-empathy',
    title: 'A Treatable Condition',
    detail: 'Score 10 or more Empathy on a final report.',
    icon: 'kind-icon:heart',
    target: 10,
    value: (a) => Math.max(0, ...a.runs.map((r) => r.grades.empathy)),
  },
]

export function emptyRewardArchive(): RewardArchive {
  return { version: REWARD_ARCHIVE_VERSION, milestones: {}, runs: [] }
}

export function restoreRewardArchive(raw: unknown): RewardArchive {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return emptyRewardArchive()
  const value = raw as Partial<RewardArchive>
  if (value.version !== REWARD_ARCHIVE_VERSION) return emptyRewardArchive()
  const known = new Set(MILESTONES.map((m) => m.id))
  const milestones: Record<string, string> = {}
  for (const [id, date] of Object.entries(value.milestones ?? {})) {
    if (
      known.has(id) &&
      typeof date === 'string' &&
      !Number.isNaN(Date.parse(date))
    )
      milestones[id] = date
  }
  const runs = Array.isArray(value.runs)
    ? value.runs.filter(isRunReceipt).slice(-REWARD_ARCHIVE_LIMIT)
    : []
  return { version: 1, milestones, runs }
}

function isRunReceipt(value: unknown): value is RunReceipt {
  if (!value || typeof value !== 'object') return false
  const run = value as Partial<RunReceipt>
  return (
    typeof run.id === 'string' &&
    typeof run.endingId === 'string' &&
    ENDINGS.some((ending) => ending.id === run.endingId) &&
    typeof run.completedAt === 'string' &&
    !Number.isNaN(Date.parse(run.completedAt)) &&
    typeof run.floors === 'number' &&
    Number.isFinite(run.floors) &&
    typeof run.files === 'number' &&
    Number.isFinite(run.files) &&
    typeof run.grades?.empathy === 'number' &&
    typeof run.grades?.obedience === 'number' &&
    typeof run.grades?.ingenuity === 'number' &&
    typeof run.grades?.spite === 'number' &&
    Array.isArray(run.flags)
  )
}

export function receiptFor(
  run: RunState,
  completedAt: string,
): RunReceipt | null {
  const ending = endingFor(run)
  if (
    !ending ||
    (run.status !== 'complete' && run.status !== 'eliminated') ||
    run.pending
  )
    return null
  const files = run.log.filter(
    (entry) => entry.cardId !== 'dossier' && entry.cardId !== 'restructuring',
  ).length
  return {
    id: run.seed + ':' + ending.id,
    endingId: ending.id,
    completedAt,
    jobTitle: jobById(run.jobId).title,
    society: societyById(run.societyId).title,
    mutation: mutationById(run.mutationId).title,
    floors: Object.keys(run.departmentOutcomes).length,
    files,
    employees: run.generation + 1,
    forms: run.meters.forms,
    successors: run.meters.successors,
    grades: { ...run.grades },
    flags: [...run.flags],
    mutationUsed: run.mutationUsed,
    societyMet: Object.values(run.societyRecord).includes('met'),
  }
}

export function recordReward(
  archive: RewardArchive,
  run: RunReceipt,
  endings: string[],
): RewardArchive {
  if (archive.runs.some((receipt) => receipt.id === run.id)) return archive
  const runs = [...archive.runs, run].slice(-REWARD_ARCHIVE_LIMIT)
  const next: RewardArchive = {
    version: 1,
    milestones: { ...archive.milestones },
    runs,
  }
  for (const milestone of MILESTONES) {
    if (
      !(milestone.id in next.milestones) &&
      milestone.value(next, endings) >= milestone.target
    ) {
      next.milestones[milestone.id] = run.completedAt
    }
  }
  return next
}

export function migrateFoundEndings(
  archive: RewardArchive,
  endings: string[],
): RewardArchive {
  if (!endings.length) return archive
  const milestones = { ...archive.milestones }
  const earliest = archive.runs[0]?.completedAt
  if (earliest && !milestones['first-ending'])
    milestones['first-ending'] = earliest
  if (endings.length >= 3 && earliest && !milestones['three-endings'])
    milestones['three-endings'] = earliest
  return { ...archive, milestones }
}

/** A repeat completion or restored save must never announce an award again. */
export function newMilestonesForRun(
  before: RewardArchive,
  after: RewardArchive,
  receiptId: string,
): string[] {
  if (
    before.runs.some((run) => run.id === receiptId) ||
    !after.runs.some((run) => run.id === receiptId)
  )
    return []
  return MILESTONES.filter(
    (milestone) =>
      !before.milestones[milestone.id] && !!after.milestones[milestone.id],
  ).map((milestone) => milestone.id)
}

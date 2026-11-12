import { isEmployeeIdentity, type EmployeeIdentity } from './preferences'
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
  jobId?: string
  identity?: EmployeeIdentity
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

/** Print a historical dossier without crediting accomplishments earned in later runs. */
export function milestonesAsOfReceipt(
  archive: RewardArchive,
  receipt: RunReceipt,
): Milestone[] {
  const filedAt = Date.parse(receipt.completedAt)
  if (!Number.isFinite(filedAt)) return []
  return MILESTONES.filter((milestone) => {
    const awardDate = archive.milestones[milestone.id]
    if (!awardDate) return false
    const earnedAt = Date.parse(awardDate)
    return Number.isFinite(earnedAt) && earnedAt <= filedAt
  })
}

export function emptyRewardArchive(): RewardArchive {
  return { version: REWARD_ARCHIVE_VERSION, milestones: {}, runs: [] }
}

/** A corrupt companion storage key must not erase a valid ongoing game. */
export function parseSavedJSON(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Only distinct, authored endings count toward collection milestones. */
export function restoreEndingGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const known = new Set(ENDINGS.map((ending) => ending.id))
  const seen = new Set<string>()
  return raw.filter((id): id is string => {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
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
  // Keep the latest instance of a run ID if an older save wrote it twice.
  const uniqueRuns = new Map<string, RunReceipt>()
  for (const run of Array.isArray(value.runs) ? value.runs : []) {
    if (!isRunReceipt(run)) continue
    uniqueRuns.delete(run.id)
    uniqueRuns.set(run.id, run)
  }
  return {
    version: 1,
    milestones,
    runs: [...uniqueRuns.values()].slice(-REWARD_ARCHIVE_LIMIT),
  }
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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
    typeof run.jobTitle === 'string' &&
    (run.jobId === undefined || typeof run.jobId === 'string') &&
    (run.identity === undefined || isEmployeeIdentity(run.identity)) &&
    typeof run.society === 'string' &&
    typeof run.mutation === 'string' &&
    nonNegativeInteger(run.floors) &&
    nonNegativeInteger(run.files) &&
    nonNegativeInteger(run.employees) &&
    run.employees >= 1 &&
    nonNegativeInteger(run.forms) &&
    nonNegativeInteger(run.successors) &&
    finiteNumber(run.grades?.empathy) &&
    finiteNumber(run.grades?.obedience) &&
    finiteNumber(run.grades?.ingenuity) &&
    finiteNumber(run.grades?.spite) &&
    typeof run.mutationUsed === 'boolean' &&
    typeof run.societyMet === 'boolean' &&
    Array.isArray(run.flags) &&
    run.flags.every((flag) => typeof flag === 'string')
  )
}

/**
 * A Daily Memo shares one seed with every replay that day, so the seed and
 * ending alone cannot tell two different completions apart. The job and the
 * choices played can, and they stay identical when the same run is reloaded.
 */
export function runFingerprint(run: RunState): string {
  let hash = 2166136261
  const identity = run.identity
  const personalized =
    identity.name ||
    identity.pronouns !== 'unspecified' ||
    identity.badgeTone !== 'classic'
      ? `${identity.name}/${identity.pronouns}/${identity.badgeTone}`
      : ''
  const trail = [
    run.jobId,
    ...(personalized ? [personalized] : []),
    ...run.log.map(
      (entry) =>
        `${entry.cardId}/${entry.choiceId}/${entry.total ?? ''}/${entry.success ? 1 : 0}`,
    ),
  ].join('|')
  for (let i = 0; i < trail.length; i++) {
    hash ^= trail.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

/** Receipts filed before fingerprints were `seed:ending`; this is that prefix. */
function legacyReceiptId(id: string): string {
  const parts = id.split(':')
  return parts.length > 2 ? parts.slice(0, -1).join(':') : id
}

/** The same completion, whether filed under today's ID or the legacy one. */
export function sameCompletion(filed: RunReceipt, run: RunReceipt): boolean {
  if (filed.id === run.id) return true
  return (
    filed.id === legacyReceiptId(run.id) &&
    filed.endingId === run.endingId &&
    filed.jobTitle === run.jobTitle &&
    (filed.identity?.name ?? '') === (run.identity?.name ?? '') &&
    (filed.identity?.pronouns ?? 'unspecified') ===
      (run.identity?.pronouns ?? 'unspecified') &&
    (filed.identity?.badgeTone ?? 'classic') ===
      (run.identity?.badgeTone ?? 'classic') &&
    filed.floors === run.floors &&
    filed.files === run.files &&
    filed.employees === run.employees &&
    filed.forms === run.forms &&
    filed.successors === run.successors &&
    filed.grades.empathy === run.grades.empathy &&
    filed.grades.obedience === run.grades.obedience &&
    filed.grades.ingenuity === run.grades.ingenuity &&
    filed.grades.spite === run.grades.spite &&
    filed.flags.join('|') === run.flags.join('|')
  )
}

/** The archived receipt for this exact run, if it has been filed. */
export function filedReceiptFor(
  archive: RewardArchive,
  run: RunState | null | undefined,
): RunReceipt | null {
  if (!run) return null
  const probe = receiptFor(run, new Date(0).toISOString())
  if (!probe) return null
  return archive.runs.find((filed) => sameCompletion(filed, probe)) ?? null
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
    id: run.seed + ':' + ending.id + ':' + runFingerprint(run),
    endingId: ending.id,
    completedAt,
    jobTitle: jobById(run.jobId).title,
    jobId: run.jobId,
    ...(run.identity.name ||
    run.identity.pronouns !== 'unspecified' ||
    run.identity.badgeTone !== 'classic'
      ? { identity: { ...run.identity } }
      : {}),
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
  if (archive.runs.some((receipt) => sameCompletion(receipt, run)))
    return archive
  const runs = [...archive.runs, run].slice(-REWARD_ARCHIVE_LIMIT)
  const distinctEndings = restoreEndingGallery(endings)
  const next: RewardArchive = {
    version: 1,
    milestones: { ...archive.milestones },
    runs,
  }
  for (const milestone of MILESTONES) {
    if (
      !(milestone.id in next.milestones) &&
      milestone.value(next, distinctEndings) >= milestone.target
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
  const distinctEndings = restoreEndingGallery(endings)
  if (!distinctEndings.length) return archive
  const milestones = { ...archive.milestones }
  const earliest = archive.runs[0]?.completedAt
  if (earliest && !milestones['first-ending'])
    milestones['first-ending'] = earliest
  if (distinctEndings.length >= 3 && earliest && !milestones['three-endings'])
    milestones['three-endings'] = earliest
  return { ...archive, milestones }
}

export type EndingCommendation = {
  title: string
  icon: string
  /** Read on the first completion filed under this ending. */
  first: string
  /** Read on every later completion; `{nth}` becomes "2nd", "3rd"... */
  repeat: string
}

/**
 * Every ending files its own commendation, so the ceremony after a repeat run
 * celebrates the ending you just reached instead of replaying the oldest
 * award in the archive.
 */
export const ENDING_COMMENDATIONS: Record<string, EndingCommendation> = {
  'employee-of-the-month': {
    title: 'Elevator Portrait',
    icon: 'kind-icon:crown',
    first:
      'Your portrait goes up in every elevator. Facilities has been told to keep the nails.',
    repeat:
      'Your portrait is hung for the {nth} time. Facilities has stopped taking the nails out.',
  },
  'promoted-to-management': {
    title: 'Self-Approved Commendation',
    icon: 'kind-icon:briefcase',
    first:
      'As your own supervisor, you may now approve this commendation. You did, promptly.',
    repeat:
      'Your {nth} promotion into the same chair. HR has opened a folder for your folders.',
  },
  'escape-through-the-ducts': {
    title: 'Unauthorized Exit, Approved',
    icon: 'kind-icon:arrow-up',
    first:
      'Your escape is filed as a lateral move. Your badge still opens the storm drain.',
    repeat:
      'Your {nth} escape on record. Facilities has installed a coat hook in the duct, for you.',
  },
  'roach-union-general-strike': {
    title: 'Local 9 Card, Laminated',
    icon: 'kind-icon:bullhorn',
    first:
      'The Union laminates your card by hand. Gus signs it with the good pen.',
    repeat:
      'Your {nth} walkout with Local 9. Your card has a seniority stripe now, and the Board has stopped scheduling day twelve.',
  },
  'society-coup': {
    title: 'Founding Member',
    icon: 'kind-icon:mask',
    first:
      "The new regime's first motion: frame this. Carried unanimously, under its own name.",
    repeat:
      'Your {nth} coup passes in committee. The minutes now just say "as usual."',
  },
  whistleblower: {
    title: 'Exhibit of the Month',
    icon: 'kind-icon:document',
    first:
      'The uncut reel is filed as Exhibit A. You are filed as Exhibit B, which is still a promotion.',
    repeat:
      'Your {nth} leak. Legal has stopped asking how and started asking when.',
  },
  'early-retirement': {
    title: 'Pension, Painted On',
    icon: 'kind-icon:coffee',
    first:
      'Your pension is painted on the wall beside the island. The steward says it is very generous.',
    repeat:
      'Your {nth} retirement. The steward remembers your drink, and the island has been repainted a little warmer.',
  },
  'the-kind-rewrite': {
    title: 'Greeted by Name',
    icon: 'kind-icon:heart',
    first:
      'PAL says your name the way the blueprint asked. Kevin, from Tank Nine, says it too.',
    repeat:
      'PAL greets you by name for the {nth} time and does not repeat a single word back. That is the award.',
  },
  'position-eliminated': {
    title: 'Redundancy, Redundantly',
    icon: 'kind-icon:archive',
    first:
      'Your desk is now a collaboration hub. You are thanked in the passive voice.',
    repeat:
      'Eliminated for the {nth} time. HR has made your exit paperwork a template, in your honor.',
  },
  'posthumous-affairs': {
    title: 'Deceased in Advance',
    icon: 'kind-icon:ghost',
    first:
      'The afterlife clerk stamps your elimination RECEIVED. Being dead early has finally paid off.',
    repeat:
      'Your {nth} arrival at Posthumous Affairs. The clerk no longer asks for ID and has started saving your desk.',
  },
  'permanent-adjournment': {
    title: 'Tabled Indefinitely',
    icon: 'kind-icon:clock',
    first:
      'Your case is carried forward to the next meeting, which is also this one.',
    repeat:
      'Adjourned for the {nth} time. The minutes read "see previous minutes," with your name underlined.',
  },
}

/** 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st. */
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return n + 'th'
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return n + suffix
}

export type CeremonyAward = {
  kind: 'milestone' | 'ending-first' | 'ending-repeat' | 'previous'
  title: string
  /** The small caps line above the title. */
  status: string
  /** The commendation itself; empty for a previously filed distinction. */
  line: string
  icon: string
  /** How many times this ending is on file, counting this completion. */
  filings: number
}

/**
 * The award a finished run's Personnel File presents. A newly earned
 * milestone always wins. Otherwise the ending files its own commendation,
 * counted from this completion's place in the archive so a reload keeps the
 * same count rather than climbing.
 */
export function ceremonyAwardFor(
  archive: RewardArchive,
  endingId: string | null | undefined,
  receiptId: string | null | undefined,
  newlyEarned: readonly string[],
): CeremonyAward | null {
  const fresh = MILESTONES.filter((m) => newlyEarned.includes(m.id))
  const filedHere = endingId
    ? archive.runs.filter((run) => run.endingId === endingId)
    : []
  const at = filedHere.findIndex((run) => run.id === receiptId)
  const filings = Math.max(1, at >= 0 ? at + 1 : filedHere.length)
  if (fresh[0])
    return {
      kind: 'milestone',
      title: fresh[0].title,
      status:
        fresh.length +
        ' new distinction' +
        (fresh.length === 1 ? '' : 's') +
        ' earned',
      line: fresh[0].detail,
      icon: fresh[0].icon,
      filings,
    }
  const commendation = endingId ? ENDING_COMMENDATIONS[endingId] : undefined
  if (commendation)
    return filings > 1
      ? {
          kind: 'ending-repeat',
          title: commendation.title,
          status: 'Refiled · ' + ordinal(filings) + ' time',
          line: commendation.repeat.replace('{nth}', ordinal(filings)),
          icon: commendation.icon,
          filings,
        }
      : {
          kind: 'ending-first',
          title: commendation.title,
          status: 'Ending commendation',
          line: commendation.first,
          icon: commendation.icon,
          filings,
        }
  const previous = MILESTONES.find((m) => !!archive.milestones[m.id])
  return previous
    ? {
        kind: 'previous',
        title: previous.title,
        status: 'Previously filed distinction',
        line: '',
        icon: previous.icon,
        filings,
      }
    : null
}

/** A repeat completion or restored save must never announce an award again. */
export function newMilestonesForRun(
  before: RewardArchive,
  after: RewardArchive,
  receiptId: string,
): string[] {
  const filed = after.runs.find((run) => run.id === receiptId)
  if (
    !filed ||
    before.runs.some(
      (run) => run.id === receiptId || sameCompletion(run, filed),
    )
  )
    return []
  return MILESTONES.filter(
    (milestone) =>
      !before.milestones[milestone.id] && !!after.milestones[milestone.id],
  ).map((milestone) => milestone.id)
}

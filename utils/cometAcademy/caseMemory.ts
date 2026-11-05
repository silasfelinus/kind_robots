import { REAL_NIGHT_CASES } from './nightCases'
import { expandedMissionFor, EXPANDED_MISSIONS } from './expandedNightCases'
import type { Grade } from './rules'
import type { MorningGrade } from './earlyNightMornings'

export type CaseThread = 'academy' | 'transit' | 'harbor' | 'civic'
export type CaseMemory = {
  day: number
  caseId: string
  grade: Grade
  unanswered: boolean
}

const EARLY_THREADS: Record<string, CaseThread> = {
  monorail: 'transit',
  museum: 'civic',
  flood: 'harbor',
  garden: 'academy',
  broadcast: 'civic',
  skybridge: 'civic',
  ferris: 'harbor',
  blackout: 'civic',
  quarry: 'transit',
  rally: 'civic',
  refinery: 'harbor',
  vault: 'civic',
}

export function caseThread(caseId: string): CaseThread | null {
  return EARLY_THREADS[caseId] ?? expandedMissionFor(caseId)?.thread ?? null
}

/** Each real patrol is recorded once for that calendar day. Training days
 * (the first two solo nights) and versions without the full campaign are
 * intentionally excluded. */
export function recordCaseNight(
  previous: readonly CaseMemory[],
  day: number,
  reports: readonly { caseId: string; grade: Grade; names: string }[],
): CaseMemory[] {
  if (day < 3 || day > 29) return [...previous]
  const unique = new Map(
    previous.map((record) => [record.day + ':' + record.caseId, record]),
  )
  for (const report of reports) {
    if (!caseThread(report.caseId)) continue
    const record: CaseMemory = {
      day,
      caseId: report.caseId,
      grade: report.grade,
      unanswered: report.names === 'No team dispatched',
    }
    const key = day + ':' + report.caseId
    if (!unique.has(key)) unique.set(key, record)
  }
  return [...unique.values()].sort(
    (a, b) => a.day - b.day || a.caseId.localeCompare(b.caseId),
  )
}

/** Only real missions in the same district thread from the previous five
 * nights influence this roll. A refusal costs more trust than an attempted
 * rescue which fails; successful work builds local cooperation. */
export function caseTrustModifier(
  history: readonly CaseMemory[] | undefined,
  day: number,
  caseId: string,
): number {
  const thread = caseThread(caseId)
  if (!thread) return 0
  const score = (history ?? []).reduce((sum, record) => {
    if (
      record.day >= day ||
      day - record.day > 5 ||
      record.caseId === caseId ||
      caseThread(record.caseId) !== thread
    )
      return sum
    return (
      sum +
      (record.unanswered
        ? -2
        : record.grade === 'honors'
          ? 2
          : record.grade === 'pass'
            ? 1
            : record.grade === 'failed'
              ? -1
              : 0)
    )
  }, 0)
  return Math.max(-2, Math.min(2, score))
}

/** How each district's witnesses speak about the last call they saw. The
 * lines describe attitude only; any change to the odds is stated separately
 * and comes from caseTrustModifier. */
export const DISTRICT_WITNESSES: Record<
  CaseThread,
  Record<MorningGrade, string>
> = {
  academy: {
    honors:
      'Night custodians still talk about {case} and ask after your team by name.',
    pass: 'Academy staff remember {case} as a job done well enough, and say so without fuss.',
    partial:
      'Students still argue over {case}; some want to help, others want proof you finish what you start.',
    failed:
      'The campus remembers how {case} went wrong, and staff hesitate before trusting another student response.',
    refused:
      'Nobody on campus has forgotten that {case} went unanswered, and the witnesses stay behind closed doors.',
  },
  transit: {
    honors:
      'Rail workers who saw {case} still wave when a cape passes the service gates.',
    pass: 'Transit crews remember {case} and keep the academy channel open on their radios.',
    partial:
      'Commuters remember {case} as half a rescue, and they want to see the next one finished.',
    failed:
      'Rail workers still blame the academy for {case} and keep their gates locked until asked twice.',
    refused:
      'The station noticeboard still shows the unanswered call to {case}, and transit crews have stopped expecting capes.',
  },
  harbor: {
    honors: 'Dockworkers remember {case} and retell it at every shift change.',
    pass: 'Harbor families remember {case} and leave a lantern burning at the slip.',
    partial:
      'Harbor families remember what {case} cost; they keep their children indoors and their questions ready.',
    failed:
      'The docks remember {case} going under, and pier crews watch every cape from a distance.',
    refused:
      'Harbor families remember the night {case} went unanswered, and the pier gates stay chained.',
  },
  civic: {
    honors:
      'Clerks and medics who watched {case} still cite it as proof that students can be trusted.',
    pass: 'City staff remember {case} and answer academy questions, if a little carefully.',
    partial:
      'Witnesses from {case} still argue about what went wrong; about half of them will talk.',
    failed:
      'The city remembers {case} ending badly, and officials ask for paperwork before they open a door.',
    refused:
      'Civic workers remember that nobody came to {case}, and they want to know why they should talk now.',
  },
}

/** The most recent other call in the same district during the previous five
 * nights: the same window caseTrustModifier reads. */
export function districtRecordFor(
  history: readonly CaseMemory[] | undefined,
  day: number,
  caseId: string,
): CaseMemory | null {
  const thread = caseThread(caseId)
  if (!thread) return null
  const candidates = (history ?? []).filter(
    (record) =>
      record.day < day &&
      day - record.day <= 5 &&
      record.caseId !== caseId &&
      caseThread(record.caseId) === thread,
  )
  if (!candidates.length) return null
  return [...candidates].sort(
    (a, b) =>
      b.day - a.day ||
      Number(b.unanswered) - Number(a.unanswered) ||
      a.caseId.localeCompare(b.caseId),
  )[0]!
}

export function validCaseHistory(
  history: unknown,
  currentDay: number,
  phase: string,
): history is CaseMemory[] {
  if (!Array.isArray(history) || history.length > 150) return false
  const ids = new Set([
    ...Object.keys(REAL_NIGHT_CASES),
    ...EXPANDED_MISSIONS.map((mission) => mission.incident.id),
  ])
  const seen = new Set<string>()
  for (const value of history) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return false
    const entry = value as CaseMemory
    if (
      Object.keys(entry).sort().join(',') !== 'caseId,day,grade,unanswered' ||
      !Number.isInteger(entry.day) ||
      entry.day < 3 ||
      entry.day > currentDay ||
      (entry.day === currentDay &&
        !['debrief', 'campus', 'finale', 'ending'].includes(phase)) ||
      !ids.has(entry.caseId) ||
      !['honors', 'pass', 'partial', 'failed'].includes(entry.grade) ||
      typeof entry.unanswered !== 'boolean' ||
      (entry.unanswered && entry.grade !== 'failed') ||
      seen.has(entry.day + ':' + entry.caseId)
    )
      return false
    seen.add(entry.day + ':' + entry.caseId)
  }
  return true
}

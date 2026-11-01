import { REAL_NIGHT_CASES } from './nightCases'
import { expandedMissionFor, EXPANDED_MISSIONS } from './expandedNightCases'
import type { Grade } from './rules'

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

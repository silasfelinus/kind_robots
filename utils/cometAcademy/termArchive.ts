import { PROM_ENDINGS } from './artSlots'
import {
  STUDENTS,
  type AcademyRun,
  type PowerId,
  type StudentId,
} from './rules'
import { signatureById, type SignaturePowerId } from './specialPowers'
import type { PlayerForm } from './protagonistEvolution'

export const TERM_ARCHIVE_KEY = 'comet-city-academy-terms-v1'

export type AcademyTermPage = {
  id: string
  completedAt: number
  seed: number
  power: PowerId
  signature: SignaturePowerId | null
  form: PlayerForm
  flowVersion: 1 | 2 | 3
  ending: string
  day: number
  finalChoice: string
  mastermind: string | null
  romance: StudentId | null
  contacts: number
  patrols: number
  battles: number
  losses: number
  secrets: number
}

const endings = new Set<string>(PROM_ENDINGS)
const forms = new Set<string>(['student', 'hero', 'villain'])
const powers = new Set<PowerId>([
  'kinetic',
  'technopathy',
  'empathy',
  'elemental',
  'spatial',
  'biotech',
])
const students = new Set<string>(STUDENTS.map((student) => student.id))

function isTermPage(value: unknown): value is AcademyTermPage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Partial<AcademyTermPage>
  return (
    typeof item.id === 'string' &&
    /^[a-z0-9-]{3,80}$/.test(item.id) &&
    typeof item.completedAt === 'number' &&
    Number.isSafeInteger(item.completedAt) &&
    item.completedAt > 0 &&
    typeof item.seed === 'number' &&
    Number.isSafeInteger(item.seed) &&
    powers.has(item.power as PowerId) &&
    (item.signature === null ||
      (typeof item.signature === 'string' &&
        !!signatureById(item.signature))) &&
    forms.has(item.form ?? '') &&
    (item.flowVersion === 1 ||
      item.flowVersion === 2 ||
      item.flowVersion === 3) &&
    endings.has(item.ending ?? '') &&
    typeof item.day === 'number' &&
    Number.isInteger(item.day) &&
    (item.day ?? 0) >= 1 &&
    (item.day ?? 0) <= 30 &&
    typeof item.finalChoice === 'string' &&
    item.finalChoice.length <= 80 &&
    (item.mastermind === null ||
      (typeof item.mastermind === 'string' && item.mastermind.length <= 80)) &&
    (item.romance === null ||
      (typeof item.romance === 'string' && students.has(item.romance))) &&
    [
      item.contacts,
      item.patrols,
      item.battles,
      item.losses,
      item.secrets,
    ].every(
      (count) =>
        typeof count === 'number' &&
        Number.isInteger(count) &&
        count >= 0 &&
        count <= 1000,
    )
  )
}

/** Validate the separate permanent archive without modifying an in-progress save. */
export function readTermArchive(raw: unknown): AcademyTermPage[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  return raw
    .filter(isTermPage)
    .filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .sort((a, b) => b.completedAt - a.completedAt)
}

/** The same imported finished save produces one page; a different finale does not. */
export function completedTermPage(
  run: AcademyRun,
  completedAt: number,
): AcademyTermPage | null {
  if (run.phase !== 'ending' || !run.ending || !endings.has(run.ending))
    return null

  const identity = run.signature && signatureById(run.signature)
  const signature = identity ? run.signature! : null
  const choice =
    [...run.log]
      .reverse()
      .map(
        (line) => /Day 30: (protect|command|share|evacuate)\b/.exec(line)?.[1],
      )
      .find(Boolean) ?? 'simulation'
  const fingerprint = JSON.stringify([
    run.seed,
    signature,
    run.ending,
    run.log,
    run.playerEvolution?.form,
    run.relationships?.romance,
  ])
  let hashA = 2166136261
  let hashB = 0x9e3779b9
  for (const char of fingerprint) {
    hashA = Math.imul(hashA ^ char.charCodeAt(0), 16777619) >>> 0
    hashB = Math.imul(hashB ^ char.charCodeAt(0), 2246822519) >>> 0
  }
  const losses =
    (run.reports ?? []).filter((report) => report.grade === 'failed').length +
    (run.tacticalHistory ?? []).filter((fight) => fight.grade === 'failed')
      .length
  return {
    id: `${hashA.toString(36)}-${hashB.toString(36)}`,
    completedAt,
    seed: run.seed,
    power: run.power,
    signature,
    form: run.playerEvolution?.form ?? 'student',
    flowVersion: run.flowVersion ?? 1,
    ending: run.ending,
    day: run.day,
    finalChoice: choice,
    mastermind: run.mastermind ?? null,
    romance:
      run.relationships?.romance && students.has(run.relationships.romance)
        ? run.relationships.romance
        : null,
    contacts: run.contacts?.length ?? 0,
    patrols: run.patrolHistory?.length ?? 0,
    battles: run.tacticalHistory?.length ?? 0,
    losses,
    secrets:
      (run.missionClues?.length ?? 0) + (run.districtSecrets?.length ?? 0),
  }
}

export function addCompletedTerm(
  existing: readonly AcademyTermPage[],
  run: AcademyRun,
  completedAt: number,
): AcademyTermPage[] {
  const page = completedTermPage(run, completedAt)
  if (!page || existing.some((entry) => entry.id === page.id))
    return [...existing]
  return readTermArchive([page, ...existing])
}

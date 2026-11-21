import type { CaptainId, CrewId, VoyageRun } from './rules'

export const COMPLETED_VOYAGES_KEY = 'game-of-captains-voyages-v1'

export type CompletedVoyage = {
  version: 1
  id: string
  completedAt: number
  captain: CaptainId
  crew: CrewId[]
  chapter: number
  day: number
  ending: string
  outcome: string
  choices: {
    chapter: number
    missionId: string
    policy: string
    result: string
  }[]
  losses: { id: string; missionId: string }[]
  log: string[]
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function validCompletedVoyage(value: unknown): value is CompletedVoyage {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<CompletedVoyage>
  return (
    entry.version === 1 &&
    isString(entry.id) &&
    entry.id.length > 0 &&
    typeof entry.completedAt === 'number' &&
    Number.isFinite(entry.completedAt) &&
    isString(entry.captain) &&
    Array.isArray(entry.crew) &&
    entry.crew.every(isString) &&
    typeof entry.chapter === 'number' &&
    Number.isInteger(entry.chapter) &&
    typeof entry.day === 'number' &&
    Number.isInteger(entry.day) &&
    isString(entry.ending) &&
    isString(entry.outcome) &&
    Array.isArray(entry.log) &&
    entry.log.every(isString) &&
    Array.isArray(entry.choices) &&
    entry.choices.every(
      (choice) =>
        choice &&
        Number.isInteger(choice.chapter) &&
        isString(choice.missionId) &&
        isString(choice.policy) &&
        isString(choice.result),
    ) &&
    Array.isArray(entry.losses) &&
    entry.losses.every(
      (loss) => loss && isString(loss.id) && isString(loss.missionId),
    )
  )
}

export function normalizeCompletedVoyages(raw: unknown): CompletedVoyage[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  return raw.filter(validCompletedVoyage).filter((entry) => {
    if (ids.has(entry.id)) return false
    ids.add(entry.id)
    return true
  })
}

/** Compare the actual playthrough, not its archive ID or export timestamp. */
export function sameCompletedVoyageStory(
  left: CompletedVoyage,
  right: CompletedVoyage,
): boolean {
  return (
    left.captain === right.captain &&
    left.chapter === right.chapter &&
    left.day === right.day &&
    left.ending === right.ending &&
    left.outcome === right.outcome &&
    JSON.stringify(left.crew) === JSON.stringify(right.crew) &&
    JSON.stringify(left.choices) === JSON.stringify(right.choices) &&
    JSON.stringify(left.losses) === JSON.stringify(right.losses) &&
    JSON.stringify(left.log) === JSON.stringify(right.log)
  )
}

export function archiveCompletedVoyage(
  history: CompletedVoyage[],
  run: VoyageRun | null,
  completedAt: number,
): CompletedVoyage[] {
  if (!run || run.phase !== 'ending' || !run.ending) return history
  const id = [run.seed, run.captain, run.ending].join(':')
  const entry: CompletedVoyage = {
    version: 1,
    id,
    completedAt,
    captain: run.captain,
    crew: [...run.crew],
    chapter: run.chapter,
    day: run.day ?? run.chapter,
    ending: run.ending,
    outcome: run.scene,
    choices: [
      ...(run.missionHistory ?? []).map((choice) => ({
        chapter: choice.chapter,
        missionId: choice.missionId,
        policy: choice.policy,
        result: choice.result,
      })),
      ...(run.consequenceHistory ?? []).map((choice) => ({
        chapter: choice.chapter,
        missionId: choice.missionId,
        policy: choice.choiceId,
        result: choice.succeeded ? 'success' : 'failure',
      })),
    ].sort((a, b) => a.chapter - b.chapter),
    losses: (run.redshirtFallen ?? []).map((loss) => ({
      id: loss.id,
      missionId: loss.missionId,
    })),
    log: [...run.log],
  }
  const siblings = history.filter(
    (item) => item.id === id || item.id.startsWith(id + ':replay-'),
  )
  if (siblings.some((item) => sameCompletedVoyageStory(item, entry)))
    return history

  // Keep the original ID stable. Distinct choices on a replay of the same
  // seed and ending deserve a separate dossier, without duplicating saves.
  if (siblings.length) {
    let suffix = 1
    while (history.some((item) => item.id === id + ':replay-' + suffix))
      suffix++
    entry.id = id + ':replay-' + suffix
  }
  return [entry, ...history]
}

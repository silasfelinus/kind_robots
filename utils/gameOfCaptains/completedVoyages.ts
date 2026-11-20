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
  const previous = history.find((item) => item.id === id)
  if (previous) {
    const sameStory =
      JSON.stringify(previous.choices) === JSON.stringify(entry.choices) &&
      JSON.stringify(previous.losses) === JSON.stringify(entry.losses) &&
      JSON.stringify(previous.log) === JSON.stringify(entry.log)
    if (sameStory) return history

    // A replay with the same seed, captain and ending can tell a different
    // story. Preserve the legacy ID and give the alternate run its own page.
    const suffix = history.filter((item) => item.id.startsWith(id + ':')).length + 1
    entry.id = id + ':replay-' + suffix
  }
  return [entry, ...history]
}

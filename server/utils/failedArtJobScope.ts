export const MAX_FAILED_ART_JOB_REQUEUE_IDS = 100

export type FailedArtJobScopeResult =
  { ok: true; ids: number[] } | { ok: false; message: string }

export function normalizeFailedArtJobIds(
  value: unknown,
  action = 'requeue',
): FailedArtJobScopeResult {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      message: `Provide jobIds with the explicit failed ArtJobs to ${action}. Global failed-job actions are disabled.`,
    }
  }

  if (value.length === 0) {
    return {
      ok: false,
      message: `Select at least one failed ArtJob to ${action}.`,
    }
  }

  const ids: number[] = []
  const seen = new Set<number>()

  for (const candidate of value) {
    if (
      typeof candidate !== 'number' ||
      !Number.isSafeInteger(candidate) ||
      candidate <= 0
    ) {
      return {
        ok: false,
        message: 'Every jobIds entry must be a positive integer ArtJob ID.',
      }
    }

    if (!seen.has(candidate)) {
      seen.add(candidate)
      ids.push(candidate)
    }
  }

  if (ids.length > MAX_FAILED_ART_JOB_REQUEUE_IDS) {
    return {
      ok: false,
      message: `Select no more than ${MAX_FAILED_ART_JOB_REQUEUE_IDS} failed ArtJobs at once.`,
    }
  }

  return { ok: true, ids }
}

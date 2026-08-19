// /utils/artJobRetryNotice.ts
//
// A queued ArtJob that fails does NOT stop. server/api/art/queue/[id]/complete.post.ts
// records the error and returns the job to PENDING until `attempts` reaches
// MAX_ATTEMPTS, only then flipping it to FAILED. So between the first failure
// and the last one, the job carries a full diagnosis in its `error` column
// while still looking, to any poller watching `status` alone, exactly like a
// job that was queued a second ago.
//
// Every enqueue → poll → resolve store in the app read `error` only once the
// job reached a terminal state, which made those retries silent. 2026-08-19:
// an LTX webp animation was rejected by ComfyUI on submission
// (`value_not_in_list` on a checkpoint name), retried the whole way to
// exhaustion, and the page showed a spinner reading "processing" the entire
// time -- while the exact error sat in the ArtJob row from the first attempt
// onward.
//
// This is deliberately framework-free (no pinia, no fetch, no Vue) so both the
// stores and a plain `tsx` guard can use it.

export type RetryNoticeJobStatus =
  'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'

export type RetryNoticeJob = {
  status: RetryNoticeJobStatus
  error?: string | null
  attempts?: number | null
}

export type ArtJobRetryNotice = {
  attempts: number
  error: string
}

const TERMINAL_STATUSES = new Set<RetryNoticeJobStatus>([
  'DONE',
  'FAILED',
  'CANCELLED',
])

/**
 * The failure a still-running job has already hit, or null when there is
 * nothing to report yet.
 *
 * Terminal jobs return null on purpose: a FAILED/CANCELLED job is fatal and
 * its caller raises the error itself, and a DONE job has had `error` cleared
 * by the completion route. This is only about the in-between -- a job that has
 * failed at least once and is going to be tried again.
 */
export function artJobRetryNotice(
  job: RetryNoticeJob | null | undefined,
): ArtJobRetryNotice | null {
  if (!job || TERMINAL_STATUSES.has(job.status)) return null

  const error = (job.error || '').trim()
  if (!error) return null

  // `attempts` counts completed tries. A non-terminal job carrying an error
  // but no attempt count is not something to report as a retry -- without a
  // number to show, "attempt 0 failed" reads worse than saying nothing.
  const attempts = typeof job.attempts === 'number' ? job.attempts : 0
  if (attempts < 1) return null

  return { attempts, error }
}

// /utils/artJobPriority.ts
//
// The accepted range for an ArtJob's `priority`, and the parse that guards the
// admin priority endpoint.
//
// Why this range is not 0..1000. The relay claims work by `priority DESC, id
// ASC`, so priority is the only lever that reorders the queue. Producers already
// write negative priorities on purpose: the bulk lanes that enter through
// /api/art/queue (the Facet catalog, daily-dream builds) sit at 0 or below, and
// on 2026-08-13 the live PENDING backlog held 389 jobs at -15 and 34 at -20,
// while /api/art/enqueue's interactive work defaults to 100. That is a working
// design — bulk coverage should lose to a human waiting on a redo.
//
// The admin endpoint, however, clamped its input to a 0 floor. So every value
// the bulk lanes actually use was unreachable through the one API that exists to
// change priority: an operator could promote a job but could never put one back
// behind the backlog, or demote a job that had jumped the queue. Asked on
// 2026-08-13 to move two flux jobs (priority 0) behind 424 krea2 jobs (-15/-20),
// there was no legal request that expressed it — the only API-reachable route
// was raising all 424 of the others instead. The floor, not the queue, was the
// problem.
//
// The range is symmetric so that "as far back as anything gets queued" is as
// expressible as "front of the queue". It is deliberately wider than any lane in
// use, so a new producer picking a sensible negative tier does not have to come
// back and widen a constant.
//
// This module holds no database import on purpose. `priority.post.ts` pulls in
// prisma, and prisma.ts throws at import time when DATABASE_URL is unset, so
// anything living there is unreachable from the DB-free contract-tests workflow
// that gates every PR — the same reason artJobQueueSettings.ts was split out of
// artJobQueueCoverage.ts. See utils/scripts/verifyArtJobPriorityBounds.ts.
//
// It lives in root `utils/` rather than `server/utils/` because the dashboard
// store needs the same constants at runtime, and the only existing client
// imports from `server/` are type-only (erased at build). Root `utils/` is the
// side-neutral home both can value-import — the same shape as
// utils/artFacetPrompt.ts, which stores/artFacetDraftStore.ts imports.

export const MIN_ART_JOB_PRIORITY = -1000
export const MAX_ART_JOB_PRIORITY = 1000

/** Front of the queue: outranks the interactive default (100). */
export const FRONT_OF_QUEUE_PRIORITY = 100

/** Normal tier — what `returnToNormal` restores a job to. */
export const NORMAL_QUEUE_PRIORITY = 0

/**
 * Back of the queue: below every bulk lane in use (-15/-20 as of 2026-08-13),
 * so a job sent here loses to the existing backlog rather than landing in the
 * middle of it.
 */
export const BACK_OF_QUEUE_PRIORITY = -100

export type ArtJobPriorityParse =
  | { ok: true; priority: number }
  | { ok: false; message: string }

/**
 * Validate a caller-supplied priority. Rejects non-integers and anything outside
 * the accepted range, so the endpoint never writes a value the queue's ordering
 * cannot express.
 *
 * Non-numeric input is rejected rather than coerced. The previous validation ran
 * a bare `Number(body?.priority)`, and `Number(null)`, `Number('')` and
 * `Number([])` are all 0 — so a missing or malformed body silently set priority
 * 0 instead of failing. That was survivable while 0 was also the floor. Now that
 * negative values are legal, "the body didn't parse" and "put this job at the
 * normal tier" are genuinely different requests, and a malformed body that reads
 * as a demotion is a queue reorder nobody asked for.
 */
export function parseArtJobPriority(value: unknown): ArtJobPriorityParse {
  const rejected: ArtJobPriorityParse = {
    ok: false,
    message: `Priority must be an integer from ${MIN_ART_JOB_PRIORITY} to ${MAX_ART_JOB_PRIORITY}.`,
  }

  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  const priority = numeric

  if (!Number.isInteger(priority)) {
    return rejected
  }

  if (priority < MIN_ART_JOB_PRIORITY || priority > MAX_ART_JOB_PRIORITY) {
    return rejected
  }

  return { ok: true, priority }
}

/** Human-readable confirmation for a completed priority change. */
export function describeArtJobPriorityChange(
  id: number,
  priority: number,
): string {
  if (priority > NORMAL_QUEUE_PRIORITY) {
    return `Job ${id} moved ahead with priority ${priority}.`
  }
  if (priority < NORMAL_QUEUE_PRIORITY) {
    return `Job ${id} moved back with priority ${priority}.`
  }
  return `Job ${id} returned to normal priority.`
}

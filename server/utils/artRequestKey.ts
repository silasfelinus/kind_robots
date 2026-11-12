// /server/utils/artRequestKey.ts
//
// A caller-chosen, stable name for ONE art request -- Conductor sends
// `conductor:<ledger path>#<subject key>@<lane key>` for every ledger cell.
//
// WHY THIS EXISTS. Conductor submits a ledger cell, gets a job id back and
// writes it into the ledger file on disk; the id only becomes durable when
// that file is committed. A thread agent killed mid-session, or an Auto Art
// Generate run cancelled at its 150-minute timeout, loses every id it had not
// pushed yet. The art still renders, but nothing records it ("we keep finding
// art that was requested and made but not linked", Silas 2026-11-11 PT), and
// the next sweep sees an empty cell and renders it AGAIN (2026-11-06/07: Slime
// City cells queued three times at priority 1000). /api/art/enqueue had no
// dedup for these requests at all.
//
// With a request key the server can answer both problems: a resubmit of a key
// that already has a live or finished job returns that job instead of a new
// render, and POST /api/art/queue/lookup maps keys back to job ids so Conductor
// can recover what a killed caller never recorded.
//
// The key rides in ArtJob.attemptFingerprint (VarChar(64), indexed with
// userId) as `request:<sha256 prefix>` -- the same column-not-LIKE lookup the
// queue route uses, with a readable prefix like `resource-preview:` -- and in
// payload.requestKey verbatim, so a human reading the job can see its origin.
import { createHash } from 'node:crypto'
import { createError } from 'h3'

export const ART_REQUEST_KEY_MAX_LENGTH = 300
export const ART_REQUEST_KEY_PREFIX = 'request:'
// Printable, no whitespace: paths, slugs and the #@: separators Conductor uses.
const REQUEST_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:/#@+=-]*$/

/**
 * The request key as stored, or null when the caller sent none. A malformed
 * key is a 400, never silently dropped: dropping it would turn a deduplicated
 * resubmit back into a duplicate render.
 */
export function normalizeArtRequestKey(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'requestKey must be a string.',
    })
  }
  const key = value.trim()
  if (!key) return null
  if (
    key.length > ART_REQUEST_KEY_MAX_LENGTH ||
    !REQUEST_KEY_PATTERN.test(key)
  ) {
    throw createError({
      statusCode: 400,
      message: `Invalid requestKey: up to ${ART_REQUEST_KEY_MAX_LENGTH} characters of letters, digits and _.:/#@+=-.`,
    })
  }
  return key
}

/** The ArtJob.attemptFingerprint value for a request key: always 64 chars. */
export function artRequestKeyFingerprint(key: string): string {
  const digest = createHash('sha256')
    .update(`art-request-key:v1:${key}`)
    .digest('hex')
  return (ART_REQUEST_KEY_PREFIX + digest).slice(0, 64)
}

/** Job states a resubmit reuses; FAILED and CANCELLED get a fresh render. */
export const ART_REQUEST_KEY_REUSABLE_STATUSES = [
  'PENDING',
  'RUNNING',
  'DONE',
] as const

// /server/utils/pickLatestArchiveEntryJobs.ts
//
// Pure selector for art-archive/t-028: the curation board wants "what's the
// most recent ArtJob queued for each of these archive entries", but
// archiveEntryId only lives inside each job's JSON payload
// (buildArchiveEnqueuePayload.ts tags it there), not as an indexed column.
// This takes a page of ArtJob rows already narrowed by the indexed
// projectSlug column -- ordered newest-first -- and keeps only the first
// (i.e. most recent) row seen per requested entry id.
//
// No Prisma import: the endpoint owns the actual query, this owns the
// selection logic, so it's unit-testable without a live DATABASE_URL --
// matching this project's established split (buildArchiveEnqueuePayload.ts,
// artArchiveReconcilerPlan.ts, applyArchivePresetToPayload.ts).
import { parseArtJobPayload } from './artJobPayload'

export type ArchiveJobRow = {
  id: number
  status: string
  payload: unknown
  updatedAt: Date | string | null
  error: string | null
}

export type ArchiveEntryJobStatus = {
  jobId: number
  status: string
  archivePresetId: number | null
  /** Tagged directly on the payload (art-archive/t-034) -- read straight
   * from here rather than re-resolved from the (possibly since-edited or
   * -deleted) ArchiveActionPreset row that `archivePresetId` points at. */
  actionType: string | null
  updatedAt: string | null
  error: string | null
}

/**
 * `rows` must already be ordered newest-first (e.g. `orderBy: { id: 'desc' }`)
 * -- the first row seen per entry id wins. A row whose payload doesn't parse,
 * or carries no (or a non-numeric) `archiveEntryId`, is skipped rather than
 * throwing.
 */
export function pickLatestArchiveEntryJobs(
  rows: ArchiveJobRow[],
  entryIds: number[],
): Record<number, ArchiveEntryJobStatus> {
  const wanted = new Set(entryIds)
  const result: Record<number, ArchiveEntryJobStatus> = {}

  for (const row of rows) {
    if (!wanted.size) break
    const payload = parseArtJobPayload(row.payload)
    const archiveEntryId = Number(payload.archiveEntryId)
    if (!Number.isInteger(archiveEntryId) || !wanted.has(archiveEntryId)) continue

    result[archiveEntryId] = {
      jobId: row.id,
      status: row.status,
      archivePresetId:
        typeof payload.archivePresetId === 'number' ? payload.archivePresetId : null,
      actionType: typeof payload.actionType === 'string' ? payload.actionType : null,
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt ?? null),
      error: row.error,
    }
    wanted.delete(archiveEntryId)
  }

  return result
}

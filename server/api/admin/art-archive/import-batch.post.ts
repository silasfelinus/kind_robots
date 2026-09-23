// /server/api/admin/art-archive/import-batch.post.ts
//
// One bounded, resumable slice of the archive import.
//
// WHY THIS EXISTS
// ---------------
// import.post.ts walks the entire archive, hydrates every file in memory, and
// only then writes anything. Against the real archive that is one request that
// reads hundreds of thousands of images off disk before it can answer, with no
// progress and nothing durable if it dies -- which is exactly what happened
// (art-archive/t-041: the client came back with exit 137 and the database still
// held zero rows). Silas, 2026-09-22: "there are probably 10s or 100s of
// thousands of files added to the privacy folder. we should definitely have
// some sort of resumable process, and status output reports while processing".
//
// THE RESUME STATE IS THE DATABASE
// --------------------------------
// There is no cursor to keep and nothing to corrupt: a file is done when an
// ArchiveEntry row exists for its relativePath. Each call lists the archive
// (cheap: readdir and stat, no file contents), subtracts what is already
// imported, hydrates at most `limit` of the remainder, imports those, and
// reports what is left. Re-running continues; running it twice concurrently
// wastes work but cannot double-import, because importArchiveFile() is
// per-file transactional and keyed on relativePath.
import { defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import {
  listArchiveFilePaths,
  hydrateArchiveFiles,
} from '@/server/utils/artArchiveScanner'
import { importArchiveFile } from '@/server/utils/artArchiveImporter'
import {
  collectPendingBatch,
  IMPORTED_ENTRY_WHERE,
} from '@/server/utils/artArchiveImportedPaths'
import {
  advanceListingCursor,
  readListingCache,
  writeListingCache,
} from '@/server/utils/artArchiveListingCache'
import prisma from '@/server/utils/prisma'

const DEFAULT_BATCH_LIMIT = 250
const MAX_BATCH_LIMIT = 2000

function resolveLimit(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_LIMIT
  return Math.min(Math.floor(parsed), MAX_BATCH_LIMIT)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody(event).catch(() => ({}))
    const limit = resolveLimit((body as { limit?: unknown } | null)?.limit)

    const root = getArtArchiveRoot()
    const refresh = Boolean((body as { refresh?: unknown } | null)?.refresh)

    // One walk per run, not one per batch: at 240,856 files a walk costs far
    // more than the 250 files it would serve, and it barely changes while a
    // run is in flight.
    let listing = refresh ? null : readListingCache(root)
    const walked = !listing
    if (!listing) {
      const fresh = await listArchiveFilePaths(root)
      listing = writeListingCache({
        root: fresh.root,
        relativePaths: fresh.relativePaths,
        issues: fresh.issues,
      })
    }

    // Which rows count as done is state-aware and shared with scan-status: a
    // MISSING, PENDING, ERROR or quarantined row is work still to do. Asked one
    // indexed window at a time rather than by reading every imported row, which
    // at this size would mean a quarter of a million rows per batch.
    const { batch, nextIndex, windowsRead } = await collectPendingBatch(
      prisma.archiveEntry,
      listing.relativePaths,
      listing.cursor,
      limit,
    )
    advanceListingCursor(root, nextIndex)

    const scan = await hydrateArchiveFiles(listing.root, batch)

    let imagesCreated = 0
    let imagesReused = 0
    // Values an Int column could not hold, left null rather than mangled and
    // summarised here so the size of the gap is visible now rather than
    // discovered later as missing data. The true value stays in the entry's
    // extractedMetadata either way.
    //
    // `largestMagnitude` is the point of this: it is the difference between
    // "these are ordinary unsigned 32-bit A1111 seeds" and "this archive is
    // ComfyUI and no 32-bit column was ever going to work", which no count on
    // its own can tell you.
    const droppedFields: Record<
      string,
      {
        outOfRange: number
        notAnInteger: number
        largestMagnitude: number
        exampleValue: number
        examplePath: string
      }
    > = {}
    let collectionsCreated = 0
    let collectionsReused = 0
    const errors: { relativePath: string; message: string }[] = []

    for (const file of scan.files) {
      try {
        const result = await importArchiveFile(file, auth.user.id)
        if (result.createdImage) imagesCreated += 1
        else imagesReused += 1
        if (result.createdCollection) collectionsCreated += 1
        else collectionsReused += 1
        for (const dropped of result.droppedValues) {
          const seen = (droppedFields[dropped.field] ??= {
            outOfRange: 0,
            notAnInteger: 0,
            largestMagnitude: 0,
            exampleValue: dropped.value,
            examplePath: file.relativePath,
          })
          if (dropped.fault === 'out-of-range') seen.outOfRange += 1
          else seen.notAnInteger += 1
          if (Math.abs(dropped.value) > seen.largestMagnitude) {
            seen.largestMagnitude = Math.abs(dropped.value)
            seen.exampleValue = dropped.value
            seen.examplePath = file.relativePath
          }
        }
      } catch (error) {
        errors.push({ relativePath: file.relativePath, message: String(error) })
      }
    }

    const processed = scan.files.length
    // Files that could not be hydrated or that failed to import are still
    // pending, so they are not subtracted -- a batch that hits the same bad
    // file forever is visible as `remaining` refusing to fall, rather than
    // being quietly counted as done.
    const completed = processed - errors.length

    // One indexed count, rather than re-deriving the pending set. It counts
    // imported rows rather than imported-and-still-on-disk, so a file deleted
    // after import makes this read slightly ahead of the truth; `cursor`
    // beside it shows the run's own position, which is exact.
    const importedTotal = await prisma.archiveEntry.count({
      where: IMPORTED_ENTRY_WHERE,
    })
    const filesOnDisk = listing.relativePaths.length
    // Always the real gap, never forced to zero because this run ran out of
    // listing. `done` says the cursor reached the end; `remaining` says whether
    // anything was left behind on the way -- a batch whose files all failed
    // advances the cursor without importing them, and that must stay visible.
    const remaining = Math.max(0, filesOnDisk - importedTotal)

    return {
      success: true,
      message:
        `Imported ${completed} of ${processed} file(s) in this batch; ` +
        `${remaining} still pending of ${filesOnDisk} on disk.`,
      data: {
        root: listing.root,
        filesOnDisk,
        alreadyImported: importedTotal,
        batchSize: batch.length,
        processed,
        completed,
        remaining,
        done: batch.length === 0,
        skippedThisRun: batch.length === 0 && remaining > 0,
        cursor: nextIndex,
        walkedThisCall: walked,
        windowsRead,
        imagesCreated,
        imagesReused,
        collectionsCreated,
        collectionsReused,
        cacheHitCount: scan.cacheHitCount,
        droppedFields,
        listIssueCount: listing.issues.length,
        scanIssueCount: scan.issues.length,
        errors,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to import an Art Archive batch.',
      statusCode,
    }
  }
})

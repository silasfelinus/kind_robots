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
  loadImportedArchivePaths,
  selectPendingPaths,
} from '@/server/utils/artArchiveImportedPaths'
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

    const listing = await listArchiveFilePaths(getArtArchiveRoot())

    // Only the paths, never the rows: the point of this endpoint is that it
    // never holds the whole archive in memory, and loadKnownArchiveFiles()
    // would pull every entry's metadata just to answer "is this one done".
    // Which rows count as done is state-aware and shared with scan-status --
    // a MISSING, PENDING, ERROR or quarantined row is work still to do.
    const imported = await loadImportedArchivePaths(prisma.archiveEntry)
    const pending = selectPendingPaths(listing.relativePaths, imported)
    const batch = pending.slice(0, limit)

    const scan = await hydrateArchiveFiles(listing.root, batch)

    let imagesCreated = 0
    let imagesReused = 0
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
    const remaining = Math.max(0, pending.length - completed)

    return {
      success: true,
      message:
        `Imported ${completed} of ${processed} file(s) in this batch; ` +
        `${remaining} still pending of ${listing.relativePaths.length} on disk.`,
      data: {
        root: listing.root,
        filesOnDisk: listing.relativePaths.length,
        alreadyImported: imported.size,
        batchSize: batch.length,
        processed,
        completed,
        remaining,
        done: remaining === 0,
        imagesCreated,
        imagesReused,
        collectionsCreated,
        collectionsReused,
        cacheHitCount: scan.cacheHitCount,
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

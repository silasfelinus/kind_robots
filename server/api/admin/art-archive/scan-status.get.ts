// /server/api/admin/art-archive/scan-status.get.ts
//
// How much of the archive is imported, without reading a single image.
//
// dry-run.post.ts answers a richer question (per-file reconciliation plan and
// resource-match evidence) and pays for it by hydrating every file in the
// archive. At 10s-100s of thousands of files that is not a preview, it is the
// whole job -- so the question people actually ask first ("how many are there,
// how many are left") needs an answer that costs a directory walk and one
// indexed count (art-archive/t-041).
import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import { listArchiveFilePaths } from '@/server/utils/artArchiveScanner'
import {
  readListingCache,
  writeListingCache,
} from '@/server/utils/artArchiveListingCache'
import {
  loadImportedArchivePaths,
  selectPendingPaths,
} from '@/server/utils/artArchiveImportedPaths'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const root = getArtArchiveRoot()

    // Reuses the walk an import run already took, when there is one. Reading
    // the status of a 240,856-file archive should not cost a fresh traversal
    // every time someone asks. The cursor is left alone -- this only reads.
    let listing = readListingCache(root)
    if (!listing) {
      const fresh = await listArchiveFilePaths(root)
      listing = writeListingCache({
        root: fresh.root,
        relativePaths: fresh.relativePaths,
        issues: fresh.issues,
      })
    }

    // Same state-aware predicate import-batch resumes from, so this count and
    // the set that endpoint skips can never diverge.
    const imported = await loadImportedArchivePaths(prisma.archiveEntry)
    const pending = selectPendingPaths(listing.relativePaths, imported).length

    return {
      success: true,
      message:
        `${listing.relativePaths.length} file(s) on disk, ` +
        `${listing.relativePaths.length - pending} imported, ${pending} pending.`,
      data: {
        root: listing.root,
        filesOnDisk: listing.relativePaths.length,
        importedEntries: imported.size,
        importedFromDisk: listing.relativePaths.length - pending,
        pending,
        done: pending === 0,
        listIssueCount: listing.issues.length,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to read Art Archive scan status.',
      statusCode,
    }
  }
})

// /server/api/admin/art-archive/import.post.ts
//
// Admin-gated wrapper around the scan-then-import flow (art-archive/t-024):
// triggers scanArchiveRoot() + importArchiveScan() over the configured
// PRIVATE_PATH archive root and returns created/reused counts plus the same
// resource-provenance evidence available to the CLI, as JSON.
import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import { scanArchiveRoot } from '@/server/utils/artArchiveScanner'
import { importArchiveScan } from '@/server/utils/artArchiveImporter'
import {
  matchArchiveResources,
  summarizeResourceMatch,
  aggregateResourceMatchSummaries,
} from '@/server/utils/artArchiveResourceMatch'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const scan = await scanArchiveRoot(getArtArchiveRoot())
    const summary = await importArchiveScan(scan, auth.user.id)
    const resourceMatches = await Promise.all(
      scan.files.map(async (file) => ({
        relativePath: file.relativePath,
        matches: await matchArchiveResources(
          file.metadata,
          file.relativePath,
          file.parentFolder,
          prisma.resource,
        ),
      })),
    )

    const { filesWithMatchEvidence, unmatchedModels } = aggregateResourceMatchSummaries(
      resourceMatches.map(({ matches }) => summarizeResourceMatch(matches)),
    )

    return {
      success: true,
      message: `Imported ${summary.filesScanned} scanned file(s) from ${summary.root}.`,
      data: {
        ...summary,
        filesWithMatchEvidence,
        unmatchedModels,
        resourceMatches,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to import the Art Archive.',
      statusCode,
    }
  }
})

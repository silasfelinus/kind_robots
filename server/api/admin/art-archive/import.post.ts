// /server/api/admin/art-archive/import.post.ts
//
// Admin-gated wrapper around the t-022 scan-then-import CLI flow
// (art-archive/t-024): triggers scanArchiveRoot() + importArchiveScan() over
// the configured PRIVATE_PATH archive root and returns the same created/
// reused counts utils/scripts/importArtArchive.ts reports, as JSON -- so an
// admin can run a reconciliation pass without shell access to the
// container, and the future admin archive-curation UI (m3) has a route to
// call.
import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import { scanArchiveRoot } from '@/server/utils/artArchiveScanner'
import { importArchiveScan } from '@/server/utils/artArchiveImporter'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const scan = await scanArchiveRoot(getArtArchiveRoot())
    const summary = await importArchiveScan(scan, auth.user.id)

    return {
      success: true,
      message: `Imported ${summary.filesScanned} scanned file(s) from ${summary.root}.`,
      data: summary,
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

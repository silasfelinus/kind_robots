// /server/api/art/collection/folders/sync.post.ts
//
// Bulk parity: ensure EVERY folder under public/images/ has a real DB
// ArtCollection. Enumerates listFolderCollections() and syncs each folder,
// creating any missing collection at its slug and linking new images. This is
// the one-shot that brings orphan folders (e.g. `comfy`, freshly-generated
// batches) into the DB so they show up on every collection surface, not just
// the folder-aware gallery.
//
// Idempotent — safe to run repeatedly; re-running only adds new images and
// never duplicates a collection (keyed on the unique slug). Machine auth
// (JWT / user apiKey / beta admin) so the browser and conductor automation can
// both trigger it, e.g. right after the art pipeline commits new folders.
//
// Reuses the exact per-slug routine (syncFolderCollection) so the single-slug
// and bulk endpoints can never drift apart. Folders are synced sequentially to
// stay gentle on the DB connection pool.
import { defineEventHandler, getRequestURL } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { listFolderCollections } from '~/server/utils/folderCollections'
import {
  syncFolderCollection,
  type FolderSyncResult,
} from '~/server/utils/syncFolderCollection'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const origin = getRequestURL(event).origin

    const folders = await listFolderCollections(origin)

    const results: FolderSyncResult[] = []
    const failures: { slug: string; error: string }[] = []
    let createdCollections = 0
    let createdImages = 0
    let skipped = 0

    for (const folder of folders) {
      try {
        // Pass the already-resolved images so we don't re-list every folder.
        const result = await syncFolderCollection(
          folder.slug,
          origin,
          auth.user.id,
          folder.images,
        )
        if (!result) continue
        results.push(result)
        if (result.createdCollection) createdCollections += 1
        createdImages += result.created
        skipped += result.skipped
      } catch (err) {
        // One bad folder shouldn't abort the whole sweep — record and continue.
        failures.push({
          slug: folder.slug,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return {
      success: true,
      message: `Synced ${results.length} folder(s): ${createdCollections} new collection(s), ${createdImages} new image(s)${
        skipped ? `, ${skipped} over-long path(s) skipped` : ''
      }${failures.length ? `, ${failures.length} failed` : ''}.`,
      data: {
        folders: results.length,
        createdCollections,
        createdImages,
        skipped,
        failures,
        results,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to sync folder collections.',
      statusCode,
    }
  }
})

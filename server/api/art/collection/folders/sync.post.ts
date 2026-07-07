// /server/api/art/collection/folders/sync.post.ts
//
// Bulk parity: ensure folders under public/images/ have real DB
// ArtCollections. A full site can have hundreds of folders, and resolving every
// folder's manifest + writing images in ONE serverless invocation blows the
// function time limit (FUNCTION_INVOCATION_TIMEOUT). So this endpoint works in
// bounded PAGES: it lists slugs cheaply (no per-folder image resolution up
// front), then syncs a slice [offset, offset+limit) and returns `nextOffset` so
// the caller loops until done. Each call stays comfortably under the timeout.
//
// Body (all optional): { limit?: number, offset?: number }.
// Idempotent, machine-auth. Reuses the per-slug routine (syncFolderCollection).
import { defineEventHandler, getRequestURL, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { listFolderSlugs } from '~/server/utils/folderCollections'
import {
  syncFolderCollection,
  type FolderSyncResult,
} from '~/server/utils/syncFolderCollection'

// Folders processed per call. Kept modest so one page (its manifest fetches +
// DB writes) finishes well inside the serverless time budget.
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const origin = getRequestURL(event).origin

    const body = (await readBody(event).catch(() => ({}))) as {
      limit?: unknown
      offset?: unknown
    }
    const limit = clampInt(body?.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
    const offset = clampInt(body?.offset, 0, 0, Number.MAX_SAFE_INTEGER)

    const slugs = await listFolderSlugs(origin)
    const slice = slugs.slice(offset, offset + limit)

    const results: FolderSyncResult[] = []
    const failures: { slug: string; error: string }[] = []
    let createdCollections = 0
    let createdImages = 0
    let skipped = 0

    for (const slug of slice) {
      try {
        const result = await syncFolderCollection(slug, origin, auth.user.id)
        if (!result) continue
        results.push(result)
        if (result.createdCollection) createdCollections += 1
        createdImages += result.created
        skipped += result.skipped
      } catch (err) {
        // One bad folder shouldn't abort the page — record and continue.
        failures.push({
          slug,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const nextOffset = offset + slice.length
    const done = nextOffset >= slugs.length

    return {
      success: true,
      message: `Page ${offset}-${nextOffset} of ${slugs.length} folder(s): ${createdCollections} new collection(s), ${createdImages} new image(s)${
        skipped ? `, ${skipped} over-long path(s) skipped` : ''
      }${failures.length ? `, ${failures.length} failed` : ''}.${done ? ' Done.' : ''}`,
      data: {
        totalFolders: slugs.length,
        offset,
        processed: slice.length,
        nextOffset: done ? null : nextOffset,
        done,
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

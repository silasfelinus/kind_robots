// /server/api/art/collection/folder/[slug]/sync.post.ts
//
// Sync a folder into a real DB ArtCollection. A folder under public/images/
// whose name matches a slug IS that slug's collection (Silas, 2026-07-04);
// this endpoint materializes that: it ensures an ArtCollection exists at the
// slug and creates a lightweight ArtImage row (imagePath -> the public URL,
// no imageData) for every folder image not already linked, then connects them.
//
// Idempotent: re-syncing only adds images that appeared since last time; it
// never duplicates an image already in the collection (dedup by imagePath).
// Machine auth (JWT / user apiKey / beta admin) so both the browser gallery
// and conductor automation can trigger it.
import {
  defineEventHandler,
  getRouterParam,
  getRequestURL,
  createError,
} from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { SLUG_PATTERN } from '~/server/utils/folderCollections'
import {
  syncFolderCollection,
  MAX_IMAGE_PATH,
} from '~/server/utils/syncFolderCollection'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    const slug = String(getRouterParam(event, 'slug') || '')
      .trim()
      .toLowerCase()

    if (!SLUG_PATTERN.test(slug)) {
      throw createError({ statusCode: 400, message: 'Invalid collection slug.' })
    }

    const origin = getRequestURL(event).origin
    const result = await syncFolderCollection(slug, origin, auth.user.id)

    if (!result) {
      throw createError({
        statusCode: 404,
        message: `No folder collection found for "${slug}" - nothing to sync.`,
      })
    }

    const { created, skipped } = result

    return {
      success: true,
      message: created
        ? `Synced ${created} new image(s) into "${slug}".${skipped ? ` Skipped ${skipped} over-long path(s).` : ''}`
        : skipped
          ? `"${slug}": nothing synced; ${skipped} image path(s) exceed the ${MAX_IMAGE_PATH}-char limit.`
          : `"${slug}" already up to date.`,
      data: result,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to sync folder collection.',
      statusCode,
    }
  }
})

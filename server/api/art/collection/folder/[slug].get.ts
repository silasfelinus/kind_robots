// /server/api/art/collection/folder/[slug].get.ts
//
// Folder-based art collection: every image in a slug's folder is part of that
// slug's collection just by existing there. Resolution (nested -> flat ->
// artcollections, filesystem in dev, master-index + per-folder manifest on the
// CDN) lives in ~/server/utils/folderCollections so this route, the
// enumeration route, and the sync route all agree on what a folder holds.
import { defineEventHandler, getRouterParam, getRequestURL, createError } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  resolveFolderImages,
  SLUG_PATTERN,
} from '~/server/utils/folderCollections'

export default defineEventHandler(async (event) => {
  try {
    const slug = String(getRouterParam(event, 'slug') || '')
      .trim()
      .toLowerCase()

    if (!SLUG_PATTERN.test(slug)) {
      throw createError({ statusCode: 400, message: 'Invalid collection slug.' })
    }

    const origin = getRequestURL(event).origin
    const images = await resolveFolderImages(slug, origin)

    if (images === null) {
      throw createError({
        statusCode: 404,
        message: `No folder collection found for "${slug}".`,
      })
    }

    return {
      success: true,
      message: `Folder collection for ${slug}.`,
      data: { slug, images },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load folder collection.',
      statusCode,
    }
  }
})

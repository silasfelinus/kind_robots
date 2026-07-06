// /server/api/art/collection/folders.get.ts
//
// Enumerate every folder-based art collection the site can see: one entry per
// slug that owns a folder of images under public/images/. This is the
// "display collections by folders" surface - the gallery lists these
// alongside the DB-backed ArtCollections, and offers a sync action
// (POST .../folder/[slug]/sync) to promote a folder into a real collection.
//
// Public/read-only: folder contents are already public assets, so no auth is
// required to list them (matching the single-slug folder route).
import { defineEventHandler, getRequestURL } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { listFolderCollections } from '~/server/utils/folderCollections'

export default defineEventHandler(async (event) => {
  try {
    const origin = getRequestURL(event).origin
    const collections = await listFolderCollections(origin)

    return {
      success: true,
      message: collections.length
        ? `${collections.length} folder collection(s).`
        : 'No folder collections found.',
      data: collections.map((collection) => ({
        slug: collection.slug,
        images: collection.images,
        count: collection.images.length,
        preview: collection.images[0] ?? null,
      })),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to list folder collections.',
      statusCode,
    }
  }
})

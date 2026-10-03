// /server/api/admin/art-archive/catalog.get.ts
//
// Admin-only browsing catalog for the Butterfly Gallery: every archive folder
// that holds active entries (with counts), and every active, non-folder
// ArtCollection an entry can be added to. The gallery's folder/collection
// dropdowns read this instead of summarizing whichever page of the pile
// happens to be loaded, so a folder with no entries on page one still
// appears and can be picked.
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { archiveCollectionValue } from '~/server/utils/artArchiveCollectionRefs'

const FOLDER_COLLECTION_PREFIX = 'archive-folder-'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user)) {
      throw createError({
        statusCode: 403,
        message:
          'Mature-content access is required for the Art Archive catalog.',
      })
    }

    const [folderGroups, collections] = await Promise.all([
      prisma.archiveEntry.groupBy({
        by: ['parentFolder'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.artCollection.findMany({
        where: {
          isActive: true,
          OR: [
            { slug: null },
            { NOT: { slug: { startsWith: FOLDER_COLLECTION_PREFIX } } },
          ],
        },
        select: {
          id: true,
          slug: true,
          label: true,
          _count: { select: { ArtImages: true } },
        },
        orderBy: { label: 'asc' },
      }),
    ])

    const folders = folderGroups
      .map((group) => ({
        value: group.parentFolder ?? '',
        label: group.parentFolder || 'Archive Root',
        count: group._count._all,
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    return {
      success: true,
      message: `${folders.length} folder(s), ${collections.length} collection(s).`,
      data: {
        folders,
        collections: collections.map((collection) => ({
          id: collection.id,
          value: archiveCollectionValue(collection),
          label: collection.label || archiveCollectionValue(collection),
          count: collection._count.ArtImages,
        })),
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load the Art Archive catalog.',
      statusCode,
    }
  }
})

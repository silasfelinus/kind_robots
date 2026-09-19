// /server/api/admin/art-archive/entries/[id].get.ts
//
// Admin-only detail view for one Art Archive ledger entry (art-archive/
// t-009): the full ArchiveEntry row plus its linked ArtImage and folder
// ArtCollection, with extractedMetadata/matchSummary parsed from their
// stored JSON strings rather than handed back as opaque text.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'

function parseJsonSafe(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user)) {
      throw createError({
        statusCode: 403,
        message: 'Mature-content access is required for Art Archive entries.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const entry = await prisma.archiveEntry.findUnique({ where: { id } })
    if (!entry) {
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id} not found.`,
      })
    }

    const [artImage, folderCollection] = await Promise.all([
      entry.artImageId
        ? prisma.artImage.findUnique({
            where: { id: entry.artImageId },
            select: {
              id: true,
              fileName: true,
              path: true,
              fileType: true,
              isPublic: true,
              isMature: true,
              isActive: true,
              checkpointResourceId: true,
              promptString: true,
              negativePrompt: true,
              seed: true,
              cfg: true,
              sampler: true,
              steps: true,
            },
          })
        : null,
      entry.folderCollectionId
        ? prisma.artCollection.findUnique({
            where: { id: entry.folderCollectionId },
            select: {
              id: true,
              slug: true,
              label: true,
              parentFolder: true,
              isPublic: true,
              isMature: true,
              isActive: true,
            },
          })
        : null,
    ])

    // artImage.path is a raw path relative to the private archive root --
    // not web-servable. Point at the byte-serving route (art-archive/t-029)
    // instead of the unreachable filesystem path.
    const hasImage = Boolean(artImage?.path)
    return {
      success: true,
      message: `Archive entry #${id} fetched.`,
      data: {
        entry: {
          ...entry,
          extractedMetadata: parseJsonSafe(entry.extractedMetadata),
          matchSummary: parseJsonSafe(entry.matchSummary),
          imagePath: hasImage ? `/api/admin/art-archive/entries/${id}/file` : null,
          thumbnailPath: hasImage
            ? `/api/admin/art-archive/entries/${id}/file?variant=thumbnail`
            : null,
        },
        artImage,
        folderCollection,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to fetch archive entry.',
      statusCode,
    }
  }
})

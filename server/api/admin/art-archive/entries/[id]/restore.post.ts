// /server/api/admin/art-archive/entries/[id]/restore.post.ts
//
// Admin-only "undo" for a quarantined ArchiveEntry (art-archive/t-012): the
// exact inverse of quarantine.post.ts. If quarantine relocated the real
// file into the trash subtree, this moves it back to
// `preQuarantineRelativePath` (root-confined, no-overwrite, same as every
// other Art Archive file action) before flipping the entry and its linked
// ArtImage back to isActive. An entry quarantined while already MISSING
// never had a file moved, so restoring it only needs the flag flip.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { restoreConfinedArchiveFile } from '~/server/utils/artArchiveFileOps'
import { realpath } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: {
        id: true,
        relativePath: true,
        artImageId: true,
        isActive: true,
        preQuarantineRelativePath: true,
      },
    })
    if (!entry)
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id} not found.`,
      })
    if (entry.isActive) {
      return {
        success: true,
        message: `Archive entry #${id} was not quarantined.`,
        data: { alreadyActive: true },
        statusCode: 200,
      }
    }

    let restoredRelativePath: string | null = null
    if (entry.preQuarantineRelativePath) {
      const resolvedRoot = await realpath(getArtArchiveRoot())
      await restoreConfinedArchiveFile(
        resolvedRoot,
        entry.relativePath,
        entry.preQuarantineRelativePath,
      )
      restoredRelativePath = entry.preQuarantineRelativePath
    }

    await prisma.$transaction(async (tx) => {
      await tx.archiveEntry.update({
        where: { id },
        data: {
          isActive: true,
          ...(restoredRelativePath
            ? {
                relativePath: restoredRelativePath,
                preQuarantineRelativePath: null,
              }
            : {}),
        },
      })
      if (entry.artImageId) {
        await tx.artImage.update({
          where: { id: entry.artImageId },
          data: { isActive: true },
        })
      }
    })

    return {
      success: true,
      message: `Archive entry #${id} restored${restoredRelativePath ? ` to ${restoredRelativePath}` : ''}.`,
      data: { alreadyActive: false, restoredRelativePath },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to restore archive entry.',
      statusCode,
    }
  }
})

// /server/api/admin/art-archive/entries/[id]/quarantine.post.ts
//
// Admin-only "delete" for one ArchiveEntry (art-archive/t-009). Never
// unlinks/erases bytes -- the real file is relocated into the archive
// root's reserved trash subtree (artArchiveFileOps.ts's
// quarantineConfinedArchiveFile), matching this task's own `stakes:
// reversible` and the project's isActive-flag convention for deletion
// everywhere else in the schema. The entry and its linked ArtImage are
// marked inactive so they drop out of the default browse/filter list
// (index.get.ts defaults to isActive-only) without losing any data.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { quarantineConfinedArchiveFile } from '~/server/utils/artArchiveFileOps'
import { realpath } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid archive entry id.' })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { id: true, relativePath: true, artImageId: true, isActive: true, processState: true },
    })
    if (!entry) throw createError({ statusCode: 404, message: `Archive entry #${id} not found.` })
    if (!entry.isActive) {
      return {
        success: true,
        message: `Archive entry #${id} was already quarantined.`,
        data: { alreadyQuarantined: true },
        statusCode: 200,
      }
    }

    const resolvedRoot = await realpath(getArtArchiveRoot())
    const trashRelativePath =
      entry.processState === 'MISSING'
        ? null // the file is already gone from the filesystem -- nothing to relocate
        : await quarantineConfinedArchiveFile(resolvedRoot, entry.id, entry.relativePath)

    await prisma.$transaction(async (tx) => {
      await tx.archiveEntry.update({
        where: { id },
        data: {
          isActive: false,
          // Record where the file used to live so a later restore
          // (art-archive/t-012) can move it back -- only meaningful when a
          // relocation actually happened; a MISSING entry's relativePath is
          // left as-is, so there is nothing to restore to.
          ...(trashRelativePath
            ? { relativePath: trashRelativePath, preQuarantineRelativePath: entry.relativePath }
            : {}),
        },
      })
      if (entry.artImageId) {
        await tx.artImage.update({ where: { id: entry.artImageId }, data: { isActive: false } })
      }
    })

    return {
      success: true,
      message: `Archive entry #${id} quarantined${trashRelativePath ? ` to ${trashRelativePath}` : ''}.`,
      data: { alreadyQuarantined: false, trashRelativePath },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to quarantine archive entry.',
      statusCode,
    }
  }
})

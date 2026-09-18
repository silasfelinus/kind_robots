// /server/api/admin/art-archive/entries/[id]/move.post.ts
//
// Admin-only safe filesystem action (art-archive/t-009): relocates one
// ArchiveEntry's real file to a new relativePath under the configured
// archive root, root-confined and path-traversal safe
// (artArchiveFileOps.ts), then updates the ledger/ArtImage/folder
// ArtCollection to match. Automatic scans never move anything -- this is
// the deliberate, admin-triggered counterpart the task note calls for.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import path from 'node:path'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { moveConfinedArchiveFile } from '~/server/utils/artArchiveFileOps'
import { ensureFolderCollection } from '~/server/utils/artArchiveImporter'
import { realpath } from 'node:fs/promises'

type MoveBody = { newRelativePath?: string }

function toPosixRelative(root: string, absolute: string): string {
  return path.relative(root, absolute).split(path.sep).join('/')
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid archive entry id.' })
    }

    const body = await readBody<MoveBody>(event)
    const newRelativePath = body?.newRelativePath?.trim()
    if (!newRelativePath) {
      throw createError({ statusCode: 400, message: 'newRelativePath is required.' })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { id: true, relativePath: true, artImageId: true, folderCollectionId: true, isActive: true, processState: true },
    })
    if (!entry) throw createError({ statusCode: 404, message: `Archive entry #${id} not found.` })
    if (!entry.isActive || entry.processState === 'MISSING') {
      throw createError({
        statusCode: 400,
        message: 'Cannot move an inactive or missing archive entry.',
      })
    }

    const resolvedRoot = await realpath(getArtArchiveRoot())
    await moveConfinedArchiveFile(resolvedRoot, entry.relativePath, newRelativePath)

    // The move already succeeded on disk by this point -- resolve the final
    // posix-relative path from what's actually on the filesystem now,
    // rather than trusting the raw request string verbatim, so the ledger
    // always reflects reality even if the two differ in formatting.
    const finalAbsolute = await realpath(path.resolve(resolvedRoot, newRelativePath))
    const finalRelativePath = toPosixRelative(resolvedRoot, finalAbsolute)
    const parentFolder = path.posix.dirname(finalRelativePath)
    const normalizedParentFolder = parentFolder === '.' ? '' : parentFolder

    const updated = await prisma.$transaction(async (tx) => {
      const collection = await ensureFolderCollection(tx, normalizedParentFolder, auth.user.id)

      if (entry.artImageId) {
        await tx.artImage.update({
          where: { id: entry.artImageId },
          data: {
            path: finalRelativePath.slice(0, 764),
            fileName: path.posix.basename(finalRelativePath).slice(0, 764),
          },
        })
        if (entry.folderCollectionId && entry.folderCollectionId !== collection.id) {
          await tx.artCollection.update({
            where: { id: entry.folderCollectionId },
            data: { ArtImages: { disconnect: { id: entry.artImageId } } },
          })
        }
        await tx.artCollection.update({
          where: { id: collection.id },
          data: { ArtImages: { connect: { id: entry.artImageId } } },
        })
      }

      return tx.archiveEntry.update({
        where: { id },
        data: {
          relativePath: finalRelativePath,
          parentFolder: normalizedParentFolder || null,
          folderCollectionId: collection.id,
        },
      })
    })

    return {
      success: true,
      message: `Archive entry #${id} moved to ${finalRelativePath}.`,
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to move archive entry.',
      statusCode,
    }
  }
})

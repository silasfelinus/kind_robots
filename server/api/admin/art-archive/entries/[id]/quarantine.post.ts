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
import { quarantineArchiveEntry } from '~/server/utils/artArchiveQuarantine'

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
    const result = await quarantineArchiveEntry(entry)

    return {
      success: true,
      message: result.alreadyQuarantined
        ? `Archive entry #${id} was already quarantined.`
        : `Archive entry #${id} quarantined${result.trashRelativePath ? ` to ${result.trashRelativePath}` : ''}.`,
      data: result,
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

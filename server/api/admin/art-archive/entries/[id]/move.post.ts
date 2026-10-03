// /server/api/admin/art-archive/entries/[id]/move.post.ts
//
// Admin-only safe filesystem action (art-archive/t-009): relocates one
// ArchiveEntry's real file to a new relativePath under the configured
// archive root, root-confined and path-traversal safe
// (artArchiveFileOps.ts), then updates the ledger/ArtImage/folder
// ArtCollection to match (artArchiveMove.ts). Automatic scans never move
// anything -- this is the deliberate, admin-triggered counterpart the task
// note calls for.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { moveArchiveEntry } from '~/server/utils/artArchiveMove'

type MoveBody = { newRelativePath?: string }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const body = await readBody<MoveBody>(event)
    const newRelativePath = body?.newRelativePath?.trim()
    if (!newRelativePath) {
      throw createError({
        statusCode: 400,
        message: 'newRelativePath is required.',
      })
    }

    const moved = await moveArchiveEntry(id, newRelativePath, auth.user.id)

    return {
      success: true,
      message: `Archive entry #${id} moved to ${moved.relativePath}.`,
      data: moved,
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

// /server/api/admin/art-archive/entries/move-batch.post.ts
//
// Admin-only batch folder move for the Butterfly Gallery: relocates each
// requested ArchiveEntry's real file into one destination folder under the
// archive root and updates its ledger row, ArtImage path, and folder
// collection to match (artArchiveMove.ts). Entries move one at a time and
// report individually, so one locked or missing file never strands the rest
// of the batch half-described.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { normalizeArchiveFolderInput } from '~/server/utils/artArchiveFileOps'
import {
  moveArchiveEntryToFolder,
  type MovedArchiveEntry,
} from '~/server/utils/artArchiveMove'

type MoveBatchBody = { ids?: unknown; folder?: unknown }

const MAX_BATCH = 500

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value) || !value.length) {
    throw createError({
      statusCode: 400,
      message: 'ids must be a non-empty array.',
    })
  }
  const ids = [...new Set(value.map(Number))]
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw createError({
      statusCode: 400,
      message: 'ids must contain positive integer IDs.',
    })
  }
  if (ids.length > MAX_BATCH) {
    throw createError({
      statusCode: 400,
      message: `Move at most ${MAX_BATCH} entries per request.`,
    })
  }
  return ids
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<MoveBatchBody>(event)
    const ids = normalizeIds(body?.ids)
    if (typeof body?.folder !== 'string') {
      throw createError({ statusCode: 400, message: 'folder is required.' })
    }
    const folder = normalizeArchiveFolderInput(body.folder)

    const moved: MovedArchiveEntry[] = []
    const failures: { id: number; message: string }[] = []
    for (const id of ids) {
      try {
        moved.push(await moveArchiveEntryToFolder(id, folder, auth.user.id))
      } catch (error: unknown) {
        failures.push({
          id,
          message: errorHandler(error).message || 'Move failed.',
        })
      }
    }

    const destination = folder || 'the archive root'
    return {
      success: moved.length > 0 || failures.length === 0,
      message: failures.length
        ? `Moved ${moved.length} of ${ids.length} to ${destination}; ${failures.length} failed.`
        : `Moved ${moved.length} to ${destination}.`,
      data: { folder, moved, failures },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to move archive entries.',
      statusCode,
    }
  }
})

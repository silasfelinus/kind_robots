import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { retryFailedDownloadRequest } from '../../../utils/retryDownloadRequest'

type BulkBody = { operation?: 'retry' | 'delete'; ids?: number[] }
const MAX_BATCH = 50

/** Explicit IDs prevent a stale dashboard from accidentally mutating unseen rows. */
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    const body = await readBody<BulkBody>(event)
    const ids = body?.ids
    if (
      (body?.operation !== 'retry' && body?.operation !== 'delete') ||
      !Array.isArray(ids) ||
      ids.length < 1 ||
      ids.length > MAX_BATCH ||
      !ids.every((id) => Number.isSafeInteger(id) && id > 0) ||
      new Set(ids).size !== ids.length
    ) {
      throw createError({
        statusCode: 400,
        message: 'Select between 1 and 50 distinct download IDs.',
      })
    }

    if (body.operation === 'delete') {
      const deleted = await prisma.downloadRequest.deleteMany({
        where: { id: { in: ids }, status: 'FAILED' },
      })
      return {
        success: true,
        message: 'Failed history entries cleared. No model files were deleted.',
        data: { changed: deleted.count, skipped: ids.length - deleted.count },
        statusCode: 200,
      }
    }

    let changed = 0
    const failed: { id: number; reason: string }[] = []
    for (const id of ids) {
      try {
        await retryFailedDownloadRequest(id)
        changed += 1
      } catch (caught) {
        // Keep moving when a model is already imported or independently queued.
        failed.push({
          id,
          reason: caught instanceof Error ? caught.message : 'Unable to retry.',
        })
      }
    }
    return {
      success: true,
      message: 'Failed download retry pass finished.',
      data: { changed, skipped: failed.length, failed },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Unable to update failed downloads.',
      statusCode,
    }
  }
})

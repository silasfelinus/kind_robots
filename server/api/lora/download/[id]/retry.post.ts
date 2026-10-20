import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseHeader,
} from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireAdminApiUser } from '../../../../utils/authGuard'
import { retryFailedDownloadRequest } from '../../../../utils/retryDownloadRequest'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    setResponseHeader(event, 'Cache-Control', 'private, no-store')

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid download id.' })
    }

    await retryFailedDownloadRequest(id)

    return {
      success: true,
      message: 'Download requeued.',
      data: { id, status: 'PENDING' },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Unable to retry download.',
      statusCode,
    }
  }
})

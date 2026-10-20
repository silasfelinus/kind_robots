import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseHeader,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireAdminApiUser } from '../../../../utils/authGuard'

/** Removes a completed/failed download HISTORY record only, never local files. */
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid download id.' })
    }

    const deleted = await prisma.downloadRequest.deleteMany({
      where: { id, status: { in: ['DONE', 'FAILED'] } },
    })
    if (deleted.count !== 1) {
      throw createError({
        statusCode: 409,
        message: 'Download is missing or active. Refresh before deleting.',
      })
    }

    return {
      success: true,
      message: 'Download history entry deleted. Model files were not changed.',
      data: { id },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Unable to delete download history.',
      statusCode,
    }
  }
})

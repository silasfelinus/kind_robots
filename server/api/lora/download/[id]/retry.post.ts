import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseHeader,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireAdminApiUser } from '../../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    setResponseHeader(event, 'Cache-Control', 'private, no-store')

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid download id.' })
    }

    const existing = await prisma.downloadRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        resourceId: true,
        civitaiModelVersionId: true,
      },
    })
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Download not found.' })
    }
    if (existing.status !== 'FAILED') {
      throw createError({
        statusCode: 409,
        message: 'Only failed downloads can be retried.',
      })
    }

    if (existing.resourceId) {
      throw createError({
        statusCode: 409,
        message: 'This download already has an imported Resource.',
      })
    }

    if (existing.civitaiModelVersionId) {
      const [owned, inFlight] = await Promise.all([
        prisma.resource.findFirst({
          where: { civitaiModelVersionId: existing.civitaiModelVersionId },
          select: { id: true },
        }),
        prisma.downloadRequest.findFirst({
          where: {
            id: { not: id },
            civitaiModelVersionId: existing.civitaiModelVersionId,
            status: { in: ['PENDING', 'CLAIMED'] },
          },
          select: { id: true },
        }),
      ])
      if (owned || inFlight) {
        throw createError({
          statusCode: 409,
          message: owned
            ? 'This model is already in Resources.'
            : 'Another download of this model is already queued.',
        })
      }
    }

    const updated = await prisma.downloadRequest.updateMany({
      where: { id, status: 'FAILED' },
      data: {
        status: 'PENDING',
        attempts: 0,
        claimedAt: null,
        claimedBy: null,
        error: null,
      },
    })
    if (updated.count !== 1) {
      throw createError({
        statusCode: 409,
        message: 'Download status changed; refresh the queue.',
      })
    }

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

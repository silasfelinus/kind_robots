// /server/api/resources/[id]/preview-job/[jobId].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { parseArtJobPayload } from '~/server/utils/artJobPayload'
import { resourceGallerySelect } from '../../gallery'

export default defineEventHandler(async (event) => {
  try {
    const resourceId = Number(getRouterParam(event, 'id'))
    const jobId = Number(getRouterParam(event, 'jobId'))

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Resource ID.' })
    }

    if (!Number.isInteger(jobId) || jobId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtJob ID.' })
    }

    const auth = await requireMachineUser(event)
    const job = await prisma.artJob.findUnique({ where: { id: jobId } })

    if (!job) {
      throw createError({ statusCode: 404, message: 'Preview ArtJob not found.' })
    }

    if (!auth.isAdmin && job.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to inspect this preview ArtJob.',
      })
    }

    const payload = parseArtJobPayload(job.payload)
    const previewResourceId = Number(payload.previewResourceId)

    if (previewResourceId !== resourceId) {
      throw createError({
        statusCode: 409,
        message: 'This ArtJob does not belong to the requested Resource preview.',
      })
    }

    let resource = null

    if (job.status === 'DONE' && job.artImageId) {
      resource = await prisma.resource.update({
        where: { id: resourceId },
        data: {
          artImageId: job.artImageId,
          imagePath: null,
        },
        select: resourceGallerySelect,
      })
    }

    return {
      success: true,
      message:
        job.status === 'DONE' && resource
          ? 'Resource preview attached.'
          : `Preview ArtJob is ${job.status}.`,
      data: {
        job: {
          id: job.id,
          status: job.status,
          artImageId: job.artImageId,
          error: job.error,
        },
        resource,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to inspect Resource preview job.',
      data: null,
      statusCode,
    }
  }
})

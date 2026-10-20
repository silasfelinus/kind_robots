import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { videoGeneratorMetadata } from '../../../utils/videoGeneratorJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid video job ID.' })
    }
    const job = await prisma.artJob.findFirst({
      where: { id, userId: auth.user.id },
    })
    if (!job || !videoGeneratorMetadata(job)) {
      throw createError({ statusCode: 404, message: 'Video job not found.' })
    }
    if (job.status === 'PENDING' || job.status === 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: 'An active render cannot be deleted. Wait for it to finish.',
      })
    }
    const deleted = await prisma.artJob.deleteMany({
      where: {
        id,
        userId: auth.user.id,
        status: { in: ['DONE', 'FAILED', 'CANCELLED'] },
      },
    })
    if (deleted.count !== 1) {
      throw createError({ statusCode: 409, message: 'Job status changed. Refresh and retry.' })
    }
    return {
      success: true,
      statusCode: 200,
      message: 'Job removed from history. Its rendered artwork was kept.',
      data: { id },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: handled.message || 'Unable to delete video job.',
    }
  }
})

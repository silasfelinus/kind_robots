// /server/api/art/queue/[id]/priority.post.ts
//
// Admin action: change the priority of a pending ArtJob. The relay already
// claims runnable work by priority DESC, id ASC, so raising a job here moves it
// ahead of normal-priority work without rewriting timestamps or duplicating it.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

type PriorityBody = {
  priority?: number | null
}

const MIN_PRIORITY = 0
const MAX_PRIORITY = 1000

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to prioritize jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as PriorityBody | null
    const priority = Number(body?.priority)

    if (
      !Number.isInteger(priority) ||
      priority < MIN_PRIORITY ||
      priority > MAX_PRIORITY
    ) {
      throw createError({
        statusCode: 400,
        message: `Priority must be an integer from ${MIN_PRIORITY} to ${MAX_PRIORITY}.`,
      })
    }

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status !== 'PENDING') {
      throw createError({
        statusCode: 409,
        message: `Only PENDING jobs can change priority; job ${id} is ${job.status}.`,
      })
    }

    const updated = await prisma.artJob.update({
      where: { id },
      data: { priority },
    })

    return {
      success: true,
      message:
        priority > 0
          ? `Job ${id} moved ahead with priority ${priority}.`
          : `Job ${id} returned to normal priority.`,
      data: { job: updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to update art job priority.',
      statusCode,
    }
  }
})

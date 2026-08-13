// /server/api/art/queue/[id]/priority.post.ts
//
// Admin action: change the priority of a pending ArtJob. The relay already
// claims runnable work by priority DESC, id ASC, so setting a job here moves it
// ahead of — or behind — other work without rewriting timestamps or duplicating
// it. The accepted range and its rationale live in utils/artJobPriority.ts;
// notably the floor is negative, because the bulk lanes queue below 0 and a
// demotion has to be able to reach them.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  describeArtJobPriorityChange,
  parseArtJobPriority,
} from '~/utils/artJobPriority'

type PriorityBody = {
  priority?: number | null
}

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

    const body = (await readBody(event).catch(
      () => null,
    )) as PriorityBody | null
    const parsed = parseArtJobPriority(body?.priority)

    if (!parsed.ok) {
      throw createError({ statusCode: 400, message: parsed.message })
    }

    const priority = parsed.priority

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
      message: describeArtJobPriorityChange(id, priority),
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

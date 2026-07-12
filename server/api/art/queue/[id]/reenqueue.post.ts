// /server/api/art/queue/[id]/reenqueue.post.ts
//
// Admin action: re-run a job by cloning it into a fresh PENDING ArtJob. Unlike
// requeue (which resets a stuck/failed job in place), this works on ANY job —
// including DONE — and never touches the original record, so its history and
// resulting ArtImage stay intact. Used by the dashboard's "Re-run" button to
// regenerate from a finished job.
//
// Admin/server credentials only.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to re-enqueue jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const source = await prisma.artJob.findUnique({ where: { id } })

    if (!source) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    // Clone the generation spec into a brand-new PENDING job. Preserve the
    // original owner/project so the regenerated ArtImage lands the same way.
    const job = await prisma.artJob.create({
      data: {
        engine: source.engine,
        payload: source.payload as Prisma.InputJsonValue,
        priority: source.priority,
        projectSlug: source.projectSlug,
        projectId: source.projectId,
        userId: source.userId,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: `Re-enqueued job ${id} as new job ${job.id}.`,
      data: { job, sourceJobId: id },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to re-enqueue art job.',
      statusCode,
    }
  }
})

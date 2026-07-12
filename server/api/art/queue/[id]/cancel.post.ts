// /server/api/art/queue/[id]/cancel.post.ts
//
// Admin action: cancel a job so the relay stops considering it. Sets status to
// CANCELLED (a terminal state no claim query matches). Used by the ArtJob
// dashboard to clear out jobs that should never run (bad prompt, wrong engine,
// duplicate). Already-DONE jobs are left alone.
//
// Admin/server credentials only.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

type CancelBody = {
  reason?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to cancel jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as CancelBody | null
    const reason =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 4000)
        : 'Cancelled by admin.'

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status === 'DONE') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is already DONE — cannot cancel.`,
      })
    }

    const updated = await prisma.artJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        claimedAt: null,
        claimedBy: null,
        error: reason,
      },
    })

    return {
      success: true,
      message: `Job ${id} cancelled.`,
      data: { job: updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to cancel art job.',
      statusCode,
    }
  }
})

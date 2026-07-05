// /server/api/art/queue/[id]/complete.post.ts
//
// The relay agent reports a claimed job's outcome. On success it has already
// uploaded the image via /api/art/save-generated and passes the resulting
// artImageId here. On failure the job returns to PENDING for another try,
// or lands at FAILED once attempts are exhausted (attempts increment at
// claim time). Admin/server credentials only, matching claim.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

const MAX_ATTEMPTS = 3

type CompleteRequestBody = {
  success?: boolean
  artImageId?: number | null
  error?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to complete queued jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event)) as CompleteRequestBody | null

    if (typeof body?.success !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Missing required boolean field "success".',
      })
    }

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status !== 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is ${job.status}, not RUNNING — nothing to complete.`,
      })
    }

    let updated

    if (body.success) {
      const artImageId = Number(body.artImageId)

      if (!Number.isInteger(artImageId) || artImageId <= 0) {
        throw createError({
          statusCode: 400,
          message:
            'A successful completion requires "artImageId" (upload via /api/art/save-generated first).',
        })
      }

      updated = await prisma.artJob.update({
        where: { id },
        data: { status: 'DONE', artImageId, error: null },
      })
    } else {
      const message = String(body.error || 'Generation failed.').slice(0, 4000)
      const exhausted = job.attempts >= MAX_ATTEMPTS

      updated = await prisma.artJob.update({
        where: { id },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING',
          error: message,
          claimedAt: null,
          claimedBy: null,
        },
      })
    }

    return {
      success: true,
      message: `Job ${id} → ${updated.status}.`,
      data: { job: updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to complete art job.',
      statusCode,
    }
  }
})

// /server/api/art/queue/[id].get.ts
//
// Poll a queued job's status. Owners see their own jobs; admin/server
// credentials see any. This is the conductor consumer's polling surface:
// enqueue → poll here until DONE/FAILED → resolve the ArtImage.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { decodeArtJobPayload } from '../../../utils/artJobPayload'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const storedJob = await prisma.artJob.findUnique({ where: { id } })

    if (!storedJob) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (
      storedJob.userId !== auth.user.id &&
      !auth.isAdmin &&
      !auth.isServerKey
    ) {
      throw createError({ statusCode: 403, message: 'Not your job.' })
    }

    return {
      success: true,
      message: `Job ${id}.`,
      data: { job: decodeArtJobPayload(storedJob) },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load art job.',
      statusCode,
    }
  }
})

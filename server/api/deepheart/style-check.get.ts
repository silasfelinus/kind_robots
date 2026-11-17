import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { errorHandler } from '~/server/utils/error'
import { decodeArtJobPayload } from '~/server/utils/artJobPayload'
import { payloadScalar } from '~/utils/artJobFields'
import {
  DEEPHEART_STYLE_DESIGNER,
  DEEPHEART_STYLE_PROJECT,
  DEEPHEART_STYLE_SUBJECTS,
  deepheartStyleLaneFromModel,
  type DeepheartStyleJob,
} from '~/utils/deepheart/styleCheck'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user))
      throw createError({ statusCode: 404, statusMessage: 'Not found.' })

    const rows = await prisma.artJob.findMany({
      where: {
        projectSlug: DEEPHEART_STYLE_PROJECT,
        payload: { contains: DEEPHEART_STYLE_DESIGNER },
      },
      orderBy: { id: 'desc' },
      take: 160,
    })
    const jobs: DeepheartStyleJob[] = []
    const seen = new Set<string>()

    for (const raw of rows) {
      const job = decodeArtJobPayload(raw)
      const seed = Number(payloadScalar(job, ['seed', 'noise_seed']))
      const subject = DEEPHEART_STYLE_SUBJECTS.find(
        (item) => item.seed === seed,
      )
      if (!subject) continue
      const checkpoint = payloadScalar(job, [
        'ckpt_name',
        'unet_name',
        'checkpoint',
      ])
      const lane =
        job.engine === 'krea2'
          ? 'krea2'
          : deepheartStyleLaneFromModel(checkpoint)
      if (!lane) continue
      const key = subject.key + ':' + lane
      if (seen.has(key)) continue
      seen.add(key)
      jobs.push({
        jobId: job.id,
        subjectKey: subject.key,
        laneKey: lane,
        status: job.status,
        artImageId: job.artImageId,
        updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
        priority: job.priority,
        error: job.error,
      })
    }

    return { success: true, data: { jobs } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return {
      success: false,
      message: failure.message || 'Could not load Deepheart art trial.',
    }
  }
})

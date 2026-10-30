import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { requireMachineUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { decodeArtJobPayload } from '../../utils/artJobPayload'
import { artJobPrompt, payloadScalar } from '~/utils/artJobFields'
import {
  CAPES_STYLE_DESIGNERS,
  CAPES_STYLE_PROJECT,
  CAPES_STYLE_SUBJECTS,
  capesStyleLaneFromModel,
  type CapesStyleJob,
} from '~/utils/capesStyleCheck'

// A private, admin-only projection of accepted ArtJobs, never a fabricated
// "completed" grid. The Conductor manifest is the durable submission ledger.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Administrator access required.',
      })
    }

    const jobs = await prisma.artJob.findMany({
      where: {
        projectSlug: CAPES_STYLE_PROJECT,
        OR: CAPES_STYLE_DESIGNERS.map((designer) => ({
          payload: { contains: designer },
        })),
      },
      orderBy: { id: 'desc' },
      take: 240,
    })
    const result: CapesStyleJob[] = []
    const seen = new Set<string>()

    for (const raw of jobs) {
      const job = decodeArtJobPayload(raw)
      const seed = Number(payloadScalar(job, ['seed', 'noise_seed']))
      const subject = CAPES_STYLE_SUBJECTS.find((item) => item.seed === seed)
      if (!subject) continue
      const model = payloadScalar(job, ['ckpt_name', 'unet_name', 'checkpoint'])
      const laneKey = capesStyleLaneFromModel(model)
      if (!laneKey) continue
      const key = subject.key + ':' + laneKey
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        jobId: job.id,
        subjectKey: subject.key,
        laneKey,
        status: job.status,
        artImageId: job.artImageId,
        updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
        priority: job.priority,
        error: job.error,
        prompt: artJobPrompt(job),
      })
    }

    return {
      success: true,
      statusCode: 200,
      message: result.length + ' of ' + CAPES_STYLE_SUBJECTS.length * 6 + ' benchmark ArtJobs located.',
      data: { jobs: result },
    }
  } catch (error: unknown) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: failure.message || 'Could not read the Capes style check.',
    }
  }
})

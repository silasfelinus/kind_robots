// /server/api/arcade/audio-jobs.post.ts
//
// Queue a deduplicated ACE-Step arcade cue through the existing art pipeline.
// Rendering is authorized for admins without a per-cue approval or env gate.
// A queued job is not playable until ingested and verified.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  ARCADE_AUDIO_LIVE_STATUSES,
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  buildArcadeAudioEnqueueRequest,
  parseArcadeAudioTarget,
} from '../../utils/arcadeAudioJobs'
import { arcadeAudioJobKey } from '../../../utils/arcade/soundtrackBriefs'

type Body = { game?: unknown; cue?: unknown }

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<Body>(event)) ?? {}
    const target = parseArcadeAudioTarget(body.game, body.cue)
    if (!target)
      throw createError({ statusCode: 400, message: 'Unknown arcade cue.' })
    const jobKey = arcadeAudioJobKey(target.owner, target.cue)
    const existing = await prisma.artJob.findFirst({
      where: {
        projectSlug: ARCADE_AUDIO_PROJECT_SLUG,
        status: { in: [...ARCADE_AUDIO_LIVE_STATUSES] },
        payload: { contains: arcadeAudioDedupeNeedle(jobKey) },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })
    if (existing)
      return {
        success: true,
        statusCode: 200,
        message: 'This cue already has a render job.',
        data: {
          jobKey,
          jobId: existing.id,
          status: existing.status,
          reused: true,
        },
      }
    const request = buildArcadeAudioEnqueueRequest(target.owner, target.cue)
    if (!request)
      throw createError({ statusCode: 400, message: 'Unknown arcade cue.' })
    const response = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      { method: 'POST', body: request },
    )
    const jobId = Number(response?.data?.jobId)
    if (!response?.success || !Number.isInteger(jobId) || jobId <= 0)
      throw createError({
        statusCode: 502,
        message:
          response?.message || 'Arcade audio enqueue returned no job id.',
      })
    return {
      success: true,
      statusCode: 201,
      message: 'Arcade cue queued for rendering.',
      data: {
        jobKey,
        jobId,
        status: response.data?.status ?? 'PENDING',
        reused: false,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

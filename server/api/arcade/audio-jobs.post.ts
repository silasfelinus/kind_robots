// /server/api/arcade/audio-jobs.post.ts
//
// Approve one Arcade soundtrack cue for rendering (kind_robots#3606). Admin
// only; enqueues a single deduplicated ACE-Step ArtJob through
// /api/art/enqueue, and only when ARCADE_AUDIO_JOBS_ENABLED is set and a live
// COMFY relay advertises supportsAudio. A queued job is not a playable track:
// cabinets switch only after the finished file is ingested and verified
// (VERIFIED_ARCADE_AUDIO_ASSETS, docs/arcade-audio-production.md).
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  audioRelayReadiness,
  listRelayAgents,
} from '../../utils/relayAgentRegistry'
import {
  ARCADE_AUDIO_LIVE_STATUSES,
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  arcadeAudioGenerationEnabled,
  decideArcadeAudioJob,
  parseArcadeAudioTarget,
} from '../../utils/arcadeAudioJobs'
import { arcadeAudioJobKey } from '../../../utils/arcade/soundtrackBriefs'

type Body = { game?: unknown; cue?: unknown; approve?: unknown }

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
    const decision = decideArcadeAudioJob({
      ...target,
      approved: body.approve === true,
      enabled: arcadeAudioGenerationEnabled(),
      readiness: audioRelayReadiness(listRelayAgents()),
      existing,
    })
    if (decision.action === 'refuse')
      throw createError({
        statusCode: decision.statusCode,
        message: decision.message,
      })
    if (decision.action === 'reuse')
      return {
        success: true,
        statusCode: 200,
        message: 'This cue already has a render job.',
        data: {
          jobKey,
          jobId: decision.jobId,
          status: decision.status,
          reused: true,
        },
      }
    const response = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      { method: 'POST', body: decision.request },
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

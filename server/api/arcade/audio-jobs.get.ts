// /server/api/arcade/audio-jobs.get.ts
//
// Admin approval queue for Arcade soundtrack renders (kind_robots#3606):
// every briefed cue with its job key, the ACE-Step request an approval would
// send, any existing ArtJob for that key, and whether generation is
// authorized and a supportsAudio relay is live. Read-only.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  audioRelayReadiness,
  listRelayAgents,
} from '../../utils/relayAgentRegistry'
import {
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  arcadeAudioGenerationEnabled,
  buildArcadeAudioEnqueueRequest,
} from '../../utils/arcadeAudioJobs'
import { arcadeSoundtrackEntries } from '../../../utils/arcade/soundtrackBriefs'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const jobs = await prisma.artJob.findMany({
      where: {
        projectSlug: ARCADE_AUDIO_PROJECT_SLUG,
        payload: { contains: '"designer":"arcade-audio:' },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, payload: true, createdAt: true },
      take: 200,
    })
    const entries = arcadeSoundtrackEntries().map((entry) => {
      const job = jobs.find((row) =>
        String(row.payload ?? '').includes(
          arcadeAudioDedupeNeedle(entry.jobKey),
        ),
      )
      return {
        game: entry.owner,
        cue: entry.cue,
        jobKey: entry.jobKey,
        brief: entry.brief,
        request: buildArcadeAudioEnqueueRequest(entry.owner, entry.cue),
        job: job
          ? { id: job.id, status: job.status, createdAt: job.createdAt }
          : null,
      }
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Arcade soundtrack approval queue.',
      data: {
        generationEnabled: arcadeAudioGenerationEnabled(),
        relay: audioRelayReadiness(listRelayAgents()),
        entries,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

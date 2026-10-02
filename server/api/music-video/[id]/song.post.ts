import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import { buildSongEnqueueRequest } from '@/utils/musicVideoSong'
import { MUSIC_VIDEO_PROJECT_SLUG } from '@/server/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type SongBody = { tags?: unknown; seed?: unknown; force?: unknown }

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string }
}

// music-video/t-010: generate the song on the Comfy backend with ACE-Step.
// The job stays PENDING until a relay advertises supportsAudio (t-011).
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<SongBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)

    const existingJobId = doc.song?.jobId
    if (existingJobId && body.force !== true) {
      const existing = await prisma.artJob.findUnique({
        where: { id: existingJobId },
        select: { status: true },
      })
      if (existing && ['PENDING', 'RUNNING'].includes(existing.status)) {
        return {
          success: true,
          statusCode: 200,
          message: 'A song for this video is already queued.',
          data: {
            video: toMusicVideoDto(record),
            jobId: existingJobId,
            reused: true,
          },
        }
      }
    }

    const hasLyrics = doc.lyrics.sections.some(
      (section) => section.lines.length,
    )
    if (!hasLyrics && doc.settings.vocal !== 'instrumental') {
      throw createError({
        statusCode: 400,
        message:
          'Write lyrics first, or set settings.vocal to instrumental for a song without words.',
      })
    }

    const seed =
      typeof body.seed === 'number' &&
      Number.isInteger(body.seed) &&
      body.seed >= 0
        ? body.seed
        : Math.floor(Math.random() * 2_147_483_647)
    const request = buildSongEnqueueRequest(doc, {
      tags:
        typeof body.tags === 'string' ? body.tags : (doc.song?.tags ?? null),
      seed,
      projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
    })
    const response = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      {
        method: 'POST',
        body: request,
      },
    )
    const jobId = Number(response?.data?.jobId)
    if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
      throw createError({
        statusCode: 502,
        message: response?.message || 'Song enqueue did not return a job id.',
      })
    }

    const updated = await prisma.musicVideo.update({
      where: { id },
      data: {
        doc: serializeValidatedDoc({
          ...doc,
          song: {
            source: 'comfy-acestep',
            jobId,
            durationSec: request.durationSeconds,
            ...(request.bpm ? { bpm: request.bpm } : {}),
            seed,
            tags: request.promptString,
          },
        }),
      },
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Song queued on the Comfy backend.',
      data: { video: toMusicVideoDto(updated), jobId, reused: false },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

import { createError, defineEventHandler, readBody } from 'h3'
import { readArtImageDataUrl } from '@/server/utils/artImageBytes'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  buildSceneClipRequest,
  clipRuntimeHint,
  resolveClipPreset,
} from '@/utils/musicVideoMotion'
import {
  MUSIC_VIDEO_PROJECT_SLUG,
  bannedTermProblems,
} from '@/server/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type ClipsBody = { sceneIds?: unknown; presetId?: unknown; force?: unknown }

type GenerateResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number }
}

type ClipOutcome = {
  sceneId: string
  status: 'queued' | 'reused' | 'skipped' | 'failed'
  jobId?: number
  reason?: string
}

// Video jobs run for up to 90 minutes each on the single card; a handful per
// call keeps one request from burying the queue.
const MAX_CLIPS_PER_CALL = 8

// music-video/t-009: opt scenes in to an ltx/wan image-to-video clip, with the
// scene's finished still as the first frame. The scene keeps its Ken Burns
// preset, which the compositor falls back to if the clip never arrives.
// t-026: a scene with motion.lastFrame "next-scene" also pins its last frame
// to the next scene's still, so the cut lands on a matching image.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<ClipsBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)

    if (!Array.isArray(body.sceneIds) || !body.sceneIds.length) {
      throw createError({
        statusCode: 400,
        message: 'Name the scenes to animate in sceneIds.',
      })
    }
    const requested = new Set(body.sceneIds.map((value) => String(value)))
    if (requested.size > MAX_CLIPS_PER_CALL) {
      throw createError({
        statusCode: 400,
        message: `At most ${MAX_CLIPS_PER_CALL} clips per request.`,
      })
    }
    const presetId =
      typeof body.presetId === 'string' && body.presetId.trim()
        ? body.presetId.trim()
        : null
    let preset
    try {
      preset = resolveClipPreset(presetId)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Unknown preset.',
      })
    }
    const force = body.force === true

    const targets = doc.scenes.filter((scene) => requested.has(scene.id))
    const missing = [...requested].filter(
      (sceneId) => !targets.some((scene) => scene.id === sceneId),
    )
    const outcomes: ClipOutcome[] = missing.map((sceneId) => ({
      sceneId,
      status: 'failed',
      reason: 'No such scene.',
    }))

    const activeJobs = await prisma.artJob.findMany({
      where: {
        id: {
          in: targets
            .map((scene) => scene.motion.jobId)
            .filter((jobId): jobId is number => Number.isInteger(jobId)),
        },
        status: { in: ['PENDING', 'RUNNING'] },
      },
      select: { id: true },
    })
    const active = new Set(activeJobs.map((job) => job.id))

    const queued = new Map<string, number>()
    for (const scene of targets) {
      if (scene.motion.jobId && active.has(scene.motion.jobId)) {
        outcomes.push({
          sceneId: scene.id,
          status: 'reused',
          jobId: scene.motion.jobId,
        })
        continue
      }
      if (scene.motion.clipArtImageId && !force) {
        outcomes.push({
          sceneId: scene.id,
          status: 'skipped',
          reason: 'The scene already has a clip; send force to replace it.',
        })
        continue
      }
      const banned = bannedTermProblems(
        `${scene.motionPrompt || scene.prompt} ${doc.settings.styleBible}`,
        doc,
      )
      if (banned.length) {
        outcomes.push({
          sceneId: scene.id,
          status: 'failed',
          reason: banned.join(' '),
        })
        continue
      }
      try {
        const next =
          scene.motion.lastFrame === 'next-scene'
            ? doc.scenes[doc.scenes.indexOf(scene) + 1]
            : undefined
        const request = buildSceneClipRequest(scene, doc, {
          firstImageBase64: await readArtImageDataUrl(scene.image.artImageId),
          lastImageBase64: next
            ? await readArtImageDataUrl(next.image.artImageId)
            : null,
          projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
          presetId: preset.id,
        })
        const response = await event.$fetch<GenerateResponse, string>(
          '/api/video/generate',
          { method: 'POST', body: request },
        )
        const jobId = Number(response?.data?.jobId)
        if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
          throw new Error(response?.message || 'No clip job id came back.')
        }
        queued.set(scene.id, jobId)
        outcomes.push({ sceneId: scene.id, status: 'queued', jobId })
      } catch (error) {
        outcomes.push({
          sceneId: scene.id,
          status: 'failed',
          reason:
            error instanceof Error ? error.message : 'Clip enqueue failed.',
        })
      }
    }

    const scenes = doc.scenes.map((scene) => {
      const jobId = queued.get(scene.id)
      if (!jobId) return scene
      const { clipArtImageId: _previous, ...motion } = scene.motion
      return { ...scene, motion: { ...motion, kind: 'clip' as const, jobId } }
    })
    const updated = queued.size
      ? await prisma.musicVideo.update({
          where: { id },
          data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
        })
      : record

    return {
      success: true,
      statusCode: 200,
      message: `Queued ${queued.size} scene clips. ${clipRuntimeHint(preset)}`,
      data: { video: toMusicVideoDto(updated), outcomes, preset: preset.id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

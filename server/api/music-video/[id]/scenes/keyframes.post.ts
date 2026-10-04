import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  chooseKeyframeAttempt,
  keyframeCropLoss,
  normalizeKeyframeAssignments,
} from '@/utils/musicVideoKeyframes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type KeyframeOutcome = {
  sceneId: string
  status: 'assigned' | 'failed'
  attemptId?: number
  artImageId?: number
  cropLoss?: number
  reason?: string
}

// A centre crop that throws away more than this is worth a second look.
const CROP_WARNING = 0.3

// music-video/t-025: use vetted Comic Studio art as scene stills. Each
// assignment names an attempt, or a slot whose newest selected (else liked)
// attempt is used. Everything must belong to the video's comic series
// (settings.comicSeriesId). The scene becomes image.source "gallery", which the
// still renderer skips and the clip route animates.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<{ assignments?: unknown }>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)

    const seriesId = doc.settings.comicSeriesId
    if (!seriesId) {
      throw createError({
        statusCode: 400,
        message: 'Set settings.comicSeriesId before assigning comic keyframes.',
      })
    }
    const { assignments, errors } = normalizeKeyframeAssignments(
      body.assignments,
    )
    if (errors.length) {
      throw createError({ statusCode: 400, message: errors.join(' ') })
    }

    const attemptIds = assignments
      .map((item) => item.attemptId)
      .filter((value): value is number => Boolean(value))
    const slotIds = assignments
      .map((item) => item.slotId)
      .filter((value): value is number => Boolean(value))
    const select = {
      id: true,
      slotId: true,
      artImageId: true,
      verdict: true,
      createdAt: true,
      width: true,
      height: true,
      Slot: { select: { seriesId: true } },
    } as const
    const attempts = await prisma.comicAttempt.findMany({
      where: {
        OR: [
          ...(attemptIds.length ? [{ id: { in: attemptIds } }] : []),
          ...(slotIds.length ? [{ slotId: { in: slotIds } }] : []),
        ],
        Slot: { seriesId },
      },
      select,
    })
    const byId = new Map(attempts.map((attempt) => [attempt.id, attempt]))

    const outcomes: KeyframeOutcome[] = []
    const picks = new Map<string, number>()
    for (const assignment of assignments) {
      const attempt = assignment.attemptId
        ? byId.get(assignment.attemptId)
        : chooseKeyframeAttempt(
            attempts.filter((item) => item.slotId === assignment.slotId),
          )
      const scene = doc.scenes.find((item) => item.id === assignment.sceneId)
      if (!scene) {
        outcomes.push({
          sceneId: assignment.sceneId,
          status: 'failed',
          reason: 'No such scene.',
        })
        continue
      }
      if (!attempt?.artImageId) {
        outcomes.push({
          sceneId: assignment.sceneId,
          status: 'failed',
          reason: assignment.attemptId
            ? 'That attempt is not in this comic series or has no image yet.'
            : 'That subject has no selected or liked image in this comic series.',
        })
        continue
      }
      const cropLoss = keyframeCropLoss(attempt, doc.settings.aspect)
      picks.set(scene.id, attempt.artImageId)
      outcomes.push({
        sceneId: scene.id,
        status: 'assigned',
        attemptId: attempt.id,
        artImageId: attempt.artImageId,
        cropLoss,
        ...(cropLoss > CROP_WARNING
          ? {
              reason: `A ${doc.settings.aspect} crop drops ${Math.round(cropLoss * 100)}% of this image.`,
            }
          : {}),
      })
    }

    const scenes = doc.scenes.map((scene) => {
      const artImageId = picks.get(scene.id)
      return artImageId
        ? { ...scene, image: { source: 'gallery' as const, artImageId } }
        : scene
    })
    const updated = picks.size
      ? await prisma.musicVideo.update({
          where: { id },
          data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
        })
      : record

    return {
      success: true,
      statusCode: 200,
      message: `Assigned ${picks.size} comic keyframes.`,
      data: { video: toMusicVideoDto(updated), outcomes },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

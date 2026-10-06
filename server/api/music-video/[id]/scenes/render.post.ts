import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  enqueueSceneStill,
  resolveSceneLane,
  resolveStillLane,
  type SceneRenderOutcome,
  type StillLane,
} from '@/server/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type RenderBody = { sceneIds?: unknown; force?: unknown }

const MAX_SCENES_PER_CALL = 40

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<RenderBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)
    const force = body.force === true
    const requested = Array.isArray(body.sceneIds)
      ? new Set(body.sceneIds.map((value) => String(value)))
      : null

    const targets = doc.scenes
      .filter((scene) => !requested || requested.has(scene.id))
      // An uploaded or picked image is only re-rendered when asked for by name.
      .filter(
        (scene) =>
          scene.image.source === 'generated' || (force && requested !== null),
      )
      .filter((scene) => scene.prompt.trim())
      .filter((scene) => force || !scene.image.artImageId)
      .slice(0, MAX_SCENES_PER_CALL)
    if (!targets.length) {
      throw createError({
        statusCode: 400,
        message:
          'No scenes to render. A scene needs a prompt, a generated image source, and no finished image unless force is true.',
      })
    }

    let stillLane: StillLane
    try {
      stillLane = await resolveStillLane(doc)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Unknown comic series.',
      })
    }

    const outcomes: SceneRenderOutcome[] = []
    for (const scene of targets) {
      try {
        const sceneLane = await resolveSceneLane(doc, scene, stillLane)
        outcomes.push(
          await enqueueSceneStill(event, id, scene, doc, force, sceneLane),
        )
      } catch (error) {
        outcomes.push({
          sceneId: scene.id,
          status: 'failed',
          reason:
            error instanceof Error ? error.message : 'Unknown enqueue failure.',
        })
      }
    }

    const jobBySceneId = new Map(
      outcomes
        .filter((outcome) => outcome.jobId && outcome.status !== 'rejected')
        .map((outcome) => [outcome.sceneId, outcome]),
    )
    const scenes = doc.scenes.map((scene) => {
      const outcome = jobBySceneId.get(scene.id)
      if (!outcome?.jobId) return scene
      const keepImage =
        outcome.status === 'reused' || outcome.status === 'skipped'
      return {
        ...scene,
        image: {
          ...(scene.image.laneKey ? { laneKey: scene.image.laneKey } : {}),
          ...(scene.image.loraResourceIds?.length
            ? { loraResourceIds: scene.image.loraResourceIds }
            : {}),
          source: 'generated' as const,
          jobId: outcome.jobId,
          ...(keepImage && scene.image.artImageId
            ? { artImageId: scene.image.artImageId }
            : {}),
        },
      }
    })
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
    })

    const queued = outcomes.filter(
      (outcome) => outcome.status === 'queued',
    ).length
    return {
      success: true,
      statusCode: 200,
      message: `Queued ${queued} of ${targets.length} scene stills.`,
      data: { video: toMusicVideoDto(updated), outcomes },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

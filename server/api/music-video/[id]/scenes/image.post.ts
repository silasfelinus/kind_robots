import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type SceneImageBody = { sceneId?: unknown; artImageId?: unknown }

// music-video/t-027: put a chosen ArtImage (an upload, or any existing art) on
// a scene in place of its generated still. Silas, 2026-10-06, on the admin
// page: "the scenes aren't recognizing the images, and I can't seem to upload
// them". The scene becomes image.source "upload", which the still renderer
// skips. A clip animated from the old still no longer matches, so the scene
// drops back to Ken Burns until it is animated again.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<SceneImageBody>(event)) ?? {}
    const sceneId = typeof body.sceneId === 'string' ? body.sceneId.trim() : ''
    const artImageId = Number(body.artImageId)

    if (!sceneId) {
      throw createError({ statusCode: 400, message: 'Name the sceneId.' })
    }
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'artImageId must be a positive integer.',
      })
    }

    const doc = parseStoredMusicVideoDoc(record.doc)
    if (!doc.scenes.some((scene) => scene.id === sceneId)) {
      throw createError({ statusCode: 404, message: 'No such scene.' })
    }
    const image = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: { id: true },
    })
    if (!image) {
      throw createError({ statusCode: 404, message: 'No such ArtImage.' })
    }

    const scenes = doc.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene
      const { clipArtImageId: _clip, jobId: _clipJob, ...motion } = scene.motion
      return {
        ...scene,
        image: { source: 'upload' as const, artImageId },
        motion: { ...motion, kind: 'kenburns' as const },
      }
    })
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
    })

    return {
      success: true,
      statusCode: 200,
      message: `Scene ${sceneId} now uses ArtImage ${artImageId}.`,
      data: { video: toMusicVideoDto(updated) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import { planScenes } from '@/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type PlanBody = { replace?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<PlanBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)

    if (doc.scenes.length && body.replace !== true) {
      throw createError({
        statusCode: 409,
        message:
          'This video already has scenes. Send { replace: true } to re-plan them.',
      })
    }

    const scenes = planScenes(doc)
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
    })
    return {
      success: true,
      statusCode: 200,
      message: `Planned ${scenes.length} scenes on the beat grid.`,
      data: toMusicVideoDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import { syncSceneJobs } from '@/server/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
} from '@/server/utils/musicVideo'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const { doc, statuses, changed } = await syncSceneJobs(
      parseStoredMusicVideoDoc(record.doc),
    )
    if (changed) {
      await prisma.musicVideo.update({
        where: { id },
        data: { doc: serializeValidatedDoc(doc) },
      })
    }
    const done = statuses.filter(
      (s) => s.status === 'DONE' || s.status === 'READY',
    ).length
    return {
      success: true,
      statusCode: 200,
      message: `${done} of ${statuses.length} scenes have an image.`,
      data: { scenes: statuses, synced: changed },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

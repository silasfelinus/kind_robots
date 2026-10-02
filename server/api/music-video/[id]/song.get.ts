import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
} from '@/server/utils/musicVideo'

// music-video/t-010: report the song job and, once it is DONE, write the
// resulting audio ArtImage id into the doc.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const doc = parseStoredMusicVideoDoc(record.doc)
    const song = doc.song
    if (!song?.jobId) {
      return {
        success: true,
        statusCode: 200,
        message: song?.artImageId ? 'The song is an upload.' : 'No song yet.',
        data: { song, job: null, synced: false },
      }
    }

    const job = await prisma.artJob.findUnique({
      where: { id: song.jobId },
      select: { id: true, status: true, artImageId: true, error: true },
    })
    const artImageId = job?.status === 'DONE' ? job.artImageId : null
    const synced = Boolean(artImageId && artImageId !== song.artImageId)
    const nextSong = synced
      ? { ...song, artImageId: artImageId as number }
      : song
    if (synced) {
      await prisma.musicVideo.update({
        where: { id },
        data: { doc: serializeValidatedDoc({ ...doc, song: nextSong }) },
      })
    }
    return {
      success: true,
      statusCode: 200,
      message: job
        ? `Song job ${job.id} is ${job.status}.`
        : 'The song job no longer exists.',
      data: {
        song: nextSong,
        job: job
          ? {
              id: job.id,
              status: job.status,
              artImageId: job.artImageId,
              error: job.error,
            }
          : null,
        synced,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

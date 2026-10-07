import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { clampUploadToPacket } from '@/utils/musicVideoFinal'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  checkSongUpload,
  cleanSongNumber,
  musicVideoMaxAudioBytes,
  songUploadFileName,
  videoDurationForSong,
} from '@/utils/musicVideoAudioUpload'
import {
  loadOwnedMusicVideo,
  readDbMaxPacketBytes,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

// music-video/t-013: attach an uploaded song (multipart field "file", MP3 or
// WAV; optional fields durationSec and bpm measured by the client). It is
// stored as a private audio ArtImage and becomes doc.song with source
// "upload"; the video length follows the song. A previous song stays in
// place as its own ArtImage.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const maxBytes = clampUploadToPacket(
      musicVideoMaxAudioBytes(process.env.MUSIC_VIDEO_MAX_AUDIO_MB),
      await readDbMaxPacketBytes(),
    )

    const declared = Number(getHeader(event, 'content-length') || 0)
    if (Number.isFinite(declared) && declared > maxBytes + 1024 * 1024) {
      throw createError({
        statusCode: 413,
        message: `The song is larger than ${Math.floor(maxBytes / (1024 * 1024))} MB. Export it as an MP3 and try again.`,
      })
    }

    const form = await readMultipartFormData(event)
    const file = form?.find((field) => field.name === 'file')
    const fieldText = (name: string) =>
      form?.find((field) => field.name === name)?.data?.toString('utf8')
    const check = checkSongUpload({
      bytes: file?.data,
      mimeType: file?.type,
      maxBytes,
    })
    if (!check.ok) {
      throw createError({
        statusCode: check.statusCode,
        message: check.message,
      })
    }
    const durationSec = cleanSongNumber(fieldText('durationSec'), 'durationSec')
    const bpm = cleanSongNumber(fieldText('bpm'), 'bpm')

    const image = await prisma.artImage.create({
      data: {
        imageData: Buffer.from(file!.data).toString('base64'),
        fileName: songUploadFileName(id, record.title, check.fileType),
        fileType: check.fileType,
        promptString: record.title,
        designer: 'Music Video',
        isPublic: false,
        isMature: false,
        User: { connect: { id: auth.user.id } },
      },
      select: { id: true },
    })

    const doc = parseStoredMusicVideoDoc(record.doc)
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: {
        doc: serializeValidatedDoc({
          ...doc,
          settings: {
            ...doc.settings,
            ...(durationSec
              ? { durationSec: videoDurationForSong(durationSec) }
              : {}),
            ...(bpm ? { bpm } : {}),
          },
          song: {
            source: 'upload',
            artImageId: image.id,
            ...(durationSec ? { durationSec } : {}),
            ...(bpm ? { bpm } : {}),
          },
        }),
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Song attached.',
      data: {
        video: toMusicVideoDto(updated),
        artImageId: image.id,
        bytes: file!.data.length,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

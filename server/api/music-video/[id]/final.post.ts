import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  checkFinalVideoUpload,
  finalVideoFileName,
  musicVideoMaxUploadBytes,
} from '@/utils/musicVideoFinal'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

// music-video/t-023: attach the finished MP4 (multipart field "file") to a
// music video. It is stored as a private video ArtImage, never added to a
// collection, and set as the row's finalArtImageId; the video moves to
// EXPORTED. A previous final stays in place as its own ArtImage. Publishing
// is t-022 and human-approved.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const maxBytes = musicVideoMaxUploadBytes(
      process.env.MUSIC_VIDEO_MAX_UPLOAD_MB,
    )

    const declared = Number(getHeader(event, 'content-length') || 0)
    if (Number.isFinite(declared) && declared > maxBytes + 1024 * 1024) {
      throw createError({
        statusCode: 413,
        message: `The video is larger than ${Math.floor(maxBytes / (1024 * 1024))} MB.`,
      })
    }

    const form = await readMultipartFormData(event)
    const file = form?.find((field) => field.name === 'file')
    const check = checkFinalVideoUpload({
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

    const image = await prisma.artImage.create({
      data: {
        imageData: Buffer.from(file!.data).toString('base64'),
        fileName: finalVideoFileName(id, record.title),
        fileType: check.fileType,
        promptString: record.title,
        designer: 'Music Video',
        isPublic: false,
        isMature: false,
        User: { connect: { id: auth.user.id } },
      },
      select: { id: true },
    })
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { finalArtImageId: image.id, status: 'EXPORTED' },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Final video attached.',
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

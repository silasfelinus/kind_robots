import {
  createError,
  defineEventHandler,
  getHeader,
  sendRedirect,
  setHeader,
  setResponseStatus,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { getMediaViewerAccessContext } from '@/server/utils/artImageAccess'
import { errorHandler } from '@/server/utils/error'
import { readMusicVideoId } from '@/server/utils/musicVideo'
import { canPlayMusicVideoFinal } from '@/utils/musicVideoAccess'

const VIDEO_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
}

/*
 * A <video> asks for the same file in several Range requests, and the cut is
 * a base64 LongText row, so the last few decoded cuts are kept rather than
 * read and decoded again for every range.
 */
const recent = new Map<string, Buffer>()
const RECENT_LIMIT = 3

async function readCut(id: number, version: string): Promise<Buffer | null> {
  const key = `${id}:${version}`
  const hit = recent.get(key)
  if (hit) return hit
  const row = await prisma.artImage.findUnique({
    where: { id },
    select: { imageData: true },
  })
  if (!row?.imageData) return null
  const bytes = Buffer.from(row.imageData, 'base64')
  recent.set(key, bytes)
  while (recent.size > RECENT_LIMIT) {
    recent.delete(recent.keys().next().value as string)
  }
  return bytes
}

function readRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | null | 'invalid' {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '')
  if (!match) return null
  const [, from, to] = match
  if (!from && !to) return 'invalid'
  const start = from ? Number(from) : Math.max(0, size - Number(to))
  const end = from && to ? Math.min(Number(to), size - 1) : size - 1
  return start <= end && start < size ? { start, end } : 'invalid'
}

// Silas, 2026-10-07: the Play gallery plays a public video's final cut for
// anyone allowed to see the video. The cut is a private ArtImage made by the
// export step, so it streams from here behind the video's own visibility
// rather than becoming public art.
export default defineEventHandler(async (event) => {
  try {
    const viewer = await getMediaViewerAccessContext(event)
    const record = await prisma.musicVideo.findUnique({
      where: { id: readMusicVideoId(event) },
      select: { userId: true, isPublic: true, finalArtImageId: true },
    })
    const final = record?.finalArtImageId
      ? await prisma.artImage.findUnique({
          where: { id: record.finalArtImageId },
          select: {
            id: true,
            userId: true,
            isActive: true,
            isMature: true,
            imagePath: true,
            fileType: true,
            updatedAt: true,
          },
        })
      : null
    if (!record || !final || !canPlayMusicVideoFinal(record, final, viewer)) {
      throw createError({ statusCode: 404, message: 'Video not found.' })
    }

    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    if (
      final.imagePath &&
      !final.imagePath.includes(`/api/art/images/${final.id}/file`)
    ) {
      return sendRedirect(event, final.imagePath, 302)
    }

    const bytes = await readCut(final.id, final.updatedAt?.toISOString() ?? '')
    if (!bytes) {
      throw createError({
        statusCode: 404,
        message: 'Video bytes are unavailable.',
      })
    }

    setHeader(
      event,
      'Content-Type',
      VIDEO_TYPES[String(final.fileType || '').toLowerCase()] || 'video/mp4',
    )
    setHeader(event, 'Accept-Ranges', 'bytes')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    const range = readRange(getHeader(event, 'range'), bytes.length)
    if (range === 'invalid') {
      setHeader(event, 'Content-Range', `bytes */${bytes.length}`)
      setResponseStatus(event, 416)
      return ''
    }
    if (range) {
      setResponseStatus(event, 206)
      setHeader(
        event,
        'Content-Range',
        `bytes ${range.start}-${range.end}/${bytes.length}`,
      )
      setHeader(event, 'Content-Length', range.end - range.start + 1)
      return bytes.subarray(range.start, range.end + 1)
    }
    setHeader(event, 'Content-Length', bytes.length)
    return bytes
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

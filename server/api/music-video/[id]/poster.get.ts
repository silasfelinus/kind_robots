import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createError, defineEventHandler, sendRedirect, setHeader } from 'h3'
import sharp from 'sharp'
import prisma from '@/server/utils/prisma'
import { getMediaViewerAccessContext } from '@/server/utils/artImageAccess'
import { errorHandler } from '@/server/utils/error'
import { getImageStorageRoot } from '@/server/utils/imageStorageRoot'
import {
  loadViewableMusicVideo,
  readMusicVideoId,
} from '@/server/utils/musicVideo'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import { isMusicVideoOwner } from '@/utils/musicVideoAccess'

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

const POSTER_WIDTH = 640

/** A stored /images/... file read straight from disk; null when it is not here. */
async function readStoredImage(imagePath: string): Promise<Buffer | null> {
  if (!imagePath.startsWith('/images/') || imagePath.includes('..')) return null
  const root = getImageStorageRoot()
  const absolute = path.resolve(root, imagePath.slice('/images/'.length))
  if (!absolute.startsWith(root + path.sep)) return null
  try {
    return await fs.readFile(absolute)
  } catch {
    return null
  }
}

// The gallery card's still: the first scene that has art. Only art the video's
// owner made (or public art) is served, so a doc pointing at someone else's
// private image never shows it; a video with no usable still answers 404 and
// the card falls back to its gradient.
export default defineEventHandler(async (event) => {
  try {
    const viewer = await getMediaViewerAccessContext(event)
    const { record } = await loadViewableMusicVideo(
      readMusicVideoId(event),
      viewer,
    )
    const ids = parseStoredMusicVideoDoc(record.doc)
      .scenes.map((scene) => scene.image.artImageId)
      .filter((id): id is number => typeof id === 'number')
      .slice(0, 8)
    const candidates = ids.length
      ? await prisma.artImage.findMany({
          where: {
            id: { in: ids },
            OR: [{ userId: record.userId }, { isPublic: true }],
          },
          select: {
            id: true,
            isActive: true,
            isMature: true,
            imagePath: true,
            imageData: true,
            fileType: true,
          },
        })
      : []
    const owner = isMusicVideoOwner(record, viewer)
    const allowed = candidates.filter(
      (image) =>
        image.isActive !== false &&
        (!image.isMature ||
          (!viewer.restricted && (owner || viewer.showMature))),
    )
    const image = ids
      .map((id) => allowed.find((row) => row.id === id))
      .find(Boolean)
    if (!image) {
      throw createError({ statusCode: 404, message: 'No poster yet.' })
    }

    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    const stored =
      image.imagePath &&
      !image.imagePath.includes(`/api/art/images/${image.id}/file`)
        ? image.imagePath
        : null
    /*
     * The /images route only hands a private still to its owner, so the owner
     * (or an admin) is redirected there and anyone else allowed to see the
     * video gets the bytes from here.
     */
    if (stored && (owner || viewer.isAdmin)) {
      return sendRedirect(event, stored, 302)
    }
    const original =
      (stored ? await readStoredImage(stored) : null) ??
      (image.imageData ? Buffer.from(image.imageData, 'base64') : null)
    if (!original) {
      throw createError({ statusCode: 404, message: 'No poster yet.' })
    }

    try {
      const webp = await sharp(original)
        .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      setHeader(event, 'Content-Type', 'image/webp')
      return webp
    } catch {
      setHeader(
        event,
        'Content-Type',
        IMAGE_TYPES[String(image.fileType || '').toLowerCase()] ||
          'application/octet-stream',
      )
      return original
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})

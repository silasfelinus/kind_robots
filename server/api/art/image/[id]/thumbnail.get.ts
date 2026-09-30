// /server/api/art/image/[id]/thumbnail.get.ts
//
// Small cached WebP for any ArtImage -- inline, public-folder or archive --
// so a Gallery tile is one <img> with no JSON round-trip behind it. See
// server/utils/artImageThumbnail.ts for how the source is chosen.
//
// Auth mirrors archive/[id].get.ts: a plain <img> cannot send the API's auth
// headers, so the feed mints a short-lived capability after the row has passed
// buildArtImageWhere(). Without one, the normal header-auth rule applies.
import { realpath } from 'node:fs/promises'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { verifyGalleryThumbnail } from '~/server/utils/artGalleryArchiveMedia'
import { resolveArtImageThumbnail } from '~/server/utils/artImageThumbnail'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { ensureArchiveThumbnail } from '~/server/utils/artArchiveThumbnails'

const SOURCE_SELECT = {
  id: true,
  updatedAt: true,
  designer: true,
  imagePath: true,
  path: true,
  fileName: true,
  imageData: true,
} as const

async function archiveThumbnail(artImageId: number): Promise<Buffer> {
  const entry = await prisma.archiveEntry.findFirst({
    where: { artImageId, isActive: true },
    select: { id: true, relativePath: true, fileMtime: true },
  })
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Archive image not found.' })
  }
  return ensureArchiveThumbnail(
    await realpath(getArtArchiveRoot()),
    entry.id,
    entry.relativePath,
    entry.fileMtime ? entry.fileMtime.getTime() : null,
  )
}

export default defineEventHandler(async (event) => {
  try {
    const artImageId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid art image id.' })
    }

    const query = getQuery(event)
    const hasCapability = verifyGalleryThumbnail(
      artImageId,
      query.exp,
      query.sig,
    )

    const where = hasCapability
      ? { id: artImageId, isActive: true }
      : {
          AND: [
            { id: artImageId },
            buildArtImageWhere(await getArtImageAccessContext(event)),
          ],
        }
    const row = await prisma.artImage.findFirst({
      where,
      select: SOURCE_SELECT,
    })
    if (!row) {
      throw createError({ statusCode: 404, message: 'Art image not found.' })
    }

    const thumbnail =
      row.designer === 'art-archive'
        ? { kind: 'bytes' as const, buffer: await archiveThumbnail(row.id) }
        : await resolveArtImageThumbnail(row)
    if (thumbnail.kind === 'redirect') {
      return sendRedirect(event, thumbnail.url, 302)
    }

    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'Content-Type', 'image/webp')
    return thumbnail.buffer
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      statusCode,
      message: handled.message || 'Failed to load art thumbnail.',
    }
  }
})

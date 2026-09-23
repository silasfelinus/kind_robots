// /server/api/art/image/archive/[id].get.ts
//
// Browser-loadable bytes for ArtImages imported from PRIVATE_PATH. Normal API
// auth is header-based, which a plain <img> cannot send. The authenticated
// collection API therefore mints a short-lived capability URL (see
// artGalleryArchiveMedia.ts). Direct API callers may still use normal headers.
//
// Files never move into public/: after authorization we resolve the matching
// ArchiveEntry and use the existing root-confined PRIVATE_PATH helpers.
import path from 'node:path'
import { readFile, realpath } from 'node:fs/promises'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { resolveConfinedExistingPath } from '~/server/utils/artArchiveFileOps'
import {
  ensureArchiveMediumPreview,
  ensureArchiveThumbnail,
} from '~/server/utils/artArchiveThumbnails'
import {
  verifyGalleryArchiveMedia,
  type GalleryArchiveMediaVariant,
} from '~/server/utils/artGalleryArchiveMedia'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  try {
    const artImageId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid art image id.' })
    }

    const query = getQuery(event)
    const rawVariant = query.variant
    const variant: GalleryArchiveMediaVariant =
      rawVariant === 'medium' || rawVariant === 'full'
        ? rawVariant
        : 'thumbnail'
    const hasCapability = verifyGalleryArchiveMedia(
      artImageId,
      variant,
      query.exp,
      query.sig,
    )

    // A valid capability was minted only after this row passed the collection
    // API's buildArtImageWhere() filter. Without one, fall back to the same
    // header-auth access rule so API clients can still load the route directly.
    let artImage: { id: number } | null = null
    if (hasCapability) {
      artImage = await prisma.artImage.findFirst({
        where: {
          id: artImageId,
          isActive: true,
          designer: 'art-archive',
        },
        select: { id: true },
      })
    } else {
      const access = await getArtImageAccessContext(event)
      artImage = await prisma.artImage.findFirst({
        where: {
          AND: [
            {
              id: artImageId,
              isActive: true,
              designer: 'art-archive',
            },
            buildArtImageWhere(access),
          ],
        },
        select: { id: true },
      })
    }

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: 'Archive image not found.',
      })
    }

    const entry = await prisma.archiveEntry.findFirst({
      where: { artImageId: artImage.id, isActive: true },
      select: {
        id: true,
        relativePath: true,
        fileMtime: true,
      },
    })
    if (!entry) {
      throw createError({
        statusCode: 404,
        message: 'Archive image not found.',
      })
    }

    const resolvedRoot = await realpath(getArtArchiveRoot())

    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    if (variant === 'thumbnail' || variant === 'medium') {
      const sourceMtimeMs = entry.fileMtime ? entry.fileMtime.getTime() : null
      const buffer =
        variant === 'medium'
          ? await ensureArchiveMediumPreview(
              resolvedRoot,
              entry.id,
              entry.relativePath,
              sourceMtimeMs,
            )
          : await ensureArchiveThumbnail(
              resolvedRoot,
              entry.id,
              entry.relativePath,
              sourceMtimeMs,
            )
      setHeader(event, 'Content-Type', 'image/webp')
      return buffer
    }

    const sourcePath = await resolveConfinedExistingPath(
      resolvedRoot,
      entry.relativePath,
    )
    const extension = path.extname(sourcePath).replace(/^\./, '').toLowerCase()
    setHeader(
      event,
      'Content-Type',
      CONTENT_TYPES[extension] || 'application/octet-stream',
    )
    return await readFile(sourcePath)
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      statusCode,
      message: handled.message || 'Failed to load archive image.',
    }
  }
})

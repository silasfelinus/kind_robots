// /server/api/art/image/archive/[id].get.ts
//
// Gallery-safe byte route for ArtImages imported from PRIVATE_PATH. Archive
// ArtImage.path values are relative to the private archive root, not
// public/images, so treating them as normal web paths turns "abstract/foo.png"
// into /images/abstract/foo.png and image-card falls back when that 404s.
//
// Access is decided from the ArtImage first. That keeps private/mature policy in
// the same buildArtImageWhere() rule as every other art listing/detail route;
// callers who cannot see the ArtImage get a 404 without learning that an archive
// file exists. Only after that check do we resolve the ArchiveEntry and touch
// PRIVATE_PATH, always through the existing root-confinement helpers.
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

    const access = await getArtImageAccessContext(event)
    const artImage = await prisma.artImage.findFirst({
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
    if (!artImage) {
      throw createError({ statusCode: 404, message: 'Archive image not found.' })
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
      throw createError({ statusCode: 404, message: 'Archive image not found.' })
    }

    const resolvedRoot = await realpath(getArtArchiveRoot())
    const rawVariant = getQuery(event).variant
    const variant =
      rawVariant === 'medium' || rawVariant === 'full'
        ? rawVariant
        : 'thumbnail'

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

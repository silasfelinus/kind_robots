// /server/api/admin/art-archive/entries/[id]/file.get.ts
//
// Admin-only byte-serving route for one Art Archive file (art-archive/
// t-029). Nothing previously served archive bytes over HTTP at all --
// ArtImage.path/ArchiveEntry.relativePath for an archive-sourced row is only
// ever a path relative to the private, non-web-served archive root
// (PRIVATE_PATH), so the browse grid's `<img>` bindings had nothing real to
// load. `?variant=thumbnail` serves a cached, downscaled copy
// (artArchiveThumbnails.ts); anything else serves the original bytes.
//
// `?variant=medium` serves a cached ~1200px copy (art-archive/t-035), for
// the admin detail panel's larger preview -- cheaper first paint than the
// untouched original for a very large source file.
//
// Root-confined via the same path-safety helper the move/quarantine/restore
// actions use (resolveConfinedExistingPath), and gated identically to
// entries/index.get.ts (admin + mature-content access) since this reads
// private, mature-flagged content.
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  setHeader,
} from 'h3'
import path from 'node:path'
import { readFile, realpath } from 'node:fs/promises'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { resolveConfinedExistingPath } from '~/server/utils/artArchiveFileOps'
import {
  ensureArchiveMediumPreview,
  ensureArchiveThumbnail,
} from '~/server/utils/artArchiveThumbnails'
import { verifyArchiveMedia } from '~/server/utils/artArchiveSignedMedia'
import type { ArchiveMediaVariant } from '~/server/utils/artArchiveSignedMedia'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const query = getQuery(event)
    const rawVariant = query.variant
    const variant: ArchiveMediaVariant =
      rawVariant === 'thumbnail' || rawVariant === 'medium'
        ? rawVariant
        : 'full'

    // Two ways in, and the header one is unchanged. An <img> cannot send a
    // header at all, so a browser presents a signature this server minted for
    // an already-authenticated admin instead (artArchiveSignedMedia.ts). The
    // signature is bound to this id AND this variant, so a thumbnail link does
    // not also fetch the original.
    if (!verifyArchiveMedia(id, variant, query.exp, query.sig)) {
      const auth = await requireAdminApiUser(event)
      if (!viewerShowsMature(auth.user)) {
        throw createError({
          statusCode: 403,
          message: 'Mature-content access is required for Art Archive entries.',
        })
      }
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: {
        id: true,
        relativePath: true,
        fileMtime: true,
        artImageId: true,
      },
    })
    if (!entry || !entry.artImageId) {
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id} not found.`,
      })
    }

    const resolvedRoot = await realpath(getArtArchiveRoot())

    // Private+mature content, never a shared CDN entry -- cached per-browser
    // only, matching file.get.ts's own non-public Cache-Control branch.
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    if (variant === 'thumbnail' || variant === 'medium') {
      const sourceMtimeMs = entry.fileMtime ? entry.fileMtime.getTime() : null
      const buffer =
        variant === 'thumbnail'
          ? await ensureArchiveThumbnail(
              resolvedRoot,
              entry.id,
              entry.relativePath,
              sourceMtimeMs,
            )
          : await ensureArchiveMediumPreview(
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
      message: handled.message || 'Failed to load archive file.',
    }
  }
})

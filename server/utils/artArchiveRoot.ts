// /server/utils/artArchiveRoot.ts
//
// The Art Archive (art-archive/t-004) scans a dedicated media-server folder
// that may contain arbitrarily deep subfolders of legacy AI-art files. That
// path is host configuration (art-archive/t-017 is still open, confirming the
// real production mount), so it is read from ART_ARCHIVE_ROOT rather than
// hardcoded or derived from IMAGES_PATH -- this archive is a distinct share
// from ordinary served images and must not accidentally scan/import from it.
import path from 'node:path'
import { createError } from 'h3'

export type ArtArchiveRootSource = 'ART_ARCHIVE_ROOT' | 'unconfigured'

export function getArtArchiveRootSource(): ArtArchiveRootSource {
  return process.env.ART_ARCHIVE_ROOT?.trim() ? 'ART_ARCHIVE_ROOT' : 'unconfigured'
}

/**
 * The configured archive root, resolved to an absolute path.
 *
 * Throws rather than falling back to a guessed directory -- scanning the
 * wrong tree (or a fresh empty one) is worse than refusing to run at all.
 */
export function getArtArchiveRoot(): string {
  const configured = process.env.ART_ARCHIVE_ROOT?.trim()
  if (configured) return path.resolve(configured)

  throw createError({
    statusCode: 503,
    message:
      'Art Archive root is not configured: set ART_ARCHIVE_ROOT to the ' +
      'media-server directory mounted into the container.',
  })
}

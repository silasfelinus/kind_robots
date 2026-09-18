// /server/utils/artArchiveRoot.ts
//
// The Art Archive (art-archive/t-004) scans the existing private media mount.
// Production already maps the host archive directory into /app/private and
// exposes that container path through PRIVATE_PATH, matching Kind Robots'
// existing path-variable convention. Do not invent a second archive-root env
// variable: PRIVATE_PATH is the authoritative container-side root.
import path from 'node:path'
import { createError } from 'h3'

export type ArtArchiveRootSource = 'PRIVATE_PATH' | 'unconfigured'

export function getArtArchiveRootSource(): ArtArchiveRootSource {
  return process.env.PRIVATE_PATH?.trim() ? 'PRIVATE_PATH' : 'unconfigured'
}

/**
 * The configured archive root, resolved to an absolute path.
 *
 * Throws rather than falling back to a guessed directory. Production provides
 * PRIVATE_PATH=/app/private, backed by /mnt/user/pc/kindrobots/private on the
 * Unraid host; local/dev environments must configure their own private root.
 */
export function getArtArchiveRoot(): string {
  const configured = process.env.PRIVATE_PATH?.trim()
  if (configured) return path.resolve(configured)

  throw createError({
    statusCode: 503,
    message:
      'Art Archive root is not configured: set PRIVATE_PATH to the private ' +
      'media directory mounted into the container.',
  })
}

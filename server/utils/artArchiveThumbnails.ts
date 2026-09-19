// /server/utils/artArchiveThumbnails.ts
//
// Generates and caches a downscaled preview for one Art Archive file
// (art-archive/t-029): the admin browse grid was rendering full-size
// archive images, and nothing ever populated a real thumbnail -- the
// browse endpoint's `thumbnailPath` just fell back to the full-size path.
//
// Thumbnails are cached as real files under a reserved, dot-prefixed
// subtree of the archive root (`.art-archive-thumbnails/`) rather than in
// the database: artArchiveScanner.ts's walk() already skips any directory
// starting with `.`, so the cache can never be rediscovered as new archive
// content on a future scan, and a database-blob cache would grow the
// ledger's payload by exactly the byte count art-archive/t-018 worked to
// keep bounded for large libraries.
import path from 'node:path'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { resolveConfinedExistingPath } from './artArchiveFileOps'

export const ARCHIVE_THUMBNAIL_FOLDER = '.art-archive-thumbnails'

// Matches artImageEncoding.ts / file.get.ts: 82 measured 8.3x smaller than
// the source PNG with no visible artefacts at card size.
const THUMBNAIL_WEBP_QUALITY = 82

// Wide enough for the grid's largest column density (2xl:grid-cols-6) at 2x
// pixel density on a typical desktop viewport. `fit: 'inside'` only ever
// shrinks -- a source narrower than this is left at its original size.
const THUMBNAIL_MAX_DIMENSION = 480

function cachePathFor(resolvedRoot: string, archiveEntryId: number): string {
  return path.join(resolvedRoot, ARCHIVE_THUMBNAIL_FOLDER, `${archiveEntryId}.webp`)
}

/**
 * Returns a cached thumbnail buffer for `archiveEntryId`, generating (and
 * caching) it first if none exists yet or the cached copy predates the
 * source file's last modification. `sourceMtimeMs` is the ArchiveEntry's own
 * recorded `fileMtime` -- a rescan only bumps it when a file's bytes
 * actually changed, so a stale cached thumbnail from before a re-import is
 * invalidated the same way artArchiveScanner.ts's own size+mtime cache
 * trusts (or distrusts) a previously-recorded identity.
 */
export async function ensureArchiveThumbnail(
  resolvedRoot: string,
  archiveEntryId: number,
  relativePath: string,
  sourceMtimeMs: number | null,
): Promise<Buffer> {
  const cachePath = cachePathFor(resolvedRoot, archiveEntryId)

  try {
    const cacheStat = await stat(cachePath)
    if (sourceMtimeMs === null || cacheStat.mtimeMs >= sourceMtimeMs) {
      return await readFile(cachePath)
    }
  } catch {
    // No cached copy yet (or it's unreadable) -- fall through and generate one.
  }

  const sourcePath = await resolveConfinedExistingPath(resolvedRoot, relativePath)
  const original = await readFile(sourcePath)
  const thumbnail = await sharp(original)
    .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_WEBP_QUALITY })
    .toBuffer()

  await mkdir(path.dirname(cachePath), { recursive: true })
  // Write-then-rename so a reader racing the generation never sees a
  // truncated/partial file at the final cache path.
  const tempPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, thumbnail)
  await rename(tempPath, cachePath)

  return thumbnail
}

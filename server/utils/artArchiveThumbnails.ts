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

// Separate dot-prefixed folder, same reasoning as ARCHIVE_THUMBNAIL_FOLDER
// (art-archive/t-035): artArchiveScanner.ts's walk() skips any directory
// starting with `.`, so this cache can never be rediscovered as new archive
// content on a future scan.
export const ARCHIVE_MEDIUM_FOLDER = '.art-archive-medium'

// Matches artImageEncoding.ts / file.get.ts: 82 measured 8.3x smaller than
// the source PNG with no visible artefacts at card size.
const THUMBNAIL_WEBP_QUALITY = 82

// Wide enough for the grid's largest column density (2xl:grid-cols-6) at 2x
// pixel density on a typical desktop viewport. `fit: 'inside'` only ever
// shrinks -- a source narrower than this is left at its original size.
const THUMBNAIL_MAX_DIMENSION = 480

// Wide enough for the admin detail panel's full-width preview at 2x pixel
// density on a typical desktop viewport, well below what a very large
// archive original (e.g. a multi-thousand-pixel upscale/render) would be.
const MEDIUM_MAX_DIMENSION = 1200

function cachePathFor(
  resolvedRoot: string,
  folder: string,
  archiveEntryId: number,
): string {
  return path.join(resolvedRoot, folder, `${archiveEntryId}.webp`)
}

/**
 * Returns a cached downscaled-WebP buffer for `archiveEntryId` in the given
 * cache `folder`, generating (and caching) it first if none exists yet or
 * the cached copy predates the source file's last modification.
 * `sourceMtimeMs` is the ArchiveEntry's own recorded `fileMtime` -- a
 * rescan only bumps it when a file's bytes actually changed, so a stale
 * cached copy from before a re-import is invalidated the same way
 * artArchiveScanner.ts's own size+mtime cache trusts (or distrusts) a
 * previously-recorded identity.
 */
async function ensureArchiveDerivedImage(
  resolvedRoot: string,
  folder: string,
  maxDimension: number,
  archiveEntryId: number,
  relativePath: string,
  sourceMtimeMs: number | null,
): Promise<Buffer> {
  const cachePath = cachePathFor(resolvedRoot, folder, archiveEntryId)

  try {
    const cacheStat = await stat(cachePath)
    if (sourceMtimeMs === null || cacheStat.mtimeMs >= sourceMtimeMs) {
      return await readFile(cachePath)
    }
  } catch {
    // No cached copy yet (or it's unreadable) -- fall through and generate one.
  }

  const sourcePath = await resolveConfinedExistingPath(
    resolvedRoot,
    relativePath,
  )
  const original = await readFile(sourcePath)
  const derived = await sharp(original)
    .resize(maxDimension, maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_WEBP_QUALITY })
    .toBuffer()

  await mkdir(path.dirname(cachePath), { recursive: true })
  // Write-then-rename so a reader racing the generation never sees a
  // truncated/partial file at the final cache path.
  const tempPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, derived)
  await rename(tempPath, cachePath)

  return derived
}

export async function ensureArchiveThumbnail(
  resolvedRoot: string,
  archiveEntryId: number,
  relativePath: string,
  sourceMtimeMs: number | null,
): Promise<Buffer> {
  return ensureArchiveDerivedImage(
    resolvedRoot,
    ARCHIVE_THUMBNAIL_FOLDER,
    THUMBNAIL_MAX_DIMENSION,
    archiveEntryId,
    relativePath,
    sourceMtimeMs,
  )
}

/**
 * Medium-sized cached preview for the admin detail panel (art-archive/t-035):
 * the detail panel previously always requested the full-size original via
 * entries/[id]/file.get.ts, which is slow on first paint for a very large
 * source file. This reuses the same cache-folder/mtime-invalidation pattern
 * as ensureArchiveThumbnail, just at a larger cap.
 */
export async function ensureArchiveMediumPreview(
  resolvedRoot: string,
  archiveEntryId: number,
  relativePath: string,
  sourceMtimeMs: number | null,
): Promise<Buffer> {
  return ensureArchiveDerivedImage(
    resolvedRoot,
    ARCHIVE_MEDIUM_FOLDER,
    MEDIUM_MAX_DIMENSION,
    archiveEntryId,
    relativePath,
    sourceMtimeMs,
  )
}

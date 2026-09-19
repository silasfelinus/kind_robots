// /server/utils/artArchiveScanner.ts
//
// Recursive, read-only scan of the configured Art Archive root
// (art-archive/t-004). Never writes, moves, or deletes anything under the
// root -- it only reads files to hash and extract metadata from them. Every
// visited path is resolved with `realpath` and checked against the resolved
// root before its contents are read, so a symlink planted inside the archive
// cannot walk this outside the configured directory (the DESIGN-BRIEF
// requires "every resolved path must remain inside the configured root").
//
// This module deliberately stops at "here is what the filesystem contains" --
// it does not write ArchiveEntry rows or touch ArtImage/ArtCollection. That
// reconciliation is art-archive/t-005 and t-008's job, reading this module's
// output as their input.
import path from 'node:path'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { contentHashOf, extractArchiveImageMetadata } from './artArchiveMetadata'
import type { ExtractedArchiveMetadata } from './artArchiveMetadata'
import { ARCHIVE_TRASH_FOLDER } from './artArchiveFileOps'

export const SUPPORTED_ARCHIVE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

export type ScannedArchiveFile = {
  /** Path relative to the archive root, forward-slash separated. */
  relativePath: string
  /** The immediate parent folder, relative to the root ('' at the root itself). */
  parentFolder: string
  contentHash: string
  fileSize: number
  fileMtime: Date
  metadata: ExtractedArchiveMetadata
}

export type ArchiveScanIssue = {
  /** Path as encountered (may be outside the root -- that's exactly why it's an issue). */
  path: string
  reason: 'escaped-root' | 'unreadable'
  detail: string
}

export type ArchiveScanResult = {
  root: string
  files: ScannedArchiveFile[]
  issues: ArchiveScanIssue[]
  /** Files served from `knownFiles` without re-reading/re-hashing their bytes. */
  cacheHitCount: number
}

/** A previously-recorded file identity/metadata, keyed by relativePath in `knownFiles`. */
export type KnownArchiveFile = {
  contentHash: string
  fileSize: number
  fileMtimeMs: number
  metadata: ExtractedArchiveMetadata
}

export type ScanArchiveRootOptions = {
  /**
   * Previously-recorded file identity/metadata (typically the live
   * ArchiveEntry ledger), keyed by relativePath. When a candidate file's
   * current size and mtime match a known entry exactly, the scanner reuses
   * its cached hash/metadata instead of re-reading and re-hashing the
   * file's bytes -- large-library scans otherwise re-hash every byte of
   * every file on every repeated pass (art-archive/t-018). Omit for a full,
   * uncached scan (unchanged default behavior).
   */
  knownFiles?: Map<string, KnownArchiveFile>
  /** Max files read/hashed concurrently. Default `DEFAULT_SCAN_CONCURRENCY`. */
  concurrency?: number
}

export const DEFAULT_SCAN_CONCURRENCY = 8

/** Runs `fn` over `items` with at most `concurrency` calls in flight at once. */
async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0
  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = items[index]!
      index += 1
      await fn(current)
    }
  }
  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

function toPosixRelative(root: string, absolute: string): string {
  return path.relative(root, absolute).split(path.sep).join('/')
}

/**
 * Resolves `candidate` (already known to be a child of `parentReal`) and
 * confirms the result is still inside `resolvedRoot`. Returns null (and
 * records an issue) instead of throwing, so one escaped/broken symlink does
 * not abort the whole scan.
 */
async function resolveConfined(
  resolvedRoot: string,
  candidate: string,
  issues: ArchiveScanIssue[],
): Promise<string | null> {
  let resolved: string
  try {
    resolved = await realpath(candidate)
  } catch (error) {
    issues.push({ path: candidate, reason: 'unreadable', detail: String(error) })
    return null
  }

  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    issues.push({
      path: candidate,
      reason: 'escaped-root',
      detail: `resolved to ${resolved}, outside ${resolvedRoot}`,
    })
    return null
  }

  return resolved
}

async function walk(
  resolvedRoot: string,
  directory: string,
  issues: ArchiveScanIssue[],
): Promise<string[]> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    issues.push({ path: directory, reason: 'unreadable', detail: String(error) })
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue // skip dotfiles/dotdirs (.git, .DS_Store, ...)
    // Never re-discover a quarantined file (art-archive/t-009): the trash
    // subtree lives inside the root by construction, so without this skip a
    // rescan would pick its contents back up as brand-new files and silently
    // undo an admin's quarantine action on the next pass.
    if (entry.name === ARCHIVE_TRASH_FOLDER) continue
    const candidate = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      const confined = await resolveConfined(resolvedRoot, candidate, issues)
      if (confined) files.push(...(await walk(resolvedRoot, confined, issues)))
      continue
    }

    if (!entry.isFile() && !entry.isSymbolicLink()) continue
    if (!SUPPORTED_ARCHIVE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue

    const confined = await resolveConfined(resolvedRoot, candidate, issues)
    if (confined) files.push(confined)
  }

  return files
}

/**
 * Scans `root` recursively and extracts identity/metadata for every
 * supported image file found. Read-only: reads directory listings and file
 * bytes, nothing else.
 */
export async function scanArchiveRoot(
  root: string,
  options: ScanArchiveRootOptions = {},
): Promise<ArchiveScanResult> {
  const issues: ArchiveScanIssue[] = []
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(path.resolve(root))
  } catch (error) {
    return {
      root,
      files: [],
      issues: [{ path: root, reason: 'unreadable', detail: String(error) }],
      cacheHitCount: 0,
    }
  }

  const filePaths = await walk(resolvedRoot, resolvedRoot, issues)
  const files: ScannedArchiveFile[] = []
  const knownFiles = options.knownFiles
  let cacheHitCount = 0

  await mapWithConcurrency(filePaths, options.concurrency ?? DEFAULT_SCAN_CONCURRENCY, async (filePath) => {
    const relativePath = toPosixRelative(resolvedRoot, filePath)
    const parentFolder = toPosixRelative(resolvedRoot, path.dirname(filePath))
    try {
      const fileStat = await stat(filePath)
      const known = knownFiles?.get(relativePath)
      // Trust the cache only when size AND mtime still match -- either
      // changing is proof the file's bytes may have too, and a false cache
      // hit would silently propagate a stale hash/metadata pair.
      //
      // Truncate the live stat's mtime to whole milliseconds before
      // comparing: `known.fileMtimeMs` is always derived from a JS `Date`
      // (ScannedArchiveFile.fileMtime is a Date, and the DB round trip through
      // ArchiveEntry.fileMtime is one too), and `Date` can only hold
      // integer-millisecond precision -- it truncates toward zero. A raw
      // `fs.stat()` result carries sub-millisecond precision on any POSIX
      // filesystem with nanosecond mtimes (ext4, xfs, ...), so
      // `fileStat.mtimeMs` is a non-integer float in practice essentially
      // every time. Comparing it unrounded against an always-integer
      // `known.fileMtimeMs` made this cache hit almost never fire in
      // production -- every repeat scan silently re-read and re-hashed every
      // file's full bytes regardless of whether it had changed, defeating
      // the whole point of this cache (art-archive/t-030).
      const fileMtimeMsTruncated = Math.trunc(fileStat.mtimeMs)
      if (known && known.fileSize === fileStat.size && known.fileMtimeMs === fileMtimeMsTruncated) {
        cacheHitCount += 1
        files.push({
          relativePath,
          parentFolder,
          contentHash: known.contentHash,
          fileSize: fileStat.size,
          fileMtime: fileStat.mtime,
          metadata: known.metadata,
        })
        return
      }

      const buffer = await readFile(filePath)
      files.push({
        relativePath,
        parentFolder,
        contentHash: contentHashOf(buffer),
        fileSize: fileStat.size,
        fileMtime: fileStat.mtime,
        metadata: extractArchiveImageMetadata(buffer, filePath),
      })
    } catch (error) {
      issues.push({ path: filePath, reason: 'unreadable', detail: String(error) })
    }
  })

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return { root: resolvedRoot, files, issues, cacheHitCount }
}

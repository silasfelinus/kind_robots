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
import {
  contentHashOf,
  extractArchiveImageMetadata,
} from './artArchiveMetadata'
import type { ExtractedArchiveMetadata } from './artArchiveMetadata'
import { ARCHIVE_TRASH_FOLDER } from './artArchiveFileOps'

export const SUPPORTED_ARCHIVE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
])

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
   * its cached hash/metadata instead of re-reading/re-hashing the
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
    issues.push({
      path: candidate,
      reason: 'unreadable',
      detail: String(error),
    })
    return null
  }

  if (
    resolved !== resolvedRoot &&
    !resolved.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
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
  // Iterative, explicit-stack traversal rather than recursion (art-archive/t-041,
  // 2026-09-20): a deep or symlink-looped tree under the configured root blew the
  // call stack ("Maximum call stack size exceeded"), which the error handler mapped
  // to an opaque HTTP 400 and aborted the whole production dry-run/import before it
  // scanned a single file. `visitedDirs` also closes a gap `resolveConfined` doesn't
  // cover on its own: an in-bounds symlink that loops back to an ancestor directory
  // (still "inside the root", so it passes the escaped-root check) would otherwise
  // recurse/loop forever; now it is just skipped the second time.
  const files: string[] = []
  const dirStack: string[] = [directory]
  const visitedDirs = new Set<string>()

  while (dirStack.length > 0) {
    const currentDir = dirStack.pop()!
    if (visitedDirs.has(currentDir)) continue
    visitedDirs.add(currentDir)

    let entries
    try {
      entries = await readdir(currentDir, { withFileTypes: true })
    } catch (error) {
      issues.push({
        path: currentDir,
        reason: 'unreadable',
        detail: String(error),
      })
      continue
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue // skip dotfiles/dotdirs (.git, .DS_Store, ...)
      // Never re-discover a quarantined file (art-archive/t-009): the trash
      // subtree lives inside the root by construction, so without this skip a
      // rescan would pick its contents back up as brand-new files and silently
      // undo an admin's quarantine action on the next pass.
      if (entry.name === ARCHIVE_TRASH_FOLDER) continue
      const candidate = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        const confined = await resolveConfined(resolvedRoot, candidate, issues)
        if (confined) dirStack.push(confined)
        continue
      }

      if (!entry.isFile() && !entry.isSymbolicLink()) continue
      if (
        !SUPPORTED_ARCHIVE_EXTENSIONS.has(
          path.extname(entry.name).toLowerCase(),
        )
      )
        continue

      // A plain file cannot point anywhere but at itself, and the directory
      // holding it was already confined on the way in, so it cannot be outside
      // the root. Only a symlink can escape, so only a symlink needs the
      // realpath. That distinction is worth a branch: the production archive
      // holds 240,856 files, so resolving every one of them cost a quarter of
      // a million realpath() calls per walk, and the batched import walks once
      // per run (art-archive/t-041, 2026-09-23).
      if (entry.isFile() && !entry.isSymbolicLink()) {
        files.push(candidate)
        continue
      }

      const confined = await resolveConfined(resolvedRoot, candidate, issues)
      if (confined) files.push(confined)
    }
  }

  return files
}

/**
 * Scans `root` recursively and extracts identity/metadata for every
 * supported image file found. Read-only: reads directory listings and file
 * bytes, nothing else.
 */
export type ArchiveFileListing = {
  root: string
  /** POSIX-relative path of every supported image under the root, sorted. */
  relativePaths: string[]
  issues: ArchiveScanIssue[]
}

/**
 * The directory walk on its own: no file is opened, hashed or parsed.
 *
 * scanArchiveRoot() reads the full bytes of every uncached file and holds one
 * hydrated record per file in memory before it returns anything. That is fine
 * for a few thousand files and impossible for the real archive -- Silas,
 * 2026-09-22: "there are probably 10s or 100s of thousands of files ... we
 * should definitely have some sort of resumable process, and status output
 * reports while processing". A first import has no ArchiveEntry rows, so
 * nothing is cached, so that call reads the ENTIRE archive off disk in one
 * request.
 *
 * Splitting the walk out makes a cheap question cheap: how many files exist,
 * and which of them are not imported yet. Only the batch actually being
 * imported gets hydrated.
 */
export async function listArchiveFilePaths(
  root: string,
): Promise<ArchiveFileListing> {
  const issues: ArchiveScanIssue[] = []
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(path.resolve(root))
  } catch (error) {
    return {
      root,
      relativePaths: [],
      issues: [{ path: root, reason: 'unreadable', detail: String(error) }],
    }
  }

  const filePaths = await walk(resolvedRoot, resolvedRoot, issues)
  const relativePaths = filePaths.map((filePath) =>
    toPosixRelative(resolvedRoot, filePath),
  )
  relativePaths.sort((a, b) => a.localeCompare(b))
  return { root: resolvedRoot, relativePaths, issues }
}

/**
 * Reads, hashes and parses exactly the named files -- the expensive half of a
 * scan, restricted to a batch the caller chose.
 */
export async function hydrateArchiveFiles(
  root: string,
  relativePaths: readonly string[],
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

  const files: ScannedArchiveFile[] = []
  const knownFiles = options.knownFiles
  let cacheHitCount = 0

  await mapWithConcurrency(
    [...relativePaths],
    options.concurrency ?? DEFAULT_SCAN_CONCURRENCY,
    async (relativePath) => {
      // The caller names paths, so re-confine them rather than trusting the
      // caller the way the walk's own output could be trusted.
      const absolute = path.resolve(resolvedRoot, relativePath)
      const confined = await resolveConfined(resolvedRoot, absolute, issues)
      if (!confined) return

      const hydrated = await hydrateArchiveFile(
        resolvedRoot,
        confined,
        knownFiles,
        issues,
      )
      if (!hydrated) return
      if (hydrated.fromCache) cacheHitCount += 1
      files.push(hydrated.file)
    },
  )

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return { root: resolvedRoot, files, issues, cacheHitCount }
}

/**
 * One file's identity and metadata, reusing a known-good record when the
 * file's size and mtime both still match it.
 */
async function hydrateArchiveFile(
  resolvedRoot: string,
  filePath: string,
  knownFiles: Map<string, KnownArchiveFile> | undefined,
  issues: ArchiveScanIssue[],
): Promise<{ file: ScannedArchiveFile; fromCache: boolean } | null> {
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
    if (
      known &&
      known.fileSize === fileStat.size &&
      known.fileMtimeMs === fileMtimeMsTruncated
    ) {
      return {
        fromCache: true,
        file: {
          relativePath,
          parentFolder,
          contentHash: known.contentHash,
          fileSize: fileStat.size,
          fileMtime: fileStat.mtime,
          metadata: known.metadata,
        },
      }
    }

    const buffer = await readFile(filePath)
    return {
      fromCache: false,
      file: {
        relativePath,
        parentFolder,
        contentHash: contentHashOf(buffer),
        fileSize: fileStat.size,
        fileMtime: fileStat.mtime,
        metadata: extractArchiveImageMetadata(buffer, filePath),
      },
    }
  } catch (error) {
    issues.push({ path: filePath, reason: 'unreadable', detail: String(error) })
    return null
  }
}

/**
 * The whole archive in one pass: every file listed, then every file hydrated.
 *
 * Unchanged in behavior, and still the right call for a bounded archive or a
 * CLI that can take its time. For the production archive prefer
 * listArchiveFilePaths() plus a hydrated batch -- see import-batch.post.ts.
 */
export async function scanArchiveRoot(
  root: string,
  options: ScanArchiveRootOptions = {},
): Promise<ArchiveScanResult> {
  const listing = await listArchiveFilePaths(root)
  if (listing.issues.some((issue) => issue.path === root)) {
    return { root, files: [], issues: listing.issues, cacheHitCount: 0 }
  }

  const hydrated = await hydrateArchiveFiles(
    listing.root,
    listing.relativePaths,
    options,
  )
  return { ...hydrated, issues: [...listing.issues, ...hydrated.issues] }
}

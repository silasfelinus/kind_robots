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
export async function scanArchiveRoot(root: string): Promise<ArchiveScanResult> {
  const issues: ArchiveScanIssue[] = []
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(path.resolve(root))
  } catch (error) {
    return {
      root,
      files: [],
      issues: [{ path: root, reason: 'unreadable', detail: String(error) }],
    }
  }

  const filePaths = await walk(resolvedRoot, resolvedRoot, issues)
  const files: ScannedArchiveFile[] = []

  for (const filePath of filePaths) {
    try {
      const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)])
      files.push({
        relativePath: toPosixRelative(resolvedRoot, filePath),
        parentFolder: toPosixRelative(resolvedRoot, path.dirname(filePath)),
        contentHash: contentHashOf(buffer),
        fileSize: fileStat.size,
        fileMtime: fileStat.mtime,
        metadata: extractArchiveImageMetadata(buffer, filePath),
      })
    } catch (error) {
      issues.push({ path: filePath, reason: 'unreadable', detail: String(error) })
    }
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return { root: resolvedRoot, files, issues }
}

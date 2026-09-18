// /server/utils/artArchiveFileOps.ts
//
// Root-confined, path-traversal-safe filesystem helpers for admin-initiated
// Art Archive file actions (art-archive/t-009): moving an entry to a new
// relative path, or quarantining ("deleting") one. Deliberately separate
// from artArchiveScanner.ts's own resolveConfined (read-only, collects
// issues instead of throwing) -- an admin action must hard-fail on an unsafe
// path rather than silently skip it.
//
// No Prisma import here: these are pure filesystem operations the caller
// (the admin endpoints) composes with the ArchiveEntry/ArtImage database
// writes. Kept Prisma-free so path-safety logic is unit-testable against a
// real temp directory without a live DATABASE_URL, the same reasoning
// artArchiveReconcilerPlan.ts's split documents.
import path from 'node:path'
import { createError } from 'h3'
import { mkdir, realpath, rename } from 'node:fs/promises'

/** Quarantine folder name, relative to the archive root. Never auto-scanned: not a supported image extension holder in the usual sense, but kept out of band from real content by living at the root's own reserved subtree. */
export const ARCHIVE_TRASH_FOLDER = '_archive_trash'

function isRootEscapeGuardError(error: unknown): error is { statusCode: number } {
  return typeof error === 'object' && error !== null && 'statusCode' in error
}

/**
 * Resolves `relativePath` under `resolvedRoot` and confirms the real,
 * symlink-resolved path is still inside the root. Throws (never returns a
 * path outside the root) -- for an admin action, an escape attempt is a hard
 * error, not something to log and skip.
 */
export async function resolveConfinedExistingPath(
  resolvedRoot: string,
  relativePath: string,
): Promise<string> {
  const candidate = path.resolve(resolvedRoot, relativePath)
  let resolved: string
  try {
    resolved = await realpath(candidate)
  } catch {
    throw createError({ statusCode: 404, message: `File not found: ${relativePath}` })
  }
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw createError({ statusCode: 400, message: `Path escapes the archive root: ${relativePath}` })
  }
  return resolved
}

/**
 * Resolves a destination `relativePath` under `resolvedRoot` that may not
 * exist yet (a move target). Confinement is checked two ways: the joined
 * path is lexically normalized and prefix-checked against the root first
 * (defeats a `../..`-style relativePath before touching the filesystem at
 * all), then the nearest EXISTING ancestor directory is realpath-confirmed
 * confined too (defeats a symlinked intermediate directory pointing outside
 * the root) -- everything below that existing ancestor is new, and
 * therefore cannot itself be a symlink escape.
 */
export async function resolveConfinedTargetPath(
  resolvedRoot: string,
  relativePath: string,
): Promise<string> {
  const normalizedTarget = path.resolve(resolvedRoot, relativePath)
  if (normalizedTarget !== resolvedRoot && !normalizedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw createError({ statusCode: 400, message: `Target path escapes the archive root: ${relativePath}` })
  }

  let probe = path.dirname(normalizedTarget)
  while (true) {
    try {
      const real = await realpath(probe)
      if (real !== resolvedRoot && !real.startsWith(`${resolvedRoot}${path.sep}`)) {
        throw createError({ statusCode: 400, message: `Target path escapes the archive root: ${relativePath}` })
      }
      return normalizedTarget
    } catch (error) {
      if (isRootEscapeGuardError(error)) throw error
      const parent = path.dirname(probe)
      if (parent === probe) {
        throw createError({ statusCode: 400, message: `Invalid target path: ${relativePath}` })
      }
      probe = parent
    }
  }
}

/**
 * Moves the real file for `fromRelativePath` to `toRelativePath`, both
 * confined to `resolvedRoot`. Creates any new intermediate directories.
 * Never overwrites an existing file at the destination.
 */
export async function moveConfinedArchiveFile(
  resolvedRoot: string,
  fromRelativePath: string,
  toRelativePath: string,
): Promise<void> {
  const source = await resolveConfinedExistingPath(resolvedRoot, fromRelativePath)
  const target = await resolveConfinedTargetPath(resolvedRoot, toRelativePath)

  try {
    await realpath(target)
    throw createError({ statusCode: 409, message: `A file already exists at ${toRelativePath}.` })
  } catch (error) {
    if (isRootEscapeGuardError(error)) throw error
    // ENOENT is the expected, safe case -- nothing at the destination yet.
  }

  await mkdir(path.dirname(target), { recursive: true })
  await rename(source, target)
}

/** Deterministic, collision-safe quarantine path for one ArchiveEntry -- keyed on its id, not its current name, so two different entries whose relativePath happens to share a basename never collide in the trash folder. */
export function quarantineRelativePathFor(archiveEntryId: number, relativePath: string): string {
  return path.posix.join(ARCHIVE_TRASH_FOLDER, `${archiveEntryId}-${path.posix.basename(relativePath)}`)
}

/**
 * Quarantines the real file for an entry by moving it into the archive
 * root's reserved trash subtree. Never unlinks/erases bytes -- this is the
 * "safe filesystem action" this task's note calls for, matching the
 * project's isActive-flag convention for reversible deletion everywhere
 * else in the schema.
 */
export async function quarantineConfinedArchiveFile(
  resolvedRoot: string,
  archiveEntryId: number,
  relativePath: string,
): Promise<string> {
  const trashRelativePath = quarantineRelativePathFor(archiveEntryId, relativePath)
  await moveConfinedArchiveFile(resolvedRoot, relativePath, trashRelativePath)
  return trashRelativePath
}

/**
 * Restores a previously quarantined file from the trash subtree back to
 * `originalRelativePath` (art-archive/t-012) -- the exact inverse of
 * `quarantineConfinedArchiveFile`, reusing the same root-confined,
 * no-overwrite move so a restore can never land outside the archive root
 * or clobber a file that has since taken the original path.
 */
export async function restoreConfinedArchiveFile(
  resolvedRoot: string,
  trashRelativePath: string,
  originalRelativePath: string,
): Promise<void> {
  await moveConfinedArchiveFile(resolvedRoot, trashRelativePath, originalRelativePath)
}

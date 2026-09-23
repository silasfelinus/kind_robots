// /server/utils/artArchiveListingCache.ts
//
// One directory walk per import run, not one per batch.
//
// WHY THIS EXISTS
// ---------------
// The batched import walked the whole archive on every call, because each
// request has to know what is on disk before it can pick the next slice. That
// is fine at a thousand files and quadratic at the real size: 240,856 files
// across 443 folders, ~964 batches of 250, so the walk alone would run a
// quarter of a million readdir entries nearly a thousand times over -- far more
// work than the import it exists to serve (art-archive/t-041, 2026-09-23).
//
// The listing barely changes during a run, so it is taken once and reused, with
// the position reached carried alongside it so the next batch resumes where the
// last one stopped instead of re-checking everything before it.
//
// WHAT THIS IS NOT
// ----------------
// Not the resume state. That is the database, and it stays the database: a file
// is done when its ledger row says so. This cache only avoids re-discovering
// paths, so losing it (a restart, an expiry, a different root) costs one walk
// and changes no outcome. `cursor` is likewise an optimization -- a run that
// starts at 0 reaches the same answer, just after more window queries.

import type { ArchiveScanIssue } from './artArchiveScanner'

export type ArchiveListingSnapshot = {
  root: string
  relativePaths: string[]
  issues: ArchiveScanIssue[]
  takenAt: number
  /** How far into `relativePaths` this run has already walked. */
  cursor: number
}

/**
 * Long enough to cover a full import at archive scale, short enough that a
 * later run sees files added since. A run that outlives it simply re-walks.
 */
export const LISTING_TTL_MS = 60 * 60 * 1000

let snapshot: ArchiveListingSnapshot | null = null

export function readListingCache(
  root: string,
  now: number = Date.now(),
): ArchiveListingSnapshot | null {
  if (!snapshot) return null
  if (snapshot.root !== root) return null
  if (now - snapshot.takenAt >= LISTING_TTL_MS) return null
  return snapshot
}

export function writeListingCache(
  entry: Omit<ArchiveListingSnapshot, 'takenAt' | 'cursor'> & {
    takenAt?: number
    cursor?: number
  },
): ArchiveListingSnapshot {
  snapshot = {
    root: entry.root,
    relativePaths: entry.relativePaths,
    issues: entry.issues,
    takenAt: entry.takenAt ?? Date.now(),
    cursor: entry.cursor ?? 0,
  }
  return snapshot
}

/** Records how far a batch got, so the next one does not re-walk that ground. */
export function advanceListingCursor(root: string, cursor: number): void {
  if (snapshot && snapshot.root === root) {
    snapshot.cursor = Math.max(snapshot.cursor, cursor)
  }
}

/** Drops the snapshot so the next call takes a fresh walk. */
export function clearListingCache(): void {
  snapshot = null
}

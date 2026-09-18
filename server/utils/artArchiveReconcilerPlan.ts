// /server/utils/artArchiveReconcilerPlan.ts
//
// Pure decision core for art-archive/t-008's reconciliation. Kept in its own
// module, with zero Prisma import, so it can be unit-tested without a
// database -- artArchiveScanner.ts (the only other import here) is itself
// Prisma-free. server/utils/artArchiveReconciler.ts is the impure shell that
// loads the real ledger, calls planArchiveReconciliation(), and writes the
// results.
//
// A rescan today does more than "does this exact path already exist":
// content can reappear at a new path (a move), reappear at a new path while
// the old path is still present too (a copy), change in place (same path,
// new bytes), or simply stop appearing at all (missing, never silently
// deleted per the project's design brief).
import type { ScannedArchiveFile } from './artArchiveScanner'

export type ArchiveLedgerEntry = {
  id: number
  relativePath: string
  contentHash: string
}

export type ArchiveReconciliationAction =
  | { kind: 'new'; relativePath: string }
  | { kind: 'unchanged'; relativePath: string; entryId: number }
  | { kind: 'changed'; relativePath: string; entryId: number }
  | { kind: 'moved'; relativePath: string; fromEntryId: number; fromRelativePath: string }
  | { kind: 'copied'; relativePath: string; duplicateOfEntryId: number }

export type MissingArchiveEntry = { entryId: number; relativePath: string }

export type ArchiveReconciliationPlan = {
  /** One action per scanned file, in scan order. */
  actions: ArchiveReconciliationAction[]
  /** Known entries the scan no longer accounts for at any path (not consumed as a move source). */
  missing: MissingArchiveEntry[]
}

/**
 * Pure classification of a scan against the known ledger. No I/O.
 *
 * - An exact relativePath match is 'unchanged' or 'changed' depending on
 *   whether the content hash moved with it.
 * - A scanned file with no entry at its own path, but whose content hash
 *   matches a known entry whose OLD path is no longer present in this scan,
 *   is a 'moved' file -- the ledger identity travels with it.
 * - A scanned file with no entry at its own path, whose content hash matches
 *   a known entry whose old path IS still present in this scan, is a
 *   'copied' file: both paths are live, so the original keeps its identity
 *   and the new path gets its own.
 * - Anything left over is genuinely 'new'.
 * - A known entry whose path never turned up in the scan, and that wasn't
 *   consumed as a move's source, is reported as missing -- callers mark it,
 *   they never delete it.
 */
export function planArchiveReconciliation(
  files: Pick<ScannedArchiveFile, 'relativePath' | 'contentHash'>[],
  existingEntries: ArchiveLedgerEntry[],
): ArchiveReconciliationPlan {
  const scannedPaths = new Set(files.map((f) => f.relativePath))
  const byPath = new Map(existingEntries.map((e) => [e.relativePath, e]))
  const byHash = new Map<string, ArchiveLedgerEntry[]>()
  for (const entry of existingEntries) {
    const list = byHash.get(entry.contentHash)
    if (list) list.push(entry)
    else byHash.set(entry.contentHash, [entry])
  }

  // Only a move consumes its source -- an entry matched exactly at its own
  // path (unchanged/changed) must stay available as a 'copied' reference for
  // a sibling file that shares its hash at a different, still-live path.
  const usedAsMoveSource = new Set<number>()
  const actions: ArchiveReconciliationAction[] = []

  for (const file of files) {
    const exact = byPath.get(file.relativePath)
    if (exact) {
      actions.push({
        kind: exact.contentHash === file.contentHash ? 'unchanged' : 'changed',
        relativePath: file.relativePath,
        entryId: exact.id,
      })
      continue
    }

    const candidates = byHash.get(file.contentHash) ?? []
    const moveSource = candidates.find((c) => !scannedPaths.has(c.relativePath) && !usedAsMoveSource.has(c.id))
    if (moveSource) {
      usedAsMoveSource.add(moveSource.id)
      actions.push({
        kind: 'moved',
        relativePath: file.relativePath,
        fromEntryId: moveSource.id,
        fromRelativePath: moveSource.relativePath,
      })
      continue
    }

    const copySource = candidates[0]
    if (copySource) {
      actions.push({ kind: 'copied', relativePath: file.relativePath, duplicateOfEntryId: copySource.id })
      continue
    }

    actions.push({ kind: 'new', relativePath: file.relativePath })
  }

  const missing: MissingArchiveEntry[] = existingEntries
    .filter((e) => !scannedPaths.has(e.relativePath) && !usedAsMoveSource.has(e.id))
    .map((e) => ({ entryId: e.id, relativePath: e.relativePath }))

  return { actions, missing }
}

// /server/utils/artArchiveReconciler.ts
//
// Turns a fresh artArchiveScanner pass into a full reconciliation against the
// durable ArchiveEntry ledger (art-archive/t-008), building on t-005's
// path-keyed importArchiveFile(): a rescan today does more than "does this
// exact path already exist" -- content can reappear at a new path (a move),
// reappear at a new path while the old path is still present too (a copy),
// change in place (same path, new bytes), or simply stop appearing at all
// (missing, never silently deleted per the project's design brief).
//
// planArchiveReconciliation() is the pure decision core: given the scanned
// files and the currently-known entries (id/relativePath/contentHash only),
// it classifies every scanned file and lists every entry the scan no longer
// accounts for. It touches no database, so its move/copy/missing logic is
// unit-testable without Prisma. reconcileArchiveScan() is the impure shell
// that loads the real ledger, executes the plan, and writes the results.
import prisma from '~/server/utils/prisma'
import type { ArchiveScanResult, ScannedArchiveFile } from './artArchiveScanner'
import { importArchiveFile, type ArchiveImportResult } from './artArchiveImporter'

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

export type ArchiveReconciliationOutcome = ArchiveReconciliationAction & {
  archiveEntryId: number
  artImageId: number
}

export type ArchiveReconciliationResult = {
  root: string
  scannedFileCount: number
  scanIssueCount: number
  outcomes: ArchiveReconciliationOutcome[]
  missing: MissingArchiveEntry[]
  /**
   * Missing entries the plan found but this run deliberately did NOT mark,
   * because the scan came back with zero files while the ledger holds
   * entries -- almost certainly a failed/unmounted read of the archive root,
   * not 44,000 files vanishing at once. See `guardTripped`.
   */
  skippedMissing: MissingArchiveEntry[]
  guardTripped: boolean
  errors: { relativePath: string; message: string }[]
}

async function applyMove(
  source: { id: number; folderCollectionId: number | null },
  file: ScannedArchiveFile,
  userId: number,
): Promise<ArchiveImportResult> {
  // Rename the entry onto its new path first so importArchiveFile's own
  // exact-path lookup treats this as an update of the SAME entry/ArtImage
  // rather than creating a duplicate -- this is what carries the ledger
  // identity across the move.
  await prisma.archiveEntry.update({
    where: { id: source.id },
    data: { relativePath: file.relativePath },
  })

  const result = await importArchiveFile(file, userId)

  if (source.folderCollectionId && source.folderCollectionId !== result.collectionId) {
    await prisma.artCollection.update({
      where: { id: source.folderCollectionId },
      data: { ArtImages: { disconnect: { id: result.artImageId } } },
    })
  }

  return result
}

/**
 * Reconciles one full scan against the durable archive ledger: imports new/
 * changed/copied files, re-keys moved entries onto their new path, and marks
 * (never deletes) entries the scan no longer finds anywhere. Each scanned
 * file's write goes through importArchiveFile's own transaction, so one bad
 * row cannot roll back the batch, matching the importer/matcher CLIs' own
 * per-item isolation.
 */
export async function reconcileArchiveScan(
  scan: ArchiveScanResult,
  userId: number,
): Promise<ArchiveReconciliationResult> {
  const existingEntries = await prisma.archiveEntry.findMany({
    where: { isActive: true, processState: { not: 'MISSING' } },
    select: { id: true, relativePath: true, contentHash: true, folderCollectionId: true },
  })

  const plan = planArchiveReconciliation(scan.files, existingEntries)
  const filesByPath = new Map(scan.files.map((f) => [f.relativePath, f]))
  const entriesById = new Map(existingEntries.map((e) => [e.id, e]))

  const outcomes: ArchiveReconciliationOutcome[] = []
  const errors: { relativePath: string; message: string }[] = []

  for (const action of plan.actions) {
    const file = filesByPath.get(action.relativePath)
    if (!file) continue
    try {
      const result =
        action.kind === 'moved'
          ? await applyMove(entriesById.get(action.fromEntryId)!, file, userId)
          : await importArchiveFile(file, userId)
      outcomes.push({ ...action, archiveEntryId: result.archiveEntryId, artImageId: result.artImageId })
    } catch (error) {
      errors.push({ relativePath: action.relativePath, message: String(error) })
    }
  }

  // Guard: a scan that found nothing at all, against a ledger that has
  // entries, is far more likely a failed/unmounted read of the archive root
  // than every file having vanished in one pass. Never mark anything missing
  // off a suspiciously-empty scan -- that is exactly the "fragile filesystem
  // watcher" failure mode the design brief calls out.
  const guardTripped = scan.files.length === 0 && existingEntries.length > 0
  const missingToApply = guardTripped ? [] : plan.missing

  for (const entry of missingToApply) {
    try {
      await prisma.archiveEntry.update({
        where: { id: entry.entryId },
        data: { processState: 'MISSING' },
      })
    } catch (error) {
      errors.push({ relativePath: entry.relativePath, message: String(error) })
    }
  }

  return {
    root: scan.root,
    scannedFileCount: scan.files.length,
    scanIssueCount: scan.issues.length,
    outcomes,
    missing: missingToApply,
    skippedMissing: guardTripped ? plan.missing : [],
    guardTripped,
    errors,
  }
}

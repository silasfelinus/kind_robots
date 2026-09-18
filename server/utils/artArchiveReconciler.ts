// /server/utils/artArchiveReconciler.ts
//
// Impure shell for art-archive/t-008: loads the live ArchiveEntry ledger,
// runs it through artArchiveReconcilerPlan.ts's pure planArchiveReconciliation()
// against a fresh scan, and writes the result. New/changed/copied files go
// through t-005's path-keyed importArchiveFile() as before; a moved file is
// re-keyed onto its new relativePath first (so the importer's own exact-path
// lookup treats it as an update, carrying the same ArchiveEntry/ArtImage
// identity across the move) and is disconnected from its old folder
// ArtCollection if the parent folder changed; a missing entry gets
// `processState: MISSING` rather than being deleted.
import prisma from '~/server/utils/prisma'
import type { ArchiveScanResult, ScannedArchiveFile } from './artArchiveScanner'
import { importArchiveFile, type ArchiveImportResult } from './artArchiveImporter'
import { planArchiveReconciliation, type ArchiveReconciliationAction, type MissingArchiveEntry } from './artArchiveReconcilerPlan'

export type {
  ArchiveLedgerEntry,
  ArchiveReconciliationAction,
  ArchiveReconciliationPlan,
  MissingArchiveEntry,
} from './artArchiveReconcilerPlan'
export { planArchiveReconciliation } from './artArchiveReconcilerPlan'

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

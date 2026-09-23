// /server/utils/artArchiveImportedPaths.ts
//
// Which archive paths are actually done, shared by every caller that resumes.
//
// WHY THIS EXISTS
// ---------------
// The batched import uses the database as its cursor: a path is skipped when
// the ledger says it is already imported. The first version of that asked only
// whether an ArchiveEntry row existed for the path, which is wrong, because the
// ledger deliberately holds rows that are NOT imported:
//
//   - processState MISSING is how the reconciler records a file that vanished
//     (artArchiveReconciler.ts marks it rather than deleting the row, so the
//     entry's ratings and collections survive). If that file reappears on disk,
//     a row-exists check subtracts it from `pending`, calls it imported, and
//     never imports it again -- permanently, because the row it is trusting is
//     the very row saying the file was gone.
//   - PENDING and ERROR are the states of a file that has not been imported
//     yet or whose import failed. Both must be retried, not skipped.
//   - isActive false is a quarantined entry. Its file lives in the trash
//     subtree, which the scanner's walk skips, so it normally cannot appear in
//     a listing at all -- but if a NEW file later occupies that same
//     relativePath, it is a new file and must be imported. relativePath is
//     @@unique, and importArchiveFile() updates the row in place, so that is
//     safe.
//
// So "done" is exactly: an active entry whose import succeeded. Anything else
// is work still to do. scan-status and import-batch both go through here, so
// the number one reports and the set the other skips cannot drift apart
// (reported on kind_robots#2998).

export type ArchiveLedgerRow = {
  relativePath: string
  processState: string
  isActive: boolean
}

export type ArchiveLedgerDelegate = {
  findMany: (args: {
    where: { isActive: true; processState: 'IMPORTED' }
    select: { relativePath: true; processState: true; isActive: true }
  }) => PromiseLike<ArchiveLedgerRow[]>
}

/** Narrows the query to rows that can count as done. */
export const IMPORTED_ENTRY_WHERE = {
  isActive: true,
  processState: 'IMPORTED',
} as const

/**
 * The same rule the query encodes, as a value that can be reasoned about and
 * tested directly. Applied again to whatever comes back, so a future change to
 * the where clause cannot quietly widen what counts as imported.
 */
export function isImportedLedgerRow(row: ArchiveLedgerRow): boolean {
  return row.isActive === true && row.processState === 'IMPORTED'
}

export async function loadImportedArchivePaths(
  delegate: ArchiveLedgerDelegate,
): Promise<Set<string>> {
  const rows = await delegate.findMany({
    where: IMPORTED_ENTRY_WHERE,
    select: { relativePath: true, processState: true, isActive: true },
  })
  const imported = new Set<string>()
  for (const row of rows) {
    if (isImportedLedgerRow(row)) imported.add(row.relativePath)
  }
  return imported
}

/** Archive paths still needing an import, in listing order. */
export function selectPendingPaths(
  relativePaths: readonly string[],
  imported: ReadonlySet<string>,
): string[] {
  return relativePaths.filter((relativePath) => !imported.has(relativePath))
}

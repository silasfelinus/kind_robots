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
    where: {
      isActive: true
      processState: 'IMPORTED'
      relativePath?: { in: string[] }
    }
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

/**
 * The same question, asked about a bounded window of candidates.
 *
 * loadImportedArchivePaths() reads every imported row, which is right for a
 * one-off status call and wrong inside a loop: the production archive holds
 * 240,856 files, so a 250-file batch was pulling up to a quarter of a million
 * rows to decide the fate of 250 paths, ~964 times over a full import
 * (art-archive/t-041, 2026-09-23). relativePath is indexed and unique, so
 * asking about the window directly is a single indexed lookup.
 *
 * Callers must keep `paths` small enough for one IN clause; PATH_WINDOW_SIZE
 * is the size this module is built around.
 */
export const PATH_WINDOW_SIZE = 500

export async function selectImportedAmong(
  delegate: ArchiveLedgerDelegate,
  paths: readonly string[],
): Promise<Set<string>> {
  if (paths.length === 0) return new Set()
  const rows = await delegate.findMany({
    where: { ...IMPORTED_ENTRY_WHERE, relativePath: { in: [...paths] } },
    select: { relativePath: true, processState: true, isActive: true },
  })
  const imported = new Set<string>()
  for (const row of rows) {
    if (isImportedLedgerRow(row)) imported.add(row.relativePath)
  }
  return imported
}

/**
 * Walks forward through an already-listed archive, asking the ledger about one
 * window at a time, until it has `limit` paths that still need importing.
 *
 * Returns where it stopped so a caller working through the same listing can
 * continue from there rather than re-checking everything it has already walked
 * past. The cursor is an optimization only -- correctness never depends on it,
 * and a fresh run starting at 0 reaches the same answer.
 */
export async function collectPendingBatch(
  delegate: ArchiveLedgerDelegate,
  relativePaths: readonly string[],
  startIndex: number,
  limit: number,
  windowSize: number = PATH_WINDOW_SIZE,
): Promise<{ batch: string[]; nextIndex: number; windowsRead: number }> {
  const batch: string[] = []
  let index = Math.max(0, startIndex)
  let windowsRead = 0

  while (batch.length < limit && index < relativePaths.length) {
    const window = relativePaths.slice(index, index + windowSize)
    const imported = await selectImportedAmong(delegate, window)
    windowsRead += 1

    for (const relativePath of window) {
      index += 1
      if (!imported.has(relativePath)) {
        batch.push(relativePath)
        if (batch.length >= limit) break
      }
    }
  }

  return { batch, nextIndex: index, windowsRead }
}

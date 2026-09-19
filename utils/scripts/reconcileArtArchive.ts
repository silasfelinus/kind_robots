// /utils/scripts/reconcileArtArchive.ts
//
// CLI entrypoint for the Art Archive reconciler (art-archive/t-008). Scans
// the configured root (t-004's scanArchiveRoot) and reconciles it against
// the durable ledger via reconcileArchiveScan(): new/changed files import as
// usual, a moved file keeps its ledger identity at its new path, a copied
// file gets its own new entry, and a known entry the scan no longer finds
// anywhere is marked MISSING rather than deleted. Safe to run repeatedly on
// a schedule -- every pass recomputes the plan from the current filesystem
// and ledger state. Mirrors importArtArchive.ts's shape (same --root/--user-id
// flags, read-then-report structure).
//
// --dry-run (art-archive/t-019): before the first large import against the
// real archive, report the same new/changed/moved/copied/missing counts plus
// per-file resource-match evidence (t-023's matchArchiveResources) WITHOUT
// calling reconcileArchiveScan/importArchiveFile at all -- this mode never
// opens a Prisma write, so it is safe to run against production data with no
// transaction risk. The privacy invariant it reports (every proposed
// ArtImage/ArtCollection write is forced private+mature) is not re-derived
// here -- it is a structural property of importArchiveFile()/
// ensureFolderCollection() enforced by utils/scripts/verifyArtArchiveImporter.mjs.
//
// Usage:
//   PRIVATE_PATH=/path/to/archive npx tsx utils/scripts/reconcileArtArchive.ts
//   npx tsx utils/scripts/reconcileArtArchive.ts --root /path/to/archive --user-id 1
//   npx tsx utils/scripts/reconcileArtArchive.ts --dry-run
import { getArtArchiveRoot } from '../../server/utils/artArchiveRoot'
import { scanArchiveRoot, type ArchiveScanResult } from '../../server/utils/artArchiveScanner'
import {
  loadKnownArchiveFiles,
  reconcileArchiveScan,
  planArchiveReconciliation,
  type ArchiveLedgerEntry,
} from '../../server/utils/artArchiveReconciler'
import {
  matchArchiveResources,
  type ResourceMatchConfidence,
  type ResourceMatchOutcome,
} from '../../server/utils/artArchiveResourceMatch'
import prisma from '../../server/utils/prisma'

function resolveRootArg(): string | null {
  const flagIndex = process.argv.indexOf('--root')
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) return process.argv[flagIndex + 1]!
  return null
}

function resolveUserIdArg(): number {
  const flagIndex = process.argv.indexOf('--user-id')
  const raw = flagIndex >= 0 ? process.argv[flagIndex + 1] : null
  const parsed = raw ? Number(raw) : NaN
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

/**
 * Read-only plan + resource-match report for a scan, with zero Prisma writes:
 * fetches the existing ledger, runs it through the pure planner, and matches
 * each file's embedded generation metadata against the active Resource pool.
 * Mirrors importArtArchive.ts's per-file matching loop but never calls
 * importArchiveFile()/reconcileArchiveScan() -- safe to run against the real
 * production archive before the first bulk import.
 */
async function runDryRun(scan: ArchiveScanResult): Promise<void> {
  const existingEntries: ArchiveLedgerEntry[] = await prisma.archiveEntry.findMany({
    where: { isActive: true, processState: { not: 'MISSING' } },
    select: { id: true, relativePath: true, contentHash: true },
  })
  const plan = planArchiveReconciliation(scan.files, existingEntries)
  const countOf = (kind: string) => plan.actions.filter((a) => a.kind === kind).length

  let filesWithMatchEvidence = 0
  let unmatchedModels = 0
  const confidenceCounts: Record<ResourceMatchConfidence, number> = { hash: 0, exact: 0, suggested: 0 }

  for (const file of scan.files) {
    const matches = await matchArchiveResources(
      file.metadata,
      file.relativePath,
      file.parentFolder,
      prisma.resource,
    )
    const outcomes = [matches.checkpoint, ...matches.loras].filter(
      (outcome): outcome is ResourceMatchOutcome => outcome !== null,
    )
    if (outcomes.length > 0) filesWithMatchEvidence += 1
    for (const outcome of outcomes) {
      if (outcome.candidates.length > 0) {
        for (const candidate of outcome.candidates) confidenceCounts[candidate.confidence] += 1
      } else if (outcome.unmatched) {
        unmatchedModels += 1
      }
    }
  }

  const dryRunCacheHitPct =
    scan.files.length > 0 ? ((scan.cacheHitCount / scan.files.length) * 100).toFixed(1) : '0.0'

  console.log(`Art Archive DRY-RUN reconciliation of ${scan.root} -- NO DATABASE WRITES PERFORMED`)
  console.log(`  files scanned:            ${scan.files.length}`)
  console.log(
    `  served from cache:        ${scan.cacheHitCount}/${scan.files.length} (${dryRunCacheHitPct}%, skipped re-read/re-hash)`,
  )
  console.log(`  scan issues:              ${scan.issues.length}`)
  console.log(`  would import (new):       ${countOf('new')}`)
  console.log(`  unchanged:                ${countOf('unchanged')}`)
  console.log(`  would update (changed):   ${countOf('changed')}`)
  console.log(`  would re-key (moved):     ${countOf('moved')}`)
  console.log(`  would create (copied):    ${countOf('copied')}`)
  console.log(`  would mark missing:       ${plan.missing.length}`)
  console.log(`  files w/ match evidence:  ${filesWithMatchEvidence}`)
  console.log(
    `  resource-match candidates by confidence: hash=${confidenceCounts.hash} exact=${confidenceCounts.exact} suggested=${confidenceCounts.suggested}`,
  )
  console.log(`  unmatched embedded model evidence: ${unmatchedModels}`)
  console.log(
    '  privacy invariant: every proposed ArtImage/ArtCollection write is forced to isPublic=false, ' +
      "isMature=true by the importer's own write path (enforced by test:art-archive-importer, " +
      'not re-derived here).',
  )
  console.log('  This was a dry run -- no ArchiveEntry/ArtImage/ArtCollection rows were created or changed.')
}

async function main() {
  const root = resolveRootArg() ?? getArtArchiveRoot()
  const userId = resolveUserIdArg()
  const dryRun = process.argv.includes('--dry-run')
  const knownFiles = await loadKnownArchiveFiles()
  const scan = await scanArchiveRoot(root, { knownFiles })

  if (dryRun) {
    await runDryRun(scan)
    return
  }

  const result = await reconcileArchiveScan(scan, userId)

  const countOf = (kind: string) => result.outcomes.filter((o) => o.kind === kind).length
  const cacheHitPct =
    result.scannedFileCount > 0 ? ((scan.cacheHitCount / result.scannedFileCount) * 100).toFixed(1) : '0.0'

  console.log(`Art Archive reconciliation of ${result.root}`)
  console.log(`  files scanned:       ${result.scannedFileCount}`)
  console.log(
    `  served from cache:   ${scan.cacheHitCount}/${result.scannedFileCount} (${cacheHitPct}%, skipped re-read/re-hash)`,
  )
  console.log(`  scan issues:         ${result.scanIssueCount}`)
  console.log(`  new:                 ${countOf('new')}`)
  console.log(`  unchanged:           ${countOf('unchanged')}`)
  console.log(`  changed:             ${countOf('changed')}`)
  console.log(`  moved:               ${countOf('moved')}`)
  console.log(`  copied:              ${countOf('copied')}`)
  console.log(`  marked missing:      ${result.missing.length}`)
  if (result.guardTripped) {
    console.log(
      `  WARNING: scan found 0 files against a ${result.skippedMissing.length}-entry ledger -- ` +
        `treating this as a failed/unmounted read and skipping the missing-marking pass entirely.`,
    )
  }
  console.log(`  errors:              ${result.errors.length}`)
  for (const error of result.errors.slice(0, 20)) {
    console.log(`    ${error.relativePath}: ${error.message}`)
  }
  if (result.errors.length > 20) {
    console.log(`    ... and ${result.errors.length - 20} more`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

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
// Usage:
//   PRIVATE_PATH=/path/to/archive npx tsx utils/scripts/reconcileArtArchive.ts
//   npx tsx utils/scripts/reconcileArtArchive.ts --root /path/to/archive --user-id 1
import { getArtArchiveRoot } from '../../server/utils/artArchiveRoot'
import { scanArchiveRoot } from '../../server/utils/artArchiveScanner'
import { reconcileArchiveScan } from '../../server/utils/artArchiveReconciler'
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

async function main() {
  const root = resolveRootArg() ?? getArtArchiveRoot()
  const userId = resolveUserIdArg()
  const scan = await scanArchiveRoot(root)
  const result = await reconcileArchiveScan(scan, userId)

  const countOf = (kind: string) => result.outcomes.filter((o) => o.kind === kind).length

  console.log(`Art Archive reconciliation of ${result.root}`)
  console.log(`  files scanned:       ${result.scannedFileCount}`)
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

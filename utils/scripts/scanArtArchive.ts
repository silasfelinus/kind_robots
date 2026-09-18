// /utils/scripts/scanArtArchive.ts
//
// CLI dry-run report for the Art Archive scanner (art-archive/t-004). Reads
// and hashes files under the configured root and prints a summary -- it never
// writes anything, to the archive or to the database. Once art-archive/t-005
// exists, a separate `--apply` step will reconcile this scan's output into
// ArchiveEntry/ArtImage; this script is deliberately read-only.
//
// Usage:
//   ART_ARCHIVE_ROOT=/path/to/archive npx tsx utils/scripts/scanArtArchive.ts
//   npx tsx utils/scripts/scanArtArchive.ts --root /path/to/archive
import { getArtArchiveRoot } from '../../server/utils/artArchiveRoot'
import { scanArchiveRoot } from '../../server/utils/artArchiveScanner'

function resolveRootArg(): string | null {
  const flagIndex = process.argv.indexOf('--root')
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) return process.argv[flagIndex + 1]!
  return null
}

async function main() {
  const root = resolveRootArg() ?? getArtArchiveRoot()
  const result = await scanArchiveRoot(root)

  const withA1111 = result.files.filter(
    (file) => file.metadata.format === 'png' && file.metadata.supported && file.metadata.a1111,
  ).length
  const withComfy = result.files.filter(
    (file) => file.metadata.format === 'png' && file.metadata.supported && file.metadata.comfy,
  ).length
  const byExtension = new Map<string, number>()
  for (const file of result.files) {
    const ext = file.relativePath.slice(file.relativePath.lastIndexOf('.')).toLowerCase()
    byExtension.set(ext, (byExtension.get(ext) ?? 0) + 1)
  }

  console.log(`Art Archive dry-run scan of ${result.root}`)
  console.log(`  files found:        ${result.files.length}`)
  for (const [ext, count] of [...byExtension.entries()].sort()) {
    console.log(`    ${ext}: ${count}`)
  }
  console.log(`  with A1111 params:  ${withA1111}`)
  console.log(`  with Comfy prompt:  ${withComfy}`)
  console.log(`  issues:             ${result.issues.length}`)
  for (const issue of result.issues.slice(0, 20)) {
    console.log(`    [${issue.reason}] ${issue.path}: ${issue.detail}`)
  }
  if (result.issues.length > 20) {
    console.log(`    ... and ${result.issues.length - 20} more`)
  }

  console.log('\nSample entries:')
  for (const file of result.files.slice(0, 5)) {
    console.log(
      `  ${file.relativePath} (${file.fileSize} bytes, hash ${file.contentHash.slice(0, 12)}...)`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

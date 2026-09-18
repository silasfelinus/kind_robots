// /utils/scripts/importArtArchive.ts
//
// CLI entrypoint for the Art Archive importer (art-archive/t-005). Scans the
// configured root (art-archive/t-004's scanArchiveRoot) and reconciles every
// file into ArchiveEntry/ArtImage/ArtCollection rows via
// importArchiveFile() -- until now nothing called that function outside its
// own contract verifier, so the importer could not run against the real
// archive at all (art-archive/t-022). Mirrors scanArtArchive.ts's shape:
// same --root flag, same read-first-then-report structure, just applying
// instead of dry-running.
//
// Resource matching (art-archive/t-006) is deliberately out of scope here --
// see art-archive/t-023 for reporting match candidates from this entrypoint.
//
// Usage:
//   PRIVATE_PATH=/path/to/archive npx tsx utils/scripts/importArtArchive.ts
//   npx tsx utils/scripts/importArtArchive.ts --root /path/to/archive --user-id 1
import { getArtArchiveRoot } from '../../server/utils/artArchiveRoot'
import { scanArchiveRoot } from '../../server/utils/artArchiveScanner'
import { importArchiveFile } from '../../server/utils/artArchiveImporter'
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

  let imagesCreated = 0
  let imagesReused = 0
  let collectionsCreated = 0
  let collectionsReused = 0
  const errors: Array<{ relativePath: string; message: string }> = []

  for (const file of scan.files) {
    try {
      const result = await importArchiveFile(file, userId)
      if (result.createdImage) imagesCreated += 1
      else imagesReused += 1
      if (result.createdCollection) collectionsCreated += 1
      else collectionsReused += 1
    } catch (error) {
      errors.push({ relativePath: file.relativePath, message: String(error) })
    }
  }

  console.log(`Art Archive import of ${scan.root}`)
  console.log(`  files scanned:       ${scan.files.length}`)
  console.log(`  scan issues:         ${scan.issues.length}`)
  console.log(`  images created:      ${imagesCreated}`)
  console.log(`  images reused:       ${imagesReused}`)
  console.log(`  collections created: ${collectionsCreated}`)
  console.log(`  collections reused:  ${collectionsReused}`)
  console.log(`  import errors:       ${errors.length}`)
  for (const error of errors.slice(0, 20)) {
    console.log(`    ${error.relativePath}: ${error.message}`)
  }
  if (errors.length > 20) {
    console.log(`    ... and ${errors.length - 20} more`)
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

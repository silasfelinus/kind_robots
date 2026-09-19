// /utils/scripts/importArtArchive.ts
//
// CLI entrypoint for the Art Archive importer. Scans the configured root,
// reconciles every file into ArchiveEntry/ArtImage/ArtCollection rows, and
// reports the resource-provenance candidates found in each file's embedded
// generation metadata.
//
// Usage:
//   PRIVATE_PATH=/path/to/archive npx tsx utils/scripts/importArtArchive.ts
//   npx tsx utils/scripts/importArtArchive.ts --root /path/to/archive --user-id 1
import { getArtArchiveRoot } from '../../server/utils/artArchiveRoot'
import { scanArchiveRoot } from '../../server/utils/artArchiveScanner'
import { importArchiveFile } from '../../server/utils/artArchiveImporter'
import {
  matchArchiveResources,
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

function formatOutcome(label: string, outcome: ResourceMatchOutcome): string {
  if (outcome.candidates.length > 0) {
    return `${label}: ${outcome.candidates
      .map(
        (candidate) =>
          `Resource ${candidate.resourceId} [${candidate.confidence}] ${candidate.evidence}`,
      )
      .join('; ')}`
  }

  const evidence = outcome.unmatched
  if (!evidence) return `${label}: no embedded evidence`
  const parts = [
    evidence.name ? `name=${JSON.stringify(evidence.name)}` : null,
    evidence.hash ? `hash=${evidence.hash}` : null,
    evidence.weight != null ? `weight=${evidence.weight}` : null,
  ].filter(Boolean)
  return `${label}: UNMATCHED ${parts.join(' ')}`
}

async function main() {
  const root = resolveRootArg() ?? getArtArchiveRoot()
  const userId = resolveUserIdArg()
  const scan = await scanArchiveRoot(root)

  let imagesCreated = 0
  let imagesReused = 0
  let collectionsCreated = 0
  let collectionsReused = 0
  let filesWithMatchEvidence = 0
  let unmatchedModels = 0
  const errors: Array<{ relativePath: string; message: string }> = []

  for (const file of scan.files) {
    try {
      const result = await importArchiveFile(file, userId)
      if (result.createdImage) imagesCreated += 1
      else imagesReused += 1
      if (result.createdCollection) collectionsCreated += 1
      else collectionsReused += 1

      const matches = await matchArchiveResources(
        file.metadata,
        file.relativePath,
        file.parentFolder,
        prisma.resource,
      )
      const outcomes = [matches.checkpoint, ...matches.loras].filter(
        (outcome): outcome is ResourceMatchOutcome => outcome !== null,
      )
      if (outcomes.length > 0) {
        filesWithMatchEvidence += 1
        console.log(`  resource matches: ${file.relativePath}`)
        if (matches.checkpoint) {
          console.log(`    ${formatOutcome('checkpoint', matches.checkpoint)}`)
          if (matches.checkpoint.unmatched) unmatchedModels += 1
        }
        matches.loras.forEach((outcome, index) => {
          console.log(`    ${formatOutcome(`LoRA ${index + 1}`, outcome)}`)
          if (outcome.unmatched) unmatchedModels += 1
        })
      }
    } catch (error) {
      errors.push({ relativePath: file.relativePath, message: String(error) })
    }
  }

  console.log(`Art Archive import of ${scan.root}`)
  console.log(`  files scanned:        ${scan.files.length}`)
  console.log(`  scan issues:          ${scan.issues.length}`)
  console.log(`  images created:       ${imagesCreated}`)
  console.log(`  images reused:        ${imagesReused}`)
  console.log(`  collections created:  ${collectionsCreated}`)
  console.log(`  collections reused:   ${collectionsReused}`)
  console.log(`  files with evidence:  ${filesWithMatchEvidence}`)
  console.log(`  unmatched models:     ${unmatchedModels}`)
  console.log(`  import/match errors:  ${errors.length}`)
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

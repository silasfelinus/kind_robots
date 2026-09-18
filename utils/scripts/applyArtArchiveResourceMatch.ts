// /utils/scripts/applyArtArchiveResourceMatch.ts
//
// CLI entrypoint for art-archive/t-007: applies matchArchiveResources()
// (t-006) to every already-imported, unlocked ArchiveEntry, writing
// ArtImage.checkpointResourceId/LoraResources from unique defensible matches
// and recording every outcome (applied, ambiguous, suggested, unmatched
// evidence, no evidence) for later admin review (t-009) and the t-021
// missing-Resource backlog. Mirrors importArtArchive.ts's report-and-never-
// abort-on-one-failure shape, one level up: each entry runs in its own
// transaction so one bad row can't roll back the whole batch.
//
// Usage:
//   npx tsx utils/scripts/applyArtArchiveResourceMatch.ts
import {
  applyArchiveResourceMatches,
  applyArchiveEntryResourceMatch,
  type SkippedReason,
} from '../../server/utils/applyArtArchiveResourceMatch'
import prisma from '../../server/utils/prisma'

async function main() {
  const results = await applyArchiveResourceMatches({
    archiveEntryPool: prisma.archiveEntry,
    resource: prisma.resource,
    runOne: (entry) =>
      prisma.$transaction((tx) => applyArchiveEntryResourceMatch(entry, tx.resource, tx.artImage, tx.archiveEntry)),
  })

  const skippedCount = (reason: SkippedReason) => results.filter((r) => r.skippedReason === reason).length
  const applied = results.filter((r) => r.applied)
  const appliedCount = (state: string) => applied.filter((r) => r.matchState === state).length

  console.log('Art Archive resource match apply')
  console.log(`  entries considered:    ${results.length}`)
  console.log(`  applied:               ${applied.length}`)
  console.log(`    confirmed:           ${appliedCount('CONFIRMED')}`)
  console.log(`    ambiguous:           ${appliedCount('AMBIGUOUS')}`)
  console.log(`    suggested:           ${appliedCount('SUGGESTED')}`)
  console.log(`    unmatched evidence:  ${appliedCount('UNMATCHED')}`)
  console.log(`  skipped (locked):      ${skippedCount('locked')}`)
  console.log(`  skipped (no image):    ${skippedCount('no-art-image')}`)
  console.log(`  skipped (no metadata): ${skippedCount('no-metadata')}`)
  console.log(`  skipped (no evidence): ${skippedCount('no-evidence')}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// /utils/scripts/backfillArchiveSeeds.ts
//
// Recover the seeds the signed column could not hold.
//
// Before 20260923060000_art_image_seed_unsigned, ArtImage.seed was a signed
// INT, so roughly half of every imported archive file lost its seed -- first by
// aborting the whole insert, then (once that was made non-fatal) by being
// stored as null. Around 19,000 files were imported in that window.
//
// Nothing was actually lost: importArchiveFile writes the file's real metadata
// verbatim to ArchiveEntry.extractedMetadata, so the true seed is still on
// disk in the database. This reads it back and fills in the column, which is
// the entire reason the importer dropped the value instead of clamping it.
//
// The import does NOT revisit these rows on its own -- their ledger rows say
// IMPORTED, which is correct, they simply have a null seed -- so this is the
// only thing that will fix them.
//
//   npx tsx utils/scripts/backfillArchiveSeeds.ts            # report only
//   npx tsx utils/scripts/backfillArchiveSeeds.ts --apply    # write
//
// Safe to re-run, and safe to stop: it only ever fills a seed that is null,
// never overwrites one, and works in batches so it can be interrupted.

import prisma from '../../server/utils/prisma'
import { narrowToPngMetadata } from '../../server/utils/artArchiveMetadata'
import { seedColumnOrNull } from '../../server/utils/artImageSeedColumn'

const APPLY = process.argv.includes('--apply')
const BATCH = 500

function seedFromExtractedMetadata(raw: string | null): number | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  // narrowToPngMetadata is the same shape check the importer used to read this
  // metadata in the first place; the cast is only because JSON.parse is
  // untyped, and narrowToPngMetadata returns null for anything unexpected.
  const png = narrowToPngMetadata(
    parsed as Parameters<typeof narrowToPngMetadata>[0],
  )
  const source = png?.a1111 ?? png?.comfy
  return seedColumnOrNull(source?.seed)
}

async function main() {
  let cursor = 0
  let scanned = 0
  let recovered = 0
  let stillUnknown = 0

  for (;;) {
    // Only entries whose ArtImage has no seed: this never touches a row that
    // already has one.
    const entries = await prisma.archiveEntry.findMany({
      where: { id: { gt: cursor }, artImageId: { not: null } },
      select: { id: true, artImageId: true, extractedMetadata: true },
      orderBy: { id: 'asc' },
      take: BATCH,
    })
    if (!entries.length) break
    cursor = entries[entries.length - 1]!.id

    const imageIds = entries.map((entry) => entry.artImageId as number)
    const seedless = new Set(
      (
        await prisma.artImage.findMany({
          where: { id: { in: imageIds }, seed: null },
          select: { id: true },
        })
      ).map((image) => image.id),
    )

    for (const entry of entries) {
      const imageId = entry.artImageId as number
      if (!seedless.has(imageId)) continue
      scanned += 1

      const seed = seedFromExtractedMetadata(entry.extractedMetadata)
      if (seed === null) {
        stillUnknown += 1
        continue
      }

      recovered += 1
      if (APPLY) {
        await prisma.artImage.update({
          where: { id: imageId },
          data: { seed },
        })
      }
    }

    process.stderr.write(
      `  entry #${cursor}: ${recovered} recoverable, ${stillUnknown} had no ` +
        `seed in their metadata${APPLY ? ' (written)' : ' (dry run)'}\n`,
    )
  }

  process.stderr.write(
    `\n${scanned} archive image(s) had no seed. ` +
      `${recovered} recovered from extractedMetadata, ` +
      `${stillUnknown} genuinely never carried one.\n`,
  )
  if (!APPLY && recovered) {
    process.stderr.write('Nothing was written. Re-run with --apply.\n')
  }
}

main()
  .catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

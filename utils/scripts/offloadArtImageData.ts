// /utils/scripts/offloadArtImageData.ts
//
// Backfill: move existing ArtImage bytes out of the database and onto the
// media share, one row at a time.
//
// WHY THIS EXISTS RATHER THAN THE PRUNER. pruneRedundantArtImageData.ts only
// reclaims rows that ALREADY have a working external copy — it verifies the
// stored imagePath serves byte-identical bytes, then nulls the column. The
// 2026-08-05 measurement showed that population is empty:
//
//   100 KB and over    3791 rows   6131.2 MB
//   under 100 KB        211 rows     16.9 MB
//   empty              2784 rows        0 MB
//   under 512 B           2 rows        0 MB
//
// Every one of the 2,784 "candidates" the pruner examined was an empty string,
// not base64 — `imageData = ''` passes an `IS NOT NULL` filter, which is why
// they were selected and why all of them reported "did not decode". Meanwhile
// the 6.1 GB lives in 3,791 rows that have NO external copy at all, so the
// pruner is structurally unable to touch them. Nothing was wrong with the
// decoder; the prune simply had the wrong population.
//
// So the order is export → link → prune, and this script is the export step,
// generalised past exportPageBackdropArt.ts's single project slug. It shares
// offloadArtImageBytes with the live completion path, so a backfilled row and a
// freshly generated one end up byte-for-byte in the same shape.
//
// Usage (on a host where IMAGES_PATH reaches the share — Vercel cannot):
//   npm run offload:art-images                    # dry run, reports the plan
//   npm run offload:art-images -- --write         # actually move bytes
//   npm run offload:art-images -- --write --limit 25
//   npm run offload:art-images -- --write --min-bytes 100000
//
// Safe to interrupt and safe to re-run: each row is independent, already
// offloaded rows are skipped, and imageData is nulled only after the written
// file is read back and hashed identical. Run OPTIMIZE TABLE ArtImage
// afterwards to return the freed pages to the filesystem.
import 'dotenv/config'
import prisma from './../../server/utils/prisma'
import { offloadArtImageBytes } from './../../server/utils/artImageOffload'

const WRITE = process.argv.includes('--write')

function numericFlag(name: string, fallback: number): number {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  const value = Number(process.argv[index + 1])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

const LIMIT = numericFlag('--limit', 0)

// Default past the empty and near-empty rows: below a few hundred bytes there
// is no image there to move, and the write would cost more than it reclaims.
const MIN_BYTES = numericFlag('--min-bytes', 512)

type Row = { id: number; bytes: number }

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`

async function main() {
  if (!process.env.IMAGES_PATH?.trim()) {
    console.error(
      '❌ IMAGES_PATH is not set, so there is nowhere to move bytes to.\n' +
        '   Run this on the host with the share mounted (see docs/self-hosted-media.md),\n' +
        '   e.g. IMAGES_PATH=/mnt/z/kindrobots/images',
    )
    process.exitCode = 1
    return
  }

  const totals = await prisma.$queryRawUnsafe<{ rowCount: number; bytes: number }[]>(`
    SELECT COUNT(*) AS rowCount, COALESCE(SUM(LENGTH(imageData)), 0) AS bytes
    FROM ArtImage WHERE imageData IS NOT NULL AND LENGTH(imageData) >= ${Math.floor(MIN_BYTES)}
  `)

  const allRows = Number(totals[0]?.rowCount || 0)
  const allBytes = Number(totals[0]?.bytes || 0)

  console.log(
    `ArtImage rows holding at least ${MIN_BYTES} bytes: ${allRows} (${mb(allBytes)})`,
  )
  console.log(`Media root: ${process.env.IMAGES_PATH}`)
  console.log(`Mode: ${WRITE ? 'WRITE — bytes will move' : 'dry run'}\n`)

  /*
   * Ids and lengths only. Selecting imageData here would pull the entire 6 GB
   * corpus over the wire before the first line printed — the same mistake that
   * made the pruner's candidate query look like a hang. offloadArtImageBytes
   * re-reads each blob individually, which is the point.
   *
   * Largest first, so an interrupted run has still reclaimed the most space.
   */
  const rows = await prisma.$queryRawUnsafe<Row[]>(`
    SELECT id, LENGTH(imageData) AS bytes
    FROM ArtImage
    WHERE imageData IS NOT NULL
      AND LENGTH(imageData) >= ${Math.floor(MIN_BYTES)}
      AND (imagePath IS NULL OR imagePath = '' OR imagePath LIKE CONCAT('%/api/art/images/', id, '/file%'))
    ORDER BY LENGTH(imageData) DESC
    ${LIMIT > 0 ? `LIMIT ${Math.floor(LIMIT)}` : ''}
  `)

  const pending = rows.reduce((sum, row) => sum + Number(row.bytes || 0), 0)
  console.log(
    `Rows with no external copy yet: ${rows.length} (${mb(pending)})` +
      `${LIMIT > 0 ? ` — limited to ${LIMIT}` : ''}\n`,
  )

  if (!rows.length) {
    console.log('Nothing to move. Every row of that size already has a file.')
    return
  }

  if (!WRITE) {
    for (const row of rows.slice(0, 10)) {
      console.log(`  WOULD  #${String(row.id).padStart(6)}  ${mb(Number(row.bytes))}`)
    }
    if (rows.length > 10) console.log(`  … and ${rows.length - 10} more`)
    console.log(
      `\nDry run only. Re-run with --write to move ${rows.length} row(s), ${mb(pending)}.`,
    )
    return
  }

  let moved = 0
  let freed = 0
  const failures = new Map<string, number>()

  for (const [index, row] of rows.entries()) {
    const result = await offloadArtImageBytes(row.id)

    if (result.offloaded) {
      moved += 1
      freed += Number(result.bytesFreed || 0)
    } else {
      const reason = result.reason || 'unknown'
      failures.set(reason, (failures.get(reason) || 0) + 1)
    }

    // Progress on one line per 25 rows: a 3,791-row run that prints nothing for
    // twenty minutes is indistinguishable from a hang.
    if ((index + 1) % 25 === 0 || index === rows.length - 1) {
      console.log(
        `  ${index + 1}/${rows.length}  moved ${moved}, freed ${mb(freed)}`,
      )
    }
  }

  console.log(`\nMoved ${moved} row(s), freeing ${mb(freed)} of database storage.`)

  if (failures.size) {
    console.log('Left in the database:')
    for (const [reason, count] of [...failures].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(5)}  ${reason}`)
    }
  }

  console.log(
    '\nRun OPTIMIZE TABLE ArtImage to return the freed pages to the filesystem —\n' +
      'until then the tablespace stays the same size on disk.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

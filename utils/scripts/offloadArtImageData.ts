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
import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import prisma from './../../server/utils/prisma'
import {
  mediaShareRootIsMounted,
  offloadArtImageBytes,
} from './../../server/utils/artImageOffload'

const WRITE = process.argv.includes('--write')

/*
 * Restrict to rows carrying an entity tag — the ones that file under
 * {context}/{slug}/ rather than the landing zone.
 *
 * Added 2026-08-06 after the first --limit 20 run put all twenty in
 * generated/: ordering by size selects the oldest, largest free-generation art,
 * which legitimately has no entity behind it. 1,616 of 4,007 candidates ARE
 * tagged, so "largest first" is simply the wrong sample for checking that
 * filing works. This makes that check possible, and doubles as a way to move
 * the art that matters most before the unclaimed backlog.
 */
const ONLY_TAGGED = process.argv.includes('--only-tagged')

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
  const configuredRoot = process.env.IMAGES_PATH?.trim()

  if (!configuredRoot) {
    console.error(
      '❌ IMAGES_PATH is not set, so there is nowhere to move bytes to.\n' +
        '   Run this on the host with the share mounted (see docs/self-hosted-media.md).\n' +
        '   On the Unraid box:  IMAGES_PATH=/mnt/user/pc/kindrobots/images\n' +
        '   From WSL:           IMAGES_PATH=/mnt/z/kindrobots/images',
    )
    process.exitCode = 1
    return
  }

  const root = resolve(configuredRoot)

  /*
   * Preflight, because this script's whole job is to delete database copies of
   * files it just wrote. A typo'd or unmounted IMAGES_PATH is the one input
   * that turns that into data loss, and it looks like a successful run: mkdir
   * -p creates the wrong directory, every write "succeeds", every read-back
   * matches, and 6 GB of art ends up somewhere nobody serves from.
   *
   * The root must already exist AND already contain files. A share that is
   * mounted has years of images in it; an empty directory at that path means
   * the mount is not there.
   */
  if (!(await mediaShareRootIsMounted(root))) {
    console.error(
      `❌ IMAGES_PATH does not exist as a directory: ${root}\n` +
        '   Refusing to create it — a mistyped path must be a no-op, not 6 GB\n' +
        '   written to the wrong filesystem with the database copies deleted.',
    )
    process.exitCode = 1
    return
  }

  const existing = await readdir(root).catch(() => [] as string[])
  if (!existing.length) {
    console.error(
      `❌ ${root} exists but is empty.\n` +
        '   The real share has thousands of images in it, so an empty directory\n' +
        '   here means it is not mounted. Refusing to run.',
    )
    process.exitCode = 1
    return
  }

  console.log(
    `Share looks mounted: ${root} (${existing.length} entries at the root)`,
  )

  const totals = await prisma.$queryRawUnsafe<{ rowCount: number; bytes: number }[]>(`
    SELECT COUNT(*) AS rowCount, COALESCE(SUM(LENGTH(imageData)), 0) AS bytes
    FROM ArtImage WHERE imageData IS NOT NULL AND LENGTH(imageData) >= ${Math.floor(MIN_BYTES)}
  `)

  const allRows = Number(totals[0]?.rowCount || 0)
  const allBytes = Number(totals[0]?.bytes || 0)

  console.log(
    `ArtImage rows holding at least ${MIN_BYTES} bytes: ${allRows} (${mb(allBytes)})`,
  )
  console.log(`Media root: ${root}`)
  console.log(
    `Mode: ${WRITE ? 'WRITE — bytes will move' : 'dry run'}` +
      `${ONLY_TAGGED ? '  (--only-tagged: entity art only)' : ''}\n`,
  )

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
      ${ONLY_TAGGED ? "AND path LIKE 'entity:%'" : ''}
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
  let filed = 0
  const failures = new Map<string, number>()
  const samples: string[] = []

  for (const [index, row] of rows.entries()) {
    const result = await offloadArtImageBytes(row.id)

    if (result.offloaded) {
      moved += 1
      freed += Number(result.bytesFreed || 0)
      if (result.filed) filed += 1
      // A few real destinations up front, so a mistaken convention is obvious
      // in the first seconds rather than after several thousand files.
      if (samples.length < 8 && result.imagePath) samples.push(result.imagePath)
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

  if (samples.length) {
    console.log('\nWhere they landed:')
    for (const sample of samples) console.log(`   ${sample}`)
  }

  console.log(`\nMoved ${moved} row(s), freeing ${mb(freed)} of database storage.`)
  console.log(
    `   ${filed} filed under {context}/{slug}/, ` +
      `${moved - filed} to the generated/ landing zone (no entity claims them).`,
  )

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

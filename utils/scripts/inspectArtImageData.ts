// /utils/scripts/inspectArtImageData.ts
//
// What is actually stored in ArtImage.imageData?
//
// The prune dry run classified 2784 of 2784 candidates as "stored base64 did
// not decode". A 100% failure rate is not 2784 corrupt rows — `Buffer.from(x,
// 'base64')` only yields an empty buffer when the input contains no valid
// base64 characters at all, which real base64 never is. So the decoder is
// wrong about the column's shape, and guessing at the fix risks writing a
// decoder that "succeeds" on the wrong bytes and then deleting the originals.
//
// This reads a sample and reports what is there, changing nothing.
//
//   npm run inspect:art-image-data
//   npm run inspect:art-image-data -- --limit 12
import 'dotenv/config'
import prisma from './../../server/utils/prisma'

const limitFlag = process.argv.indexOf('--limit')
const LIMIT = limitFlag === -1 ? 6 : Math.max(1, Number(process.argv[limitFlag + 1] || 6))

type Sample = { id: number; len: number | null; head: string | null; tail: string | null }

function classify(head: string): string {
  if (!head.trim()) return 'EMPTY / whitespace only'
  if (head.startsWith('data:')) return `data: URI — prefix "${head.slice(0, head.indexOf(',') + 1)}"`
  if (/^https?:\/\//i.test(head)) return 'a URL, not image bytes'
  if (head.startsWith('/')) return 'a filesystem/served path, not image bytes'
  if (/^(iVBORw0|\/9j\/|UklGR|R0lGOD)/.test(head)) return 'looks like real base64 image bytes'
  if (/^[A-Za-z0-9+/=\s]+$/.test(head)) return 'base64 alphabet, but not a known image magic'
  return 'something else — see the head below'
}

async function main() {
  /*
   * Sampled from the same population the pruner considered: a non-self-
   * referential imagePath and a non-null imageData. Ordered by size descending
   * so the largest rows — the ones that matter for the 6.1 GB — are seen first.
   */
  const rows = await prisma.$queryRawUnsafe<Sample[]>(`
    SELECT id,
           LENGTH(imageData) AS len,
           LEFT(imageData, 80) AS head,
           RIGHT(imageData, 16) AS tail
    FROM ArtImage
    WHERE imageData IS NOT NULL
      AND imagePath IS NOT NULL
      AND imagePath <> ''
      AND imagePath NOT LIKE CONCAT('%/api/art/images/', id, '/file%')
    ORDER BY LENGTH(imageData) DESC
    LIMIT ${Math.floor(LIMIT)}
  `)

  console.log(`Sampled ${rows.length} of the rows the pruner skipped, largest first:\n`)

  for (const row of rows) {
    const head = row.head ?? ''
    console.log(`#${row.id}  ${Number(row.len ?? 0).toLocaleString()} bytes`)
    console.log(`   verdict: ${classify(head)}`)
    console.log(`   head:    ${JSON.stringify(head)}`)
    console.log(`   tail:    ${JSON.stringify(row.tail ?? '')}\n`)
  }

  /*
   * The distribution matters as much as the samples: if most rows are tiny,
   * the 6.1 GB lives somewhere else entirely and the prune target is different
   * from what the totals suggested.
   */
  const buckets = await prisma.$queryRawUnsafe<{ bucket: string; n: number; mb: number }[]>(`
    SELECT CASE
             WHEN LENGTH(imageData) = 0      THEN 'empty'
             WHEN LENGTH(imageData) < 512    THEN 'under 512 B'
             WHEN LENGTH(imageData) < 100000 THEN 'under 100 KB'
             ELSE '100 KB and over'
           END AS bucket,
           COUNT(*) AS n,
           ROUND(SUM(LENGTH(imageData)) / 1048576, 1) AS mb
    FROM ArtImage
    WHERE imageData IS NOT NULL
    GROUP BY bucket
    ORDER BY mb DESC
  `)

  console.log('All rows holding imageData, by size:')
  for (const b of buckets) {
    console.log(`   ${String(b.bucket).padEnd(16)} ${String(Number(b.n)).padStart(6)} rows   ${Number(b.mb)} MB`)
  }

  /*
   * WHERE DID THESE COME FROM? Silas, 2026-08-06: "I am a bit confused about
   * how we seem to still have the art data in the db when we have been
   * generating art on our box, then moving it with our kr_relay. So where are
   * these data sets coming from? Were they old ones that never got saved
   * locally? Or duplicate data that already probably has a local file that we
   * never connected?"
   *
   * The code answers half of it: /api/art/save-generated — the relay's upload
   * hop — contains no reference to imagePath at all, and complete.post.ts only
   * ever sets imagePath to null. So the relay CANNOT have linked a local file,
   * and every relayed image is base64-in-database by construction.
   *
   * What the code cannot say is whether that is old history or still
   * happening. Grouping the heavy rows by month settles it: a tail that stops
   * a year ago is a migration leftover, and one that reaches this month means
   * the pipeline is still filling the column today.
   */
  const byMonth = await prisma.$queryRawUnsafe<
    { month: string; n: number; mb: number; withPath: number }[]
  >(`
    SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
           COUNT(*) AS n,
           ROUND(SUM(LENGTH(imageData)) / 1048576, 1) AS mb,
           SUM(CASE WHEN imagePath IS NOT NULL AND imagePath <> '' THEN 1 ELSE 0 END) AS withPath
    FROM ArtImage
    WHERE imageData IS NOT NULL AND LENGTH(imageData) >= 100000
    GROUP BY month
    ORDER BY month DESC
    LIMIT 18
  `)

  console.log('\nRows holding 100 KB+, by month created (newest first):')
  console.log('   month     rows       MB   with imagePath')
  for (const m of byMonth) {
    console.log(
      `   ${String(m.month).padEnd(9)} ${String(Number(m.n)).padStart(4)} ${String(Number(m.mb)).padStart(8)} ` +
        `${String(Number(m.withPath)).padStart(8)}`,
    )
  }

  /*
   * serverName is stamped by save-generated from the resolved Server record,
   * so it says which box actually rendered these — the clearest signal for
   * "is this the relay's output or something older".
   */
  const byServer = await prisma.$queryRawUnsafe<
    { serverName: string | null; n: number; mb: number }[]
  >(`
    SELECT COALESCE(serverName, '(none recorded)') AS serverName,
           COUNT(*) AS n,
           ROUND(SUM(LENGTH(imageData)) / 1048576, 1) AS mb
    FROM ArtImage
    WHERE imageData IS NOT NULL AND LENGTH(imageData) >= 100000
    GROUP BY serverName
    ORDER BY mb DESC
    LIMIT 12
  `)

  console.log('\nRows holding 100 KB+, by generating server:')
  for (const s of byServer) {
    console.log(
      `   ${String(s.serverName).padEnd(28)} ${String(Number(s.n)).padStart(5)} rows   ${Number(s.mb)} MB`,
    )
  }

  /*
   * fileName and path are the only other place a local filename could have
   * been recorded. If these are populated with something file-like, a twin may
   * exist on disk under that name and could in principle be reconnected
   * instead of re-exported.
   */
  const naming = await prisma.$queryRawUnsafe<
    { hasFileName: number; hasPath: number; sampleFileName: string | null; samplePath: string | null }[]
  >(`
    SELECT SUM(CASE WHEN fileName IS NOT NULL AND fileName <> '' THEN 1 ELSE 0 END) AS hasFileName,
           SUM(CASE WHEN path IS NOT NULL AND path <> '' THEN 1 ELSE 0 END) AS hasPath,
           MAX(fileName) AS sampleFileName,
           MAX(path) AS samplePath
    FROM ArtImage
    WHERE imageData IS NOT NULL AND LENGTH(imageData) >= 100000
  `)

  const n = naming[0]
  console.log('\nCould these be reconnected to an existing file instead of re-exported?')
  console.log(`   rows with a fileName: ${Number(n?.hasFileName || 0)}   e.g. ${JSON.stringify(n?.sampleFileName ?? null)}`)
  console.log(`   rows with a path:     ${Number(n?.hasPath || 0)}   e.g. ${JSON.stringify(n?.samplePath ?? null)}`)
  console.log(
    '   (A bare "ArtImageUpload-<timestamp>" is not a file on the share — it is\n' +
      '    the placeholder saveImage() invents. Only a real relative path could be\n' +
      '    reconnected.)',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

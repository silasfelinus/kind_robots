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
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

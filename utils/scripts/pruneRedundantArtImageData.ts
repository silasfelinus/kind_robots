// /utils/scripts/pruneRedundantArtImageData.ts
//
// Drop base64 ArtImage.imageData only when the exact stored imagePath serves
// bytes identical to the database copy.
//
// Silas, 2026-08-05: "If an image has a local imagePath, we don't need the
// base64 data in the database and I approve field deleted."
//
// Usage:
//   npm run prune:art-image-data                 # dry run
//   npm run prune:art-image-data -- --limit 50   # verify a small sample
//   npm run prune:art-image-data -- --write      # null verified rows
//
// Dry run is the default. The write path is deliberately row-specific: it
// deletes only while imagePath still equals the exact value that was fetched.
import 'dotenv/config'
import { createHash } from 'node:crypto'
import prisma from './../../server/utils/prisma'

const WRITE = process.argv.includes('--write')
const limitFlag = process.argv.indexOf('--limit')
const LIMIT = limitFlag === -1 ? 0 : Number(process.argv[limitFlag + 1] || 0)

const BASE = (process.env.PRUNE_VERIFY_BASE || 'https://kindrobots.org').replace(
  /\/+$/,
  '',
)
const CONCURRENCY = 6
const TIMEOUT_MS = 20_000

type Row = {
  id: number
  imagePath: string
  bytes: number
}

type Verdict =
  | 'prune'
  | 'skip-not-image'
  | 'skip-missing'
  | 'skip-self-reference'
  | 'skip-byte-mismatch'
  | 'skip-empty-column'
  | 'skip-invalid-data'
  | 'skip-error'

type Checked = { row: Row; verdict: Verdict; detail: string }

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

function isSelfReference(url: string, id: number): boolean {
  try {
    return new URL(url).pathname.includes(`/api/art/images/${id}/file`)
  } catch {
    return true
  }
}

function decodeStoredImage(imageData: string): Buffer | null {
  const comma = imageData.indexOf(',')
  const payload = comma >= 0 ? imageData.slice(comma + 1) : imageData
  if (!payload.trim()) return null

  try {
    const decoded = Buffer.from(payload, 'base64')
    return decoded.length ? decoded : null
  } catch {
    return null
  }
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function verify(row: Row): Promise<{ verdict: Verdict; detail: string }> {
  const url = resolveUrl(row.imagePath)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { accept: 'image/*,*/*' },
    })

    if (res.status === 404) return { verdict: 'skip-missing', detail: '404' }
    if (!res.ok) return { verdict: 'skip-error', detail: `HTTP ${res.status}` }

    if (isSelfReference(res.url, row.id)) {
      return {
        verdict: 'skip-self-reference',
        detail: `redirected to same ArtImage endpoint: ${res.url}`,
      }
    }

    const type = (res.headers.get('content-type') || '').toLowerCase()
    if (!type.startsWith('image/')) {
      return {
        verdict: 'skip-not-image',
        detail: `HTTP ${res.status} but ${type || 'no content-type'}`,
      }
    }

    const servedBytes = new Uint8Array(await res.arrayBuffer())

    /*
     * The stored blob is loaded HERE, one row at a time, and only for rows that
     * already look prunable.
     *
     * Selecting imageData in the candidate query instead pulled every base64
     * blob in the table before printing a single line — on a corpus where one
     * card is ~500KB, that is gigabytes over the wire and looks exactly like a
     * hang. A dry run whose first job is to report a size must not read the
     * whole thing to do it.
     */
    const stored = await prisma.artImage.findUnique({
      where: { id: row.id },
      select: { imageData: true },
    })
    /*
     * An empty column is NOT a decode failure, and conflating them cost a
     * session. The first dry run reported "stored base64 did not decode" for
     * 2784 of 2784 candidates, which reads as mass corruption; the rows were
     * simply `imageData = ''`, which passes the candidate query's
     * `IS NOT NULL` filter and then fails a truthiness check. There was
     * nothing to prune and nothing wrong with the decoder.
     */
    if (!stored?.imageData) {
      return { verdict: 'skip-empty-column', detail: 'imageData is NULL' }
    }
    if (!stored.imageData.trim()) {
      return {
        verdict: 'skip-empty-column',
        detail: 'imageData is an empty string — no bytes to reclaim',
      }
    }

    const storedBytes = decodeStoredImage(stored.imageData)
    if (!storedBytes) {
      return { verdict: 'skip-invalid-data', detail: 'stored base64 did not decode' }
    }

    const storedDigest = digest(storedBytes)
    const servedDigest = digest(servedBytes)
    if (storedDigest !== servedDigest) {
      return {
        verdict: 'skip-byte-mismatch',
        detail: `sha256 mismatch (${storedBytes.length} stored, ${servedBytes.length} served)`,
      }
    }

    return {
      verdict: 'prune',
      detail: `${type}; sha256 ${storedDigest.slice(0, 12)}`,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { verdict: 'skip-error', detail: message.slice(0, 120) }
  } finally {
    clearTimeout(timer)
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++
        results[index] = await fn(items[index] as T)
      }
    }),
  )

  return results
}

async function main() {
  /*
   * `rowCount`, not `rows`: ROWS is a reserved word in MariaDB 10.6+ (FETCH
   * FIRST n ROWS / LIMIT ROWS EXAMINED), so `COUNT(*) AS rows` is a syntax
   * error rather than a shadowing warning. This repo already has a contract for
   * the table-identifier form of the same mistake
   * (test:no-unquoted-reserved-word-tables); column aliases need the same care.
   */
  const totals = await prisma.$queryRawUnsafe<{ rowCount: number; bytes: number }[]>(`
    SELECT COUNT(*) AS rowCount, COALESCE(SUM(LENGTH(imageData)), 0) AS bytes
    FROM ArtImage WHERE imageData IS NOT NULL
  `)
  const allRows = Number(totals[0]?.rowCount || 0)
  const allBytes = Number(totals[0]?.bytes || 0)
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`

  console.log(
    `ArtImage rows holding base64: ${allRows} (${mb(allBytes)} total)`,
  )
  console.log('Selecting candidates...')

  const candidates = await prisma.$queryRawUnsafe<Row[]>(`
    SELECT id, imagePath, LENGTH(imageData) AS bytes
    FROM ArtImage
    WHERE imageData IS NOT NULL
      AND imagePath IS NOT NULL
      AND imagePath <> ''
      AND imagePath NOT LIKE CONCAT('%/api/art/images/', id, '/file%')
    ORDER BY LENGTH(imageData) DESC
    ${LIMIT > 0 ? `LIMIT ${Math.floor(LIMIT)}` : ''}
  `)

  console.log(
    `Candidates with a non-self-referential imagePath: ${candidates.length}` +
      `${LIMIT > 0 ? ` (limited to ${LIMIT})` : ''}\n` +
      `Verifying exact byte identity against ${BASE}...\n`,
  )

  const checked = await mapLimit<Row, Checked>(candidates, CONCURRENCY, async (row) => ({
    row,
    ...(await verify(row)),
  }))

  const prunable = checked.filter((entry) => entry.verdict === 'prune')
  const skipped = checked.filter((entry) => entry.verdict !== 'prune')
  const reclaimable = prunable.reduce(
    (sum, entry) => sum + Number(entry.row.bytes || 0),
    0,
  )

  for (const entry of skipped) {
    console.log(
      `  SKIP  #${String(entry.row.id).padStart(6)}  ${entry.verdict.padEnd(21)} ` +
        `${entry.detail}  ${entry.row.imagePath}`,
    )
  }

  console.log(
    `\nByte-identical external copies: ${prunable.length} row(s), ${mb(reclaimable)} reclaimable.\n` +
      `Skipped (database bytes kept): ${skipped.length}`,
  )

  if (!WRITE) {
    console.log(`\nDry run only. Re-run with --write to null ${prunable.length} row(s).`)
    return
  }

  if (!prunable.length) {
    console.log('\nNothing verified prunable; no writes performed.')
    return
  }

  let done = 0
  let raced = 0
  for (const entry of prunable) {
    const result = await prisma.artImage.updateMany({
      where: {
        id: entry.row.id,
        imagePath: entry.row.imagePath,
        imageData: { not: null },
      },
      data: { imageData: null },
    })

    if (result.count === 1) done += 1
    else raced += 1
  }

  console.log(`\nCleared base64 from ${done} row(s).`)
  if (raced) {
    console.log(
      `Kept ${raced} row(s) because imagePath or imageData changed after verification.`,
    )
  }
  console.log(
    'Run OPTIMIZE TABLE ArtImage separately to return free space to the filesystem.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

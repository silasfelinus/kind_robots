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

const BASE = (process.env.PRUNE_VERIFY_BASE || 'https://kind-robots.vercel.app').replace(
  /\/+$/,
  '',
)
const CONCURRENCY = 6
const TIMEOUT_MS = 20_000

type Row = {
  id: number
  imagePath: string
  imageData: string
  bytes: number
}

type Verdict =
  | 'prune'
  | 'skip-not-image'
  | 'skip-missing'
  | 'skip-self-reference'
  | 'skip-byte-mismatch'
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
    const storedBytes = decodeStoredImage(row.imageData)
    if (!storedBytes) {
      return { verdict: 'skip-invalid-data', detail: 'stored base64 did not decode' }
    }

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
  const candidates = await prisma.$queryRawUnsafe<Row[]>(`
    SELECT id, imagePath, imageData, LENGTH(imageData) AS bytes
    FROM ArtImage
    WHERE imageData IS NOT NULL
      AND imagePath IS NOT NULL
      AND imagePath <> ''
      AND imagePath NOT LIKE CONCAT('%/api/art/images/', id, '/file%')
    ORDER BY LENGTH(imageData) DESC
    ${LIMIT > 0 ? `LIMIT ${Math.floor(LIMIT)}` : ''}
  `)

  const totals = await prisma.$queryRawUnsafe<{ rows: number; bytes: number }[]>(`
    SELECT COUNT(*) AS rows, COALESCE(SUM(LENGTH(imageData)), 0) AS bytes
    FROM ArtImage WHERE imageData IS NOT NULL
  `)
  const allRows = Number(totals[0]?.rows || 0)
  const allBytes = Number(totals[0]?.bytes || 0)
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`

  console.log(
    `ArtImage rows holding base64: ${allRows} (${mb(allBytes)} total)\n` +
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

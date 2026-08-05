// /utils/scripts/pruneRedundantArtImageData.ts
//
// Drop base64 ArtImage.imageData for rows whose art is PROVEN to be served
// from somewhere else.
//
// Silas, 2026-08-05: "If an image has a local imagePath, we don't need the
// base64 data in the database and I approve field deleted."
//
// Usage:
//   npm run prune:art-image-data                 # dry run, verifies nothing is lost
//   npm run prune:art-image-data -- --limit 50   # verify a small sample first
//   npm run prune:art-image-data -- --write      # actually null the column
//
// WHY THIS IS SAFE TO SERVE. file.get.ts already redirects to `imagePath`
// before it ever looks at `imageData`:
//
//     if (image.imagePath && !image.imagePath.includes(`/api/art/images/${id}/file`))
//       return sendRedirect(event, image.imagePath, 302)
//
// So for a row with a usable imagePath, the base64 is already unreachable
// weight. Removing it changes no response.
//
// ── THE TWO WAYS THIS COULD DESTROY ART, AND WHAT STOPS THEM ──────────────
//
// 1. SELF-REFERENTIAL PATHS. dailyDreamArchiveStore writes
//    `imagePath = /api/art/images/<id>/file?v=<ts>` — the row pointing at its
//    own endpoint. The redirect guard deliberately skips those (it would loop),
//    so they DO fall through to imageData. Null them and the image is gone.
//    Excluded below by the same substring test the endpoint uses, so the two
//    can never disagree.
//
// 2. A PATH THAT IS NOT ACTUALLY A FILE. This is the one that matters, and it
//    has already happened here: 214 of 227 Reward.imagePath values pointed at
//    `/rewards/...` when the files live at `/images/rewards/...`, and every one
//    served a 142 KB Nuxt app shell as text/html at HTTP **200** — because a
//    missing path does not 404, it falls through to the SPA catch-all
//    (kind_robots #1446, which is why verifyStoredArtPaths.ts exists).
//
//    A status check would have called all 214 healthy and this script would
//    have deleted the only copy of each. So a row is only pruned when its path
//    returns 2xx AND a content-type of image/*. Anything else — 404, HTML, a
//    redirect to HTML, a timeout — is reported and SKIPPED, never pruned.
//
// The media origin is the backup. That is exactly why the bytes are verified
// present there before the database copy goes.
import 'dotenv/config'
import prisma from './../../server/utils/prisma'

const WRITE = process.argv.includes('--write')
const limitFlag = process.argv.indexOf('--limit')
const LIMIT = limitFlag === -1 ? 0 : Number(process.argv[limitFlag + 1] || 0)

// Verify against the deployment, not the media host directly: a stored path may
// be relative, and the app's redirects are part of what makes it resolvable.
const BASE = (process.env.PRUNE_VERIFY_BASE || 'https://kind-robots.vercel.app')
  .replace(/\/+$/, '')

const CONCURRENCY = 6
const TIMEOUT_MS = 20_000

type Row = { id: number; imagePath: string | null; bytes: number }
type Verdict = 'prune' | 'skip-not-image' | 'skip-missing' | 'skip-error'
type Checked = { row: Row; verdict: Verdict; detail: string }

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

async function verify(path: string): Promise<{ verdict: Verdict; detail: string }> {
  const url = resolveUrl(path)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // GET, not HEAD: the SPA catch-all that caused #1446 answers HEAD just as
    // convincingly as it answers GET. The body's content-type is the evidence.
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { accept: 'image/*,*/*' },
    })

    if (res.status === 404) return { verdict: 'skip-missing', detail: '404' }
    if (!res.ok) return { verdict: 'skip-error', detail: `HTTP ${res.status}` }

    const type = (res.headers.get('content-type') || '').toLowerCase()
    if (!type.startsWith('image/')) {
      // The #1446 signature: HTTP 200, text/html, an app shell.
      return { verdict: 'skip-not-image', detail: `200 but ${type || 'no content-type'}` }
    }

    return { verdict: 'prune', detail: type }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { verdict: 'skip-error', detail: message.slice(0, 60) }
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
   * Candidates are exactly the rows the serving endpoint would never read
   * imageData for. The self-reference test mirrors file.get.ts character for
   * character — if that guard ever changes, this must change with it, or this
   * script starts deleting bytes the endpoint still needs.
   */
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
      `Verifying each against ${BASE} before pruning anything...\n`,
  )

  const checked: Checked[] = await mapLimit<Row, Checked>(
    candidates,
    CONCURRENCY,
    async (row) => ({ row, ...(await verify(row.imagePath as string)) }),
  )

  const prunable = checked.filter((c) => c.verdict === 'prune')
  const skipped = checked.filter((c) => c.verdict !== 'prune')
  const reclaimable = prunable.reduce((sum, c) => sum + Number(c.row.bytes || 0), 0)

  for (const s of skipped) {
    console.log(
      `  SKIP  #${String(s.row.id).padStart(6)}  ${s.verdict.padEnd(15)} ` +
        `${s.detail.padEnd(28)} ${s.row.imagePath}`,
    )
  }

  console.log(
    `\nVerified served elsewhere: ${prunable.length} row(s), ${mb(reclaimable)} reclaimable.\n` +
      `Skipped (bytes KEPT — these rows are the only copy): ${skipped.length}`,
  )

  const notImage = skipped.filter((s) => s.verdict === 'skip-not-image').length
  if (notImage) {
    console.log(
      `\n  ${notImage} path(s) returned HTTP 200 with a non-image body. That is the\n` +
        `  #1446 signature — a broken path served as the app shell. Their base64 was\n` +
        `  NOT touched, and those paths need repairing before their bytes can go.`,
    )
  }

  if (!WRITE) {
    console.log(`\nDry run only. Re-run with --write to null ${prunable.length} row(s).`)
    return
  }

  if (!prunable.length) {
    console.log('\nNothing verified prunable; no writes performed.')
    return
  }

  // Chunked so one enormous UPDATE cannot hold a long transaction against the
  // shared ProxySQL pool this repo keeps saturating.
  const CHUNK = 200
  let done = 0
  for (let i = 0; i < prunable.length; i += CHUNK) {
    const ids = prunable.slice(i, i + CHUNK).map((c) => c.row.id)
    await prisma.artImage.updateMany({
      where: { id: { in: ids } },
      data: { imageData: null },
    })
    done += ids.length
    console.log(`  pruned ${done}/${prunable.length}`)
  }

  console.log(`\nCleared base64 from ${done} row(s), reclaiming ${mb(reclaimable)}.`)
  console.log(
    'Run OPTIMIZE TABLE ArtImage separately to return the space to the ' +
      'filesystem — MariaDB keeps it in the tablespace until then.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

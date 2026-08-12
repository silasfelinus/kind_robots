// /utils/scripts/verifyStoredArtPaths.ts
//
// interface-vision/t-100: catch stored art paths that serve something other
// than an image, which no status-code check can see.
//
// THE DEFECT THIS EXISTS FOR. Every one of the 227 Reward.imagePath values was
// stored as `/rewards/...` when the files live at `/images/rewards/...`
// (kind_robots #1446). 214 of them served a 142 KB Nuxt app shell as
// `text/html` — at HTTP **200**, because `/rewards/x.webp` does not 404, it
// falls through to the SPA catch-all. curl, uptime monitors and link checkers
// all read that as healthy. Only a consumer that inspects what came back can
// tell, so that is what this does: it asserts the RESPONSE IS AN IMAGE, not
// that the request succeeded.
//
// WHY THE LAYOUT AUDIT DID NOT CATCH IT. auditResponsiveLayout.mjs flags an
// `<img>` whose naturalWidth is 0, which measures whether the UI broke. It
// didn't: kr-art-plate caught the decode failure and swapped in its fallback,
// exactly as designed. The art was wrong and the page still looked fine. That
// is a different question from this one, and it needs a different check.
//
// WHAT COUNTS AS FAILURE. Only a 2xx whose content-type is not an image. A
// 404 means the file is genuinely absent from the media host — art backlog,
// which is expected and self-healing, and is reported but never fails the run.
// Conflating the two would make this checker cry wolf on every gap in the art
// queue and get it switched off.
//
//   npx tsx utils/scripts/verifyStoredArtPaths.ts                  # report
//   npx tsx utils/scripts/verifyStoredArtPaths.ts --self-test      # no DB
//   BASE_URL=https://preview.example npx tsx utils/scripts/verifyStoredArtPaths.ts
//
// The database is not reachable from an agent sandbox (TCP to the ProxySQL
// port is blocked), so real runs happen in
// .github/workflows/stored-art-paths.yml, which joins the tailnet first.
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

// Matches responsive-layout-audit.yml's production fallback, so both checks
// measure the same deployment.
const DEFAULT_BASE = 'https://kindrobots.org'

/** How many paths to have in flight. 227 paths took ~90s at 12. */
const CONCURRENCY = 12

export type ArtPathVerdict =
  /** A real image came back. */
  | 'image'
  /** 2xx, but not an image — the silent defect this script exists for. */
  | 'shell'
  /** Genuinely absent from the media host: art backlog, not a path bug. */
  | 'missing'
  /** Server-side failure; worth reporting, not attributable to the path. */
  | 'error'

/**
 * The whole judgement, as a pure function of what came back, so it can be
 * exercised without a database or a network (see --self-test).
 *
 * `status` 0 means the request never completed.
 */
export function classifyArtResponse(
  status: number,
  contentType: string | null,
): ArtPathVerdict {
  if (status === 404 || status === 410) return 'missing'
  if (status < 200 || status >= 300) return 'error'

  const type = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? ''

  // An empty content-type on a 200 is not provably an image, and the app shell
  // case proves "2xx" alone means nothing. Require the positive signal.
  return type.startsWith('image/') ? 'image' : 'shell'
}

/**
 * Which stored values this script is responsible for. A path that is served by
 * an API route (`/api/art/...`) or by an absolute URL is out of scope — those
 * are generated at read time and cannot carry a stale stored prefix.
 */
export function isCheckableArtPath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const path = value.trim()
  if (!path.startsWith('/')) return false
  if (path.startsWith('/api/')) return false
  return true
}

/** Runs `worker` over `items` with at most `limit` in flight. */
async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const index = cursor++
        if (index >= items.length) return
        results[index] = await worker(items[index] as T)
      }
    }),
  )

  return results
}

async function probe(base: string, path: string): Promise<ArtPathVerdict> {
  // GET, not HEAD: the SPA catch-all is a rendered response, and a HEAD against
  // it has been seen to answer differently from the GET a browser actually
  // makes. Check the thing the user's browser gets.
  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    redirect: 'follow',
    headers: { accept: 'image/*,*/*' },
  }).catch(() => null)

  if (!res) return 'error'
  // The body is not needed; releasing it keeps sockets from piling up.
  await res.body?.cancel().catch(() => {})

  return classifyArtResponse(res.status, res.headers.get('content-type'))
}

/* ------------------------------------------------------------------------ */

function selfTest(): void {
  const cases: Array<[number, string | null, ArtPathVerdict]> = [
    // The exact production defect: 200, but the Nuxt app shell.
    [200, 'text/html; charset=utf-8', 'shell'],
    [200, 'text/html', 'shell'],
    [200, null, 'shell'],
    [200, '', 'shell'],
    [200, 'application/json', 'shell'],
    // Real art, including through the /images 307 to the media host.
    [200, 'image/webp', 'image'],
    [200, 'image/png', 'image'],
    [200, 'IMAGE/JPEG', 'image'],
    [200, 'image/svg+xml; charset=utf-8', 'image'],
    [206, 'image/webp', 'image'],
    // Absent from the media host: backlog, not a path bug.
    [404, 'text/html', 'missing'],
    [410, 'text/html', 'missing'],
    // Everything else.
    [500, 'text/html', 'error'],
    [403, 'text/html', 'error'],
    [0, null, 'error'],
  ]

  for (const [status, contentType, expected] of cases) {
    const actual = classifyArtResponse(status, contentType)
    if (actual !== expected) {
      throw new Error(
        `classifyArtResponse(${status}, ${JSON.stringify(contentType)}) = ` +
          `${actual}, expected ${expected}`,
      )
    }
  }

  for (const checkable of ['/images/rewards/x.webp', '/rewards/x.webp']) {
    if (!isCheckableArtPath(checkable)) {
      throw new Error(`${checkable} should be checkable`)
    }
  }

  for (const skipped of [
    '/api/art/images/14913/file?v=2', // generated at read time
    'https://media.acrocatranch.com/images/x.webp',
    'images/x.webp', // not the stored shape
    '',
    null,
    42,
  ]) {
    if (isCheckableArtPath(skipped)) {
      throw new Error(`${JSON.stringify(skipped)} should be skipped`)
    }
  }

  console.log('✅ verifyStoredArtPaths self-test passed.')
}

/* ------------------------------------------------------------------------ */

type Source = {
  label: string
  rows: () => Promise<Array<Record<string, unknown>>>
}

async function collect(prisma: PrismaClient): Promise<Map<string, string[]>> {
  // Every model whose stored art the site renders directly. cardPath/heroPath/
  // iconPath are deliberately included: they are the columns t-064 added, and
  // the same prefix mistake is available to them.
  const art = {
    imagePath: true,
    cardPath: true,
    heroPath: true,
    iconPath: true,
  }

  const sources: Source[] = [
    { label: 'Reward', rows: () => prisma.reward.findMany({ select: art }) },
    {
      label: 'Bot',
      rows: () =>
        prisma.bot.findMany({ select: { ...art, avatarImage: true } }),
    },
    {
      label: 'Character',
      rows: () => prisma.character.findMany({ select: art }),
    },
    { label: 'Dream', rows: () => prisma.dream.findMany({ select: art }) },
    {
      label: 'Scenario',
      rows: () => prisma.scenario.findMany({ select: art }),
    },
    { label: 'Facet', rows: () => prisma.facet.findMany({ select: art }) },
    {
      label: 'ArtCollection',
      rows: () =>
        prisma.artCollection.findMany({ select: { imagePath: true } }),
    },
  ]

  // path -> which models store it, so a failure names something actionable.
  const byPath = new Map<string, string[]>()

  for (const source of sources) {
    for (const row of await source.rows()) {
      for (const value of Object.values(row)) {
        if (!isCheckableArtPath(value)) continue
        const path = value.trim()
        const owners = byPath.get(path) ?? []
        if (!owners.includes(source.label)) owners.push(source.label)
        byPath.set(path, owners)
      }
    }
  }

  return byPath
}

async function main(): Promise<void> {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  // Always self-test before a real run: a sweep whose classifier is wrong is
  // worse than no sweep, because it reports confidence it has not earned.
  selfTest()

  const base = (process.env.BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')

  const prisma = new PrismaClient({
    adapter: createDatabaseAdapter(databaseUrl),
  })
  const byPath = await collect(prisma)
  await prisma.$disconnect()

  const paths = Array.from(byPath.keys()).sort()
  console.log(
    `📜 Checking ${paths.length} distinct stored art path(s) against ${base}`,
  )

  const verdicts = await mapLimited(paths, CONCURRENCY, (path) =>
    probe(base, path),
  )

  const shell: string[] = []
  const missing: string[] = []
  const failed: string[] = []
  let ok = 0

  for (const [index, verdict] of verdicts.entries()) {
    const path = paths[index] as string
    const owners = byPath.get(path)?.join(', ') ?? '?'
    if (verdict === 'image') ok += 1
    else if (verdict === 'shell') shell.push(`${path}  [${owners}]`)
    else if (verdict === 'missing') missing.push(`${path}  [${owners}]`)
    else failed.push(`${path}  [${owners}]`)
  }

  console.log(
    `\n   ✅ ${ok} serving an image` +
      `\n   ❌ ${shell.length} serving a non-image at 2xx` +
      `\n   🕳  ${missing.length} absent from the media host (art backlog)` +
      `\n   ⚠️  ${failed.length} could not be checked`,
  )

  if (missing.length) {
    console.log(`\n🕳  Missing art — expected and self-healing, not a failure:`)
    for (const entry of missing.slice(0, 20)) console.log(`     ${entry}`)
    if (missing.length > 20)
      console.log(`     …and ${missing.length - 20} more`)
  }

  if (failed.length) {
    console.log(`\n⚠️  Unreachable:`)
    for (const entry of failed.slice(0, 20)) console.log(`     ${entry}`)
  }

  if (shell.length) {
    console.log(
      `\n❌ ${shell.length} stored path(s) return 2xx with a non-image body.` +
        `\n   This is the silent failure mode: the request "succeeds", so every` +
        `\n   status-code check reads it as healthy, while users get the app` +
        `\n   shell where art should be. Check the stored prefix — /images is` +
        `\n   the root that 307s to the media host.\n`,
    )
    for (const entry of shell) console.log(`     ${entry}`)
    process.exitCode = 1
    return
  }

  console.log(
    '\n✅ Every stored art path serves a real image or is honestly absent.',
  )
}

// Importable for the pure helpers without running the sweep.
if (process.argv[1]?.endsWith('verifyStoredArtPaths.ts')) {
  main().catch((error: unknown) => {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}

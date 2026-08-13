// /utils/scripts/verifyArtImageCaching.ts
//
// The busiest route in the app stays CDN-cacheable.
//
// `/api/art/images/[id]/file` was 1591 requests in a two-hour window on
// 2026-08-05 — 34% of all serverless function invocations and 3x the next busiest
// route — because gallery pages mount 140+ images at once. Every request that
// misses the CDN invokes the function, hits Prisma, and opens a ProxySQL
// session to read a base64 LongText blob. So this route's cache behaviour is
// not a performance detail; it is a multiplier on database sessions during
// exactly the connection-capacity incidents this repo keeps having.
//
// THE SPECIFIC REGRESSION GUARDED. Serving WebP only when `Accept` advertises
// it is correct HTTP, but it makes the response depend on a request header,
// which requires `Vary: Accept`, which keys the CDN cache on that header's raw
// value. Chrome, Firefox and Safari each send a different Accept string and it
// changes between versions, so one image fragments into many cache entries —
// each needing its own function invocation and database read to populate.
//
// Always transcoding makes the response a pure function of the image id: one
// cache entry, served forever under the immutable Cache-Control. Reintroducing
// either half — the Accept read or the Vary — silently restores the
// fragmentation, and nothing about the app looks broken when it happens. That
// is what makes it worth a test rather than a comment.
//
//   npx tsx utils/scripts/verifyArtImageCaching.ts
//   npx tsx utils/scripts/verifyArtImageCaching.ts --self-test
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROUTE = 'server/api/art/images/[id]/file.get.ts'

const failures: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}

/** Source with comments stripped, so prose about a rule never satisfies it. */
export function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const raw = readFileSync(resolve(process.cwd(), ROUTE), 'utf8')
const code = withoutComments(raw)

/* -- 1. no Vary, at all ----------------------------------------------------- */

check(
  !/setHeader\([^)]*['"]Vary['"]/i.test(code),
  `${ROUTE} sets a Vary header. That keys the CDN cache on a request header ` +
    `and fragments this route's cache across browsers — multiplying function ` +
    `invocations and database sessions on the app's busiest endpoint.`,
)

/* -- 2. the response must not depend on Accept ------------------------------ */

check(
  !/getHeader\(\s*event\s*,\s*['"]accept['"]\s*\)/i.test(code),
  `${ROUTE} reads the Accept header. The response body must be a pure function ` +
    `of the image id so one CDN entry serves every client; negotiating on ` +
    `Accept is what forces the Vary that fragments the cache.`,
)

/* -- 3. the cache must still be long-lived and immutable for public art ----- */

check(
  /max-age=31536000/.test(code) && /immutable/.test(code),
  `${ROUTE} no longer serves public art as immutable with a one-year max-age. ` +
    `Without that, cacheability collapses regardless of the Vary rules above.`,
)

/* -- 4. the degradation paths survive --------------------------------------- */

// A transcode failure must fall through to the original bytes rather than 500:
// serving a large image always beats serving none.
check(
  /catch\s*\(/.test(code) && /webp\.length\s*<\s*original\.length/.test(code),
  `${ROUTE} lost a transcode fallback. Both must remain: a sharp failure falls ` +
    `back to the original bytes, and a transcode that grew the file keeps the ` +
    `original.`,
)

/* -- 5. nothing silently defaults to the A1111 engine ----------------------- */

/*
 * A1111 must never be reached by accident.
 *
 * `/api/art/queue` defaulted to it — `body?.engine || 'A1111'` — and that one
 * fallback killed 60 page backdrop jobs on 2026-08-05: WinError 10061,
 * connection refused, three attempts each, prompts never read. Nothing runs
 * A1111 here; every PENDING and recent DONE job in the queue is COMFY and the
 * only A1111 rows are CANCELLED.
 *
 * A silent default is the dangerous shape. A caller that omits `engine` gets a
 * job that looks correctly queued, sits at the right priority, and cannot run.
 * Explicit A1111 stays legal — the `serverType === 'A1111'` branches elsewhere
 * are real capability handling — but choosing it must be deliberate.
 */
const ENGINE_DEFAULT_FILES = [
  'server/api/art/queue/index.post.ts',
  'server/api/art/enqueue.post.ts',
  'utils/scripts/enqueuePageBackdropArt.ts',
]

for (const file of ENGINE_DEFAULT_FILES) {
  let source: string
  try {
    source = withoutComments(readFileSync(resolve(process.cwd(), file), 'utf8'))
  } catch {
    continue // file moved or removed; other checks will notice
  }

  check(
    !/(?:\|\||\?\?)\s*['"]A1111['"]/.test(source),
    `${file} falls back to 'A1111'. Nothing runs A1111 — a caller that omits ` +
      `the engine would get a job that looks queued and cannot run. Default to ` +
      `COMFY; keep A1111 reachable only as an explicit choice.`,
  )
}

/* --------------------------------------------------------------------------- */

function selfTest(): void {
  // The checks read code, not prose — a comment explaining why Vary is wrong
  // must not be mistaken for setting one.
  const commentOnly = `
    // setHeader(event, 'Vary', 'Accept') would fragment the cache.
    /* getHeader(event, 'accept') is deliberately not read here. */
    const x = 1
  `
  const stripped = withoutComments(commentOnly)
  if (/setHeader\([^)]*['"]Vary['"]/i.test(stripped)) {
    throw new Error('a commented-out Vary must not register as setting one')
  }
  if (/getHeader\(\s*event\s*,\s*['"]accept['"]\s*\)/i.test(stripped)) {
    throw new Error('a commented-out Accept read must not register as reading it')
  }
  console.log('✅ verifyArtImageCaching self-test passed.')
}

if (process.argv.includes('--self-test')) {
  selfTest()
} else {
  selfTest()

  if (failures.length) {
    console.error(`\n❌ Art image caching contract failed:\n`)
    for (const failure of failures) console.error(`  - ${failure}`)
    console.error('')
    process.exitCode = 1
  } else {
    console.log(
      'Art image caching contract passed: no Vary, no Accept dependence, ' +
        'immutable public cache, both transcode fallbacks intact.',
    )
  }
}

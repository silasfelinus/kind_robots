// /utils/scripts/auditGalleryChrome.ts
//
// How much screen does a gallery spend before showing you anything?
//
// WHY THIS EXISTS
// ---------------
// Silas, 2026-08-07, with a screenshot of /rewards on a 1366x768 desktop:
//
//   "the choose your reward, pick a story reward text, maturity toggle and
//    search bar, and card hero icons sections should be at most 1-2 rows. This
//    is taking up a significant amount of real estate ... I feel like this
//    giant header problem should have been caught now that you can do these
//    assessments directly."
//
// He is right, and the miss is instructive. Every gallery contract in this repo
// checks STRUCTURE -- does this file mount kr-gallery, does the ratchet shrink,
// does the card emit `open`. All of them passed while four stacked rows of
// chrome ate a third of the viewport, because none of them renders anything.
// Asserting on the source and trusting layout to follow is the same
// mention-versus-use error the rest of these scripts exist to prevent, moved up
// one level.
//
// So this one opens a real browser and measures pixels: the distance from the
// top of the scroll container to the top of the first card. That number is the
// budget, and it is the only one that answers the question actually asked.
//
//   npx tsx utils/scripts/auditGalleryChrome.ts --base https://<preview>.vercel.app
//   npx tsx utils/scripts/auditGalleryChrome.ts --base http://localhost:3000 --strict
//
// `--strict` exits 1 when a route exceeds MAX_CHROME_FRACTION of the viewport
// height. It is deliberately NOT wired into contract-tests.yml: it needs a
// running deployment, so it belongs to the review step, not the unit gate.
//
// DATA IS NOT REQUIRED. The chrome renders whether or not the API answers --
// the screenshot that prompted this had a database error in the body and the
// header was still four rows tall. A route that fails to load its records
// still reports a usable chrome height.

import { chromium, type Browser, type Page } from 'playwright'

/** 1366x768 is the machine Silas reported from; the rest bracket it. */
export const BREAKPOINTS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'tablet', width: 820, height: 1180 },
  { label: 'laptop', width: 1366, height: 768 },
  { label: 'desktop', width: 1920, height: 1080 },
] as const

export const GALLERY_ROUTES = [
  '/bots',
  '/characters',
  '/dreams',
  '/facets',
  '/rewards',
  '/stories',
  '/resources',
  '/servers',
  '/icons',
  '/themes',
  '/achievements',
] as const

/**
 * A gallery may spend at most this fraction of the viewport before the first
 * card. 0.33 is not arbitrary: the reported screenshot measured ~190px of
 * 550px usable, and Silas called that "a significant amount of real estate".
 */
export const MAX_CHROME_FRACTION = 0.33

export type ChromeReading = {
  route: string
  breakpoint: string
  viewportHeight: number
  chromePx: number | null
  /**
   * Which selector produced the number. Only ever the marked grid now -- the
   * `article`/`.card` fallbacks were removed once every gallery was on the
   * shared shell. Kept as a field so a future fallback cannot be reintroduced
   * without the report being able to say so.
   */
  matchedBy: string | null
  fraction: number | null
  /**
   * Pixels above the first GALLERY, as opposed to above its first card.
   *
   * This is the data-independent half of the measurement, and the one this
   * script's own header always claimed to be taking ("DATA IS NOT REQUIRED").
   * It was not: the grid renders only when items exist, so an empty gallery
   * produced no number at all and a route with several galleries produced a
   * number belonging to a different one. The gallery root renders in every
   * state -- grid, skeleton, empty -- so this reports the route's real chrome
   * even when the API returns nothing.
   */
  galleryPx: number | null
  /**
   * How many galleries the route mounts. Anything above 1 means "pixels above
   * the first card" is a question about the FIRST of them, and the report says
   * so rather than quietly averaging a stacked layout into one number.
   */
  galleryCount: number
  /**
   * Why there is no number. NOT optional and NOT a bare null: the first version
   * returned `chromePx: null` for both "the page rendered but held no cards"
   * and "the page never loaded", then printed one dash for each and told the
   * reader it was probably the API. It was actually ERR_CONNECTION_RESET -- the
   * measurement had never happened. Same sentinel-versus-empty conflation this
   * repo warns about in stores; a failure that reads as a legitimate empty is
   * worse than a crash.
   */
  status: 'measured' | 'no-cards' | 'load-failed'
  note?: string
}

/**
 * Pixels above the first card, measured from the top of the page.
 *
 * Runs in the browser: finds the first element the shared shell emitted a card
 * into, and returns its distance from the viewport top. Deliberately measures
 * the RENDERED box rather than counting DOM rows -- a wrapped toolbar is one
 * row on a wide screen and three on a phone, which is exactly the thing a
 * source-level check cannot see.
 */
export type ChromeHit = {
  top: number | null
  matchedBy: string | null
  galleryTop: number | null
  galleryCount: number
}

export async function measureChrome(page: Page): Promise<ChromeHit | null> {
  return page.evaluate(() => {
    /*
     * ONE SELECTOR. No fallbacks. And it must resolve within the FIRST gallery.
     *
     * This used to fall back to `article` and `.card` for galleries not yet on
     * the shared shell. The route-gallery ratchet reached 0 -- every live
     * gallery mounts kr-gallery -- so the fallbacks no longer cover anything,
     * and the 2026-08-08 production run showed they had become actively
     * harmful: /facets, /resources and /achievements each reported an
     * identical 1221 / 34 / 41 / 41. Three unrelated pages agreeing to the
     * pixel is the same "locked onto the app shell" signature that made the
     * FIRST version of this measurement worthless.
     *
     * Removing them left a subtler version of the same error, because the
     * document-wide `[data-kr-gallery-grid]` search is itself a fallback when a
     * route mounts more than one gallery. /servers stacks four; the first three
     * were empty, so the "first marked grid on the page" was the fourth
     * gallery's, and 742px (97% of a laptop viewport) got filed as that route's
     * chrome. Its actual first gallery starts at ~106px. The number was real,
     * measured off a real element, and answered a question nobody asked.
     *
     * So: locate the first gallery, then look for the grid INSIDE it. A first
     * gallery holding no cards reports `no-cards` about itself -- it never
     * resolves to a later gallery's grid.
     */
    const galleries = document.querySelectorAll('[data-kr-gallery]')
    const first = galleries[0]
    if (!first) return null

    const galleryTop = Math.round(first.getBoundingClientRect().top)
    const el = first.querySelector('[data-kr-gallery-grid] > *')
    if (el) {
      const box = el.getBoundingClientRect()
      if (box.height > 40) {
        return {
          top: Math.round(box.top),
          matchedBy: '[data-kr-gallery] [data-kr-gallery-grid] > *',
          galleryTop,
          galleryCount: galleries.length,
        }
      }
    }
    /*
     * The gallery is there and measurable; only its cards are missing. That is
     * still a usable chrome reading, which is the whole point of marking the
     * gallery root, so this returns rather than collapsing to null.
     */
    return {
      top: null,
      matchedBy: null,
      galleryTop,
      galleryCount: galleries.length,
    }
  })
}

export async function auditRoute(
  browser: Browser,
  base: string,
  route: string,
): Promise<ChromeReading[]> {
  const readings: ChromeReading[] = []
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage({
      viewport: { width: bp.width, height: bp.height },
    })
    let hit: ChromeHit | null = null
    let loadError: string | null = null
    try {
      await page.goto(`${base}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      })
      // Cards arrive after hydration + fetch; the chrome does not.
      await page.waitForTimeout(2_500)
      hit = await measureChrome(page)
    } catch (error) {
      loadError =
        (error instanceof Error ? error.message.split('\n')[0] : null) ??
        'load failed'
    } finally {
      await page.close()
    }

    /*
     * Derived, not assigned in branches. The three outcomes are distinct and
     * `loadError` is the only thing that separates a page that never arrived
     * from one that arrived empty -- which is the whole point of this type.
     */
    const status: ChromeReading['status'] = loadError
      ? 'load-failed'
      : hit === null || hit.top === null
        ? 'no-cards'
        : 'measured'
    const note =
      loadError ??
      (hit === null
        ? 'page mounts no gallery at all'
        : hit.top === null
          ? 'first gallery rendered, but holds no cards'
          : undefined)
    readings.push({
      route,
      breakpoint: bp.label,
      viewportHeight: bp.height,
      chromePx: hit?.top ?? null,
      matchedBy: hit?.matchedBy ?? null,
      fraction: hit?.top == null ? null : hit.top / bp.height,
      galleryPx: hit?.galleryTop ?? null,
      galleryCount: hit?.galleryCount ?? 0,
      status,
      note,
    })
  }
  return readings
}

/* -------------------------------------------------------------------------- */

/*
 * A synthetic page is enough to pin the one rule that matters here, and it does
 * not need a deployment or a database to run -- which is the point, because the
 * bug this guards against only appears when the FIRST gallery is empty and a
 * LATER one is not. That state is hard to reach on demand against a live site
 * and trivially constructed here.
 *
 * Each case also records what the previous, document-wide selector would have
 * answered. Where the two differ, the case is a live mutation test: reverting
 * measureChrome to `document.querySelector('[data-kr-gallery-grid] > *')` makes
 * it fail rather than silently pass.
 */
const SELF_TEST_CASES: Array<{
  name: string
  html: string
  expect: { top: number | null; galleryTop: number; galleryCount: number }
  legacyWouldReturn: number | null
}> = [
  {
    name: 'first gallery populated — measures its own first card',
    html: `
      <div data-kr-gallery style="position:absolute;top:100px;left:0;width:100%">
        <div data-kr-gallery-grid><div style="height:200px">card</div></div>
      </div>`,
    expect: { top: 100, galleryTop: 100, galleryCount: 1 },
    legacyWouldReturn: 100,
  },
  {
    name: 'first three galleries empty, fourth populated — /servers shape',
    html: `
      <div data-kr-gallery style="position:absolute;top:106px;left:0;width:100%">
        <div style="height:60px">No matching servers.</div>
      </div>
      <div data-kr-gallery style="position:absolute;top:402px;left:0;width:100%">
        <div style="height:60px">No matching servers.</div>
      </div>
      <div data-kr-gallery style="position:absolute;top:450px;left:0;width:100%">
        <div style="height:60px">No matching servers.</div>
      </div>
      <div data-kr-gallery style="position:absolute;top:742px;left:0;width:100%">
        <div data-kr-gallery-grid><div style="height:200px">card</div></div>
      </div>`,
    // The whole finding in one line: 106, not 742.
    expect: { top: null, galleryTop: 106, galleryCount: 4 },
    legacyWouldReturn: 742,
  },
  {
    name: 'card shorter than the 40px floor is not a card',
    html: `
      <div data-kr-gallery style="position:absolute;top:80px;left:0;width:100%">
        <div data-kr-gallery-grid><div style="height:12px">sliver</div></div>
      </div>`,
    expect: { top: null, galleryTop: 80, galleryCount: 1 },
    legacyWouldReturn: null,
  },
]

async function runSelfTest(): Promise<number> {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  })
  let failures = 0
  for (const test of SELF_TEST_CASES) {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    })
    await page.setContent(
      `<!doctype html><html><body style="margin:0">${test.html}</body></html>`,
    )
    const hit = await measureChrome(page)
    const got = {
      top: hit?.top ?? null,
      galleryTop: hit?.galleryTop ?? null,
      galleryCount: hit?.galleryCount ?? 0,
    }
    const ok =
      got.top === test.expect.top &&
      got.galleryTop === test.expect.galleryTop &&
      got.galleryCount === test.expect.galleryCount
    if (!ok) failures += 1
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${test.name}\n` +
        `        expected ${JSON.stringify(test.expect)}\n` +
        `        got      ${JSON.stringify(got)}`,
    )
    if (test.legacyWouldReturn !== test.expect.top) {
      console.log(
        `        (document-wide selector would have said ${test.legacyWouldReturn} — this case is the mutation test)`,
      )
    }
    await page.close()
  }
  await browser.close()
  console.log(
    failures ? `\n${failures} self-test failure(s).` : '\nSelf-test passed.',
  )
  return failures ? 1 : 0
}

const args = process.argv.slice(2)

if (args.includes('--self-test')) {
  process.exit(await runSelfTest())
}

const base = args[args.indexOf('--base') + 1]
const strict = args.includes('--strict')

if (!base || base.startsWith('--')) {
  console.error(
    'Usage: npx tsx utils/scripts/auditGalleryChrome.ts --base <url> [--strict]',
  )
  process.exit(2)
}

const only = args.includes('--route')
  ? [args[args.indexOf('--route') + 1]!]
  : null
const routes = only ?? [...GALLERY_ROUTES]

/*
 * CHROMIUM_PATH lets a runner point at a browser it already has. This
 * environment ships one at /opt/pw-browsers and sets
 * PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, but the pinned playwright expects a
 * different revision directory and asks for `npx playwright install` -- which
 * would pull ~150MB to re-download a browser already on disk.
 */
const executablePath = process.env.CHROMIUM_PATH || undefined

/*
 * Chromium does NOT inherit HTTPS_PROXY the way curl and node do -- it has to
 * be told. That is the "a sandbox may allow curl and still reset Chromium"
 * failure the load-failure message below warns about, and it is fixable rather
 * than merely reportable: passing the proxy through turns 48 guaranteed
 * ERR_CONNECTION_RESETs into real readings.
 */
/*
 * ...but NOT for a loopback base, which is the other documented usage of this
 * script. Playwright's `proxy` option passes `--proxy-bypass-list=<-loopback>`,
 * which switches OFF Chromium's built-in "never proxy localhost" rule, so
 * `--base http://localhost:3000` got sent to the egress proxy and came back
 * with nothing to measure. The failure was quiet in the worst way: the page
 * "loaded", so the run reported no-cards for every route rather than an error,
 * which reads as an empty database instead of an unreachable server.
 */
const isLoopbackBase =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(base)
const proxyServer = isLoopbackBase
  ? undefined
  : process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
})
const all: ChromeReading[] = []
for (const route of routes) {
  all.push(...(await auditRoute(browser, base, route)))
}
await browser.close()

console.log(`\nGallery chrome — pixels above the first card, ${base}\n`)
console.log(
  `${'route'.padEnd(14)}${BREAKPOINTS.map((b) => `${b.label} (${b.width})`.padEnd(16)).join('')}`,
)
const over: ChromeReading[] = []
for (const route of routes) {
  const row = all.filter((r) => r.route === route)
  const cells = row.map((r) => {
    if (r.chromePx === null) return '—'.padEnd(16)
    const pct = Math.round((r.fraction ?? 0) * 100)
    if ((r.fraction ?? 0) > MAX_CHROME_FRACTION) over.push(r)
    return `${r.chromePx}px (${pct}%)`.padEnd(16)
  })
  console.log(`${route.padEnd(14)}${cells.join('')}`)
}

/*
 * The chrome above the first gallery, which is measurable in every state the
 * page can be in. Printed as its own table rather than folded into the one
 * above, because it answers a different question: the first table is "how far
 * down is the first card", this one is "how far down does the gallery start" --
 * and only the second survives an empty API, which is precisely the condition
 * under which the old report went quiet and the numbers went wrong.
 */
console.log(`\nChrome above the first gallery (renders with or without data)\n`)
console.log(
  `${'route'.padEnd(14)}${BREAKPOINTS.map((b) => `${b.label} (${b.width})`.padEnd(16)).join('')}galleries`,
)
for (const route of routes) {
  const row = all.filter((r) => r.route === route)
  const cells = row.map((r) => {
    if (r.galleryPx === null) return '—'.padEnd(16)
    const pct = Math.round((r.galleryPx / r.viewportHeight) * 100)
    return `${r.galleryPx}px (${pct}%)`.padEnd(16)
  })
  const counts = [...new Set(row.map((r) => r.galleryCount))].join('/')
  console.log(`${route.padEnd(14)}${cells.join('')}${counts}`)
}

const stacked = routes.filter((route) =>
  all.some((r) => r.route === route && r.galleryCount > 1),
)
if (stacked.length) {
  console.log(
    `\n${stacked.length} route(s) mount more than one gallery — the numbers above\n` +
      `describe the FIRST one only: ${stacked.join(', ')}`,
  )
}

const failed = all.filter((r) => r.status === 'load-failed')
const empty = all.filter((r) => r.status === 'no-cards')

if (failed.length) {
  console.error(
    `\n${failed.length} reading(s) NEVER LOADED — nothing was measured:\n`,
  )
  for (const r of [...new Map(failed.map((r) => [r.note, r])).values()]) {
    console.error(`  ${r.note}`)
  }
  console.error(
    `\nThis is not a layout result. Run it from somewhere the browser can reach\n` +
      `the deployment -- a sandbox may allow curl and still reset Chromium.`,
  )
  process.exitCode = 1
}

if (empty.length) {
  console.log(
    `\n${empty.length} reading(s) loaded but held no cards — the API, not the layout.`,
  )
  /*
   * Which of the two empties this is decides who should look at it, and the
   * single dash the first table prints cannot tell them apart. "No gallery at
   * all" is a route that regressed off the shared shell and belongs to
   * verifyRouteGalleryContract; "gallery, no cards" is an empty API and the
   * gallery table above still carries that route's real chrome number.
   */
  for (const r of [...new Map(empty.map((r) => [r.note, r])).values()]) {
    console.log(`  ${r.note}`)
  }
}

if (over.length) {
  console.error(
    `\n${over.length} reading(s) spend more than ${Math.round(MAX_CHROME_FRACTION * 100)}%` +
      ` of the viewport on chrome:\n`,
  )
  for (const r of over) {
    console.error(
      `  ${r.route} @ ${r.breakpoint}: ${r.chromePx}px of ${r.viewportHeight}px`,
    )
  }
  if (strict) process.exitCode = 1
} else if (!failed.length && !empty.length) {
  console.log(
    `\nEvery gallery keeps its chrome under ${Math.round(MAX_CHROME_FRACTION * 100)}% of the viewport.`,
  )
}

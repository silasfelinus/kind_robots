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
  fraction: number | null
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
export async function measureChrome(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    /*
     * `[data-kr-gallery-grid] > *` FIRST, and it is the only exact one.
     *
     * The original list led with `[data-kr-gallery-item]` and `.kr-gallery-grid`
     * -- neither of which kr-gallery has ever emitted, so every route fell
     * straight through to the `article` / `.card` guesses. kr-gallery now stamps
     * `data-kr-gallery-grid` on its grid, so a gallery on the shared shell is
     * identified rather than inferred.
     *
     * The guesses stay as fallbacks, because the routes still off the shell
     * (/themes, /achievements) have no marker and are worth measuring anyway.
     * They ARE guesses: a heuristic in the first draft of this measurement
     * locked onto an app-shell grid and reported six unrelated galleries at
     * byte-identical 34px, so a fallback reading deserves less trust than a
     * marked one.
     */
    const candidates = [
      '[data-kr-gallery-grid] > *',
      '[data-kr-gallery-item]',
      'article',
      '.card',
    ]
    for (const selector of candidates) {
      const el = document.querySelector(selector)
      if (!el) continue
      const box = el.getBoundingClientRect()
      if (box.height > 40) return Math.round(box.top)
    }
    return null
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
    let chromePx: number | null = null
    let loadError: string | null = null
    try {
      await page.goto(`${base}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      })
      // Cards arrive after hydration + fetch; the chrome does not.
      await page.waitForTimeout(2_500)
      chromePx = await measureChrome(page)
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
      : chromePx === null
        ? 'no-cards'
        : 'measured'
    const note =
      loadError ??
      (chromePx === null ? 'page loaded, but rendered no cards' : undefined)
    readings.push({
      route,
      breakpoint: bp.label,
      viewportHeight: bp.height,
      chromePx,
      fraction: chromePx === null ? null : chromePx / bp.height,
      status,
      note,
    })
  }
  return readings
}

/* -------------------------------------------------------------------------- */

const args = process.argv.slice(2)
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
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy
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

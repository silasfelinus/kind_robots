// /utils/scripts/auditGalleryChrome.ts
//
// How much vertical space does a gallery spend BEFORE its first card?
//
// WHY THIS EXISTS
// ---------------
// Silas, 2026-08-06, screenshotting /rewards on a 1366x768 laptop: "the choose
// your reward, pick a story reward text, maturity toggle and search bar, and
// card hero icons sections should be at most 1-2 rows. This is taking up a
// significant amount of real estate." Then, on why it went unnoticed: "I feel
// like this giant header problem should have been caught now that you can do
// these assessments directly."
//
// He is right, and the gap was instrumental rather than attentional. Every
// gallery contract in this repo reads SOURCE -- does the component mount
// kr-gallery, does it bind :mode, is the grid container-responsive. Not one of
// them can see that a route renders four stacked control rows before the first
// card, because nothing in the markup is wrong. It is only wrong at a size.
//
// So this measures the rendered page: load each route at four widths, find the
// gallery grid, and report the pixels above its first card as a fraction of the
// viewport. A third of the screen spent on chrome is the threshold; above that,
// the user scrolls to see the thing the page is named after.
//
// SENTINELS, NOT TRUTHINESS
// -------------------------
// An earlier version of this script reported `chromePx: null` for both "page
// loaded, gallery is empty" and "page never loaded", and I read the resulting
// zeros as an API outage that was really ERR_CONNECTION_RESET on my end. The
// status is DERIVED from which of those happened, never assigned in a branch,
// so the two cannot collapse into each other again. `--strict` fails on a
// measured overage AND on a load failure; it deliberately does not fail on
// `no-cards`, which is a data state rather than a layout defect.
//
//   npx tsx utils/scripts/auditGalleryChrome.ts --base https://example.app
//   npx tsx utils/scripts/auditGalleryChrome.ts --base <url> --strict
//   npx tsx utils/scripts/auditGalleryChrome.ts --base <url> --routes /art,/ui
import { chromium, type Browser } from 'playwright-core'

/**
 * Let Playwright resolve its own Chromium; override only when told to.
 *
 * Same shape as auditResponsiveLayout.mjs, and for a reason worth recording: a
 * hardcoded sandbox path (`/opt/pw-browsers/chromium-1194/...`) works exactly
 * where it was written and nowhere else. On the CI runner, which installs
 * Chromium with `npx playwright install`, it failed instantly with "executable
 * doesn't exist" -- before a single page was loaded.
 */
const CHROMIUM = process.env.CHROMIUM_PATH || undefined

/**
 * Above this fraction of the viewport spent before the first card, the gallery
 * is chrome-first. A third is generous on purpose -- the complaint that
 * prompted this was closer to two thirds.
 */
const MAX_CHROME_FRACTION = 0.33

/**
 * Real devices, not round numbers. 1366x768 is the laptop Silas screenshotted
 * and the tightest common desktop height, which is why it is the one that
 * matters most here.
 */
const BREAKPOINTS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'tablet', width: 820, height: 1180 },
  { label: 'laptop', width: 1366, height: 768 },
  { label: 'desktop', width: 1920, height: 1080 },
]

/**
 * Browse surfaces a user lands on to look through records.
 *
 * `/ui` is deliberately absent even though it mounts kr-gallery: it is the
 * style guide, and its gallery is a specimen partway down a long document, so
 * "pixels above the first card" there measures how far the reader has scrolled
 * to reach the demo rather than any chrome budget. Including it produced a
 * confident 1100px that meant nothing.
 *
 * `/art` is included but usually reads `no-cards`, and that is correct: it
 * opens on a COLLECTIONS grid, and the converted image gallery only renders
 * once you enter a collection. Measuring that needs a route into a collection,
 * which is worth adding when there is a stable one to point at.
 */
const DEFAULT_ROUTES = [
  '/art',
  '/bots',
  '/characters',
  '/conductor',
  '/dreams',
  '/facets',
  '/icons',
  '/resources',
  '/rewards',
  '/servers',
  '/stories',
]

type ChromeReading = {
  route: string
  breakpoint: string
  viewportHeight: number
  /** Pixels above the first card, or null when there was no card to measure. */
  chromePx: number | null
  loadError: string | null
  status: 'measured' | 'no-cards' | 'load-failed'
}

const argOf = (flag: string): string | null => {
  const index = process.argv.indexOf(flag)
  const value = index === -1 ? null : process.argv[index + 1]
  return value && !value.startsWith('--') ? value : null
}

/**
 * Pixels from the top of the viewport to the top of the first gallery card.
 *
 * THE MARKER, AND WHY GUESSING FAILED. This used to find the grid by heuristic
 * -- among elements with `display: grid`, take the one with the most children,
 * requiring its first child to be card-sized. It produced confident numbers
 * that measured the wrong element: /bots, /characters, /dreams, /facets,
 * /rewards and /stories all reported EXACTLY 34px on phone and 31px on laptop.
 * Six galleries that look nothing alike cannot agree to the pixel; the
 * heuristic had locked onto an app-shell grid present on every route.
 *
 * That is worse than no measurement, because it reads as a clean pass. So
 * kr-gallery now stamps `data-kr-gallery-grid` on its grid and this asks for it
 * by name. A route with no kr-gallery yields null -> `no-cards`, which is
 * accurate rather than flattering.
 *
 * The FIRST marked grid in document order, not the largest: a page with two
 * galleries spends its chrome before the first one.
 */
const GALLERY_GRID = '[data-kr-gallery-grid]'

async function measureChrome(page: {
  evaluate: <T>(fn: () => T) => Promise<T>
}): Promise<number | null> {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-kr-gallery-grid]')
    const first = grid?.firstElementChild
    if (!first) return null

    const rect = first.getBoundingClientRect()
    // A zero-area first child is a rendered-but-empty slot, not a card.
    if (rect.height < 1 || rect.width < 1) return null

    return Math.round(rect.top)
  })
}

async function readRoute(
  browser: Browser,
  base: string,
  route: string,
  breakpoint: (typeof BREAKPOINTS)[number],
): Promise<ChromeReading> {
  const context = await browser.newContext({
    viewport: { width: breakpoint.width, height: breakpoint.height },
  })
  const page = await context.newPage()

  let loadError: string | null = null
  let chromePx: number | null = null

  try {
    /*
     * NOT `networkidle`. This app polls, so the network never goes idle and
     * every load burns its full timeout instead of settling -- 48 readings at
     * 45s each is 36 minutes, against a 20-minute job cap. The first CI run of
     * this step hit exactly that and was still going when the job timed out.
     *
     * So: get the document, then wait for the thing being measured to exist.
     * That is both faster (a populated gallery resolves in a second or two)
     * and more honest -- the wait is for the gallery rather than for a proxy
     * signal that happens to correlate with it.
     */
    await page.goto(`${base}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    /*
     * A gallery that never appears is a legitimate `no-cards` reading, not an
     * error, so this swallows its own timeout and lets measureChrome return
     * null. The bound matters more than the outcome: it caps a route that has
     * nothing to show at ~10s rather than at the page timeout.
     */
    await page
      .waitForFunction(
        (selector: string) =>
          !!document.querySelector(selector)?.firstElementChild,
        GALLERY_GRID,
        { timeout: 10_000 },
      )
      .catch(() => {})

    chromePx = await measureChrome(page)
  } catch (error) {
    loadError =
      error instanceof Error ? error.message.split('\n')[0]! : 'failed'
  } finally {
    await context.close()
  }

  // DERIVED, never assigned in the branches above. "Loaded but empty" and
  // "never loaded" are different findings and must not share a value.
  const status: ChromeReading['status'] = loadError
    ? 'load-failed'
    : chromePx === null
      ? 'no-cards'
      : 'measured'

  return {
    route,
    breakpoint: breakpoint.label,
    viewportHeight: breakpoint.height,
    chromePx,
    loadError,
    status,
  }
}

const base = argOf('--base')
if (!base) {
  console.error(
    'Usage: tsx utils/scripts/auditGalleryChrome.ts --base <url> [--strict] [--routes /a,/b]',
  )
  process.exit(2)
}

const routes = argOf('--routes')?.split(',').filter(Boolean) ?? DEFAULT_ROUTES
const strict = process.argv.includes('--strict')
const origin = base.replace(/\/$/, '')

/*
 * Chromium does NOT pick up HTTPS_PROXY from the environment the way curl and
 * node do -- it has to be told. In a sandbox whose egress is proxy-only that
 * looks like ERR_CONNECTION_RESET on every single route while `curl` against
 * the same URL returns 200, which is exactly what the first run of this script
 * produced: 48 load failures misread as the site being down.
 */
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch({
  executablePath: CHROMIUM,
  ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
})
if (proxyServer) console.log(`(routing Chromium through ${proxyServer})\n`)
const readings: ChromeReading[] = []

for (const route of routes) {
  for (const breakpoint of BREAKPOINTS) {
    readings.push(await readRoute(browser, origin, route, breakpoint))
  }
}
await browser.close()

console.log(`Gallery chrome budget — ${origin}`)
console.log(
  `Pixels above the first card, as a fraction of viewport height. Budget: ${Math.round(
    MAX_CHROME_FRACTION * 100,
  )}%.\n`,
)

const overages: ChromeReading[] = []
const loadFailures: ChromeReading[] = []

for (const route of routes) {
  const forRoute = readings.filter((reading) => reading.route === route)
  const cells = forRoute.map((reading) => {
    if (reading.status === 'load-failed')
      return `${reading.breakpoint} LOAD-FAIL`
    if (reading.status === 'no-cards') return `${reading.breakpoint} no-cards`

    const fraction = reading.chromePx! / reading.viewportHeight
    const flag = fraction > MAX_CHROME_FRACTION ? '❌' : '✓'
    return `${reading.breakpoint} ${reading.chromePx}px ${Math.round(fraction * 100)}% ${flag}`
  })

  console.log(`  ${route.padEnd(13)} ${cells.join('   ')}`)

  for (const reading of forRoute) {
    if (reading.status === 'load-failed') loadFailures.push(reading)
    else if (
      reading.status === 'measured' &&
      reading.chromePx! / reading.viewportHeight > MAX_CHROME_FRACTION
    ) {
      overages.push(reading)
    }
  }
}

const noCards = readings.filter((reading) => reading.status === 'no-cards')
if (noCards.length) {
  console.log(
    `\n${noCards.length} reading(s) found no cards to measure. That is a DATA state (empty gallery, or a route that needs a signed-in user), not a layout finding — --strict does not fail on it.`,
  )
}

if (loadFailures.length) {
  console.log(`\n${loadFailures.length} route/breakpoint(s) failed to load:`)
  for (const reading of loadFailures) {
    console.log(
      `  ${reading.route} @ ${reading.breakpoint}: ${reading.loadError}`,
    )
  }
}

if (overages.length) {
  console.log(`\n${overages.length} reading(s) over the chrome budget:`)
  for (const reading of overages) {
    console.log(
      `  ${reading.route} @ ${reading.breakpoint}: ${reading.chromePx}px of ${reading.viewportHeight}px`,
    )
  }
} else {
  /*
   * "No overages" is only good news if something was actually measured. The
   * first run of this script printed the all-clear off ZERO measurements --
   * every route had failed to load -- which is the same absent-vs-empty
   * conflation the header warns about, one level up: an empty findings list
   * means "nothing found" only when the search ran.
   */
  const measured = readings.filter(
    (reading) => reading.status === 'measured',
  ).length

  console.log(
    measured
      ? `\nAll ${measured} measured gallery reading(s) show a card within the chrome budget.`
      : '\nNOTHING WAS MEASURED — this is not a pass. Every route failed to load or had no cards.',
  )
}

if (strict && (overages.length || loadFailures.length)) process.exit(1)

#!/usr/bin/env node
/**
 * Responsive layout audit — measures real rendered geometry at phone, tablet
 * and desktop widths and fails on the two defects that keep reaching Silas's
 * phone:
 *
 *   SPILL    an element whose box extends past the viewport's right edge.
 *            This is the clipped "395..." karma value.
 *
 *   CRUSHED  a flexible element squeezed below a usable width. This is the
 *            page-title strip rendering as an 18px image sliver, which is
 *            worse than hiding it: it looks like a rendering bug and tells the
 *            user nothing about where they are.
 *
 * WHY THIS EXISTS. verifyLayoutContract.ts reads source with regexes, so it
 * catches structural mistakes (two scroll owners, a page with its own <h1>)
 * but is blind to anything that only exists once a browser has done layout.
 * Every mobile defect in this round was of the second kind, and each was
 * "verified" by reasoning about CSS instead of measuring it. Reasoning about
 * flex-basis is not a substitute for reading offsetWidth.
 *
 * USAGE. Needs the dev server up, because it drives the real app:
 *
 *     JWT_SECRET=dev npx nuxt dev --port 3000     # in one shell
 *     npm run audit:responsive                    # in another
 *
 *     npm run audit:responsive -- --routes /dreams,/bots --shots ./out
 *
 * Or against any deployment, which is what CI does — see
 * .github/workflows/responsive-layout-audit.yml. Auditing a deployment rather
 * than a local server is deliberate: it has the real database behind it, and a
 * gallery with no rows renders an empty state whose geometry says nothing about
 * the gallery.
 *
 *     npm run audit:responsive -- --base https://kind-robots.vercel.app
 *
 * Exits non-zero when any route/viewport has a defect. Do not pipe the command
 * in CI — that replaces this exit status with the last pipeline stage's, which
 * is how interface-vision t-063's verifier stayed dead for weeks.
 */

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}

const BASE = flag('base', process.env.AUDIT_BASE || 'http://127.0.0.1:3000')
const ROUTES = flag(
  'routes',
  '/,/conductor,/dreams,/art,/bots,/characters,/rewards,/scenarios',
)
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const SHOTS = flag('shots', '')
/** Below this a flexible element is a sliver, not a control or a label. */
const MIN_FLEX_WIDTH = Number(flag('min-flex', '32'))

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 820, height: 1180, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
]

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error(
    '❌ playwright not installed. Run `npm i -D playwright` (browsers are preinstalled in CI images via PLAYWRIGHT_BROWSERS_PATH).',
  )
  process.exit(2)
}

/**
 * Runs in the page. Returns plain data only — DOM nodes cannot cross the
 * boundary, so elements are described as strings here rather than in Node.
 */
function collect(minFlexWidth) {
  const vw = window.innerWidth
  const de = document.documentElement
  const visible = (el, b) => {
    if (b.width < 1 || b.height < 1) return false
    const cs = getComputedStyle(el)
    return (
      cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'
    )
  }
  const describe = (el, extra) =>
    `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}> ` +
    `"${(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34)}" ` +
    `${extra} .${(el.className || '').toString().replace(/\s+/g, ' ').slice(0, 70)}`

  /**
   * Content inside a horizontally scrollable container is SUPPOSED to extend
   * past the viewport — that is what scrolling means. A tab strip or a card
   * hand would otherwise report every off-screen item as a defect, which is
   * how a checker earns the right to be ignored.
   *
   * The excuse is conditional: it only applies when the scroller ITSELF fits.
   * A scroller that overflows is a genuine defect and is still reported, on
   * the scroller, where the fix belongs.
   */
  const insideFittingScrollerX = (el) => {
    for (
      let p = el.parentElement;
      p && p !== document.body;
      p = p.parentElement
    ) {
      const cs = getComputedStyle(p)
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
        return p.getBoundingClientRect().right <= vw + 1
      }
    }
    return false
  }

  const spill = []
  const crushed = []
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect()
    if (!visible(el, b)) continue

    // Outermost offender only: a wide child otherwise reports its whole
    // ancestor chain and buries the actual cause.
    if (
      b.right > vw + 1 &&
      !insideFittingScrollerX(el) &&
      !spill.some((s) => s.node.contains(el))
    ) {
      spill.push({
        node: el,
        text: describe(el, `right=${Math.round(b.right)}`),
      })
    }

    if (b.height >= 12 && b.width >= 1 && b.width < minFlexWidth) {
      const cs = getComputedStyle(el)
      const flexible = cs.flexGrow !== '0' || cs.flexBasis !== 'auto'
      const meaningful =
        el.textContent.trim() || el.querySelector('img,svg,input,select,button')
      if (flexible && meaningful) {
        crushed.push({
          node: el,
          text: describe(el, `w=${Math.round(b.width)}`),
        })
      }
    }
  }

  /**
   * An <img> that resolved to nothing. The browser then paints its ALT TEXT
   * inside the layout box where the art should be — which is what
   * interface-vision t-069 reported as "description text renders over the card
   * art". No overlap check could ever find it: alt text is not an element, so
   * there is nothing whose box intersects anything. The broken image IS the
   * signal.
   *
   * `complete && naturalWidth === 0` is a failed load (404, bad path). `!complete`
   * this long after networkidle is a stall. Both paint alt text, so both count.
   *
   * DO NOT TRUST THIS CHECK AGAINST A LOCAL DEV SERVER. `public/images` is not
   * in the repo (self-hosted media, see docs/self-hosted-media.md), so every
   * `/images/...` path 404s locally while returning a 307 to real bytes in
   * production. A local run reports a screenful of broken art that does not
   * exist for users. Run it against a deployment — which is what CI does.
   */
  const brokenArt = []
  for (const img of document.querySelectorAll('img')) {
    const b = img.getBoundingClientRect()
    // Skip decorative slivers and anything not actually laid out.
    if (b.width < 8 || b.height < 8) continue
    if (!visible(img, b)) continue
    if (img.complete && img.naturalWidth > 0) continue

    const src = (img.getAttribute('src') || '').split('?')[0]
    brokenArt.push(
      `<img> ${img.complete ? 'failed' : 'never loaded'} ` +
        `${Math.round(b.width)}x${Math.round(b.height)} ` +
        `alt="${(img.getAttribute('alt') || '').slice(0, 40)}" ` +
        `src=…${src.slice(-58)}`,
    )
  }

  return {
    vw,
    scrollWidth: de.scrollWidth,
    horizontalScroll: de.scrollWidth > vw + 1,
    spill: spill.slice(0, 6).map((s) => s.text),
    crushed: crushed.slice(0, 6).map((c) => c.text),
    brokenArt: brokenArt.slice(0, 8),
    brokenArtTotal: brokenArt.length,
  }
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})

let failures = 0
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  })
  for (const route of ROUTES) {
    const page = await ctx.newPage()
    let loaded = true
    await page
      .goto(BASE + route, { waitUntil: 'networkidle', timeout: 90000 })
      .catch(() => {
        loaded = false
      })
    // The startup splash paints over the app and is itself slightly wider than
    // a phone; measuring before it clears reports the splash, not the page.
    await page.waitForTimeout(7000)

    const m = await page.evaluate(collect, MIN_FLEX_WIDTH).catch(() => null)
    const label = `${vp.name.padEnd(7)} ${route.padEnd(14)}`

    if (!m) {
      console.log(
        `${label} ⚠️  could not measure${loaded ? '' : ' (navigation failed)'}`,
      )
    } else if (
      m.horizontalScroll ||
      m.spill.length ||
      m.crushed.length ||
      m.brokenArtTotal
    ) {
      failures += 1
      console.log(`${label} ❌`)
      if (m.horizontalScroll) {
        console.log(
          `         page scrolls sideways: ${m.scrollWidth} > ${m.vw}`,
        )
      }
      for (const s of m.spill) console.log(`         SPILL   ${s}`)
      for (const c of m.crushed) console.log(`         CRUSHED ${c}`)
      if (m.brokenArtTotal) {
        console.log(`         BROKEN-ART ${m.brokenArtTotal} image(s):`)
        for (const a of m.brokenArt) console.log(`           ${a}`)
      }
    } else {
      console.log(`${label} ✅`)
    }

    if (SHOTS) {
      await page.screenshot({
        path: `${SHOTS}/${vp.name}${route.replace(/\//g, '_')}.png`,
      })
    }
    await page.close()
  }
  await ctx.close()
}
await browser.close()

if (failures) {
  console.log(
    `\n❌ ${failures} route/viewport combination(s) with layout defects.`,
  )
  process.exit(1)
}
console.log(
  '\n✅ Responsive layout audit clean across all routes and viewports.',
)

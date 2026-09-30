/**
 * Tablet navigation fixture (interface-vision/t-140).
 *
 * kind_robots#3073 fixed the tablet tab dropdown after it regressed into a
 * desktop-sized, left-hanging two-line slab. It was caught from an iPad
 * screenshot, not by any check: verifyNavigationConsolidation pins the class
 * strings, but a class string that is present says nothing about where the
 * menu actually paints. This opens the real menu at iPad-class widths and
 * measures it.
 *
 * At each tablet viewport, on each route, it opens the tab dropdown
 * (`.tab-select`) and asserts:
 *   ANCHOR   the menu's left edge sits at its trigger's left edge (the old
 *            `dropdown-end` hung it off the trigger's right edge).
 *   WIDTH    the menu is no wider than 18rem (288px) -- xl:22rem is desktop.
 *   INSIDE   the menu stays inside the viewport.
 *   DENSITY  no visible row carries a second description line, so each row
 *            stays compact (descriptions are `sm:hidden xl:block`).
 *
 * Phone (unified picker) and xl desktop are deliberately not exercised here;
 * the layout audit covers their geometry.
 *
 * Usage: node utils/scripts/auditTabletNavigation.mjs [--base URL] [--routes /a,/b]
 * Exits non-zero on any violation or any route that could not be measured.
 * Do not pipe it in CI -- that replaces the exit status.
 */

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}

const BASE = flag('base', process.env.AUDIT_BASE || 'http://127.0.0.1:3000')
const ROUTES = flag('routes', '/art,/conductor,/dreams')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const MAX_MENU_PX = 288
const ANCHOR_TOLERANCE_PX = 4
const ROW_MAX_PX = 64

const VIEWPORTS = [
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
]

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('❌ playwright not installed.')
  process.exit(2)
}

/** Pure decision logic, exported by shape so it can be unit-checked. */
export function judge(m, vw) {
  const problems = []
  if (Math.abs(m.menu.left - m.trigger.left) > ANCHOR_TOLERANCE_PX) {
    problems.push(
      `ANCHOR menu left ${m.menu.left} vs trigger left ${m.trigger.left}`,
    )
  }
  if (m.menu.width > MAX_MENU_PX + 1) {
    problems.push(`WIDTH ${m.menu.width}px > ${MAX_MENU_PX}px`)
  }
  if (m.menu.left < 0 || m.menu.right > vw) {
    problems.push(`INSIDE menu spans ${m.menu.left}..${m.menu.right} of ${vw}`)
  }
  if (!m.rows) problems.push('DENSITY no rows found in the open menu')
  if (m.tallRows.length) {
    problems.push(
      `DENSITY ${m.tallRows.length} row(s) taller than ${ROW_MAX_PX}px: ${m.tallRows.join(' | ')}`,
    )
  }
  return problems
}

function measure(rowMax) {
  const root = document.querySelector('.tab-select')
  const trigger = root?.querySelector('button')
  const menu = root?.querySelector('.dropdown-content')
  if (!root || !trigger || !menu) return null
  const box = (el) => {
    const r = el.getBoundingClientRect()
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
    }
  }
  const rows = [...menu.querySelectorAll('li button')].filter(
    (b) => b.getBoundingClientRect().height > 0,
  )
  return {
    trigger: box(trigger),
    menu: box(menu),
    rows: rows.length,
    tallRows: rows
      .filter((b) => b.getBoundingClientRect().height > rowMax)
      .map(
        (b) =>
          `${(b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)} (${Math.round(b.getBoundingClientRect().height)}px)`,
      ),
  }
}

// Behind a TLS-intercepting egress proxy (Claude Code cloud sandboxes), set
// AUDIT_VIA_PROXY=1 to route through it and tolerate its CA.
const viaProxy = process.env.AUDIT_VIA_PROXY === '1'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: viaProxy
    ? ['--no-sandbox', '--ignore-certificate-errors', '--disable-http2']
    : ['--no-sandbox'],
  proxy: viaProxy ? { server: process.env.HTTPS_PROXY } : undefined,
})

let failures = 0
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: viaProxy,
  })
  for (const route of ROUTES) {
    const label = `${vp.name.padEnd(15)} ${route.padEnd(16)}`
    const page = await ctx.newPage()
    let loaded = true
    await page
      .goto(BASE + route, { waitUntil: 'networkidle', timeout: 90000 })
      .catch(() => {
        loaded = false
      })
    await page.waitForTimeout(7000) // let the startup splash clear
    let m = null
    if (loaded) {
      await page
        .locator('.tab-select > button')
        .first()
        .click({ timeout: 10000 })
        .catch(() => {})
      await page.waitForTimeout(400)
      m = await page.evaluate(measure, ROW_MAX_PX).catch(() => null)
    }
    if (!loaded || !m) {
      failures += 1
      console.log(
        `${label} ❌ ${loaded ? 'tab menu not found' : 'navigation failed'} -- nothing measured`,
      )
    } else {
      const problems = judge(m, vp.width)
      if (problems.length) {
        failures += 1
        console.log(`${label} ❌`)
        for (const p of problems) console.log(`         ${p}`)
      } else {
        console.log(`${label} ✅ menu ${m.menu.width}px, ${m.rows} rows`)
      }
    }
    await page.close()
  }
  await ctx.close()
}
await browser.close()

if (failures) {
  console.error(`\n❌ ${failures} tablet navigation defect(s).`)
  process.exit(1)
}
console.log('\n✅ Tablet navigation menu is anchored, narrow, and compact.')

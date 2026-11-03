import { fileURLToPath } from 'node:url'

/**
 * Tablet navigation fixture (interface-vision/t-105).
 *
 * At tablet widths the header has a single art-led workspace launcher.
 * Open it on real routes, then measure its anchor, responsive width and
 * presence of the channel rail and destination cards. The former separate
 * tab popup was removed; its 288px column rules no longer apply.
 *
 * Usage: node utils/scripts/auditTabletNavigation.mjs [--base URL] [--routes /a,/b]
 */

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}

const BASE = flag('base', process.env.AUDIT_BASE || 'http://127.0.0.1:3000')
const ROUTES = flag('routes', '/art,/dreams')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const VIEWPORT_GUTTER = 12
const LAUNCHER_MIN_WIDTH = 480
const LAUNCHER_MAX_WIDTH = 1760
const ANCHOR_TOLERANCE_PX = 4

const VIEWPORTS = [
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
]

export function judge(m, vw) {
  const problems = []
  if (Math.abs(m.menu.left - m.trigger.left) > ANCHOR_TOLERANCE_PX) {
    problems.push(
      `ANCHOR menu left ${m.menu.left} vs trigger left ${m.trigger.left}`,
    )
  }

  const available = Math.floor(vw - m.trigger.left - VIEWPORT_GUTTER)
  const floor = Math.min(LAUNCHER_MIN_WIDTH, vw - VIEWPORT_GUTTER * 2)
  const expectedWidth = Math.max(
    floor,
    Math.min(LAUNCHER_MAX_WIDTH, available),
  )
  if (Math.abs(m.menu.width - expectedWidth) > 2) {
    problems.push(
      `WIDTH ${m.menu.width}px vs ${expectedWidth}px for the available viewport`,
    )
  }
  if (m.menu.left < 0 || m.menu.right > vw) {
    problems.push(`INSIDE menu spans ${m.menu.left}..${m.menu.right} of ${vw}`)
  }
  if (!m.channels) problems.push('CHANNELS no channel rail entries found')
  if (!m.cards) problems.push('CARDS no image-led destinations found')
  return problems
}

function measure() {
  const root = document.querySelector('.nav-launcher-desktop')
  const trigger = root?.querySelector('button')
  const menu = root?.querySelector('.kr-launcher')
  if (!root || !trigger || !menu) return null
  const box = (el) => {
    const r = el.getBoundingClientRect()
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
    }
  }
  return {
    trigger: box(trigger),
    menu: box(menu),
    channels: menu.querySelectorAll('.channel-menu-item').length,
    cards: menu.querySelectorAll('.kr-launcher-card').length,
  }
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('❌ playwright not installed.')
    process.exitCode = 2
    return
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
          .locator('.nav-launcher-desktop > button')
          .first()
          .click({ timeout: 10000 })
          .catch(() => {})
        await page.waitForTimeout(400)
        m = await page.evaluate(measure).catch(() => null)
      }
      if (!loaded || !m) {
        failures += 1
        console.log(
          `${label} ❌ ${loaded ? 'launcher not found' : 'navigation failed'} -- nothing measured`,
        )
      } else {
        const problems = judge(m, vp.width)
        if (problems.length) {
          failures += 1
          console.log(`${label} ❌`)
          for (const p of problems) console.log(`         ${p}`)
        } else {
          console.log(`${label} ✅ launcher ${m.menu.width}px, ${m.cards} cards`)
        }
      }
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()

  if (failures) {
    console.error(`\n❌ ${failures} tablet launcher defect(s).`)
    process.exitCode = 1
    return
  }
  console.log('\n✅ Tablet navigation launcher is anchored, adaptive, and populated.')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main()
}

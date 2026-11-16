// Live cold-open probe for shared arcade links (conductor kr-arcade/t-169).
//
// Opens /play/arcade?game=<slug> for every `shelf: 'showcase'` cabinet in a
// FRESH browser context (no session, no localStorage) on a phone and a tablet,
// and reports anything a first-time visitor from a shared link would trip on:
// a login wall, a page error, no game canvas, or no way back to the hall.
//
//   node utils/scripts/checkArcadeColdOpenLive.mjs [--base=https://kindrobots.org]
//
// Exits 1 when any cabinet fails. This hits production; it is a probe, not a
// CI gate. The geometry contract stays in verifyArcadeViewport.browser.test.mjs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const base = (
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ??
  process.env.ARCADE_BASE_URL ??
  'https://kindrobots.org'
).replace(/\/+$/, '')

export function showcaseSlugs(source) {
  return source
    .split(/\n {2}\{\n/)
    .filter((block) => /shelf: 'showcase'/.test(block))
    .map((block) => block.match(/slug: '([^']+)'/)?.[1])
    .filter(Boolean)
}

const slugs = showcaseSlugs(
  readFileSync(join(process.cwd(), 'utils/arcade/games.ts'), 'utf8'),
)
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
})
const failures = []
try {
  for (const viewport of viewports) {
    for (const slug of slugs) {
      const context = await browser.newContext({
        viewport,
        hasTouch: true,
        isMobile: viewport.width < 600,
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message.slice(0, 120)))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text().slice(0, 120))
      })
      const label = `${slug} ${viewport.width}x${viewport.height}`
      try {
        await page.goto(
          `${base}/play/arcade?game=${encodeURIComponent(slug)}`,
          { waitUntil: 'load', timeout: 45_000 },
        )
        await page.waitForSelector('canvas', { timeout: 20_000 })
        const state = await page.evaluate(() => ({
          path: location.pathname,
          canvases: document.querySelectorAll('canvas').length,
          start: [...document.querySelectorAll('button')].some((button) =>
            /start/i.test(button.textContent || ''),
          ),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }))
        const problems = []
        if (state.path !== '/play/arcade')
          problems.push(`left for ${state.path}`)
        if (!state.canvases) problems.push('no game canvas')
        if (!state.start) problems.push('no START button')
        if (state.overflow) problems.push('horizontal scroll')
        if (errors.length)
          problems.push(`errors: ${errors.slice(0, 2).join(' | ')}`)
        console.log(
          `${problems.length ? 'FAIL' : 'ok  '} ${label}${problems.length ? ` — ${problems.join('; ')}` : ''}`,
        )
        if (problems.length) failures.push(label)
      } catch (err) {
        console.log(
          `FAIL ${label} — ${err.message.split('\n')[0].slice(0, 120)}`,
        )
        failures.push(label)
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}

console.log(
  `${slugs.length * viewports.length - failures.length}/${slugs.length * viewports.length} showcase cold opens clean on ${base}`,
)
if (failures.length) process.exit(1)

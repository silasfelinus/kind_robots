// Live cold-open probe for shared arcade links (conductor kr-arcade/t-169).
//
// Opens /play/arcade?game=<slug> for every `shelf: 'showcase'` cabinet in a
// FRESH browser context (no session, no localStorage) on a phone and a tablet,
// and runs through START, touch controls, audio unlock and the return to the
// Arcade hall. A rendered canvas alone is not a playable shared link.
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
        isMobile: true,
      })
      await context.addInitScript(() => {
        const NativeAudioContext = window.AudioContext
        window.__arcadeAudioContexts = 0
        if (NativeAudioContext) {
          window.AudioContext = class extends NativeAudioContext {
            constructor(...args) {
              super(...args)
              window.__arcadeAudioContexts++
            }
          }
        }
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
          start: Boolean(document.querySelector('.cabinet-start')),
          hall: Boolean(
            document.querySelector('a[aria-label="Back to the Arcade hall"]'),
          ),
          audioContexts: window.__arcadeAudioContexts,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }))
        const problems = []
        if (state.path !== '/play/arcade')
          problems.push(`left for ${state.path}`)
        if (!state.canvases) problems.push('no game canvas')
        if (!state.start) problems.push('no START button')
        if (!state.hall) problems.push('no Arcade hall back link')
        if (state.audioContexts !== 0)
          problems.push('audio context created before player gesture')
        if (state.overflow) problems.push('horizontal scroll')

        if (state.start && state.audioContexts === 0) {
          try {
            await page.locator('.cabinet-start').tap({ timeout: 10_000 })
            await page
              .locator('.cabinet-overlay')
              .waitFor({ state: 'visible', timeout: 10_000 })
            const playing = await page.evaluate(() => {
              const controls = [
                ...document.querySelectorAll(
                  '.cabinet-dpad, .cabinet-ball, .cabinet-paddle-track, .cabinet-aim',
                ),
              ].filter((element) => {
                const rect = element.getBoundingClientRect()
                return rect.width > 0 && rect.height > 0
              })
              const onScreen = (element) => {
                if (!element) return false
                const rect = element.getBoundingClientRect()
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  rect.left >= -2 &&
                  rect.top >= -2 &&
                  rect.right <= innerWidth + 2 &&
                  rect.bottom <= innerHeight + 2
                )
              }
              return {
                audioContexts: window.__arcadeAudioContexts,
                touchControls: controls.length,
                reachableControls: controls.filter(onScreen).length,
                pause: onScreen(document.querySelector('.cabinet-pause-chip')),
                exit: onScreen(
                  document.querySelector(
                    '[aria-label="Leave the game (pauses it)"]',
                  ),
                ),
              }
            })
            if (!playing.audioContexts)
              problems.push('audio did not unlock after START gesture')
            if (!playing.touchControls)
              problems.push('no gameplay touch controls')
            if (playing.touchControls !== playing.reachableControls)
              problems.push('touch controls outside viewport')
            if (!playing.pause) problems.push('pause button not reachable')
            if (!playing.exit) problems.push('exit button not reachable')
            await page
              .getByRole('button', { name: 'Leave the game (pauses it)' })
              .tap()
            await page.locator('.cabinet-overlay').waitFor({ state: 'hidden' })
          } catch (err) {
            problems.push(
              `START/touch: ${err.message.split('\n')[0].slice(0, 100)}`,
            )
          }
        }

        if (state.hall) {
          try {
            await page.getByRole('link', { name: 'Back to the Arcade hall' }).click()
            await page.waitForURL((url) =>
              url.pathname === '/play/arcade' && !url.searchParams.has('game'),
            )
            await page.locator('.arcade-hall').waitFor({ state: 'visible' })
          } catch (err) {
            problems.push(
              `hall return: ${err.message.split('\n')[0].slice(0, 100)}`,
            )
          }
        }
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

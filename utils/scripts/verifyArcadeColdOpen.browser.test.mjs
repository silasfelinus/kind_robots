import assert from 'node:assert/strict'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
} from './arcadeCabinetFixture.mjs'

// A fresh guest opens each showcase cabinet on a phone and tablet. Unlike an
// SSR/canvas probe, these tests press the real cabinet START switch and inspect
// the live touch controls before returning to the unpaused cabinet shell.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const source = readFileSync(path.join(root, 'utils/arcade/games.ts'), 'utf8')
const slugs = source
  .split(/\n {2}\{\n/)
  .filter((block) => /shelf: 'showcase'/.test(block))
  .map((block) => block.match(/slug: '([^']+)'/)?.[1])
  .filter(Boolean)
assert.ok(slugs.length >= 11, 'the showcase shelf has at least eleven cabinets')
assert.equal(new Set(slugs).size, slugs.length, 'showcase slugs are unique')

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]
const shots = process.env.ARCADE_COLD_OPEN_SHOTS
if (shots) mkdirSync(shots, { recursive: true })
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const results = []

try {
  for (const viewport of viewports) {
    for (const slug of slugs) {
      const label = `${slug} ${viewport.width}x${viewport.height}`
      const { page, context, errors } = await openCabinet(
        browser,
        fixture,
        { slug, ...viewport, touch: true, audioProbe: true },
      )
      try {
        await page.waitForTimeout(300)
        const initial = await page.evaluate(() => ({
          audioContexts: window.__arcadeAudioContexts,
          storageKeys: Object.keys(localStorage),
          startLabel: document.querySelector('.cabinet-start')?.textContent,
          canvas: document.querySelector('.cabinet-canvas')?.width,
          authWall: Boolean(document.querySelector('input[type="password"]')),
        }))
        assert.equal(initial.audioContexts, 0, `${label}: no sound before tap`)
        assert.deepEqual(initial.storageKeys, [], `${label}: guest has no saved state`)
        assert.ok(initial.canvas > 0, `${label}: a sized game canvas loads`)
        assert.match(initial.startLabel ?? '', /start/i, `${label}: START exists`)
        assert.equal(initial.authWall, false, `${label}: no sign-in wall`)

        await page.locator('.cabinet-start').tap()
        await page.locator('.cabinet-overlay').waitFor({ state: 'visible' })
        const playing = await page.evaluate(() => {
          const stage = document.querySelector('.cabinet-canvas')
          const overlay = document.querySelector('.cabinet-overlay')
          const pause = document.querySelector('.cabinet-pause-chip')
          const leave = document.querySelector(
            '[aria-label="Leave the game (pauses it)"]',
          )
          const controls = [
            ...document.querySelectorAll(
              '.cabinet-dpad, .cabinet-ball, .cabinet-paddle-track, .cabinet-aim',
            ),
          ].filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          const inViewport = (element) => {
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
            stageVisible: inViewport(stage),
            overlayVisible: inViewport(overlay),
            pauseVisible: inViewport(pause),
            leaveVisible: inViewport(leave),
            controls: controls.length,
            reachableControls: controls.filter(inViewport).length,
            horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1,
          }
        })
        assert.ok(
          playing.audioContexts > 0,
          `${label}: START gesture unlocks WebAudio`,
        )
        assert.equal(playing.stageVisible, true, `${label}: screen stays visible`)
        assert.equal(playing.pauseVisible, true, `${label}: pause reachable`)
        assert.equal(playing.leaveVisible, true, `${label}: exit reachable`)
        assert.ok(playing.controls > 0, `${label}: gameplay has touch inputs`)
        assert.equal(
          playing.reachableControls,
          playing.controls,
          `${label}: all touch controls fit within the viewport`,
        )
        assert.equal(
          playing.horizontalScroll,
          false,
          `${label}: no horizontal document scroll`,
        )
        if (shots) {
          await page.screenshot({
            path: path.join(
              shots,
              `${slug}-${viewport.width}x${viewport.height}.png`,
            ),
          })
        }

        await page
          .getByRole('button', { name: 'Leave the game (pauses it)' })
          .tap()
        await page.locator('.cabinet-overlay').waitFor({ state: 'hidden' })
        assert.ok(
          await page.locator('.cabinet-start').isVisible(),
          `${label}: leaving returns to cabinet controls`,
        )
        assert.deepEqual(errors, [], `${label}: no uncaught browser errors`)
        results.push(label)
        console.log(`ok ${label}: guest START, audio, touch and exit`)
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
console.log(
  `Arcade cold-open fixture: ${results.length}/${slugs.length * viewports.length} showcase phone/tablet starts passed`,
)

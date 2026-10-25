import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  startRainbowRun,
} from './arcadeCabinetFixture.mjs'

// Real ArcadeCabinet + real game engines with stubbed stores. This is a browser geometry
// and input-surface smoke test, not physical-device or human sprite-legibility approval.
const RAINBOW = 'rainbow-bullet-hell-space-princess'
const PLUMBER = 'save-the-plumber'
const GHOST = 'zuzu-ghost-trail'
const cases = [
  { slug: PLUMBER, width: 360, height: 640, touch: true },
  { slug: RAINBOW, width: 390, height: 844, touch: true },
  { slug: RAINBOW, width: 844, height: 390, touch: true },
  { slug: GHOST, width: 768, height: 1024, touch: true },
  { slug: RAINBOW, width: 1024, height: 768, touch: true, seats: 4 },
  { slug: PLUMBER, width: 1440, height: 900, touch: false },
  { slug: RAINBOW, width: 1920, height: 1080, touch: false },
]
const dprs = [1, 2, 3]
const shots = process.env.ARCADE_VIEWPORT_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const summary = []

function visibleWithin(rect, width, height, tolerance = 1) {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left >= -tolerance &&
    rect.top >= -tolerance &&
    rect.right <= width + tolerance &&
    rect.bottom <= height + tolerance
  )
}

try {
  for (const testCase of cases) {
    for (const dpr of dprs) {
      const { page, context, errors } = await openCabinet(browser, fixture, {
        ...testCase,
        dpr,
      })
      const label = `${testCase.slug} ${testCase.width}x${testCase.height} DPR${dpr}`
      try {
        await page.waitForFunction(() => {
          const canvas = document.querySelector('.cabinet-canvas')
          const box = canvas?.getBoundingClientRect()
          return box && box.width > 0 && box.height > 0 && canvas.width > 0
        })
        if (testCase.slug === RAINBOW) {
          await startRainbowRun(page)
          if (testCase.seats === 4)
            await page.waitForFunction(
              () => document.querySelectorAll('.cabinet-dpad').length === 4,
            )
        }
        const metrics = await page.evaluate(() => {
          const rect = (node) => {
            const b = node.getBoundingClientRect()
            return {
              left: b.left,
              top: b.top,
              right: b.right,
              bottom: b.bottom,
              width: b.width,
              height: b.height,
            }
          }
          const canvas = document.querySelector('.cabinet-canvas')
          const controls = [
            ...document.querySelectorAll(
              '.cabinet-overlay .cabinet-dpad, .cabinet-overlay .cabinet-ball, .cabinet-pause-chip',
            ),
          ].map(rect)
          return {
            stage: rect(canvas),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            screen: rect(document.querySelector('.cabinet-screen')),
            controls,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            htmlOverflow: document.documentElement.style.overflow,
            bodyOverflow: document.body.style.overflow,
            dpr: devicePixelRatio,
          }
        })
        assert.equal(metrics.dpr, dpr, `${label}: device scale`)
        assert.ok(
          visibleWithin(metrics.stage, testCase.width, testCase.height),
          `${label}: stage stays visible: ${JSON.stringify(metrics.stage)}`,
        )
        assert.ok(
          metrics.documentWidth <= metrics.viewportWidth + 1,
          `${label}: no horizontal document overflow (${metrics.documentWidth})`,
        )
        assert.ok(
          metrics.stage.left >= metrics.screen.left - 1 &&
            metrics.stage.right <= metrics.screen.right + 1 &&
            metrics.stage.top >= metrics.screen.top - 1 &&
            metrics.stage.bottom <= metrics.screen.bottom + 1,
          `${label}: canvas fits screen bezel`,
        )
        assert.ok(
          metrics.canvasWidth * metrics.canvasHeight <= 3_240_000,
          `${label}: backing pixels stay within shared 3.24MP ceiling`,
        )
        if (testCase.touch && testCase.slug === RAINBOW) {
          assert.equal(
            metrics.htmlOverflow,
            'hidden',
            `${label}: page scroll locked`,
          )
          assert.equal(
            metrics.bodyOverflow,
            'hidden',
            `${label}: body scroll locked`,
          )
          assert.ok(
            metrics.controls.length > 0,
            `${label}: touch controls exist`,
          )
          for (const [index, rect] of metrics.controls.entries()) {
            assert.ok(
              visibleWithin(rect, testCase.width, testCase.height),
              `${label}: control ${index} is reachable: ${JSON.stringify(rect)}`,
            )
          }
        }
        if (shots) {
          await page.screenshot({
            path: path.join(
              shots,
              `${testCase.slug}-${testCase.width}x${testCase.height}-dpr${dpr}.png`,
            ),
          })
        }
        assert.deepEqual(errors, [], `${label}: no uncaught browser exceptions`)
        const logicalWidth = testCase.slug === GHOST ? 320 : 480
        const nominalSpriteExtent =
          testCase.slug === PLUMBER ? 36 : testCase.slug === RAINBOW ? 34 : null
        const nominalSpriteCssPixels =
          nominalSpriteExtent === null
            ? null
            : Math.round(
                (metrics.stage.width / logicalWidth) * nominalSpriteExtent,
              )
        summary.push({
          slug: testCase.slug,
          viewport: `${testCase.width}x${testCase.height}`,
          dpr,
          stage: `${Math.round(metrics.stage.width)}x${Math.round(metrics.stage.height)}`,
          backingPixels: metrics.canvasWidth * metrics.canvasHeight,
          nominalSpriteCssPixels,
          touchTargets: metrics.controls.length,
        })
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
console.log(
  'Arcade viewport geometry matrix (nominal art-box estimates (Plumber height, Rainbow max width), not visual approval):',
)
console.log(JSON.stringify(summary, null, 2))
console.log(
  `Arcade viewport matrix: ${summary.length} real-cabinet cases passed`,
)

import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const VIEWPORTS = [
  { name: 'portrait', width: 834, height: 1194 },
  { name: 'landscape', width: 1194, height: 834 },
  { name: 'portrait-return', width: 834, height: 1194 },
]

export function rotationProblems(metrics, viewport, portraitColumns) {
  if (!metrics) return ['Missing arcade or workspace geometry']
  const { width } = viewport
  const problems = []
  if (Math.abs(metrics.viewportWidth - width) > 2) {
    problems.push('Layout viewport did not follow the rotation')
  }
  if (Math.abs(metrics.visualWidth - width) > 2) {
    problems.push('Visual viewport did not follow the rotation')
  }
  for (const [name, gutter] of [
    ['shell', 2],
    ['header', 24],
    ['main', 24],
    ['hall', 64],
  ]) {
    const box = metrics[name]
    if (
      !box ||
      box.left < -2 ||
      box.right > width + 2 ||
      box.left > gutter ||
      width - box.right > gutter ||
      box.width < width - gutter * 2
    ) {
      problems.push(`${name} does not fill the available viewport`)
    }
  }
  if (metrics.scrollWidth > width + 2) {
    problems.push('Document scrolls sideways')
  }
  if (!Number.isInteger(metrics.columns) || metrics.columns < 1) {
    problems.push('Arcade grid is missing')
  } else if (
    viewport.name === 'landscape' &&
    metrics.columns <= portraitColumns
  ) {
    problems.push('Arcade cards did not reflow into more landscape columns')
  } else if (
    viewport.name === 'portrait-return' &&
    metrics.columns !== portraitColumns
  ) {
    problems.push('Arcade grid did not return to its portrait columns')
  }
  return problems
}

function measure() {
  const box = (selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect()
    return rect
      ? { left: rect.left, right: rect.right, width: rect.width }
      : null
  }
  const grid = document.querySelector('.arcade-row')
  const tracks = grid ? getComputedStyle(grid).gridTemplateColumns : ''
  return {
    viewportWidth: window.innerWidth,
    visualWidth: window.visualViewport?.width ?? window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    shell: box('.kr-shell'),
    header: box('.kr-system-bar'),
    main: box('.kr-main'),
    hall: box('.arcade-hall'),
    columns:
      tracks && tracks !== 'none' ? tracks.trim().split(/\s+/).length : 0,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index < 0 ? fallback : args[index + 1] || fallback
  }
  const base = flag('base', 'http://127.0.0.1:3000').replace(/\/$/, '')
  const shots = flag('screenshots', 'tablet-rotation-screenshots')
  const { webkit } = await import('playwright')
  const browser = await webkit.launch()
  await mkdir(shots, { recursive: true })
  let failures = 0
  try {
    const context = await browser.newContext({
      viewport: { width: VIEWPORTS[0].width, height: VIEWPORTS[0].height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    await page.goto(`${base}/play/arcade`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
    await page.locator('.arcade-hall').waitFor({ state: 'visible' })
    await page.locator('.kr-shell:not(.bg-black)').waitFor({ state: 'visible' })

    let portraitColumns = 0
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page
        .waitForFunction(
          (width) =>
            Math.abs(window.innerWidth - width) <= 2 &&
            Math.abs(
              (document.querySelector('.kr-shell')?.getBoundingClientRect()
                .width ?? 0) - width,
            ) <= 2,
          viewport.width,
          { timeout: 5000 },
        )
        .catch(() => {})
      await page.waitForTimeout(500)
      const metrics = await page.evaluate(measure)
      if (viewport.name === 'portrait') portraitColumns = metrics.columns
      const problems = rotationProblems(metrics, viewport, portraitColumns)
      await page.screenshot({ path: `${shots}/${viewport.name}.png` })
      console.log(JSON.stringify({ viewport, metrics, problems }))
      failures += problems.length
    }
  } finally {
    await browser.close()
  }
  if (failures) throw new Error(`${failures} tablet rotation defects`)
  console.log('Tablet rotation: portrait → landscape → portrait passed')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main()
}

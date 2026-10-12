import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const source = readFileSync(
  path.join(root, 'components/gallery/kr-deferred-image.vue'),
  'utf8',
)
const { descriptor } = parse(source)
const component = compileScript(descriptor, {
  id: 'deferred-image-fixture',
  inlineTemplate: true,
}).content
const entry = `
import { createApp, h, ref } from 'vue'
import DeferredImage from 'fixture-component'
if (window.controlledObservation) {
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback }
    observe(target) { window.activateImage = () => this.callback([{ target, isIntersecting: true }]) }
    unobserve() {}
  }
}
const src = ref('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="gold"/></svg>'))
const eager = ref(false)
window.fixture = { errors: 0, clear() { src.value = '' }, setSource(value) { src.value = value }, setEager() { eager.value = true } }
createApp({ setup() { return () => h('div', { id: 'art-slot' }, [h(DeferredImage, { src: src.value, eager: eager.value, alt: 'Waiting gallery artwork', onError() { window.fixture.errors++ } })]) } }).mount('#app')
`
const bundled = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  plugins: [
    {
      name: 'fixture',
      setup(builder) {
        builder.onResolve({ filter: /^fixture-component$/ }, () => ({
          path: 'component',
          namespace: 'fixture',
        }))
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          contents: component,
          loader: 'ts',
          resolveDir: root,
        }))
        builder.onResolve({ filter: /^@\// }, ({ path: name }) => ({
          path: path.join(root, name.slice(2)) + '.ts',
        }))
      },
    },
  ],
})
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const snapshots = process.env.DEFERRED_IMAGE_SHOTS
if (snapshots) mkdirSync(snapshots, { recursive: true })
const inspect = () => {
  const image = document.querySelector('img')
  const style = getComputedStyle(image)
  const bounds = image.getBoundingClientRect()
  const visible =
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  return {
    visible,
    width: bounds.width,
    height: bounds.height,
    loaded: image.complete && image.naturalWidth > 0,
    broken: visible && image.complete && image.naturalWidth === 0,
    src: image.getAttribute('src'),
  }
}
async function mount(page, controlled) {
  await page.setContent('<div id="app"></div>')
  await page.addStyleTag({
    content:
      'body{margin:24px;background:#fdfaf4}#art-slot{width:200px;height:160px;background:#ddd4c9;border-radius:12px;overflow:hidden}img{width:200px;height:160px;object-fit:cover}.invisible{visibility:hidden}',
  })
  await page.evaluate((value) => {
    window.controlledObservation = value
  }, controlled)
  await page.addScriptTag({ content: bundled.outputFiles[0].text })
}
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } })
    await mount(page, true)
    const waiting = await page.evaluate(inspect)
    assert.equal(waiting.src, null, 'waiting art must not start a request')
    assert.equal(
      waiting.visible,
      false,
      'source-less waiting art must not paint broken alt text',
    )
    assert.equal(
      waiting.broken,
      false,
      'unchanged BROKEN-ART criteria do not flag the waiting presentation',
    )
    assert.deepEqual(
      [waiting.width, waiting.height],
      [200, 160],
      'waiting art retains observable layout bounds',
    )
    if (snapshots)
      await page.screenshot({
        path: path.join(snapshots, `waiting-${width}.png`),
      })
    await page.evaluate(() => window.activateImage())
    await page.waitForFunction(
      () => document.querySelector('img').naturalWidth > 0,
    )
    assert.equal((await page.evaluate(inspect)).visible, true)
    if (snapshots)
      await page.screenshot({
        path: path.join(snapshots, `loaded-${width}.png`),
      })
    const originalSrc = (await page.evaluate(inspect)).src
    await page.evaluate(() =>
      window.fixture.setSource(
        'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="pink"/></svg>',
          ),
      ),
    )
    assert.equal(
      (await page.evaluate(inspect)).src,
      originalSrc,
      'URL refresh keeps the existing frame until hydration',
    )
    await page.evaluate(() => window.activateImage())
    await page.waitForFunction(
      (previous) =>
        document.querySelector('img').getAttribute('src') !== previous,
      originalSrc,
    )
    await page.evaluate(() => window.fixture.clear())
    await page.waitForFunction(
      () => !document.querySelector('img').getAttribute('src'),
    )
    assert.equal((await page.evaluate(inspect)).visible, false)
    await page.evaluate(() => {
      window.fixture.setEager()
      window.fixture.setSource('data:image/png;base64,not-an-image')
    })
    await page.waitForFunction(() => window.fixture.errors > 0)
    const failed = await page.evaluate(inspect)
    assert.equal(
      failed.visible,
      true,
      'genuine source failures stay visible to parent error handling',
    )
    assert.equal(
      failed.broken,
      true,
      'real failure remains detectable by the unchanged audit',
    )
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } })
  await page.setContent(
    '<style>#app{padding-top:5000px}</style><div id="app"></div>',
  )
  await page.addStyleTag({
    content:
      '#art-slot,img{width:200px;height:160px}.invisible{visibility:hidden}',
  })
  await page.evaluate(() => (window.controlledObservation = false))
  await page.addScriptTag({ content: bundled.outputFiles[0].text })
  assert.equal((await page.evaluate(inspect)).visible, false)
  await page.locator('img').scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () => document.querySelector('img').naturalWidth > 0,
  )
  assert.equal(
    (await page.evaluate(inspect)).visible,
    true,
    'hidden waiting image still activates through real IntersectionObserver',
  )
  await page.close()
  console.log(
    'Deferred image browser contract: waiting, loaded, refreshed, missing and failed art; real viewport activation; 390/768/1440px passed',
  )
} finally {
  await browser.close()
}

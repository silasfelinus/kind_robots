import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const entry = [
  "import { createPinia, setActivePinia } from 'pinia'",
  "import { useMemoryWorldStore } from '@/stores/memoryWorldStore'",
  "import { useMemorySeaStore } from '@/stores/memorySeaStore'",
  "import { useMemoryChokingWorksStore } from '@/stores/memoryChokingWorksStore'",
  'setActivePinia(createPinia())',
  'const world = useMemoryWorldStore()',
  "world.campaign.completed = [...new Set([...world.campaign.completed, 'e04', 'e05'])]",
  'const sea = useMemorySeaStore()',
  'sea.hydrate()',
  'const works = useMemoryChokingWorksStore()',
  'works.hydrate()',
  'window.__choking = { sea, works,',
  '  snapshot() { return { unlocked: works.unlocked, entry: works.entry, current: works.progress.current, visited: [...works.progress.visited], order: [...works.progress.order], decisions: { ...works.progress.decisions }, seaChoice: sea.e06Choices["4,6"] || null } },',
  '  reach() { sea.select("e06"); for (const key of ["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "4,5", "4,6"]) sea.travel(key); if (!sea.e06Choices["4,6"]) sea.choose(sea.current.choices[0].id); return works.unlocked },',
  '  advance() { const choice = works.hand.find((item) => !item.disabled); if (choice) works.choose(choice.id); const exit = works.exits[0]; if (exit) works.travel(exit); return works.progress.current },',
  '}',
].join('\n')
const bundle = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    {
      name: 'memory-choking-browser',
      setup(builder) {
        builder.onResolve(
          { filter: /^\.\/(userStore|helpers\/memoryDungeonDeckSource)$/ },
          ({ path: name, importer }) => {
            if (!importer.endsWith('/stores/memoryWorldStore.ts')) return
            return { path: name, namespace: 'memory-stub' }
          },
        )
        builder.onLoad(
          { filter: /.*/, namespace: 'memory-stub' },
          ({ path: name }) => ({
            contents:
              name === './userStore'
                ? 'export function useUserStore() { return { isLoggedIn: false, isChild: false, showMature: false } }'
                : 'export async function resolveMemoryDungeonDeck(_deck, count) { return Array.from({ length: count }, (_, i) => "/test-picture-" + i + ".webp") }',
            loader: 'ts',
            resolveDir: root,
          }),
        )
        builder.onResolve(
          { filter: /^[@~]\// },
          ({ path: name, kind, importer }) =>
            builder.resolve('./' + name.slice(2), {
              resolveDir: root,
              kind,
              importer,
            }),
        )
      },
    },
  ],
  logLevel: 'error',
})
const html =
  '<!doctype html><html><body><script>' +
  bundle.outputFiles[0].text.replaceAll('</script', '<\\/script') +
  '</script></body></html>'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const results = []
try {
  for (const width of [390, 820, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('https://memory.test/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: html }),
    )
    try {
      await page.goto('https://memory.test/')
      await page.waitForFunction(() => Boolean(window.__choking))
      assert.equal(
        await page.evaluate(() => window.__choking.works.unlocked),
        false,
      )
      assert.equal(await page.evaluate(() => window.__choking.reach()), true)
      const before = await page.evaluate(() => window.__choking.snapshot())
      assert.equal(before.seaChoice !== null, true)
      await page.evaluate(() => window.__choking.advance())
      const saved = await page.evaluate(() => window.__choking.snapshot())
      assert.equal(saved.visited.length >= before.visited.length, true)
      await page.reload()
      await page.waitForFunction(() => Boolean(window.__choking))
      const restored = await page.evaluate(() => window.__choking.snapshot())
      assert.deepEqual(
        restored,
        saved,
        width + 'px: restore room, choices, flags and entry',
      )
      assert.deepEqual(errors, [], width + 'px: no uncaught browser errors')
      results.push({ width, passed: true, room: restored.current })
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
mkdirSync('test-results/memory-browser', { recursive: true })
writeFileSync(
  'test-results/memory-browser/choking-summary.json',
  JSON.stringify({ cases: results }, null, 2) + '\n',
)
console.log(
  'Choking Works Chromium save/restore: ' +
    results.length +
    ' viewport cases passed',
)

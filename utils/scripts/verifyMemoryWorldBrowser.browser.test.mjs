import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

// Real Pinia Memory World store in Chromium: timers, localStorage and reloads are
// browser-owned. This does not substitute for rendered /play/memory device QA.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const entry = [
  "import { createPinia, setActivePinia } from 'pinia'",
  "import { trapMemoryDialogTab } from '@/utils/memoryDungeon/dialogFocus'",
  "import { useMemoryWorldStore } from '@/stores/memoryWorldStore'",
  "import { newDarkBriarProgress, DARK_BRIAR_WAVES } from '@/utils/memoryDungeon/darkBriar'",
  "import { BRIAR_REVEAL_WAVES, createBriarWaveCards } from '@/utils/memoryDungeonWaves'",
  "import { completeMemoryExperience } from '@/utils/memoryDungeon/reimaginerCampaign'",
  'setActivePinia(createPinia())',
  'const world = useMemoryWorldStore()',
  'world.hydrate()',
  'const pictures = Array.from({ length: 8 }, (_, i) => "/memory-picture-" + i + ".webp")',
  'const originalCards = () => createBriarWaveCards(BRIAR_REVEAL_WAVES[0], pictures.slice(0, 6), () => 0.5)',
  'window.__dialogFocus = trapMemoryDialogTab',
  'window.__memory = {',
  '  world,',
  '  seed(mode) {',
  '    world.state.room = "map"',
  '    world.state.wavePhase = "matching"',
  '    world.state.waveIndex = 0',
  '    world.state.mapCards = originalCards()',
  '    world.state.mapDeckSignature = JSON.stringify(world.deck)',
  '    if (mode === "dark") {',
  '      world.campaign = completeMemoryExperience(world.campaign, "e01")',
  '      world.activeReality = "e02"',
  '      world.dark = newDarkBriarProgress()',
  '      world.dark.mapCards = createBriarWaveCards(DARK_BRIAR_WAVES[0], pictures, () => 0.5)',
  '      world.dark.seenImages = [...pictures]',
  '    }',
  '    const cards = mode === "dark" ? world.dark.mapCards : world.state.mapCards',
  '    return { pair: cards.filter((card) => card.pairId === 0).map((card) => card.tile), other: cards.find((card) => card.pairId === 1).tile }',
  '  },',
  '  pick(tile) {',
  '    if (world.activeReality === "e02") world.darkPickCard(tile)',
  '    else world.pickMapCard(tile)',
  '  },',
  '  snapshot() {',
  '    const mirrored = world.activeReality === "e02"',
  '    const progress = mirrored ? world.dark : world.state',
  '    const cards = progress.mapCards',
  '    return {',
  '      active: world.activeReality,',
  '      attempts: progress.attempts,',
  '      phase: mirrored ? progress.phase : progress.wavePhase,',
  '      flipped: cards.filter((card) => card.flipped && !card.matched).map((card) => card.tile),',
  '      matched: cards.filter((card) => card.matched).map((card) => card.tile),',
  '      revealed: [...progress.revealed],',
  '      darkMatched: world.dark.mapCards.filter((card) => card.matched).map((card) => card.tile),',
  '      darkRevealed: [...world.dark.revealed],',
  '      darkAttempts: world.dark.attempts,',
  '    }',
  '  },',
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
      name: 'memory-world-browser',
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

const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
const html =
  '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
  script +
  '</script></body></html>'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const results = []

async function openCase(name) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://memory.test/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  )
  await page.goto('https://memory.test/')
  await page.waitForFunction(() => Boolean(window.__memory))
  return { name, context, page, errors }
}

async function seed(page, mode) {
  return page.evaluate((value) => window.__memory.seed(value), mode)
}

async function pick(page, tile) {
  await page.evaluate((value) => window.__memory.pick(value), tile)
}

async function snapshot(page) {
  return page.evaluate(() => window.__memory.snapshot())
}

async function reload(page) {
  await page.reload()
  await page.waitForFunction(() => Boolean(window.__memory))
}

async function run(name, callback) {
  const opened = await openCase(name)
  try {
    await callback(opened.page)
    assert.deepEqual(
      opened.errors,
      [],
      name + ': no uncaught browser exceptions',
    )
    results.push({ name, passed: true })
  } finally {
    await opened.context.close()
  }
}

try {
  await run(
    'Dark Briar paid pair survives reload before 680ms animation',
    async (page) => {
      const { pair } = await seed(page, 'dark')
      await pick(page, pair[0])
      await pick(page, pair[1])
      assert.equal((await snapshot(page)).attempts, 1)
      await reload(page)
      const recovered = await snapshot(page)
      assert.equal(recovered.attempts, 1)
      assert.equal(recovered.matched.length, 2)
      assert.equal(recovered.revealed.length, 2)
      await page.waitForTimeout(800)
      assert.deepEqual(await snapshot(page), recovered)
    },
  )

  await run(
    'Dark Briar interrupted mismatch turns down without refund',
    async (page) => {
      const { pair, other } = await seed(page, 'dark')
      await pick(page, pair[0])
      await pick(page, other)
      await reload(page)
      const recovered = await snapshot(page)
      assert.equal(recovered.attempts, 1)
      assert.deepEqual(recovered.flipped, [])
      assert.deepEqual(recovered.revealed, [])
      await page.waitForTimeout(1250)
      assert.deepEqual(await snapshot(page), recovered)
    },
  )

  await run(
    'Manual slot load cancels old timer and restores earned pair once',
    async (page) => {
      const { pair } = await seed(page, 'dark')
      assert.equal(
        await page.evaluate(() => window.__memory.world.saveCheckpoint(0)),
        true,
      )
      await pick(page, pair[0])
      await pick(page, pair[1])
      assert.equal(
        await page.evaluate(() => window.__memory.world.saveCheckpoint(1)),
        true,
      )
      assert.equal(
        await page.evaluate(() => window.__memory.world.loadCheckpoint(0)),
        true,
      )
      await page.waitForTimeout(800)
      const oldSlot = await snapshot(page)
      assert.equal(oldSlot.darkAttempts, 0)
      assert.deepEqual(oldSlot.darkMatched, [])
      assert.deepEqual(oldSlot.darkRevealed, [])
      assert.equal(
        await page.evaluate(() => window.__memory.world.loadCheckpoint(1)),
        true,
      )
      const earned = await snapshot(page)
      assert.equal(earned.darkAttempts, 1)
      assert.equal(earned.darkMatched.length, 2)
      assert.equal(earned.darkRevealed.length, 2)
      await page.waitForTimeout(800)
      assert.deepEqual(await snapshot(page), earned)
    },
  )

  await run(
    'Return to Briar settles a paid pair before cancelling animation',
    async (page) => {
      const { pair } = await seed(page, 'dark')
      await pick(page, pair[0])
      await pick(page, pair[1])
      await page.evaluate(() => window.__memory.world.returnToBriar())
      const returned = await snapshot(page)
      assert.equal(returned.active, 'e01')
      assert.equal(returned.darkAttempts, 1)
      assert.equal(returned.darkMatched.length, 2)
      assert.equal(returned.darkRevealed.length, 2)
      await page.waitForTimeout(800)
      assert.deepEqual(await snapshot(page), returned)
      await page.evaluate(() => window.__memory.world.enterDarkBriar())
      const revisited = await snapshot(page)
      assert.equal(revisited.active, 'e02')
      assert.equal(revisited.matched.length, 2)
    },
  )

  await run('Original Briar paid map pair survives reload', async (page) => {
    const { pair } = await seed(page, 'original')
    await pick(page, pair[0])
    await pick(page, pair[1])
    await reload(page)
    const recovered = await snapshot(page)
    assert.equal(recovered.attempts, 1)
    assert.equal(recovered.matched.length, 2)
    assert.equal(recovered.revealed.length, 2)
    await page.waitForTimeout(800)
    assert.deepEqual(await snapshot(page), recovered)
  })

  for (const width of [390, 768, 1440]) {
    await run('Dialog Tab cycle stays contained at ' + width + 'px', async (page) => {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => {
        document.body.insertAdjacentHTML(
          'beforeend',
          '<button id="outside">Map action</button><section id="dialog" tabindex="-1" role="dialog" aria-modal="true"><button id="first">First choice</button><button disabled>Unavailable</button><button style="display:none">Hidden</button><button id="last">Close</button></section>',
        )
        const dialog = document.getElementById('dialog')
        dialog.addEventListener('keydown', (event) => window.__dialogFocus(event, dialog))
        document.getElementById('last').focus()
      })
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.activeElement.id), 'first')
      await page.keyboard.press('Shift+Tab')
      assert.equal(await page.evaluate(() => document.activeElement.id), 'last')
      await page.evaluate(() => document.getElementById('dialog').focus())
      await page.keyboard.press('Shift+Tab')
      assert.equal(await page.evaluate(() => document.activeElement.id), 'last')
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.activeElement.id), 'first')
    })
  }

  await run(
    'Original Briar first flip survives reload and can finish its pair',
    async (page) => {
      const { pair } = await seed(page, 'original')
      await pick(page, pair[0])
      await reload(page)
      const first = await snapshot(page)
      assert.equal(first.attempts, 0)
      assert.deepEqual(first.flipped, [pair[0]])
      await pick(page, pair[1])
      await page.waitForTimeout(800)
      const completed = await snapshot(page)
      assert.equal(completed.attempts, 1)
      assert.equal(completed.matched.length, 2)
      assert.equal(completed.revealed.length, 2)
    },
  )
} finally {
  await browser.close()
}

mkdirSync('test-results/memory-browser', { recursive: true })
writeFileSync(
  'test-results/memory-browser/summary.json',
  JSON.stringify({ cases: results, count: results.length }, null, 2) + '\n',
)
console.log(
  'Memory Dungeon Chromium interruption tests: ' + results.length + ' passed',
)

import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileStyle } from '@vue/compiler-sfc'
import { parse as parseYaml } from 'yaml'
import { build } from 'esbuild'
import { chromium } from 'playwright'

// Conductor rainbow t-015: the private flight deck's help and controls, proven through the actual shared
// ArcadeCabinet and the actual tutorial flyer that renders the admin tab's help, in Chromium at phone,
// tablet and desktop widths. Stores are stubbed (no network); the components, the cabinet's input
// seating and the Rainbow engine are the real ones. Synthetic keyboard and gamepad input is not
// physical-device evidence.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SLUG = 'rainbow-bullet-hell-space-princess'
const frontMatter = (file) =>
  parseYaml(readFileSync(path.join(root, file), 'utf8').split('---')[1])
const content = [
  frontMatter('content/channels/admin/index.md'),
  frontMatter(`content/channels/admin/${SLUG}.md`),
]

const stores = {
  arcadeStore: `
    import { reactive } from 'vue'
    export function useArcadeStore() {
      if (window.__arcadeStore) return window.__arcadeStore
      const seated = {}
      window.__arcadeStore = reactive({
        muted: true, volume: 0, crt: false, stillCamera: false, offline: false,
        lastSubmittedId: null, savedInitials: '',
        board: () => [], fetchBoard: async () => {}, masteryFor: () => [], recordMastery() {},
        awardRunAchievements: async () => {}, awardFeats: async () => {}, submitScore: async () => ({ success: false }),
        styleFor: () => 'hd', setGameStyle() {}, setVolume() {}, setMuted() {}, setCrt() {},
        setStillCamera() {}, rememberInitials() {}, saveFor: () => undefined, recordSave() {},
        loadPreferences() {}, flushPending: async () => {},
        playersFor: (game, max) => Math.max(1, Math.min(max, seated[game] ?? window.__seats ?? 1)),
        setPlayers(game, count) { seated[game] = count },
      })
      return window.__arcadeStore
    }`,
  userStore: `export function useUserStore() { return { user: null } }`,
  channelContentStore: `
    import { resolveChannels } from '@/stores/helpers/channelContent'
    export function useChannelContentStore() {
      const channels = resolveChannels(window.__content)
      return {
        initialize: async () => {},
        getChannel: (key) => channels.find((channel) => channel.channelKey === key) ?? null,
        getTab: (channelKey, tabKey) =>
          channels.find((channel) => channel.channelKey === channelKey)?.tabs.find((tab) => tab.key === tabKey) ?? null,
      }
    }`,
  tutorialStore: `
    export function useTutorialStore() {
      return { activeChannel: null, close() {}, maybeAutoOpen() {}, setShowForChannel() {}, shouldAutoShow: () => false }
    }`,
}

const styles = []
let scopeCounter = 0
const vuePlugin = {
  name: 'fixture',
  setup(builder) {
    builder.onResolve(
      {
        filter:
          /^@\/stores\/(arcadeStore|userStore|channelContentStore|tutorialStore)$/,
      },
      ({ path: name }) => ({
        path: name.split('/').pop(),
        namespace: 'store-stub',
      }),
    )
    builder.onLoad(
      { filter: /.*/, namespace: 'store-stub' },
      ({ path: name }) => ({
        contents: stores[name],
        loader: 'ts',
        resolveDir: root,
      }),
    )
    builder.onResolve(
      { filter: /^[@~]\// },
      async ({ path: name, kind, importer }) => {
        const resolved = await builder.resolve('./' + name.slice(2), {
          resolveDir: root,
          kind,
          importer,
        })
        return resolved
      },
    )
    // Expose each Rainbow engine the cabinet creates, so the fixture can read its snapshot.
    builder.onLoad(
      { filter: /rainbowPrincessPreview\.ts$/ },
      ({ path: file }) => {
        const source = readFileSync(file, 'utf8').replace(
          'export function createRainbowPrincessPreview(',
          'function createRainbowPrincessPreviewInner(',
        )
        return {
          contents:
            source +
            `\nexport function createRainbowPrincessPreview(options) {
            const game = createRainbowPrincessPreviewInner(options)
            ;(window.__games ||= []).push({ demo: Boolean(options.demo), game })
            return game
          }\n`,
          loader: 'ts',
          resolveDir: path.dirname(file),
        }
      },
    )
    builder.onLoad({ filter: /\.vue$/ }, ({ path: file }) => {
      const { descriptor } = parse(readFileSync(file, 'utf8'), {
        filename: file,
      })
      const id = `f${scopeCounter++}`
      const scoped = descriptor.styles.some((style) => style.scoped)
      for (const style of descriptor.styles) {
        styles.push(
          compileStyle({
            source: style.content,
            filename: file,
            id: `data-v-${id}`,
            scoped: style.scoped,
          }).code,
        )
      }
      const script = compileScript(descriptor, {
        id,
        inlineTemplate: true,
        templateOptions: {
          scoped,
          compilerOptions: { scopeId: scoped ? `data-v-${id}` : undefined },
        },
      })
      // Like a bundler's Vue plugin, tag the component with its scope id so scoped styles match.
      const contents = scoped
        ? script.content.replace('export default ', 'const __sfc__ = ') +
          `\n__sfc__.__scopeId = 'data-v-${id}'\nexport default __sfc__\n`
        : script.content
      return { contents, loader: 'ts', resolveDir: path.dirname(file) }
    })
  },
}

const entry = `
import { createApp, h, Suspense } from 'vue'
import ArcadeCabinet from '@/components/arcade/arcade-cabinet.vue'
import TutorialFlyer from '@/components/navigation/tutorial-flyer.vue'
createApp({
  render: () => h('main', { id: 'deck' }, [
    h('section', { id: 'help' }, [h(Suspense, null, { default: () => h(TutorialFlyer, { channel: 'admin', tab: '${SLUG}', inline: true }) })]),
    h('section', { id: 'cabinet' }, [h(ArcadeCabinet, { slug: '${SLUG}' })]),
  ]),
}).mount('#app')
`
const bundled = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [vuePlugin],
  logLevel: 'error',
})

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RAINBOW_CABINET_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

async function open(width, height, seats = 1) {
  const page = await browser.newPage({ viewport: { width, height } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setContent(
    '<!doctype html><html><head></head><body style="margin:0"><div id="app"></div></body></html>',
  )
  await page.evaluate(
    ({ items, seatCount }) => {
      window.__content = items
      window.__seats = seatCount
      window.__pads = []
      navigator.getGamepads = () => window.__pads
    },
    { items: content, seatCount: seats },
  )
  // The site's Tailwind preflight sizes every box by its border; the fixture keeps that one global rule.
  await page.addStyleTag({
    content: '*,::before,::after{box-sizing:border-box}\n' + styles.join('\n'),
  })
  await page.addScriptTag({ content: bundled.outputFiles[0].text })
  await page.waitForSelector('#cabinet canvas')
  await page.waitForFunction(() =>
    document
      .querySelector('#help')
      ?.textContent.includes('Princess pilot training'),
  )
  return { page, errors }
}

const play = (page) =>
  page.evaluate(() => {
    const run = (window.__games ?? []).filter((entry) => !entry.demo).at(-1)
    return run
      ? {
          tick: run.game.snapshot.tick,
          ships: run.game.snapshot.ships.map((ship) => ({
            x: ship.x,
            y: ship.y,
            lives: ship.lives,
          })),
        }
      : null
  })
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function startRun(page) {
  await page.keyboard.press('Enter')
  await page.waitForFunction(() =>
    (window.__games ?? []).some(
      (entry) => !entry.demo && entry.game.snapshot.tick > 30,
    ),
  )
}
async function advancing(page, ms = 400) {
  const before = (await play(page)).tick
  await wait(ms)
  return (await play(page)).tick - before
}
async function hold(page, key, ms = 450) {
  await page.keyboard.down(key)
  await wait(ms)
  await page.keyboard.up(key)
  await wait(60)
}
async function padButton(page, pad, button, pressed) {
  await page.evaluate(
    ({ pad, button, pressed }) => {
      const buttons = Array.from({ length: 17 }, (_, index) => ({
        pressed: index === button && pressed,
        value: 0,
      }))
      window.__pads[pad] = {
        index: pad,
        id: 'fixture pad',
        connected: true,
        mapping: 'standard',
        buttons,
        axes: [0, 0, 0, 0],
        timestamp: performance.now(),
      }
    },
    { pad, button, pressed },
  )
}

const summary = []
try {
  // 1. Help and cabinet at phone, tablet and desktop widths.
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    const { page, errors } = await open(width, height)
    const layout = await page.evaluate(() => {
      const help = document.querySelector('#help')
      const visibleText = help.innerText
      const canvas = document
        .querySelector('#cabinet canvas')
        .getBoundingClientRect()
      return {
        visibleText,
        canvasWidth: canvas.width,
        canvasRight: canvas.right,
        pageWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }
    })
    for (const heading of [
      'Princess pilot training',
      'Flight controls',
      'Read the battlefield',
      'Checkpoints and continues',
      'Future campaign',
    ])
      assert.ok(
        layout.visibleText.includes(heading),
        `${width}px help shows ${heading}`,
      )
    assert.match(
      layout.visibleText,
      /CONTINUE\? countdown/,
      `${width}px help explains continues`,
    )
    assert.ok(
      layout.canvasWidth > 0 && layout.canvasRight <= layout.viewport + 1,
      `${width}px cabinet screen fits`,
    )
    assert.ok(
      layout.pageWidth <= layout.viewport + 1,
      `${width}px page has no sideways scroll (${layout.pageWidth})`,
    )
    if (shots)
      await page.screenshot({
        path: path.join(shots, `flight-deck-${width}.png`),
        fullPage: true,
      })
    assert.deepEqual(errors, [], `${width}px renders without page errors`)
    await page.close()
    summary.push(`${width}px help+cabinet`)
  }

  // 2. One pilot: keyboard start, keyboard pause, gamepad Start pause and resume.
  {
    const { page, errors } = await open(1440, 900)
    await startRun(page)
    assert.ok((await advancing(page)) > 10, 'the run plays after Enter')
    await page.keyboard.press('KeyP')
    assert.equal(await advancing(page), 0, 'P pauses the run')
    await page.keyboard.press('KeyP')
    assert.ok((await advancing(page)) > 10, 'P resumes the run')
    await page.keyboard.press('Escape')
    assert.equal(await advancing(page), 0, 'Escape pauses the run')
    await page.keyboard.press('Enter')
    assert.ok((await advancing(page)) > 10, 'Enter resumes from pause')

    await padButton(page, 0, -1, false)
    await page.evaluate(() =>
      window.dispatchEvent(new Event('gamepadconnected')),
    )
    await wait(100)
    await padButton(page, 0, 9, true)
    await wait(120)
    await padButton(page, 0, 9, false)
    const lives = (await play(page)).ships[0].lives
    assert.equal(await advancing(page), 0, 'gamepad Start pauses the run')
    await padButton(page, 0, 9, true)
    await wait(120)
    await padButton(page, 0, 9, false)
    assert.ok((await advancing(page)) > 10, 'gamepad Start resumes the run')
    assert.equal(
      (await play(page)).ships[0].lives,
      lives,
      'pausing refills nothing',
    )
    if (shots)
      await page.screenshot({ path: path.join(shots, 'one-pilot-playing.png') })
    assert.deepEqual(errors, [])
    await page.close()
    summary.push('keyboard+gamepad pause')
  }

  // 3. Two pilots split the keyboard: WASD flies pilot 1 only, the arrows fly pilot 2 only.
  {
    const { page, errors } = await open(1440, 900, 2)
    await startRun(page)
    let before = await play(page)
    assert.equal(before.ships.length, 2, 'two pilots seated')
    await hold(page, 'KeyS')
    let after = await play(page)
    assert.ok(after.ships[0].y > before.ships[0].y + 10, 'S moves pilot 1 down')
    assert.equal(after.ships[1].y, before.ships[1].y, 'S leaves pilot 2 alone')
    before = after
    await hold(page, 'ArrowUp')
    after = await play(page)
    assert.ok(
      after.ships[1].y < before.ships[1].y - 10,
      'the up arrow moves pilot 2 up',
    )
    assert.equal(
      after.ships[0].y,
      before.ships[0].y,
      'the arrows leave pilot 1 alone',
    )
    assert.deepEqual(errors, [])
    await page.close()
    summary.push('2P split keyboard')
  }

  // 4. Three pilots with one gamepad: the pad goes to pilot 3, who has no keys of their own.
  {
    const { page, errors } = await open(1440, 900, 3)
    await padButton(page, 0, -1, false)
    await page.evaluate(() =>
      window.dispatchEvent(new Event('gamepadconnected')),
    )
    await startRun(page)
    const before = await play(page)
    assert.equal(before.ships.length, 3, 'three pilots seated')
    await padButton(page, 0, 13, true)
    await wait(450)
    await padButton(page, 0, 13, false)
    await wait(60)
    const after = await play(page)
    assert.ok(
      after.ships[2].y > before.ships[2].y + 10,
      'the pad moves pilot 3 down',
    )
    assert.equal(
      after.ships[0].y,
      before.ships[0].y,
      'the pad leaves pilot 1 alone',
    )
    assert.equal(
      after.ships[1].y,
      before.ships[1].y,
      'the pad leaves pilot 2 alone',
    )
    assert.deepEqual(errors, [])
    await page.close()
    summary.push('3P gamepad seat')
  }
} finally {
  await browser.close()
}
console.log(`rainbow cabinet browser fixture: ok (${summary.join('; ')})`)

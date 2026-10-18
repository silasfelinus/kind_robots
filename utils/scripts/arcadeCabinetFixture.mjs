import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileStyle } from '@vue/compiler-sfc'
import { parse as parseYaml } from 'yaml'
import { build } from 'esbuild'

// Shared browser fixture for the actual ArcadeCabinet (and the tutorial flyer that renders a Play tab's
// help). Compiles the real single-file components with esbuild, stubs only the stores (no network), and
// wraps the Rainbow engine's create so a test can read its snapshot. Used by the Rainbow cabinet help/
// controls contract (t-015) and the touch replay contract (t-018).

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const frontMatter = (file) =>
  parseYaml(readFileSync(path.join(root, file), 'utf8').split('---')[1])

/** The Play channel and one playable tab, as the content store would resolve them. */
export function playTabContent(tab) {
  return [
    frontMatter('content/channels/arcade/index.md'),
    frontMatter(`content/channels/arcade/${tab}.md`),
  ]
}

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
        setStillCamera() {}, difficulties: {},
        difficultyFor(game) { return this.difficulties[game] ?? 'normal' },
        setDifficulty(game, level) { this.difficulties[game] = level },
        rememberInitials() {}, saveFor: () => undefined, recordSave() {},
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

const entry = `
import { createApp, h, Suspense } from 'vue'
import ArcadeCabinet from '@/components/arcade/arcade-cabinet.vue'
import TutorialFlyer from '@/components/navigation/tutorial-flyer.vue'
createApp({
  render: () => h('main', { id: 'deck' }, [
    window.__help
      ? h('section', { id: 'help' }, [h(Suspense, null, { default: () => h(TutorialFlyer, { channel: 'arcade', tab: window.__help, inline: true }) })])
      : null,
    h('section', { id: 'cabinet' }, [h(ArcadeCabinet, { slug: window.__slug })]),
  ]),
}).mount('#app')
`

/** Bundle the fixture once: the page script and the components' compiled styles. */
export async function bundleCabinetFixture() {
  const styles = []
  let scopeCounter = 0
  const plugin = {
    name: 'arcade-cabinet-fixture',
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
        ({ path: name, kind, importer }) =>
          builder.resolve('./' + name.slice(2), {
            resolveDir: root,
            kind,
            importer,
          }),
      )
      // Expose each Rainbow engine the cabinet creates, so a test can read its snapshot.
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
    plugins: [plugin],
    logLevel: 'error',
  })
  return { script: bundled.outputFiles[0].text, styles: styles.join('\n') }
}

/**
 * Open a page with the fixture mounted. `touch` gives a coarse-pointer phone-like context, so the
 * cabinet shows its on-screen controls. `help` names a Play tab whose tutorial is mounted above.
 */
export async function openCabinet(
  browser,
  fixture,
  { slug, width, height, seats = 1, touch = false, help = null },
) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setContent(
    '<!doctype html><html><head></head><body style="margin:0"><div id="app"></div></body></html>',
  )
  await page.evaluate(
    ({ items, seatCount, game, tab }) => {
      window.__content = items
      window.__seats = seatCount
      window.__slug = game
      window.__help = tab
      window.__pads = []
      navigator.getGamepads = () => window.__pads
    },
    {
      items: help ? playTabContent(help) : [],
      seatCount: seats,
      game: slug,
      tab: help,
    },
  )
  // The site's Tailwind preflight sizes every box by its border; the fixture keeps that one global rule.
  await page.addStyleTag({
    content: '*,::before,::after{box-sizing:border-box}\n' + fixture.styles,
  })
  await page.addScriptTag({ content: fixture.script })
  await page.waitForSelector('#cabinet canvas')
  return { page, errors, context }
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** The newest non-demo Rainbow run's tick and ships, or null before one starts. */
export function rainbowRun(page) {
  return page.evaluate(() => {
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
}

/**
 * Press Start, launch through the pilot select with the defaults (A after its beat, the way a player
 * does), and wait until a Rainbow run has played its first half second.
 */
export async function startRainbowRun(page) {
  await page.keyboard.press('Enter')
  await page.waitForFunction(() =>
    (window.__games ?? []).some((entry) => !entry.demo),
  )
  if (
    await page.evaluate(
      () =>
        (window.__games ?? []).filter((entry) => !entry.demo).at(-1)?.game
          .snapshot.selectMenu,
    )
  ) {
    await wait(500)
    await page.keyboard.press('KeyZ')
  }
  await page.waitForFunction(() =>
    (window.__games ?? []).some(
      (entry) => !entry.demo && entry.game.snapshot.tick > 30,
    ),
  )
}

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileStyle } from '@vue/compiler-sfc'
import { parse as parseYaml } from 'yaml'
import { build } from 'esbuild'

// Shared browser fixture for the actual ArcadeCabinet (and the tutorial flyer that renders a Play tab's
// help). Compiles the real single-file components with esbuild, stubs only the stores (no network), and
// wraps the Rainbow engine's and Rescue Rally's create so a test can read (and stage) their games. Used
// by the Rainbow cabinet help/controls contract (t-015), the touch replay contract (t-018) and the
// Rescue Rally seat contract (kr-arcade t-147). With `realArcadeStore` the cabinet runs on the real
// arcade store (saves, seats, preferences in localStorage), for the Battery Maze save contract (t-148).

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
        awardRunAchievements: async () => {}, awardFeats: async () => {}, awardMasteryAchievements: async () => {}, submitScore: async () => ({ success: false }),
        styleFor: () => 'hd', setGameStyle() {}, setVolume() {}, setMuted() {}, setCrt() {},
        setStillCamera() {}, difficulties: {},
        highContrast: false, comms: 'full', keyRemaps: {},
        setHighContrast(on) { this.highContrast = on },
        setComms(level) { this.comms = level },
        keyRemapFor(game) { return this.keyRemaps[game] ?? {} },
        setKeyRemap(game, button, code) {
          const next = { ...(this.keyRemaps[game] ?? {}) }
          for (const other of Object.keys(next)) if (next[other] === code) delete next[other]
          if (code) next[button] = code
          else delete next[button]
          this.keyRemaps = { ...this.keyRemaps, [game]: next }
        },
        difficultyFor(game) { return this.difficulties[game] ?? 'normal' },
        setDifficulty(game, level) { this.difficulties[game] = level },
        rememberInitials() {}, saveFor: () => undefined, recordSave() {},
        plumberCloudStatus: 'local', syncPlumberCareer: async () => {}, retryPlumberCareer() {},
        rainbowHangarBonuses: () => ({ shield: false, charge: false, life: false }),
        livery: { callSign: '', paints: [0, 0, 0, 0] },
        rainbowLivery() { return this.livery },
        loadPreferences() {}, flushPending: async () => {},
        playersFor: (game, max) => Math.max(1, Math.min(max, seated[game] ?? window.__seats ?? 1)),
        setPlayers(game, count) { seated[game] = count },
      })
      return window.__arcadeStore
    }`,
  // Opt-in (window.__user, set by openCabinet's \`account\`): a signed-in player for account sync.
  userStore: `export function useUserStore() { return window.__user ?? { user: null } }`,
  supportStore: `export function useSupportStore() { return { recordRunFinished() {} } }`,
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

// With the real arcade store (kr-arcade t-148) only its network and achievement neighbours are stubbed:
// saves, seats and preferences go through the store itself and this page's localStorage.
const realStoreNeighbours = {
  arcadeFetch: `export async function performFetch() { return { success: false, message: 'fixture: offline', status: 0 } }`,
  // Opt-in (window.__recordAwards): record each site achievement the cabinet awards in window.__awarded.
  arcadeAchievements: `export function useAchievementStore() {
    return {
      hasEarnedCode: (code) => (window.__recordAwards ? (window.__awarded ?? []).includes(code) : true),
      rewardAchievementByCode: async (code) => { if (window.__recordAwards) (window.__awarded ||= []).push(code) },
    }
  }`,
}

const entryFor = (realStore) => `
import { createApp, h, Suspense } from 'vue'
${realStore ? "import { createPinia } from 'pinia'" : ''}
import ArcadeCabinet from '@/components/arcade/arcade-cabinet.vue'
import TutorialFlyer from '@/components/navigation/tutorial-flyer.vue'
const app = createApp({
  render: () => h('main', { id: 'deck' }, [
    window.__help
      ? h('section', { id: 'help' }, [h(Suspense, null, { default: () => h(TutorialFlyer, { channel: 'arcade', tab: window.__help, inline: true }) })])
      : null,
    h(
      'section',
      {
        id: 'cabinet',
        style: window.__containedHeight
          ? { height: window.__containedHeight + 'px', display: 'flex', flexDirection: 'column' }
          : null,
      },
      [h(ArcadeCabinet, { slug: window.__slug, contained: Boolean(window.__containedHeight) })],
    ),
  ]),
})
${realStore ? 'app.use(createPinia())' : ''}
app.mount('#app')
window.__app = app
`

/** Games whose instances the fixture records on `window`, so a test can read (and stage) them. */
const exposed = [
  { file: /games\/brickBloom\.ts$/, ctor: 'BrickBloom', list: '__blooms' },
  { file: /games\/rescueRally\.ts$/, ctor: 'RescueRally', list: '__rallies' },
  { file: /games\/batteryMaze\.ts$/, ctor: 'BatteryMaze', list: '__batteries' },
  {
    file: /games\/bumperBubbles\.ts$/,
    ctor: 'BumperBubbles',
    list: '__bubbles',
  },
  {
    file: /games\/butterflyBlaster\.ts$/,
    ctor: 'ButterflyBlaster',
    list: '__butterflies',
  },
  {
    file: /games\/cableCrawler\.ts$/,
    ctor: 'CableCrawler',
    list: '__crawlers',
  },
  {
    file: /games\/ribbonRiders\.ts$/,
    ctor: 'RibbonRiders',
    list: '__ribbons',
  },
]

/**
 * Bundle the fixture once: the page script and the components' compiled styles. `realArcadeStore`
 * uses stores/arcadeStore.ts itself (with Pinia) instead of the in-memory stand-in.
 */
export async function bundleCabinetFixture({ realArcadeStore = false } = {}) {
  const styles = []
  let scopeCounter = 0
  const stubbed = [
    ...(realArcadeStore ? [] : ['arcadeStore']),
    'userStore',
    'channelContentStore',
    'tutorialStore',
    'supportStore',
  ]
  const plugin = {
    name: 'arcade-cabinet-fixture',
    setup(builder) {
      builder.onResolve(
        { filter: new RegExp(`^@/stores/(${stubbed.join('|')})$`) },
        ({ path: name }) => ({
          path: name.split('/').pop(),
          namespace: 'store-stub',
        }),
      )
      if (realArcadeStore)
        builder.onResolve(
          { filter: /^\.\/(utils|achievementStore)$/ },
          ({ path: name, importer }) =>
            importer.endsWith(path.join('stores', 'arcadeStore.ts'))
              ? {
                  path:
                    name === './utils' ? 'arcadeFetch' : 'arcadeAchievements',
                  namespace: 'store-neighbour',
                }
              : undefined,
        )
      builder.onLoad(
        { filter: /.*/, namespace: 'store-neighbour' },
        ({ path: name }) => ({
          contents: realStoreNeighbours[name],
          loader: 'ts',
          resolveDir: root,
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
      builder.onLoad(
        { filter: /games\/savePlumberPreview\.ts$/ },
        ({ path: file }) => {
          const source = readFileSync(file, 'utf8')
          const marker = 'export function createSavePlumberPreview('
          if (!source.includes(marker))
            throw new Error('Save the Plumber fixture hook lost its create()')
          return {
            contents:
              source.replace(
                marker,
                'function createSavePlumberPreviewInner(',
              ) +
              '\nexport function createSavePlumberPreview(options: ArcadeGameOptions, run: PlumberRunOptions = {}): PlumberRun {\n  const game = createSavePlumberPreviewInner(options, run)\n  ;(window.__plumbers ||= []).push({ demo: Boolean(options.demo), game })\n  return game\n}\n',
            loader: 'ts',
            resolveDir: path.dirname(file),
          }
        },
      )
      // Record each soundtrack mixer the cabinet creates, so a test can read its game mix.
      builder.onLoad({ filter: /soundtrackMixer\.ts$/ }, ({ path: file }) => {
        const source = readFileSync(file, 'utf8')
        const marker = 'export function createArcadeSoundtrack('
        if (!source.includes(marker))
          throw new Error('Soundtrack fixture hook lost createArcadeSoundtrack')
        return {
          contents:
            source.replace(marker, 'function createArcadeSoundtrackInner(') +
            '\nexport function createArcadeSoundtrack(base: ArcadeSound, options: SoundtrackOptions): ArcadeSoundtrack {\n  const mixer = createArcadeSoundtrackInner(base, options)\n  ;(window.__soundtracks ||= []).push(mixer)\n  return mixer\n}\n',
          loader: 'ts',
          resolveDir: path.dirname(file),
        }
      })
      // Superkate's Spectrum: the cabinet calls the module's named create export.
      builder.onLoad(
        { filter: /games\/superkateSpectrum\.ts$/ },
        ({ path: file }) => {
          const source = readFileSync(file, 'utf8')
          const marker =
            'export const create = (options: ArcadeGameOptions) =>\n  new SuperkateSpectrum(options)'
          if (!source.includes(marker))
            throw new Error('Superkate Spectrum fixture hook lost its create()')
          return {
            contents: source.replace(
              marker,
              `export const create = (options: ArcadeGameOptions) => {
              const game = new SuperkateSpectrum(options)
              ;(window.__spectrums ||= []).push({ demo: Boolean(options.demo), game })
              return game
            }`,
            ),
            loader: 'ts',
            resolveDir: path.dirname(file),
          }
        },
      )
      // Record each Rescue Rally and Battery Maze game the cabinet creates.
      for (const { file: filter, ctor, list } of exposed) {
        builder.onLoad({ filter }, ({ path: file }) => {
          const marker = `create: (options) => new ${ctor}(options),`
          const source = readFileSync(file, 'utf8')
          if (!source.includes(marker))
            throw new Error(`${ctor}: the fixture hook lost its create()`)
          return {
            contents: source.replace(
              marker,
              `create: (options) => {
              const game = new ${ctor}(options)
              ;(window.${list} ||= []).push({ demo: Boolean(options.demo), game })
              return game
            },`,
            ),
            loader: 'ts',
            resolveDir: path.dirname(file),
          }
        })
      }
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
    stdin: {
      contents: entryFor(realArcadeStore),
      resolveDir: root,
      loader: 'ts',
    },
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
  return {
    script: bundled.outputFiles[0].text,
    styles: styles.join('\n'),
    realStore: realArcadeStore,
  }
}

const PAGE =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><div id="app"></div></body></html>'
/** A real (routed, never fetched) origin, so the real store has localStorage to read and write. */
const ORIGIN = 'http://arcade-cabinet.fixture.test/'

/**
 * Open a page with the fixture mounted. `touch` gives a coarse-pointer phone-like context, so the
 * cabinet shows its on-screen controls. `help` names a Play tab whose tutorial is mounted above.
 * `storage` seeds localStorage (key -> JSON value) before the cabinet mounts (real store only).
 * `containedHeight` mounts the cabinet `contained` in a box that tall, the way a game page gives it the
 * height left under the site header.
 */
export async function openCabinet(
  browser,
  fixture,
  {
    slug,
    width,
    height,
    seats = 1,
    touch = false,
    help = null,
    dpr = 1,
    storage = null,
    audioProbe = false,
    serveArt = false,
    mediaDir = null,
    account = null,
    routes = [],
    containedHeight = 0,
  },
) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    hasTouch: touch,
    isMobile: touch,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  if (fixture.realStore) {
    await page.route(`${ORIGIN}**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: PAGE }),
    )
    // Opt-in: serve the game's real art and audio from public/ (later routes take precedence in Playwright).
    if (serveArt)
      await page.route(
        new RegExp(`^${ORIGIN}(rainbow-princess-[a-z]+/.+)$`),
        (route) => {
          const file = path.join(
            root,
            'public',
            decodeURIComponent(new URL(route.request().url()).pathname),
          )
          try {
            route.fulfill({
              body: readFileSync(file),
              contentType: file.endsWith('.webp')
                ? 'image/webp'
                : file.endsWith('.mp3')
                  ? 'audio/mpeg'
                  : 'application/octet-stream',
            })
          } catch {
            route.fulfill({ status: 404, body: '' })
          }
        },
      )
    // Opt-in: extra routes on this origin (e.g. a mock account API), as [RegExp, handler] pairs.
    for (const [pattern, handler] of routes) await page.route(pattern, handler)
    // Opt-in: serve /images/... (the site's external media origin) from a local copy, for visual QA.
    if (mediaDir)
      await page.route(new RegExp(`^${ORIGIN}images/(.+)$`), (route) => {
        const file = path.join(
          mediaDir,
          decodeURIComponent(new URL(route.request().url()).pathname).slice(
            '/images/'.length,
          ),
        )
        try {
          route.fulfill({
            body: readFileSync(file),
            contentType: file.endsWith('.webp')
              ? 'image/webp'
              : 'application/octet-stream',
          })
        } catch {
          route.fulfill({ status: 404, body: '' })
        }
      })
    await page.goto(ORIGIN)
  } else {
    await page.setContent(PAGE)
  }
  if (audioProbe) {
    await page.evaluate(() => {
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
  }
  if (account) await signIn(page, account)
  await mountCabinet(page, fixture, {
    slug,
    seats,
    help,
    storage,
    containedHeight,
  })
  return { page, errors, context }
}

/**
 * Sign a page in as `account` ({ id, token }) for the stubbed user store, and give it the global
 * \`$fetch\` Nuxt provides (throwing with .status on a non-2xx reply), so account sync really runs.
 * Pass null to sign out. Takes effect at the next mount (openCabinet / reopenCabinet).
 */
export async function signIn(page, account) {
  // Installed now and on every later load (a reopen reloads the page).
  await page.addInitScript(installAccount, account)
  await page.evaluate(installAccount, account)
}

/** Runs in the page: the stubbed user store's player and a minimal Nuxt \`$fetch\`. */
function installAccount(account) {
  window.__user = account
    ? {
        user: { id: account.id },
        authenticatedUserId: account.id,
        token: account.token,
      }
    : null
  window.$fetch = async (url, options = {}) => {
    const reply = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    const data = await reply.json().catch(() => null)
    if (!reply.ok) {
      const error = new Error(data?.message ?? 'fetch failed')
      error.status = reply.status
      error.statusCode = reply.status
      throw error
    }
    return data
  }
}

/**
 * Leave the cabinet the way the site does (the app unmounts, so the cabinet keeps its game's save),
 * then load the page again and mount a fresh cabinet over the same localStorage (real store only).
 */
export async function reopenCabinet(page, fixture, { slug, seats = 1 }) {
  await page.evaluate(() => window.__app?.unmount())
  await page.reload()
  await mountCabinet(page, fixture, { slug, seats })
}

async function mountCabinet(
  page,
  fixture,
  { slug, seats, help, storage, containedHeight = 0 },
) {
  await page.evaluate(
    ({ items, seatCount, game, tab, storage, containedHeight }) => {
      window.__content = items
      window.__seats = seatCount
      window.__slug = game
      window.__help = tab
      window.__containedHeight = containedHeight
      window.__pads = []
      navigator.getGamepads = () => window.__pads
      for (const [key, value] of Object.entries(storage ?? {}))
        localStorage.setItem(key, JSON.stringify(value))
    },
    {
      items: help ? playTabContent(help) : [],
      seatCount: seats,
      game: slug,
      tab: help,
      storage,
      containedHeight,
    },
  )
  // The site's Tailwind preflight sizes every box by its border; the fixture keeps that one global rule.
  await page.addStyleTag({
    content: '*,::before,::after{box-sizing:border-box}\n' + fixture.styles,
  })
  await page.addScriptTag({ content: fixture.script })
  await page.waitForSelector('#cabinet canvas')
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
            specialCooldown: ship.specialCooldown,
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

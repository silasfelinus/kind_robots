import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Superkate's Spectrum hub through the actual ArcadeCabinet and the real arcade store, in Chromium
// (conductor kr-arcade t-187). A mid-campaign career is seeded; at 390 and 768 by touch and at 1440 by
// keyboard, the Scrapbook pages through all six districts (earned boss memories vs locked ones), the
// Achievements pages through all nine trophies, Settings toggles every row and the volume, and the
// choices survive leaving and reopening the cabinet. SPECTRUM_MEDIA_DIR (optional) serves a local copy
// of the site's /images for screenshots with the real art; without it the drawn fallbacks show.

const SLUG = 'superkate-spectrum'
const SAVES_KEY = 'kr-arcade-saves'
const W = 320
const H = 480

const stars = Array.from({ length: 30 }, (_, i) =>
  i < 10 ? 3 : i < 14 ? 2 : 0,
)
const seeded = {
  version: 2,
  career: {
    xp: 12000,
    highestStage: 15,
    stars,
    lifetimePops: 900,
    classicBest: 4200,
    classicRuns: 3,
    relayBest: 0,
    relayRounds: 0,
  },
  mode: 'story',
  stage: 15,
  style: 'glass',
  settings: {
    aimGuide: true,
    particles: true,
    highContrast: false,
    music: true,
    effects: true,
  },
  storyChoices: [0, null, null],
  endings: [],
}

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.SPECTRUM_HUB_SHOTS
if (shots) mkdirSync(shots, { recursive: true })
const mediaDir = process.env.SPECTRUM_MEDIA_DIR || null

const hub = (page) =>
  page.evaluate(() => {
    const game = (window.__spectrums ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      menu: game.choosingMode,
      tab: game.menuTab,
      album: game.albumChapter,
      trophyPage: game.trophyPage,
      optionRow: game.optionRow,
      settings: { ...game.settings },
      audio: { ...game.audio },
      memories: [0, 1, 2, 3, 4, 5].map((chapter) =>
        game.trophyEarned(`chapter-${chapter + 1}`),
      ),
      trophies: [
        'rainbow-rescue',
        'color-alchemist',
        'true-spectrum',
        'chapter-1',
        'chapter-2',
        'chapter-3',
        'chapter-4',
        'chapter-5',
        'chapter-6',
      ].filter((id) => game.trophyEarned(id)),
    }
  })

function touchStage(page, type, x, y) {
  return page.evaluate(
    ({ type, fx, fy }) => {
      const el = document.querySelector('.cabinet-canvas')
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX: rect.left + rect.width * fx,
          clientY: rect.top + rect.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { type, fx: x / W, fy: y / H },
  )
}
async function tap(page, x, y) {
  await touchStage(page, 'pointerdown', x, y)
  await wait(40)
  await touchStage(page, 'pointerup', x, y)
  await wait(90)
}
async function key(page, code) {
  await page.keyboard.down(code)
  await wait(70)
  await page.keyboard.up(code)
  await wait(90)
}

async function start(page, touch) {
  if (touch) await tap(page, 160, 240)
  else await page.keyboard.press('Enter')
  await page.waitForFunction(() =>
    (window.__spectrums ?? []).some((entry) => !entry.demo),
  )
  await wait(400)
}

/** Move to a hub tab: tap it, or X (keyboard C) until it is up. */
async function toTab(page, touch, tab) {
  const tabs = ['play', 'scrapbook', 'achievements', 'settings']
  if (touch) await tap(page, tabs.indexOf(tab) * 80 + 40, 470)
  else
    for (let i = 0; i < 4 && (await hub(page)).tab !== tab; i++)
      await key(page, 'KeyC')
  assert.equal((await hub(page)).tab, tab)
}

const VIEWS = [
  { width: 390, height: 844, touch: true },
  { width: 768, height: 1024, touch: true },
  { width: 1440, height: 900, touch: false, containedHeight: 836 },
]

try {
  for (const view of VIEWS) {
    const { width, touch } = view
    const tag = `${width}px`
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      ...view,
      mediaDir,
      storage: { [SAVES_KEY]: { [SLUG]: seeded } },
    })
    const requested = new Set()
    page.on('request', (request) =>
      requested.add(new URL(request.url()).pathname),
    )
    const snap = (name) =>
      shots
        ? page.screenshot({ path: path.join(shots, `${width}-${name}.png`) })
        : null
    try {
      await start(page, touch)
      let state = await hub(page)
      assert.equal(state.menu, true, `${tag}: the hub opens`)
      assert.deepEqual(
        state.memories,
        [true, true, false, false, false, false],
        `${tag}: memories follow the saved boss medals (stages 5 and 10)`,
      )
      await wait(300)
      await snap('hub-map')

      // Scrapbook: all six districts, forward by tap/RIGHT, and wrapping back to the first.
      await toTab(page, touch, 'scrapbook')
      for (let chapter = 0; chapter < 6; chapter++) {
        state = await hub(page)
        assert.equal(
          state.album,
          chapter,
          `${tag}: album on district ${chapter + 1}`,
        )
        if (chapter <= 2) await snap(`scrapbook-${chapter + 1}`)
        if (touch) await tap(page, 260, 343)
        else await key(page, 'ArrowRight')
      }
      assert.equal((await hub(page)).album, 0, `${tag}: the album wraps`)
      // The memory cards load the district illustrations: restored (1, 2) and the dimmed glimpse (3).
      for (const name of ['salon', 'botanic-dome', 'night-market'])
        assert.ok(
          requested.has(
            `/images/arcade/superkate-spectrum/scrapbook-${name}.webp`,
          ),
          `${tag}: the ${name} memory card loads its illustration`,
        )
      // Districts not reached yet show a "?" card and never load (or spoil) their illustration.
      for (const name of ['cloud-library', 'prism-workshop', 'heart-of-hue'])
        assert.ok(
          !requested.has(
            `/images/arcade/superkate-spectrum/scrapbook-${name}.webp`,
          ),
          `${tag}: the unvisited ${name} memory stays hidden`,
        )
      if (touch) await tap(page, 60, 343)
      else await key(page, 'ArrowLeft')
      assert.equal((await hub(page)).album, 5, `${tag}: and back`)

      // Achievements: three pages of three, wrapping.
      await toTab(page, touch, 'achievements')
      for (let pageIndex = 0; pageIndex < 3; pageIndex++) {
        assert.equal((await hub(page)).trophyPage, pageIndex)
        await snap(`trophies-${pageIndex + 1}`)
        if (touch) await tap(page, 260, 343)
        else await key(page, 'ArrowRight')
      }
      assert.equal((await hub(page)).trophyPage, 0, `${tag}: trophies wrap`)
      state = await hub(page)
      assert.deepEqual(
        state.trophies,
        ['chapter-1', 'chapter-2'],
        `${tag}: only earned trophies show as earned`,
      )

      // Settings: every switch flips, and the master volume steps down.
      await toTab(page, touch, 'settings')
      const before = (await hub(page)).settings
      const switches = [
        'aimGuide',
        'particles',
        'highContrast',
        'music',
        'effects',
      ]
      for (const [row, name] of switches.entries()) {
        if (touch) await tap(page, 250, 158 + row * 23 + 10)
        else {
          while ((await hub(page)).optionRow !== row)
            await key(page, 'ArrowDown')
          await key(page, 'KeyZ')
        }
        assert.equal(
          (await hub(page)).settings[name],
          !before[name],
          `${tag}: ${name} toggles`,
        )
      }
      await snap('settings')
      const volume = (await hub(page)).audio.volume
      if (touch) await tap(page, 60, 158 + 6 * 23 + 10)
      else {
        while ((await hub(page)).optionRow !== 6) await key(page, 'ArrowDown')
        await key(page, 'ArrowLeft')
      }
      const lowered = (await hub(page)).audio.volume
      assert.ok(lowered < volume, `${tag}: volume steps down`)

      // Music and effects levels: the cabinet's soundtrack mixer takes the game's mix as it plays.
      for (const row of [7, 8]) {
        if (touch) await tap(page, 60, 158 + row * 23 + 10)
        else {
          while ((await hub(page)).optionRow !== row)
            await key(page, 'ArrowDown')
          await key(page, 'ArrowLeft')
        }
      }
      await wait(200)
      const mix = await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        return {
          game: game.audioMix,
          cabinet: (window.__soundtracks ?? []).at(-1)?.mix,
        }
      })
      assert.deepEqual(mix.game, { music: 0.9, effects: 0.9 })
      assert.deepEqual(
        mix.cabinet,
        mix.game,
        `${tag}: the cabinet mixer applies the game's levels`,
      )

      // The hub shows where the career is kept, driven by the real store's account sync state.
      const saveStatus = () =>
        page.evaluate(() => {
          const game = (window.__spectrums ?? [])
            .filter((entry) => !entry.demo)
            .at(-1).game
          return { status: game.saveStatus, label: game.saveStatusLabel }
        })
      assert.equal(
        (await saveStatus()).status,
        'local',
        `${tag}: a guest saves on device`,
      )
      for (const status of ['synced', 'offline']) {
        await page.evaluate((status) => {
          const pinia = window.__app.config.globalProperties.$pinia
          pinia._s.get('arcadeStore').spectrumCloudStatus = status
        }, status)
        await wait(80)
        assert.equal(
          (await saveStatus()).status,
          status,
          `${tag}: the hub follows the store to ${status}`,
        )
        if (status === 'synced') await snap('settings-synced')
      }

      // Leave and reopen: the switches stay as chosen, the career untouched.
      await reopenCabinet(page, fixture, { slug: SLUG })
      await start(page, touch)
      state = await hub(page)
      for (const name of switches)
        assert.equal(
          state.settings[name],
          !before[name],
          `${tag}: ${name} survives a reopen`,
        )
      const saved = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
        SAVES_KEY,
      )
      assert.deepEqual(
        saved[SLUG].career.stars,
        stars,
        `${tag}: browsing the hub never changes the medals`,
      )
      // Site achievements: a feat performed in play reaches its global code once, never twice.
      const awarded = await page.evaluate(async () => {
        window.__recordAwards = true
        window.__awarded = []
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        game.earn('rainbow-rescue')
        game.earn('color-alchemist')
        await new Promise((resolve) => setTimeout(resolve, 300))
        game.earn('rainbow-rescue')
        await new Promise((resolve) => setTimeout(resolve, 200))
        return window.__awarded
      })
      assert.deepEqual(
        awarded,
        [
          'arcade-superkate-spectrum-rainbow-rescue',
          'arcade-superkate-spectrum-color-alchemist',
        ],
        `${tag}: feats award the site achievements once`,
      )

      assert.deepEqual(errors, [], `${tag}: no page errors`)
      console.log(`ok ${tag}: scrapbook, trophies, settings, reopen`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log('Superkate Spectrum hub contract: all views passed')

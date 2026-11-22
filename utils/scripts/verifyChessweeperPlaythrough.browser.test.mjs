// Chessweeper real-browser acceptance: full campaigns, all twelve endings,
// scrapbook, achievements, save/resume, transfer codes, settings, keyboard,
// touch, reduced motion, audio gesture policy and 390/768/1440 layouts.
//
//   node utils/scripts/verifyChessweeperPlaythrough.browser.test.mjs
//
// Env:
//   CHESSWEEPER_SHOTS=dir           write screenshots for visual review
//   CHESSWEEPER_ART_ORIGIN=https://kindrobots.org
//                                   proxy delivered painted art (otherwise the
//                                   game must run on its code-drawn fallbacks)
//   CHESSWEEPER_CHROMIUM=path       use a preinstalled Chromium binary
//
// Every battle is played through visible controls by a scripted player; it
// reads engine state only to pick a move. Timers run on Playwright's clock.

import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import {
  act,
  playBattle,
  startServer,
} from './chessweeperPlaythroughHarness.mjs'

const env = globalThis.process.env
const SHOTS = env.CHESSWEEPER_SHOTS || ''
const ART_ORIGIN = env.CHESSWEEPER_ART_ORIGIN || ''
const WORLDS = ['sugar', 'ashen', 'jackpot']
const ENDING_IDS = ['mate', 'sweep', 'arena', 'fallen']
if (SHOTS) mkdirSync(SHOTS, { recursive: true })

const server = await startServer({ artOrigin: ART_ORIGIN })
const browser = await chromium.launch(
  env.CHESSWEEPER_CHROMIUM ? { executablePath: env.CHESSWEEPER_CHROMIUM } : {},
)
const failures = []
const pageErrors = []
const log = (...args) => console.log('[chessweeper]', ...args)

async function shot(page, name) {
  if (!SHOTS) return
  // Let proxied art finish (real time: the page clock is fake).
  for (let i = 0; i < 40; i++) {
    const settled = await page.evaluate(() =>
      [...document.images].every((image) => image.complete),
    )
    if (settled) break
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  await page.screenshot({ path: join(SHOTS, name + '.png'), fullPage: false })
}

async function open(context, query = '') {
  const page = await context.newPage()
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    // Missing renders 404 when no art origin is proxied; fallbacks cover them.
    if (/Failed to load resource/.test(text)) return
    pageErrors.push(text)
  })
  await page.clock.install()
  await page.goto(`${server.origin}/chessweeper/index.html${query}`)
  await page.waitForFunction(() => !!window.__fusionTest?.get())
  return page
}

async function chooseWorld(page, world) {
  await page.click(`[data-realm="${world}"]`)
  await page.clock.runFor(50)
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.realm),
    world,
  )
}

async function finishScene(page, expected) {
  // The cinematic plays first; the ending scene follows within two seconds.
  await page.clock.runFor(2200)
  const scene = page.locator('#cw-ending')
  await scene.waitFor({ state: 'visible' })
  const shown = await scene.getAttribute('data-ending')
  if (expected)
    assert.equal(shown, expected, 'ending scene matches the outcome')
  const prose = await scene.locator('.cw-ending-prose').count()
  assert.ok(prose >= 2, 'ending scene shows authored prose')
  assert.ok(
    (await scene.locator('.cw-ending-run p').count()) >= 1,
    'ending scene shows run consequences',
  )
  return shown
}

async function nextBattle(page) {
  await page.click('#cw-ending [data-ending-action="next"]')
  await page.clock.runFor(100)
  const fresh = await page.evaluate(() => {
    const s = window.__fusionTest.get()
    return s.turns === 0 && !s.over
  })
  assert.ok(fresh, 'Next battle starts a fresh battle')
}

function classify(ended) {
  if (/minefield|safe square/i.test(ended)) return 'sweep'
  if (/arena|blade|destroyed/i.test(ended)) return 'arena'
  if (/White wins by checkmate/.test(ended)) return 'mate'
  return 'fallen'
}

// ---------------------------------------------------------------- layouts
const VIEWPORTS = [
  {
    name: 'phone-390',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  },
  {
    name: 'tablet-768',
    viewport: { width: 768, height: 1024 },
    hasTouch: true,
  },
  { name: 'desktop-1440', viewport: { width: 1440, height: 1000 } },
]
for (const device of VIEWPORTS) {
  const context = await browser.newContext({ ...device, deviceScaleFactor: 1 })
  const page = await open(context)
  for (const world of WORLDS) {
    await chooseWorld(page, world)
    const layout = await page.evaluate(() => {
      const board = document.getElementById('board').getBoundingClientRect()
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        boardWidth: board.width,
        boardFits: board.right <= window.innerWidth + 1 && board.left >= -1,
        squares: document.querySelectorAll('[data-square]').length,
      }
    })
    assert.ok(
      layout.overflow <= 1,
      `${device.name} ${world}: no horizontal scroll`,
    )
    assert.ok(
      layout.boardFits,
      `${device.name} ${world}: board fits the viewport`,
    )
    assert.ok(
      layout.boardWidth >= 300,
      `${device.name} ${world}: board is playable size`,
    )
    assert.equal(layout.squares, 64)
    await shot(page, `${device.name}-${world}-board`)
  }
  for (const panel of ['scrapbook', 'achievements', 'settings']) {
    await page.click(`.meta-actions [data-panel="${panel}"]`)
    const box = await page.locator('#meta-dialog').boundingBox()
    assert.ok(box, `${panel} dialog opens`)
    assert.ok(
      box.x >= -1 && box.x + box.width <= device.viewport.width + 1,
      `${device.name}: ${panel} dialog fits horizontally`,
    )
    await shot(page, `${device.name}-${panel}`)
    await page.click('#meta-close')
  }
  if (device.hasTouch) {
    // Touch: tap a pawn, then its destination.
    await page.tap('[data-square="100"]')
    await page.tap('[data-square="68"]')
    await page.clock.runFor(900)
    const moved = await page.evaluate(() => window.__fusionTest.get().turns > 0)
    assert.ok(moved, `${device.name}: touch taps play a move`)
  }
  await context.close()
}
log('layouts ok at 390 / 768 / 1440')

// ---------------------------------------------------- full campaign playthrough
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
})
await context.addInitScript(() => {
  window.__audioContexts = 0
  const Native = window.AudioContext
  if (!Native) return
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args)
      window.__audioContexts++
    }
  }
})
let page = await open(context, '?seed=1')
assert.equal(
  await page.evaluate(() => window.__audioContexts),
  0,
  'no audio before a user gesture',
)
const reached = new Map(WORLDS.map((world) => [world, new Set()]))
const battleLog = []
async function battle(world, strategy, seed) {
  await page.goto(`${server.origin}/chessweeper/index.html?seed=${seed}`)
  await page.waitForFunction(() => !!window.__fusionTest?.get())
  await chooseWorld(page, world)
  const chapter = await page.evaluate(
    (w) => window.__chessweeperCampaign.current(w).chapter,
    world,
  )
  const result = await playBattle(page, strategy, { maxActions: 320 })
  if (!result.over) {
    log(
      `${world} ch${chapter + 1} ${strategy}#${seed} -> still running after ${result.turns} turns; next seed`,
    )
    return null
  }
  const expected = classify(result.ended)
  const shown = await finishScene(page, expected)
  reached.get(world).add(shown)
  battleLog.push({
    world,
    strategy,
    seed,
    chapter: chapter + 1,
    ending: shown,
    turns: result.turns,
    score: result.score,
  })
  log(
    `${world} ch${chapter + 1} ${strategy}#${seed} -> ${shown} (${result.turns} turns, ${result.score} pts)`,
  )
  return shown
}

for (const world of WORLDS) {
  // Hunt each ending with the matching strategy across seeds. Checkmate is
  // hunted separately below, from fresh chapter-one profiles.
  for (const target of ['fallen', 'arena', 'sweep']) {
    for (let seed = 1; seed <= 14 && !reached.get(world).has(target); seed++) {
      const strategy = target === 'fallen' ? 'fallen' : target
      const got = await battle(world, strategy, seed)
      if (target === 'fallen' && got === 'fallen')
        await shot(page, `ending-${world}-fallen`)
      if (got === target) await shot(page, `ending-${world}-${target}`)
      if (got === 'fallen')
        await page.click('#cw-ending [data-ending-action="close"]')
      else if (got) await nextBattle(page)
    }
    if (!reached.get(world).has(target))
      failures.push(`${world}: ending ${target} not reached in 14 seeds`)
  }
  // Finish the four-chapter campaign with minefield wins.
  for (let seed = 20; seed < 40; seed++) {
    const progress = await page.evaluate(
      (w) => window.__chessweeperCampaign.current(w),
      world,
    )
    if (progress.cleared) break
    if (await battle(world, 'sweep', seed))
      await page.click('#cw-ending [data-ending-action="close"]')
  }
  const progress = await page.evaluate(
    (w) => window.__chessweeperCampaign.current(w),
    world,
  )
  assert.ok(progress.cleared, `${world}: campaign completes all four chapters`)
}
assert.ok(
  (await page.evaluate(() => window.__audioContexts)) >= 1,
  'audio starts after the first gesture',
)

// Checkmate: four blades awake in a late chapter make mates rare, so each world
// is hunted from a fresh chapter-one profile on another "device", then carried
// into the main profile with the in-game transfer code.
for (const world of WORLDS) {
  let found = false
  for (let seed = 1; seed <= 24 && !found; seed++) {
    const scratch = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    })
    const hunt = await open(scratch, `?seed=${seed}`)
    await chooseWorld(hunt, world)
    const result = await playBattle(hunt, 'mate', { maxActions: 320 })
    if (result.over && classify(result.ended) === 'mate') {
      await finishScene(hunt, 'mate')
      await shot(hunt, `ending-${world}-mate`)
      await hunt.click('#cw-ending [data-ending-action="scrapbook"]')
      await hunt.click('#meta-close')
      await hunt.click('.meta-actions [data-panel="settings"]')
      await hunt.click('[data-transfer="export"]')
      const huntCode = await hunt.inputValue('#meta-transfer-code')
      await page.click('.meta-actions [data-panel="settings"]')
      await page.fill('#meta-transfer-code', huntCode)
      await page.click('[data-transfer="import"]')
      await page.click('#meta-close')
      reached.get(world).add('mate')
      battleLog.push({
        world,
        strategy: 'mate',
        seed,
        chapter: 1,
        ending: 'mate',
        turns: result.turns,
        score: result.score,
      })
      log(
        `${world} ch1 mate#${seed} -> mate (${result.turns} turns, ${result.score} pts), merged by transfer code`,
      )
      found = true
    }
    await scratch.close()
  }
  if (!found) failures.push(`${world}: checkmate not reached in 24 seeds`)
}

const profile = await page.evaluate(() => ({
  endings: window.__chessweeperProfile.endings(),
  achievements: window.__chessweeperProfile.achievements(),
  history: window.__chessweeperProfile.history(),
}))
for (const world of WORLDS)
  for (const id of ENDING_IDS)
    if (!profile.endings.includes(world + ':' + id))
      failures.push(`profile missing ending ${world}:${id}`)
for (const id of [
  'first',
  'winner',
  'explorer',
  'collector',
  'campaign-sugar',
  'campaign-ashen',
  'campaign-jackpot',
  'cartographer',
  'arena',
])
  if (!profile.achievements.includes(id))
    failures.push(`achievement ${id} not earned`)
if (
  profile.endings.length === 12 &&
  !profile.achievements.includes('scrapbook')
)
  failures.push('Complete Scrapbook not awarded at 12 endings')
assert.ok(
  profile.history.length >= 1 && profile.history.length <= 12,
  'history is bounded',
)
log(
  `endings ${profile.endings.length}/12, achievements ${profile.achievements.length}`,
)

// Scrapbook: unlocked endings are replayable scenes.
await page.click('.meta-actions [data-panel="scrapbook"]')
const unlockedCards = await page.locator('[data-replay-ending]').count()
assert.equal(
  unlockedCards,
  profile.endings.length,
  'every discovered ending has a scrapbook page',
)
await shot(page, 'scrapbook-complete')
await page.locator('[data-replay-ending]').first().click()
await page.locator('#cw-ending').waitFor({ state: 'visible' })
await shot(page, 'scrapbook-replay')
await page.click('#cw-ending [data-ending-action="close"]')

// Save and resume mid-battle.
await page.goto(`${server.origin}/chessweeper/index.html?seed=5`)
await page.waitForFunction(() => !!window.__fusionTest?.get())
await chooseWorld(page, 'jackpot')
for (let i = 0; i < 3; i++) {
  await act(
    page,
    await page.evaluate(() => ({
      kind: 'move',
      ...(() => {
        const s = window.__fusionTest.get()
        const m = window.ChessweeperChess.legalMoves(s.chess)[0]
        return { from: m[0], to: m[1], promote: m[2] || '' }
      })(),
    })),
  )
  await page.clock.runFor(900)
}
const turnsBefore = await page.evaluate(() => window.__fusionTest.get().turns)
await page.reload()
await page.waitForFunction(() => !!window.__fusionTest?.get())
await chooseWorld(page, 'jackpot')
await page.locator('#meta-continue').waitFor({ state: 'visible' })
await page.click('#meta-continue')
const turnsAfter = await page.evaluate(() => window.__fusionTest.get().turns)
assert.equal(turnsAfter, turnsBefore, 'Continue restores the saved battle')

// Keyboard shortcuts.
await page.keyboard.press('p')
assert.equal(
  await page.getAttribute('#probe-mode', 'aria-pressed'),
  'true',
  'P selects probe',
)
await page.keyboard.press('m')
assert.equal(
  await page.getAttribute('#move-mode', 'aria-pressed'),
  'true',
  'M selects move',
)

// Settings persist; transfer code carries progress to a fresh device.
await page.click('.meta-actions [data-panel="settings"]')
await page.uncheck('[data-setting="motion"]')
await page.click('[data-transfer="export"]')
const code = await page.inputValue('#meta-transfer-code')
assert.ok(code.startsWith('CW1.'), 'transfer code is produced')
await page.click('#meta-close')
await page.reload()
await page.waitForFunction(() => !!window.__fusionTest?.get())
assert.ok(
  await page.evaluate(() =>
    document.documentElement.classList.contains('meta-motion-off'),
  ),
  'motion setting persists across reloads',
)
await context.close()

const second = await browser.newContext({
  viewport: { width: 768, height: 1024 },
})
page = await open(second)
await page.click('.meta-actions [data-panel="settings"]')
await page.fill('#meta-transfer-code', code)
await page.click('[data-transfer="import"]')
const merged = await page.evaluate(
  () => window.__chessweeperProfile.endings().length,
)
assert.equal(merged, profile.endings.length, 'transfer merges every ending')
await page.fill('#meta-transfer-code', 'CW1.not-a-code')
await page.click('[data-transfer="import"]')
assert.match(
  await page.textContent('#meta-transfer-status'),
  /could not be read/,
  'bad codes are rejected without data loss',
)
assert.equal(
  await page.evaluate(() => window.__chessweeperProfile.endings().length),
  merged,
)
await second.close()

// Reduced motion: the ending scene opens immediately and plates stay hidden.
const calm = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
})
page = await open(calm, '?seed=2')
await chooseWorld(page, 'ashen')
const calmResult = await playBattle(page, 'fallen')
assert.ok(calmResult.over)
await page.clock.runFor(50)
assert.ok(
  await page.locator('#cw-ending').isVisible(),
  'reduced motion shows the ending without delay',
)
assert.equal(
  await page.locator('.chess-fx-cinematic, .chess-fx-plate').count(),
  0,
)
await shot(page, 'phone-390-ending-reduced-motion')
await calm.close()

await browser.close()
server.close()

if (pageErrors.length)
  failures.push('page errors: ' + pageErrors.slice(0, 5).join(' | '))
console.log(JSON.stringify({ battles: battleLog.length, battleLog }, null, 0))
if (failures.length) {
  console.error('[chessweeper] FAILED\n- ' + failures.join('\n- '))
  globalThis.process.exit(1)
}
log('playthrough acceptance ok')

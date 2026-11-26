import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Hopeful Hues browser playthrough (conductor hopeful-hues t-006). The real static game in
// Chromium, played through visible input (pointer drags, taps and the keyboard), at 390x844 and
// 768x1024 (touch) and 1440x900: the title cold-opens without audio until a gesture, a new
// adventure reaches the map, level 1 is won by dragging real tiles (moves chosen from the live
// board via ?qa=1, which is read-only), Back undoes a move exactly, keyboard play swaps tiles, a
// quest is claimed, another world is taken (the route fork), a save is exported and imported into
// another slot, calm motion switches on, and, at 1440, a world finale is played to its ending,
// which lands in the scrapbook. No sideways scroll and the board stays on screen at every width.
// HOPEFUL_HUES_MEDIA_DIR (optional) serves a local copy of the site's /images for screenshots.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const media = process.env.HOPEFUL_HUES_MEDIA_DIR || null
const shots = process.env.HOPEFUL_HUES_SHOTS || null
if (shots) mkdirSync(shots, { recursive: true })
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local')
  const p = decodeURIComponent(url.pathname)
  const base = p.startsWith('/images/') ? media : path.join(root, 'public')
  const file =
    base &&
    path.join(base, p.startsWith('/images/') ? p.slice('/images/'.length) : p)
  try {
    if (!file || !file.startsWith(base)) throw new Error('outside')
    const body = readFileSync(file)
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((resolve) => server.listen(0, resolve))
const BASE = `http://127.0.0.1:${server.address().port}/hopeful-hues/index.html?qa=1`

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Click the first visible button whose accessible name matches. */
async function press(page, name) {
  const button = page.getByRole('button', { name }).first()
  await button.waitFor({ state: 'visible', timeout: 8000 })
  await button.click()
  await wait(350)
}
/** Dismiss story pages, coach tips and the tutorial until the board is ours. */
async function clearOverlays(page) {
  for (let i = 0; i < 12; i++) {
    const next = page
      .getByRole('button', {
        name: /^(Got it|Let's go!?|Let's play!?|Continue|Next|Begin|Okay|OK)$/,
      })
      .first()
    if (!(await next.isVisible().catch(() => false))) break
    await next.click()
    await wait(300)
  }
}
const qa = (page) =>
  page.evaluate(() => {
    const state = window.__hhQA.state()
    return state
      ? {
          level: window.__hhQA.level(),
          busy: window.__hhQA.busy(),
          movesLeft: state.movesLeft,
          movesUsed: state.movesUsed,
          won: state.won,
          over: state.over,
          rows: state.rows,
          cols: state.cols,
          ids: state.board.map((row) => row.map((t) => (t ? t.id : 0))),
        }
      : null
  })
async function idle(page) {
  try {
    // Tips arrive one after another; keep reading them until the board is free.
    const deadline = Date.now() + 20000
    for (;;) {
      const free = await page.evaluate(
        () => window.__hhQA.state() && !window.__hhQA.busy(),
      )
      if (free) break
      if (Date.now() > deadline) throw new Error('timeout')
      await clearOverlays(page)
      await wait(200)
    }
  } catch (error) {
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((b) => b.offsetParent)
        .map((b) => (b.getAttribute('aria-label') || b.textContent).trim()),
    )
    throw new Error(
      `the board never settled; visible buttons: ${buttons.join(' | ')}`,
      { cause: error },
    )
  }
}
/** The best move on the live board, from the game's own engine (read-only). */
const bestMove = (page) =>
  page.evaluate(() =>
    window.HopefulHuesEngine.bestMove(
      JSON.parse(JSON.stringify(window.__hhQA.state())),
    ),
  )
async function cellCenter(page, r, c) {
  return page.evaluate(
    ([r, c]) => {
      const board = document.querySelector('[data-board]')
      const rect = board.getBoundingClientRect()
      const state = window.__hhQA.state()
      const cell = rect.width / state.cols
      return { x: rect.left + (c + 0.5) * cell, y: rect.top + (r + 0.5) * cell }
    },
    [r, c],
  )
}
/** Drag a tile onto its neighbour with the pointer, as a player does. */
async function drag(page, a, b) {
  const from = await cellCenter(page, a[0], a[1])
  const to = await cellCenter(page, b[0], b[1])
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 })
  await page.mouse.move(to.x, to.y, { steps: 3 })
  await page.mouse.up()
}
/** Play the current level to its end by dragging the engine's best move each turn. */
async function playOut(page, limit = 80) {
  for (let turn = 0; turn < limit; turn++) {
    await clearOverlays(page)
    await idle(page)
    const now = await qa(page)
    if (now.won || now.over) return now
    const move = await bestMove(page)
    assert.ok(move, `${now.level} always offers a move`)
    await drag(page, move[0], move[1])
    await page.waitForFunction(
      (used) => {
        const s = window.__hhQA.state()
        return !s || s.movesUsed > used || s.won || s.over
      },
      now.movesUsed,
      { timeout: 15000 },
    )
  }
  return qa(page)
}
async function layout(page, width, height, tag) {
  const box = await page.evaluate(() => {
    const board = document.querySelector('[data-board]')
    const r = board && board.getBoundingClientRect()
    return {
      scroll: document.documentElement.scrollWidth,
      board: r && {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      },
    }
  })
  assert.ok(box.scroll <= width, `${tag}: no sideways scroll`)
  if (box.board)
    assert.ok(
      box.board.left >= -1 &&
        box.board.right <= width + 1 &&
        box.board.top >= -1 &&
        box.board.bottom <= height + 1,
      `${tag}: the board is fully on screen`,
    )
}
/** Seed a save (slot 0) that has finished every level of a world before `upTo`. */
async function seed(page, hero, upTo) {
  await page.evaluate(
    ([hero, upTo]) => {
      const M = window.HopefulHuesMeta
      const L = window.HopefulHuesLevels
      const data = M.load(localStorage)
      const slot = M.createSlot(hero)
      slot.tutorialDone = true
      const world = L.worldOfHero(hero)
      for (const region of L.LINES[world]) {
        const count = L.REGIONS[region].tier === 2 ? 19 : 18
        for (let n = 1; n <= count; n++) {
          const id = `${region}-${n}`
          if (id === upTo) break
          slot.levels[id] = { stars: 3, best: 9999 }
        }
        if (upTo.startsWith(region + '-')) break
      }
      data.slots[0] = slot
      data.activeSlot = 0
      M.save(localStorage, data)
    },
    [hero, upTo],
  )
}

const VIEWS = [
  { width: 390, height: 844, touch: true },
  { width: 768, height: 1024, touch: true },
  { width: 1440, height: 900, touch: false },
]
try {
  for (const { width, height, touch } of VIEWS) {
    const tag = `${width}px`
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch,
    })
    const page = await context.newPage()
    // Daily quests follow the calendar; on this fixed day one is three stars on a level.
    await page.clock.setFixedTime(new Date('2026-11-25T12:00:00'))
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    // Count audio contexts, to check sound waits for the player's first gesture.
    await page.addInitScript(() => {
      window.__audioContexts = 0
      const Native = window.AudioContext
      if (Native)
        window.AudioContext = class extends Native {
          constructor(...args) {
            super(...args)
            window.__audioContexts++
          }
        }
    })
    const snap = (name) =>
      shots
        ? page.screenshot({ path: path.join(shots, `${width}-${name}.png`) })
        : null
    try {
      await page.goto(BASE)
      await wait(900)
      assert.equal(
        await page.evaluate(() => window.__audioContexts),
        0,
        `${tag}: no audio before a gesture`,
      )
      await layout(page, width, height, `${tag} title`)
      await snap('title')

      // A new adventure in Superkate's world, to the map and into level 1.
      await press(page, /Start the rainbow/)
      await press(page, 'New adventure')
      await press(page, /Begin Superkate's Rainbow Paradise/)
      await clearOverlays(page)
      await snap('map')
      await press(page, /level 1$/)
      await press(page, 'Play!')
      // The first-level tutorial: swap the wiggling pair, then read the goal and Back cards.
      await page
        .getByText(/^Welcome to /)
        .first()
        .waitFor({ timeout: 8000 })
      await snap('tutorial')
      const guided = await page.evaluate(() =>
        window.HopefulHuesEngine.findMove(
          JSON.parse(JSON.stringify(window.__hhQA.state())),
        ),
      )
      const tutorialStart = (await qa(page)).movesUsed
      await drag(page, guided[0], guided[1])
      await page.waitForFunction(
        (used) => window.__hhQA.state().movesUsed > used,
        tutorialStart,
      )
      await page.getByText('Your goal').first().waitFor({ timeout: 8000 })
      await clearOverlays(page)
      assert.ok(
        await page.evaluate(() => window.__hhQA.slot().tutorialDone),
        `${tag}: the tutorial completes`,
      )
      await idle(page)
      await layout(page, width, height, `${tag} level`)
      await snap('level-1')

      // Back: a move undone restores the board and the move count exactly.
      const before = await qa(page)
      const first = await bestMove(page)
      await drag(page, first[0], first[1])
      await page.waitForFunction(
        (used) => window.__hhQA.state().movesUsed > used,
        before.movesUsed,
      )
      await idle(page)
      if (!(await qa(page)).won) {
        await press(page, 'Back one move')
        await idle(page)
        const undone = await qa(page)
        assert.equal(
          undone.movesLeft,
          before.movesLeft,
          `${tag}: Back restores moves`,
        )
        assert.deepEqual(
          undone.ids,
          before.ids,
          `${tag}: Back restores the board`,
        )
      }

      // Keyboard play (desktop): select a tile with the cursor and swap with an arrow.
      await clearOverlays(page)
      await idle(page)
      if (!touch && !(await qa(page)).won) {
        const now = await qa(page)
        const move = await bestMove(page)
        assert.ok(move, `${tag}: a move for the keyboard`)
        await page.locator('[data-board]').focus()
        const [a, b] = move
        for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowUp')
        for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowLeft')
        for (let i = 0; i < a[0]; i++) await page.keyboard.press('ArrowDown')
        for (let i = 0; i < a[1]; i++) await page.keyboard.press('ArrowRight')
        await page.keyboard.press('Enter')
        await page.keyboard.press(
          b[0] > a[0]
            ? 'ArrowDown'
            : b[0] < a[0]
              ? 'ArrowUp'
              : b[1] > a[1]
                ? 'ArrowRight'
                : 'ArrowLeft',
        )
        await page.waitForFunction(
          (used) => window.__hhQA.state().movesUsed > used,
          now.movesUsed,
          { timeout: 8000 },
        )
      }

      const result = await playOut(page)
      assert.ok(result.won, `${tag}: level 1 is won through the pointer`)
      assert.ok(
        (await page.evaluate(() => window.__audioContexts)) <= 1,
        `${tag}: one audio context at most, after the first gesture`,
      )
      await snap('won')
      await press(page, 'Map')
      await clearOverlays(page)

      // Quests: a finished level claims its reward.
      // The map's Quests and Worlds buttons keep accessible names when their labels hide on phones.
      await press(page, /^Quests/)
      const ready = page.locator('[data-m="claim"]:not([disabled])').first()
      assert.ok(
        await ready.count(),
        `${tag}: winning level 1 readies a quest to claim`,
      )
      const sparklesBefore = await page.evaluate(
        () => window.__hhQA.slot().sparkles,
      )
      // The dialog body scrolls under its header; press the button itself.
      await ready.evaluate((button) => button.click())
      await wait(300)
      assert.ok(
        await page.getByText('✓ Claimed').first().isVisible(),
        `${tag}: a quest is claimed`,
      )
      assert.ok(
        (await page.evaluate(() => window.__hhQA.slot().sparkles)) >
          sparklesBefore,
        `${tag}: the reward lands`,
      )
      await press(page, 'Close')

      // The route fork: another world from the map, with its own map.
      await press(page, /^Worlds$/)
      await press(page, /Begin Sprocket's Clanktown/)
      await clearOverlays(page)
      assert.equal(
        await page.evaluate(() => window.__hhQA.slot().world),
        'clanktown',
        `${tag}: the fork takes the player to Clanktown`,
      )
      await snap('fork')

      // Export this slot and import it into another.
      await page.goto(BASE)
      await wait(500)
      await press(page, /Save slots/)
      await press(page, 'Export')
      const code = await page.locator('textarea.code').inputValue()
      assert.ok(code.startsWith('HH1.'), `${tag}: a save code exports`)
      await press(page, 'Copy').catch(() => {})
      await page.keyboard.press('Escape')
      await page.goto(BASE)
      await wait(500)
      await press(page, /Save slots/)
      await press(page, 'Import code')
      await page.locator('textarea.code').fill(code)
      await page.locator('.modal [data-m="go"]').click()
      await wait(400)
      const imported = await page.evaluate(() =>
        window.HopefulHuesMeta.load(localStorage),
      )
      const slots = (imported.slots ?? []).filter(Boolean)
      assert.ok(
        slots.length >= 2,
        `${tag}: the code imports into a second slot`,
      )

      // Calm motion switches on from Settings and reaches the page.
      await page.goto(BASE)
      await wait(400)
      await press(page, /Settings/)
      const calm = page.getByLabel(/reduce|calm/i).first()
      if (await calm.isVisible().catch(() => false))
        await calm.check().catch(() => calm.click())
      else await press(page, /reduce|calm/i)
      await wait(300)
      assert.ok(
        await page.evaluate(() =>
          document.body.classList.contains('reduced-motion'),
        ),
        `${tag}: calm motion applies`,
      )

      // A world finale played to its ending (desktop only, to keep the run short).
      if (!touch) {
        await seed(page, 'kate', 'falls-19')
        await page.goto(BASE)
        await wait(500)
        await press(page, /Start the rainbow|Continue/)
        await clearOverlays(page)
        await press(page, /level 19$/)
        await press(page, 'Play!')
        await clearOverlays(page)
        const finale = await playOut(page, 120)
        assert.ok(finale.won, `${tag}: the finale is won through the pointer`)
        await press(page, /See the ending/)
        await wait(800)
        await snap('ending')
        await clearOverlays(page)
        const endings = await page.evaluate(() => window.__hhQA.slot().endings)
        assert.ok(endings.length >= 1, `${tag}: the ending is recorded`)
      }

      assert.deepEqual(errors, [], `${tag}: no page errors`)
      console.log(
        `ok ${tag}: cold open, adventure, level won, Back, quests, fork, export/import, calm motion${touch ? '' : ', keyboard, finale ending'}`,
      )
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  server.close()
}
console.log('Hopeful Hues browser playthrough: all views passed')

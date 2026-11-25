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

// Superkate's Spectrum through the actual ArcadeCabinet and the real arcade store, in Chromium
// (conductor kr-arcade t-181, t-184, t-185, t-187). At a 390px phone and a 768px tablet it plays by
// touch: the clear-stage plan keeps every control (and the leave/fullscreen chips) off the board,
// the hub tabs and a stage node answer taps on the canvas, and a drag aims and a release fires.
// At 1440px it plays by keyboard and by a standard gamepad. Each width then leaves the cabinet,
// reopens it over the same localStorage and finds its cleared stage, and a game over still leaves
// the career (not an erased save) for the next visit.

const SLUG = 'superkate-spectrum'
const SAVES_KEY = 'kr-arcade-saves'
const W = 320
const H = 480

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.SPECTRUM_CABINET_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

/** The newest real (non-demo) Spectrum game the cabinet created, as plain data. */
function spectrum(page) {
  return page.evaluate(() => {
    const game = (window.__spectrums ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      menu: game.choosingMode,
      tab: game.menuTab,
      mode: game.mode,
      level: game.level,
      angle: game.angle,
      shot: Boolean(game.shot),
      shotsThisBoard: game.shotsThisBoard,
      over: game.over,
      highest: game.career.highestStage,
      stars: game.career.stars[0],
      save: game.save,
    }
  })
}

const created = (page) =>
  page.evaluate(
    () => (window.__spectrums ?? []).filter((entry) => !entry.demo).length,
  )

function stored(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SAVES_KEY,
  )
}

async function tapKey(page, key) {
  await page.keyboard.down(key)
  await wait(70)
  await page.keyboard.up(key)
  await wait(90)
}

/** A touch on the canvas at stage coordinates (320 x 480), as the cabinet's stage pointer sees it. */
function touchStage(page, type, x, y, pointerId = 1) {
  return page.evaluate(
    ({ type, fx, fy, pointerId }) => {
      const el = document.querySelector('.cabinet-canvas')
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          isPrimary: true,
          clientX: rect.left + rect.width * fx,
          clientY: rect.top + rect.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { type, fx: x / W, fy: y / H, pointerId },
  )
}

async function tapStage(page, x, y) {
  await touchStage(page, 'pointerdown', x, y)
  await wait(40)
  await touchStage(page, 'pointerup', x, y)
  await wait(90)
}

async function setPad(page, buttons = []) {
  await page.evaluate((buttons) => {
    window.__pads = [
      {
        index: 0,
        id: 'fixture controller',
        connected: true,
        mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, i) => ({
          pressed: buttons.includes(i),
          value: buttons.includes(i) ? 1 : 0,
        })),
      },
    ]
    window.dispatchEvent(new Event('gamepadconnected'))
  }, buttons)
}

async function padPress(page, button) {
  await setPad(page, [button])
  await wait(90)
  await setPad(page, [])
  await wait(90)
}

/** Start from the title (Enter, or a tap on a touch screen) and wait for the hub. */
async function start(page, touch) {
  const before = await created(page)
  if (touch) {
    await page.evaluate(() => {
      const el = document.querySelector('.cabinet-canvas')
      const rect = el.getBoundingClientRect()
      for (const type of ['pointerdown', 'pointerup'])
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 9,
            pointerType: 'touch',
            isPrimary: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            bubbles: true,
            cancelable: true,
          }),
        )
    })
  } else await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) => (window.__spectrums ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(400)
  return spectrum(page)
}

/** Every planned touch control and chip, and the canvas, as client rectangles. */
function layout(page) {
  return page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    }
    return {
      canvas: box(document.querySelector('.cabinet-canvas')),
      controls: [
        ...document.querySelectorAll(
          '.cabinet-overlay .cabinet-dpad, .cabinet-overlay .cabinet-ball, .cabinet-corner-chip, .cabinet-pause-chip',
        ),
      ]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => ({ name: el.className, ...box(el) })),
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

const overlaps = (a, b) =>
  a.left < b.right - 1 &&
  b.left < a.right - 1 &&
  a.top < b.bottom - 1 &&
  b.top < a.bottom - 1

/** Clear the current story board through the game itself, as a finished board would. */
const clearBoard = (page) =>
  page.evaluate(() => {
    const game = (window.__spectrums ?? [])
      .filter((entry) => !entry.demo)
      .at(-1).game
    game.completeBoard()
  })

const VIEWS = [
  { width: 390, height: 844, touch: true },
  { width: 768, height: 1024, touch: true },
  { width: 1440, height: 900, touch: false, containedHeight: 836 },
]

try {
  for (const view of VIEWS) {
    const { width, height, touch } = view
    const tag = `${width}px`
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      ...view,
    })
    const snap = (name) =>
      shots
        ? page.screenshot({ path: path.join(shots, `${width}-${name}.png`) })
        : null
    try {
      let game = await start(page, touch)
      assert.equal(game.menu, true, `${tag}: the hub opens first`)
      assert.equal(game.tab, 'play', `${tag}: on the Play tab`)
      assert.equal(game.mode, 'story', `${tag}: in Story`)
      await snap('hub-map')

      // The hub's four tabs, by the X button (keyboard C) and back by Y (keyboard V), or by tap.
      for (const tab of ['scrapbook', 'achievements', 'settings']) {
        if (touch) {
          const index = [
            'play',
            'scrapbook',
            'achievements',
            'settings',
          ].indexOf(tab)
          await tapStage(page, index * 80 + 40, 470)
        } else await tapKey(page, 'KeyC')
        game = await spectrum(page)
        assert.equal(game.tab, tab, `${tag}: reaches ${tab}`)
        await snap(`hub-${tab}`)
      }
      if (touch) await tapStage(page, 40, 470)
      else {
        await tapKey(page, 'KeyV')
        await tapKey(page, 'KeyV')
        await tapKey(page, 'KeyV')
      }
      assert.equal((await spectrum(page)).tab, 'play', `${tag}: back to Play`)

      // Into stage 1: a tap on its map node, or A (Z) on the keyboard.
      if (touch) await tapStage(page, 48, 82)
      else await tapKey(page, 'KeyZ')
      game = await spectrum(page)
      assert.equal(game.menu, false, `${tag}: stage 1 starts`)
      assert.equal(game.level, 1)
      await wait(300)

      if (touch) {
        // While a stage plays, the planned controls stay off the board and on the screen.
        const { canvas, controls, scrollWidth } = await layout(page)
        assert.ok(controls.length >= 6, `${tag}: touch controls render`)
        for (const control of controls) {
          assert.ok(
            !overlaps(control, canvas),
            `${tag}: ${control.name} stays off the board`,
          )
          assert.ok(
            control.left >= -1 &&
              control.right <= width + 1 &&
              control.top >= -1 &&
              control.bottom <= height + 1,
            `${tag}: ${control.name} fits the screen`,
          )
        }
        assert.ok(scrollWidth <= width, `${tag}: no sideways scroll`)
        // A phone keeps the full width; an upright tablet trades width for clear controls but never
        // shows a board smaller than a phone's.
        assert.ok(
          canvas.right - canvas.left >= Math.min(width * 0.9, 360),
          `${tag}: the board stays at least phone-sized`,
        )

        // Drag to aim (up and to the left), release to fire.
        const before = (await spectrum(page)).angle
        await touchStage(page, 'pointerdown', 160, 300)
        await wait(40)
        await touchStage(page, 'pointermove', 80, 200)
        await wait(40)
        game = await spectrum(page)
        assert.ok(game.angle < before - 0.1, `${tag}: drag aims left`)
        await touchStage(page, 'pointerup', 80, 200)
        await wait(30)
        assert.equal((await spectrum(page)).shot, true, `${tag}: release fires`)
      } else {
        const before = (await spectrum(page)).angle
        await page.keyboard.down('ArrowRight')
        await wait(300)
        await page.keyboard.up('ArrowRight')
        assert.ok(
          (await spectrum(page)).angle > before + 0.1,
          `${tag}: arrow keys aim`,
        )
        await tapKey(page, 'KeyZ')
        assert.equal((await spectrum(page)).shot, true, `${tag}: Z fires`)
        await page.waitForFunction(() => {
          const game = (window.__spectrums ?? [])
            .filter((entry) => !entry.demo)
            .at(-1).game
          return !game.shot
        })
        // A standard gamepad: A (button 0) fires the next orb.
        await padPress(page, 0)
        assert.equal(
          (await spectrum(page)).shot,
          true,
          `${tag}: gamepad A fires`,
        )
      }
      await page.waitForFunction(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        return !game.shot
      })
      game = await spectrum(page)
      assert.ok(game.shotsThisBoard >= 1, `${tag}: the orb lands`)
      await snap('stage-1')

      // A first power orb explains itself on a card (t-186), drawn over the live board.
      const tip = await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        game.banner = 0
        game.grantPower('ribbon')
        return game.powerTip
      })
      assert.equal(tip, 'ribbon', `${tag}: the first ribbon shows its tip`)
      await wait(150)
      await snap('power-tip')

      // Every chapter boss renders over its district art with its targets readable.
      for (const stage of [5, 10, 15, 20, 25, 30]) {
        const boss = await page.evaluate((stage) => {
          const game = (window.__spectrums ?? [])
            .filter((entry) => !entry.demo)
            .at(-1).game
          game.level = stage
          game.resetBoard()
          game.banner = 0
          game.powerTip = null
          // A boss arrives once its stage's board is cleared.
          game.board = game.board.map((row) => row.map(() => null))
          game.boss = { hits: 0, misses: 0 }
          game.prepareBossShot()
          return Boolean(game.boss)
        }, stage)
        assert.ok(boss, `${tag}: boss ${stage} stands`)
        await wait(80)
        if (width === 390) await snap(`boss-${stage}`)
      }
      await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        game.boss = null
        game.level = 1
        game.resetBoard()
        game.banner = 0
      })

      // Clear the board: the career records the stage and its stars, and survives a reopen.
      await clearBoard(page)
      game = await spectrum(page)
      assert.equal(game.level, 2, `${tag}: on to stage 2`)
      assert.equal(game.highest, 2, `${tag}: stage 2 unlocked`)
      assert.ok(game.stars >= 1, `${tag}: stage 1 earned a star`)
      await reopenCabinet(page, fixture, { slug: SLUG })
      game = await start(page, touch)
      assert.equal(game.menu, true)
      assert.equal(game.highest, 2, `${tag}: the career survives a reopen`)
      assert.ok(game.stars >= 1, `${tag}: the star survives a reopen`)
      const saves = await stored(page)
      assert.equal(
        saves[SLUG]?.career?.highestStage,
        2,
        `${tag}: the real store kept the career in localStorage`,
      )

      // A game over keeps the career: the save the cabinet reads is never null.
      if (touch) await tapStage(page, 104, 82)
      else {
        await tapKey(page, 'ArrowRight')
        await tapKey(page, 'KeyZ')
      }
      game = await spectrum(page)
      assert.equal(game.level, 2, `${tag}: replay starts at stage 2`)
      await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        game.lives = 1
        game.lose()
      })
      game = await spectrum(page)
      assert.equal(game.over, true, `${tag}: the run ends`)
      assert.ok(game.save, `${tag}: game over still returns a save`)
      assert.equal(game.save.career.highestStage, 2)
      await snap('game-over')
      await reopenCabinet(page, fixture, { slug: SLUG })
      game = await start(page, touch)
      assert.equal(game.highest, 2, `${tag}: game over did not erase progress`)

      // Co-op Relay from the Classic card: P1 shoots, then the turn passes to P2's own orb.
      if (touch) {
        await tapStage(page, 160, 450) // the Story map's Classic switch
        await tapStage(page, 160, 444) // the relay card
      } else {
        await tapKey(page, 'ArrowDown')
        await tapKey(page, 'ArrowLeft')
      }
      let relay = await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        return { active: game.relayActive, turn: game.relayTurn }
      })
      assert.deepEqual(relay, { active: true, turn: 1 }, `${tag}: relay opens`)
      await snap('relay')
      if (touch) await tapStage(page, 160, 200)
      else await tapKey(page, 'KeyZ')
      await page.waitForFunction(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        return !game.shot && game.relayUsed[0] === 1
      })
      relay = await page.evaluate(() => {
        const game = (window.__spectrums ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        return { active: game.relayActive, turn: game.relayTurn }
      })
      assert.ok(relay.active, `${tag}: relay continues`)
      assert.equal(relay.turn, 2, `${tag}: P2's turn after P1 shoots`)

      assert.deepEqual(errors, [], `${tag}: no page errors`)
      console.log(
        `ok ${tag}: hub, stage, aim/fire, save, reopen, game over, relay`,
      )
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log('Superkate Spectrum cabinet contract: all views passed')

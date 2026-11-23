import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const snapshot = (page) =>
  page.evaluate(() => {
    const game = (window.__plumbers ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    return game
      ? {
          x: game.hero.x,
          vy: game.hero.vy,
          cameraLead: game.cameraLead,
          mode: game.mode,
        }
      : null
  })
async function stage(page) {
  await page.evaluate(() => {
    const game = (window.__plumbers ?? [])
      .filter((entry) => !entry.demo)
      .at(-1).game
    game.loadStage(0)
    game.mode = 'play'
    game.foes = []
    game.hero.x = game.checkpoint.x
    game.hero.y = game.checkpoint.y
    game.hero.vx = game.hero.vy = 0
    game.ground = true
    game.immune = 1000
  })
  await wait(50)
}
function pointer(page, selector, type, pointerId, fx = 0.5, fy = 0.5) {
  return page.evaluate(
    ({ selector, type, pointerId, fx, fy }) => {
      const el = document.querySelector(selector)
      if (!el) throw new Error('Missing touch control: ' + selector)
      const r = el.getBoundingClientRect()
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          isPrimary: pointerId === 1,
          clientX: r.left + r.width * fx,
          clientY: r.top + r.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { selector, type, pointerId, fx, fy },
  )
}
async function setPad(page, buttons = [], axes = [0, 0, 0, 0]) {
  await page.evaluate(
    ({ buttons, axes }) => {
      window.__pads = [
        {
          index: 0,
          id: 'fixture controller',
          connected: true,
          mapping: 'standard',
          axes,
          buttons: Array.from({ length: 17 }, (_, i) => ({
            pressed: buttons.includes(i),
            value: buttons.includes(i) ? 1 : 0,
          })),
        },
      ]
      window.dispatchEvent(new Event('gamepadconnected'))
    },
    { buttons, axes },
  )
}
const results = []
try {
  for (const width of [1440, 768, 390]) {
    const touch = width !== 1440
    const height = width === 390 ? 844 : 900
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: 'save-the-plumber',
      width,
      height,
      touch,
    })
    try {
      if (touch) {
        await pointer(page, '.cabinet-canvas', 'pointerdown', 9)
        await pointer(page, '.cabinet-canvas', 'pointerup', 9)
      } else await page.keyboard.press('Enter')
      await page.waitForFunction(() =>
        (window.__plumbers ?? []).some((entry) => !entry.demo),
      )
      await stage(page)
      assert.equal((await snapshot(page)).mode, 'play')
      const before = await snapshot(page)
      if (touch) {
        const dpad = '.cabinet-cluster-1 .cabinet-dpad'
        await pointer(page, dpad, 'pointerdown', 1, 0.92, 0.5)
        await wait(250)
        await pointer(page, dpad, 'pointerup', 1, 0.92, 0.5)
        const boxes = await page.evaluate(() =>
          [
            ...document.querySelectorAll(
              '.cabinet-overlay .cabinet-dpad, .cabinet-overlay .cabinet-ball',
            ),
          ].map((el) => {
            const r = el.getBoundingClientRect()
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
            }
          }),
        )
        assert.ok(boxes.length > 1, 'touch controls exist')
        assert.ok(
          boxes.every(
            (b) =>
              b.left >= -1 &&
              b.right <= width + 1 &&
              b.top >= -1 &&
              b.bottom <= height + 1,
          ),
          'touch controls fit the ' + width + 'px screen',
        )
      } else {
        await page.keyboard.down('ArrowRight')
        await wait(250)
        await page.keyboard.up('ArrowRight')
      }
      const moved = await snapshot(page)
      assert.ok(
        moved.x > before.x + 2,
        'real cabinet horizontal input works at ' + width,
      )
      assert.ok(moved.cameraLead > 0, 'look-ahead follows momentum at ' + width)
      await stage(page)
      if (touch) {
        const a = '.cabinet-cluster-1 .cabinet-ball-a'
        await pointer(page, a, 'pointerdown', 2)
        await wait(70)
        await pointer(page, a, 'pointerup', 2)
      } else {
        await page.keyboard.down('Space')
        await wait(70)
        await page.keyboard.up('Space')
      }
      assert.ok((await snapshot(page)).vy < 0, 'jump maps to A at ' + width)
      assert.deepEqual(errors, [])
      results.push(width + 'px ' + (touch ? 'touch' : 'keyboard'))
    } finally {
      await context.close()
    }
  }
  const { page, errors, context } = await openCabinet(browser, fixture, {
    slug: 'save-the-plumber',
    width: 1440,
    height: 900,
  })
  try {
    await page.keyboard.press('Enter')
    await page.waitForFunction(() =>
      (window.__plumbers ?? []).some((entry) => !entry.demo),
    )
    await stage(page)
    const before = await snapshot(page)
    await setPad(page, [], [0.95, 0, 0, 0])
    await wait(250)
    assert.ok((await snapshot(page)).x > before.x + 2, 'gamepad moves heroine')
    await setPad(page)
    await stage(page)
    await setPad(page, [0])
    await wait(70)
    assert.ok((await snapshot(page)).vy < 0, 'gamepad A jumps')
    await setPad(page)
    assert.deepEqual(errors, [])
    results.push('gamepad movement and jump')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
console.log('Save the Plumber cabinet browser: ok (' + results.join(', ') + ')')

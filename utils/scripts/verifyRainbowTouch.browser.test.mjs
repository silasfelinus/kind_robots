import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  rainbowRun,
  startRainbowRun,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor rainbow t-018: touch control replay through the actual cabinet and its seat-input consumer.
// Touch pointer events (down, move, up, cancel, lost capture) are dispatched on the real on-screen d-pads
// of a coarse-pointer page; the cabinet's held state and the real Rainbow engine's ships are read back.
// Covers first-finger ownership against a second finger, independent seats, a resize mid-hold, and the
// compact (Space Princess) versus generic (every other cabinet) dead zone. Synthetic pointers are not
// physical touch evidence.

const RAINBOW = 'rainbow-bullet-hell-space-princess'
const GENERIC = 'hedgehog-crossing'
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RAINBOW_TOUCH_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

/** Dispatch one touch pointer event at a fraction of seat `seat`'s d-pad. */
function touch(page, type, seat, pointerId, fx = 0.5, fy = 0.5) {
  return page.evaluate(
    ({ type, seat, pointerId, fx, fy }) => {
      const pad = document.querySelectorAll('.cabinet-dpad')[seat]
      const rect = pad.getBoundingClientRect()
      pad.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          isPrimary: pointerId === 1,
          clientX: rect.left + rect.width * fx,
          clientY: rect.top + rect.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { type, seat, pointerId, fx, fy },
  )
}

/** The directions seat `seat`'s d-pad shows as held. */
function held(page, seat = 0) {
  return page.evaluate((seat) => {
    const pad = document.querySelectorAll('.cabinet-dpad')[seat]
    return ['up', 'down', 'left', 'right'].filter((direction) =>
      pad
        .querySelector(`.cabinet-key-${direction}`)
        .classList.contains('cabinet-key-held'),
    )
  }, seat)
}

/** Engine frames from a touch until the ship first moves. */
/**
 * Engine ticks from a touch until seat `seat`'s ship first moves, measured inside the page: the touch is
 * dispatched and the engine is sampled on every animation frame, so test-runner round trips don't count.
 */
function framesToMove(page, seat, fx, fy, pointerId) {
  return page.evaluate(
    ({ seat, fx, fy, pointerId }) =>
      new Promise((resolve) => {
        const run = (window.__games ?? [])
          .filter((entry) => !entry.demo)
          .at(-1).game
        const start = run.snapshot
        const was = start.ships[seat]
        const pad = document.querySelectorAll('.cabinet-dpad')[seat]
        const rect = pad.getBoundingClientRect()
        pad.dispatchEvent(
          new PointerEvent('pointerdown', {
            pointerId,
            pointerType: 'touch',
            isPrimary: pointerId === 1,
            clientX: rect.left + rect.width * fx,
            clientY: rect.top + rect.height * fy,
            bubbles: true,
            cancelable: true,
          }),
        )
        let frames = 0
        const sample = () => {
          const now = run.snapshot
          const ship = now.ships[seat]
          if (ship.x !== was.x || ship.y !== was.y)
            return resolve(now.tick - start.tick)
          if (++frames > 120) return resolve(Infinity)
          requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }),
    { seat, fx, fy, pointerId },
  )
}

/** A neutral offset that only the compact dead zone reads as a direction (see verifyRainbowPrincessPreview). */
const NEAR_CENTRE = 0.5 + 0.072

const summary = []
try {
  // 1. One pilot on a landscape phone: ownership, release paths and the compact dead zone.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width: 844,
      height: 390,
      touch: true,
    })
    await startRainbowRun(page)
    await page.waitForSelector('.cabinet-dpad')
    assert.equal(
      await page.evaluate(
        () => document.querySelectorAll('.cabinet-dpad').length,
      ),
      1,
      'one pilot, one d-pad',
    )
    assert.ok(
      await page.evaluate(() =>
        document
          .querySelector('.cabinet-dpad')
          .classList.contains('cabinet-dpad--compact'),
      ),
      'Space Princess uses the compact d-pad',
    )

    const frames = await framesToMove(page, 0, 0.92, 0.5, 1)
    assert.deepEqual(await held(page), ['right'])
    assert.ok(
      frames <= 3,
      `the ship answers a touch within ${frames} engine frames`,
    )

    await touch(page, 'pointermove', 0, 1, 0.88, 0.1)
    assert.deepEqual(
      await held(page),
      ['up', 'right'],
      'sliding diagonally holds both',
    )

    await touch(page, 'pointerdown', 0, 2, 0.08, 0.5)
    await touch(page, 'pointermove', 0, 2, 0.08, 0.92)
    assert.deepEqual(
      await held(page),
      ['up', 'right'],
      'a second finger cannot steal the pad',
    )
    await touch(page, 'pointerup', 0, 2, 0.08, 0.92)
    assert.deepEqual(
      await held(page),
      ['up', 'right'],
      "the second finger's lift changes nothing",
    )

    await touch(page, 'pointerup', 0, 1, 0.88, 0.1)
    assert.deepEqual(await held(page), [], 'lifting the owning finger lets go')
    await wait(80)
    const settled = await rainbowRun(page)
    await wait(200)
    const still = await rainbowRun(page)
    assert.deepEqual(
      still.ships[0],
      settled.ships[0],
      'a released pad stops the ship',
    )

    await touch(page, 'pointerdown', 0, 3, 0.92, 0.5)
    assert.deepEqual(await held(page), ['right'])
    await touch(page, 'pointercancel', 0, 3)
    assert.deepEqual(await held(page), [], 'pointercancel lets go')

    await touch(page, 'pointerdown', 0, 4, 0.08, 0.5)
    assert.deepEqual(await held(page), ['left'])
    await touch(page, 'lostpointercapture', 0, 4)
    assert.deepEqual(await held(page), [], 'lost capture lets go')

    await touch(page, 'pointerdown', 0, 5, NEAR_CENTRE, 0.5)
    assert.deepEqual(
      await held(page),
      ['right'],
      'the compact dead zone answers near the centre',
    )
    await touch(page, 'pointerup', 0, 5, NEAR_CENTRE, 0.5)

    // Resize mid-hold: the pad is re-measured on the next move, so nothing sticks.
    await touch(page, 'pointerdown', 0, 6, 0.92, 0.5)
    const before = await page.evaluate(
      () =>
        document.querySelector('.cabinet-dpad').getBoundingClientRect().width,
    )
    await page.setViewportSize({ width: 1024, height: 768 })
    await wait(150)
    const after = await page.evaluate(
      () =>
        document.querySelector('.cabinet-dpad').getBoundingClientRect().width,
    )
    await touch(page, 'pointermove', 0, 6, 0.5, 0.5)
    assert.deepEqual(
      await held(page),
      [],
      `after a resize (${Math.round(before)}px to ${Math.round(after)}px pad) the centre is neutral`,
    )
    await touch(page, 'pointermove', 0, 6, 0.5, 0.08)
    assert.deepEqual(
      await held(page),
      ['up'],
      'the resized pad reads directions from its new bounds',
    )
    await touch(page, 'pointerup', 0, 6, 0.5, 0.08)
    assert.deepEqual(await held(page), [])
    if (shots)
      await page.screenshot({ path: path.join(shots, 'touch-one-pilot.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(`1P ownership/cancel/capture/resize, ${frames}-frame response`)
  }

  // 2. Two pilots on a tablet: two fingers on two pads fly two ships independently.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width: 1024,
      height: 768,
      seats: 2,
      touch: true,
    })
    await startRainbowRun(page)
    await page.waitForFunction(
      () => document.querySelectorAll('.cabinet-dpad').length === 2,
    )
    const start = await rainbowRun(page)
    await touch(page, 'pointerdown', 0, 11, 0.5, 0.92)
    await touch(page, 'pointerdown', 1, 12, 0.5, 0.08)
    assert.deepEqual(await held(page, 0), ['down'])
    assert.deepEqual(await held(page, 1), ['up'])
    await wait(400)
    const moved = await rainbowRun(page)
    assert.ok(
      moved.ships[0].y > start.ships[0].y + 10,
      "pilot 1's pad flies pilot 1 down",
    )
    assert.ok(
      moved.ships[1].y < start.ships[1].y - 10,
      "pilot 2's pad flies pilot 2 up",
    )
    await touch(page, 'pointerup', 0, 11, 0.5, 0.92)
    assert.deepEqual(await held(page, 0), [], 'lifting finger 1 frees pad 1')
    assert.deepEqual(await held(page, 1), ['up'], 'finger 2 still holds pad 2')
    await touch(page, 'pointerup', 1, 12, 0.5, 0.08)
    if (shots)
      await page.screenshot({ path: path.join(shots, 'touch-two-pilots.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('2P independent pads')
  }

  // 3. Every other cabinet keeps the generic dead zone and its d-pad geometry.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: GENERIC,
      width: 844,
      height: 390,
      touch: true,
    })
    await page.keyboard.press('Enter')
    await page.waitForSelector('.cabinet-dpad')
    assert.ok(
      await page.evaluate(
        () =>
          !document
            .querySelector('.cabinet-dpad')
            .classList.contains('cabinet-dpad--compact'),
      ),
      'other cabinets keep the standard d-pad',
    )
    await touch(page, 'pointerdown', 0, 21, NEAR_CENTRE, 0.5)
    assert.deepEqual(
      await held(page),
      [],
      'the generic dead zone ignores a touch near the centre',
    )
    await touch(page, 'pointermove', 0, 21, 0.92, 0.5)
    assert.deepEqual(await held(page), ['right'])
    await touch(page, 'pointerup', 0, 21, 0.92, 0.5)
    assert.deepEqual(await held(page), [])
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('generic dead zone unchanged')
  }
} finally {
  await browser.close()
}
console.log(`rainbow touch replay: ok (${summary.join('; ')})`)

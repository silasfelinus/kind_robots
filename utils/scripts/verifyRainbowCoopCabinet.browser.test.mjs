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

// Conductor rainbow t-005: local co-op through the actual shared cabinet. Pilots join, leave and rejoin a
// run in progress with the cabinet's own player switch (paused, as the help explains), keeping the Act's
// progress, positions and lives; on a tablet four pilots get four on-screen pads and four fingers fly four
// ships at once. Synthetic input, not physical-device evidence.

const SLUG = 'rainbow-bullet-hell-space-princess'
const SWITCH = 'button[title="Same-device co-op: adjust seats here"]'
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RAINBOW_COOP_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

async function hold(page, key, ms = 450) {
  await page.keyboard.down(key)
  await wait(ms)
  await page.keyboard.up(key)
  await wait(60)
}
async function frozen(page) {
  const before = (await rainbowRun(page)).tick
  await wait(250)
  return (await rainbowRun(page)).tick === before
}
function touch(page, type, seat, pointerId, fx, fy) {
  return page.evaluate(
    ({ type, seat, pointerId, fx, fy }) => {
      const pad = document.querySelectorAll('.cabinet-dpad')[seat]
      const rect = pad.getBoundingClientRect()
      pad.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
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

const summary = []
try {
  // 1. Keyboard: join a second pilot mid-run, bench them, and bring them back where they left off.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
    })
    await startRainbowRun(page)
    await hold(page, 'KeyD', 300)
    await page.keyboard.press('KeyP')
    assert.ok(await frozen(page), 'paused')
    const solo = await rainbowRun(page)
    assert.equal(solo.ships.length, 1)
    assert.match(await page.textContent(SWITCH), /1 player/i)
    await page.click(SWITCH)
    assert.match(await page.textContent(SWITCH), /2 players/i)
    const joined = await rainbowRun(page)
    assert.equal(joined.ships.length, 2, 'pilot 2 joins while paused')
    assert.equal(joined.tick, solo.tick, 'joining does not restart the Act')
    assert.deepEqual(
      joined.ships[0],
      solo.ships[0],
      'pilot 1 keeps position and lives',
    )
    await page.keyboard.press('KeyP')
    assert.ok(!(await frozen(page)), 'the run resumes')
    let before = await rainbowRun(page)
    await hold(page, 'ArrowUp')
    let after = await rainbowRun(page)
    assert.ok(
      after.ships[1].y < before.ships[1].y - 10,
      'the arrows fly the new pilot',
    )
    assert.equal(after.ships[0].y, before.ships[0].y, 'and leave pilot 1 alone')

    await page.keyboard.press('KeyP')
    const benchedAt = (await rainbowRun(page)).ships[1]
    await page.click(SWITCH)
    assert.match(await page.textContent(SWITCH), /1 player/i)
    assert.equal((await rainbowRun(page)).ships.length, 1, 'pilot 2 benched')
    await page.keyboard.press('KeyP')
    await wait(300)
    await page.keyboard.press('KeyP')
    await page.click(SWITCH)
    const rejoined = (await rainbowRun(page)).ships[1]
    assert.deepEqual(
      rejoined,
      benchedAt,
      'pilot 2 rejoins where and as they left',
    )
    await page.keyboard.press('KeyP')
    assert.ok(!(await frozen(page)))
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('keyboard join/bench/rejoin mid-run')
  }

  // 2. Tablet touch: four pilots, four pads on screen, four fingers at once.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1024,
      height: 768,
      touch: true,
    })
    await startRainbowRun(page)
    await page.click('.cabinet-pause-chip')
    assert.ok(await frozen(page), 'the pause chip pauses')
    for (let i = 0; i < 3; i++) await page.click(SWITCH)
    assert.match(await page.textContent(SWITCH), /4 players/i)
    await page.keyboard.press('KeyP')
    await page.waitForFunction(
      () => document.querySelectorAll('.cabinet-dpad').length === 4,
    )
    const pads = await page.evaluate(() =>
      [...document.querySelectorAll('.cabinet-dpad')].map((pad) => {
        const rect = pad.getBoundingClientRect()
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        }
      }),
    )
    for (const [seat, pad] of pads.entries()) {
      assert.ok(
        pad.left >= 0 && pad.right <= 1024 && pad.top >= 0 && pad.bottom <= 768,
        `pad ${seat + 1} is on screen`,
      )
    }
    const start = await rainbowRun(page)
    assert.equal(start.ships.length, 4)
    const directions = [0.92, 0.08, 0.92, 0.08]
    for (const [seat, fy] of directions.entries())
      await touch(page, 'pointerdown', seat, 31 + seat, 0.5, fy)
    await wait(400)
    const moved = await rainbowRun(page)
    for (const [seat, fy] of directions.entries()) {
      const delta = moved.ships[seat].y - start.ships[seat].y
      assert.ok(
        fy > 0.5 ? delta > 10 : delta < -10,
        `pilot ${seat + 1} flies their own way (${delta.toFixed(1)})`,
      )
    }
    for (const [seat] of directions.entries())
      await touch(page, 'pointerup', seat, 31 + seat, 0.5, 0.5)
    if (shots)
      await page.screenshot({ path: path.join(shots, 'four-pilots-touch.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('4 touch pilots at once')
  }
} finally {
  await browser.close()
}
console.log(`rainbow co-op cabinet: ok (${summary.join('; ')})`)

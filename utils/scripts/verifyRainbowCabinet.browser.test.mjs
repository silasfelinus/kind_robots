import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  rainbowRun as play,
  startRainbowRun as startRun,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor rainbow t-015: the private flight deck's help and controls, proven through the actual shared
// ArcadeCabinet and the actual tutorial flyer that renders the admin tab's help, in Chromium at phone,
// tablet and desktop widths. Stores are stubbed (no network); the components, the cabinet's input
// seating and the Rainbow engine are the real ones. Synthetic keyboard and gamepad input is not
// physical-device evidence.

const SLUG = 'rainbow-bullet-hell-space-princess'
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RAINBOW_CABINET_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

async function open(width, height, seats = 1) {
  const opened = await openCabinet(browser, fixture, {
    slug: SLUG,
    width,
    height,
    seats,
    help: SLUG,
  })
  await opened.page.waitForFunction(() =>
    document
      .querySelector('#help')
      ?.textContent.includes('Princess pilot training'),
  )
  return opened
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

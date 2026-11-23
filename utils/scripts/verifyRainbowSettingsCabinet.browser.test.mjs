import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  startRainbowRun,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor rainbow t-044 (main-game standard: settings), through the actual ArcadeCabinet and Rainbow engine in
// Chromium: a player binds their own key to a face button and flies with it, Escape cancels a bind without pausing,
// and the comms and high-contrast switches reach the running game. Stores are stubbed; synthetic keys are not
// physical-device evidence.

const SLUG = 'rainbow-bullet-hell-space-princess'
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})

const run = (page) =>
  page.evaluate(() => {
    const entry = (window.__games ?? []).filter((e) => !e.demo).at(-1)
    return entry
      ? {
          tick: entry.game.snapshot.tick,
          shots: entry.game.snapshot.shots.length,
          paused: entry.game.paused === true,
        }
      : null
  })
const store = (page) =>
  page.evaluate(() => ({
    keyRemaps: JSON.parse(JSON.stringify(window.__arcadeStore.keyRemaps)),
    comms: window.__arcadeStore.comms,
    highContrast: window.__arcadeStore.highContrast,
  }))

async function shotsWhileHolding(page, key, ms = 500) {
  let most = 0
  await page.keyboard.down(key)
  for (let t = 0; t < ms; t += 50) {
    await wait(50)
    most = Math.max(most, (await run(page)).shots)
  }
  await page.keyboard.up(key)
  await wait(400)
  return most
}

try {
  const { page, context, errors } = await openCabinet(browser, fixture, {
    slug: SLUG,
    width: 1280,
    height: 900,
  })
  try {
    // The Keys panel opens from the settings strip; A listens and takes Q.
    await page.getByRole('button', { name: 'Keys', exact: true }).click()
    const panel = page.locator('#cabinet-remap')
    await panel.waitFor()
    await panel.getByRole('button', { name: /^A: default/ }).click()
    await page.keyboard.press('KeyQ')
    await wait(100)
    assert.deepEqual((await store(page)).keyRemaps, { [SLUG]: { a: 'KeyQ' } })
    assert.match(
      await panel.textContent(),
      /A now also answers to Q/,
      'the panel confirms the new key',
    )
    // A reserved key is refused and the button keeps listening; Escape then cancels.
    await panel.getByRole('button', { name: /^B: default/ }).click()
    await page.keyboard.press('ArrowUp')
    assert.match(await panel.textContent(), /stays reserved/)
    await page.keyboard.press('Escape')
    assert.match(await panel.textContent(), /Unchanged/)
    assert.deepEqual((await store(page)).keyRemaps, { [SLUG]: { a: 'KeyQ' } })

    // Fly: Q now fires, as A's own Space does.
    // Focus left the panel when the bind ended, so Enter starts the game instead of re-arming a button.
    assert.equal(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('#cabinet-remap')),
      ),
      false,
      'focus leaves the Keys panel once a bind ends',
    )
    await startRainbowRun(page)
    await wait(600)
    assert.ok(
      (await shotsWhileHolding(page, 'KeyQ')) > 0,
      'the bound key fires A in flight',
    )
    assert.ok((await shotsWhileHolding(page, 'Space')) > 0, 'Space still fires')

    // Escape during a bind cancels it and never reaches the game as pause.
    await panel.getByRole('button', { name: /^X: default/ }).click()
    await page.keyboard.press('Escape')
    const before = (await run(page)).tick
    await wait(400)
    assert.ok(
      (await run(page)).tick > before,
      'the run keeps flying: Escape went to the binder, not pause',
    )

    // The comms and high-contrast switches change the saved choice and reach the running game.
    await page.getByRole('button', { name: 'Comms full' }).click()
    assert.equal((await store(page)).comms, 'essential')
    await page.getByRole('button', { name: 'Comms story' }).click()
    assert.equal((await store(page)).comms, 'off')
    await page.getByRole('button', { name: 'Shots normal' }).click()
    assert.equal((await store(page)).highContrast, true)
    await page.getByRole('button', { name: 'Shots bold' }).waitFor()

    // Default keys clears the choice; Q no longer fires.
    await page.getByRole('button', { name: 'Default keys' }).click()
    assert.deepEqual((await store(page)).keyRemaps, { [SLUG]: {} })
    assert.equal(await shotsWhileHolding(page, 'KeyQ'), 0, 'Q is unbound again')
    assert.deepEqual(errors, [], 'no uncaught browser exceptions')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
console.log(
  'rainbow settings cabinet: key bind flies, Escape cancels, comms and contrast switch: ok',
)

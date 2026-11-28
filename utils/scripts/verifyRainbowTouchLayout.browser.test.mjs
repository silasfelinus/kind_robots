import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  startRainbowRun,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor rainbow t-067 (presentation review P-05, P-06, P-09, P-17, P-23), through the actual cabinet and
// Rainbow engine in Chromium: in flight on a touch screen no d-pad, face button or chip sits on the stage (the
// boss lane on its right included), the stage keeps most of its size, an upright phone gets a large-type status
// readout and a turn-sideways prompt under the stage, and on a short page the settings fold into one pop-over so the title screen grows.
// Other cabinets keep their floating controls and full switch row. Synthetic pointers and a stubbed page
// header, not physical-device evidence.

const RAINBOW = 'rainbow-bullet-hell-space-princess'
const GENERIC = 'hedgehog-crossing'
/** The Rainbow page hides the cabinet's marquee, title plate and keyboard hint (pages/play/...). */
const PAGE_CHROME =
  '#cabinet .cabinet-marquee, #cabinet .cabinet-title-plate, #cabinet .cabinet-hint { display: none }'
/** P-23's measured title screen at 844x390 before the pop-over: about 195x110 CSS px. */
const OLD_TITLE_AREA = 195 * 110

const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RAINBOW_LAYOUT_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

function boxes(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      const b = node.getBoundingClientRect()
      return {
        left: b.left,
        top: b.top,
        right: b.right,
        bottom: b.bottom,
        width: b.width,
        height: b.height,
      }
    }
    const all = (selector) =>
      [...document.querySelectorAll(selector)]
        .filter((node) => node.getClientRects().length)
        .map(rect)
    return {
      stage: rect(document.querySelector('.cabinet-canvas')),
      pads: all('.cabinet-overlay .cabinet-dpad'),
      balls: all('.cabinet-overlay .cabinet-ball'),
      chips: all('.cabinet-overlay .cabinet-corner-chip, .cabinet-pause-chip'),
      hint: all('.cabinet-rotate-hint')[0] ?? null,
      readout: all('.cabinet-readout')[0] ?? null,
      readoutRows: [...document.querySelectorAll('.cabinet-readout-row')].map(
        (row) => ({
          text: [...row.children]
            .map((cell) => cell.textContent.trim())
            .join(' '),
          size: parseFloat(getComputedStyle(row).fontSize),
        }),
      ),
      clear: Boolean(document.querySelector('.cabinet-overlay--clear')),
      viewport: { width: innerWidth, height: innerHeight },
    }
  })
}

/** Square px of `box` over `area` (both client rects). */
function overlap(box, area) {
  const width = Math.min(box.right, area.right) - Math.max(box.left, area.left)
  const height = Math.min(box.bottom, area.bottom) - Math.max(box.top, area.top)
  return width > 0.5 && height > 0.5 ? width * height : 0
}

/** The right 40% of the stage: where the bosses fight. */
function bossLane(stage) {
  return { ...stage, left: stage.left + stage.width * 0.6 }
}

function assertClearStage(label, layout, seats) {
  assert.ok(layout.clear, `${label}: the planned (clear-stage) layout is on`)
  assert.equal(layout.pads.length, seats, `${label}: one d-pad per pilot`)
  const controls = [
    ...layout.pads.map((box, index) => [`d-pad ${index + 1}`, box]),
    ...layout.balls.map((box, index) => [`button ${index + 1}`, box]),
    ...layout.chips.map((box, index) => [`chip ${index + 1}`, box]),
  ]
  for (const [name, box] of controls) {
    assert.equal(
      overlap(box, bossLane(layout.stage)),
      0,
      `${label}: ${name} stays off the boss lane (right 40% of the stage)`,
    )
    assert.equal(
      overlap(box, layout.stage),
      0,
      `${label}: ${name} stays off the stage ${JSON.stringify(box)}`,
    )
    assert.ok(
      box.left >= -1 &&
        box.top >= -1 &&
        box.right <= layout.viewport.width + 1 &&
        box.bottom <= layout.viewport.height + 1,
      `${label}: ${name} is on screen`,
    )
  }
  for (const [index, pad] of layout.pads.entries())
    for (const other of layout.pads.slice(index + 1))
      assert.equal(overlap(pad, other), 0, `${label}: d-pads never overlap`)
}

/** The stage's share of the largest 16:9 box the viewport could hold inside the cabinet's 0.4rem edge. */
function stageShare(layout) {
  const edge = 2 * 6.4
  const width = Math.floor(
    Math.min(
      layout.viewport.width - edge,
      ((layout.viewport.height - edge) * 480) / 270,
    ),
  )
  return (layout.stage.width * layout.stage.height) / (width * (width * 0.5625))
}

const summary = []
try {
  // P-05 and P-06: four pilots on a tablet, two on a landscape phone, all fighting a boss.
  // Gameplay critic r2 G2: co-op clusters carry X and Y as well where they fit (`buttons` per pilot).
  for (const { width, height, seats, minShare, buttons } of [
    { width: 1024, height: 768, seats: 4, minShare: 0.8, buttons: 4 },
    { width: 844, height: 390, seats: 2, minShare: 0.65, buttons: 4 },
    { width: 844, height: 390, seats: 4, minShare: 0.7, buttons: 2 },
    { width: 1024, height: 768, seats: 2, minShare: 0.9, buttons: 4 },
    { width: 768, height: 1024, seats: 4, minShare: 0.9, buttons: 4 },
    { width: 768, height: 1024, seats: 2, minShare: 0.9, buttons: 4 },
  ]) {
    const label = `${width}x${height} ${seats}P`
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width,
      height,
      seats,
      touch: true,
    })
    await startRainbowRun(page)
    await page.waitForFunction(
      (seats) => document.querySelectorAll('.cabinet-dpad').length === seats,
      seats,
    )
    // Fingers on the moved pads still fly every ship.
    const before = await page.evaluate(() =>
      (window.__games ?? [])
        .filter((entry) => !entry.demo)
        .at(-1)
        .game.snapshot.ships.map((ship) => ship.y),
    )
    for (let seat = 0; seat < seats; seat++)
      await page.evaluate(
        ({ seat }) => {
          const pad = document.querySelectorAll('.cabinet-dpad')[seat]
          const rect = pad.getBoundingClientRect()
          pad.dispatchEvent(
            new PointerEvent('pointerdown', {
              pointerId: 40 + seat,
              pointerType: 'touch',
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height * 0.08,
              bubbles: true,
              cancelable: true,
            }),
          )
        },
        { seat },
      )
    await wait(300)
    const after = await page.evaluate(() =>
      (window.__games ?? [])
        .filter((entry) => !entry.demo)
        .at(-1)
        .game.snapshot.ships.map((ship) => ship.y),
    )
    for (let seat = 0; seat < seats; seat++)
      assert.ok(
        after[seat] < before[seat] - 5,
        `${label}: pilot ${seat + 1}'s moved pad still flies their ship`,
      )
    await page.evaluate((seats) => {
      for (let seat = 0; seat < seats; seat++)
        document.querySelectorAll('.cabinet-dpad')[seat].dispatchEvent(
          new PointerEvent('pointerup', {
            pointerId: 40 + seat,
            pointerType: 'touch',
            bubbles: true,
          }),
        )
    }, seats)
    const reached = await page.evaluate(() => {
      const game = (window.__games ?? [])
        .filter((entry) => !entry.demo)
        .at(-1).game
      const none = { held: {}, pressed: {} }
      for (let i = 0; i < 40000 && !game.snapshot.boss; i++) game.update(none)
      return Boolean(game.snapshot.boss)
    })
    assert.ok(reached, `${label}: the run reached a boss`)
    await wait(200)
    const layout = await boxes(page)
    assertClearStage(label, layout, seats)
    assert.equal(
      layout.balls.length,
      seats * buttons,
      `${label}: ${buttons} face buttons per pilot`,
    )
    const share = stageShare(layout)
    assert.ok(
      share >= minShare,
      `${label}: the stage keeps ${Math.round(share * 100)}% of its full size`,
    )
    if (width > height)
      assert.equal(
        layout.readout,
        null,
        `${label}: sideways, the canvas HUD is enough (no readout)`,
      )
    if (width > height)
      for (const [index, pad] of layout.pads.entries())
        assert.ok(
          pad.right <= layout.stage.left + 1 ||
            pad.left >= layout.stage.right - 1 ||
            pad.top >= layout.stage.bottom - 1,
          `${label}: d-pad ${index + 1} sits in a rail or the band, beside or under the stage`,
        )
    if (shots)
      await page.screenshot({
        path: path.join(shots, `clear-${width}x${height}-${seats}p.png`),
      })
    assert.deepEqual(errors, [], `${label}: no page errors`)
    await context.close()
    summary.push(
      `${label} clear (${Math.round(share * 100)}% stage, ${buttons} buttons)`,
    )
  }

  // P-09: one pilot upright. The chips leave the canvas for the band under it, with a turn-sideways prompt.
  for (const [width, height] of [
    [360, 640],
    [390, 844],
  ]) {
    const label = `${width}x${height} 1P`
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width,
      height,
      touch: true,
    })
    await startRainbowRun(page)
    await page.waitForSelector('.cabinet-overlay--clear')
    const layout = await boxes(page)
    assertClearStage(label, layout, 1)
    assert.ok(
      stageShare(layout) > 0.99,
      `${label}: upright, the stage keeps the full width`,
    )
    assert.ok(layout.hint, `${label}: the turn-sideways prompt shows`)
    assert.ok(
      layout.hint.top >= layout.stage.bottom &&
        layout.pads.every((pad) => pad.top >= layout.hint.bottom),
      `${label}: the prompt sits between the stage and the controls`,
    )
    for (const chip of layout.chips)
      assert.ok(
        chip.top >= layout.stage.bottom,
        `${label}: the chips sit under the stage`,
      )
    // The rest of P-09: the run's status in large type in the gap, since the canvas HUD is ~7 px tall here.
    await page.waitForSelector('.cabinet-readout-row')
    const status = await boxes(page)
    assert.ok(status.readout, `${label}: the status readout shows`)
    assert.ok(
      status.readout.top >=
        Math.max(...status.chips.map((chip) => chip.bottom)) &&
        status.readout.bottom <= status.hint.top + 1,
      `${label}: the readout sits between the chips and the prompt`,
    )
    assertClearStage(label, status, 1)
    const rows = status.readoutRows.map((row) => row.text)
    assert.match(
      rows[0] ?? '',
      /^ACT I PINKWAKE$/,
      `${label}: the Act heads it`,
    )
    assert.ok(
      rows.some((row) => /^SCORE \d+$/.test(row)),
      `${label}: the score is in it (${rows.join(' | ')})`,
    )
    assert.ok(
      rows.some((row) => /\d♥ \d◇ P\d \d+%/.test(row)),
      `${label}: the pilot's lives, shields, power and charge are in it`,
    )
    assert.ok(
      status.readoutRows.slice(1).every((row) => row.size >= 14),
      `${label}: the readout's type is at least 14 px`,
    )
    const lastRow = await page.evaluate(() => {
      const rows = document.querySelectorAll('.cabinet-readout-row')
      const box = document
        .querySelector('.cabinet-readout')
        .getBoundingClientRect()
      return (
        rows[rows.length - 1].getBoundingClientRect().bottom <= box.bottom + 1
      )
    })
    assert.ok(lastRow, `${label}: every readout row fits its box`)
    // Presentation critic R2-03: the comms line the stage plays is in the readout too, announced politely.
    await page.waitForFunction(() =>
      document.querySelector('.cabinet-readout-spoken dd')?.textContent.trim(),
    )
    const spoken = await page.evaluate(() => {
      const live = document.querySelector('.cabinet-readout-spoken')
      const line = live.querySelector('dd')
      const box = document
        .querySelector('.cabinet-readout')
        .getBoundingClientRect()
      const run = (window.__games ?? []).filter((entry) => !entry.demo).at(-1)
      return {
        aria: live.getAttribute('aria-live'),
        speaker: live.querySelector('dt').textContent.trim(),
        text: line.textContent.trim(),
        size: parseFloat(getComputedStyle(line).fontSize),
        inside:
          live.getBoundingClientRect().top >= box.top - 1 &&
          live.getBoundingClientRect().bottom <= box.bottom + 1,
        comms: run.game.snapshot.comms,
      }
    })
    assert.equal(spoken.aria, 'polite', `${label}: the comms line is announced`)
    assert.ok(spoken.size >= 14, `${label}: the comms line is at least 14 px`)
    assert.ok(spoken.inside, `${label}: the comms line fits the readout`)
    assert.ok(
      spoken.comms &&
        spoken.speaker.startsWith(spoken.comms.speaker.toUpperCase()),
      `${label}: the readout names the speaker on the stage (${spoken.speaker})`,
    )
    assert.ok(spoken.text.length > 10, `${label}: the line itself is there`)
    if (shots)
      await page.screenshot({
        path: path.join(shots, `upright-${width}x${height}.png`),
      })
    assert.deepEqual(errors, [], `${label}: no page errors`)
    await context.close()
    summary.push(`${label} chips off canvas + readout + prompt`)
  }

  // A lone pilot on a landscape phone keeps the floating controls: clearing them would cost a third of the stage.
  {
    const { page, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width: 844,
      height: 390,
      touch: true,
    })
    await startRainbowRun(page)
    await page.waitForSelector('.cabinet-dpad')
    const layout = await boxes(page)
    assert.equal(layout.clear, false, '844x390 1P keeps the floating layout')
    assert.equal(
      Math.round(layout.stage.height),
      377,
      '844x390 1P keeps the full-height stage',
    )
    await context.close()
  }

  // P-23 and P-17: the contained page cabinet on a short landscape phone and a small upright one.
  for (const { width, height, frame, side } of [
    { width: 844, height: 390, frame: 222, side: true },
    { width: 360, height: 640, frame: 500, side: false },
  ]) {
    const label = `page ${width}x${height}`
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: RAINBOW,
      width,
      height,
      touch: true,
      containedHeight: frame,
    })
    await page.addStyleTag({ content: PAGE_CHROME })
    await page.evaluate((top) => {
      document.querySelector('#deck').style.paddingTop = `${top}px`
    }, height - frame)
    await wait(300)
    const visible = () =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll(
            '.cabinet-panel .cabinet-switch, .cabinet-panel .cabinet-coin',
          ),
        ]
          .filter((node) => node.getClientRects().length)
          .map((node) => node.textContent.trim()),
      )
    assert.deepEqual(
      await visible(),
      ['Start', '1 player', 'Settings'],
      `${label}: Start, players and Settings only`,
    )
    const stage = (await boxes(page)).stage
    if (side) {
      assert.ok(
        stage.width * stage.height >= OLD_TITLE_AREA * 2,
        `${label}: the title screen is ${Math.round(stage.width)}x${Math.round(stage.height)}, at least twice the old 195x110`,
      )
      assert.ok(
        await page.evaluate(() =>
          document
            .querySelector('.arcade-cabinet')
            .classList.contains('arcade-cabinet--side-panel'),
        ),
        `${label}: sideways, the switches stand beside the screen`,
      )
    }
    const toggle = page.getByRole('button', { name: 'Settings', exact: true })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    await toggle.click()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
    const popover = page.locator('#cabinet-settings')
    await popover.waitFor()
    const box = await popover.boundingBox()
    assert.ok(
      box.y >= -1 && box.y + box.height <= height + 1,
      `${label}: the pop-over is on screen`,
    )
    for (const name of ['Fullscreen', 'Comms full', 'Keys', 'Pilot']) {
      const item = popover.getByRole('button', { name, exact: true })
      await item.scrollIntoViewIfNeeded()
      const rect = await item.boundingBox()
      assert.ok(
        rect &&
          rect.y >= box.y - 1 &&
          rect.y + rect.height <= box.y + box.height + 1,
        `${label}: ${name} is reachable in the pop-over`,
      )
    }
    await popover.getByText('Free play').scrollIntoViewIfNeeded()
    if (shots)
      await page.screenshot({
        path: path.join(shots, `settings-${width}x${height}.png`),
      })
    await page.getByRole('button', { name: 'Comms full', exact: true }).click()
    assert.equal(
      await page.evaluate(() => window.__arcadeStore.comms),
      'essential',
      `${label}: a switch in the pop-over works`,
    )
    await page.keyboard.press('Escape')
    await popover.waitFor({ state: 'hidden' })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    assert.deepEqual(errors, [], `${label}: no page errors`)
    await context.close()
    summary.push(
      `${label} settings pop-over, title ${Math.round(stage.width)}x${Math.round(stage.height)}`,
    )
  }

  // Every other cabinet: floating touch controls and the full switch row, as before.
  {
    const { page, context } = await openCabinet(browser, fixture, {
      slug: GENERIC,
      width: 844,
      height: 390,
      touch: true,
      containedHeight: 222,
    })
    assert.equal(
      await page.locator('.cabinet-settings-toggle').count(),
      0,
      'other cabinets show no Settings fold',
    )
    assert.ok(
      await page
        .getByRole('button', { name: 'Fullscreen', exact: true })
        .isVisible(),
      'other cabinets keep every switch in the row',
    )
    await page.keyboard.press('Enter')
    await page.waitForSelector('.cabinet-dpad')
    assert.equal(
      await page.locator('.cabinet-overlay--clear').count(),
      0,
      'other cabinets keep floating touch controls',
    )
    await context.close()
    summary.push('other cabinets unchanged')
  }
} finally {
  await browser.close()
}
console.log(`rainbow touch layout: ok (${summary.join('; ')})`)

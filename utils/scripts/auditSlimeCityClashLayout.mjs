#!/usr/bin/env node
/**
 * Real-browser Slime City Clash control-rail regression.
 *
 * The general responsive audit visits routes, but does not enter a CPU match.
 * This one follows the player-facing VS flow and measures actual DOM boxes.
 * The TAP variant clones the rendered UNDO button so it inherits Vue scoped
 * styles; it tests the extra control's geometry, not its gameplay effect.
 *
 * npm run audit:slime-city-clash-layout -- --base https://kindrobots.org
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}
const base = flag('base', 'https://kindrobots.org').replace(/\/$/, '')
const shots = flag('shots', 'audit-shots/slime-city-clash')
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]
mkdirSync(shots, { recursive: true })

function measureClashControls(withTap) {
  const rail = document.querySelector('.clash-console')
  const row = rail?.querySelector('.clash-console-row')
  const fight = row?.querySelector('[data-testid="clash-pass"]')
  if (!rail || !row || !fight)
    return { ok: false, reason: 'Clash console or FIGHT is missing' }

  let tap = row.querySelector('[data-testid="clash-tap"]')
  let simulated = false
  if (withTap && !tap) {
    const undo = row.querySelector('[data-testid="clash-undo"]')
    if (!undo)
      return { ok: false, reason: 'UNDO control is missing for TAP fixture' }
    tap = undo.cloneNode(false)
    tap.className = 'clash-reset clash-tap'
    tap.textContent = '↷ TAP'
    tap.setAttribute('data-testid', 'clash-tap-audit')
    undo.before(tap)
    simulated = true
  }

  const railBox = rail.getBoundingClientRect()
  const rowBox = row.getBoundingClientRect()
  const fightBox = fight.getBoundingClientRect()
  const tapBox = withTap ? tap?.getBoundingClientRect() : null
  const viewport = window.innerWidth
  const tolerance = 1
  const ok =
    fightBox.width >= 32 &&
    fightBox.height >= 20 &&
    fightBox.left >= railBox.left - tolerance &&
    fightBox.right <= railBox.right + tolerance &&
    fightBox.right <= viewport + tolerance &&
    rowBox.right <= railBox.right + tolerance &&
    row.scrollWidth <= row.clientWidth + tolerance &&
    (!withTap ||
      (tapBox &&
        tapBox.width >= 24 &&
        tapBox.left >= railBox.left - tolerance &&
        tapBox.right <= fightBox.left + tolerance))

  return {
    ok: Boolean(ok),
    withTap,
    simulated,
    viewport,
    rail: [Math.round(railBox.left), Math.round(railBox.right)],
    row: [Math.round(rowBox.left), Math.round(rowBox.right)],
    rowScrollWidth: row.scrollWidth,
    rowClientWidth: row.clientWidth,
    fight: [Math.round(fightBox.left), Math.round(fightBox.right)],
    tap: tapBox ? [Math.round(tapBox.left), Math.round(tapBox.right)] : null,
  }
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
let failures = 0
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      await page.goto(base + '/play/slime-city', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      })
      await page.getByTestId('slime-city-lab').waitFor({ timeout: 30000 })

      const skip = page.getByRole('button', { name: /^skip$/i })
      if ((await skip.count()) && (await skip.first().isVisible()))
        await skip.first().click()

      await page.getByTestId('slime-vs-tab').click({ timeout: 20000 })
      await page.getByTestId('slime-vs-fight-cpu').click({
        timeout: 20000,
      })
      await page.getByTestId('clash-pass').waitFor({
        state: 'visible',
        timeout: 30000,
      })

      for (const withTap of [false, true]) {
        const result = await page.evaluate(measureClashControls, withTap)
        const caseName = vp.name + (withTap ? '-with-tap' : '-normal')
        await page.screenshot({
          path: join(shots, caseName + '.png'),
          animations: 'disabled',
        })
        console.log(caseName + ': ' + JSON.stringify(result))
        if (!result.ok) failures += 1
      }
    } catch (error) {
      failures += 1
      console.error(vp.name + ': Clash flow failed: ' + String(error))
      await page
        .screenshot({ path: join(shots, vp.name + '-failed.png') })
        .catch(() => {})
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}

if (failures) {
  console.error('Clash control layout: ' + failures + ' failed case(s)')
  process.exitCode = 1
} else {
  console.log('Clash control layout: 390, 768, 1440 and TAP geometry passed')
}

#!/usr/bin/env node
/**
 * Real-browser Slime City Clash control-rail regression.
 *
 * The general responsive audit visits routes, but does not enter a CPU match.
 * This one follows the player-facing VS flow and measures actual DOM boxes.
 * The TAP variant clones the rendered UNDO button so it inherits Vue scoped
 * styles; it tests the extra control's geometry, not its gameplay effect.
 *
 * It then plays one match to the end and measures the result controls
 * (BACK, REWARDS, REMATCH) at the same widths, with the reward report open
 * and with the board showing: every control inside the console and the
 * viewport, no label clipped, no two controls overlapping, and no sideways
 * page scroll.
 *
 * /play/slime-city is account-gated, so the audit needs a signed-in session:
 * --storage-state <file>, or KR_AUDIT_USERNAME and KR_AUDIT_PASSWORD (see
 * lib/auditSession.mjs). Without one it stops with SIGNED_OUT (exit 2)
 * instead of racing the redirect to /login.
 *
 * npm run audit:slime-city-clash-layout -- --base https://kindrobots.org
 *   [--storage-state /path/outside/repo/kr-qa-state.json] [--proxy <url>]
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import {
  auditBrowserOptions,
  dismissSiteDialogs,
  openGatedRoute,
  resolveAuditSession,
} from './lib/auditSession.mjs'
import { clickActivate, playMatch } from './lib/slimeCityClashDriver.mjs'

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
const session = await resolveAuditSession({
  base,
  storageStatePath: flag('storage-state', undefined),
})
if (!session) {
  console.error(
    'SIGNED_OUT: /play/slime-city needs an account. Pass --storage-state ' +
      '<signed-in QA state file>, or set KR_AUDIT_USERNAME and ' +
      'KR_AUDIT_PASSWORD.',
  )
  process.exit(2)
}
console.log('Clash control layout: signed in with ' + session.source)
const browserOptions = auditBrowserOptions(
  flag('proxy', process.env.AUDIT_PROXY),
)

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

/** Result controls after a match: BACK, REWARDS, REMATCH and sound. */
function measureResultControls() {
  const rail = document.querySelector('.clash-console')
  const row = rail?.querySelector('.clash-console-row')
  if (!rail || !row)
    return { ok: false, reason: 'Clash console or its control row is missing' }
  const tolerance = 1
  const railBox = rail.getBoundingClientRect()
  const controls = [...row.children]
    .filter((el) => el.getClientRects().length > 0)
    .map((el) => {
      const box = el.getBoundingClientRect()
      return {
        id: el.dataset.testid || String(el.className).split(' ').pop(),
        left: Math.round(box.left),
        right: Math.round(box.right),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        clipped: el.scrollWidth > el.clientWidth + tolerance,
      }
    })
  const inside = controls.every(
    (c) =>
      c.left >= railBox.left - tolerance &&
      c.right <= railBox.right + tolerance &&
      c.right <= window.innerWidth + tolerance &&
      c.bottom <= window.innerHeight + tolerance,
  )
  const overlap = controls.some((a, i) =>
    controls.some(
      (b, j) =>
        j > i &&
        a.top < b.bottom &&
        b.top < a.bottom &&
        a.left < b.right - tolerance &&
        b.left < a.right - tolerance,
    ),
  )
  const clipped = controls.filter((c) => c.clipped).map((c) => c.id)
  const pageOverflow =
    document.documentElement.scrollWidth > window.innerWidth + tolerance
  return {
    ok:
      controls.length >= 2 &&
      inside &&
      !overlap &&
      !clipped.length &&
      !pageOverflow &&
      railBox.left >= -tolerance &&
      railBox.right <= window.innerWidth + tolerance,
    viewport: window.innerWidth,
    rail: [Math.round(railBox.left), Math.round(railBox.right)],
    inside,
    overlap,
    clipped,
    pageOverflow,
    controls: controls.map((c) => [c.id, c.left, c.right, c.top]),
  }
}

const browser = await chromium.launch(browserOptions.launch)
let failures = 0
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
      storageState: session.storageState,
      ...browserOptions.context,
    })
    const page = await context.newPage()
    await dismissSiteDialogs(page)
    try {
      await openGatedRoute(
        page,
        base + '/play/slime-city',
        '[data-testid="slime-city-lab"]',
        true,
      )
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

  // Result controls: one finished match, measured at every width in both
  // result states. The layout answers to container queries, so resizing the
  // finished match is the same page a player at that width would see.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    storageState: session.storageState,
    ...browserOptions.context,
  })
  const page = await context.newPage()
  await dismissSiteDialogs(page)
  try {
    await openGatedRoute(
      page,
      base + '/play/slime-city',
      '[data-testid="slime-city-lab"]',
      true,
    )
    await page.getByTestId('slime-vs-tab').click({ timeout: 20000 })
    await page.getByTestId('slime-vs-fight-cpu').click({ timeout: 20000 })
    await page.getByTestId('clash-pass').waitFor({ timeout: 30000 })
    await playMatch(page, clickActivate, 60)
    // The reward report rises a beat after the final blow.
    const seeBoard = page.getByTestId('slime-match-report-close')
    await seeBoard.first().waitFor({ state: 'visible', timeout: 15000 })
    for (const state of ['report', 'board']) {
      if (state === 'board') {
        await seeBoard.first().click()
        await page.getByTestId('clash-show-report').waitFor({ timeout: 10000 })
      }
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.waitForTimeout(400)
        const result = await page.evaluate(measureResultControls)
        const caseName = vp.name + '-result-' + state
        await page.screenshot({
          path: join(shots, caseName + '.png'),
          animations: 'disabled',
        })
        console.log(caseName + ': ' + JSON.stringify(result))
        if (!result.ok) failures += 1
      }
    }
  } catch (error) {
    failures += 1
    console.error('result controls: Clash flow failed: ' + String(error))
    await page
      .screenshot({ path: join(shots, 'result-failed.png') })
      .catch(() => {})
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}

if (failures) {
  console.error('Clash control layout: ' + failures + ' failed case(s)')
  process.exitCode = 1
} else {
  console.log(
    'Clash control layout: 390, 768, 1440, TAP and result controls passed',
  )
}

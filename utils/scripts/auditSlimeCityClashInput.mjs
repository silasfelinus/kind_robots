#!/usr/bin/env node
/**
 * Real-browser Slime City Clash input pass (conductor slime-city/t-012).
 *
 * Plays complete CPU Clash matches using one input method at a time:
 *   keyboard  reaches every control with Tab / Shift+Tab and activates it
 *             with Enter (no mouse, no element.click()).
 *   touch     a touch-only phone context (hasTouch, isMobile) that taps
 *             cards, alleys and FIGHT with touchscreen taps.
 * A match passes when the result screen (REMATCH or REWARDS) appears.
 * Gamepad is covered by verifySlimeCityClashGamepad.test.ts (D-pad/stick focus,
 * A press, Start FIGHT, LB/RB hand) rather than driven here: Playwright
 * cannot synthesize Gamepad API input.
 *
 * /play/slime-city is account-gated: an anonymous visitor is redirected to
 * /login shortly after hydration, usually mid-match. Pass a Playwright
 * storage-state file saved from a signed-in QA browser (never commit it), or
 * set KR_AUDIT_USERNAME and KR_AUDIT_PASSWORD (see lib/auditSession.mjs).
 * Without one the run stops with SIGNED_OUT instead of a vague timeout.
 *
 * npm run audit:slime-city-clash-input -- --base https://kindrobots.org
 *   --storage-state /path/outside/repo/kr-qa-state.json
 *   [--modes keyboard,touch] [--rounds 40] [--shots audit-shots/slime-city-input]
 *   [--proxy <url>]
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, devices } from 'playwright'
import {
  assertSignedIn,
  auditBrowserOptions,
  openGatedRoute,
  resolveAuditSession,
  dismissSiteDialogs,
} from './lib/auditSession.mjs'
import {
  keyboardActivate,
  playMatch,
  touchActivate,
} from './lib/slimeCityClashDriver.mjs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}
const base = flag('base', 'https://kindrobots.org').replace(/\/$/, '')
const shots = flag('shots', 'audit-shots/slime-city-input')
const modes = flag('modes', 'keyboard,touch').split(',')
const maxRounds = Number(flag('rounds', '40'))
mkdirSync(shots, { recursive: true })
const session = await resolveAuditSession({
  base,
  storageStatePath: flag('storage-state', undefined),
})
const browserOptions = auditBrowserOptions(
  flag('proxy', process.env.AUDIT_PROXY),
)

const browser = await chromium.launch(browserOptions.launch)
let failures = 0
try {
  for (const mode of modes) {
    const context = await browser.newContext({
      ...(mode === 'touch'
        ? devices['Pixel 7']
        : { viewport: { width: 1440, height: 900 } }),
      reducedMotion: 'reduce',
      ...(session ? { storageState: session.storageState } : {}),
      ...browserOptions.context,
    })
    const page = await context.newPage()
    await dismissSiteDialogs(page)
    try {
      await openGatedRoute(
        page,
        base + '/play/slime-city',
        '[data-testid="slime-city-lab"]',
        Boolean(session),
      )
      // Entering the match is navigation, not gameplay; the gameplay below
      // uses only the mode's input method.
      await page.getByTestId('slime-vs-tab').click({ timeout: 20000 })
      await page.getByTestId('slime-vs-fight-cpu').click({ timeout: 20000 })
      await page.getByTestId('clash-pass').waitFor({ timeout: 30000 })
      if (mode === 'keyboard') await page.locator('body').focus()

      assertSignedIn(page)
      const stats = await playMatch(
        page,
        mode === 'keyboard' ? keyboardActivate : touchActivate,
        maxRounds,
      )
      await page.screenshot({ path: join(shots, mode + '-result.png') })
      const victor = await page
        .getByTestId('clash-kind')
        .textContent()
        .catch(() => '')
      console.log(
        `${mode}: PASS full match ` +
          JSON.stringify({ ...stats, kind: victor?.trim() }),
      )
      if (stats.cardsPlayed === 0) {
        failures += 1
        console.error(`${mode}: finished without playing a single card`)
      }
    } catch (error) {
      failures += 1
      console.error(`${mode}: FAIL ${String(error).split('\n')[0]}`)
      await page
        .screenshot({ path: join(shots, mode + '-failed.png') })
        .catch(() => {})
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log(
  'gamepad: unit-tested (verifySlimeCityClashGamepad.test.ts); not browser-driven',
)
if (failures) {
  console.error(`Clash input pass: ${failures} failed mode(s)`)
  process.exitCode = 1
} else {
  console.log(`Clash input pass: ${modes.join(' + ')} full matches passed`)
}

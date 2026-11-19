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
 * Gamepad is reported, not tested: Clash has no Gamepad API binding yet.
 *
 * /play/slime-city is account-gated: an anonymous visitor is redirected to
 * /login shortly after hydration, usually mid-match. Pass a Playwright
 * storage-state file saved from a signed-in QA browser (never commit it).
 * Without one the run stops with SIGNED_OUT instead of a vague timeout.
 *
 * npm run audit:slime-city-clash-input -- --base https://kindrobots.org
 *   --storage-state /path/outside/repo/kr-qa-state.json
 *   [--modes keyboard,touch] [--rounds 40] [--shots audit-shots/slime-city-input]
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, devices } from 'playwright'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name)
  return i === -1 || !args[i + 1] ? fallback : args[i + 1]
}
const base = flag('base', 'https://kindrobots.org').replace(/\/$/, '')
const shots = flag('shots', 'audit-shots/slime-city-input')
const modes = flag('modes', 'keyboard,touch').split(',')
const maxRounds = Number(flag('rounds', '40'))
const storageState = flag('storage-state', undefined)
mkdirSync(shots, { recursive: true })

/** Snapshot the board so the driver can choose a legal move. */
function readBoard() {
  const q = (s) => document.querySelector(`[data-testid="${s}"]`)
  const visible = (el) => {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && !el.disabled
  }
  const hand = [...document.querySelectorAll('[data-testid^="clash-hand-"]')]
    .filter((el) => /^clash-hand-\d+$/.test(el.dataset.testid))
    .map((el) => ({
      testid: el.dataset.testid,
      playable: !el.classList.contains('dim'),
      pressed: el.getAttribute('aria-pressed') === 'true',
      focusable: el.tabIndex >= 0,
    }))
  const targets = [...document.querySelectorAll('.clash-slot.target')]
    .filter((el) => !el.disabled)
    .map((el) => el.dataset.testid)
  const toggle = q('clash-hand-toggle')
  return {
    over: visible(q('clash-restart')) || visible(q('clash-show-report')),
    choice: visible(q('clash-choice-0')),
    fightReady: visible(q('clash-pass')),
    handOpen: toggle?.getAttribute('aria-expanded') === 'true',
    hand,
    targets,
  }
}

/** Keyboard-only activation: Tab until the control has focus, then Enter. */
async function keyboardActivate(page, testid) {
  const focused = () =>
    page.evaluate(
      (id) => document.activeElement?.getAttribute('data-testid') === id,
      testid,
    )
  if (!(await focused())) {
    let found = false
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 120 && !found; i++) {
        await page.keyboard.press(key)
        found = await focused()
      }
      if (found) break
    }
    if (!found) throw new Error(`keyboard cannot reach ${testid}`)
  }
  await page.keyboard.press('Enter')
}

async function touchActivate(page, testid) {
  await page.getByTestId(testid).first().tap({ timeout: 10000 })
}

function assertSignedIn(page) {
  if (new URL(page.url()).pathname === '/login')
    throw new Error(
      'SIGNED_OUT: /play/slime-city redirected to /login. Re-run with ' +
        '--storage-state <signed-in QA state file>.',
    )
}

async function playMatch(page, mode) {
  const activate = mode === 'keyboard' ? keyboardActivate : touchActivate
  const stats = { cardsPlayed: 0, fights: 0, choices: 0, rounds: 0 }
  for (let round = 0; round < maxRounds; round++) {
    // Wait for the player's turn (FIGHT enabled), a level choice, or the end.
    await page.waitForFunction(
      () => {
        const q = (s) => document.querySelector(`[data-testid="${s}"]`)
        const on = (el) => el && !el.disabled && el.getClientRects().length > 0
        return (
          location.pathname === '/login' ||
          on(q('clash-pass')) ||
          on(q('clash-choice-0')) ||
          on(q('clash-restart')) ||
          on(q('clash-show-report'))
        )
      },
      null,
      { timeout: 60000 },
    )
    assertSignedIn(page)
    let board = await page.evaluate(readBoard)
    if (board.over) return { ...stats, rounds: round }
    stats.rounds = round + 1
    if (board.choice) {
      await activate(page, 'clash-choice-0')
      stats.choices += 1
      await page.waitForTimeout(150)
      continue
    }

    // Play cards until none is playable or nothing can be targeted.
    for (let plays = 0; plays < 8; plays++) {
      board = await page.evaluate(readBoard)
      if (board.over) break
      const card = board.hand.find((c) => c.playable)
      if (!card) break
      if (!board.handOpen) {
        await activate(page, 'clash-hand-toggle')
        await page.waitForTimeout(150)
      }
      await activate(page, card.testid)
      await page.waitForTimeout(150)
      board = await page.evaluate(readBoard)
      if (!board.targets.length) {
        // Untargetable here: put the card back and stop trying this turn.
        await activate(page, card.testid).catch(() => {})
        break
      }
      const before = board.hand.length
      await activate(page, board.targets[0])
      await page.waitForTimeout(250)
      board = await page.evaluate(readBoard)
      if (board.hand.length >= before && !board.over) break
      stats.cardsPlayed += 1
      if (board.choice) {
        await activate(page, 'clash-choice-0')
        stats.choices += 1
      }
    }
    board = await page.evaluate(readBoard)
    if (board.over) return stats
    if (board.choice) continue
    if (board.fightReady) {
      await activate(page, 'clash-pass')
      stats.fights += 1
    }
  }
  throw new Error(
    `match did not finish in ${maxRounds} turns: ` + JSON.stringify(stats),
  )
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
let failures = 0
try {
  for (const mode of modes) {
    const context = await browser.newContext({
      ...(mode === 'touch'
        ? devices['Pixel 7']
        : { viewport: { width: 1440, height: 900 } }),
      reducedMotion: 'reduce',
      ...(storageState ? { storageState } : {}),
    })
    const page = await context.newPage()
    try {
      await page.goto(base + '/play/slime-city', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      })
      await page
        .waitForFunction(
          () =>
            location.pathname === '/login' ||
            document.querySelector('[data-testid="slime-city-lab"]'),
          null,
          { timeout: 30000 },
        )
        .catch(() => {})
      // The account gate can fire a beat after hydration; give it the chance.
      await page.waitForTimeout(storageState ? 500 : 4000)
      assertSignedIn(page)
      await page.getByTestId('slime-city-lab').waitFor({ timeout: 30000 })
      const skip = page.getByRole('button', { name: /^skip$/i })
      if ((await skip.count()) && (await skip.first().isVisible()))
        await skip.first().click()
      // Entering the match is navigation, not gameplay; the gameplay below
      // uses only the mode's input method.
      await page.getByTestId('slime-vs-tab').click({ timeout: 20000 })
      await page.getByTestId('slime-vs-fight-cpu').click({ timeout: 20000 })
      await page.getByTestId('clash-pass').waitFor({ timeout: 30000 })
      if (mode === 'keyboard') await page.locator('body').focus()

      assertSignedIn(page)
      const stats = await playMatch(page, mode)
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
console.log('gamepad: NOT COVERED (Clash has no Gamepad API binding)')
if (failures) {
  console.error(`Clash input pass: ${failures} failed mode(s)`)
  process.exitCode = 1
} else {
  console.log(`Clash input pass: ${modes.join(' + ')} full matches passed`)
}

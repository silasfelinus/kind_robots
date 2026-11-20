/**
 * Shared real-browser driver for Slime City Clash audits: reads the board and
 * plays a whole CPU match with one input method. Used by the input pass
 * (keyboard-only, touch-only) and by the layout audit, which needs a finished
 * match to measure the result controls.
 */
import { assertSignedIn } from './auditSession.mjs'

/** Snapshot the board so the driver can choose a legal move. */
export function readBoard() {
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
  // Open alleys first: the driver builds a line instead of replacing its one
  // fighter every turn, so it can actually win a match now and then.
  const targets = [...document.querySelectorAll('.clash-slot.target')]
    .filter((el) => !el.disabled)
    .sort(
      (a, b) =>
        Number(a.classList.contains('filled')) -
        Number(b.classList.contains('filled')),
    )
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
export async function keyboardActivate(page, testid) {
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

export async function touchActivate(page, testid) {
  await page.getByTestId(testid).first().tap({ timeout: 10000 })
}

/** Plain pointer activation, for audits that only need the match played. */
export async function clickActivate(page, testid) {
  await page.getByTestId(testid).first().click({ timeout: 10000 })
}

/**
 * Play one CPU Clash match to its result screen with a single activation
 * method (keyboard, touch or click). The match is over when REMATCH or
 * REWARDS appears.
 */
export async function playMatch(page, activate, maxRounds = 40) {
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
      // After the last allowed play FIGHT stays lit until the first strike
      // lands. Wait for the sweep to take over so the next pass through this
      // loop is a new turn, not another press on the same one.
      await page
        .waitForFunction(
          () => {
            const q = (s) => document.querySelector(`[data-testid="${s}"]`)
            const on = (el) =>
              el && !el.disabled && el.getClientRects().length > 0
            return (
              !on(q('clash-pass')) ||
              on(q('clash-choice-0')) ||
              on(q('clash-restart')) ||
              on(q('clash-show-report'))
            )
          },
          null,
          { timeout: 15000 },
        )
        .catch(() => {})
    }
  }
  throw new Error(
    `match did not finish in ${maxRounds} turns: ` + JSON.stringify(stats),
  )
}

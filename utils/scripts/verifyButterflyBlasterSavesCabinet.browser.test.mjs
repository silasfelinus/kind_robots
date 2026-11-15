import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-152: Butterfly Blaster's earned history (the clear, Zero Night, the golden
// threads) through the actual cabinet's save keeping and retirement and the real arcade store. Staged
// profiles are seeded in localStorage: a season saved at the dawn ending, one at Zero Night, and one on a
// Dry Season lap. Through the cabinet: Continue with A and with Start keeps the run; B (New Season) starts
// the river again and the players leave at once, on the menu, before any night is played; the step-zero
// save reloads without an offer; Season is started and the game retired again. Synthetic keyboard input
// in headless Chromium, network and achievements stubbed: not deployment or human campaign timing.

const SLUG = 'butterfly-blaster'
const SAVES_KEY = 'kr-arcade-saves'
/** CAMPAIGN steps (utils/arcade/butterflyBlaster/season.ts): checked below by the phase they resume. */
const DAWN_ENDING = 32
const ZERO_ENDING = 37
const CLINIC = 4
const ALL_THREADS = ['riverbend', 'terraces', 'delta', 'market', 'tea', 'swamp']

const run = {
  v: 1,
  score: 12_340,
  lives: 1,
  beads: 25,
  owned: ['ribbon'],
  hints: ['delta'],
  record: [[0, 8]],
  cleared: true,
  dry: 0,
}
const profiles = [
  {
    name: 'dawn ending',
    save: { ...run, step: DAWN_ENDING, threads: ALL_THREADS, zero: false },
    phase: 'ending',
  },
  {
    name: 'Zero Night',
    save: { ...run, step: ZERO_ENDING, threads: ALL_THREADS, zero: true },
    phase: 'ending',
  },
  {
    name: 'Dry Season lap',
    save: {
      ...run,
      step: CLINIC,
      threads: ['riverbend', 'terraces', 'delta'],
      zero: false,
      dry: 1,
    },
    phase: 'clinic',
  },
]
const seed = (save) => ({
  [SAVES_KEY]: { [SLUG]: save, 'another-game': { v: 9 } },
})

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})

/** The newest real (non-demo) Butterfly Blaster game the cabinet created, as plain data. */
function blaster(page) {
  return page.evaluate(() => {
    const game = (window.__butterflies ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      phase: game.phase,
      mode: game.mode,
      step: game.stepIndex,
      score: game.score,
      lives: game.lives,
      beads: game.beads,
      dry: game.dry,
      cleared: game.cleared,
      zero: game.zero,
      threads: [...game.threads].sort(),
    }
  })
}

function stored(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SAVES_KEY,
  )
}

async function tapKey(page, key) {
  await page.keyboard.down(key)
  await wait(70)
  await page.keyboard.up(key)
  await wait(90)
}

/** Enter on the title creates a game; wait for it and a moment more. */
async function start(page) {
  const before = await page.evaluate(
    () => (window.__butterflies ?? []).filter((entry) => !entry.demo).length,
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) =>
      (window.__butterflies ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(200)
  return blaster(page)
}

const sorted = (list) => [...list].sort()

/** The earned history the profile carries, in the game and in the store. */
function assertHistory(state, all, profile, label) {
  const { save } = profile
  assert.equal(state.cleared, true, `${label}: the clear`)
  assert.equal(state.zero, save.zero, `${label}: Zero Night`)
  assert.deepEqual(state.threads, sorted(save.threads), `${label}: threads`)
  const kept = all[SLUG]
  assert.ok(kept, `${label}: a save is stored`)
  assert.equal(kept.cleared, true, `${label}: stored clear`)
  assert.equal(kept.zero, save.zero, `${label}: stored Zero Night`)
  assert.deepEqual(sorted(kept.threads), sorted(save.threads))
  assert.deepEqual(all['another-game'], { v: 9 }, `${label}: other saves`)
}

/** A fresh season's step-zero save: the run reset, the history kept. */
function assertFreshSeason(kept, label) {
  assert.equal(kept.step, 0, `${label}: the river starts again`)
  assert.equal(kept.score, 0, `${label}: score reset`)
  assert.equal(kept.lives, 3, `${label}: lives reset`)
  assert.equal(kept.beads, 0, `${label}: beads reset`)
  assert.equal(kept.dry ?? 0, 0, `${label}: not a Dry Season lap`)
  assert.deepEqual(kept.record, [], `${label}: the river's record reset`)
}

const summary = []
try {
  for (const profile of profiles) {
    const { save } = profile
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(save),
    })

    // Continue with A, then (after leaving) with Start: the current run is kept.
    for (const key of ['Space', 'Enter']) {
      if (key === 'Enter') await reopenCabinet(page, fixture, { slug: SLUG })
      let state = await start(page)
      assert.equal(state.phase, 'offer', `${profile.name}: offered`)
      await tapKey(page, key)
      state = await blaster(page)
      const label = `${profile.name}, Continue (${key})`
      assert.equal(state.phase, profile.phase, `${label}: resumes`)
      assert.equal(state.step, save.step, `${label}: at its step`)
      assert.equal(state.score, save.score, `${label}: score kept`)
      assert.equal(state.lives, save.lives, `${label}: lives kept`)
      assert.equal(state.beads, save.beads, `${label}: beads kept`)
      assert.equal(state.dry, save.dry, `${label}: Dry Season lap kept`)
      const all = await stored(page)
      assertHistory(state, all, profile, label)
      assert.equal(all[SLUG].step, save.step, `${label}: stored step`)
      assert.equal(all[SLUG].score, save.score, `${label}: stored score`)
      assert.equal(all[SLUG].dry, save.dry, `${label}: stored lap`)
    }

    // New Season (B), then leave at once from the menu, before any night is played.
    await reopenCabinet(page, fixture, { slug: SLUG })
    let state = await start(page)
    assert.equal(state.phase, 'offer')
    await tapKey(page, 'KeyX')
    state = await blaster(page)
    assert.equal(state.phase, 'menu', `${profile.name}: B opens the menu`)
    await reopenCabinet(page, fixture, { slug: SLUG })
    let all = await stored(page)
    assertFreshSeason(all[SLUG], `${profile.name}, New Season`)

    // The step-zero save reloads with no offer and the history intact; Season starts, then retires.
    state = await start(page)
    assert.equal(state.phase, 'menu', `${profile.name}: step zero, no offer`)
    assertHistory(state, all, profile, `${profile.name}, reload at step zero`)
    await wait(200)
    await tapKey(page, 'Space')
    state = await blaster(page)
    assert.equal(state.mode, 'season', `${profile.name}: Season begins`)
    assert.equal(state.phase, 'map')
    assert.equal(state.step, 0)
    await wait(600)
    await tapKey(page, 'Space')
    assert.equal((await blaster(page)).phase, 'play', 'onto the first night')
    await reopenCabinet(page, fixture, { slug: SLUG })
    all = await stored(page)
    assertFreshSeason(all[SLUG], `${profile.name}, Season retired`)
    state = await start(page)
    assert.equal(state.phase, 'menu', 'still no offer at step zero')
    assertHistory(state, all, profile, `${profile.name}, after retiring`)
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(profile.name)
  }
} finally {
  await browser.close()
}
console.log(
  `butterfly blaster saves cabinet: ok (${summary.join(', ')}: Continue A/Start, New Season leave, step-zero reload, start and retire)`,
)

import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-151: Bumper Bubbles' recipe cards through the actual cabinet's save keeping and
// retirement and the real arcade store. A staged wing checkpoint with two earlier recipe cards is seeded
// in localStorage; Continue (A) resumes it; the third pantry (floor 60, SNOWMELT FIZZ) is staged and its
// card taken; the players leave at once (the app unmounts, so the cabinet retires the game); a fresh
// cabinet reads the store again and Continue resumes with every card. One case takes the card between
// two cabinet ticks, so only the retirement keeps it. Synthetic keyboard input in headless Chromium,
// network and achievements stubbed: not deployment, device or human campaign-length evidence.

const SLUG = 'bumper-bubbles'
const SAVES_KEY = 'kr-arcade-saves'
const THIRD = 60

const wingSix = {
  v: 1,
  wing: 6,
  score: 480_000,
  letters: 'FR',
  cards: [20, 40],
}
const wingFive = { ...wingSix, wing: 5, score: 300_000, letters: 'FRI' }
const seed = (save) => ({
  [SAVES_KEY]: { [SLUG]: save, 'another-game': { v: 9 } },
})

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})

/** The newest real (non-demo) Bumper Bubbles game the cabinet created, as plain data. */
function bubbles(page) {
  return page.evaluate(() => {
    const game = (window.__bubbles ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      offer: Boolean(game.offer),
      menu: Boolean(game.menu),
      level: game.level,
      score: game.score,
      phase: game.phase,
      letters: [...game.letters].sort().join(''),
      cards: [...game.cards].sort((a, b) => a - b),
      pantry: Boolean(game.pantry),
      save: game.save,
    }
  })
}

/** What the real store has written to localStorage for this cabinet (and the neighbour's save). */
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

/** Start from the title and take the Continue offer with A, as a player does. */
async function continueClimb(page, save) {
  const before = await page.evaluate(
    () => (window.__bubbles ?? []).filter((entry) => !entry.demo).length,
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) => (window.__bubbles ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(200)
  let state = await bubbles(page)
  assert.equal(state.offer, true, `wing ${save.wing} is offered`)
  await tapKey(page, 'Space')
  state = await bubbles(page)
  assert.equal(state.offer, false, 'A continues')
  assert.equal(
    state.level,
    (save.wing - 1) * 10 + 1,
    "at the wing's first floor",
  )
  assert.equal(state.score, Math.floor(save.score / 2), 'at half score')
  assert.equal(state.letters, [...save.letters].sort().join(''), 'letters')
  assert.deepEqual(state.cards, save.cards, 'cards')
  return state
}

/**
 * Stage the third pantry: floor 60 emptied so it clears, the robot walked into the door, then
 * (unless `takeBetweenTicks`) onto the recipe card so the game takes it in its own tick.
 */
async function stageThirdPantry(page) {
  await page.evaluate((floor) => {
    const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
    game.startFloor(floor)
    game.setPhase('play')
    game.grumps = []
    game.bubbles = []
    for (const r of game.robots) r.invuln = 1e9
  }, THIRD)
  await page.waitForFunction(
    () => window.__bubbles.filter((entry) => !entry.demo).at(-1).game.door,
  )
  await page.evaluate(() => {
    const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
    const r = game.robots[0]
    r.x = game.floor.door.x
    r.y = game.floor.door.y
  })
  await page.waitForFunction(() => {
    const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
    return game.pantry && game.recipe && game.phase === 'play'
  })
}

/** The store's save for this cabinet after leaving: the wing checkpoint with all three cards. */
function assertKept(all, save, label) {
  assert.deepEqual(all['another-game'], { v: 9 }, `${label}: other saves kept`)
  const kept = all[SLUG]
  assert.ok(kept, `${label}: a save is stored`)
  assert.equal(kept.wing, 6, `${label}: the wing 6 checkpoint`)
  assert.deepEqual(kept.cards, [20, 40, THIRD], `${label}: three cards`)
  assert.equal(kept.letters, save.letters, `${label}: letters`)
}

const summary = []
try {
  // 1. A wing 6 checkpoint: the card is taken in the game's own tick, then the players leave at once.
  // 2. The same, but the card lands between two cabinet ticks: only the retirement can keep it.
  for (const betweenTicks of [false, true]) {
    const label = betweenTicks ? 'retirement only' : 'taken in play'
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(wingSix),
    })
    await continueClimb(page, wingSix)
    assert.deepEqual(
      (await stored(page))[SLUG].cards,
      [20, 40],
      'a continue leaves the wing save as it was',
    )
    await stageThirdPantry(page)
    if (betweenTicks) {
      const before = await page.evaluate(() => {
        const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
        const saves = JSON.parse(localStorage.getItem('kr-arcade-saves'))
        game.takeCard()
        window.__app.unmount()
        return saves['bumper-bubbles'].cards
      })
      assert.deepEqual(before, [20, 40], 'not stored before the exit')
      await reopenCabinet(page, fixture, { slug: SLUG })
    } else {
      await page.evaluate(() => {
        const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
        const r = game.robots[0]
        r.x = game.recipe.x
        r.y = game.recipe.y
        r.vy = 0
      })
      await page.waitForFunction(
        (floor) =>
          window.__bubbles
            .filter((entry) => !entry.demo)
            .at(-1)
            .game.cards.has(floor),
        THIRD,
      )
      await reopenCabinet(page, fixture, { slug: SLUG })
    }
    assertKept(await stored(page), wingSix, label)
    const back = await continueClimb(page, {
      ...wingSix,
      cards: [20, 40, THIRD],
    })
    assert.equal(back.level, 51)
    assert.deepEqual(back.save.cards, [20, 40, THIRD])
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(`wing 6, third card ${label}, Continue`)
  }

  // 3. A wing 5 checkpoint: the climb reaches wing 6 (its save is written), the third card is taken,
  //    and the players leave mid-pantry. Continue picks up at wing 6 with all three cards.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(wingFive),
    })
    await continueClimb(page, wingFive)
    await page.evaluate(() =>
      window.__bubbles
        .filter((entry) => !entry.demo)
        .at(-1)
        .game.startFloor(51),
    )
    await page.waitForFunction(() => {
      const saves = JSON.parse(localStorage.getItem('kr-arcade-saves'))
      return saves['bumper-bubbles'].wing === 6
    })
    await stageThirdPantry(page)
    await page.evaluate(() => {
      const game = window.__bubbles.filter((entry) => !entry.demo).at(-1).game
      game.robots[0].x = game.recipe.x
      game.robots[0].y = game.recipe.y
      game.robots[0].vy = 0
    })
    await page.waitForFunction(
      (floor) =>
        window.__bubbles
          .filter((entry) => !entry.demo)
          .at(-1)
          .game.cards.has(floor),
      THIRD,
    )
    assert.equal((await bubbles(page)).pantry, true, 'still in the pantry')
    await reopenCabinet(page, fixture, { slug: SLUG })
    const all = await stored(page)
    assertKept(all, wingFive, 'wing 5 -> 6')
    const back = await continueClimb(page, {
      ...all[SLUG],
      cards: [20, 40, THIRD],
    })
    assert.equal(back.level, 51, 'Continue resumes at wing 6')
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(
      'wing 5 checkpoint, climb into wing 6, third card mid-pantry, Continue',
    )
  }
} finally {
  await browser.close()
}
console.log(`bumper bubbles saves cabinet: ok (${summary.join('; ')})`)

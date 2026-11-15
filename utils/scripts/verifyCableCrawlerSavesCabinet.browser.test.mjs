import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-153: Cable Crawler's earned spare cables, golden bytes and Workbench kit through
// the actual cabinet's save keeping and retirement and the real arcade store. Staged Workbench saves are
// seeded in localStorage (after RAM Rows with 9 cables; after the Cooling Fan with 98). Through the
// cabinet: the Odyssey is picked, Continue (A, then Start after a reload) returns to the Workbench, an
// extra cable past the nine-cable purchase limit is refused without spending copper or touching earned
// cables, another part is bought, and the players leave at once and reload. Spares are then earned by
// the game's own score award (staged score values), one cable is lost to an emptied battery and earned
// back at the 99 ceiling, and a later component checkpoint is reloaded. Synthetic keyboard input in
// headless Chromium, network and achievements stubbed: not human 50-60 minute pacing or device evidence.

const SLUG = 'cable-crawler'
const SAVES_KEY = 'kr-arcade-saves'
const CABLE = 1
const INSULATION = 3
const COLOUR = 4
const bytes = ['ps-1', 'ps-3', 'ram-1']

const atBench = (comp, lives, kit) => ({
  v: 1,
  comp,
  score: 180_000,
  lives,
  continued: false,
  bytes,
  medals: [],
  reached: comp + 1,
  copper: 30,
  reach: 1,
  insulation: 1,
  colour: 0,
  finder: false,
  bench: true,
  ...kit,
})
const cases = [
  {
    name: '9 cables, 9 -> 10',
    save: atBench(2, 9),
    buy: { at: INSULATION, cost: 5, field: 'insulation', to: 2 },
    earnTo: [10],
  },
  {
    name: '98 cables, 98 -> 99, loss, back to 99',
    save: atBench(3, 98, { colour: 1 }),
    buy: { at: COLOUR, cost: 3, field: 'colour', to: 2 },
    earnTo: [99, 99],
    loss: true,
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

/** The newest real (non-demo) Cable Crawler game the cabinet created, as plain data. */
function crawler(page) {
  return page.evaluate(() => {
    const game = (window.__crawlers ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      menu: Boolean(game.menu),
      offer: Boolean(game.offer),
      bench: game.bench
        ? { cursor: game.bench.cursor, note: game.bench.note }
        : null,
      comp: game.compIndex,
      score: game.score,
      lives: game.lives,
      copper: game.copper,
      reach: game.reachBonus,
      insulation: game.insulation,
      colour: game.colour,
      bytes: [...game.bytes].sort(),
      over: game.over,
    }
  })
}

function stored(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}')['cable-crawler'],
    SAVES_KEY,
  )
}

/** Run the game's own code on the newest real game (explicit staging). */
function onGame(page, fn, arg) {
  return page.evaluate(
    ({ source, arg }) => {
      const game = window.__crawlers.filter((entry) => !entry.demo).at(-1).game
      return new Function('game', 'arg', `return (${source})(game, arg)`)(
        game,
        arg,
      )
    },
    { source: fn.toString(), arg },
  )
}

async function tapKey(page, key) {
  await page.keyboard.down(key)
  await wait(70)
  await page.keyboard.up(key)
  await wait(90)
}

/** Enter on the title, A for the Odyssey, then Continue with `key` (Space is A, Enter is Start). */
async function continueRun(page, key) {
  const before = await page.evaluate(
    () => (window.__crawlers ?? []).filter((entry) => !entry.demo).length,
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) => (window.__crawlers ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(150)
  assert.equal((await crawler(page)).menu, true, 'the mode select first')
  await tapKey(page, 'Space')
  let state = await crawler(page)
  assert.equal(state.menu, false, 'the Odyssey')
  assert.equal(state.offer, true, 'a later save is offered')
  await tapKey(page, key)
  state = await crawler(page)
  assert.equal(state.offer, false, `Continue with ${key}`)
  return state
}

const sameKit = (state, save, label) => {
  assert.equal(state.copper, save.copper, `${label}: copper`)
  assert.equal(state.reach, save.reach, `${label}: long surge`)
  assert.equal(state.insulation, save.insulation, `${label}: insulation`)
  assert.equal(state.colour, save.colour, `${label}: colour`)
  assert.deepEqual(state.bytes, [...save.bytes].sort(), `${label}: bytes`)
}

/** The game's own score award, with the score staged one point short of the next spare. */
function award(page) {
  return onGame(page, (game) => {
    game.score = game.nextExtra - 1
    game.addScore(1, 0, 0, false)
    return game.lives
  })
}

const summary = []
try {
  for (const c of cases) {
    const { save } = c
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(save),
    })

    // Continue (A): back at the real Workbench with the earned cables and the kit.
    let state = await continueRun(page, 'Space')
    assert.ok(state.bench, `${c.name}: at the Workbench`)
    assert.equal(state.comp, save.comp - 1)
    assert.equal(state.lives, save.lives, `${c.name}: earned cables`)
    assert.equal(state.score, save.score)
    sameKit(state, save, `${c.name}, Continue`)
    await wait(400)

    // An extra cable is past the nine-cable purchase limit: refused, nothing spent or lost.
    await tapKey(page, 'ArrowDown')
    assert.equal((await crawler(page)).bench.cursor, CABLE)
    await tapKey(page, 'Space')
    state = await crawler(page)
    assert.equal(state.bench.note, 'CABLES FULL', `${c.name}: refused`)
    assert.equal(state.copper, save.copper, `${c.name}: no copper spent`)
    assert.equal(state.lives, save.lives, `${c.name}: earned cables kept`)

    // Another part is bought, and the players leave at once.
    for (let i = CABLE; i < c.buy.at; i++) await tapKey(page, 'ArrowDown')
    await tapKey(page, 'Space')
    state = await crawler(page)
    assert.equal(state[c.buy.field], c.buy.to, `${c.name}: bought`)
    assert.equal(state.copper, save.copper - c.buy.cost)
    assert.equal(state.lives, save.lives)
    await reopenCabinet(page, fixture, { slug: SLUG })
    const bought = {
      ...save,
      copper: save.copper - c.buy.cost,
      [c.buy.field]: c.buy.to,
    }
    let kept = await stored(page)
    assert.equal(kept.bench, true, `${c.name}: kept at the Workbench`)
    assert.equal(kept.comp, save.comp)
    assert.equal(kept.lives, save.lives, `${c.name}: stored cables`)
    sameKit(
      { ...kept, reach: kept.reach, bytes: [...kept.bytes].sort() },
      bought,
      `${c.name}, stored after the purchase`,
    )

    // Continue (Start) after the reload: the same Workbench and kit; B goes back to work.
    state = await continueRun(page, 'Enter')
    assert.ok(state.bench, `${c.name}: Workbench again`)
    assert.equal(state.lives, save.lives)
    sameKit(state, bought, `${c.name}, Start Continue`)
    await wait(400)
    await tapKey(page, 'KeyX')
    state = await crawler(page)
    assert.equal(state.bench, null, `${c.name}: B leaves the Workbench`)
    assert.equal(state.comp, save.comp, 'into the next component')
    kept = await stored(page)
    assert.deepEqual(
      [kept.comp, kept.bench, kept.lives],
      [save.comp, false, save.lives],
      `${c.name}: the component checkpoint`,
    )

    // Spares earned by score: past the purchase limit, and never past 99.
    for (const to of c.earnTo)
      assert.equal(await award(page), to, `earned to ${to}`)
    if (c.loss) {
      // A real loss: the battery runs dry in play, then the spare is earned back at the ceiling.
      await onGame(page, (game) => {
        game.cardTicks = 0
        game.battery = 0
      })
      await page.waitForFunction(
        () =>
          window.__crawlers.filter((entry) => !entry.demo).at(-1).game.lives ===
          98,
      )
      assert.equal(await award(page), 99, 'earned back to 99')
      assert.equal(await award(page), 99, 'and no further')
    }
    const top = c.earnTo.at(-1)
    // A later component is reached (staged): its checkpoint keeps the earned spares.
    await onGame(page, (game, comp) => game.beginComponent(comp), save.comp + 1)
    await reopenCabinet(page, fixture, { slug: SLUG })
    kept = await stored(page)
    assert.deepEqual(
      [kept.comp, kept.bench, kept.lives],
      [save.comp + 1, false, top],
      `${c.name}: later checkpoint stored`,
    )
    assert.deepEqual([...kept.bytes].sort(), [...bytes].sort(), 'bytes kept')
    state = await continueRun(page, 'Space')
    assert.equal(state.comp, save.comp + 1, `${c.name}: later component`)
    assert.equal(state.lives, top, `${c.name}: ${top} cables back`)
    assert.equal(state.over, false)
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(c.name)
  }
} finally {
  await browser.close()
}
console.log(
  `cable crawler saves cabinet: ok (${summary.join('; ')}; Workbench refuse/buy/leave/reload, A and Start Continue)`,
)

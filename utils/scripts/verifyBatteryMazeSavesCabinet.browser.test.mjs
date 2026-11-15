import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-148: Battery Maze's saved-entry eligibility through the actual cabinet and the
// real arcade store. Explicitly staged saves are seeded in localStorage; the store loads them, the
// cabinet seats 1-4 players with its own controls (B on the title screen, the seat switch), hands the
// store's save to the game as `resume`, and keeps the game's save back in the store; leaving unmounts
// the app and a fresh cabinet reads localStorage again. Synthetic keyboard and touch in headless
// Chromium with the network and achievements stubbed: not deployment, device or human-pacing evidence.

const SLUG = 'battery-maze'
const SAVES_KEY = 'kr-arcade-saves'
const SWITCH = 'button[title="Same-device co-op: adjust seats here"]'
/** CAMPAIGN step index of the Toaster Tower title card (checked below by the board it resumes on). */
const TOASTER_CARD = 5
const COOP_LIVES = 6
const TAG_LIVES = 3

const medals = { 'cozy:0': 7, 'cozy:1': 1, 'toaster:0': 3 }
const campaign = {
  v: 1,
  step: TOASTER_CARD,
  lap: 0,
  level: 4,
  score: 1234,
  lives: 2,
  bolts: 7,
  flipBonus: 0,
  startMagnet: false,
  hint: false,
  golden: ['cozy'],
  continued: false,
  overclocked: false,
  medals,
  rushBest: 900,
  coop: false,
}
const overclocked = {
  ...campaign,
  step: 0,
  lap: 1,
  level: 30,
  score: 50_000,
  lives: 3,
  golden: ['cozy', 'toaster'],
  overclocked: true,
}
const coop = { ...campaign, lives: COOP_LIVES, coop: true }
const seed = (save) => ({
  [SAVES_KEY]: { [SLUG]: save, 'another-game': { v: 9 } },
})

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.BATTERY_MAZE_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

/** The newest real (non-demo) Battery Maze game the cabinet created, as plain data. */
function maze(page) {
  return page.evaluate(() => {
    const game = (window.__batteries ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      offer: Boolean(game.offer),
      menu: game.menu ? { cursor: game.menu.cursor } : null,
      mode: game.mode,
      lap: game.lap,
      board: game.board.id,
      score: game.score,
      lives: game.lives,
      bolts: game.bolts,
      golden: [...game.golden],
      medals: { ...game.medals },
      robots: game.robots.length,
      pause: game.pause,
      gremlins: game.gremlins
        .filter((g) => g.seat)
        .map((g) => ({ seat: g.seat, want: g.want })),
    }
  })
}

/** What the real store has written to localStorage. */
function stored(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SAVES_KEY,
  )
}

/** How many games the cabinet has created so far, to wait for the next one. */
const created = (page) =>
  page.evaluate(
    () => (window.__batteries ?? []).filter((entry) => !entry.demo).length,
  )

/** Start from the title (Enter, or a tap on a touch screen) and wait out the menu's opening beat. */
async function start(page, touch = false) {
  const before = await created(page)
  if (touch) await pointer(page, '.cabinet-canvas', 'pointerdown', 9)
  else await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) => (window.__batteries ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(400)
  return maze(page)
}

async function tapKey(page, key) {
  await page.keyboard.down(key)
  await wait(70)
  await page.keyboard.up(key)
  await wait(90)
}

function pointer(page, selector, type, pointerId, fx = 0.5, fy = 0.5) {
  return page.evaluate(
    ({ selector, type, pointerId, fx, fy }) => {
      const el = document.querySelector(selector)
      if (!el) throw new Error(`no ${selector}`)
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          isPrimary: pointerId === 1,
          clientX: rect.left + rect.width * fx,
          clientY: rect.top + rect.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { selector, type, pointerId, fx, fy },
  )
}

async function tapControl(page, selector, pointerId) {
  await pointer(page, selector, 'pointerdown', pointerId)
  await wait(80)
  await pointer(page, selector, 'pointerup', pointerId)
  await wait(90)
}

/** Click the cabinet's seat switch until it shows `count`. */
async function seatTo(page, count) {
  for (let i = 0; i < 4; i++) {
    const label = await page.textContent(SWITCH)
    if (new RegExp(`\\b${count} players?\\b`, 'i').test(label)) return
    await page.click(SWITCH)
  }
  assert.fail(`the seat switch never reached ${count}`)
}

/** The resumed campaign carries the staged checkpoint's run and keepings. */
function assertCampaign(state, label) {
  assert.equal(state.offer, false, `${label}: the offer is taken`)
  assert.equal(state.mode, 'campaign', label)
  assert.equal(state.board, 'toaster', `${label}: back on the saved board`)
  assert.equal(state.score, campaign.score, `${label}: score`)
  assert.equal(state.bolts, campaign.bolts, `${label}: bolts`)
  assert.deepEqual(state.golden, campaign.golden, `${label}: golden bolts`)
  assert.deepEqual(state.medals, medals, `${label}: medals`)
}

/** The store still holds the campaign checkpoint and its keepings (and other games' saves). */
async function assertStoredCheckpoint(page, label) {
  const all = await stored(page)
  assert.deepEqual(all['another-game'], { v: 9 }, `${label}: other saves kept`)
  const save = all[SLUG]
  assert.equal(save?.step, TOASTER_CARD, `${label}: checkpoint step`)
  assert.equal(save.lap, 0)
  assert.equal(save.score, campaign.score, `${label}: checkpoint score`)
  assert.deepEqual(save.golden, campaign.golden, `${label}: golden bolts`)
  assert.deepEqual(save.medals, medals, `${label}: medals`)
  assert.equal(save.rushBest, campaign.rushBest, `${label}: Rush Hour best`)
}

const summary = []
try {
  // 1. Desktop keyboard: a campaign checkpoint continues solo (A), then for two robots after
  //    B on the title screen seats a second player.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(campaign),
    })
    let state = await start(page)
    assert.equal(state.offer, true, 'a saved run is offered first')
    assert.equal(state.menu, null)
    await tapKey(page, 'Space')
    state = await maze(page)
    assertCampaign(state, 'solo continue')
    assert.equal(state.robots, 1)
    assert.equal(state.lives, campaign.lives, 'solo keeps its lives')
    await assertStoredCheckpoint(page, 'after the solo continue')

    await reopenCabinet(page, fixture, { slug: SLUG })
    await tapKey(page, 'KeyX')
    assert.match(await page.textContent(SWITCH), /2 players/i, 'B seats two')
    state = await start(page)
    assert.equal(state.offer, true, 'two seated still get the offer')
    await tapKey(page, 'KeyF')
    state = await maze(page)
    assertCampaign(state, 'two-robot continue')
    assert.equal(state.robots, 2, 'two robots')
    assert.equal(state.lives, 2, 'at least two lives for two robots')
    const save = (await stored(page))[SLUG]
    assert.equal(save.coop, true, 'the store now holds a co-op checkpoint')
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('campaign checkpoint: solo and two-robot continue')
  }

  // 2. Desktop keyboard: a step-0 Overclocked checkpoint. B on the offer opens the menu, where
  //    Overclocked is eligible; picking it saves a fresh Overclocked run, which is offered next time.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(overclocked),
    })
    let state = await start(page)
    assert.equal(state.offer, true, 'a step-0 save on a later lap is offered')
    await tapKey(page, 'KeyX')
    state = await maze(page)
    assert.equal(state.offer, false)
    assert.ok(state.menu, 'B on the offer opens the menu')
    await wait(300)
    await tapKey(page, 'ArrowDown')
    assert.equal((await maze(page)).menu?.cursor, 1, 'Overclocked is listed')
    await tapKey(page, 'Enter')
    state = await maze(page)
    assert.equal(state.mode, 'overclocked', 'Start picks Overclocked')
    assert.equal(state.lap, 1, 'the grid runs hot')
    assert.deepEqual(state.golden, overclocked.golden, 'golden bolts kept')
    assert.deepEqual(state.medals, medals, 'medals kept')
    let save = (await stored(page))[SLUG]
    assert.deepEqual([save.step, save.lap, save.overclocked], [0, 1, true])

    await reopenCabinet(page, fixture, { slug: SLUG })
    state = await start(page)
    assert.equal(state.offer, true, 'the Overclocked checkpoint is offered')
    await tapKey(page, 'Space')
    state = await maze(page)
    assert.equal(state.mode, 'overclocked', 'Continue resumes Overclocked')
    assert.equal(state.lap, 1)
    assert.deepEqual(state.golden, overclocked.golden)
    save = (await stored(page))[SLUG]
    assert.deepEqual(save.golden, overclocked.golden)
    assert.deepEqual(save.medals, medals)
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('step-0 Overclocked: menu pick and continue')
  }

  // 3. Desktop keyboard: a co-op checkpoint's pool of six continues for two, and a solo
  //    continue of the same checkpoint gets a solo pool.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      storage: seed(coop),
    })
    await tapKey(page, 'KeyX')
    assert.match(await page.textContent(SWITCH), /2 players/i)
    let state = await start(page)
    await tapKey(page, 'KeyF')
    state = await maze(page)
    assert.equal(state.robots, 2)
    assert.equal(state.lives, COOP_LIVES, 'two robots keep the pool of six')
    assert.equal((await stored(page))[SLUG].lives, COOP_LIVES)

    await reopenCabinet(page, fixture, { slug: SLUG })
    assert.match(await page.textContent(SWITCH), /2 players/i, 'seats kept')
    await tapKey(page, 'KeyX')
    assert.match(await page.textContent(SWITCH), /1 player/i, 'B back to one')
    state = await start(page)
    assert.equal(state.offer, true)
    await tapKey(page, 'Space')
    state = await maze(page)
    assertCampaign(state, 'co-op checkpoint, solo continue')
    assert.equal(state.robots, 1)
    assert.equal(state.lives, 3, 'one robot: the co-op pool shrinks to three')
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('co-op pool: six for two, three solo')
  }

  // 4. Tablet touch, three then four seats: Tag only, gremlin roles on seats 2-4, and the campaign
  //    checkpoint, golden bolts and medals untouched when the players leave Tag and come back solo.
  {
    const width = 1024
    const height = 768
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width,
      height,
      touch: true,
      storage: seed(campaign),
    })
    for (const seats of [3, 4]) {
      if (seats === 4) await reopenCabinet(page, fixture, { slug: SLUG })
      await seatTo(page, seats)
      let state = await start(page, true)
      assert.equal(state.offer, false, `${seats} seated: no campaign offer`)
      assert.ok(state.menu, `${seats} seated: the menu`)
      await page.waitForFunction(
        (n) =>
          document.querySelectorAll('.cabinet-overlay .cabinet-dpad').length ===
          n,
        seats,
      )
      await tapControl(page, '.cabinet-cluster-1 .cabinet-ball-a', 2)
      state = await maze(page)
      assert.equal(state.mode, 'tag', `${seats} seated: Tag is the mode`)
      assert.equal(state.robots, 1, 'one robot')
      assert.equal(state.lives, TAG_LIVES)
      assert.deepEqual(
        state.gremlins.map((g) => g.seat),
        Array.from({ length: seats - 1 }, (_, i) => i + 1),
        'the other seats are gremlins',
      )
      await page.waitForFunction(
        () =>
          window.__batteries.filter((entry) => !entry.demo).at(-1).game
            .pause === 0,
      )
      const pushes = [
        [0.5, 0.08, { x: 0, y: -1 }],
        [0.92, 0.5, { x: 1, y: 0 }],
        [0.08, 0.5, { x: -1, y: 0 }],
      ].slice(0, seats - 1)
      for (const [i, [fx, fy]] of pushes.entries())
        await pointer(
          page,
          `.cabinet-cluster-${i + 2} .cabinet-dpad`,
          'pointerdown',
          21 + i,
          fx,
          fy,
        )
      await wait(150)
      state = await maze(page)
      for (const [i, [fx, fy, want]] of pushes.entries()) {
        await pointer(
          page,
          `.cabinet-cluster-${i + 2} .cabinet-dpad`,
          'pointerup',
          21 + i,
          fx,
          fy,
        )
        assert.deepEqual(
          state.gremlins.find((g) => g.seat === i + 1)?.want,
          want,
          `seat ${i + 2} steers its own gremlin`,
        )
      }
      if (shots && seats === 4)
        await page.screenshot({ path: path.join(shots, 'tag-4p-tablet.png') })
      await assertStoredCheckpoint(page, `during ${seats}-seat Tag`)
    }

    await reopenCabinet(page, fixture, { slug: SLUG })
    await assertStoredCheckpoint(page, 'after leaving Tag')
    await seatTo(page, 1)
    let state = await start(page, true)
    assert.equal(state.offer, true, 'back to one: the checkpoint is offered')
    await tapControl(page, '.cabinet-cluster-1 .cabinet-ball-a', 2)
    state = await maze(page)
    assertCampaign(state, 'continue after Tag')
    assert.equal(state.lives, campaign.lives)
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('3P/4P Tag roles; checkpoint, bolts and medals kept after Tag')
  }
} finally {
  await browser.close()
}
console.log(`battery maze saves cabinet: ok (${summary.join('; ')})`)
